"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  PiggyBank,
  ArrowRightLeft,
  Landmark,
  Download,
  Printer,
  Scale,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { CustomSelect } from "@/components/ui/select";
import { formatFullVND, cn } from "@/lib/utils";
import { inPeriod, type TaxPeriodMode } from "@/lib/tax";
import type { FinanceData, FinanceRow } from "@/lib/data";

const CIT = 0.2;
const modeLabel: Record<TaxPeriodMode, string> = { month: "Tháng", quarter: "Quý", year: "Năm" };
const modes: TaxPeriodMode[] = ["month", "quarter", "year"];

type Opt = { key: string; label: string; mode: TaxPeriodMode };

function buildOptions(rows: FinanceRow[]): Opt[] {
  const months = new Set<string>();
  const quarters = new Set<string>();
  const years = new Set<number>();
  for (const r of rows) {
    if (!r.date) continue;
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    months.add(`${y}-${String(m).padStart(2, "0")}`);
    quarters.add(`${y}-${Math.ceil(m / 3)}`);
    years.add(y);
  }
  const mo: Opt[] = [...months].sort().reverse().map((k) => {
    const [y, m] = k.split("-");
    return { key: `m-${k}`, label: `Tháng ${Number(m)}/${y}`, mode: "month" };
  });
  const qo: Opt[] = [...quarters].sort().reverse().map((k) => {
    const [y, q] = k.split("-");
    return { key: `q-${y}-${q}`, label: `Quý ${q}/${y}`, mode: "quarter" };
  });
  const yo: Opt[] = [...years].sort((a, b) => b - a).map((y) => ({ key: `y-${y}`, label: `Năm ${y}`, mode: "year" }));
  return [...mo, ...qo, ...yo];
}

const sum = (arr: FinanceRow[], f: (r: FinanceRow) => number) => arr.reduce((s, r) => s + f(r), 0);

export function FinanceClient({ data }: { data: FinanceData }) {
  const { out, in: ins, openingBalance } = data;
  const options = useMemo(() => buildOptions([...out, ...ins]), [out, ins]);
  const [mode, setMode] = useState<TaxPeriodMode>("year");
  const modeOptions = options.filter((o) => o.mode === mode);
  const [keyByMode, setKeyByMode] = useState<Record<TaxPeriodMode, string>>(() => ({
    month: options.find((o) => o.mode === "month")?.key ?? "",
    quarter: options.find((o) => o.mode === "quarter")?.key ?? "",
    year: options.find((o) => o.mode === "year")?.key ?? "",
  }));
  const activeKey = keyByMode[mode] || modeOptions[0]?.key || "";
  const period = options.find((o) => o.key === activeKey);

  const fin = useMemo(() => {
    const pOut = out.filter((r) => inPeriod(r.date, activeKey));
    const pIn = ins.filter((r) => inPeriod(r.date, activeKey));

    // P&L (dồn tích)
    const revenue = sum(pOut, (r) => r.net);
    const expense = sum(pIn, (r) => r.net);
    const ebt = revenue - expense; // LN trước thuế
    const tax = ebt > 0 ? Math.round(ebt * CIT) : 0;
    const eat = ebt - tax; // LN sau thuế

    // Lưu chuyển tiền (theo kỳ)
    const cashIn = sum(pOut, (r) => r.paid);
    const cashOut = sum(pIn, (r) => r.paid);
    const netCash = cashIn - cashOut;

    // Cân đối (snapshot toàn thời gian)
    const cash = openingBalance + (sum(out, (r) => r.paid) - sum(in_(), (r) => r.paid));
    const receivable = sum(out, (r) => Math.max(0, r.gross - r.paid));
    const payable = sum(ins, (r) => Math.max(0, r.gross - r.paid));
    const assets = cash + receivable;
    const equity = assets - payable;

    function in_() {
      return ins;
    }

    return {
      revenue, expense, ebt, tax, eat,
      cashIn, cashOut, netCash,
      cash, receivable, payable, assets, equity,
      // chỉ số
      grossMargin: revenue ? Math.round((ebt / revenue) * 100) : 0,
      netMargin: revenue ? Math.round((eat / revenue) * 100) : 0,
      costRatio: revenue ? Math.round((expense / revenue) * 100) : 0,
      currentRatio: payable ? (assets / payable) : 0,
      debtRatio: assets ? Math.round((payable / assets) * 100) : 0,
    };
  }, [out, ins, openingBalance, activeKey]);

  function exportExcel() {
    const rows: (string | number)[][] = [];
    const add = (...r: (string | number)[]) => rows.push(r);
    add(`BÁO CÁO TÀI CHÍNH (quản trị) - ${period?.label ?? ""}`);
    add("");
    add("I. KẾT QUẢ HOẠT ĐỘNG KINH DOANH");
    add("Doanh thu thuần", fin.revenue);
    add("Tổng chi phí hoạt động", fin.expense);
    add("Lợi nhuận trước thuế", fin.ebt);
    add("Thuế TNDN (20%)", fin.tax);
    add("Lợi nhuận sau thuế", fin.eat);
    add("");
    add("II. LƯU CHUYỂN TIỀN TỆ");
    add("Tiền thu từ khách hàng", fin.cashIn);
    add("Tiền chi trả NCC/chi phí", fin.cashOut);
    add("Lưu chuyển tiền thuần", fin.netCash);
    add("");
    add("III. CÂN ĐỐI KẾ TOÁN (rút gọn, tại thời điểm hiện tại)");
    add("TÀI SẢN", "", "NGUỒN VỐN", "");
    add("Tiền & tương đương tiền", fin.cash, "Nợ phải trả (NCC)", fin.payable);
    add("Phải thu khách hàng", fin.receivable, "Vốn chủ sở hữu", fin.equity);
    add("TỔNG TÀI SẢN", fin.assets, "TỔNG NGUỒN VỐN", fin.payable + fin.equity);
    add("");
    add("IV. CHỈ SỐ TÀI CHÍNH");
    add("Biên lợi nhuận gộp (%)", fin.grossMargin);
    add("Biên lợi nhuận ròng (%)", fin.netMargin);
    add("Tỷ lệ chi phí/doanh thu (%)", fin.costRatio);
    add("Hệ số thanh toán hiện hành", fin.currentRatio.toFixed(2));
    add("Hệ số nợ (%)", fin.debtRatio);

    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-tai-chinh-${period?.label?.replace(/[/\s]/g, "-") ?? "ky"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (options.length === 0) {
    return (
      <>
        <Topbar title="Báo cáo tài chính" subtitle="P&L · Lưu chuyển tiền · Cân đối" />
        <div className="card-soft p-10 text-center text-[var(--muted)]">
          Chưa có dữ liệu hoá đơn để lập báo cáo.
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Báo cáo tài chính"
        subtitle={period?.label ?? "Quản trị"}
        action={
          <div className="flex items-center gap-2">
            <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-xs font-semibold">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl transition-all",
                    mode === m ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--primary)]"
                  )}
                >
                  {modeLabel[m]}
                </button>
              ))}
            </div>
            <CustomSelect
              className="w-40"
              value={activeKey}
              onChange={(v) => setKeyByMode((s) => ({ ...s, [mode]: v }))}
              options={modeOptions.map((o) => ({ value: o.key, label: o.label }))}
            />
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-deep)] shadow-sm">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-[var(--border)] text-[var(--muted)] text-xs font-semibold hover:text-[var(--primary)]">
              <Printer className="w-4 h-4" /> In
            </button>
          </div>
        }
      />

      {/* KPI tổng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card icon={<TrendingUp className="w-4 h-4" />} label="Doanh thu thuần" value={formatFullVND(fin.revenue)} tone="primary" />
        <Card icon={<PiggyBank className="w-4 h-4" />} label="Lợi nhuận sau thuế" value={formatFullVND(fin.eat)} tone="success" sub={`Biên ${fin.netMargin}%`} />
        <Card icon={<ArrowRightLeft className="w-4 h-4" />} label="Lưu chuyển tiền thuần" value={formatFullVND(fin.netCash)} tone="accent" />
        <Card icon={<Landmark className="w-4 h-4" />} label="Vốn chủ sở hữu" value={formatFullVND(fin.equity)} tone="default" sub="hiện tại" />
      </div>

      {/* P&L */}
      <Statement title="I. Kết quả hoạt động kinh doanh (P&L)" subtitle={`Kỳ ${period?.label} · dồn tích`}>
        <Line label="Doanh thu thuần (chưa VAT)" value={fin.revenue} />
        <Line label="Tổng chi phí hoạt động" value={fin.expense} minus />
        <Line label="Lợi nhuận trước thuế" value={fin.ebt} strong />
        <Line label="Thuế TNDN (20%)" value={fin.tax} minus />
        <Line label="Lợi nhuận sau thuế" value={fin.eat} strong highlight />
      </Statement>

      {/* Cash flow */}
      <Statement title="II. Lưu chuyển tiền tệ" subtitle={`Kỳ ${period?.label} · theo dòng tiền thực`}>
        <Line label="Tiền thu từ khách hàng" value={fin.cashIn} />
        <Line label="Tiền chi trả NCC / chi phí" value={fin.cashOut} minus />
        <Line label="Lưu chuyển tiền thuần trong kỳ" value={fin.netCash} strong highlight />
      </Statement>

      {/* Balance sheet */}
      <div className="card-soft p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center"><Scale className="w-4 h-4" /></span>
          <div>
            <h3 className="font-bold text-[var(--foreground)]">III. Cân đối kế toán (rút gọn)</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Tại thời điểm hiện tại · Tổng tài sản = Tổng nguồn vốn</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--muted)] mb-1">Tài sản</p>
            <Line label="Tiền & tương đương tiền" value={fin.cash} />
            <Line label="Phải thu khách hàng" value={fin.receivable} />
            <Line label="TỔNG TÀI SẢN" value={fin.assets} strong highlight />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--muted)] mb-1">Nguồn vốn</p>
            <Line label="Nợ phải trả (NCC)" value={fin.payable} />
            <Line label="Vốn chủ sở hữu" value={fin.equity} />
            <Line label="TỔNG NGUỒN VỐN" value={fin.payable + fin.equity} strong highlight />
          </div>
        </div>
      </div>

      {/* Ratios */}
      <div className="card-soft p-5 sm:p-6 mb-6">
        <h3 className="font-bold text-[var(--foreground)] mb-4">IV. Chỉ số tài chính</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Ratio label="Biên LN gộp" value={`${fin.grossMargin}%`} good={fin.grossMargin >= 0} />
          <Ratio label="Biên LN ròng" value={`${fin.netMargin}%`} good={fin.netMargin >= 0} />
          <Ratio label="Chi phí / Doanh thu" value={`${fin.costRatio}%`} good={fin.costRatio <= 100} />
          <Ratio label="Thanh toán hiện hành" value={fin.currentRatio ? fin.currentRatio.toFixed(2) : "—"} good={fin.currentRatio >= 1} />
          <Ratio label="Hệ số nợ" value={`${fin.debtRatio}%`} good={fin.debtRatio <= 60} />
        </div>
      </div>

      <p className="text-[11px] text-[var(--muted)] mb-8">
        * Báo cáo quản trị tự sinh từ dữ liệu hoá đơn — phục vụ ra quyết định, không thay BCTC pháp lý (Thông tư 200/133).
        Chi phí lương/khấu hao chưa nhập sẽ chưa phản ánh. Cân đối kế toán là ảnh chụp tại thời điểm hiện tại.
      </p>
    </>
  );
}

function Statement({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card-soft p-5 sm:p-6 mb-6">
      <div className="mb-3">
        <h3 className="font-bold text-[var(--foreground)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Line({ label, value, minus, strong, highlight }: { label: string; value: number; minus?: boolean; strong?: boolean; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-2 border-b border-[var(--border)]/50 last:border-0", highlight && "bg-[var(--primary-soft)]/40 -mx-2 px-2 rounded-lg border-0")}>
      <span className={cn("text-sm", strong ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground)]")}>{label}</span>
      <span className={cn("text-sm tabular-nums", strong && "font-bold", highlight ? "text-[var(--primary)]" : value < 0 ? "text-rose-500" : "text-[var(--foreground)]")}>
        {minus ? "− " : ""}{formatFullVND(Math.abs(value))}
      </span>
    </div>
  );
}

function Ratio({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-3">
      <p className="text-[11px] text-[var(--muted)] font-medium mb-1">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", good ? "text-emerald-600" : "text-rose-500")}>{value}</p>
    </div>
  );
}

function Card({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "default" | "primary" | "accent" | "success" }) {
  const styles = {
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    primary: "card-primary text-white",
    accent: "card-accent text-white",
    success: "bg-emerald-500 text-white rounded-[24px] shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)]",
  };
  const iconWrap = { default: "bg-[var(--primary-soft)] text-[var(--primary)]", primary: "bg-white/15 text-white", accent: "bg-white/20 text-white", success: "bg-white/20 text-white" };
  const labelStyle = { default: "text-[var(--muted)]", primary: "text-white/70", accent: "text-white/80", success: "text-white/85" };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>{icon}</div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
      {sub && <p className={cn("text-[11px] mt-0.5", labelStyle[tone])}>{sub}</p>}
    </div>
  );
}
