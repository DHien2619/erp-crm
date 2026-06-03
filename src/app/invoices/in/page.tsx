import { AppShell } from "@/components/app-shell";
import { InvoicesInClient } from "@/components/invoices/invoices-in-client";
import { getInvoicesIn } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InvoicesInPage() {
  const invoices = await getInvoicesIn();

  return (
    <AppShell>
      <InvoicesInClient invoices={invoices} />
    </AppShell>
  );
}
