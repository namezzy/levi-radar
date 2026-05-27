# AI Message Analysis Module Design

**Date:** 2026-05-27  
**Status:** Approved  

## Overview

Levi Radar 社群情报雷达系统的 AI 消息分析模块。通过可切换的 AI Provider（DeepSeek/OpenAI/Kimi/Qwen/Anthropic）对社群消息进行智能分类、评分、摘要和行动项建议，分析结果写入 MessageAnalysis 表。

## Design Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| SDK 策略 | OpenAI SDK 统一接入 + Anthropic 单独 SDK | DeepSeek/Kimi/Qwen 都兼容 OpenAI API 格式 |
| 默认 Provider | DeepSeek V3 (deepseek-chat) | 用户指定 |
| 结果存储 | 写入 MessageAnalysis 表 | 已有 Prisma 模型 |
| 校验 | Zod | 输入输出双向校验 |
| 本地调试 | Mock fallback | AI_PROVIDER=mock 或无 API Key 时返回预设数据 |

## File Structure

```
src/lib/ai/
  providers.ts         — Provider 配置注册表
  prompts.ts           — System prompt + output schema 定义
  schemas.ts           — Zod 输入/输出校验 schema
  analyze-message.ts   — analyzeMessage 核心函数
  mock.ts              — Mock fallback 数据

src/app/api/ai/analyze-message/
  route.ts             — POST Route Handler
```

## Provider Configuration

### 配置表

| Provider | baseURL | 默认模型 | API Key 环境变量 |
|----------|---------|---------|----------------|
| deepseek | `https://api.deepseek.com` | deepseek-chat | `DEEPSEEK_API_KEY` |
| openai | `https://api.openai.com/v1` | gpt-4o-mini | `OPENAI_API_KEY` |
| kimi | `https://api.moonshot.cn/v1` | moonshot-v1-8k | `KIMI_API_KEY` |
| qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-plus | `QWEN_API_KEY` |
| anthropic | (专用 SDK) | claude-sonnet-4-20250514 | `ANTHROPIC_API_KEY` |
| mock | (本地) | — | 不需要 |

### 环境变量

```env
AI_PROVIDER=deepseek          # 可选: deepseek/openai/kimi/qwen/anthropic/mock
AI_MODEL=                     # 可选: 覆盖默认模型
DEEPSEEK_API_KEY=sk-xxx       # DeepSeek API Key
OPENAI_API_KEY=sk-xxx         # OpenAI API Key
KIMI_API_KEY=sk-xxx           # Kimi (Moonshot) API Key
QWEN_API_KEY=sk-xxx           # Qwen (DashScope) API Key
ANTHROPIC_API_KEY=sk-xxx      # Anthropic API Key
```

当 `AI_PROVIDER` 未设置时，默认使用 `deepseek`。  
当对应 Provider 的 API Key 未设置时，自动降级到 `mock`。

## Input/Output Schema

### 输入 (AnalyzeMessageInput)

```typescript
{
  messageId?: string           // 可选，用于写入数据库
  groupName: string            // 群名
  senderName: string           // 发送者名称
  content: string              // 消息内容
  sentAt: string               // ISO 8601 时间戳
}
```

### 输出 (AnalyzeMessageOutput)

```typescript
{
  summary: string              // AI 摘要
  category: string             // 分类
  tags: string[]               // 标签数组
  importanceScore: number      // 重要性 0-100
  actionScore: number          // 行动性 0-100
  businessScore: number        // 商业价值 0-100
  isActionable: boolean        // 是否需要行动
  isMentionMe: boolean         // 是否提及我
  suggestedAction: string      // 建议行动
  reason: string               // AI 判断理由
}
```

## Prompt Design

### System Prompt

角色：社群情报分析师  
任务：分析社群消息并输出结构化 JSON  
约束：
- 必须返回严格 JSON，无多余文字
- 评分标准说明（importance: 消息对业务的重要程度；action: 需要立即采取行动的紧迫度；business: 商业价值和机会大小）
- category 建议范围：市场情报/产品反馈/竞品动态/商业机会/风险预警/招聘需求/技术讨论/闲聊/其他
- tags 限制 3-6 个关键词

### User Prompt

```
群名: {groupName}
发送者: {senderName}
时间: {sentAt}
消息内容: {content}
```

## API Route

### POST /api/ai/analyze-message

**Request Body:**

```json
{
  "messageId": "clxxx...",
  "groupName": "AI产品出海虫团",
  "senderName": "张三",
  "content": "我们正在找一个会做AI Agent商业化落地的产品经理",
  "sentAt": "2026-05-23T09:56:00+08:00"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "summary": "...",
    "category": "招聘需求",
    "tags": ["AI Agent", "招聘", "产品经理"],
    "importanceScore": 88,
    "actionScore": 76,
    "businessScore": 82,
    "isActionable": true,
    "isMentionMe": false,
    "suggestedAction": "...",
    "reason": "..."
  },
  "provider": "deepseek",
  "model": "deepseek-chat"
}
```

**Response 400:** 输入校验失败  
**Response 500:** AI 调用失败

### 数据库写入

当请求包含 `messageId` 时，分析结果 upsert 到 MessageAnalysis 表：
- summary, category, importanceScore, actionScore, businessScore, isActionable, isMentionMe, reason 写入对应字段
- tags 和 suggestedAction 不写入（MessageAnalysis 表无此字段，tags 通过 MessageTag 关联）

## Error Handling

| 场景 | 处理 |
|------|------|
| 请求体 Zod 校验失败 | 400 + 具体字段错误信息 |
| AI Provider API Key 缺失 | 自动降级到 mock，日志 warn |
| AI API 调用失败 | 重试 1 次，仍失败返回 500 + 错误详情 |
| AI 返回非 JSON | 尝试从响应中提取 JSON，失败则重试 |
| AI 输出 Zod 校验失败 | 用 safeParse + 默认值兜底 |
| 数据库写入失败 | 仍返回分析结果，日志 error，response 中标记 dbError |

## Mock Fallback

`mock.ts` 返回基于输入内容的预设分析结果：
- 根据 content 中的关键词简单匹配 category
- 固定评分值（可配置）
- 标注 `provider: "mock"` 以便前端识别

触发条件：
1. `AI_PROVIDER=mock` 显式配置
2. 对应 Provider 的 API Key 环境变量为空

## Dependencies

新增 npm 依赖：
- `openai` — OpenAI SDK（也用于 DeepSeek/Kimi/Qwen）
- `@anthropic-ai/sdk` — Anthropic SDK
- `zod` — Schema 校验
