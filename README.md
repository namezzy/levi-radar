# 🛰️ Levi Radar — 社群情报雷达

> 社群情报雷达系统，聚合微信群、飞书群、Telegram 群、Discord 群等社群消息，自动分析有价值信息，生成每日情报看板。

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 功能特性

- 📊 **情报看板 (Dashboard)** — 每日情报驾驶舱，一览全局
- 📈 **指标卡片** — 活跃群、总消息、关键情报、静默群实时统计
- 📋 **Briefing Note** — AI 生成的每日情报简报，一键复制
- 🔥 **最值得关注** — 高信号情报排行，带分类标签
- ⚡ **可行动项** — 可跟进的报名/活动/团购/推荐
- 👤 **情报源排行** — 高价值信息贡献者排名
- 🗂️ **群组管理** — 按集合分类管理 165+ 群组
- 🌊 **深海蓝主题** — 极暗背景 + Cyan 主色调，科技感十足

## 📸 页面模块

| 模块 | 说明 |
|------|------|
| 侧边栏 | Logo + 导航菜单（Brief/Live/Cross/Link）+ 群组分类 + 集合列表 |
| 顶部栏 | DAILY INTELLIGENCE 标题 + 日期选择 + 周期切换 + 全量同步 |
| 指标卡片 | 4 列数据卡片，Cyan/Orange 高亮关键指标 |
| 情报简报 | 段落式摘要 + 复制按钮 |
| 三栏布局 | 最值得关注 · 可行动项 · 情报源 |

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Next.js 14](https://nextjs.org/) | App Router 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 原子化样式 |
| [shadcn/ui](https://ui.shadcn.com/) | Radix UI 组件 |
| [Lucide React](https://lucide.dev/) | 图标库 |
| [Recharts](https://recharts.org/) | 图表（预留） |
| [Zustand](https://zustand-demo.pmnd.rs/) | 状态管理（预留） |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/namezzy/levi-radar.git
cd levi-radar

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局（暗色主题 + Geist 字体）
│   ├── page.tsx                # Dashboard 看板页
│   └── globals.css             # 全局样式 + Ocean Dark 主题
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx         # 侧边栏（导航 + 群组 + 集合 + 状态）
│   │   └── header.tsx          # 顶部栏（标题 + 日期 + 筛选 + 同步）
│   └── dashboard/
│       ├── metric-cards.tsx    # 4 指标卡片
│       ├── briefing-note.tsx   # 情报简报
│       ├── notable-intel.tsx   # 最值得关注列表
│       ├── action-items.tsx    # 可行动项列表
│       └── intel-sources.tsx   # 情报源排行
├── data/
│   ├── types.ts                # TypeScript 接口定义
│   └── mock.ts                 # Mock 数据
└── lib/
    └── utils.ts                # cn() 工具函数
```

## 🎨 设计系统

### 配色方案 — Ocean Dark（深海蓝）

| 用途 | 色值 |
|------|------|
| 页面背景 | `#060b14` |
| 侧边栏背景 | `#040810` |
| 卡片背景 | `#0d1a2d` |
| 边框 | `#142540` |
| 主色 Primary | `#06b6d4` (Cyan) |
| 成功/上升 | `#34d399` (Emerald) |
| 警告/橙色 | `#fb923c` (Orange) |
| 危险/红色 | `#ef4444` (Red) |

### 群组来源配色

| 来源 | 色值 |
|------|------|
| 微信 WeChat | `#22c55e` 🟢 |
| 飞书 Feishu | `#3b82f6` 🔵 |
| Telegram | `#8b5cf6` 🟣 |
| Discord | `#6366f1` 🔵 |

## 🗺️ 路线图

- [x] Dashboard 情报看板 MVP
- [ ] 信号流 (Live) — 实时消息流
- [ ] 话题雷达 (Cross) — 跨群话题追踪
- [ ] 链接情报 (Link) — URL 聚合分析
- [ ] 后端 API + 数据库 (Prisma + PostgreSQL)
- [ ] 群消息采集 Daemon
- [ ] AI 智能摘要与分类
- [ ] 用户认证与权限管理

## 📄 License

MIT
