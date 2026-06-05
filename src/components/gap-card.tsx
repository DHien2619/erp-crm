"use client";

import Link from "next/link";
import { Receipt, ArrowRight, AlertCircle } from "lucide-react";
import { formatVND, formatFullVND } from "@/lib/utils";

type Summary = { expense: number; gap: number };

export function ExpenseCard({ summary }: { summary: Summary }) {
  return (
    <div className="card-primary p-6 flex flex-col gap-3 min-h-[140px] justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-white/90">Chi phí thực tế</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">
          {formatVND(summary.expense)}
        </p>
        <p className="text-xs text-white/60 mt-0.5">Luỹ kế 2026</p>
      </div>
    </div>
  );
}

export function GapCard({ summary }: { summary: Summary }) {
  const gapPct = summary.expense
    ? Math.round((summary.gap / summary.expense) * 100)
    : 0;

  return (
    <div className="card-accent p-6 flex flex-col gap-3 min-h-[180px] justify-between relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-12 top-8 w-24 h-24 rounded-full bg-white/10" />

      <div className="flex items-center gap-3 relative">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm block">
            GAP hoá đơn
          </span>
          <span className="text-[10px] text-white/80 uppercase tracking-wider">
            Cần bù
          </span>
        </div>
      </div>

      <div className="relative">
        <p className="text-3xl font-bold text-white">
          {formatVND(summary.gap)}
        </p>
        <p className="text-[11px] text-white/85 mt-1 font-medium">
          {formatFullVND(summary.gap)}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-white/85">{gapPct}% chi phí chưa có HĐ</span>
          <Link
            href="/reports"
            aria-label="Xem chi tiết báo cáo gap"
            title="Xem báo cáo gap"
            className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/35 transition-colors flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}
