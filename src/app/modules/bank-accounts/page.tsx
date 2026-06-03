import { Landmark } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getBankAccounts } from "@/lib/data";
import type { BankAccount } from "@/lib/database.types";
import { formatVND, formatFullVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BankAccountsPage() {
  const rows = await getBankAccounts();
  const total = rows.reduce((s, r) => s + Number(r.opening_balance), 0);

  const cols: Column<BankAccount>[] = [
    { key: "code", label: "Mã", render: (r) => <span className="font-mono text-xs text-[var(--muted)]">{r.code || "—"}</span> },
    { key: "bank", label: "Ngân hàng / Quỹ", render: (r) => <div><p className="font-semibold text-[var(--foreground)]">{r.bank || r.type}</p><p className="text-[11px] text-[var(--muted-soft)] font-mono">{r.account_no}</p></div> },
    { key: "owner", label: "Chủ tài khoản", render: (r) => <span className="text-[var(--muted)]">{r.owner || "—"}</span> },
    { key: "manager", label: "Quản lý", render: (r) => <span className="text-[var(--muted)]">{r.manager || "—"}</span> },
    { key: "balance", label: "Số dư", align: "right", render: (r) => <span className={`font-bold ${Number(r.opening_balance) < 0 ? "text-rose-500" : "text-[var(--foreground)]"}`}>{formatFullVND(Number(r.opening_balance))}</span> },
  ];

  return (
    <AppShell>
      <Topbar title="Tài khoản ngân hàng & quỹ" subtitle="Nghiệp vụ" />
      <div className="card-accent text-white p-6 mb-6 flex items-center gap-4 max-w-md">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Landmark className="w-6 h-6" /></div>
        <div><p className="text-[11px] uppercase tracking-wider font-semibold text-white/80">Tổng số dư hiện tại</p><p className="text-3xl font-bold mt-0.5">{formatVND(total)}</p></div>
      </div>
      <DataTable columns={cols} rows={rows} empty="Chưa có tài khoản." />
    </AppShell>
  );
}
