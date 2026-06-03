"use client";

import { useState } from "react";
import { TrendingUp, Wallet, FileCheck2, AlertCircle, PiggyBank } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { GapChart } from "@/components/reports/gap-chart";
import { GapTable } from "@/components/reports/gap-table";
import {
  getPeriodSummary,
  periodLabel,
  type GapRow,
  type PeriodKey,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

const periods: PeriodKey[] = ["month", "quarter", "year"];
const periodShort: Record<PeriodKey, string> = {
  month: "Tháng",
  quarter: "Quý",
  year: "Năm",
};

export function ReportsClient({ rows }: { rows: GapRow[] }) {
  const [period, setPeriod] = useState<PeriodKey>("quarter");
  const sum = getPeriodSummary(period, rows);

  return (
    <>
      <Topbar
        title="Báo cáo Gap hoá đơn"
        subtitle={periodLabel[period]}
        action={
          <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-xs font-semibold">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-xl transition-all",
                  period === p
                    ? "bg-white text-[var(--primary)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--primary)]"
                )}
              >
                {periodShort[p]}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-5 gap-3 mb-6">
        <MiniStat
          icon={<TrendingUp className="w-4 h-4" />}
          label="Doanh thu"
          value={`${sum.revenue}M`}
          tone="default"
        />
        <MiniStat
          icon={<Wallet className="w-4 h-4" />}
          label="Chi phí thực"
          value={`${sum.expense}M`}
          tone="default"
        />
        <MiniStat
          icon={<FileCheck2 className="w-4 h-4" />}
          label={`HĐ đã có · ${sum.coverage}%`}
          value={`${sum.invoiceIn}M`}
          tone="primary"
        />
        <MiniStat
          icon={<AlertCircle className="w-4 h-4" />}
          label="GAP cần bù"
          value={`${sum.gap}M`}
          tone="accent"
        />
        <MiniStat
          icon={<PiggyBank className="w-4 h-4" />}
          label="Thuế tiết kiệm"
          value={`${sum.taxSaving}M`}
          tone="success"
        />
      </div>

      <div className="card-soft p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[var(--foreground)]">
              Chi phí thực vs Hoá đơn đã có
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Khoảng cách giữa 2 cột = hoá đơn còn thiếu mỗi tháng
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Legend color="#FFB3BD" text="Chi phí thực" />
            <Legend color="#5B4FCF" text="HĐ đã có" />
          </div>
        </div>
        <GapChart data={rows} />
      </div>

      <GapTable rows={sum.rows} />
    </>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[var(--muted)]">
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {text}
    </span>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "default" | "primary" | "accent" | "success";
}) {
  const styles = {
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    primary: "card-primary text-white",
    accent: "card-accent text-white",
    success: "bg-emerald-500 text-white rounded-[24px] shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)]",
  };
  const iconWrap = {
    default: "bg-[var(--primary-soft)] text-[var(--primary)]",
    primary: "bg-white/15 text-white",
    accent: "bg-white/20 text-white",
    success: "bg-white/20 text-white",
  };
  const labelStyle = {
    default: "text-[var(--muted)]",
    primary: "text-white/70",
    accent: "text-white/80",
    success: "text-white/85",
  };

  return (
    <div className={cn("p-4", styles[tone])}>
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center mb-2",
          iconWrap[tone]
        )}
      >
        {icon}
      </div>
      <p
        className={cn(
          "text-[10px] uppercase tracking-wider font-semibold",
          labelStyle[tone]
        )}
      >
        {label}
      </p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
