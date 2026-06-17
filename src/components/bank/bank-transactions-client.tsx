"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import type { BankTransaction } from "@/lib/database.types";
import { formatVND, cn } from "@/lib/utils";

const NOISE = new Set([
  "CHUYEN", "TIEN", "THANH", "TOAN", "QUA", "CK", "ND", "GD", "HD", "MA", "SO",
  "TK", "STK", "VND", "DI", "DEN", "TU", "CHO", "VE", "REF", "FT", "ATM", "POS",
  "IBFT", "NAPAS", "INTERNET", "BANKING", "MOMO", "ZALOPAY", "VIETTELPAY",
  "SHOPEEPAY", "NHAN", "GUI", "VAO", "RA", "TAI", "KHOAN", "DU", "BANKAPINOTIFY",
  "NOTIFY", "TT", "QR", "VA", "GIAO", "DICH", "SACOMBANK", "VCB", "MB", "MBBANK",
  "CASHIN", "CASHOUT", "CASH", "IN", "OUT", "NAP", "RUT", "TOPUP", "WALLET", "VI",
]);

/** Nhận diện ví điện tử / cổng thanh toán từ memo (cho "tiền đi đâu"). */
function detectWallet(u: string): string {
  // CASHOUT = rút ví về ngân hàng (bank nhận) · CASHIN = nạp ví từ ngân hàng (bank gửi)
  const op = u.includes("CASHOUT")
    ? " · rút về NH"
    : u.includes("CASHIN")
    ? " · nạp ví"
    : "";
  let name = "";
  if (u.includes("MOMO")) name = "Ví MoMo";
  else if (u.includes("ZALOPAY")) name = "Ví ZaloPay";
  else if (u.includes("VIETTELPAY") || u.includes("VTPAY")) name = "Ví ViettelPay";
  else if (u.includes("SHOPEEPAY") || u.includes("AIRPAY")) name = "Ví ShopeePay";
  else if (u.includes("VNPAY")) name = "VNPAY";
  return name ? name + op : "";
}

/** Tách đối tác từ memo: ưu tiên tên người/cty (cụm CHỮ IN HOA dài nhất),
 *  nếu không có thì rơi về ví điện tử (MoMo/ZaloPay…). */
export function parseCounterparty(content: string | null): string {
  if (!content) return "";
  const tokens = content.split(/[\s\-_.,/|]+/);
  let best: string[] = [];
  let cur: string[] = [];
  for (const t of tokens) {
    if (/^[A-Z]{2,}$/.test(t) && !NOISE.has(t)) cur.push(t);
    else {
      if (cur.length > best.length) best = cur;
      cur = [];
    }
  }
  if (cur.length > best.length) best = cur;
  if (best.length) return best.join(" ");
  return detectWallet(content.toUpperCase());
}

function fmtDateTime(iso: string | null, full = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    ...(full ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    ...(full ? { second: "2-digit" } : {}),
  }).format(d);
}

export function BankTransactionsClient({ rows }: { rows: BankTransaction[] }) {
  const [selected, setSelected] = useState<BankTransaction | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--muted)]">{rows.length} giao dịch</p>
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={pending}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--border)] bg-white text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("w-4 h-4", pending && "animate-spin")} />
          {pending ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-3 pl-6 text-left whitespace-nowrap">Thời gian</th>
                <th className="py-3.5 px-3 text-center">Chiều</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">Số tiền</th>
                <th className="py-3.5 px-3 text-left">Nội dung / Đối tác</th>
                <th className="py-3.5 px-3 text-left whitespace-nowrap">Tài khoản</th>
                <th className="py-3.5 px-3 pr-6 text-right whitespace-nowrap">Số dư sau</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                    Chưa có biến động số dư.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const cp = r.counterparty || parseCounterparty(r.content);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 pl-6 text-[var(--muted)] whitespace-nowrap">
                      {fmtDateTime(r.txn_date)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                          r.direction === "in" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}
                      >
                        {r.direction === "in" ? "Tiền vào" : "Tiền ra"}
                      </span>
                    </td>
                    <td className={cn("py-3 px-3 text-right font-semibold whitespace-nowrap", r.direction === "in" ? "text-emerald-600" : "text-rose-600")}>
                      {r.direction === "in" ? "+" : "−"}
                      {formatVND(Number(r.amount))}
                    </td>
                    <td className="py-3 px-3 max-w-[320px]">
                      {cp && <span className="block font-semibold text-[var(--foreground)] truncate">{cp}</span>}
                      <span className="block text-xs text-[var(--muted)] truncate" title={r.content ?? ""}>
                        {r.content || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--muted)] whitespace-nowrap">
                      {r.gateway || "—"}
                      {r.account_number ? ` · ${r.account_number}` : ""}
                    </td>
                    <td className="py-3 px-3 pr-6 text-right text-[var(--muted)] whitespace-nowrap">
                      {r.accumulated != null && Number(r.accumulated) > 0 ? formatVND(Number(r.accumulated)) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <DetailModal tx={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function DetailModal({ tx, onClose }: { tx: BankTransaction; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const cp = tx.counterparty || parseCounterparty(tx.content);
  const isIn = tx.direction === "in";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isIn ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
              {isIn ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            <div>
              <p className={cn("text-2xl font-bold", isIn ? "text-emerald-600" : "text-rose-600")}>
                {isIn ? "+" : "−"}
                {formatVND(Number(tx.amount))}
              </p>
              <p className="text-xs text-[var(--muted)]">{isIn ? "Tiền vào" : "Tiền ra"} · {fmtDateTime(tx.txn_date, true)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[var(--primary-soft)] flex items-center justify-center text-[var(--muted)]" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-1">
          <Row label={isIn ? "Người chuyển" : "Người nhận"} value={cp || "—"} strong />
          <Row label="Nội dung chuyển khoản" value={tx.content || "—"} wrap />
          <Row label="Ngân hàng" value={tx.gateway || "—"} />
          <Row label="Số tài khoản" value={tx.account_number || "—"} />
          <Row label="Số dư sau giao dịch" value={tx.accumulated != null && Number(tx.accumulated) > 0 ? formatVND(Number(tx.accumulated)) : "Không có"} />
          <Row label="Mã tham chiếu" value={tx.reference_code || "—"} />
          <Row label="Mã SePay" value={tx.sepay_id ? String(tx.sepay_id) : "—"} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong, wrap }: { label: string; value: string; strong?: boolean; wrap?: boolean }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--muted)] w-36 shrink-0 pt-0.5">{label}</span>
      <span className={cn("text-sm flex-1 text-right", strong ? "font-bold text-[var(--primary-deep)]" : "text-[var(--foreground)]", wrap ? "break-words" : "")}>
        {value}
      </span>
    </div>
  );
}
