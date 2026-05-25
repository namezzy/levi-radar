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
