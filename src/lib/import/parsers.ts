import { parsedMessageSchema, type ParsedMessage } from './schemas'

export function parseTxt(text: string): { messages: ParsedMessage[]; errors: string[] } {
  const lines = text.split('\n').filter((line) => line.trim())
  const messages: ParsedMessage[] = []
  const errors: string[] = []

  const regex = /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\]\s+(.+?)[：:](.+)$/

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(regex)
    if (!match) {
      errors.push(`第 ${i + 1} 行格式无法解析: "${lines[i].trim().slice(0, 50)}"`)
      continue
    }

    const [, dateStr, senderName, content] = match
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

  const header = lines[0].toLowerCase().trim()
  const hasHeader = header.includes('sendername') || header.includes('content') || header.includes('sentat')
  const dataLines = hasHeader ? lines.slice(1) : lines

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = hasHeader ? i + 2 : i + 1
    const line = dataLines[i].trim()
    if (!line) continue

    const fields = line.split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))

    if (fields.length < 3) {
      errors.push(`第 ${lineNum} 行字段数不足（需要至少 3 个字段）`)
      continue
    }

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
