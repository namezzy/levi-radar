'use server'

import { prisma } from '@/lib/prisma'
import { analyzeMessage } from '@/lib/ai/analyze-message'
import { parseFile } from '@/lib/import/parsers'
import {
  importInputSchema,
  type ImportResult,
  type ImportStats,
} from '@/lib/import/schemas'

async function getOrCreateGroup(
  groupId?: string,
  newGroupName?: string,
): Promise<{ id: string; name: string }> {
  if (groupId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) throw new Error(`社群不存在: ${groupId}`)
    return { id: group.id, name: group.name }
  }

  if (!newGroupName) throw new Error('必须提供社群 ID 或新社群名称')

  let workspace = await prisma.workspace.findFirst()
  if (!workspace) {
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'admin@levi-radar.local', name: 'Admin' },
      })
    }
    workspace = await prisma.workspace.create({
      data: { name: '默认工作区', ownerId: user.id },
    })
  }

  const group = await prisma.group.create({
    data: {
      name: newGroupName,
      platform: 'manual_import',
      workspaceId: workspace.id,
    },
  })

  return { id: group.id, name: group.name }
}

async function getOrCreateMember(
  groupId: string,
  senderName: string,
): Promise<string> {
  const externalId = `manual_${senderName}`

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_externalId: { groupId, externalId } },
  })

  if (existing) return existing.id

  const member = await prisma.groupMember.create({
    data: {
      name: senderName,
      externalId,
      platform: 'manual_import',
      groupId,
    },
  })

  return member.id
}

async function isDuplicate(
  groupId: string,
  senderName: string,
  content: string,
  sentAt: Date,
): Promise<boolean> {
  const existing = await prisma.message.findFirst({
    where: {
      groupId,
      content,
      sentAt,
      sender: { name: senderName },
    },
  })
  return !!existing
}

export async function importChatRecords(formData: {
  fileContent: string
  format: 'txt' | 'csv' | 'json'
  groupId?: string
  newGroupName?: string
}): Promise<ImportResult> {
  const validated = importInputSchema.safeParse(formData)
  if (!validated.success) {
    return {
      success: false,
      stats: { total: 0, imported: 0, skipped: 0, failed: 0, analyzed: 0, analyzeFailed: 0 },
      groupId: '',
      groupName: '',
      errors: validated.error.issues.map((i) => i.message),
    }
  }

  const { fileContent, format, groupId, newGroupName } = validated.data

  const { messages, errors: parseErrors } = parseFile(fileContent, format)

  const stats: ImportStats = {
    total: messages.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    analyzed: 0,
    analyzeFailed: 0,
  }

  const errors: string[] = [...parseErrors.slice(0, 5)]

  if (messages.length === 0) {
    return {
      success: false,
      stats,
      groupId: '',
      groupName: '',
      errors: errors.length > 0 ? errors : ['未解析到任何消息'],
    }
  }

  let group: { id: string; name: string }
  try {
    group = await getOrCreateGroup(groupId, newGroupName)
  } catch (error) {
    return {
      success: false,
      stats,
      groupId: '',
      groupName: '',
      errors: [error instanceof Error ? error.message : '社群创建失败'],
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    try {
      const sentAt = new Date(msg.sentAt)

      const duplicate = await isDuplicate(group.id, msg.senderName, msg.content, sentAt)
      if (duplicate) {
        stats.skipped++
        continue
      }

      const senderId = await getOrCreateMember(group.id, msg.senderName)

      const created = await prisma.message.create({
        data: {
          content: msg.content,
          senderId,
          groupId: group.id,
          sentAt,
          messageType: msg.messageType || 'text',
        },
      })

      stats.imported++

      try {
        await analyzeMessage({
          messageId: created.id,
          groupName: group.name,
          senderName: msg.senderName,
          content: msg.content,
          sentAt: msg.sentAt,
        })
        stats.analyzed++
      } catch {
        stats.analyzeFailed++
      }
    } catch (error) {
      stats.failed++
      if (errors.length < 10) {
        errors.push(`第 ${i + 1} 条消息导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  const memberCount = await prisma.groupMember.count({ where: { groupId: group.id } })
  await prisma.group.update({
    where: { id: group.id },
    data: { memberCount },
  })

  return {
    success: stats.imported > 0,
    stats,
    groupId: group.id,
    groupName: group.name,
    errors: errors.length > 0 ? errors : [],
  }
}

export async function getGroups(): Promise<{ id: string; name: string; platform: string }[]> {
  const groups = await prisma.group.findMany({
    select: { id: true, name: true, platform: true },
    orderBy: { name: 'asc' },
  })
  return groups
}
