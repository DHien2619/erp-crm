import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getTransactions } from "@/lib/data";
import type { Transaction } from "@/lib/database.types";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const rows = await getTransactions();
  const cols: Column<Transaction>[] = [
    { key: "date", label: "Ngày", render: (r) => <span className="text-[var(--muted)]">{r.txn_date || "—"}</span> },
    { key: "dir", label: "Chiều", align: "center", render: (r) => <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.direction === "Thu" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{r.direction || "—"}</span> },
    { key: "method", label: "Phương thức", render: (r) => <span className="text-[var(--muted)]">{r.method || "—"}</span> },
    { key: "amount", label: "Số tiền", align: "right", render: (r) => <span className="font-semibold">{formatVND(Number(r.amount))}</span> },
    { key: "account", label: "Tài khoản", render: (r) => <span className="text-[var(--muted)]">{r.account || "—"}</span> },
    { key: "status", label: "Trạng thái", align: "center", render: (r) => <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] whitespace-nowrap">{r.status}</span> },
  ];
  return (
    <AppShell>
      <Topbar title="Giao dịch thanh toán" subtitle="Sổ thu – chi" />
      <DataTable columns={cols} rows={rows} empty="Chưa có giao dịch." />
    </AppShell>
  );
}
