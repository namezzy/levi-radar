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
