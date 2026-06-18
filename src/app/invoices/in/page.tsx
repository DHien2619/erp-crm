import { AppShell } from "@/components/app-shell";
import { InvoicesInClient } from "@/components/invoices/invoices-in-client";
import { getInvoicesInPaged, getInvoicesInStats, type InvoicesInQuery } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InvoicesInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q: InvoicesInQuery = {
    page: Number(sp.page) || 1,
    q: sp.q ?? "",
    status: sp.status ?? "all",
    category: sp.category ?? "all",
    from: sp.from ?? "",
    to: sp.to ?? "",
    min: sp.min ?? "",
    max: sp.max ?? "",
  };

  const [data, stats] = await Promise.all([getInvoicesInPaged(q), getInvoicesInStats()]);

  return (
    <AppShell>
      <InvoicesInClient data={data} stats={stats} initial={q} />
    </AppShell>
  );
}
