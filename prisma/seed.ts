import { PrismaClient, Platform, UserRole, BriefingType, ActionStatus, IntegrationStatus, SyncStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data (order matters for FK constraints)
  await prisma.messageTag.deleteMany()
  await prisma.link.deleteMany()
  await prisma.messageAnalysis.deleteMany()
  await prisma.actionItem.deleteMany()
  await prisma.message.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.briefing.deleteMany()
  await prisma.syncJob.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing data')

  // ─── User ───
  const user = await prisma.user.create({
    data: {
      name: 'Levi',
      email: 'levi@radar.dev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Levi',
      role: UserRole.admin,
    },
  })
  console.log('👤 Created user:', user.name)

  // ─── Workspace ───
  const workspace = await prisma.workspace.create({
    data: {
      name: "Levi's Radar",
      description: '社群情报雷达工作区',
      ownerId: user.id,
    },
  })
  console.log('🏢 Created workspace:', workspace.name)

  // ─── Collections ───
  const industryCollection = await prisma.collection.create({
    data: {
      name: '行业群',
      color: '#3b82f6',
      workspaceId: workspace.id,
    },
  })

  const clientCollection = await prisma.collection.create({
    data: {
      name: '客户群',
      color: '#22c55e',
      workspaceId: workspace.id,
    },
  })
  console.log('📁 Created 2 collections')

  // ─── Groups ───
  const wechatGroup = await prisma.group.create({
    data: {
      name: 'AI创业者联盟',
      platform: Platform.wechat,
      externalId: 'wx_group_001',
      memberCount: 256,
      workspaceId: workspace.id,
      collectionId: industryCollection.id,
    },
  })

  const feishuGroup = await prisma.group.create({
    data: {
      name: 'SaaS产品经理圈',
      platform: Platform.feishu,
      externalId: 'fs_group_001',
      memberCount: 128,
      workspaceId: workspace.id,
      collectionId: industryCollection.id,
    },
  })

  const telegramGroup = await prisma.group.create({
    data: {
      name: 'Web3 Builders',
      platform: Platform.telegram,
      externalId: 'tg_group_001',
      memberCount: 512,
      workspaceId: workspace.id,
      collectionId: industryCollection.id,
    },
  })

  const manualGroup = await prisma.group.create({
    data: {
      name: '重点客户A',
      platform: Platform.manual_import,
      memberCount: 45,
      workspaceId: workspace.id,
      collectionId: clientCollection.id,
    },
  })

  const groups = [wechatGroup, feishuGroup, telegramGroup, manualGroup]
  console.log('💬 Created 4 groups')

  // ─── Group Members ───
  const memberNames: Record<string, string[]> = {
    [wechatGroup.id]: ['张伟', '李娜', '王磊', '赵敏', '陈浩'],
    [feishuGroup.id]: ['刘洋', '黄丽', '周强'],
    [telegramGroup.id]: ['Alex Chen', 'Sarah Kim', 'Mike Wang', 'Luna Li'],
    [manualGroup.id]: ['客户经理A', '技术负责人B', '运营C'],
  }

  const allMembers: Record<string, Awaited<ReturnType<typeof prisma.groupMember.create>>[]> = {}

  for (const group of groups) {
    const names = memberNames[group.id]
    allMembers[group.id] = []
    for (let i = 0; i < names.length; i++) {
      const member = await prisma.groupMember.create({
        data: {
          name: names[i],
          externalId: `${group.platform}_user_${i + 1}`,
          platform: group.platform,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(names[i])}`,
          role: i === 0 ? 'admin' : 'member',
          groupId: group.id,
        },
      })
      allMembers[group.id].push(member)
    }
  }
  console.log('👥 Created group members')

  // ─── Messages + Analysis ───
  const now = new Date()

  const sampleMessages = [
    { content: '听说竞品X刚完成B轮融资，估值3亿美元', category: 'competitor', importance: 85, action: 70, business: 80 },
    { content: '我们的API响应时间需要优化，客户反馈延迟太高', category: 'product_feedback', importance: 75, action: 90, business: 60 },
    { content: '行业报告显示AI SaaS市场今年增长40%', category: 'market_intel', importance: 90, action: 30, business: 85 },
    { content: '有个大客户在问我们能不能做定制化部署', category: 'opportunity', importance: 95, action: 95, business: 95 },
    { content: '今天的站会改到下午3点', category: 'general', importance: 10, action: 20, business: 5 },
    { content: '数据安全法规更新，需要review我们的合规策略', category: 'risk', importance: 80, action: 85, business: 70 },
    { content: '新版SDK文档写好了，大家看看有没有问题', category: 'general', importance: 30, action: 40, business: 20 },
    { content: '竞品Y推出了免费版，可能影响我们的转化率', category: 'competitor', importance: 88, action: 60, business: 75 },
    { content: '客户反馈新功能很好用，NPS提升了15分', category: 'product_feedback', importance: 70, action: 20, business: 65 },
    { content: '东南亚市场有几个潜在合作伙伴想聊聊', category: 'opportunity', importance: 78, action: 80, business: 82 },
  ]

  let messageIndex = 0
  const allMessages: Awaited<ReturnType<typeof prisma.message.create>>[] = []

  for (const group of groups) {
    const members = allMembers[group.id]
    const msgCount = group.id === wechatGroup.id ? 10 : group.id === telegramGroup.id ? 8 : 5

    for (let i = 0; i < msgCount; i++) {
      const sample = sampleMessages[messageIndex % sampleMessages.length]
      const sender = members[i % members.length]
      const hoursAgo = Math.floor(Math.random() * 24)
      const sentAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

      const message = await prisma.message.create({
        data: {
          content: sample.content,
          senderId: sender.id,
          groupId: group.id,
          sentAt,
          externalId: `${group.platform}_msg_${messageIndex}`,
          messageType: 'text',
          rawPayload: {
            platform: group.platform,
            originalFormat: 'text',
            timestamp: sentAt.toISOString(),
          },
        },
      })

      await prisma.messageAnalysis.create({
        data: {
          messageId: message.id,
          summary: `[AI摘要] ${sample.content.substring(0, 30)}...`,
          category: sample.category,
          importanceScore: sample.importance,
          actionScore: sample.action,
          businessScore: sample.business,
          isActionable: sample.action >= 70,
          isMentionMe: messageIndex % 7 === 0,
          reason: `AI判断此消息属于${sample.category}类别，重要性${sample.importance}/100`,
        },
      })

      allMessages.push(message)
      messageIndex++
    }
  }
  console.log(`📨 Created ${allMessages.length} messages with analysis`)

  // ─── Links ───
  const linkMessages = allMessages.filter((_, i) => i % 3 === 0)
  for (const msg of linkMessages) {
    await prisma.link.create({
      data: {
        url: 'https://example.com/report-2026',
        title: '2026行业分析报告',
        domain: 'example.com',
        messageId: msg.id,
      },
    })
  }
  console.log(`🔗 Created ${linkMessages.length} links`)

  // ─── Tags ───
  const tagData = [
    { name: '重要', color: '#ef4444' },
    { name: '竞品', color: '#f59e0b' },
    { name: '客户反馈', color: '#22c55e' },
    { name: '机会', color: '#3b82f6' },
    { name: '风险', color: '#8b5cf6' },
  ]

  const tags = []
  for (const t of tagData) {
    const tag = await prisma.tag.create({
      data: { ...t, workspaceId: workspace.id },
    })
    tags.push(tag)
  }
  console.log('🏷️  Created 5 tags')

  // ─── MessageTags ───
  for (let i = 0; i < Math.min(allMessages.length, 10); i++) {
    const tagIndex = i % tags.length
    await prisma.messageTag.create({
      data: {
        messageId: allMessages[i].id,
        tagId: tags[tagIndex].id,
      },
    })
  }
  console.log('🔖 Created message-tag relations')

  // ─── Briefing ───
  await prisma.briefing.create({
    data: {
      type: BriefingType.daily,
      title: '每日情报简报 — 2026年5月26日',
      content: `## 今日要点\n\n今日共监控4个社群，采集28条消息。重点关注：\n\n1. **竞品动态**：竞品X完成B轮融资，估值3亿美元，需要重新评估竞争策略\n2. **客户机会**：大客户询问定制化部署，建议48小时内跟进\n3. **产品反馈**：API响应时间问题被多次提及，建议排入下个sprint\n4. **市场趋势**：AI SaaS市场增长40%，东南亚市场出现合作机会\n\n## 行动建议\n\n- 紧急：跟进大客户定制化需求\n- 重要：制定竞品X融资后的应对策略\n- 计划：优化API响应时间`,
      highlights: [
        { type: 'competitor', text: '竞品X完成B轮融资' },
        { type: 'opportunity', text: '大客户询问定制化部署' },
        { type: 'product', text: 'API响应时间需优化' },
      ],
      date: now,
      workspaceId: workspace.id,
    },
  })
  console.log('📋 Created daily briefing')

  // ─── ActionItems ───
  await prisma.actionItem.create({
    data: {
      title: '跟进大客户定制化部署需求',
      description: '客户询问定制化部署方案，需在48小时内回复技术方案',
      status: ActionStatus.pending,
      priority: 95,
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      messageId: allMessages[3]?.id,
      workspaceId: workspace.id,
    },
  })

  await prisma.actionItem.create({
    data: {
      title: '制定竞品X融资应对策略',
      description: '竞品X完成B轮，需分析对我们的影响并制定应对措施',
      status: ActionStatus.pending,
      priority: 80,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      messageId: allMessages[0]?.id,
      workspaceId: workspace.id,
    },
  })

  await prisma.actionItem.create({
    data: {
      title: 'Review数据安全合规策略',
      description: '数据安全法规更新，需要review当前的合规策略',
      status: ActionStatus.ignored,
      priority: 70,
      workspaceId: workspace.id,
    },
  })
  console.log('✅ Created 3 action items')

  // ─── Integrations + SyncJobs ───
  const wechatIntegration = await prisma.integration.create({
    data: {
      platform: Platform.wechat,
      name: '微信采集',
      config: { webhook: 'https://hooks.example.com/wechat', token: 'wx_token_***' },
      status: IntegrationStatus.active,
      workspaceId: workspace.id,
    },
  })

  const feishuIntegration = await prisma.integration.create({
    data: {
      platform: Platform.feishu,
      name: '飞书采集',
      config: { appId: 'fs_app_001', appSecret: 'fs_secret_***' },
      status: IntegrationStatus.active,
      workspaceId: workspace.id,
    },
  })

  await prisma.syncJob.create({
    data: {
      integrationId: wechatIntegration.id,
      status: SyncStatus.completed,
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      messageCount: 15,
    },
  })

  await prisma.syncJob.create({
    data: {
      integrationId: feishuIntegration.id,
      status: SyncStatus.running,
      startedAt: new Date(now.getTime() - 30 * 60 * 1000),
      messageCount: 8,
    },
  })
  console.log('🔌 Created 2 integrations + 2 sync jobs')

  console.log('\n🌱 Seed complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
