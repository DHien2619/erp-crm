import { AppShell } from "@/components/app-shell";
import { ForecastClient } from "@/components/forecast/forecast-client";
import { getMonthlyPoints, getTotalOpeningBalance } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const [history, opening] = await Promise.all([
    getMonthlyPoints(),
    getTotalOpeningBalance(),
  ]);
  const startCashM = Math.round(opening / 1_000_000);
  return (
    <AppShell>
      <ForecastClient history={history} initialStartCash={startCashM} />
    </AppShell>
  );
}
