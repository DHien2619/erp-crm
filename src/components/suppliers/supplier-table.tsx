"use client";

import { Sparkles, Mail, AlertTriangle } from "lucide-react";
import { type SupplierStat } from "@/lib/analytics";
import { cn, formatVND } from "@/lib/utils";

const easeConfig: Record<
  SupplierStat["easeToCollect"],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  easy: {
    label: "Tự động",
    cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: <Sparkles className="w-3 h-3" />,
  },
  medium: {
    label: "Liên hệ NCC",
    cls: "bg-amber-50 text-amber-600 border-amber-200",
    icon: <Mail className="w-3 h-3" />,
  },
  hard: {
    label: "Khó (cá nhân)",
    cls: "bg-rose-50 text-rose-600 border-rose-200",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
};

export function SupplierTable({ stats }: { stats: SupplierStat[] }) {
  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
              <th className="text-left py-3.5 pl-6 pr-3">Nhà cung cấp</th>
              <th className="text-center py-3.5 px-3">Số HĐ</th>
              <th className="text-right py-3.5 px-3">Tổng chi</th>
              <th className="text-left py-3.5 px-3 w-40">Đã có HĐ</th>
              <th className="text-right py-3.5 px-3">Còn thiếu</th>
              <th className="text-right py-3.5 px-3">VAT thu hồi</th>
              <th className="text-center py-3.5 px-3 pr-6">Khả năng xin</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              const ease = easeConfig[s.easeToCollect];
              return (
                <tr
                  key={s.name}
                  className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors"
                >
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {s.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--foreground)] truncate">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-[var(--muted-soft)]">
                          {s.categoryText}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-[var(--muted)] font-medium">
                    {s.invoiceCount}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[var(--foreground)]">
                    {formatVND(s.totalAmount)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.collectedPct >= 80
                              ? "bg-emerald-400"
                              : s.collectedPct >= 40
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          )}
                          style={{ width: `${s.collectedPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--foreground)] w-9 text-right">
                        {s.collectedPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.outstandingAmount > 0 ? (
                      <span className="font-semibold text-rose-500">
                        {formatVND(s.outstandingAmount)}
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-medium">Đủ</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--muted)]">
                    {s.vatRecoverable > 0 ? formatVND(s.vatRecoverable) : "—"}
                  </td>
                  <td className="py-3 px-3 pr-6 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                        ease.cls
                      )}
                    >
                      {ease.icon}
                      {ease.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        <b className="text-[var(--foreground)]">{stats.length}</b> nhà cung cấp ·
        sắp xếp theo số tiền thiếu hoá đơn
      </div>
    </div>
  );
}
