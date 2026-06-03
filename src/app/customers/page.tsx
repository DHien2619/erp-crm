import { AppShell } from "@/components/app-shell";
import { CustomersClient } from "@/components/customers/customers-client";
import { getCompaniesWithStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const rows = await getCompaniesWithStats();
  return (
    <AppShell>
      <CustomersClient rows={rows} />
    </AppShell>
  );
}
