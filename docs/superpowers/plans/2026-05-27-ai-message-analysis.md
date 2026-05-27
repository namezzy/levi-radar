# AI Message Analysis Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an AI-powered message analysis module with switchable providers (DeepSeek/OpenAI/Kimi/Qwen/Anthropic/Mock) that analyzes community messages and writes results to the database.

**Architecture:** All OpenAI-compatible providers (DeepSeek, Kimi, Qwen, OpenAI) use the `openai` SDK with different baseURLs. Anthropic uses its own SDK. A provider registry maps provider names to configs. The `analyzeMessage` function orchestrates prompt construction, AI call, output validation, and database persistence.

**Tech Stack:** OpenAI SDK, Anthropic SDK, Zod, Next.js Route Handlers, Prisma

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/ai/schemas.ts` | Zod schemas for input/output validation |
| `src/lib/ai/providers.ts` | Provider configuration registry + client factory |
| `src/lib/ai/prompts.ts` | System prompt and user prompt templates |
| `src/lib/ai/mock.ts` | Mock fallback analysis for local dev |
| `src/lib/ai/analyze-message.ts` | Core `analyzeMessage` function |
| `src/app/api/ai/analyze-message/route.ts` | POST Route Handler |
| `.env` | Add AI env vars |
| `.env.example` | Add AI env var templates |

---

### Task 1: Install Dependencies and Add Env Vars

**Files:**
- Modify: `package.json`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Install openai, anthropic, and zod**

```bash
cd D:\Code\Copilot-AI\Levi-radar\levi-radar
npm install openai @anthropic-ai/sdk zod
```

- [ ] **Step 2: Add AI environment variables to .env**

Append to `.env`:

```env
# AI Provider Configuration
AI_PROVIDER=mock
AI_MODEL=
DEEPSEEK_API_KEY=
OPENAI_API_KEY=
KIMI_API_KEY=
QWEN_API_KEY=
ANTHROPIC_API_KEY=
```

- [ ] **Step 3: Add AI environment variables to .env.example**

Append to `.env.example`:

```env
# AI Provider Configuration
AI_PROVIDER=mock
AI_MODEL=
DEEPSEEK_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
KIMI_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-xxx
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install openai, anthropic, zod for AI module

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Zod Schemas

**Files:**
- Create: `src/lib/ai/schemas.ts`

- [ ] **Step 1: Create the schemas file**

Create `src/lib/ai/schemas.ts`:

```typescript
import { z } from 'zod'

export const analyzeMessageInputSchema = z.object({
  messageId: z.string().optional(),
  groupName: z.string().min(1, '群名不能为空'),
  senderName: z.string().min(1, '发送者不能为空'),
  content: z.string().min(1, '消息内容不能为空'),
  sentAt: z.string().min(1, '发送时间不能为空'),
})

export type AnalyzeMessageInput = z.infer<typeof analyzeMessageInputSchema>

export const analyzeMessageOutputSchema = z.object({
  summary: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  importanceScore: z.number().int().min(0).max(100),
  actionScore: z.number().int().min(0).max(100),
  businessScore: z.number().int().min(0).max(100),
  isActionable: z.boolean(),
  isMentionMe: z.boolean(),
  suggestedAction: z.string(),
  reason: z.string(),
})

export type AnalyzeMessageOutput = z.infer<typeof analyzeMessageOutputSchema>

export const analyzeMessageOutputFallback: AnalyzeMessageOutput = {
  summary: '无法分析',
  category: '其他',
  tags: [],
  importanceScore: 0,
  actionScore: 0,
  businessScore: 0,
  isActionable: false,
  isMentionMe: false,
  suggestedAction: '无',
  reason: 'AI 输出解析失败，使用默认值',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/schemas.ts
git commit -m "feat: add zod schemas for AI message analysis input/output

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Provider Configuration

**Files:**
- Create: `src/lib/ai/providers.ts`

- [ ] **Step 1: Create the providers file**

Create `src/lib/ai/providers.ts`:

```typescript
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export type ProviderName = 'deepseek' | 'openai' | 'kimi' | 'qwen' | 'anthropic' | 'mock'

interface OpenAIProviderConfig {
  type: 'openai-compatible'
  baseURL: string
  defaultModel: string
  apiKeyEnv: string
}

interface AnthropicProviderConfig {
  type: 'anthropic'
  defaultModel: string
  apiKeyEnv: string
}

interface MockProviderConfig {
  type: 'mock'
}

type ProviderConfig = OpenAIProviderConfig | AnthropicProviderConfig | MockProviderConfig

const providerRegistry: Record<ProviderName, ProviderConfig> = {
  deepseek: {
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  openai: {
    type: 'openai-compatible',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  kimi: {
    type: 'openai-compatible',
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    apiKeyEnv: 'KIMI_API_KEY',
  },
  qwen: {
    type: 'openai-compatible',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    apiKeyEnv: 'QWEN_API_KEY',
  },
  anthropic: {
    type: 'anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  mock: {
    type: 'mock',
  },
}

export interface ResolvedProvider {
  name: ProviderName
  model: string
  config: ProviderConfig
}

export function resolveProvider(): ResolvedProvider {
  const providerName = (process.env.AI_PROVIDER || 'deepseek') as ProviderName
  const config = providerRegistry[providerName]

  if (!config) {
    console.warn(`Unknown AI_PROVIDER "${providerName}", falling back to mock`)
    return { name: 'mock', model: '', config: providerRegistry.mock }
  }

  // Auto-fallback to mock if API key is missing
  if (config.type !== 'mock') {
    const apiKey = process.env[config.apiKeyEnv]
    if (!apiKey) {
      console.warn(`${config.apiKeyEnv} not set, falling back to mock provider`)
      return { name: 'mock', model: '', config: providerRegistry.mock }
    }
  }

  const model = config.type === 'mock'
    ? ''
    : process.env.AI_MODEL || config.defaultModel

  return { name: providerName, model, config }
}

export function createOpenAIClient(config: OpenAIProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: process.env[config.apiKeyEnv],
    baseURL: config.baseURL,
  })
}

export function createAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/providers.ts
git commit -m "feat: add AI provider registry with DeepSeek/OpenAI/Kimi/Qwen/Anthropic/Mock

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Prompts

**Files:**
- Create: `src/lib/ai/prompts.ts`

- [ ] **Step 1: Create the prompts file**

Create `src/lib/ai/prompts.ts`:

```typescript
import type { AnalyzeMessageInput } from './schemas'

export const SYSTEM_PROMPT = `你是一个专业的社群情报分析师。你的任务是分析社群消息，提取关键情报并输出结构化的 JSON 分析结果。

## 输出格式

你必须返回且仅返回一个合法的 JSON 对象，不要包含任何额外的文字、注释或 markdown 格式。

JSON 结构如下：
{
  "summary": "一句话概括消息核心内容",
  "category": "分类",
  "tags": ["关键词标签"],
  "importanceScore": 0-100,
  "actionScore": 0-100,
  "businessScore": 0-100,
  "isActionable": true/false,
  "isMentionMe": false,
  "suggestedAction": "建议的行动",
  "reason": "你做出以上判断的理由"
}

## 分类范围

category 必须是以下之一：
- 市场情报：行业趋势、市场数据、政策变化
- 产品反馈：用户反馈、功能建议、使用体验
- 竞品动态：竞争对手的产品、融资、战略动向
- 商业机会：合作机会、客户需求、项目邀约
- 风险预警：安全风险、合规风险、市场风险
- 招聘需求：招聘信息、人才推荐、团队组建
- 技术讨论：技术方案、架构讨论、工具推荐
- 闲聊：日常对话、问候、非业务内容
- 其他：无法归类的内容

## 评分标准

- importanceScore（重要性）：消息对业务决策的重要程度。90+ 极其重要，70-89 重要，50-69 一般，<50 不太重要
- actionScore（行动性）：需要立即采取行动的紧迫度。90+ 需立即行动，70-89 应尽快处理，50-69 可以安排，<50 无需行动
- businessScore（商业价值）：消息包含的商业机会大小。90+ 巨大商机，70-89 有价值，50-69 一般，<50 无商业价值

## 标签规则

tags 数组应包含 3-6 个关键词标签，提取消息中的核心实体、主题和领域。

## 注意事项

- isMentionMe 始终设为 false（由系统层判断）
- suggestedAction 应给出具体、可执行的建议
- reason 应简明扼要地解释你的判断依据`

export function buildUserPrompt(input: AnalyzeMessageInput): string {
  return `群名: ${input.groupName}
发送者: ${input.senderName}
时间: ${input.sentAt}
消息内容: ${input.content}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "feat: add system prompt and user prompt builder for message analysis

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Mock Fallback

**Files:**
- Create: `src/lib/ai/mock.ts`

- [ ] **Step 1: Create the mock file**

Create `src/lib/ai/mock.ts`:

```typescript
import type { AnalyzeMessageInput, AnalyzeMessageOutput } from './schemas'

const categoryKeywords: Record<string, string[]> = {
  '招聘需求': ['招聘', '找人', '推荐', '候选人', '产品经理', 'PM', '工程师', '开发'],
  '竞品动态': ['竞品', '对手', '融资', '上线', '发布', '竞争'],
  '商业机会': ['合作', '客户', '定制', '采购', '需求', '项目'],
  '产品反馈': ['反馈', 'bug', '体验', '功能', '建议', 'NPS'],
  '市场情报': ['市场', '行业', '趋势', '报告', '增长', '数据'],
  '风险预警': ['风险', '安全', '合规', '法规', '漏洞'],
  '技术讨论': ['技术', '架构', 'API', 'SDK', '代码', '开源'],
}

function detectCategory(content: string): string {
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => content.includes(kw))) {
      return category
    }
  }
  return '其他'
}

function extractTags(content: string): string[] {
  const allKeywords = Object.values(categoryKeywords).flat()
  const found = allKeywords.filter((kw) => content.includes(kw))
  return found.length > 0 ? found.slice(0, 5) : ['社群消息']
}

export function mockAnalyzeMessage(input: AnalyzeMessageInput): AnalyzeMessageOutput {
  const category = detectCategory(input.content)
  const tags = extractTags(input.content)
  const isBusinessRelated = !['闲聊', '其他'].includes(category)

  return {
    summary: `[Mock] ${input.senderName} 在 ${input.groupName} 中发送了关于「${category}」的消息。`,
    category,
    tags,
    importanceScore: isBusinessRelated ? 65 : 15,
    actionScore: isBusinessRelated ? 50 : 10,
    businessScore: isBusinessRelated ? 55 : 5,
    isActionable: isBusinessRelated,
    isMentionMe: false,
    suggestedAction: isBusinessRelated ? '建议关注并评估是否需要跟进。' : '无需行动。',
    reason: `[Mock Provider] 基于关键词匹配判断为「${category}」类别。`,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/mock.ts
git commit -m "feat: add mock fallback for AI analysis (local dev without API key)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: Core analyzeMessage Function

**Files:**
- Create: `src/lib/ai/analyze-message.ts`

- [ ] **Step 1: Create the core analysis function**

Create `src/lib/ai/analyze-message.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/analyze-message.ts
git commit -m "feat: implement core analyzeMessage function with retry and DB persistence

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: API Route Handler

**Files:**
- Create: `src/app/api/ai/analyze-message/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/ai/analyze-message/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { analyzeMessageInputSchema } from '@/lib/ai/schemas'
import { analyzeMessage } from '@/lib/ai/analyze-message'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parseResult = analyzeMessageInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: parseResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    // Run analysis
    const result = await analyzeMessage(parseResult.data)

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
      model: result.model,
      dbSaved: result.dbSaved,
      ...(result.dbError && { dbError: result.dbError }),
    })
  } catch (error) {
    console.error('AI analysis error:', error)
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
git add src/app/api/ai/analyze-message/route.ts
git commit -m "feat: add POST /api/ai/analyze-message route handler

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: Build Verification and Manual Test

**Files:**
- No new files

- [ ] **Step 1: Run build to verify no TypeScript errors**

```bash
cd D:\Code\Copilot-AI\Levi-radar\levi-radar
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start dev server and test with curl**

Start the dev server:

```bash
npm run dev
```

Test the mock provider (no API key needed):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-message \
  -H "Content-Type: application/json" \
  -d "{\"groupName\":\"AI产品出海虫团\",\"senderName\":\"张三\",\"content\":\"我们正在找一个会做AI Agent商业化落地的产品经理，有推荐吗？\",\"sentAt\":\"2026-05-23T09:56:00+08:00\"}"
```

Expected response contains:
```json
{
  "success": true,
  "data": {
    "summary": "[Mock] ...",
    "category": "招聘需求",
    "tags": ["找人", "推荐", "产品经理"],
    ...
  },
  "provider": "mock",
  "model": "mock"
}
```

Test validation error (empty content):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-message \
  -H "Content-Type: application/json" \
  -d "{\"groupName\":\"test\",\"senderName\":\"test\",\"content\":\"\",\"sentAt\":\"2026-05-23T09:56:00+08:00\"}"
```

Expected: 400 response with validation error for content field.

- [ ] **Step 3: Final commit and push**

```bash
git add -A
git commit -m "chore: verify AI analysis module build and tests pass

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin main
```
