# Levi Radar Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-themed community intelligence radar dashboard MVP using Next.js 14 with mock data, featuring a wide sidebar, metric cards, briefing note, and a three-column intel layout.

**Architecture:** Client-side rendered dashboard with static mock data. A wide sidebar provides navigation and group management. The main content area displays daily intelligence metrics, a briefing summary, and three intel columns (notable intel, actionable items, intel sources). All components are React Server Components by default; no client interactivity beyond static rendering in MVP.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React icons, Recharts (charts), shadcn/ui patterns (cn utility)

---

## File Structure

```
src/
├── lib/
│   └── utils.ts                        -- cn() utility function (clsx + tailwind-merge)
├── data/
│   ├── types.ts                        -- TypeScript interfaces for all data models
│   └── mock.ts                         -- All mock data (metrics, briefing, intel, groups, collections)
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                 -- Wide sidebar (logo, nav, groups, collections, daemon status)
│   │   └── header.tsx                  -- Top header (title, date picker, period tabs, sync button)
│   └── dashboard/
│       ├── metric-cards.tsx            -- 4 metric cards row
│       ├── briefing-note.tsx           -- Briefing note paragraph section
│       ├── notable-intel.tsx           -- "Most Notable" ranked list (left column)
│       ├── action-items.tsx            -- "Actionable Items" list (middle column)
│       └── intel-sources.tsx           -- "Intel Sources" ranked list (right column)
├── app/
│   ├── globals.css                     -- Tailwind directives + CSS custom properties for Ocean Dark theme
│   ├── layout.tsx                      -- Root layout (dark body, Geist fonts)
│   └── page.tsx                        -- Dashboard page (assembles sidebar + header + all dashboard components)
└── tailwind.config.ts                  -- Extended with Ocean Dark color tokens
```

---

### Task 1: Foundation — Utility, Types, and Theme Configuration

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/data/types.ts`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the `cn()` utility**

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create TypeScript interfaces**

Create `src/data/types.ts`:

```typescript
export type GroupSource = "wechat" | "feishu" | "telegram" | "discord";

export interface MetricCard {
  id: string;
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  highlight?: "cyan" | "orange";
}

export interface BriefingNote {
  generatedAt: string;
  content: string;
}

export interface IntelTag {
  label: string;
  bgColor: string;
  textColor: string;
}

export interface NotableIntelItem {
  rank: number;
  title: string;
  linkCount: number;
  source: string;
  author: string;
  time: string;
  tags: IntelTag[];
}

export interface ActionItem {
  id: string;
  category: IntelTag;
  time: string;
  content: string;
  source: string;
  author: string;
}

export interface IntelSource {
  rank: number;
  name: string;
  description: string;
  signalCount: number;
  groupCount: number;
}

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  badge: string;
  badgeColor: string;
  active?: boolean;
}

export interface GroupItem {
  icon: string;
  label: string;
  count: number;
}

export interface CollectionItem {
  color: string;
  label: string;
  count: number;
}
```

- [ ] **Step 3: Configure Tailwind with Ocean Dark color tokens**

Replace the entire content of `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060b14",
        "sidebar-bg": "#040810",
        "card-bg": "#0d1a2d",
        "card-inner": "#0f1f35",
        "border-line": "#142540",
        primary: "#06b6d4",
        success: "#34d399",
        warning: "#fb923c",
        danger: "#ef4444",
        "text-primary": "#f1f5f9",
        "text-secondary": "#94a3b8",
        "text-muted": "#475569",
        "text-label": "#64748b",
        "source-wechat": "#22c55e",
        "source-feishu": "#3b82f6",
        "source-telegram": "#8b5cf6",
        "source-discord": "#6366f1",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Set up globals.css with dark theme**

Replace the entire content of `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  scrollbar-width: thin;
  scrollbar-color: #142540 transparent;
}

body {
  background: #060b14;
  color: #f1f5f9;
  font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}
```

- [ ] **Step 5: Update root layout for dark theme**

Replace the entire content of `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Levi Radar — 社群情报雷达",
  description: "社群情报雷达系统，聚合社群消息，生成每日情报看板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils.ts src/data/types.ts tailwind.config.ts src/app/globals.css src/app/layout.tsx
git commit -m "feat: foundation — cn utility, types, Ocean Dark theme config"
```

---

### Task 2: Mock Data

**Files:**
- Create: `src/data/mock.ts`

- [ ] **Step 1: Create all mock data**

Create `src/data/mock.ts`:

```typescript
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
  { rank: 1, name: "南乔River", description: "🔺前发AI团 🔺ShowMeAI", signalCount: 5, groupCount: 2 },
  { rank: 2, name: "Deathhush", description: "481702@chatroom · 工具/...", signalCount: 5, groupCount: 1 },
  { rank: 3, name: "火星人", description: "7-TGO和朋友们的AGI", signalCount: 4, groupCount: 1 },
  { rank: 4, name: "千寻", description: "Simonlin学术交流", signalCount: 4, groupCount: 1 },
  { rank: 5, name: "李华荣", description: "Vibe Coding 编程群", signalCount: 4, groupCount: 1 },
  { rank: 6, name: "BU红薯", description: "智能体成精了🌸 Life Hacker", signalCount: 3, groupCount: 1 },
];
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/data/mock.ts
git commit -m "feat: add mock data for dashboard"
```

---

### Task 3: Sidebar Component

**Files:**
- Create: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create the sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
import {
  LayoutDashboard,
  Radio,
  Radar,
  Link,
  ClipboardList,
  Star,
  FolderOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockNavItems, mockGroups, mockCollections } from "@/data/mock";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Radio,
  Radar,
  Link,
  ClipboardList,
  Star,
  FolderOpen,
};

export function Sidebar() {
  return (
    <aside className="w-[200px] bg-sidebar-bg flex flex-col border-r border-border-line shrink-0 overflow-y-auto">
      <div className="p-3 pb-0">
        {/* Logo */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-primary text-[13px] font-bold tracking-wider">
              LEVI RADAR
            </div>
            <div className="text-text-muted text-[10px]">社群情报雷达</div>
          </div>
          <Settings className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 mt-3">
          {mockNavItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-[7px] rounded-md cursor-pointer transition-colors",
                  item.active
                    ? "bg-primary/10"
                    : "hover:bg-white/5"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      item.active ? "text-text-primary" : "text-text-secondary"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs flex-1",
                    item.active ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Groups */}
        <div className="mt-5">
          <div className="text-text-muted text-[10px] font-semibold tracking-widest px-2 mb-1.5">
            GROUPS
          </div>
          <div className="flex flex-col gap-px">
            {mockGroups.map((group) => {
              const Icon = iconMap[group.icon];
              return (
                <div
                  key={group.label}
                  className="flex items-center gap-2 px-2 py-[5px] rounded cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-text-secondary" />}
                  <span className="text-[11px] text-[#cbd5e1] flex-1">
                    {group.label}
                  </span>
                  <span className="text-[11px] text-text-label">
                    {group.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collections */}
        <div className="mt-4">
          <div className="text-text-muted text-[10px] font-semibold tracking-widest px-2 mb-1.5">
            COLLECTIONS
          </div>
          <div className="flex flex-col gap-px">
            {mockCollections.map((col) => (
              <div
                key={col.label}
                className="flex items-center gap-2 px-2 py-[5px] rounded cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-[11px] text-[#cbd5e1] flex-1">
                  {col.label}
                </span>
                <span className="text-[11px] text-text-label">{col.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Daemon status */}
      <div className="p-3 pt-0">
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#081020] rounded-md">
          <div className="w-1.5 h-1.5 bg-success rounded-full" />
          <span className="text-text-label text-[10px]">daemon 运行中</span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: add sidebar component with nav, groups, collections"
```

---

### Task 4: Header Component

**Files:**
- Create: `src/components/layout/header.tsx`

- [ ] **Step 1: Create the header component**

Create `src/components/layout/header.tsx`:

```tsx
"use client";

import { Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const periods = ["日", "周", "月", "季", "年", "自定义"];

export function Header() {
  return (
    <header className="px-5 pt-3.5 pb-3 bg-background border-b border-border-line shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <div className="text-text-muted text-[10px] font-semibold tracking-widest">
            DAILY INTELLIGENCE
          </div>
          <h1 className="text-text-primary text-base font-bold">
            驾驶舱 · 情报看板
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Date picker */}
          <div className="flex items-center gap-1.5 px-3 py-[5px] bg-card-bg rounded-md border border-border-line">
            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-text-secondary text-xs">2026/05/25</span>
          </div>
          {/* Period tabs */}
          <div className="flex gap-px bg-card-bg rounded-md p-0.5">
            {periods.map((p) => (
              <button
                key={p}
                className={cn(
                  "px-2 py-[3px] text-[11px] rounded transition-colors",
                  p === "周"
                    ? "bg-primary/20 text-primary"
                    : "text-text-label hover:text-text-secondary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Sync button */}
          <button className="flex items-center gap-1.5 px-3 py-[5px] bg-primary text-[#060b14] text-[11px] font-semibold rounded-md hover:bg-primary/90 transition-colors">
            <RefreshCw className="w-3 h-3" />
            全量同步
          </button>
        </div>
      </div>
      <div className="text-text-muted text-[11px]">
        2026-05-24 ~ 2026-05-25 · 共 165 个群
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add header component with date picker, period tabs, sync button"
```

---

### Task 5: Metric Cards Component

**Files:**
- Create: `src/components/dashboard/metric-cards.tsx`

- [ ] **Step 1: Create the metric cards component**

Create `src/components/dashboard/metric-cards.tsx`:

```tsx
import {
  Radio,
  MessageSquare,
  Target,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockMetrics } from "@/data/mock";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Radio,
  MessageSquare,
  Target,
  VolumeX,
};

export function MetricCards() {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {mockMetrics.map((metric) => {
        const Icon = iconMap[metric.icon];
        return (
          <div
            key={metric.id}
            className="bg-card-bg rounded-lg p-3.5 border border-border-line"
          >
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-text-label" />}
                <span className="text-text-label text-[11px]">
                  {metric.label}
                </span>
              </div>
              <span className="text-text-muted text-[9px] tracking-widest">
                METRIC
              </span>
            </div>
            <div
              className={cn(
                "text-[32px] font-normal mt-1 leading-tight",
                metric.highlight === "cyan" && "text-primary",
                metric.highlight === "orange" && "text-warning",
                !metric.highlight && "text-text-primary"
              )}
            >
              {metric.value}
            </div>
            <div className="text-text-muted text-[10px] mt-0.5">
              {metric.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/metric-cards.tsx
git commit -m "feat: add metric cards component"
```

---

### Task 6: Briefing Note Component

**Files:**
- Create: `src/components/dashboard/briefing-note.tsx`

- [ ] **Step 1: Create the briefing note component**

Create `src/components/dashboard/briefing-note.tsx`:

```tsx
"use client";

import { ClipboardList, Copy } from "lucide-react";
import { mockBriefing } from "@/data/mock";

export function BriefingNote() {
  const handleCopy = () => {
    navigator.clipboard.writeText(mockBriefing.content);
  };

  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-text-secondary" />
          <span className="text-text-primary text-[13px] font-semibold">
            BRIEFING NOTE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[10px]">今日情报简报</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#081020] rounded text-text-secondary text-[11px] hover:bg-border-line transition-colors"
          >
            <Copy className="w-3 h-3" />
            复制摘要
          </button>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-[1.7]">
        {mockBriefing.content}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/briefing-note.tsx
git commit -m "feat: add briefing note component with copy button"
```

---

### Task 7: Notable Intel Component

**Files:**
- Create: `src/components/dashboard/notable-intel.tsx`

- [ ] **Step 1: Create the notable intel component**

Create `src/components/dashboard/notable-intel.tsx`:

```tsx
import { Flame, ExternalLink } from "lucide-react";
import { mockNotableIntel } from "@/data/mock";

const rankColors = ["text-primary", "text-primary/80", "text-primary/60", "text-primary/40", "text-primary/30"];

export function NotableIntel() {
  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-warning" />
          <span className="text-text-primary text-[13px] font-semibold">
            最值得关注
          </span>
        </div>
        <span className="text-primary text-[10px]">
          {mockNotableIntel.length} 条高信号
        </span>
      </div>
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {mockNotableIntel.map((item) => (
          <div
            key={item.rank}
            className="p-2.5 bg-card-inner rounded-md"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`font-bold text-[13px] ${rankColors[item.rank - 1] || rankColors[rankColors.length - 1]}`}
              >
                {item.rank}
              </span>
              <span className="text-[#e2e8f0] text-xs flex-1 truncate">
                {item.title}
              </span>
              <span className="text-text-muted text-[10px] flex items-center gap-0.5 shrink-0">
                {item.linkCount}
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="text-text-label text-[10px] mb-1.5">
              {item.source} · {item.author} {item.time}
            </div>
            <div className="flex gap-1 flex-wrap">
              {item.tags.map((tag) => (
                <span
                  key={tag.label}
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: tag.bgColor,
                    color: tag.textColor,
                  }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/notable-intel.tsx
git commit -m "feat: add notable intel ranked list component"
```

---

### Task 8: Action Items Component

**Files:**
- Create: `src/components/dashboard/action-items.tsx`

- [ ] **Step 1: Create the action items component**

Create `src/components/dashboard/action-items.tsx`:

```tsx
import { Zap } from "lucide-react";
import { mockActionItems } from "@/data/mock";

export function ActionItems() {
  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-text-primary text-[13px] font-semibold">
            可行动项
          </span>
        </div>
        <span className="text-warning text-[10px]">
          {mockActionItems.length} 个可跟进
        </span>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {mockActionItems.map((item) => (
          <div
            key={item.id}
            className="p-2 bg-card-inner rounded-md"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: item.category.bgColor,
                  color: item.category.textColor,
                }}
              >
                {item.category.label}
              </span>
              <span className="text-text-muted text-[10px] ml-auto">
                {item.time}
              </span>
            </div>
            <div className="text-[#e2e8f0] text-[11px] leading-relaxed">
              {item.content}
            </div>
            <div className="text-text-muted text-[10px] mt-1">
              {item.source} · {item.author}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/action-items.tsx
git commit -m "feat: add action items component"
```

---

### Task 9: Intel Sources Component

**Files:**
- Create: `src/components/dashboard/intel-sources.tsx`

- [ ] **Step 1: Create the intel sources component**

Create `src/components/dashboard/intel-sources.tsx`:

```tsx
import { User } from "lucide-react";
import { mockIntelSources } from "@/data/mock";

const rankColors = ["text-primary", "text-primary/80", "text-primary/60", "text-primary/40", "text-primary/30", "text-primary/25"];

export function IntelSources() {
  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-text-secondary" />
          <span className="text-text-primary text-[13px] font-semibold">
            情报源
          </span>
        </div>
        <span className="text-text-label text-[10px]">
          {mockIntelSources.length} 人
        </span>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
        {mockIntelSources.map((source) => (
          <div
            key={source.rank}
            className="flex items-center gap-2 px-1.5 py-1.5"
          >
            <span
              className={`font-bold w-4 text-xs ${rankColors[source.rank - 1] || rankColors[rankColors.length - 1]}`}
            >
              {source.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[#e2e8f0] text-xs">{source.name}</div>
              <div className="text-text-muted text-[9px] truncate">
                {source.description}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-sm font-bold ${rankColors[source.rank - 1] || rankColors[rankColors.length - 1]}`}
              >
                {source.signalCount}
              </div>
              <div className="text-text-muted text-[9px]">
                {source.groupCount} 群
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/intel-sources.tsx
git commit -m "feat: add intel sources ranked list component"
```

---

### Task 10: Dashboard Page Assembly

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Assemble the dashboard page**

Replace the entire content of `src/app/page.tsx`:

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { BriefingNote } from "@/components/dashboard/briefing-note";
import { NotableIntel } from "@/components/dashboard/notable-intel";
import { ActionItems } from "@/components/dashboard/action-items";
import { IntelSources } from "@/components/dashboard/intel-sources";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
          <MetricCards />
          <BriefingNote />
          <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-2.5 flex-1 min-h-[200px]">
            <NotableIntel />
            <ActionItems />
            <IntelSources />
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Start dev server and visually verify**

Run: `cd D:\Code\Copilot-AI\Levi-radar\levi-radar && npm run dev`
Expected: Dev server starts at http://localhost:3000. Open in browser and verify:
- Dark background (#060b14)
- Sidebar with logo, nav items, groups, collections, daemon status
- Header with title, date picker, period tabs, sync button
- 4 metric cards with correct values and colors
- Briefing note with copy button
- Three-column layout at bottom: notable intel, action items, intel sources

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble dashboard page with all components"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Wide sidebar with logo, nav (Brief/Live/Cross/Link), groups, collections, daemon status — Task 3
- ✅ Header with DAILY INTELLIGENCE title, date picker, period tabs, sync button — Task 4
- ✅ 4 metric cards (活跃群/总消息/关键情报/静默群) with METRIC label — Task 5
- ✅ BRIEFING NOTE with paragraph summary + copy button — Task 6
- ✅ 最值得关注 ranked list with tags — Task 7
- ✅ 可行动项 with category tags — Task 8
- ✅ 情报源 ranked list — Task 9
- ✅ Ocean Dark color theme — Task 1
- ✅ Font-weight 400 for numbers — Task 5 (font-normal)
- ✅ Chinese/English mixed UI — All components
- ✅ Mock data for all sections — Task 2

**Placeholder scan:** No TBD/TODO/placeholder text found. ✅

**Type consistency:** All types defined in Task 1 (types.ts) match usage in Tasks 2-9. Icon string names in mock data match iconMap keys in components. ✅
