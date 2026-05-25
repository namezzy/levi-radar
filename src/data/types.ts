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
