import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { OverviewChart } from "@/components/overview-chart";
import { ExpenseCard, GapCard } from "@/components/gap-card";
import { SupplierCards } from "@/components/supplier-card";
import { RightRail } from "@/components/right-rail";
import { getDashboardData } from "@/lib/dashboard-cache";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { daily, summary, supplierStats, recentIn, recentOut } = await getDashboardData();

  return (
    <AppShell rightRail={<RightRail recentIn={recentIn} recentOut={recentOut} />}>
      <Topbar title="Dashboard" subtitle="Tổng quan" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <OverviewChart daily={daily} summary={summary} />
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <ExpenseCard summary={summary} />
          <GapCard summary={summary} />
        </div>
      </div>

      <SupplierCards stats={supplierStats} />
    </AppShell>
  );
}
