# Chat Import Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can upload TXT/CSV/JSON chat records, which are parsed, deduplicated, saved to the database, and analyzed by AI.

**Architecture:** Client Component page at `/import` with file upload UI. Server Action handles parsing → validation → dedup → DB write → AI analysis. Three format parsers (TXT/CSV/JSON) produce a unified `ParsedMessage[]` array. Sidebar gets a new "导入" nav item with `Upload` icon.

**Tech Stack:** Next.js 14 App Router, Server Actions, Prisma 7 + PrismaPg adapter, Zod, TypeScript, Tailwind CSS, lucide-react

---

### Task 1: Zod Schemas and TypeScript Types

**Files:**
- Create: `src/lib/import/schemas.ts`

- [ ] **Step 1: Create the import schemas file**

```typescript
// src/lib/import/schemas.ts
import { z } from 'zod'

export const parsedMessageSchema = z.object({
  senderName: z.string().min(1, '发送者不能为空'),
  content: z.string().min(1, '消息内容不能为空'),
  sentAt: z.string().min(1, '发送时间不能为空'),
  messageType: z.string().default('text'),
})

export type ParsedMessage = z.infer<typeof parsedMessageSchema>

export const importInputSchema = z.object({
  fileContent: z.string().min(1, '文件内容不能为空'),
  format: z.enum(['txt', 'csv', 'json']),
  groupId: z.string().optional(),
  newGroupName: z.string().optional(),
}).refine(
  (data) => data.groupId || data.newGroupName,
  { message: '必须选择已有社群或输入新社群名称' },
)

export type ImportInput = z.infer<typeof importInputSchema>

export interface ImportStats {
  total: number
  imported: number
  skipped: number
  failed: number
  analyzed: number
  analyzeFailed: number
}

export interface ImportResult {
  success: boolean
  stats: ImportStats
  groupId: string
  groupName: string
  errors: string[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/import/schemas.ts
git commit -m "feat(import): add Zod schemas and types for chat import"
```

---

### Task 2: File Parsers (TXT, CSV, JSON)

**Files:**
- Create: `src/lib/import/parsers.ts`

- [ ] **Step 1: Create the parsers file**

```typescript
// src/lib/import/parsers.ts
import { parsedMessageSchema, type ParsedMessage } from './schemas'

export function parseTxt(text: string): { messages: ParsedMessage[]; errors: string[] } {
  const lines = text.split('\n').filter((line) => line.trim())
  const messages: ParsedMessage[] = []
  const errors: string[] = []

  // Format: [2026-05-23 09:56] 张三：消息内容
  // Also support：(fullwidth colon) and : (halfwidth colon)
  const regex = /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\]\s+(.+?)[：:](.+)$/

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(regex)
    if (!match) {
      errors.push(`第 ${i + 1} 行格式无法解析: "${lines[i].trim().slice(0, 50)}"`)
      continue
    }

    const [, dateStr, senderName, content] = match
    // Convert "2026-05-23 09:56" to ISO format
    const sentAt = dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}:00+08:00`

    const result = parsedMessageSchema.safeParse({
      senderName: senderName.trim(),
      content: content.trim(),
      sentAt,
      messageType: 'text',
    })

    if (result.success) {
      messages.push(result.data)
    } else {
      errors.push(`第 ${i + 1} 行校验失败: ${result.error.issues[0]?.message}`)
    }
  }

  return { messages, errors }
}

export function parseCsv(text: string): { messages: ParsedMessage[]; errors: string[] } {
  const lines = text.split('\n').filter((line) => line.trim())
  const messages: ParsedMessage[] = []
  const errors: string[] = []

  if (lines.length === 0) {
    return { messages, errors: ['CSV 文件为空'] }
  }

  // Check header
  const header = lines[0].toLowerCase().trim()
  const hasHeader = header.includes('sendername') || header.includes('content') || header.includes('sentat')
  const dataLines = hasHeader ? lines.slice(1) : lines

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = hasHeader ? i + 2 : i + 1
    const line = dataLines[i].trim()
    if (!line) continue

    // Simple CSV parsing (no quoted fields with commas inside)
    const fields = line.split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))

    if (fields.length < 3) {
      errors.push(`第 ${lineNum} 行字段数不足（需要至少 3 个字段）`)
      continue
    }

    // Fields order: senderName, content, sentAt, messageType (optional)
    const result = parsedMessageSchema.safeParse({
      senderName: fields[0],
      content: fields[1],
      sentAt: fields[2],
      messageType: fields[3] || 'text',
    })

    if (result.success) {
      messages.push(result.data)
    } else {
      errors.push(`第 ${lineNum} 行校验失败: ${result.error.issues[0]?.message}`)
    }
  }

  return { messages, errors }
}

export function parseJson(text: string): { messages: ParsedMessage[]; errors: string[] } {
  const messages: ParsedMessage[] = []
  const errors: string[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { messages, errors: ['JSON 格式解析失败，请检查文件格式'] }
  }

  if (!Array.isArray(parsed)) {
    return { messages, errors: ['JSON 文件应为数组格式'] }
  }

  for (let i = 0; i < parsed.length; i++) {
    const result = parsedMessageSchema.safeParse(parsed[i])
    if (result.success) {
      messages.push(result.data)
    } else {
      errors.push(`第 ${i + 1} 条记录校验失败: ${result.error.issues[0]?.message}`)
    }
  }

  return { messages, errors }
}

export function parseFile(
  content: string,
  format: 'txt' | 'csv' | 'json',
): { messages: ParsedMessage[]; errors: string[] } {
  switch (format) {
    case 'txt':
      return parseTxt(content)
    case 'csv':
      return parseCsv(content)
    case 'json':
      return parseJson(content)
    default:
      return { messages: [], errors: [`不支持的文件格式: ${format}`] }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/import/parsers.ts
git commit -m "feat(import): add TXT/CSV/JSON file parsers"
```

---

### Task 3: Server Action — importChatRecords

**Files:**
- Create: `src/app/import/actions.ts`

**Dependencies:** Task 1 (schemas), Task 2 (parsers)

- [ ] **Step 1: Create the server action file**

```typescript
// src/app/import/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { analyzeMessage } from '@/lib/ai/analyze-message'
import { parseFile } from '@/lib/import/parsers'
import {
  importInputSchema,
  type ImportResult,
  type ImportStats,
  type ParsedMessage,
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

  // Get or create default workspace
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
  // Validate input
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

  // Parse file
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

  // Get or create group
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

  // Process messages one by one
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    try {
      const sentAt = new Date(msg.sentAt)

      // Dedup check
      const duplicate = await isDuplicate(group.id, msg.senderName, msg.content, sentAt)
      if (duplicate) {
        stats.skipped++
        continue
      }

      // Get or create member
      const senderId = await getOrCreateMember(group.id, msg.senderName)

      // Create message
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

      // AI analysis (sync, non-blocking on failure)
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

  // Update group member count
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/import/actions.ts
git commit -m "feat(import): add server action for chat record import with dedup and AI analysis"
```

---

### Task 4: Import Page UI (Client Component)

**Files:**
- Create: `src/app/import/page.tsx`

**Dependencies:** Task 3 (server action)

- [ ] **Step 1: Create the import page**

```tsx
// src/app/import/page.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { importChatRecords, getGroups } from './actions'
import type { ImportResult } from '@/lib/import/schemas'

type FileFormat = 'txt' | 'csv' | 'json'

function detectFormat(filename: string): FileFormat {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  if (ext === 'json') return 'json'
  return 'txt'
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<FileFormat>('txt')
  const [groupMode, setGroupMode] = useState<'existing' | 'new'>('new')
  const [groupId, setGroupId] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [groups, setGroups] = useState<{ id: string; name: string; platform: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getGroups().then(setGroups).catch(() => {})
  }, [])

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setFormat(detectFormat(f.name))
    setResult(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    try {
      const fileContent = await file.text()
      const res = await importChatRecords({
        fileContent,
        format,
        groupId: groupMode === 'existing' ? groupId : undefined,
        newGroupName: groupMode === 'new' ? newGroupName : undefined,
      })
      setResult(res)
    } catch {
      setResult({
        success: false,
        stats: { total: 0, imported: 0, skipped: 0, failed: 0, analyzed: 0, analyzeFailed: 0 },
        groupId: '',
        groupName: '',
        errors: ['导入请求失败，请检查网络连接'],
      })
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = file && (groupMode === 'new' ? newGroupName.trim() : groupId) && !loading

  return (
    <div className="min-h-screen bg-[#060b14] text-[#e2e8f0]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <a href="/" className="text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-text-primary">导入聊天记录</h1>
            <p className="text-text-muted text-sm mt-0.5">
              支持 TXT、CSV、JSON 格式，导入后自动触发 AI 分析
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-card-bg rounded-lg border border-border-line p-5 mb-4">
          <label className="text-sm font-medium text-text-secondary mb-3 block">选择文件</label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : file
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border-line hover:border-text-muted'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.csv,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-text-primary text-sm">{file.name}</span>
                <span className="text-text-muted text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm">拖拽文件到此处，或点击选择</p>
                <p className="text-text-label text-xs mt-1">支持 .txt .csv .json</p>
              </div>
            )}
          </div>
        </div>

        {/* Format + Group */}
        <div className="bg-card-bg rounded-lg border border-border-line p-5 mb-4 flex flex-col gap-4">
          {/* Format */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">文件格式</label>
            <div className="flex gap-2">
              {(['txt', 'csv', 'json'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                    format === f
                      ? 'bg-primary text-[#060b14]'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">目标社群</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setGroupMode('new')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  groupMode === 'new'
                    ? 'bg-primary text-[#060b14]'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                新建社群
              </button>
              <button
                onClick={() => setGroupMode('existing')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  groupMode === 'existing'
                    ? 'bg-primary text-[#060b14]'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                选择已有
              </button>
            </div>
            {groupMode === 'new' ? (
              <input
                type="text"
                placeholder="输入新社群名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-[#0a1628] border border-border-line rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
              />
            ) : (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-[#0a1628] border border-border-line rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">选择社群...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.platform})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            canSubmit
              ? 'bg-primary text-[#060b14] hover:bg-primary/90'
              : 'bg-white/5 text-text-muted cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              导入中...
            </span>
          ) : (
            '开始导入'
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`mt-4 rounded-lg border p-5 ${
            result.success
              ? 'bg-emerald-950/30 border-emerald-800/50'
              : 'bg-red-950/30 border-red-800/50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="font-semibold text-sm">
                {result.success ? '导入完成' : '导入失败'}
              </span>
              {result.groupName && (
                <span className="text-text-muted text-xs">→ {result.groupName}</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: '总消息数', value: result.stats.total, color: 'text-text-primary' },
                { label: '成功导入', value: result.stats.imported, color: 'text-emerald-400' },
                { label: '重复跳过', value: result.stats.skipped, color: 'text-yellow-400' },
                { label: '解析失败', value: result.stats.failed, color: 'text-red-400' },
                { label: 'AI 分析成功', value: result.stats.analyzed, color: 'text-primary' },
                { label: 'AI 分析失败', value: result.stats.analyzeFailed, color: 'text-orange-400' },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded p-2.5 text-center">
                  <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-text-muted text-[10px]">{item.label}</div>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="bg-black/20 rounded p-3 max-h-32 overflow-y-auto">
                <div className="text-text-muted text-[10px] mb-1">错误详情：</div>
                {result.errors.map((err, i) => (
                  <div key={i} className="text-red-300 text-xs">{err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Format Help */}
        <div className="mt-6 bg-card-bg rounded-lg border border-border-line p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-3">格式说明</h3>
          <div className="flex flex-col gap-3 text-xs text-text-muted">
            <div>
              <span className="text-primary font-medium">TXT：</span>
              <code className="bg-black/30 px-1.5 py-0.5 rounded ml-1">
                [2026-05-23 09:56] 张三：消息内容
              </code>
            </div>
            <div>
              <span className="text-primary font-medium">CSV：</span>
              <code className="bg-black/30 px-1.5 py-0.5 rounded ml-1">
                senderName,content,sentAt,messageType
              </code>
            </div>
            <div>
              <span className="text-primary font-medium">JSON：</span>
              <code className="bg-black/30 px-1.5 py-0.5 rounded ml-1">
                {'[{"senderName":"...", "content":"...", "sentAt":"..."}]'}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/import/page.tsx
git commit -m "feat(import): add /import page with file upload UI"
```

---

### Task 5: Sidebar Navigation Update

**Files:**
- Modify: `src/data/mock.ts` (add nav item)
- Modify: `src/components/layout/sidebar.tsx` (add Upload icon, add link behavior)

- [ ] **Step 1: Add "导入" nav item to mock data**

In `src/data/mock.ts`, add after the last nav item in `mockNavItems`:

```typescript
// Add this entry to the end of the mockNavItems array:
  { id: "import", icon: "Upload", label: "导入", badge: "New", badgeColor: "bg-[#f59e0b] text-[#060b14]" },
```

- [ ] **Step 2: Add Upload icon to sidebar icon map**

In `src/components/layout/sidebar.tsx`, add `Upload` to the lucide-react import and to the `iconMap` object:

Import change — add `Upload` to the import list:
```typescript
import {
  LayoutDashboard,
  Radio,
  Radar,
  Link,
  ClipboardList,
  Star,
  FolderOpen,
  Settings,
  Upload,
} from "lucide-react";
```

Add to iconMap:
```typescript
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Radio,
  Radar,
  Link,
  ClipboardList,
  Star,
  FolderOpen,
  Upload,
};
```

- [ ] **Step 3: Make nav items clickable with links**

In `src/components/layout/sidebar.tsx`, wrap each nav item with an `<a>` tag. Replace the `<div key={item.id}` block inside the `mockNavItems.map()` with:

```tsx
              <a
                key={item.id}
                href={item.id === 'dashboard' ? '/' : item.id === 'import' ? '/import' : '#'}
                className={cn(
                  "flex items-center gap-2 px-2 py-[7px] rounded-md cursor-pointer transition-colors no-underline",
                  item.active
                    ? "bg-primary/10"
                    : "hover:bg-white/5"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      item.active ? "text-text-primary" : "text-text-secondary"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs flex-1",
                    item.active ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
```

- [ ] **Step 4: Commit**

```bash
git add src/data/mock.ts src/components/layout/sidebar.tsx
git commit -m "feat(import): add import nav item to sidebar with Upload icon"
```

---

### Task 6: Build Verification and Manual Test

**Files:** None (verification only)

**Dependencies:** Tasks 1-5

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors. Route `/import` appears in output.

- [ ] **Step 2: Start dev server and test with browser**

```bash
npm run dev
```

Open `http://localhost:3001/import` — verify the page renders with file upload area, format selector, group input.

- [ ] **Step 3: Test with a sample TXT file via curl**

Create a test request. Since Server Actions require form state, test by verifying the page loads and the API works end-to-end in the browser. Alternatively, test the parsers directly:

```bash
npx tsx -e "
const { parseTxt } = require('./src/lib/import/parsers');
const txt = '[2026-05-28 09:56] 张三：这是一条测试消息\n[2026-05-28 10:21] 李四：第二条消息';
const result = parseTxt(txt);
console.log(JSON.stringify(result, null, 2));
"
```

Expected: 2 parsed messages with correct senderName, content, sentAt.

- [ ] **Step 4: Final commit and push**

```bash
git push origin main
```
