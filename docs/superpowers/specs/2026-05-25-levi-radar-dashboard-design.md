# Levi Radar — 社群情报雷达系统 设计文档

## 产品定位

社群情报雷达系统，用于聚合微信群、飞书群、Telegram 群、Discord 群等社群消息，自动分析有价值信息，生成每日情报看板。

当前阶段：**前端看板 MVP**，使用 mock 数据。

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui（Radix UI 组件）
- Recharts（图表）
- Zustand（状态管理）
- Lucide React（图标）

## 设计决策

### 布局方案
**宽文字侧边栏 + 主内容区**（参考 QIAOMU RADAR / Notion 风格）

侧边栏（~200px）包含：
- Logo + 应用名（LEVI RADAR）+ 设置入口
- 导航菜单（看板 Brief / 信号流 Live / 话题雷达 Cross / 链接情报 Link），每项带彩色标签
- GROUPS 分区（所有群 / 收藏 / 未分组 + 计数）
- COLLECTIONS 分区（按主题分类的群组列表，带色点标识 + 计数）
- 底部 daemon 运行状态

### 配色方案
**深海蓝 (Ocean Dark)** — 极暗背景 + Cyan 主色调

色板：
- 页面背景: `#060b14`
- 侧边栏背景: `#040810`
- 卡片背景: `#0d1a2d`
- 卡片内嵌背景: `#0f1f35`
- 边框: `#142540`
- 主色 (Primary): `#06b6d4` (Cyan 500)
- 成功/上升: `#34d399` (Emerald 400)
- 警告/橙色: `#fb923c` (Orange 400)
- 危险/红色: `#ef4444` (Red 500)
- 文字主色: `#f1f5f9` (Slate 100)
- 文字次色: `#94a3b8` (Slate 400)
- 文字弱色: `#475569` (Slate 600)
- 标签文字: `#64748b` (Slate 500)

### 界面语言
中英混合：标题中文，数据标签英文。

### 字体风格
数字使用细字重（font-weight: 400），非粗体风格。

## 页面结构

### Dashboard 看板页（MVP 核心页面）

#### 顶部区域
- 小标题 `DAILY INTELLIGENCE`（英文标签）
- 主标题 `驾驶舱 · 情报看板`
- 日期范围显示
- 右侧控件：日期选择器 + 周期切换（日/周/月/季/年/自定义）+ 全量同步按钮

#### 4 个指标卡片（横排）
1. **活跃群** — 数量 + "共扫 N 个群"
2. **总消息** — 数量 + "过去 720h · 平均每群 N 条"
3. **关键情报** — 数量（Cyan 高亮）+ "需要回复"
4. **静默群** — 数量（Orange 高亮）+ "过去 720h 无活动"

每张卡片右上角有 `METRIC` 标签。

#### BRIEFING NOTE（情报简报）
- 横跨全宽的卡片
- 左侧：📋 图标 + `BRIEFING NOTE` 标题
- 右侧：`今日情报简报` 说明文字 + `📋 复制摘要` 按钮
- 内容：段落式摘要文字，包含 emoji 标记的关键信息

#### 三栏底部区域

**左栏 — 最值得关注**
- 标题 + "N 条高信号" 计数
- 排名列表，每条包含：序号 + 标题摘要 + 链接计数 + 来源群组和作者 + 时间 + 彩色分类标签（工具/产品、链接信号、可跟进、机会/需求等）

**中栏 — 可行动项**
- 标题 + "N 个可跟进" 计数
- 列表项，每条包含：分类标签（看报名/活动、看买卖/团购、可回复推荐）+ 时间 + 内容描述 + 来源群组和作者

**右栏 — 情报源**
- 标题 + "N 人" 计数
- 排名列表，每条包含：序号 + 用户名 + 所在群组描述 + 贡献信号数 + 活跃群数

### 群组来源标识

4 种群组来源，各有对应配色：
- 微信（WeChat）— 绿色 `#22c55e`
- 飞书（Feishu）— 蓝色 `#3b82f6`
- Telegram — 紫色 `#8b5cf6`
- Discord — 靛蓝色 `#6366f1`

### 侧边栏导航页面（占位）

MVP 阶段仅实现 Dashboard 看板页面，其余页面显示占位内容：
- 信号流 (Live) — "Coming Soon"
- 话题雷达 (Cross) — "Coming Soon"
- 链接情报 (Link) — "Coming Soon"

## Mock 数据设计

所有数据使用静态 mock，存放在 `src/data/mock.ts`：

- `mockMetrics` — 4 个指标卡片数据
- `mockBriefing` — 情报简报段落文字
- `mockNotableIntel` — 最值得关注列表（8 条）
- `mockActionItems` — 可行动项列表（5 条）
- `mockIntelSources` — 情报源排行（8 人）
- `mockGroups` — 群组列表（含来源类型、消息数、分类集合）
- `mockCollections` — 分类集合（含颜色、名称、群数）

## 组件拆分

```
src/
├── app/
│   ├── layout.tsx          -- 根布局（暗色主题 + 字体）
│   ├── page.tsx            -- Dashboard 页面（组装所有看板组件）
│   └── globals.css         -- Tailwind + CSS 变量
├── components/
│   ├── ui/                 -- shadcn/ui 基础组件
│   │   └── ... (button, card, badge, tabs, scroll-area, separator, tooltip)
│   ├── layout/
│   │   ├── sidebar.tsx     -- 侧边栏（导航 + 群组 + 集合 + 状态）
│   │   └── header.tsx      -- 顶部区域（标题 + 日期 + 筛选控件）
│   └── dashboard/
│       ├── metric-cards.tsx    -- 4 指标卡片行
│       ├── briefing-note.tsx   -- 情报简报区块
│       ├── notable-intel.tsx   -- 最值得关注列表
│       ├── action-items.tsx    -- 可行动项列表
│       └── intel-sources.tsx   -- 情报源排行
├── data/
│   └── mock.ts             -- 所有 mock 数据
└── lib/
    └── utils.ts            -- cn() 工具函数
```

## 不做（YAGNI）

- 不做后端 API / 数据库（MVP 用 mock 数据）
- 不做用户认证/登录
- 不做实时消息推送
- 不做群消息抓取 daemon
- 不做移动端响应式（先桌面端）
- 不做国际化（中英混合硬编码）
- 不做 Prisma/PostgreSQL 配置（非 MVP 范围）
