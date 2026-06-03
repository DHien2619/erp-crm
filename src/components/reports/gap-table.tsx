"use client";

import { type GapRow } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function GapTable({ rows }: { rows: GapRow[] }) {
  const fmt = (n: number) => n.toLocaleString("vi-VN");

  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
              <th className="text-left py-3.5 pl-6 pr-3">Kỳ</th>
              <th className="text-right py-3.5 px-3">Doanh thu</th>
              <th className="text-right py-3.5 px-3">Chi phí</th>
              <th className="text-right py-3.5 px-3">HĐ đã có</th>
              <th className="text-right py-3.5 px-3">Gap cần bù</th>
              <th className="text-right py-3.5 px-3 pr-6">Thuế tiết kiệm</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.month}
                className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors"
              >
                <td className="py-3 pl-6 pr-3 font-semibold text-[var(--foreground)]">
                  {r.month}/2026
                </td>
                <td className="py-3 px-3 text-right text-[var(--muted)]">
                  {fmt(r.revenue)}M
                </td>
                <td className="py-3 px-3 text-right text-[var(--foreground)]">
                  {fmt(r.expense)}M
                </td>
                <td className="py-3 px-3 text-right text-[var(--primary)] font-medium">
                  {fmt(r.invoiceIn)}M
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className={cn(
                      "font-bold",
                      r.gap > 0 ? "text-rose-500" : "text-emerald-500"
                    )}
                  >
                    {r.gap > 0 ? `${fmt(r.gap)}M` : "Đủ"}
                  </span>
                </td>
                <td className="py-3 px-3 pr-6 text-right font-semibold text-emerald-600">
                  {r.taxSaving > 0 ? `${fmt(r.taxSaving)}M` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-[var(--border)] text-[11px] text-[var(--muted-soft)]">
        Đơn vị: triệu đồng (M). Thuế tiết kiệm = Gap × {20}% (thuế suất TNDN).
        Số liệu mô phỏng.
      </div>
    </div>
  );
}
