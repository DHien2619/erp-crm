import { AppShell } from "@/components/app-shell";
import { ReportsClient } from "@/components/reports/reports-client";
import { getGapByMonth } from "@/lib/analytics";
import { getMonthlyPoints } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const points = await getMonthlyPoints();
  const rows = getGapByMonth(points);

  return (
    <AppShell>
      <ReportsClient rows={rows} />
    </AppShell>
  );
}
