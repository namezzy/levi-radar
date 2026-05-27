import { resolveProvider, createOpenAIClient, createAnthropicClient } from './providers'
import type { ResolvedProvider } from './providers'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts'
import {
  analyzeMessageOutputSchema,
  analyzeMessageOutputFallback,
  type AnalyzeMessageInput,
  type AnalyzeMessageOutput,
} from './schemas'
import { mockAnalyzeMessage } from './mock'
import { prisma } from '@/lib/prisma'

interface AnalyzeResult {
  data: AnalyzeMessageOutput
  provider: string
  model: string
  dbSaved: boolean
  dbError?: string
}

function parseJsonFromText(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('No valid JSON found in response')
  }
}

function validateOutput(raw: unknown): AnalyzeMessageOutput {
  const result = analyzeMessageOutputSchema.safeParse(raw)
  if (result.success) {
    return result.data
  }

  console.warn('AI output validation failed, using partial data with defaults:', result.error.issues)

  // Merge partial data with defaults
  const partial = raw as Record<string, unknown>
  return {
    ...analyzeMessageOutputFallback,
    summary: typeof partial.summary === 'string' ? partial.summary : analyzeMessageOutputFallback.summary,
    category: typeof partial.category === 'string' ? partial.category : analyzeMessageOutputFallback.category,
    tags: Array.isArray(partial.tags) ? partial.tags.filter((t): t is string => typeof t === 'string') : analyzeMessageOutputFallback.tags,
    importanceScore: typeof partial.importanceScore === 'number' ? Math.min(100, Math.max(0, Math.round(partial.importanceScore))) : analyzeMessageOutputFallback.importanceScore,
    actionScore: typeof partial.actionScore === 'number' ? Math.min(100, Math.max(0, Math.round(partial.actionScore))) : analyzeMessageOutputFallback.actionScore,
    businessScore: typeof partial.businessScore === 'number' ? Math.min(100, Math.max(0, Math.round(partial.businessScore))) : analyzeMessageOutputFallback.businessScore,
    isActionable: typeof partial.isActionable === 'boolean' ? partial.isActionable : analyzeMessageOutputFallback.isActionable,
    isMentionMe: typeof partial.isMentionMe === 'boolean' ? partial.isMentionMe : analyzeMessageOutputFallback.isMentionMe,
    suggestedAction: typeof partial.suggestedAction === 'string' ? partial.suggestedAction : analyzeMessageOutputFallback.suggestedAction,
    reason: typeof partial.reason === 'string' ? partial.reason : analyzeMessageOutputFallback.reason,
  }
}

async function callOpenAICompatible(
  provider: ResolvedProvider,
  input: AnalyzeMessageInput,
): Promise<string> {
  if (provider.config.type !== 'openai-compatible') {
    throw new Error('Invalid provider type for OpenAI-compatible call')
  }

  const client = createOpenAIClient(provider.config)
  const response = await client.chat.completions.create({
    model: provider.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from AI provider')
  }
  return content
}

async function callAnthropic(
  provider: ResolvedProvider,
  input: AnalyzeMessageInput,
): Promise<string> {
  const client = createAnthropicClient()
  const response = await client.messages.create({
    model: provider.model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(input) },
    ],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Empty response from Anthropic')
  }
  return textBlock.text
}

async function callAI(
  provider: ResolvedProvider,
  input: AnalyzeMessageInput,
): Promise<AnalyzeMessageOutput> {
  let responseText: string

  if (provider.config.type === 'openai-compatible') {
    responseText = await callOpenAICompatible(provider, input)
  } else if (provider.config.type === 'anthropic') {
    responseText = await callAnthropic(provider, input)
  } else {
    throw new Error(`Unsupported provider type`)
  }

  const parsed = parseJsonFromText(responseText)
  return validateOutput(parsed)
}

async function saveToDatabase(
  messageId: string,
  data: AnalyzeMessageOutput,
): Promise<{ saved: boolean; error?: string }> {
  try {
    await prisma.messageAnalysis.upsert({
      where: { messageId },
      create: {
        messageId,
        summary: data.summary,
        category: data.category,
        importanceScore: data.importanceScore,
        actionScore: data.actionScore,
        businessScore: data.businessScore,
        isActionable: data.isActionable,
        isMentionMe: data.isMentionMe,
        reason: data.reason,
      },
      update: {
        summary: data.summary,
        category: data.category,
        importanceScore: data.importanceScore,
        actionScore: data.actionScore,
        businessScore: data.businessScore,
        isActionable: data.isActionable,
        isMentionMe: data.isMentionMe,
        reason: data.reason,
      },
    })
    return { saved: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
    console.error('Failed to save analysis to database:', errorMessage)
    return { saved: false, error: errorMessage }
  }
}

export async function analyzeMessage(input: AnalyzeMessageInput): Promise<AnalyzeResult> {
  const provider = resolveProvider()

  // Mock provider
  if (provider.config.type === 'mock') {
    const data = mockAnalyzeMessage(input)
    let dbSaved = false
    let dbError: string | undefined

    if (input.messageId) {
      const result = await saveToDatabase(input.messageId, data)
      dbSaved = result.saved
      dbError = result.error
    }

    return { data, provider: 'mock', model: 'mock', dbSaved, dbError }
  }

  // Real AI provider with retry
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await callAI(provider, input)

      let dbSaved = false
      let dbError: string | undefined

      if (input.messageId) {
        const result = await saveToDatabase(input.messageId, data)
        dbSaved = result.saved
        dbError = result.error
      }

      return { data, provider: provider.name, model: provider.model, dbSaved, dbError }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`AI call attempt ${attempt + 1} failed:`, lastError.message)
    }
  }

  throw lastError ?? new Error('AI analysis failed after retries')
}
