import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { BriefingNote } from "@/components/dashboard/briefing-note";
import { NotableIntel } from "@/components/dashboard/notable-intel";
import { ActionItems } from "@/components/dashboard/action-items";
import { IntelSources } from "@/components/dashboard/intel-sources";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
          <MetricCards />
          <BriefingNote />
          <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-2.5 flex-1 min-h-[200px]">
            <NotableIntel />
            <ActionItems />
            <IntelSources />
          </div>
        </div>
      </main>
    </div>
  );
}
