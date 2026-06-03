"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { cn } from "@/lib/utils";
import ChartArea, { type ChartPoint } from "./chart-area";

type Daily = { date: string; revenue: number; expense: number };
type Summary = { revenue: number; expense: number; invoiceIn: number };
type Period = "day" | "month" | "quarter" | "year";

const periodOptions: { value: Period; label: string }[] = [
  { value: "day", label: "Theo ngày" },
  { value: "month", label: "Theo tháng" },
  { value: "quarter", label: "Theo quý" },
  { value: "year", label: "Theo năm" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function aggregate(daily: Daily[], period: Period): ChartPoint[] {
  if (daily.length === 0) return [];

  if (period === "day") {
    const byDate = new Map(daily.map((d) => [d.date, d.revenue]));
    const start = new Date(daily[0].date);
    const end = new Date(daily[daily.length - 1].date);
    const out: ChartPoint[] = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const key = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
        dt.getDate()
      )}`;
      out.push({
        label: `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`,
        value: byDate.get(key) ?? 0,
      });
    }
    return out;
  }

  if (period === "year") {
    const m = new Map<number, number>();
    for (const d of daily) {
      const y = new Date(d.date).getFullYear();
      m.set(y, (m.get(y) ?? 0) + d.revenue);
    }
    return [...m.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([y, v]) => ({ label: String(y), value: v }));
  }

  // month / quarter — fill liên tục từ đầu năm tới mốc lớn nhất có dữ liệu
  const year = new Date(daily[0].date).getFullYear();
  const revByMonth = new Array(13).fill(0); // index 1..12
  let maxMonth = 1;
  for (const d of daily) {
    const dt = new Date(d.date);
    if (dt.getFullYear() !== year) continue;
    const mo = dt.getMonth() + 1;
    revByMonth[mo] += d.revenue;
    if (mo > maxMonth) maxMonth = mo;
  }

  if (period === "month") {
    const out: ChartPoint[] = [];
    for (let mo = 1; mo <= maxMonth; mo++) {
      out.push({ label: `T${mo}`, value: revByMonth[mo] });
    }
    return out;
  }

  // quarter
  const maxQ = Math.ceil(maxMonth / 3);
  const out: ChartPoint[] = [];
  for (let q = 1; q <= maxQ; q++) {
    const v =
      revByMonth[(q - 1) * 3 + 1] +
      revByMonth[(q - 1) * 3 + 2] +
      revByMonth[(q - 1) * 3 + 3];
    out.push({ label: `Q${q}`, value: v });
  }
  return out;
}

export function OverviewChart({
  daily,
  summary,
}: {
  daily: Daily[];
  summary: Summary;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const data = useMemo(() => aggregate(daily, period), [daily, period]);
  const currentLabel =
    periodOptions.find((o) => o.value === period)?.label ?? "Theo tháng";

  return (
    <div className="card-primary p-7 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/90 font-semibold text-lg">
          Tổng quan dòng tiền
        </h3>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors px-3.5 py-1.5 rounded-full text-xs font-medium text-white"
          >
            {currentLabel}
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-[var(--border)] p-1.5 z-20">
              {periodOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setPeriod(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    period === o.value
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[var(--primary-soft)]/50"
                  )}
                >
                  {o.label}
                  {period === o.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ChartArea data={data} />

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/15">
        <KPI label="Doanh thu" value={formatVND(summary.revenue)} hint="Luỹ kế 2026" />
        <KPI
          label="Chi phí thực"
          value={formatVND(summary.expense)}
          hint="Luỹ kế 2026"
          highlighted
        />
        <KPI label="HĐ đầu vào" value={formatVND(summary.invoiceIn)} hint="Đã có HĐ" />
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  hint,
  highlighted,
}: {
  label: string;
  value: string;
  hint: string;
  highlighted?: boolean;
}) {
  return (
    <div className={highlighted ? "text-center" : ""}>
      <p className="text-[10px] uppercase tracking-wider text-white/60 font-medium mb-1">
        {label}
      </p>
      <p
        className={`font-bold text-white ${highlighted ? "text-2xl" : "text-xl"}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-white/50 mt-0.5">{hint}</p>
    </div>
  );
}
