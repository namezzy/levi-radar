import type {
  MetricCard,
  BriefingNote,
  NotableIntelItem,
  ActionItem,
  IntelSource,
  NavItem,
  GroupItem,
  CollectionItem,
} from "./types";

export const mockNavItems: NavItem[] = [
  { id: "dashboard", icon: "LayoutDashboard", label: "看板", badge: "Brief", badgeColor: "bg-primary text-[#060b14]", active: true },
  { id: "signal", icon: "Radio", label: "信号流", badge: "Live", badgeColor: "bg-success text-[#060b14]" },
  { id: "topics", icon: "Radar", label: "话题雷达", badge: "Cross", badgeColor: "bg-[#8b5cf6] text-white" },
  { id: "links", icon: "Link", label: "链接情报", badge: "Link", badgeColor: "bg-[#3b82f6] text-white" },
];

export const mockGroups: GroupItem[] = [
  { icon: "ClipboardList", label: "所有群", count: 165 },
  { icon: "Star", label: "收藏", count: 0 },
  { icon: "FolderOpen", label: "未分组", count: 15 },
];

export const mockCollections: CollectionItem[] = [
  { color: "#ef4444", label: "AI 创业", count: 12 },
  { color: "#f59e0b", label: "Web3 研究", count: 8 },
  { color: "#22c55e", label: "产品设计", count: 10 },
  { color: "#3b82f6", label: "Vibe Coding", count: 14 },
  { color: "#8b5cf6", label: "独立开发", count: 16 },
  { color: "#ec4899", label: "商业·营销", count: 19 },
  { color: "#06b6d4", label: "行业活动", count: 3 },
];

export const mockMetrics: MetricCard[] = [
  {
    id: "active-groups",
    icon: "Radio",
    label: "活跃群",
    value: "163",
    subtitle: "共扫 165 个群",
  },
  {
    id: "total-messages",
    icon: "MessageSquare",
    label: "总消息",
    value: "183,504",
    subtitle: "过去 720h · 平均每群 1112 条",
  },
  {
    id: "key-intel",
    icon: "Target",
    label: "关键情报",
    value: "113",
    subtitle: "需要回复",
    highlight: "cyan",
  },
  {
    id: "silent-groups",
    icon: "VolumeX",
    label: "静默群",
    value: "2",
    subtitle: "过去 720h 无活动",
    highlight: "orange",
  },
];

export const mockBriefing: BriefingNote = {
  generatedAt: "2026-05-28 08:30",
  content:
    "必看：每日情报（2026-05-28, UTC+8）生成时间：2026-05-28 08:30；🔗 资源分享 1: Claude 4 Opus 发布，代码生成准确率提升 35%; 🎯 OpenAI 宣布 GPT-5 Turbo 降价 50%，API 调用成本大幅下降; 📡 Solana 新共识协议上线，TPS 突破 10 万; 🛠 Cursor 1.0 正式版发布，支持多文件上下文编辑; 💡 字节跳动海外支付平台进入东南亚五国; 📊 a16z 发布 2026 AI 基础设施投资报告...",
};

export const mockNotableIntel: NotableIntelItem[] = [
  {
    rank: 1,
    title: "Claude 4 Opus 发布：代码生成准确率提升 35%...",
    linkCount: 18,
    source: "AI创业群",
    author: "Ben",
    time: "09:36",
    tags: [
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
      { label: "可跟进", bgColor: "#4338ca", textColor: "#c7d2fe" },
    ],
  },
  {
    rank: 2,
    title: "OpenAI GPT-5 Turbo 降价 50%，开发者狂欢...",
    linkCount: 15,
    source: "独立开发者联盟",
    author: "Simonlin",
    time: "08:42",
    tags: [
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
    ],
  },
  {
    rank: 3,
    title: "Cursor 1.0 正式版体验报告 ✅...",
    linkCount: 12,
    source: "Vibe Coding群",
    author: "久路逊",
    time: "10:15",
    tags: [
      { label: "机会/需求", bgColor: "#854d0e", textColor: "#fef08a" },
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
    ],
  },
  {
    rank: 4,
    title: "a16z 2026 AI 基础设施投资报告解读 🔗...",
    linkCount: 9,
    source: "AGI指南",
    author: "AGI指南",
    time: "07:50",
    tags: [
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
      { label: "可跟进", bgColor: "#4338ca", textColor: "#c7d2fe" },
    ],
  },
  {
    rank: 5,
    title: "DeepSeek V3 开源版本地部署教程...",
    linkCount: 7,
    source: "AI产品蜻蜓团",
    author: "YF9527",
    time: "11:20",
    tags: [
      { label: "机会/需求", bgColor: "#854d0e", textColor: "#fef08a" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
    ],
  },
];

export const mockActionItems: ActionItem[] = [
  {
    id: "a1",
    category: { label: "看报名/活动", bgColor: "#065f46", textColor: "#34d399" },
    time: "08:30",
    content: "🎯 Claude 4 Opus 开发者内测申请通道已开放",
    source: "AI创业群",
    author: "久路逊",
  },
  {
    id: "a2",
    category: { label: "看买卖/团购", bgColor: "#7c2d12", textColor: "#fb923c" },
    time: "09:15",
    content: "GPT-5 Turbo API 团购折扣，年付再享 8 折",
    source: "独立开发者联盟",
    author: "YF9527",
  },
  {
    id: "a3",
    category: { label: "可回复推荐", bgColor: "#4338ca", textColor: "#a5b4fc" },
    time: "10:20",
    content: "求推荐 AI Agent 自动化运营方案，预算 10 万内",
    source: "AI产品蜻蜓团",
    author: "老叶",
  },
  {
    id: "a4",
    category: { label: "看报名/活动", bgColor: "#065f46", textColor: "#34d399" },
    time: "07:50",
    content: "【线上直播】a16z 合伙人解读 2026 AI 投资趋势",
    source: "AGI指南",
    author: "南乔River",
  },
  {
    id: "a5",
    category: { label: "看报名/活动", bgColor: "#065f46", textColor: "#34d399" },
    time: "11:05",
    content: "Cursor 1.0 发布会回放 + 新功能上手教程",
    source: "Vibe Coding群",
    author: "南乔River",
  },
];

export const mockIntelSources: IntelSource[] = [
  { rank: 1, name: "OpenAI", description: "GPT-4o · 多模态分析引擎", signalCount: 128, groupCount: 12 },
  { rank: 2, name: "DeepSeek", description: "DeepSeek-V3 · 中文语义理解", signalCount: 96, groupCount: 10 },
  { rank: 3, name: "Anthropic", description: "Claude 4 · 长文本推理", signalCount: 87, groupCount: 8 },
  { rank: 4, name: "Google Gemini", description: "Gemini 2.5 Pro · 跨模态情报", signalCount: 64, groupCount: 7 },
  { rank: 5, name: "Microsoft Copilot", description: "GPT-4o + Bing · 实时搜索增强", signalCount: 52, groupCount: 6 },
  { rank: 6, name: "Kimi (月之暗面)", description: "Moonshot-v1 · 超长上下文", signalCount: 41, groupCount: 5 },
];
