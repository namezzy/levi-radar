'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { importChatRecords, getGroups } from './actions'
import type { ImportResult } from '@/lib/import/schemas'

type FileFormat = 'txt' | 'csv' | 'json'

function detectFormat(filename: string): FileFormat {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  if (ext === 'json') return 'json'
  return 'txt'
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<FileFormat>('txt')
  const [groupMode, setGroupMode] = useState<'existing' | 'new'>('new')
  const [groupId, setGroupId] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [groups, setGroups] = useState<{ id: string; name: string; platform: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getGroups().then(setGroups).catch(() => {})
  }, [])

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setFormat(detectFormat(f.name))
    setResult(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    try {
      const fileContent = await file.text()
      const res = await importChatRecords({
        fileContent,
        format,
        groupId: groupMode === 'existing' ? groupId : undefined,
        newGroupName: groupMode === 'new' ? newGroupName : undefined,
      })
      setResult(res)
    } catch {
      setResult({
        success: false,
        stats: { total: 0, imported: 0, skipped: 0, failed: 0, analyzed: 0, analyzeFailed: 0 },
        groupId: '',
        groupName: '',
        errors: ['导入请求失败，请检查网络连接'],
      })
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = file && (groupMode === 'new' ? newGroupName.trim() : groupId) && !loading

  return (
    <div className="min-h-screen bg-[#060b14] text-[#e2e8f0]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <a href="/" className="text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-text-primary">导入聊天记录</h1>
            <p className="text-text-muted text-sm mt-0.5">
              支持 TXT、CSV、JSON 格式，导入后自动触发 AI 分析
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-card-bg rounded-lg border border-border-line p-5 mb-4">
          <label className="text-sm font-medium text-text-secondary mb-3 block">选择文件</label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : file
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border-line hover:border-text-muted'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.csv,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-text-primary text-sm">{file.name}</span>
                <span className="text-text-muted text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm">拖拽文件到此处，或点击选择</p>
                <p className="text-text-label text-xs mt-1">支持 .txt .csv .json</p>
              </div>
            )}
          </div>
        </div>

        {/* Format + Group */}
        <div className="bg-card-bg rounded-lg border border-border-line p-5 mb-4 flex flex-col gap-4">
          {/* Format */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">文件格式</label>
            <div className="flex gap-2">
              {(['txt', 'csv', 'json'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                    format === f
                      ? 'bg-primary text-[#060b14]'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">目标社群</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setGroupMode('new')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  groupMode === 'new'
                    ? 'bg-primary text-[#060b14]'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                新建社群
              </button>
              <button
                onClick={() => setGroupMode('existing')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  groupMode === 'existing'
                    ? 'bg-primary text-[#060b14]'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                选择已有
              </button>
            </div>
            {groupMode === 'new' ? (
              <input
                type="text"
                placeholder="输入新社群名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-[#0a1628] border border-border-line rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
              />
            ) : (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-[#0a1628] border border-border-line rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">选择社群...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.platform})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            canSubmit
              ? 'bg-primary text-[#060b14] hover:bg-primary/90'
              : 'bg-white/5 text-text-muted cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              导入中...
            </span>
          ) : (
            '开始导入'
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`mt-4 rounded-lg border p-5 ${
            result.success
              ? 'bg-emerald-950/30 border-emerald-800/50'
              : 'bg-red-950/30 border-red-800/50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="font-semibold text-sm">
                {result.success ? '导入完成' : '导入失败'}
              </span>
              {result.groupName && (
                <span className="text-text-muted text-xs">→ {result.groupName}</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: '总消息数', value: result.stats.total, color: 'text-text-primary' },
                { label: '成功导入', value: result.stats.imported, color: 'text-emerald-400' },
                { label: '重复跳过', value: result.stats.skipped, color: 'text-yellow-400' },
                { label: '解析失败', value: result.stats.failed, color: 'text-red-400' },
                { label: 'AI 分析成功', value: result.stats.analyzed, color: 'text-primary' },
                { label: 'AI 分析失败', value: result.stats.analyzeFailed, color: 'text-orange-400' },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded p-2.5 text-center">
                  <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-text-muted text-[10px]">{item.label}</div>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="bg-black/20 rounded p-3 max-h-32 overflow-y-auto">
                <div className="text-text-muted text-[10px] mb-1">错误详情：</div>
                {result.errors.map((err, i) => (
                  <div key={i} className="text-red-300 text-xs">{err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Format Help */}
        <div className="mt-6 bg-card-bg rounded-lg border border-border-line p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-3">格式说明</h3>
          <div className="flex flex-col gap-3 text-xs text-text-muted">
            <div>
              <span className="text-primary font-medium">TXT：</span>
              <code className="bg-black/30 px-1.5 py-0.5 rounded ml-1">
                [2026-05-23 09:56] 张三：消息内容
              </code>
            </div>
            <div>
              <span className="text-primary font-medium">CSV：</span>
              <code className="bg-black/30 px-1.5 py-0.5 rounded ml-1">
                senderName,content,sentAt,messageType
              </code>
            </div>
            <div>
              <span className="text-primary font-medium">JSON：</span>
              <code className="bg-black/30 px-1.5 py-0.5 rounded ml-1">
                {'[{"senderName":"...", "content":"...", "sentAt":"..."}]'}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
