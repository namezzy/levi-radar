"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Flame,
} from "lucide-react";
import type { BriefingOutput } from "@/lib/briefing/schemas";
import { mockBriefing } from "@/data/mock";

function formatBriefingAsText(briefing: BriefingOutput): string {
  const lines: string[] = [
    `📋 ${briefing.title} (${briefing.date})`,
    "",
    briefing.overview,
    "",
    "🔑 关键信号：",
    ...briefing.keySignals.map(
      (s, i) =>
        `${i + 1}. ${s.title} — ${s.summary} (${s.relatedMessages} 条)`
    ),
    "",
    "⚡ 行动项：",
    ...briefing.actionItems.map(
      (a, i) =>
        `${i + 1}. [${a.priority}] ${a.title} — ${a.suggestedAction}`
    ),
    "",
    `🔥 热门话题：${briefing.hotTopics.join("、")}`,
  ];

  if (briefing.topSources.length > 0) {
    lines.push("");
    lines.push("📡 活跃来源：");
    briefing.topSources.forEach((s, i) =>
      lines.push(`${i + 1}. ${s.groupName} (${s.signalCount} 信号)`)
    );
  }

  return lines.join("\n");
}

export function BriefingNote() {
  const [briefing, setBriefing] = useState<BriefingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState<string>("mock");

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/briefings/latest");
      const json = await res.json();
      if (json.success && json.data) {
        setBriefing(json.data);
        setSource(json.source || "database");
      }
    } catch {
      setSource("mock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/briefings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          workspaceId: "default",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBriefing(json.data);
        setSource("generated");
      }
    } catch (err) {
      console.error("Failed to generate briefing:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    const text = briefing
      ? formatBriefingAsText(briefing)
      : mockBriefing.content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Fallback: no API briefing loaded
  if (!briefing && !loading) {
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
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded text-primary text-[11px] hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              生成简报
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#081020] rounded text-text-secondary text-[11px] hover:bg-border-line transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
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

  if (loading) {
    return (
      <div className="bg-card-bg rounded-lg p-3.5 border border-border-line">
        <div className="flex items-center gap-2 text-text-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          加载简报中...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-text-secondary" />
          <span className="text-text-primary text-[13px] font-semibold">
            BRIEFING NOTE
          </span>
          <span className="text-text-muted text-[10px] ml-1">
            {briefing?.date}
          </span>
          {source !== "mock" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {source === "generated" ? "刚生成" : "数据库"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded text-primary text-[11px] hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            生成简报
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#081020] rounded text-text-secondary text-[11px] hover:bg-border-line transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            复制摘要
          </button>
        </div>
      </div>

      {/* Overview */}
      <p className="text-text-secondary text-xs leading-[1.7] mb-3">
        {briefing?.overview}
      </p>

      {/* Key Signals + Action Items + Hot Topics */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Key Signals */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-text-muted font-semibold">
              关键信号
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {briefing?.keySignals.slice(0, 3).map((signal, i) => (
              <div
                key={i}
                className="bg-card-inner rounded px-2 py-1.5 text-[11px]"
              >
                <div className="text-text-primary font-medium truncate">
                  {signal.title}
                </div>
                <div className="text-text-muted text-[10px] mt-0.5 line-clamp-2">
                  {signal.summary}
                </div>
                <div className="text-primary text-[9px] mt-0.5">
                  {signal.relatedMessages} 条相关消息
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span className="text-[10px] text-text-muted font-semibold">
              行动项
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {briefing?.actionItems.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="bg-card-inner rounded px-2 py-1.5 text-[11px]"
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-semibold ${
                      item.priority === "high"
                        ? "bg-danger/20 text-danger"
                        : item.priority === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-white/10 text-text-muted"
                    }`}
                  >
                    {item.priority === "high"
                      ? "紧急"
                      : item.priority === "medium"
                        ? "重要"
                        : "一般"}
                  </span>
                  <span className="text-text-primary font-medium truncate">
                    {item.title}
                  </span>
                </div>
                <div className="text-text-muted text-[10px] mt-0.5 line-clamp-2">
                  {item.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Topics + Top Sources */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Flame className="w-3 h-3 text-[#f59e0b]" />
            <span className="text-[10px] text-text-muted font-semibold">
              热门话题
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {briefing?.hotTopics.map((topic, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-1 rounded bg-white/5 text-text-secondary border border-border-line"
              >
                {topic}
              </span>
            ))}
          </div>
          {briefing?.topSources && briefing.topSources.length > 0 && (
            <div className="mt-2.5">
              <span className="text-[10px] text-text-muted font-semibold">
                活跃来源
              </span>
              <div className="flex flex-col gap-0.5 mt-1">
                {briefing.topSources.slice(0, 3).map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-text-secondary truncate">
                      {src.groupName}
                    </span>
                    <span className="text-primary">{src.signalCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
