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
