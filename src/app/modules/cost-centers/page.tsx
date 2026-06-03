import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getCostCenters } from "@/lib/data";
import type { CostCenter } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function CostCentersPage() {
  const rows = await getCostCenters();
  const cols: Column<CostCenter>[] = [
    { key: "code", label: "Mã", render: (r) => <span className="font-mono text-xs text-[var(--primary)] font-semibold">{r.code || "—"}</span> },
    { key: "name", label: "Tên trung tâm", render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.name}</span> },
    { key: "group", label: "Nhóm", render: (r) => <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">{r.group_name || "—"}</span> },
    { key: "owner", label: "Phụ trách", render: (r) => <span className="text-[var(--muted)]">{r.owner || "—"}</span> },
    { key: "purpose", label: "Mục đích", render: (r) => <span className="text-[var(--muted)] text-xs">{r.purpose || "—"}</span> },
    { key: "active", label: "Trạng thái", align: "center", render: (r) => <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{r.active ? "Đang dùng" : "Tắt"}</span> },
  ];
  return (
    <AppShell>
      <Topbar title="Trung tâm chi phí" subtitle={`${rows.length} trung tâm`} />
      <DataTable columns={cols} rows={rows} empty="Chưa có trung tâm chi phí." />
    </AppShell>
  );
}
