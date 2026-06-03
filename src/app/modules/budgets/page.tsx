import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getBudgets } from "@/lib/data";
import type { Budget } from "@/lib/database.types";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const rows = await getBudgets();
  const cols: Column<Budget>[] = [
    { key: "quarter", label: "Quý", render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.quarter || "—"}</span> },
    { key: "cc", label: "Trung tâm CP", render: (r) => <span className="text-[var(--muted)]">{r.cost_center || "—"}</span> },
    { key: "budget", label: "Ngân sách", align: "right", render: (r) => <span className="font-semibold">{formatVND(Number(r.budget))}</span> },
    { key: "actual", label: "Thực chi", align: "right", render: (r) => <span className="text-rose-500">{formatVND(Number(r.actual))}</span> },
    { key: "remain", label: "Còn lại", align: "right", render: (r) => <span className="font-semibold text-emerald-600">{formatVND(Number(r.budget) - Number(r.actual))}</span> },
    { key: "status", label: "Trạng thái", align: "center", render: (r) => <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] whitespace-nowrap">{r.status}</span> },
  ];
  return (
    <AppShell>
      <Topbar title="Kế hoạch ngân sách" subtitle="Ngân sách vs thực chi" />
      <DataTable columns={cols} rows={rows} empty="Chưa có ngân sách." />
    </AppShell>
  );
}
