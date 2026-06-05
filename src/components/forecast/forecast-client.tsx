"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Wallet, PiggyBank, CalendarClock, Settings2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { ForecastChart, type ForecastPoint } from "@/components/forecast/forecast-chart";
import type { MonthlyPoint } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function nextLabel(last: string, step: number): string {
  // last like "T5" -> "T6"...; nếu quá 12 thì sang năm sau (Tn')
  const m = /^T(\d+)$/.exec(last);
  const base = m ? parseInt(m[1], 10) : 0;
  const v = base + step;
  return `T${((v - 1) % 12) + 1}`;
}

export function ForecastClient({
  history,
  initialStartCash = -26,
}: {
  history: MonthlyPoint[];
  initialStartCash?: number;
}) {
  // chỉ lấy các tháng có phát sinh để tính cơ sở
  const active = history.filter((h) => h.revenue > 0 || h.expense > 0);
  const avgRev = active.length
    ? Math.round(active.reduce((s, h) => s + h.revenue, 0) / active.length)
    : 0;
  const avgCost = active.length
    ? Math.round(active.reduce((s, h) => s + h.expense, 0) / active.length)
    : 0;
  const lastLabel = history.length ? history[history.length - 1].month : "T0";

  // giả định (nhập tay)
  const [baseRevenue, setBaseRevenue] = useState(avgRev || 100);
  const [growth, setGrowth] = useState(10); // %/tháng
  const [monthlyCost, setMonthlyCost] = useState(avgCost || 40);
  const [costGrowth, setCostGrowth] = useState(3); // %/tháng
  const [months, setMonths] = useState(6);
  const [startCash, setStartCash] = useState(initialStartCash); // triệu (số dư đầu kỳ)

  const { chart, projRows, summary } = useMemo(() => {
    const chart: ForecastPoint[] = active.map((h) => ({
      label: h.month,
      revenue: h.revenue,
      expense: h.expense,
      forecast: false,
    }));

    let rev = baseRevenue;
    let cost = monthlyCost;
    let cash = startCash;
    let cumRevenue = 0;
    let cumProfit = 0;
    let runwayMonth: string | null = null;
    const projRows: { label: string; revenue: number; expense: number; profit: number; cash: number }[] = [];

    for (let i = 1; i <= months; i++) {
      if (i > 1) {
        rev = Math.round(rev * (1 + growth / 100));
        cost = Math.round(cost * (1 + costGrowth / 100));
      }
      const profit = rev - cost;
      cash += profit;
      cumRevenue += rev;
      cumProfit += profit;
      const label = nextLabel(lastLabel, i);
      chart.push({ label, revenue: rev, expense: cost, forecast: true });
      projRows.push({ label, revenue: rev, expense: cost, profit, cash });
      if (cash < 0 && !runwayMonth) runwayMonth = label;
    }

    const endCash = projRows.length ? projRows[projRows.length - 1].cash : startCash;
    const breakeven = projRows.find((r) => r.profit >= 0)?.label ?? null;

    return {
      chart,
      projRows,
      summary: { cumRevenue, cumProfit, endCash, runwayMonth, breakeven },
    };
  }, [active, baseRevenue, growth, monthlyCost, costGrowth, months, startCash, lastLabel]);

  const boundary = chart.find((c) => c.forecast)?.label;

  return (
    <>
      <Topbar title="Dự báo tài chính" subtitle="Mô phỏng dòng tiền dựa trên giả định" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniStat tone="primary" icon={<TrendingUp className="w-4 h-4" />} label={`Doanh thu ${months}T tới`} value={`${summary.cumRevenue}M`} />
        <MiniStat tone="success" icon={<PiggyBank className="w-4 h-4" />} label={`Lợi nhuận ${months}T tới`} value={`${summary.cumProfit}M`} />
        <MiniStat tone={summary.endCash >= 0 ? "default" : "accent"} icon={<Wallet className="w-4 h-4" />} label="Tiền mặt cuối kỳ" value={`${summary.endCash}M`} />
        <MiniStat tone="default" icon={<CalendarClock className="w-4 h-4" />} label={summary.runwayMonth ? "Cạn tiền tại" : "Hoà vốn tại"} value={summary.runwayMonth ?? summary.breakeven ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bảng giả định nhập tay */}
        <div className="card-soft p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Giả định</h3>
          </div>
          <div className="flex flex-col gap-3.5">
            <NumField label="Doanh thu tháng gốc (triệu)" value={baseRevenue} onChange={setBaseRevenue} />
            <NumField label="Tăng trưởng DT / tháng (%)" value={growth} onChange={setGrowth} />
            <NumField label="Chi phí tháng gốc (triệu)" value={monthlyCost} onChange={setMonthlyCost} />
            <NumField label="Tăng chi phí / tháng (%)" value={costGrowth} onChange={setCostGrowth} />
            <NumField label="Số tháng dự báo" value={months} onChange={(v) => setMonths(Math.max(1, Math.min(24, v)))} />
            <NumField label="Tiền mặt đầu kỳ (triệu)" value={startCash} onChange={setStartCash} />
          </div>
          <p className="text-[11px] text-[var(--muted-soft)] mt-4 leading-relaxed">
            Mặc định lấy trung bình từ dữ liệu thực ({active.length} tháng có phát sinh). Chỉnh số để xem kịch bản khác.
          </p>
        </div>

        {/* Biểu đồ + bảng */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[var(--foreground)]">Dòng tiền: thực tế + dự báo</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">Đường dọc = mốc bắt đầu dự báo (đơn vị: triệu đồng)</p>
              </div>
            </div>
            <ForecastChart data={chart} boundaryLabel={boundary} />
          </div>

          <div className="card-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="text-left py-3 pl-6 pr-3">Tháng</th>
                    <th className="text-right py-3 px-3">Doanh thu</th>
                    <th className="text-right py-3 px-3">Chi phí</th>
                    <th className="text-right py-3 px-3">Lợi nhuận</th>
                    <th className="text-right py-3 px-3 pr-6">Tiền mặt luỹ kế</th>
                  </tr>
                </thead>
                <tbody>
                  {projRows.map((r) => (
                    <tr key={r.label} className="border-t border-[var(--border)]">
                      <td className="py-2.5 pl-6 pr-3 font-semibold text-[var(--foreground)]">{r.label}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--primary)] font-medium">{r.revenue}M</td>
                      <td className="py-2.5 px-3 text-right text-rose-500">{r.expense}M</td>
                      <td className={cn("py-2.5 px-3 text-right font-semibold", r.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>{r.profit}M</td>
                      <td className={cn("py-2.5 px-3 pr-6 text-right font-bold", r.cash >= 0 ? "text-[var(--foreground)]" : "text-rose-500")}>{r.cash}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--muted)]">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="erp-input h-10"
      />
    </label>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "default" | "accent" | "success" }) {
  const styles = {
    primary: "card-primary text-white",
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    accent: "card-accent text-white",
    success: "bg-emerald-500 text-white rounded-[24px] shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)]",
  };
  const iconWrap = { primary: "bg-white/15 text-white", default: "bg-[var(--primary-soft)] text-[var(--primary)]", accent: "bg-white/20 text-white", success: "bg-white/20 text-white" };
  const labelStyle = { primary: "text-white/70", default: "text-[var(--muted)]", accent: "text-white/80", success: "text-white/85" };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>{icon}</div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
