import { AppShell } from "@/components/app-shell";
import { TaxClient } from "@/components/tax/tax-client";
import { getTaxInvoices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const invoices = await getTaxInvoices();
  return (
    <AppShell>
      <TaxClient invoices={invoices} />
    </AppShell>
  );
}
