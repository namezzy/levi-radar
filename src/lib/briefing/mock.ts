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
