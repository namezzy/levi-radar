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
