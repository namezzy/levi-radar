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
