import { ArrowDownLeft, ArrowUpRight, Wallet, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getBankTransactions } from "@/lib/data";
import type { BankTransaction } from "@/lib/database.types";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function BankTransactionsPage() {
  const rows = await getBankTransactions();
  const totalIn = rows.filter((r) => r.direction === "in").reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = rows.filter((r) => r.direction === "out").reduce((s, r) => s + Number(r.amount), 0);
  const latestBalance = rows.find((r) => r.accumulated != null)?.accumulated ?? null;

  const cols: Column<BankTransaction>[] = [
    {
      key: "date",
      label: "Thời gian",
      render: (r) => <span className="text-[var(--muted)] whitespace-nowrap">{fmtDateTime(r.txn_date)}</span>,
    },
    {
      key: "dir",
      label: "Chiều",
      align: "center",
      render: (r) => (
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
            r.direction === "in" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          {r.direction === "in" ? "Tiền vào" : "Tiền ra"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Số tiền",
      align: "right",
      render: (r) => (
        <span className={`font-semibold whitespace-nowrap ${r.direction === "in" ? "text-emerald-600" : "text-rose-600"}`}>
          {r.direction === "in" ? "+" : "−"}
          {formatVND(Number(r.amount))}
        </span>
      ),
    },
    {
      key: "content",
      label: "Nội dung / Đối tác",
      render: (r) => (
        <span className="text-[var(--foreground)] block max-w-[280px] truncate" title={r.content ?? ""}>
          {r.counterparty || r.content || "—"}
        </span>
      ),
    },
    {
      key: "account",
      label: "Tài khoản",
      render: (r) => (
        <span className="text-[var(--muted)] whitespace-nowrap">
          {r.gateway || "—"}
          {r.account_number ? ` · ${r.account_number}` : ""}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Số dư sau",
      align: "right",
      render: (r) => (
        <span className="text-[var(--muted)] whitespace-nowrap">
          {r.accumulated != null ? formatVND(Number(r.accumulated)) : "—"}
        </span>
      ),
    },
    {
      key: "ref",
      label: "Mã GD",
      render: (r) => <span className="text-[11px] text-[var(--muted-soft)]">{r.reference_code || "—"}</span>,
    },
  ];

  return (
    <AppShell>
      <Topbar title="Biến động số dư" subtitle="Tiền vào / ra qua ngân hàng (SePay)" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard icon={<ArrowDownLeft className="w-5 h-5" />} label="Tổng tiền vào" value={formatVND(totalIn)} tone="in" />
        <StatCard icon={<ArrowUpRight className="w-5 h-5" />} label="Tổng tiền ra" value={formatVND(totalOut)} tone="out" />
        <StatCard icon={<Wallet className="w-5 h-5" />} label="Số dư mới nhất" value={latestBalance != null ? formatVND(latestBalance) : "—"} tone="neutral" />
      </div>

      {rows.length === 0 && (
        <div className="flex items-start gap-3 p-4 mb-5 bg-[var(--primary-soft)]/50 rounded-2xl text-sm">
          <Info className="w-5 h-5 text-[var(--primary)] mt-0.5 shrink-0" />
          <div className="text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">Chưa có biến động nào.</p>
            <p className="mt-0.5">
              Cần: (1) chạy <code className="text-[var(--primary)]">supabase/migration_sepay.sql</code> trong Supabase, rồi
              (2) tạo tài khoản SePay → nối ngân hàng → trỏ Webhook về
              <code className="text-[var(--primary)]"> /api/sepay/webhook</code>. Sau đó tiền vào/ra sẽ tự hiện ở đây.
            </p>
          </div>
        </div>
      )}

      <DataTable columns={cols} rows={rows} empty="Chưa có biến động số dư." />
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "in" | "out" | "neutral";
}) {
  const wrap = {
    in: "bg-emerald-100 text-emerald-600",
    out: "bg-rose-100 text-rose-600",
    neutral: "bg-[var(--primary-soft)] text-[var(--primary)]",
  }[tone];
  return (
    <div className="card-soft p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${wrap}`}>{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">{label}</p>
        <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}
