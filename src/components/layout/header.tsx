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
