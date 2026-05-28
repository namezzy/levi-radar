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
  generatedAt: "2026-05-25 08:30",
  content:
    "必看：每日情报（2026-05-25, UTC+8）生成时间：2026-05-25 08:30；🔗 资源分享 1: [8天, 120美元] AI Agent 创业实战课程; 🎯 GPT-5 正式发布，多模态推理能力显著提升; 📡 Ethereum Pectra 升级后 Gas 费降低 40%，DeFi 生态迎来新机遇; 🛠 Figma AI 设计助手开放内测申请; 💡 Stripe 在东南亚开放本地支付渠道; 📊 Y Combinator 2026 夏季批次申请截止日期提前至 6 月 1 日...",
};

export const mockNotableIntel: NotableIntelItem[] = [
  {
    rank: 1,
    title: "GPT-5 发布：多模态推理能力...",
    linkCount: 12,
    source: "AI创业群",
    author: "Ben",
    time: "17:36",
    tags: [
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
      { label: "可跟进", bgColor: "#4338ca", textColor: "#c7d2fe" },
    ],
  },
  {
    rank: 2,
    title: "Ethereum Pectra 升级分析...",
    linkCount: 12,
    source: "Web3研究组",
    author: "Simonlin",
    time: "10:37",
    tags: [
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
    ],
  },
  {
    rank: 3,
    title: "AI Agent 框架选型指南 ✅...",
    linkCount: 12,
    source: "独立开发者联盟",
    author: "久路逊",
    time: "09:56",
    tags: [
      { label: "机会/需求", bgColor: "#854d0e", textColor: "#fef08a" },
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
    ],
  },
  {
    rank: 4,
    title: "通往AGI之路 知识库更新 🔗...",
    linkCount: 12,
    source: "AGI指南",
    author: "AGI指南",
    time: "09:04",
    tags: [
      { label: "工具/产品", bgColor: "#0e7490", textColor: "#cffafe" },
      { label: "链接信号", bgColor: "#065f46", textColor: "#a7f3d0" },
      { label: "可跟进", bgColor: "#4338ca", textColor: "#c7d2fe" },
    ],
  },
  {
    rank: 5,
    title: "是搞 8G版本, 还是 64G版本呀...",
    linkCount: 12,
    source: "AI产品蜻蜓团",
    author: "YF9527",
    time: "00:55",
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
    time: "09:56",
    content: "🎯 AI Agent 创业实战课程 8 天速成班，120 美元",
    source: "AI创业群",
    author: "久路逊",
  },
  {
    id: "a2",
    category: { label: "看买卖/团购", bgColor: "#7c2d12", textColor: "#fb923c" },
    time: "01:30",
    content: "安克充电宝团购价 ¥300，20 人以上成团",
    source: "产品经理交流群",
    author: "YF9527",
  },
  {
    id: "a3",
    category: { label: "可回复推荐", bgColor: "#4338ca", textColor: "#a5b4fc" },
    time: "16:50",
    content: "求推荐 CLIProxyAPI 作者的联系方式",
    source: "独立开发者联盟",
    author: "老叶",
  },
  {
    id: "a4",
    category: { label: "看报名/活动", bgColor: "#065f46", textColor: "#34d399" },
    time: "09:35",
    content: "【活动报名】硬件开发者看过来",
    source: "AGI Bar Friends 3群",
    author: "南乔River",
  },
  {
    id: "a5",
    category: { label: "看报名/活动", bgColor: "#065f46", textColor: "#34d399" },
    time: "19:41",
    content: "需要双语互相翻译的实时会议软件",
    source: "ShowMeAI",
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
