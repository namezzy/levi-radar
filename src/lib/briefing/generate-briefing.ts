import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { resolveProvider, createOpenAIClient, createAnthropicClient } from '@/lib/ai/providers'
import type { ResolvedProvider } from '@/lib/ai/providers'
import { BRIEFING_SYSTEM_PROMPT, buildBriefingPrompt, type BriefingPromptData } from './prompts'
import { briefingOutputSchema, briefingOutputFallback, type BriefingInput, type BriefingOutput } from './schemas'
import { mockGenerateBriefing } from './mock'

interface GenerateResult {
  data: BriefingOutput
  provider: string
  model: string
  dbSaved: boolean
  dbError?: string
  briefingId?: string
}

function parseJsonFromText(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('No valid JSON found in response')
  }
}

function validateOutput(raw: unknown, date: string): BriefingOutput {
  const result = briefingOutputSchema.safeParse(raw)
  if (result.success) {
    return result.data
  }

  console.warn('Briefing output validation failed, using partial data with defaults:', result.error.issues)
  const partial = raw as Record<string, unknown>
  return {
    ...briefingOutputFallback,
    date,
    title: typeof partial.title === 'string' ? partial.title : briefingOutputFallback.title,
    overview: typeof partial.overview === 'string' ? partial.overview : briefingOutputFallback.overview,
    keySignals: Array.isArray(partial.keySignals) ? partial.keySignals.filter((s): s is BriefingOutput['keySignals'][number] =>
      typeof s === 'object' && s !== null && 'title' in s
    ) : briefingOutputFallback.keySignals,
    actionItems: Array.isArray(partial.actionItems) ? partial.actionItems.filter((a): a is BriefingOutput['actionItems'][number] =>
      typeof a === 'object' && a !== null && 'title' in a
    ) : briefingOutputFallback.actionItems,
    hotTopics: Array.isArray(partial.hotTopics) ? partial.hotTopics.filter((t): t is string => typeof t === 'string') : briefingOutputFallback.hotTopics,
    topSources: Array.isArray(partial.topSources) ? partial.topSources.filter((s): s is BriefingOutput['topSources'][number] =>
      typeof s === 'object' && s !== null && 'groupName' in s
    ) : briefingOutputFallback.topSources,
  }
}

async function queryDayData(date: string, workspaceId: string): Promise<BriefingPromptData> {
  const dayStart = new Date(`${date}T00:00:00+08:00`)
  const dayEnd = new Date(`${date}T23:59:59+08:00`)

  const totalGroups = await prisma.group.count({ where: { workspaceId } })

  const messages = await prisma.message.findMany({
    where: {
      group: { workspaceId },
      sentAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      analysis: true,
      group: { select: { name: true } },
      sender: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  })

  const totalMessages = messages.length

  const highImportanceMessages = messages
    .filter(m => m.analysis && m.analysis.importanceScore >= 70)
    .map(m => ({
      groupName: m.group.name,
      senderName: m.sender?.name || '未知',
      content: m.content,
      summary: m.analysis!.summary || '',
      category: m.analysis!.category,
      importanceScore: m.analysis!.importanceScore,
      tags: m.tags.map(t => t.tag.name),
    }))
    .sort((a, b) => b.importanceScore - a.importanceScore)

  const actionableMessages = messages
    .filter(m => m.analysis && m.analysis.isActionable)
    .map(m => ({
      groupName: m.group.name,
      senderName: m.sender?.name || '未知',
      content: m.content,
      summary: m.analysis!.summary || '',
      category: m.analysis!.category,
      actionScore: m.analysis!.actionScore,
      suggestedAction: m.analysis!.reason || '',
    }))
    .sort((a, b) => b.actionScore - a.actionScore)

  return { date, totalGroups, totalMessages, highImportanceMessages, actionableMessages }
}

async function callAIForBriefing(
  provider: ResolvedProvider,
  promptData: BriefingPromptData,
): Promise<string> {
  const userPrompt = buildBriefingPrompt(promptData)

  if (provider.config.type === 'openai-compatible') {
    const client = createOpenAIClient(provider.config)
    const response = await client.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: BRIEFING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })
    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from AI provider')
    return content
  }

  if (provider.config.type === 'anthropic') {
    const client = createAnthropicClient()
    const response = await client.messages.create({
      model: provider.model,
      max_tokens: 2048,
      system: BRIEFING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Empty response from Anthropic')
    return textBlock.text
  }

  throw new Error('Unsupported provider type')
}

async function saveBriefing(
  date: string,
  workspaceId: string,
  data: BriefingOutput,
): Promise<{ briefingId: string; error?: string }> {
  try {
    const briefingDate = new Date(`${date}T00:00:00+08:00`)

    const existing = await prisma.briefing.findFirst({
      where: { workspaceId, type: 'daily', date: briefingDate },
    })

    if (existing) {
      await prisma.briefing.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          content: data.overview,
          highlights: data as unknown as Prisma.InputJsonValue,
        },
      })
      return { briefingId: existing.id }
    }

    const briefing = await prisma.briefing.create({
      data: {
        type: 'daily',
        title: data.title,
        content: data.overview,
        highlights: data as unknown as Prisma.InputJsonValue,
        date: briefingDate,
        workspaceId,
      },
    })
    return { briefingId: briefing.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
    console.error('Failed to save briefing:', errorMessage)
    return { briefingId: '', error: errorMessage }
  }
}

export async function generateBriefing(input: BriefingInput): Promise<GenerateResult> {
  const promptData = await queryDayData(input.date, input.workspaceId)
  const provider = resolveProvider()

  let data: BriefingOutput

  if (provider.config.type === 'mock') {
    data = mockGenerateBriefing(promptData)
  } else {
    let lastError: Error | null = null
    let responseText = ''

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        responseText = await callAIForBriefing(provider, promptData)
        break
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`Briefing AI call attempt ${attempt + 1} failed:`, lastError.message)
      }
    }

    if (!responseText) {
      if (lastError) {
        console.error('All AI attempts failed, falling back to mock:', lastError.message)
      }
      data = mockGenerateBriefing(promptData)
    } else {
      const parsed = parseJsonFromText(responseText)
      data = validateOutput(parsed, input.date)
    }
  }

  const { briefingId, error: dbError } = await saveBriefing(input.date, input.workspaceId, data)

  return {
    data,
    provider: provider.name,
    model: provider.model || 'mock',
    dbSaved: !dbError,
    dbError,
    briefingId,
  }
}
