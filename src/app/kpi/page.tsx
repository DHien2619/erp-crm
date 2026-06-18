import { AppShell } from "@/components/app-shell";
import { KpiClient } from "@/components/kpi/kpi-client";
import { getKpiData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function KpiPage() {
  const data = await getKpiData();
  return (
    <AppShell>
      <KpiClient data={data} />
    </AppShell>
  );
}
