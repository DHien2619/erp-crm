import { Coins, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getAdvances } from "@/lib/data";
import type { Advance } from "@/lib/database.types";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdvancesPage() {
  const rows = await getAdvances();
  const totalOutstanding = rows.reduce((s, r) => s + (Number(r.amount) - Number(r.settled)), 0);
  const pending = rows.filter((r) => (r.status || "").includes("treo")).length;

  const cols: Column<Advance>[] = [
    { key: "code", label: "Mã", render: (r) => <span className="font-mono text-xs text-[var(--muted)]">{r.code || "—"}</span> },
    { key: "person", label: "Người tạm ứng", render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.person || "—"}</span> },
    { key: "dept", label: "Bộ phận", render: (r) => <span className="text-[var(--muted)]">{r.department || "—"}</span> },
    { key: "date", label: "Ngày", render: (r) => <span className="text-[var(--muted)]">{r.advance_date || "—"}</span> },
    { key: "amount", label: "Số tiền", align: "right", render: (r) => <span className="font-semibold">{formatVND(Number(r.amount))}</span> },
    { key: "outstanding", label: "Còn lại", align: "right", render: (r) => { const o = Number(r.amount) - Number(r.settled); return o > 0 ? <span className="font-semibold text-rose-500">{formatVND(o)}</span> : <span className="text-emerald-500">Đã hoàn</span>; } },
    { key: "purpose", label: "Mục đích", render: (r) => <span className="text-[var(--muted)] text-xs">{r.purpose || r.note || "—"}</span> },
    { key: "status", label: "Trạng thái", align: "center", render: (r) => <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">{r.status || "—"}</span> },
  ];

  return (
    <AppShell>
      <Topbar title="Tạm ứng & hoàn ứng" subtitle="Nghiệp vụ" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card-primary text-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center"><Coins className="w-5 h-5" /></div>
          <div><p className="text-[11px] uppercase tracking-wider font-semibold text-white/70">Còn phải hoàn</p><p className="text-2xl font-bold mt-0.5">{formatVND(totalOutstanding)}</p></div>
        </div>
        <div className="card-soft border border-[var(--border)] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          <div><p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">Đang treo</p><p className="text-2xl font-bold mt-0.5 text-[var(--foreground)]">{pending} phiếu</p></div>
        </div>
      </div>
      <DataTable columns={cols} rows={rows} empty="Chưa có phiếu tạm ứng." />
    </AppShell>
  );
}
