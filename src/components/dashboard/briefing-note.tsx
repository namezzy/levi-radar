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
