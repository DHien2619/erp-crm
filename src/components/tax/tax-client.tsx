"use client";

import { useMemo, useState } from "react";
import {
  Receipt,
  ArrowDownCircle,
  Landmark,
  Building2,
  AlertTriangle,
  CalendarClock,
  Download,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { CustomSelect } from "@/components/ui/select";
import { formatFullVND, cn } from "@/lib/utils";
import {
  buildPeriodOptions,
  computeTax,
  CIT_RATE,
  type TaxInvoice,
  type TaxPeriodMode,
} from "@/lib/tax";
import { getUpcomingTaxDeadlines } from "@/lib/tax-calendar";

const modeLabel: Record<TaxPeriodMode, string> = {
  month: "Tháng",
  quarter: "Quý",
  year: "Năm",
};
const modes: TaxPeriodMode[] = ["month", "quarter", "year"];

const statusMeta: Record<TaxInvoice["status"], { label: string; cls: string }> = {
  matched: { label: "Đã có HĐ", cls: "bg-emerald-50 text-emerald-600" },
  pending: { label: "Chờ HĐ", cls: "bg-amber-50 text-amber-600" },
  missing: { label: "Thiếu HĐ", cls: "bg-rose-50 text-rose-600" },
};

type Tab = "gtgt" | "tndn" | "list";

export function TaxClient({ invoices }: { invoices: TaxInvoice[] }) {
  const options = useMemo(() => buildPeriodOptions(invoices), [invoices]);
  const [mode, setMode] = useState<TaxPeriodMode>("month");

  const modeOptions = options.filter((o) => o.mode === mode);
  const [keyByMode, setKeyByMode] = useState<Record<TaxPeriodMode, string>>(() => ({
    month: options.find((o) => o.mode === "month")?.key ?? "",
    quarter: options.find((o) => o.mode === "quarter")?.key ?? "",
    year: options.find((o) => o.mode === "year")?.key ?? "",
  }));
  const activeKey = keyByMode[mode] || modeOptions[0]?.key || "";

  const [tab, setTab] = useState<Tab>("gtgt");
  const [listKind, setListKind] = useState<"out" | "in">("out");

  const t = useMemo(
    () => computeTax(invoices, activeKey, options),
    [invoices, activeKey, options]
  );

  const deadlines = useMemo(() => getUpcomingTaxDeadlines(new Date(), 3), []);

  if (options.length === 0) {
    return (
      <>
        <Topbar title="Báo cáo thuế" subtitle="Kê khai GTGT & TNDN" />
        <div className="card-soft p-10 text-center text-[var(--muted)]">
          Chưa có dữ liệu hoá đơn để lập tờ khai. Hãy thêm hoá đơn hoặc đồng bộ từ Lark.
        </div>
      </>
    );
  }

  const periodInvoices = invoices.filter((i) => i.date && t.period && inActive(i, activeKey));
  const listRows = periodInvoices.filter((r) => r.kind === listKind);

  return (
    <>
      <Topbar
        title="Báo cáo thuế"
        subtitle={t.period?.label ?? "Kê khai GTGT & TNDN"}
        action={
          <div className="flex items-center gap-2">
            <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-xs font-semibold">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl transition-all",
                    mode === m
                      ? "bg-white text-[var(--primary)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--primary)]"
                  )}
                >
                  {modeLabel[m]}
                </button>
              ))}
            </div>
            <CustomSelect
              className="w-44"
              value={activeKey}
              onChange={(v) => setKeyByMode((s) => ({ ...s, [mode]: v }))}
              options={modeOptions.map((o) => ({ value: o.key, label: o.label }))}
            />
          </div>
        }
      />

      {/* Cards tổng hợp nghĩa vụ thuế */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <TaxCard
          icon={<Receipt className="w-4 h-4" />}
          label="Thuế GTGT đầu ra"
          value={formatFullVND(t.outVat)}
          tone="default"
          sub={`${t.outCount} HĐ bán ra`}
        />
        <TaxCard
          icon={<ArrowDownCircle className="w-4 h-4" />}
          label="GTGT được khấu trừ"
          value={formatFullVND(t.inVatDeductible)}
          tone="default"
          sub={`${t.inCount} HĐ mua vào`}
        />
        <TaxCard
          icon={<Landmark className="w-4 h-4" />}
          label={t.vatPayable > 0 ? "GTGT phải nộp" : "GTGT chuyển kỳ sau"}
          value={formatFullVND(t.vatPayable > 0 ? t.vatPayable : t.vatCarryForward)}
          tone="primary"
        />
        <TaxCard
          icon={<Building2 className="w-4 h-4" />}
          label="TNDN tạm nộp"
          value={formatFullVND(t.cit)}
          tone="accent"
          sub="20% thu nhập tính thuế"
        />
      </div>

      {/* Cảnh báo: chi phí chưa đủ HĐ -> chưa khấu trừ được */}
      {t.inNetPending > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            Còn <b>{formatFullVND(t.inNetPending)}</b> chi phí <b>chưa đủ hoá đơn hợp lệ</b> trong kỳ này
            — chưa được trừ khi tính thuế. Nếu thu đủ HĐ, có thể khấu trừ thêm{" "}
            <b>{formatFullVND(t.inVatPending)}</b> thuế GTGT và giảm ~
            <b>{formatFullVND(Math.round(t.inNetPending * CIT_RATE))}</b> thuế TNDN.
          </div>
        </div>
      )}

      <div className="lg:flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-[var(--primary-soft)] rounded-2xl p-1 text-sm font-semibold w-fit">
            {(
              [
                ["gtgt", "Tờ khai GTGT"],
                ["tndn", "Tờ khai TNDN"],
                ["list", "Bảng kê hoá đơn"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "px-4 py-2 rounded-xl transition-all",
                  tab === key
                    ? "bg-white text-[var(--primary)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--primary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "gtgt" && (
            <div className="card-soft p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[var(--foreground)]">
                    Tờ khai thuế GTGT — mẫu 01/GTGT
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Khấu trừ · kỳ {t.period?.label}
                  </p>
                </div>
                <ExportBtn />
              </div>
              <DeclTable
                head={["Chỉ tiêu", "Nội dung", "Giá trị HHDV", "Thuế GTGT"]}
                rows={[
                  ["[23][24][25]", "HHDV mua vào được khấu trừ", t.inNetMatched, t.inVatDeductible],
                  ["[29]–[33]", "HHDV bán ra chịu thuế", t.outNet, t.outVat],
                ]}
                totals={[
                  {
                    code: "[40]",
                    label: "Thuế GTGT còn phải nộp trong kỳ",
                    value: t.vatPayable,
                    strong: t.vatPayable > 0,
                  },
                  {
                    code: "[43]",
                    label: "Thuế GTGT còn được khấu trừ chuyển kỳ sau",
                    value: t.vatCarryForward,
                    strong: t.vatCarryForward > 0,
                  },
                ]}
              />
            </div>
          )}

          {tab === "tndn" && (
            <div className="card-soft p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[var(--foreground)]">
                    Thuế TNDN tạm tính
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Kỳ {t.period?.label} · thuế suất {Math.round(CIT_RATE * 100)}%
                  </p>
                </div>
                <ExportBtn />
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <CitRow label="Doanh thu tính thuế" value={t.revenue} />
                  <CitRow
                    label="Chi phí được trừ (có HĐ hợp lệ)"
                    value={t.deductibleExpense}
                    minus
                  />
                  <CitRow label="Thu nhập tính thuế" value={t.taxableProfit} strong />
                  <CitRow
                    label={`Thuế suất TNDN`}
                    valueText={`${Math.round(CIT_RATE * 100)}%`}
                  />
                  <CitRow
                    label="Thuế TNDN tạm nộp"
                    value={t.cit}
                    strong
                    highlight
                  />
                </tbody>
              </table>
              {t.inNetPending > 0 && (
                <p className="text-xs text-[var(--muted)] mt-3">
                  * Chi phí chưa đủ HĐ ({formatFullVND(t.inNetPending)}) không được tính là chi phí
                  được trừ cho tới khi có hoá đơn hợp lệ.
                </p>
              )}
            </div>
          )}

          {tab === "list" && (
            <div className="card-soft p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--foreground)]">
                  Bảng kê hoá đơn {listKind === "out" ? "bán ra" : "mua vào"}
                </h3>
                <div className="bg-[var(--primary-soft)] rounded-xl p-1 flex gap-1 text-xs font-semibold">
                  {(["out", "in"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setListKind(k)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all",
                        listKind === k
                          ? "bg-white text-[var(--primary)] shadow-sm"
                          : "text-[var(--muted)]"
                      )}
                    >
                      {k === "out" ? "Bán ra" : "Mua vào"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="py-2 pr-3 font-semibold">Số HĐ</th>
                      <th className="py-2 pr-3 font-semibold">
                        {listKind === "out" ? "Khách hàng" : "Nhà cung cấp"}
                      </th>
                      <th className="py-2 pr-3 font-semibold">Ngày</th>
                      <th className="py-2 pr-3 font-semibold text-right">Giá trị</th>
                      <th className="py-2 pr-3 font-semibold text-right">% VAT</th>
                      <th className="py-2 pr-3 font-semibold text-right">Tiền thuế</th>
                      {listKind === "in" && (
                        <th className="py-2 font-semibold text-right">Trạng thái</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {listRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[var(--muted)]">
                          Không có hoá đơn trong kỳ này.
                        </td>
                      </tr>
                    )}
                    {listRows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[var(--border)]/60 last:border-0"
                      >
                        <td className="py-2.5 pr-3 font-medium text-[var(--foreground)]">
                          {r.code || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--foreground)] max-w-[200px] truncate">
                          {r.partner}
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--muted)] whitespace-nowrap">
                          {fmtDate(r.date)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {formatFullVND(r.net)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--muted)]">
                          {r.vatRate}%
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-medium">
                          {formatFullVND(r.vat)}
                        </td>
                        {listKind === "in" && (
                          <td className="py-2.5 text-right">
                            <span
                              className={cn(
                                "inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold",
                                statusMeta[r.status].cls
                              )}
                            >
                              {statusMeta[r.status].label}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Lịch nộp thuế */}
        <aside className="w-full lg:w-72 shrink-0 mt-6 lg:mt-12">
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-4 h-4 text-[var(--primary)]" />
              <h4 className="font-bold text-[var(--foreground)] text-sm">
                Hạn nộp sắp tới
              </h4>
            </div>
            <div className="flex flex-col gap-2.5">
              {deadlines.map((d) => (
                <div
                  key={d.label + d.iso}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {d.label}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{d.date}</p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-lg shrink-0",
                      d.urgent
                        ? "bg-rose-50 text-rose-600"
                        : "bg-[var(--primary-soft)] text-[var(--primary)]"
                    )}
                  >
                    {d.daysLeft}n
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

// helpers --------------------------------------------------

function inActive(inv: TaxInvoice, key: string) {
  // dùng lại logic inPeriod nhưng tránh import vòng — kiểm tra nhanh
  if (!inv.date) return false;
  const d = new Date(inv.date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const [mode, ky, extra] = key.split("-");
  if (mode === "m") return y === Number(ky) && m === Number(extra);
  if (mode === "q") return y === Number(ky) && Math.ceil(m / 3) === Number(extra);
  if (mode === "y") return y === Number(ky);
  return false;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function ExportBtn() {
  return (
    <button
      onClick={() => window.print()}
      title="In / xuất PDF"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--border)] text-[var(--muted)] text-xs font-semibold hover:text-[var(--primary)] transition-colors"
    >
      <Download className="w-4 h-4" />
      In
    </button>
  );
}

function DeclTable({
  head,
  rows,
  totals,
}: {
  head: string[];
  rows: [string, string, number, number][];
  totals: { code: string; label: string; value: number; strong?: boolean }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-2 pr-3 font-semibold text-left">{head[0]}</th>
            <th className="py-2 pr-3 font-semibold text-left">{head[1]}</th>
            <th className="py-2 pr-3 font-semibold text-right">{head[2]}</th>
            <th className="py-2 font-semibold text-right">{head[3]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-[var(--border)]/60">
              <td className="py-2.5 pr-3 text-[var(--muted)] font-mono text-xs whitespace-nowrap">
                {r[0]}
              </td>
              <td className="py-2.5 pr-3 text-[var(--foreground)]">{r[1]}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{formatFullVND(r[2])}</td>
              <td className="py-2.5 text-right tabular-nums font-medium">
                {formatFullVND(r[3])}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {totals.map((tot) => (
            <tr
              key={tot.code}
              className={cn(
                "border-t border-[var(--border)]",
                tot.strong && "bg-[var(--primary-soft)]/40"
              )}
            >
              <td className="py-2.5 pr-3 text-[var(--muted)] font-mono text-xs">{tot.code}</td>
              <td className="py-2.5 pr-3 font-semibold text-[var(--foreground)]" colSpan={2}>
                {tot.label}
              </td>
              <td
                className={cn(
                  "py-2.5 text-right tabular-nums font-bold",
                  tot.strong ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                )}
              >
                {formatFullVND(tot.value)}
              </td>
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}

function CitRow({
  label,
  value,
  valueText,
  minus,
  strong,
  highlight,
}: {
  label: string;
  value?: number;
  valueText?: string;
  minus?: boolean;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--border)]/60 last:border-0",
        highlight && "bg-[var(--primary-soft)]/40"
      )}
    >
      <td className={cn("py-3 pr-3", strong ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground)]")}>
        {label}
      </td>
      <td
        className={cn(
          "py-3 text-right tabular-nums",
          strong && "font-bold",
          highlight && "text-[var(--primary)]"
        )}
      >
        {valueText ?? `${minus ? "− " : ""}${formatFullVND(value ?? 0)}`}
      </td>
    </tr>
  );
}

function TaxCard({
  icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "default" | "primary" | "accent";
  sub?: string;
}) {
  const styles = {
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    primary: "card-primary text-white",
    accent: "card-accent text-white",
  };
  const iconWrap = {
    default: "bg-[var(--primary-soft)] text-[var(--primary)]",
    primary: "bg-white/15 text-white",
    accent: "bg-white/20 text-white",
  };
  const labelStyle = {
    default: "text-[var(--muted)]",
    primary: "text-white/70",
    accent: "text-white/80",
  };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>
        {icon}
      </div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>
        {label}
      </p>
      <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
      {sub && <p className={cn("text-[11px] mt-0.5", labelStyle[tone])}>{sub}</p>}
    </div>
  );
}
