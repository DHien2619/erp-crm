"use client";

import {
  Cloud,
  Megaphone,
  Package,
  Coffee,
  Truck,
  Plane,
  UserRound,
  Receipt,
  MoreHorizontal,
} from "lucide-react";
import { type SupplierStat } from "@/lib/analytics";
import { type InvoiceCategory } from "@/lib/mock-data";
import { formatVND } from "@/lib/utils";

const iconByCategory: Record<InvoiceCategory, React.ElementType> = {
  saas: Cloud,
  marketing: Megaphone,
  office: Package,
  fnb: Coffee,
  logistics: Truck,
  travel: Plane,
  freelancer: UserRound,
  other: Receipt,
};

function SupplierItem({ s }: { s: SupplierStat }) {
  const Icon = iconByCategory[s.category] ?? Receipt;
  const pct = s.collectedPct;

  return (
    <div className="card-soft p-5 flex flex-col gap-4 relative">
      <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center -mt-9 mx-auto shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>

      <button
        aria-label="Thao tác"
        className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-[var(--primary-soft)] flex items-center justify-center text-[var(--muted-soft)]"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <div className="text-center -mt-1">
        <p className="font-bold text-[var(--foreground)] text-sm">{s.name}</p>
        <p className="text-[11px] text-[var(--muted)] mt-0.5">{s.categoryText}</p>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[var(--muted)] font-medium">Đã thu HĐ</span>
          <span className="font-bold text-[var(--foreground)]">{pct}%</span>
        </div>
        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--success)] to-emerald-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-3 text-[11px]">
          <span className="text-[var(--muted)]">
            {formatVND(s.matchedAmount)} / {formatVND(s.totalAmount)}
          </span>
          {s.outstandingAmount > 0 ? (
            <span className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold px-2.5 py-1 rounded-full">
              còn {formatVND(s.outstandingAmount)}
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-1 rounded-full">
              đủ HĐ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SupplierCards({ stats }: { stats: SupplierStat[] }) {
  const top = stats.slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
      {top.map((s) => (
        <SupplierItem key={s.name} s={s} />
      ))}
    </div>
  );
}
