import { ArrowDownLeft, ArrowUpRight, Wallet, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { BankTransactionsClient } from "@/components/bank/bank-transactions-client";
import { getBankTransactions } from "@/lib/data";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BankTransactionsPage() {
  const rows = await getBankTransactions();
  const totalIn = rows.filter((r) => r.direction === "in").reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = rows.filter((r) => r.direction === "out").reduce((s, r) => s + Number(r.amount), 0);
  const latestBalance = rows.find((r) => r.accumulated != null && Number(r.accumulated) > 0)?.accumulated ?? null;

  return (
    <AppShell>
      <Topbar title="Biến động số dư" subtitle="Tiền vào / ra qua ngân hàng (SePay) · bấm 1 dòng để xem chi tiết" />

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
              Cấu hình Webhook SePay trỏ về <code className="text-[var(--primary)]">/api/sepay/webhook</code>.
              Sau đó mỗi giao dịch vào/ra sẽ tự hiện ở đây.
            </p>
          </div>
        </div>
      )}

      <BankTransactionsClient rows={rows} />
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
