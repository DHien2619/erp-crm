"use client";

import { useState } from "react";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Percent,
  Megaphone,
  Target,
  Scale,
  Sparkles,
  Settings2,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { NumberField } from "@/components/ui/number-field";
import { CIT_RATE } from "@/lib/analytics";
import type { StrategyData } from "@/lib/data";
import { formatVND, cn } from "@/lib/utils";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function StrategyClient({ data }: { data: StrategyData }) {
  const {
    revenue,
    expense,
    marketingSpend,
    gapMissing,
    customerCount,
    receivableOutstanding,
    monthly,
  } = data;

  // ---------- Hiện trạng (luỹ kế) ----------
  const grossProfit = revenue - expense;
  const netProfit = grossProfit > 0 ? Math.round(grossProfit * (1 - CIT_RATE)) : grossProfit;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roas = marketingSpend > 0 ? revenue / marketingSpend : null;
  const revPerCustomer = customerCount > 0 ? revenue / customerCount : 0;

  // ---------- Cơ sở theo tháng ----------
  const active = monthly.filter((m) => m.revenue > 0 || m.expense > 0);
  const avgRev = active.length
    ? (active.reduce((s, m) => s + m.revenue, 0) / active.length) * 1_000_000
    : 0;
  const avgExp = active.length
    ? (active.reduce((s, m) => s + m.expense, 0) / active.length) * 1_000_000
    : 0;
  const breakEven = avgExp;

  // ---------- Giả định TỰ SUY RA ----------
  let autoGrowth = 10;
  let growthReason = "mức tăng trưởng thận trọng mặc định";
  if (active.length >= 2) {
    const last = active[active.length - 1].revenue;
    const prev = active[active.length - 2].revenue;
    if (prev > 0) {
      const g = ((last - prev) / prev) * 100;
      if (g >= -20 && g <= 50) {
        autoGrowth = clamp(Math.round(g), 5, 30);
        growthReason = "theo xu hướng doanh thu các tháng gần đây";
      } else {
        growthReason = "lịch sử biến động mạnh → dùng mức thận trọng";
      }
    }
  }
  const autoMargin = revenue > 0 ? clamp(Math.round(netMarginPct), 15, 30) : 20;
  const marginReason =
    netMarginPct > 30
      ? "đặt mức bền vững 30% (biên hiện tại cao do chi phí chưa ghi nhận đủ)"
      : "giữ/cải thiện biên lãi ròng hiện tại";
  const autoRoas = roas !== null ? Math.max(Math.round(roas * 10) / 10, 3) : 4;
  const roasReason = roas !== null ? "duy trì/cải thiện ROAS hiện tại" : "chuẩn ngành khi bắt đầu chạy quảng cáo";

  // ---------- Chế độ + giá trị hiệu lực ----------
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [mGrowth, setMGrowth] = useState(autoGrowth);
  const [mMargin, setMMargin] = useState(autoMargin);
  const [mRoas, setMRoas] = useState(autoRoas);

  const growth = mode === "auto" ? autoGrowth : mGrowth;
  const targetMargin = mode === "auto" ? autoMargin : mMargin;
  const targetRoas = mode === "auto" ? autoRoas : mRoas;

  // ---------- KPI mục tiêu ----------
  const targetRevenue = Math.round(avgRev * (1 + growth / 100));
  const targetNet = Math.round(targetRevenue * (targetMargin / 100));
  const targetGross = Math.round(targetNet / (1 - CIT_RATE));
  const costCeiling = targetRevenue - targetGross;
  const mktBudget = targetRoas > 0 ? Math.round(targetRevenue / targetRoas) : 0;
  const customersNeeded = revPerCustomer > 0 ? Math.ceil(targetRevenue / revPerCustomer) : null;

  // ---------- Đề xuất hành động ----------
  const recs: { tone: "good" | "warn" | "info"; text: string }[] = [];
  if (avgRev >= breakEven)
    recs.push({ tone: "good", text: `Đang CÓ LÃI: doanh thu/tháng (${formatVND(avgRev)}) vượt hoà vốn (${formatVND(breakEven)}) — biên lãi gộp ${grossMarginPct.toFixed(0)}%. Ưu tiên giữ nhịp + mở rộng.` });
  else
    recs.push({ tone: "warn", text: `Đang DƯỚI hoà vốn — cần thêm ${formatVND(breakEven - avgRev)}/tháng. Tập trung tăng doanh thu hoặc cắt chi phí cố định.` });

  recs.push({ tone: "info", text: `Mục tiêu tháng sau: doanh thu ${formatVND(targetRevenue)} (+${growth}%), lãi ròng ${formatVND(targetNet)} (biên ${targetMargin}%). Giữ tổng chi phí ≤ ${formatVND(costCeiling)}.` });

  if (gapMissing > 0)
    recs.push({ tone: "warn", text: `Còn ${formatVND(gapMissing)} chi phí chưa có hoá đơn → thu thêm chứng từ để tiết kiệm ~${formatVND(Math.round(gapMissing * CIT_RATE))} thuế TNDN.` });

  if (roas === null)
    recs.push({ tone: "info", text: `Chưa ghi nhận chi phí quảng cáo. Nếu chạy ads, ngân sách đề xuất ${formatVND(mktBudget)} với ROAS mục tiêu ${targetRoas}x (gắn hạng mục "Marketing" khi nhập chi phí).` });
  else if (roas < targetRoas)
    recs.push({ tone: "warn", text: `ROAS hiện tại ${roas.toFixed(1)}x dưới mục tiêu ${targetRoas}x — tối ưu kênh/đối tượng trước khi tăng ngân sách.` });
  else
    recs.push({ tone: "good", text: `ROAS ${roas.toFixed(1)}x tốt — có thể tăng ngân sách quảng cáo lên ~${formatVND(mktBudget)} để scale.` });

  if (customerCount <= 1)
    recs.push({ tone: "warn", text: `Doanh thu phụ thuộc gần như 1 khách hàng — rủi ro tập trung CAO. Đa dạng hoá tệp khách (mục tiêu +2–3 khách mới/quý).` });
  else if (customersNeeded !== null && customersNeeded > customerCount)
    recs.push({ tone: "info", text: `Cần ~${customersNeeded} khách để đạt doanh thu mục tiêu (hiện ${customerCount}) → tìm thêm ${customersNeeded - customerCount} khách.` });

  if (receivableOutstanding > 0)
    recs.push({ tone: "info", text: `Đang có ${formatVND(receivableOutstanding)} công nợ phải thu — đẩy thu hồi để có dòng tiền tái đầu tư.` });

  return (
    <>
      <Topbar
        title="Đề xuất chiến lược"
        subtitle="Phân tích từ số liệu thật"
        action={
          <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setMode("auto")}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all", mode === "auto" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)]")}
            >
              <Sparkles className="w-3.5 h-3.5" /> Tự đề xuất
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all", mode === "manual" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)]")}
            >
              <Settings2 className="w-3.5 h-3.5" /> Tuỳ chỉnh
            </button>
          </div>
        }
      />

      {/* Hiện trạng */}
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
        Hiện trạng (luỹ kế 2026)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Mini icon={<TrendingUp className="w-4 h-4" />} label="Doanh thu" value={formatVND(revenue)} tone="primary" />
        <Mini icon={<Wallet className="w-4 h-4" />} label="Chi phí" value={formatVND(expense)} tone="default" />
        <Mini icon={<PiggyBank className="w-4 h-4" />} label="Lãi gộp" value={formatVND(grossProfit)} tone={grossProfit >= 0 ? "success" : "accent"} />
        <Mini icon={<PiggyBank className="w-4 h-4" />} label="Lãi ròng" value={formatVND(netProfit)} tone={netProfit >= 0 ? "success" : "accent"} />
        <Mini icon={<Percent className="w-4 h-4" />} label="Biên lãi ròng" value={`${netMarginPct.toFixed(0)}%`} tone="default" />
        <Mini icon={<Megaphone className="w-4 h-4" />} label="ROAS" value={roas !== null ? `${roas.toFixed(1)}x` : "—"} tone="default" />
      </div>

      {/* Hoà vốn */}
      <div className={cn("p-5 rounded-[24px] mb-6 flex flex-col sm:flex-row sm:items-center gap-4", avgRev >= breakEven ? "bg-emerald-500 text-white" : "card-accent text-white")}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Scale className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/80">Điểm hoà vốn (doanh thu/tháng)</p>
          <p className="text-2xl font-bold mt-0.5">{formatVND(breakEven)}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/80">Doanh thu TB/tháng</p>
          <p className="text-2xl font-bold mt-0.5">{formatVND(avgRev)}</p>
          <p className="text-[11px] text-white/85 mt-0.5">
            {avgRev >= breakEven ? `Vượt hoà vốn ${formatVND(avgRev - breakEven)}` : `Còn thiếu ${formatVND(breakEven - avgRev)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel theo chế độ */}
        <div className="card-soft p-5">
          {mode === "auto" ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-bold text-[var(--foreground)]">Hệ thống tự suy ra</h3>
              </div>
              <div className="flex flex-col gap-3.5">
                <Basis label="Tăng trưởng đề xuất" value={`+${autoGrowth}%`} reason={growthReason} />
                <Basis label="Biên lãi ròng mục tiêu" value={`${autoMargin}%`} reason={marginReason} />
                <Basis label="ROAS mục tiêu" value={`${autoRoas}x`} reason={roasReason} />
                <Basis label="Doanh thu cơ sở" value={`${formatVND(avgRev)}/tháng`} reason={`trung bình ${active.length} tháng có phát sinh`} />
              </div>
              <p className="text-[11px] text-[var(--muted-soft)] mt-4 leading-relaxed">
                Toàn bộ tự tính từ số liệu công ty. Muốn tự đặt mục tiêu? Chuyển tab <b>Tuỳ chỉnh</b>.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-bold text-[var(--foreground)]">Tự đặt mục tiêu</h3>
              </div>
              <div className="flex flex-col gap-3.5">
                <Num label="Tăng trưởng doanh thu (%)" value={mGrowth} onChange={setMGrowth} />
                <Num label="Biên lãi ròng mục tiêu (%)" value={mMargin} onChange={setMMargin} />
                <Num label="ROAS mục tiêu (x)" value={mRoas} onChange={setMRoas} />
              </div>
              <p className="text-[11px] text-[var(--muted-soft)] mt-4 leading-relaxed">
                Số mặc định lấy từ gợi ý tự động — chỉnh để xem kịch bản của bạn.
              </p>
            </>
          )}
        </div>

        {/* KPI mục tiêu */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">KPI đề xuất cho tháng sau</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard label="Doanh thu mục tiêu" value={formatVND(targetRevenue)} hint={`+${growth}% so với TB`} highlight />
            <KpiCard label="Lãi ròng mục tiêu" value={formatVND(targetNet)} hint={`biên ${targetMargin}%`} />
            <KpiCard label="Chi phí trần" value={formatVND(costCeiling)} hint="để đạt lãi mục tiêu" />
            <KpiCard label="Ngân sách Marketing" value={formatVND(mktBudget)} hint={`ROAS ${targetRoas}x`} />
            <KpiCard label="Số khách cần" value={customersNeeded !== null ? `${customersNeeded}` : "—"} hint={`hiện ${customerCount} khách`} />
            <KpiCard label="DT hoà vốn" value={formatVND(breakEven)} hint="doanh thu tối thiểu" />
          </div>
        </div>
      </div>

      {/* Đề xuất hành động */}
      <div className="card-soft p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="font-bold text-[var(--foreground)]">Đề xuất hành động</h3>
        </div>
        <ul className="flex flex-col gap-2.5">
          {recs.map((r, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5", r.tone === "good" ? "bg-emerald-50 text-emerald-600" : r.tone === "warn" ? "bg-rose-50 text-rose-500" : "bg-[var(--primary-soft)] text-[var(--primary)]")}>
                {r.tone === "good" ? <CheckCircle2 className="w-4 h-4" /> : r.tone === "warn" ? <AlertTriangle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
              </span>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Basis({ label, value, reason }: { label: string; value: string; reason: string }) {
  return (
    <div className="flex flex-col gap-0.5 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--muted)]">{label}</span>
        <span className="text-base font-bold text-[var(--primary)]">{value}</span>
      </div>
      <span className="text-[11px] text-[var(--muted-soft)] leading-snug">{reason}</span>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--muted)]">{label}</span>
      <NumberField value={value} onChange={onChange} allowNegative className="h-10" />
    </label>
  );
}

function KpiCard({ label, value, hint, highlight }: { label: string; value: string; hint: string; highlight?: boolean }) {
  return (
    <div className={cn("p-4 rounded-2xl border", highlight ? "card-primary text-white border-transparent" : "card-soft border-[var(--border)]")}>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", highlight ? "text-white/70" : "text-[var(--muted)]")}>{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className={cn("text-[11px] mt-0.5", highlight ? "text-white/60" : "text-[var(--muted-soft)]")}>{hint}</p>
    </div>
  );
}

function Mini({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "default" | "accent" | "success" }) {
  const styles = {
    primary: "card-primary text-white",
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    accent: "card-accent text-white",
    success: "bg-emerald-500 text-white rounded-[24px]",
  };
  const iconWrap = { primary: "bg-white/15 text-white", default: "bg-[var(--primary-soft)] text-[var(--primary)]", accent: "bg-white/20 text-white", success: "bg-white/20 text-white" };
  const labelStyle = { primary: "text-white/70", default: "text-[var(--muted)]", accent: "text-white/80", success: "text-white/85" };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>{icon}</div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
