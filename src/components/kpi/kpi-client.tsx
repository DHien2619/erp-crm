"use client";

import {
  TrendingUp,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Users,
  Building2,
  LineChart,
  Target,
  Download,
  Printer,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { ProfitChart } from "@/components/kpi/profit-chart";
import { formatFullVND, cn } from "@/lib/utils";
import type { KpiData } from "@/lib/data";

export function KpiClient({ data }: { data: KpiData }) {
  const { monthly, topCustomers, topSuppliers, overdue, budgets, forecast } = data;

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const gross = totalRevenue - totalExpense;
  const net = monthly.reduce((s, m) => s + m.net, 0);
  const overdueTotal = overdue.reduce((s, o) => s + o.amount, 0);

  const maxCust = Math.max(1, ...topCustomers.map((c) => c.amount));
  const maxSup = Math.max(1, ...topSuppliers.map((c) => c.amount));

  function exportCsv() {
    const rows: string[][] = [];
    const push = (...r: (string | number)[]) => rows.push(r.map(String));
    push("BÁO CÁO & KPI NÂNG CAO");
    push("");
    push("Lợi nhuận theo tháng");
    push("Tháng", "Doanh thu", "Chi phí", "LN gộp", "LN ròng (ước tính)");
    monthly.forEach((m) => push(m.month, m.revenue, m.expense, m.gross, m.net));
    push("");
    push("Top khách hàng theo doanh thu");
    push("Khách hàng", "Doanh thu", "Số HĐ");
    topCustomers.forEach((c) => push(c.name, c.amount, c.count));
    push("");
    push("Top nhà cung cấp theo chi phí");
    push("Nhà cung cấp", "Chi phí", "Số HĐ");
    topSuppliers.forEach((c) => push(c.name, c.amount, c.count));
    push("");
    push("Công nợ quá hạn");
    push("Loại", "Đối tác", "Số HĐ", "Số tiền", "Hạn", "Quá hạn (ngày)");
    overdue.forEach((o) =>
      push(o.kind === "AR" ? "Phải thu" : "Phải trả", o.name, o.code ?? "", o.amount, o.dueDate ?? "", o.daysOverdue)
    );
    push("");
    push("Ngân sách vs thực chi");
    push("Khoản mục", "Ngân sách", "Thực chi", "% dùng");
    budgets.forEach((b) => push(b.label, b.budget, b.actual, b.usedPct + "%"));
    push("");
    push("Dự báo dòng tiền 6 tháng (ước tính)");
    push("Tháng", "Dòng tiền ròng/tháng", "Luỹ kế");
    forecast.forEach((f) => push(f.month, f.net, f.cumulative));

    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-kpi.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Topbar
        title="Báo cáo & KPI nâng cao"
        subtitle="Lợi nhuận · công nợ · top đối tác · ngân sách · dự báo"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-deep)] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-[var(--border)] text-[var(--muted)] text-xs font-semibold hover:text-[var(--primary)] transition-colors"
            >
              <Printer className="w-4 h-4" /> In / PDF
            </button>
          </div>
        }
      />

      {/* KPI tổng hợp */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Tổng doanh thu" value={formatFullVND(totalRevenue)} tone="primary" />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Tổng chi phí" value={formatFullVND(totalExpense)} tone="default" />
        <Kpi icon={<PiggyBank className="w-4 h-4" />} label="LN ròng (ước tính)" value={formatFullVND(net)} tone="success" sub={`LN gộp ${formatFullVND(gross)}`} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Công nợ quá hạn" value={formatFullVND(overdueTotal)} tone="accent" sub={`${overdue.length} khoản`} />
      </div>

      {/* Lợi nhuận theo tháng */}
      <Section icon={<LineChart className="w-4 h-4" />} title="Lợi nhuận gộp / ròng theo tháng" subtitle="Cột tím = doanh thu · hồng = chi phí · đường xanh = lợi nhuận ròng ước tính (sau thuế TNDN 20%)">
        {monthly.length === 0 ? (
          <Empty />
        ) : (
          <>
            <ProfitChart data={monthly} />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-2 pr-3 text-left font-semibold">Tháng</th>
                    <th className="py-2 pr-3 text-right font-semibold">Doanh thu</th>
                    <th className="py-2 pr-3 text-right font-semibold">Chi phí</th>
                    <th className="py-2 pr-3 text-right font-semibold">LN gộp</th>
                    <th className="py-2 text-right font-semibold">LN ròng*</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m) => (
                    <tr key={m.month} className="border-b border-[var(--border)]/60 last:border-0">
                      <td className="py-2 pr-3 font-medium">{m.month}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatFullVND(m.revenue)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatFullVND(m.expense)}</td>
                      <td className={cn("py-2 pr-3 text-right tabular-nums font-medium", m.gross >= 0 ? "text-emerald-600" : "text-rose-500")}>
                        {formatFullVND(m.gross)}
                      </td>
                      <td className={cn("py-2 text-right tabular-nums font-semibold", m.net >= 0 ? "text-emerald-600" : "text-rose-500")}>
                        {formatFullVND(m.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-[var(--muted)] mt-2">* LN ròng ước tính = LN gộp − thuế TNDN 20% (khi có lãi). Chưa gồm chi phí lương/khấu hao chưa nhập.</p>
            </div>
          </>
        )}
      </Section>

      {/* Top khách hàng + Top NCC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={<Users className="w-4 h-4" />} title="Top khách hàng theo doanh thu">
          <RankBars rows={topCustomers} max={maxCust} color="#5B4FCF" />
        </Section>
        <Section icon={<Building2 className="w-4 h-4" />} title="Top nhà cung cấp theo chi phí">
          <RankBars rows={topSuppliers} max={maxSup} color="#FF8FA3" />
        </Section>
      </div>

      {/* Công nợ quá hạn + Ngân sách */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={<AlertTriangle className="w-4 h-4" />} title="Công nợ quá hạn" subtitle="Phải thu (khách nợ) & phải trả (nợ NCC) đã quá hạn">
          {overdue.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-4 text-center">Không có khoản nào quá hạn. 🎉</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]/60">
              {overdue.slice(0, 10).map((o, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", o.kind === "AR" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {o.kind === "AR" ? "Thu" : "Trả"}
                      </span>
                      {o.name}
                    </p>
                    <p className="text-xs text-rose-500">Quá hạn {o.daysOverdue} ngày</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">{formatFullVND(o.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={<Target className="w-4 h-4" />} title="Ngân sách vs thực chi">
          {budgets.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-4 text-center">Chưa có dữ liệu ngân sách.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {budgets.map((b, i) => {
                const over = b.usedPct > 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--foreground)] truncate pr-2">{b.label}</span>
                      <span className={cn("font-semibold tabular-nums shrink-0", over ? "text-rose-500" : "text-[var(--muted)]")}>
                        {b.usedPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--primary-soft)] overflow-hidden">
                      <div className={cn("h-full rounded-full", over ? "bg-rose-500" : "bg-[var(--primary)]")} style={{ width: `${Math.min(100, b.usedPct)}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--muted)] mt-0.5">
                      <span>Thực chi {formatFullVND(b.actual)}</span>
                      <span>Ngân sách {formatFullVND(b.budget)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Dự báo dòng tiền */}
      <Section icon={<LineChart className="w-4 h-4" />} title="Dự báo dòng tiền 6 tháng tới" subtitle="Ước tính tự động theo trung bình dòng tiền ròng 3 tháng gần nhất">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-2 pr-3 text-left font-semibold">Tháng</th>
                <th className="py-2 pr-3 text-right font-semibold">Dòng tiền ròng / tháng</th>
                <th className="py-2 text-right font-semibold">Luỹ kế dự kiến</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f.month} className="border-b border-[var(--border)]/60 last:border-0">
                  <td className="py-2 pr-3 font-medium">{f.month}</td>
                  <td className={cn("py-2 pr-3 text-right tabular-nums", f.net >= 0 ? "text-emerald-600" : "text-rose-500")}>
                    {formatFullVND(f.net)}
                  </td>
                  <td className="py-2 text-right tabular-nums font-semibold">{formatFullVND(f.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function RankBars({ rows, max, color }: { rows: { name: string; amount: number; count: number }[]; max: number; color: string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[var(--foreground)] truncate pr-2">{r.name}</span>
            <span className="font-semibold tabular-nums shrink-0">{formatFullVND(r.amount)}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--primary-soft)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max(4, (r.amount / max) * 100)}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-[var(--muted)] py-6 text-center">Chưa có dữ liệu.</p>;
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-soft p-5 sm:p-6 mb-6">
      <div className="flex items-start gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
          {icon}
        </span>
        <div>
          <h3 className="font-bold text-[var(--foreground)] leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
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
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>{icon}</div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
      {sub && <p className={cn("text-[11px] mt-0.5", labelStyle[tone])}>{sub}</p>}
    </div>
  );
}
