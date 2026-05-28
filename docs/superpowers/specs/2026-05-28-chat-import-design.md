# 聊天记录导入功能设计

## 概述

用户可上传 TXT/CSV/JSON 格式的聊天记录文件，系统解析后写入数据库（Message 表），并同步触发 AI 分析。

## 架构

```
/import 页面 (Client Component)
  ├── 文件选择 (drag & drop + input)
  ├── 格式选择 (TXT / CSV / JSON)
  ├── 社群选择 (已有 Group 下拉 / 新建)
  └── 提交 → Server Action
        ├── 解析文件内容
        ├── 校验 (Zod)
        ├── 去重检查 (groupId + senderName + content + sentAt)
        ├── 批量写入 Message 表
        ├── 自动创建/复用 GroupMember
        ├── 同步调用 analyzeMessage
        └── 返回统计结果
```

## 文件格式规范

### TXT
```
[2026-05-23 09:56] 张三：我们正在找一个 AI Agent 产品经理
[2026-05-23 10:21] 李四：这里有一个不错的工具链接 https://example.com
```
正则解析：`/^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]\s+(.+?)：(.+)$/`

### CSV
字段：`senderName,content,sentAt,messageType`
- 首行为表头，UTF-8 编码
- sentAt 支持 ISO 8601 或 `YYYY-MM-DD HH:mm` 格式
- messageType 可选，默认 `text`

### JSON
```json
[
  {
    "senderName": "张三",
    "content": "消息内容",
    "sentAt": "2026-05-23T09:56:00+08:00",
    "messageType": "text"
  }
]
```

## 数据模型交互

### Group 处理
- 用户可选择已有 Group（从 DB 查询下拉列表）
- 或输入新 Group 名称，自动创建，platform 设为 `manual_import`
- 新 Group 关联默认 Workspace（系统中第一个 Workspace）

### GroupMember 处理
- 根据 senderName 在目标 Group 中查找已有成员
- 不存在则自动创建，externalId 设为 `manual_{senderName}_{timestamp}`，platform 为 `manual_import`

### Message 去重
- 四字段组合判重：`groupId + senderName + content + sentAt`
- 查询逻辑：在目标 Group 中查找 sentAt 相同、content 相同且发送者名称相同的消息
- 命中则跳过，计入 `skipped` 计数

### AI 分析
- 每条成功导入的消息同步调用 `analyzeMessage()`
- 传入 `messageId` 以便持久化分析结果到 MessageAnalysis 表
- AI 分析失败不阻塞导入，仅记录失败数

## 文件结构

```
src/
├── app/
│   └── import/
│       ├── page.tsx          # Client Component 上传页面
│       └── actions.ts        # Server Action: importChatRecords
├── lib/
│   └── import/
│       ├── parsers.ts        # TXT/CSV/JSON 解析器
│       └── schemas.ts        # Zod 校验 schema
```

## 组件设计

### /import 页面
- **文件上传区**：拖拽或点击选择文件，显示文件名和大小
- **格式选择**：自动根据扩展名识别，可手动覆盖
- **社群选择**：下拉选已有 Group + "新建社群" 选项（输入名称）
- **导入按钮**：提交后显示 loading 状态
- **结果面板**：导入完成后显示统计
  - 总消息数 / 成功导入 / 重复跳过 / 解析失败 / AI 分析成功 / AI 分析失败

### 侧边栏
- 在 `mockNavItems` 中添加 `{ id: "import", icon: "Upload", label: "导入" }`

## Server Action: importChatRecords

输入：
```typescript
{
  fileContent: string        // 文件文本内容
  format: 'txt' | 'csv' | 'json'
  groupId?: string           // 已有 Group ID
  newGroupName?: string      // 新建 Group 名称
}
```

输出：
```typescript
{
  success: boolean
  stats: {
    total: number           // 解析出的总消息数
    imported: number        // 成功导入数
    skipped: number         // 重复跳过数
    failed: number          // 解析/入库失败数
    analyzed: number        // AI 分析成功数
    analyzeFailed: number   // AI 分析失败数
  }
  groupId: string           // 导入目标 Group ID
  groupName: string         // Group 名称
  errors?: string[]         // 错误详情（最多前 10 条）
}
```

## 解析器

每个解析器接收原始文本，返回统一的 `ParsedMessage[]`：

```typescript
interface ParsedMessage {
  senderName: string
  content: string
  sentAt: string         // ISO 8601
  messageType?: string   // 默认 'text'
}
```

- `parseTxt(text: string): ParsedMessage[]`
- `parseCsv(text: string): ParsedMessage[]`
- `parseJson(text: string): ParsedMessage[]`

## Zod Schema

```typescript
const parsedMessageSchema = z.object({
  senderName: z.string().min(1),
  content: z.string().min(1),
  sentAt: z.string().min(1),
  messageType: z.string().default('text'),
})

const importInputSchema = z.object({
  fileContent: z.string().min(1),
  format: z.enum(['txt', 'csv', 'json']),
  groupId: z.string().optional(),
  newGroupName: z.string().optional(),
}).refine(
  data => data.groupId || data.newGroupName,
  { message: '必须选择已有社群或输入新社群名称' }
)
```

## 错误处理

- 文件为空 → 返回错误提示
- 格式解析失败 → 单条记录标记 failed，不中断整体导入
- DB 写入失败 → 单条记录标记 failed，记录错误信息
- AI 分析失败 → 不阻塞导入，计入 analyzeFailed
- 所有错误收集到 errors 数组，最多返回前 10 条

## UI 风格

- 继承现有 Ocean Dark 主题（`bg-[#060b14]`、`text-primary` cyan）
- 卡片式布局，与 Dashboard 风格一致
- 使用 lucide-react 图标
