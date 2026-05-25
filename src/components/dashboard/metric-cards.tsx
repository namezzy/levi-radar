import {
  Radio,
  MessageSquare,
  Target,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockMetrics } from "@/data/mock";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Radio,
  MessageSquare,
  Target,
  VolumeX,
};

export function MetricCards() {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {mockMetrics.map((metric) => {
        const Icon = iconMap[metric.icon];
        return (
          <div
            key={metric.id}
            className="bg-card-bg rounded-lg p-3.5 border border-border-line"
          >
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-text-label" />}
                <span className="text-text-label text-[11px]">
                  {metric.label}
                </span>
              </div>
              <span className="text-text-muted text-[9px] tracking-widest">
                METRIC
              </span>
            </div>
            <div
              className={cn(
                "text-[32px] font-normal mt-1 leading-tight",
                metric.highlight === "cyan" && "text-primary",
                metric.highlight === "orange" && "text-warning",
                !metric.highlight && "text-text-primary"
              )}
            >
              {metric.value}
            </div>
            <div className="text-text-muted text-[10px] mt-0.5">
              {metric.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
