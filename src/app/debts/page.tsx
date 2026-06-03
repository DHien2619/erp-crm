import { AppShell } from "@/components/app-shell";
import { DebtsClient } from "@/components/debts/debts-client";
import { getReceivables, getPayables } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const [receivables, payables] = await Promise.all([
    getReceivables(),
    getPayables(),
  ]);
  return (
    <AppShell>
      <DebtsClient receivables={receivables} payables={payables} />
    </AppShell>
  );
}
