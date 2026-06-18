"use client";

import { FileCheck2, Wallet, AlertTriangle } from "lucide-react";
import { formatVND } from "@/lib/utils";
import type { InvoicesInStats as Stats } from "@/lib/data";

export function InvoicesInStats({ stats }: { stats: Stats }) {
  const { total, totalAmount, missing, missingAmount } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Stat
        icon={<FileCheck2 className="w-5 h-5" />}
        label="Tổng số hoá đơn"
        value={`${total}`}
        hint="trong tháng 5-6/2026"
        tone="primary"
      />
      <Stat
        icon={<Wallet className="w-5 h-5" />}
        label="Tổng giá trị"
        value={formatVND(totalAmount)}
        hint="đã match expense"
        tone="default"
      />
      <Stat
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Thiếu hoá đơn"
        value={`${missing} HĐ`}
        hint={`${formatVND(missingAmount)} cần xin lại`}
        tone="accent"
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "default" | "accent";
}) {
  const styles = {
    primary: "card-primary text-white",
    default: "card-soft border border-[var(--border)]",
    accent: "card-accent text-white",
  };
  const iconWrap = {
    primary: "bg-white/15 text-white",
    default: "bg-[var(--primary-soft)] text-[var(--primary)]",
    accent: "bg-white/20 text-white",
  };
  const labelStyle = {
    primary: "text-white/70",
    default: "text-[var(--muted)]",
    accent: "text-white/80",
  };
  const hintStyle = {
    primary: "text-white/60",
    default: "text-[var(--muted-soft)]",
    accent: "text-white/75",
  };

  return (
    <div className={`p-5 flex items-center gap-4 ${styles[tone]}`}>
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconWrap[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-[11px] uppercase tracking-wider font-semibold ${labelStyle[tone]}`}>
          {label}
        </p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        <p className={`text-[11px] mt-0.5 ${hintStyle[tone]}`}>{hint}</p>
      </div>
    </div>
  );
}
