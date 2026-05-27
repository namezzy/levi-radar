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
