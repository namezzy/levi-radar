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
