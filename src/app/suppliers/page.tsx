import { AppShell } from "@/components/app-shell";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";
import { getSupplierStats } from "@/lib/analytics";
import { getInvoicesIn, getSuppliersFull } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const [invoices, masters] = await Promise.all([
    getInvoicesIn(),
    getSuppliersFull(),
  ]);
  const stats = getSupplierStats(invoices);

  return (
    <AppShell>
      <SuppliersClient stats={stats} masters={masters} invoices={invoices} />
    </AppShell>
  );
}
