# Prisma Data Model Design — Levi Radar

**Date:** 2026-05-26  
**Status:** Approved  

## Overview

Levi Radar 社群情报雷达系统的 PostgreSQL 数据模型设计。采用 Prisma ORM，覆盖 14 个核心模型，支持消息采集、AI 分析、标签系统、简报生成和同步任务管理。

## Design Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 用户模式 | 单用户 | 个人工具，Workspace 保留为配置容器 |
| ID 策略 | cuid2 | URL 友好，安全，Prisma 原生支持 |
| 删除策略 | 硬删除 | 简单直接 |
| 分析结果存储 | 独立 MessageAnalysis 表 | Message 保持轻量，分析可重跑 |
| Integration 类型 | wechat/feishu/telegram/manual_import | 不含 discord |

## Data Models

### 1. User 用户

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| name | String | 用户名 |
| email | String @unique | 邮箱 |
| avatar | String? | 头像 URL |
| role | UserRole (admin/viewer) | 角色 |
| createdAt | DateTime @default(now()) | 创建时间 |
| updatedAt | DateTime @updatedAt | 更新时间 |

**Relations:** 拥有多个 Workspace

### 2. Workspace 工作区

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| name | String | 工作区名称 |
| description | String? | 描述 |
| ownerId | String | 所属用户 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 User，拥有 Group[], Collection[], Tag[], Briefing[], Integration[]

### 3. Group 社群

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| name | String | 群名 |
| platform | Platform (wechat/feishu/telegram/manual_import) | 平台 |
| externalId | String? | 平台侧 ID |
| avatar | String? | 群头像 |
| memberCount | Int @default(0) | 成员数 |
| workspaceId | String | 所属工作区 |
| collectionId | String? | 所属分类 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Workspace, Collection?，拥有 GroupMember[], Message[]

### 4. GroupMember 社群成员

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| name | String | 昵称 |
| externalId | String | 平台侧用户 ID |
| platform | Platform | 平台 |
| avatar | String? | 头像 |
| role | String? | 群内角色 |
| groupId | String | 所属群 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Indexes:** @@unique([groupId, externalId])  
**Relations:** 属于 Group，发送 Message[]

### 5. Message 消息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| content | String | 消息内容 |
| senderId | String? | 发送者 |
| groupId | String | 所属群 |
| sentAt | DateTime | 发送时间 |
| externalId | String? | 平台消息 ID |
| messageType | String @default("text") | 消息类型 (text/image/file/link) |
| rawPayload | Json? | 原始平台数据 |
| createdAt | DateTime | 入库时间 |
| updatedAt | DateTime | 更新时间 |

**Indexes:** @@index([groupId]), @@index([sentAt]), @@index([groupId, sentAt])  
**Relations:** 属于 Group, GroupMember?，拥有 MessageAnalysis?, Link[], MessageTag[], ActionItem[]

### 6. MessageAnalysis 消息分析结果

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| messageId | String @unique | 关联消息 |
| summary | String? | AI 摘要 |
| category | String | 分类 (market_intel/product_feedback/competitor/opportunity/risk/general) |
| importanceScore | Int @default(0) | 重要性 0-100 |
| actionScore | Int @default(0) | 行动性 0-100 |
| businessScore | Int @default(0) | 商业价值 0-100 |
| isActionable | Boolean @default(false) | 是否需要行动 |
| isMentionMe | Boolean @default(false) | 是否提及我 |
| reason | String? | AI 判断理由 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Indexes:** @@index([category]), @@index([importanceScore])  
**Relations:** 属于 Message (1:1)

### 7. Link 链接

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| url | String | 链接 URL |
| title | String? | 标题 |
| domain | String? | 域名 |
| messageId | String | 来源消息 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Message

### 8. Tag 标签

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| name | String | 标签名 |
| color | String @default("#06b6d4") | 颜色 |
| workspaceId | String | 所属工作区 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Indexes:** @@unique([workspaceId, name])  
**Relations:** 属于 Workspace，通过 MessageTag 关联 Message[]

### 9. MessageTag 消息标签关系

| 字段 | 类型 | 说明 |
|------|------|------|
| messageId | String | 消息 ID |
| tagId | String | 标签 ID |

**Indexes:** @@id([messageId, tagId])  
**Relations:** 属于 Message, Tag

### 10. Briefing 简报

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| type | BriefingType (daily/weekly/monthly) | 类型 |
| title | String | 标题 |
| content | String (Text) | 简报正文 |
| highlights | Json? | 重点摘要 JSON |
| date | DateTime | 简报日期 |
| workspaceId | String | 所属工作区 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Workspace

### 11. ActionItem 行动项

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| title | String | 标题 |
| description | String? | 描述 |
| status | ActionStatus (pending/done/ignored) | 状态 |
| priority | Int @default(0) | 优先级 0-100 |
| dueDate | DateTime? | 截止日期 |
| messageId | String? | 来源消息 |
| workspaceId | String | 所属工作区 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Message?, Workspace

### 12. Collection 群组分类

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| name | String | 分类名 |
| color | String @default("#06b6d4") | 颜色 |
| workspaceId | String | 所属工作区 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Workspace，拥有 Group[]

### 13. Integration 第三方集成

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| platform | Platform | 平台 |
| name | String | 集成名称 |
| config | Json? | 配置 (token/webhook 等) |
| status | IntegrationStatus (active/inactive) | 状态 |
| workspaceId | String | 所属工作区 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Workspace，拥有 SyncJob[]

### 14. SyncJob 同步任务

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String @id @default(cuid()) | 主键 |
| integrationId | String | 集成 ID |
| status | SyncStatus (pending/running/completed/failed) | 状态 |
| startedAt | DateTime? | 开始时间 |
| completedAt | DateTime? | 完成时间 |
| messageCount | Int @default(0) | 同步消息数 |
| errorLog | String? | 错误日志 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**Relations:** 属于 Integration

## Enums

```
UserRole: admin, viewer
Platform: wechat, feishu, telegram, manual_import
BriefingType: daily, weekly, monthly
ActionStatus: pending, done, ignored
IntegrationStatus: active, inactive
SyncStatus: pending, running, completed, failed
```

## Index Strategy

| 表 | 索引 | 类型 |
|-----|------|------|
| Message | groupId | 单字段 |
| Message | sentAt | 单字段 |
| Message | groupId + sentAt | 复合索引 |
| MessageAnalysis | category | 单字段 |
| MessageAnalysis | importanceScore | 单字段 |
| GroupMember | groupId + externalId | 唯一约束 |
| Tag | workspaceId + name | 唯一约束 |
| MessageTag | messageId + tagId | 复合主键 |

## Entity Relationship Summary

```
User 1:N Workspace
Workspace 1:N Group, Collection, Tag, Briefing, Integration, ActionItem
Collection 1:N Group
Group 1:N GroupMember, Message
GroupMember 1:N Message
Message 1:1 MessageAnalysis
Message 1:N Link, MessageTag, ActionItem
Tag 1:N MessageTag
Integration 1:N SyncJob
```

## Seed Data Plan

Mock 数据包含：
- 1 个 User (admin)
- 1 个 Workspace ("Levi's Radar")
- 2 个 Collection ("行业群", "客户群")
- 4 个 Group (各平台各一个)
- 每群 3-5 个 GroupMember
- 每群 5-10 条 Message + MessageAnalysis
- 5 个 Tag
- 1 个 daily Briefing
- 3 个 ActionItem
- 2 个 Integration + 各 1 个 SyncJob
