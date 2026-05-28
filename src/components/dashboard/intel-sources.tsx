import { Cpu } from "lucide-react";
import { mockIntelSources } from "@/data/mock";

const rankColors = ["text-primary", "text-primary/80", "text-primary/60", "text-primary/40", "text-primary/30", "text-primary/25"];

export function IntelSources() {
  return (
    <div className="bg-card-bg rounded-lg p-3.5 border border-border-line flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-text-secondary" />
          <span className="text-text-primary text-[13px] font-semibold">
            AI 情报源
          </span>
        </div>
        <span className="text-text-label text-[10px]">
          {mockIntelSources.length} 个 Provider
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
                {source.groupCount} 源
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
