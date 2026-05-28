# Daily Briefing Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate structured daily intelligence briefings from MessageAnalysis data via AI, persist to Briefing table, and display on Dashboard with live data.

**Architecture:** API route `POST /api/briefings/generate` queries MessageAnalysis for a given date, filters high-importance and actionable messages, sends aggregated data to AI (or mock), saves structured JSON to the Briefing table, and returns it. The Dashboard BriefingNote component fetches the latest briefing from a new `GET /api/briefings/latest` endpoint instead of using hardcoded mock data.

**Tech Stack:** Next.js Route Handler, Prisma, Zod, OpenAI/Anthropic SDK (reusing existing provider system), TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/briefing/schemas.ts` | Zod schemas for briefing input/output + TypeScript types |
| Create | `src/lib/briefing/prompts.ts` | System prompt and user prompt builder for briefing generation |
| Create | `src/lib/briefing/mock.ts` | Mock briefing generator (no API key needed) |
| Create | `src/lib/briefing/generate-briefing.ts` | Core orchestrator: query DB → filter → call AI → save |
| Create | `src/app/api/briefings/generate/route.ts` | POST handler for briefing generation |
| Create | `src/app/api/briefings/latest/route.ts` | GET handler to fetch latest briefing for dashboard |
| Modify | `src/components/dashboard/briefing-note.tsx` | Fetch from API instead of mock, display structured briefing |

---

### Task 1: Briefing Schemas

**Files:**
- Create: `src/lib/briefing/schemas.ts`

- [ ] **Step 1: Create the schemas file**

```typescript
// src/lib/briefing/schemas.ts
import { z } from 'zod'

export const briefingInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  workspaceId: z.string().min(1, 'workspaceId 不能为空'),
})

export type BriefingInput = z.infer<typeof briefingInputSchema>

export const keySignalSchema = z.object({
  title: z.string(),
  summary: z.string(),
  relatedMessages: z.number().int().min(0),
})

export const briefingActionItemSchema = z.object({
  title: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  suggestedAction: z.string(),
})

export const topSourceSchema = z.object({
  groupName: z.string(),
  signalCount: z.number().int().min(0),
})

export const briefingOutputSchema = z.object({
  title: z.string(),
  date: z.string(),
  overview: z.string(),
  keySignals: z.array(keySignalSchema),
  actionItems: z.array(briefingActionItemSchema),
  hotTopics: z.array(z.string()),
  topSources: z.array(topSourceSchema),
})

export type BriefingOutput = z.infer<typeof briefingOutputSchema>

export const briefingOutputFallback: BriefingOutput = {
  title: '每日情报简报',
  date: new Date().toISOString().slice(0, 10),
  overview: '今日暂无足够数据生成简报。',
  keySignals: [],
  actionItems: [],
  hotTopics: [],
  topSources: [],
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx tsc --noEmit src/lib/briefing/schemas.ts 2>&1`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/briefing/schemas.ts
git commit -m "feat(briefing): add Zod schemas for briefing input/output"
```

---

### Task 2: Briefing Prompts

**Files:**
- Create: `src/lib/briefing/prompts.ts`

- [ ] **Step 1: Create the prompts file**

```typescript
// src/lib/briefing/prompts.ts

export const BRIEFING_SYSTEM_PROMPT = `你是一个专业的社群情报分析师。你的任务是根据今日社群消息的 AI 分析结果，生成一份结构化的每日情报简报。

## 输出格式

你必须返回且仅返回一个合法的 JSON 对象，不要包含任何额外的文字、注释或 markdown 格式。

JSON 结构如下：
{
  "title": "每日情报简报",
  "date": "YYYY-MM-DD",
  "overview": "今日总览概述（1-2句话，包含关键数据）",
  "keySignals": [
    {
      "title": "信号标题",
      "summary": "信号的详细描述",
      "relatedMessages": 消息数量
    }
  ],
  "actionItems": [
    {
      "title": "行动项标题",
      "priority": "high|medium|low",
      "suggestedAction": "具体建议"
    }
  ],
  "hotTopics": ["话题1", "话题2"],
  "topSources": [
    {
      "groupName": "群名",
      "signalCount": 信号数量
    }
  ]
}

## 分析要求

1. **keySignals**: 将高价值消息按主题归类聚合，提炼出 3-8 个关键信号。每个信号应概括多条相关消息，relatedMessages 填写该信号涉及的消息数。
2. **actionItems**: 从可行动消息中提取 3-6 个具体行动项。priority 根据 actionScore 和 importanceScore 综合判断。
3. **hotTopics**: 提取 4-8 个今日高频话题关键词。
4. **topSources**: 按信号数量排序列出前 5 个最活跃的群。
5. **overview**: 概括今日监控群数、关键信号数、行动项数。`

export interface BriefingPromptData {
  date: string
  totalGroups: number
  totalMessages: number
  highImportanceMessages: {
    groupName: string
    senderName: string
    content: string
    summary: string
    category: string
    importanceScore: number
    tags: string[]
  }[]
  actionableMessages: {
    groupName: string
    senderName: string
    content: string
    summary: string
    category: string
    actionScore: number
    suggestedAction: string
  }[]
}

export function buildBriefingPrompt(data: BriefingPromptData): string {
  const lines: string[] = [
    `日期: ${data.date}`,
    `监控群总数: ${data.totalGroups}`,
    `今日消息总数: ${data.totalMessages}`,
    '',
    `## 高价值消息 (importanceScore >= 70, 共 ${data.highImportanceMessages.length} 条)`,
    '',
  ]

  for (const msg of data.highImportanceMessages) {
    lines.push(`- [${msg.category}] ${msg.groupName} | ${msg.senderName}: ${msg.content}`)
    lines.push(`  摘要: ${msg.summary} | 重要性: ${msg.importanceScore} | 标签: ${msg.tags.join(', ')}`)
  }

  lines.push('')
  lines.push(`## 可行动消息 (isActionable=true, 共 ${data.actionableMessages.length} 条)`)
  lines.push('')

  for (const msg of data.actionableMessages) {
    lines.push(`- [${msg.category}] ${msg.groupName} | ${msg.senderName}: ${msg.content}`)
    lines.push(`  摘要: ${msg.summary} | 行动性: ${msg.actionScore} | 建议: ${msg.suggestedAction}`)
  }

  return lines.join('\n')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/briefing/prompts.ts
git commit -m "feat(briefing): add system prompt and user prompt builder"
```

---

### Task 3: Mock Briefing Generator

**Files:**
- Create: `src/lib/briefing/mock.ts`

- [ ] **Step 1: Create the mock file**

```typescript
// src/lib/briefing/mock.ts
import type { BriefingOutput } from './schemas'
import type { BriefingPromptData } from './prompts'

export function mockGenerateBriefing(data: BriefingPromptData): BriefingOutput {
  const { date, totalGroups, totalMessages, highImportanceMessages, actionableMessages } = data

  // Aggregate by category
  const categoryMap = new Map<string, number>()
  for (const msg of highImportanceMessages) {
    categoryMap.set(msg.category, (categoryMap.get(msg.category) || 0) + 1)
  }

  const keySignals = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => {
      const relatedMsgs = highImportanceMessages.filter(m => m.category === category)
      const topMsg = relatedMsgs[0]
      return {
        title: `${category}类信号集中出现`,
        summary: topMsg
          ? `${topMsg.summary}等 ${count} 条相关消息。`
          : `共 ${count} 条 ${category} 类消息。`,
        relatedMessages: count,
      }
    })

  const actionItems = actionableMessages.slice(0, 5).map(msg => ({
    title: msg.summary || msg.content.slice(0, 30),
    priority: (msg.actionScore >= 80 ? 'high' : msg.actionScore >= 50 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    suggestedAction: msg.suggestedAction || '建议关注并评估是否需要跟进。',
  }))

  // Extract hot topics from tags
  const tagCount = new Map<string, number>()
  for (const msg of highImportanceMessages) {
    for (const tag of msg.tags) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
    }
  }
  const hotTopics = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag)

  // Top sources by group
  const groupCount = new Map<string, number>()
  for (const msg of highImportanceMessages) {
    groupCount.set(msg.groupName, (groupCount.get(msg.groupName) || 0) + 1)
  }
  const topSources = Array.from(groupCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([groupName, signalCount]) => ({ groupName, signalCount }))

  return {
    title: '每日情报简报',
    date,
    overview: `[Mock] 今日共监控 ${totalGroups} 个群，收到 ${totalMessages} 条消息，识别出 ${highImportanceMessages.length} 条高价值信号和 ${actionableMessages.length} 个可行动项。`,
    keySignals: keySignals.length > 0 ? keySignals : [{ title: '暂无高价值信号', summary: '今日消息中未发现高价值信号。', relatedMessages: 0 }],
    actionItems: actionItems.length > 0 ? actionItems : [{ title: '暂无行动项', priority: 'low' as const, suggestedAction: '无需行动。' }],
    hotTopics: hotTopics.length > 0 ? hotTopics : ['社群消息'],
    topSources,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/briefing/mock.ts
git commit -m "feat(briefing): add mock briefing generator"
```

---

### Task 4: Core Generate Briefing Function

**Files:**
- Create: `src/lib/briefing/generate-briefing.ts`

- [ ] **Step 1: Create the core orchestrator**

This file queries the database for the day's messages, filters by importance/actionability, calls AI or mock, and saves to the Briefing table.

```typescript
// src/lib/briefing/generate-briefing.ts
import { prisma } from '@/lib/prisma'
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
          highlights: data as unknown as Record<string, unknown>,
        },
      })
      return { briefingId: existing.id }
    }

    const briefing = await prisma.briefing.create({
      data: {
        type: 'daily',
        title: data.title,
        content: data.overview,
        highlights: data as unknown as Record<string, unknown>,
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/briefing/generate-briefing.ts
git commit -m "feat(briefing): add core briefing generator with DB query + AI + save"
```

---

### Task 5: POST /api/briefings/generate Route

**Files:**
- Create: `src/app/api/briefings/generate/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/briefings/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { briefingInputSchema } from '@/lib/briefing/schemas'
import { generateBriefing } from '@/lib/briefing/generate-briefing'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = briefingInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: parseResult.error.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      )
    }

    const result = await generateBriefing(parseResult.data)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Briefing generation error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/briefings/generate/route.ts
git commit -m "feat(briefing): add POST /api/briefings/generate route"
```

---

### Task 6: GET /api/briefings/latest Route

**Files:**
- Create: `src/app/api/briefings/latest/route.ts`

- [ ] **Step 1: Create the latest briefing API route**

```typescript
// src/app/api/briefings/latest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { briefingOutputFallback, type BriefingOutput } from '@/lib/briefing/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    let briefing

    if (workspaceId) {
      briefing = await prisma.briefing.findFirst({
        where: { workspaceId, type: 'daily' },
        orderBy: { date: 'desc' },
      })
    } else {
      briefing = await prisma.briefing.findFirst({
        where: { type: 'daily' },
        orderBy: { date: 'desc' },
      })
    }

    if (!briefing) {
      return NextResponse.json({
        success: true,
        data: briefingOutputFallback,
        source: 'fallback',
      })
    }

    const data = briefing.highlights as unknown as BriefingOutput | null

    return NextResponse.json({
      success: true,
      data: data || {
        ...briefingOutputFallback,
        title: briefing.title,
        overview: briefing.content,
        date: briefing.date.toISOString().slice(0, 10),
      },
      briefingId: briefing.id,
      source: 'database',
    })
  } catch (error) {
    console.error('Failed to fetch latest briefing:', error)
    return NextResponse.json({
      success: true,
      data: briefingOutputFallback,
      source: 'fallback',
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/briefings/latest/route.ts
git commit -m "feat(briefing): add GET /api/briefings/latest route"
```

---

### Task 7: Update Dashboard BriefingNote Component

**Files:**
- Modify: `src/components/dashboard/briefing-note.tsx`

- [ ] **Step 1: Rewrite the BriefingNote component**

Replace the entire `src/components/dashboard/briefing-note.tsx` with a new version that fetches from `/api/briefings/latest` and renders structured briefing data with a "复制摘要" button and a "生成简报" button.

```tsx
// src/components/dashboard/briefing-note.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Flame,
} from "lucide-react";
import type { BriefingOutput } from "@/lib/briefing/schemas";
import { mockBriefing } from "@/data/mock";

export function BriefingNote() {
  const [briefing, setBriefing] = useState<BriefingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState<string>("mock");

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/briefings/latest");
      const json = await res.json();
      if (json.success && json.data) {
        setBriefing(json.data);
        setSource(json.source || "database");
      }
    } catch {
      // Fallback to mock display
      setSource("mock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/briefings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          workspaceId: "default",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBriefing(json.data);
        setSource("generated");
      }
    } catch (err) {
      console.error("Failed to generate briefing:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = briefing
      ? formatBriefingAsText(briefing)
      : mockBriefing.content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // If no API briefing loaded, show old-style mock content
  if (!briefing && !loading) {
    return (
      <div className="bg-card-bg rounded-lg p-3.5 border border-border-line">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary text-[13px] font-semibold">
              BRIEFING NOTE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-[10px]">今日情报简报</span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded text-primary text-[11px] hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              生成简报
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#081020] rounded text-text-secondary text-[11px] hover:bg-border-line transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              复制摘要
            </button>
          </div>
        </div>
        <p className="text-text-secondary text-xs leading-[1.7]">
          {mockBriefing.content}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card-bg rounded-lg p-3.5 border border-border-line">
        <div className="flex items-center gap-2 text-text-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          加载简报中...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-text-secondary" />
          <span className="text-text-primary text-[13px] font-semibold">
            BRIEFING NOTE
          </span>
          <span className="text-text-muted text-[10px] ml-1">
            {briefing?.date}
          </span>
          {source !== "mock" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {source === "generated" ? "刚生成" : "数据库"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded text-primary text-[11px] hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            生成简报
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#081020] rounded text-text-secondary text-[11px] hover:bg-border-line transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            复制摘要
          </button>
        </div>
      </div>

      {/* Overview */}
      <p className="text-text-secondary text-xs leading-[1.7] mb-3">
        {briefing?.overview}
      </p>

      {/* Key Signals + Action Items + Hot Topics in a compact layout */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Key Signals */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-text-muted font-semibold">
              关键信号
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {briefing?.keySignals.slice(0, 3).map((signal, i) => (
              <div
                key={i}
                className="bg-card-inner rounded px-2 py-1.5 text-[11px]"
              >
                <div className="text-text-primary font-medium truncate">
                  {signal.title}
                </div>
                <div className="text-text-muted text-[10px] mt-0.5 line-clamp-2">
                  {signal.summary}
                </div>
                <div className="text-primary text-[9px] mt-0.5">
                  {signal.relatedMessages} 条相关消息
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span className="text-[10px] text-text-muted font-semibold">
              行动项
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {briefing?.actionItems.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="bg-card-inner rounded px-2 py-1.5 text-[11px]"
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-semibold ${
                      item.priority === "high"
                        ? "bg-danger/20 text-danger"
                        : item.priority === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-white/10 text-text-muted"
                    }`}
                  >
                    {item.priority === "high"
                      ? "紧急"
                      : item.priority === "medium"
                        ? "重要"
                        : "一般"}
                  </span>
                  <span className="text-text-primary font-medium truncate">
                    {item.title}
                  </span>
                </div>
                <div className="text-text-muted text-[10px] mt-0.5 line-clamp-2">
                  {item.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Topics */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Flame className="w-3 h-3 text-[#f59e0b]" />
            <span className="text-[10px] text-text-muted font-semibold">
              热门话题
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {briefing?.hotTopics.map((topic, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-1 rounded bg-white/5 text-text-secondary border border-border-line"
              >
                {topic}
              </span>
            ))}
          </div>
          {/* Top Sources */}
          {briefing?.topSources && briefing.topSources.length > 0 && (
            <div className="mt-2.5">
              <span className="text-[10px] text-text-muted font-semibold">
                活跃来源
              </span>
              <div className="flex flex-col gap-0.5 mt-1">
                {briefing.topSources.slice(0, 3).map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-text-secondary truncate">
                      {src.groupName}
                    </span>
                    <span className="text-primary">{src.signalCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBriefingAsText(briefing: BriefingOutput): string {
  const lines: string[] = [
    `📋 ${briefing.title} (${briefing.date})`,
    "",
    briefing.overview,
    "",
    "🔑 关键信号：",
    ...briefing.keySignals.map(
      (s, i) => `${i + 1}. ${s.title} — ${s.summary} (${s.relatedMessages} 条)`
    ),
    "",
    "⚡ 行动项：",
    ...briefing.actionItems.map(
      (a, i) =>
        `${i + 1}. [${a.priority}] ${a.title} — ${a.suggestedAction}`
    ),
    "",
    `🔥 热门话题：${briefing.hotTopics.join("、")}`,
  ];

  if (briefing.topSources.length > 0) {
    lines.push("");
    lines.push("📡 活跃来源：");
    briefing.topSources.forEach(
      (s, i) => lines.push(`${i + 1}. ${s.groupName} (${s.signalCount} 信号)`)
    );
  }

  return lines.join("\n");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/briefing-note.tsx
git commit -m "feat(briefing): update BriefingNote to fetch from API with structured display"
```

---

### Task 8: Build Verification and Testing

**Files:** None (testing only)

- [ ] **Step 1: Run build**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npm run build 2>&1`
Expected: Compiled successfully, no TypeScript errors

- [ ] **Step 2: Start dev server and test generate endpoint**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npm run dev`

Then test with curl (PowerShell):

```powershell
# Test 1: Generate briefing (will use mock since no real workspace)
# First need to find a workspaceId, or it should handle missing workspace gracefully
Invoke-RestMethod -Uri "http://localhost:3001/api/briefings/generate" -Method POST -ContentType "application/json" -Body '{"date":"2026-05-28","workspaceId":"default"}'
```

Expected: JSON response with `success: true` and briefing data

- [ ] **Step 3: Test latest endpoint**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/briefings/latest" -Method GET
```

Expected: JSON response with briefing data or fallback

- [ ] **Step 4: Test validation errors**

```powershell
# Missing date
Invoke-RestMethod -Uri "http://localhost:3001/api/briefings/generate" -Method POST -ContentType "application/json" -Body '{"workspaceId":"xxx"}'

# Bad date format
Invoke-RestMethod -Uri "http://localhost:3001/api/briefings/generate" -Method POST -ContentType "application/json" -Body '{"date":"bad","workspaceId":"xxx"}'
```

Expected: 400 status with error details

- [ ] **Step 5: Verify Dashboard displays briefing**

Open `http://localhost:3001` in browser and confirm:
- BriefingNote shows structured data (key signals, action items, hot topics)
- "复制摘要" button copies formatted text
- "生成简报" button triggers generation

- [ ] **Step 6: Final commit and push**

```bash
git add -A
git commit -m "feat(briefing): complete daily briefing generation feature"
git push
```
