import type { InvoiceStatus } from "@/lib/database.types";

/** Thuế suất TNDN hiện hành */
export const CIT_RATE = 0.2;

/** 1 dòng hoá đơn phục vụ kê khai thuế (đã chuẩn hoá in/out) */
export type TaxInvoice = {
  id: string;
  kind: "in" | "out"; // mua vào / bán ra
  code: string;
  partner: string; // NCC (in) hoặc khách hàng (out)
  date: string | null; // yyyy-mm-dd
  net: number; // giá trị trước thuế (VND)
  vatRate: number; // %
  vat: number; // tiền thuế = net * rate / 100
  status: InvoiceStatus;
};

export type TaxPeriodMode = "month" | "quarter" | "year";

export type PeriodOption = {
  key: string; // vd "m-2026-04", "q-2026-2", "y-2026"
  label: string;
  mode: TaxPeriodMode;
};

function ym(dateIso: string): { y: number; m: number } | null {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

/** Sinh danh sách kỳ tính thuế có dữ liệu (tháng + quý + năm), mới nhất trước */
export function buildPeriodOptions(invoices: TaxInvoice[]): PeriodOption[] {
  const months = new Set<string>();
  const quarters = new Set<string>();
  const years = new Set<number>();

  for (const inv of invoices) {
    if (!inv.date) continue;
    const p = ym(inv.date);
    if (!p) continue;
    months.add(`${p.y}-${String(p.m).padStart(2, "0")}`);
    quarters.add(`${p.y}-${Math.ceil(p.m / 3)}`);
    years.add(p.y);
  }

  const monthOpts: PeriodOption[] = [...months]
    .sort()
    .reverse()
    .map((k) => {
      const [y, m] = k.split("-");
      return { key: `m-${k}`, label: `Tháng ${Number(m)}/${y}`, mode: "month" as const };
    });

  const quarterOpts: PeriodOption[] = [...quarters]
    .sort()
    .reverse()
    .map((k) => {
      const [y, q] = k.split("-");
      return { key: `q-${y}-${q}`, label: `Quý ${q}/${y}`, mode: "quarter" as const };
    });

  const yearOpts: PeriodOption[] = [...years]
    .sort((a, b) => b - a)
    .map((y) => ({ key: `y-${y}`, label: `Năm ${y}`, mode: "year" as const }));

  return [...monthOpts, ...quarterOpts, ...yearOpts];
}

/** Hoá đơn có thuộc kỳ `key` không */
export function inPeriod(dateIso: string | null, key: string): boolean {
  if (!dateIso) return false;
  const p = ym(dateIso);
  if (!p) return false;
  const [mode, y, extra] = key.split("-");
  if (mode === "m") {
    return p.y === Number(y) && p.m === Number(extra);
  }
  if (mode === "q") {
    return p.y === Number(y) && Math.ceil(p.m / 3) === Number(extra);
  }
  if (mode === "y") {
    return p.y === Number(y);
  }
  return false;
}

export type TaxSummary = {
  period: PeriodOption | undefined;
  // GTGT
  outNet: number; // doanh thu HHDV bán ra (chưa thuế)
  outVat: number; // thuế GTGT đầu ra
  inNetMatched: number; // giá trị mua vào ĐÃ có HĐ hợp lệ
  inVatDeductible: number; // thuế GTGT đầu vào được khấu trừ
  inNetPending: number; // chi phí CHƯA đủ HĐ (chưa được khấu trừ/trừ chi phí)
  inVatPending: number; // thuế GTGT đầu vào tiềm năng nếu thu đủ HĐ
  vatPayable: number; // [40] thuế GTGT còn phải nộp
  vatCarryForward: number; // [43] thuế GTGT còn được khấu trừ chuyển kỳ sau
  // TNDN
  revenue: number; // doanh thu tính thuế
  deductibleExpense: number; // chi phí được trừ (có HĐ hợp lệ)
  taxableProfit: number; // thu nhập tính thuế
  cit: number; // TNDN tạm nộp
  // đếm
  outCount: number;
  inCount: number;
};

export function computeTax(invoices: TaxInvoice[], key: string, options: PeriodOption[]): TaxSummary {
  const rows = invoices.filter((i) => inPeriod(i.date, key));
  const outs = rows.filter((r) => r.kind === "out");
  const ins = rows.filter((r) => r.kind === "in");
  const matchedIns = ins.filter((r) => r.status === "matched");
  const pendingIns = ins.filter((r) => r.status !== "matched");

  const sum = (arr: TaxInvoice[], f: (i: TaxInvoice) => number) =>
    arr.reduce((s, i) => s + f(i), 0);

  const outNet = sum(outs, (i) => i.net);
  const outVat = sum(outs, (i) => i.vat);
  const inNetMatched = sum(matchedIns, (i) => i.net);
  const inVatDeductible = sum(matchedIns, (i) => i.vat);
  const inNetPending = sum(pendingIns, (i) => i.net);
  const inVatPending = sum(pendingIns, (i) => i.vat);

  const vatBalance = outVat - inVatDeductible;
  const vatPayable = Math.max(0, vatBalance);
  const vatCarryForward = Math.max(0, -vatBalance);

  const revenue = outNet;
  const deductibleExpense = inNetMatched;
  const taxableProfit = Math.max(0, revenue - deductibleExpense);
  const cit = Math.round(taxableProfit * CIT_RATE);

  return {
    period: options.find((o) => o.key === key),
    outNet,
    outVat,
    inNetMatched,
    inVatDeductible,
    inNetPending,
    inVatPending,
    vatPayable,
    vatCarryForward,
    revenue,
    deductibleExpense,
    taxableProfit,
    cit,
    outCount: outs.length,
    inCount: ins.length,
  };
}
