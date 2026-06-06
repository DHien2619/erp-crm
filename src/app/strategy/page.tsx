import { AppShell } from "@/components/app-shell";
import { StrategyClient } from "@/components/strategy/strategy-client";
import { getStrategyData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StrategyPage() {
  const data = await getStrategyData();
  return (
    <AppShell>
      <StrategyClient data={data} />
    </AppShell>
  );
}
