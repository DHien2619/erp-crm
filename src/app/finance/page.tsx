import { AppShell } from "@/components/app-shell";
import { FinanceClient } from "@/components/finance/finance-client";
import { getFinanceData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const data = await getFinanceData();
  return (
    <AppShell>
      <FinanceClient data={data} />
    </AppShell>
  );
}
