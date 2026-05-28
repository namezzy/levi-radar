import {
  LayoutDashboard,
  Radio,
  Radar,
  Link,
  ClipboardList,
  Star,
  FolderOpen,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockNavItems, mockGroups, mockCollections } from "@/data/mock";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Radio,
  Radar,
  Link,
  ClipboardList,
  Star,
  FolderOpen,
  Upload,
};

export function Sidebar() {
  return (
    <aside className="w-[200px] bg-sidebar-bg flex flex-col border-r border-border-line shrink-0 overflow-y-auto">
      <div className="p-3 pb-0">
        {/* Logo */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-primary text-[13px] font-bold tracking-wider">
              LEVI RADAR
            </div>
            <div className="text-text-muted text-[10px]">社群情报雷达</div>
          </div>
          <Settings className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-secondary transition-colors" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 mt-3">
          {mockNavItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <a
                key={item.id}
                href={item.id === 'dashboard' ? '/' : item.id === 'import' ? '/import' : '#'}
                className={cn(
                  "flex items-center gap-2 px-2 py-[7px] rounded-md cursor-pointer transition-colors no-underline",
                  item.active
                    ? "bg-primary/10"
                    : "hover:bg-white/5"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      item.active ? "text-text-primary" : "text-text-secondary"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs flex-1",
                    item.active ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Groups */}
        <div className="mt-5">
          <div className="text-text-muted text-[10px] font-semibold tracking-widest px-2 mb-1.5">
            GROUPS
          </div>
          <div className="flex flex-col gap-px">
            {mockGroups.map((group) => {
              const Icon = iconMap[group.icon];
              return (
                <div
                  key={group.label}
                  className="flex items-center gap-2 px-2 py-[5px] rounded cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-text-secondary" />}
                  <span className="text-[11px] text-[#cbd5e1] flex-1">
                    {group.label}
                  </span>
                  <span className="text-[11px] text-text-label">
                    {group.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collections */}
        <div className="mt-4">
          <div className="text-text-muted text-[10px] font-semibold tracking-widest px-2 mb-1.5">
            COLLECTIONS
          </div>
          <div className="flex flex-col gap-px">
            {mockCollections.map((col) => (
              <div
                key={col.label}
                className="flex items-center gap-2 px-2 py-[5px] rounded cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-[11px] text-[#cbd5e1] flex-1">
                  {col.label}
                </span>
                <span className="text-[11px] text-text-label">{col.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Daemon status */}
      <div className="p-3 pt-0">
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#081020] rounded-md">
          <div className="w-1.5 h-1.5 bg-success rounded-full" />
          <span className="text-text-label text-[10px]">daemon 运行中</span>
        </div>
      </div>
    </aside>
  );
}
