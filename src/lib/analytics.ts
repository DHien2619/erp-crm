import {
  invoicesIn,
  monthlyData,
  categoryLabel,
  type InvoiceCategory,
  type InvoiceIn,
} from "./mock-data";

/** Thuế suất TNDN hiện hành (%) */
export const CIT_RATE = 0.2;

export type SupplierStat = {
  name: string;
  initials: string;
  category: InvoiceCategory;
  categoryText: string;
  invoiceCount: number;
  totalAmount: number;
  matchedAmount: number;
  outstandingAmount: number; // pending + missing
  missingAmount: number;
  collectedPct: number; // matched / total
  vatRecoverable: number; // VAT có thể khấu trừ nếu thu đủ HĐ còn thiếu
  easeToCollect: "easy" | "medium" | "hard";
};

/** NCC nào dễ xin HĐ điện tử tự động */
const EASY_SUPPLIERS = [
  "google",
  "facebook",
  "tiktok",
  "linkedin",
  "lazada",
  "aws",
  "microsoft",
  "vercel",
  "anthropic",
  "chatgpt",
  "notion",
  "vnpt",
];
const HARD_CATEGORIES: InvoiceCategory[] = ["freelancer", "fnb"];

function easeOf(supplier: string, category: InvoiceCategory): SupplierStat["easeToCollect"] {
  const s = supplier.toLowerCase();
  if (EASY_SUPPLIERS.some((k) => s.includes(k))) return "easy";
  if (HARD_CATEGORIES.includes(category)) return "hard";
  return "medium";
}

/** Tổng hợp NCC từ danh sách hoá đơn đầu vào */
export function getSupplierStats(source: InvoiceIn[] = invoicesIn): SupplierStat[] {
  const map = new Map<string, InvoiceIn[]>();
  for (const inv of source) {
    const arr = map.get(inv.supplier) ?? [];
    arr.push(inv);
    map.set(inv.supplier, arr);
  }

  const stats: SupplierStat[] = [];
  for (const [name, list] of map) {
    const first = list[0];
    const totalAmount = list.reduce((s, i) => s + i.amount, 0);
    const matchedAmount = list
      .filter((i) => i.status === "matched")
      .reduce((s, i) => s + i.amount, 0);
    const missingAmount = list
      .filter((i) => i.status === "missing")
      .reduce((s, i) => s + i.amount, 0);
    const outstandingAmount = list
      .filter((i) => i.status !== "matched")
      .reduce((s, i) => s + i.amount, 0);
    const vatRecoverable = list
      .filter((i) => i.status !== "matched")
      .reduce((s, i) => s + (i.amount * i.vatRate) / 100, 0);

    stats.push({
      name,
      initials: first.initials,
      category: first.category,
      categoryText: categoryLabel[first.category],
      invoiceCount: list.length,
      totalAmount,
      matchedAmount,
      outstandingAmount,
      missingAmount,
      collectedPct: totalAmount ? Math.round((matchedAmount / totalAmount) * 100) : 0,
      vatRecoverable: Math.round(vatRecoverable),
      easeToCollect: easeOf(name, first.category),
    });
  }

  return stats.sort((a, b) => b.outstandingAmount - a.outstandingAmount);
}

export type GapRow = {
  month: string;
  revenue: number; // triệu
  expense: number;
  invoiceIn: number;
  gap: number;
  taxSaving: number; // triệu, nếu bù đủ gap
};

/** Bảng gap theo tháng (đơn vị: triệu đồng) */
export function getGapByMonth(source: typeof monthlyData = monthlyData): GapRow[] {
  return source.map((m) => {
    const gap = Math.max(0, m.expense - m.invoiceIn);
    return {
      month: m.month,
      revenue: m.revenue,
      expense: m.expense,
      invoiceIn: m.invoiceIn,
      gap,
      taxSaving: Math.round(gap * CIT_RATE),
    };
  });
}

export type PeriodKey = "month" | "quarter" | "year";

const QUARTER_MONTHS: Record<string, string[]> = {
  // Quý hiện tại: Q2 = T4, T5, T6 (đơn giản hoá cho demo)
  quarter: ["T4", "T5", "T6"],
};

/** Tổng hợp theo kỳ (triệu đồng) */
export function getPeriodSummary(period: PeriodKey, rows: GapRow[] = getGapByMonth()) {
  let selected = rows;
  if (period === "month") selected = rows.filter((r) => r.month === "T6");
  else if (period === "quarter")
    selected = rows.filter((r) => QUARTER_MONTHS.quarter.includes(r.month));

  const revenue = selected.reduce((s, r) => s + r.revenue, 0);
  const expense = selected.reduce((s, r) => s + r.expense, 0);
  const invoiceIn = selected.reduce((s, r) => s + r.invoiceIn, 0);
  const gap = selected.reduce((s, r) => s + r.gap, 0);
  const taxSaving = selected.reduce((s, r) => s + r.taxSaving, 0);
  const coverage = expense ? Math.round((invoiceIn / expense) * 100) : 0;

  return { rows: selected, revenue, expense, invoiceIn, gap, taxSaving, coverage };
}

export const periodLabel: Record<PeriodKey, string> = {
  month: "Tháng 6/2026",
  quarter: "Quý 2/2026",
  year: "Năm 2026",
};
