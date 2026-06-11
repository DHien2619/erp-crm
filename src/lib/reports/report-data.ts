import { getMonthlyPoints, getReceivables, getPayables } from "@/lib/data";
import {
  getGapByMonth,
  getPeriodSummary,
  periodLabel,
  type PeriodKey,
  type GapRow,
} from "@/lib/analytics";

export type ReportData = {
  period: PeriodKey;
  title: string;
  dateStr: string;
  periodText: string;
  sum: ReturnType<typeof getPeriodSummary>;
  rows: GapRow[];
  arTotal: number;
  apTotal: number;
};

export function normalizePeriod(raw: string | null): PeriodKey {
  return raw === "month" || raw === "year" ? raw : "quarter";
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n)) +
  " ₫";

/** Gom toàn bộ số liệu báo cáo theo kỳ (dùng chung cho .docx và Google Doc). */
export async function getReportData(period: PeriodKey): Promise<ReportData> {
  const [points, receivables, payables] = await Promise.all([
    getMonthlyPoints(),
    getReceivables(),
    getPayables(),
  ]);
  const rows = getGapByMonth(points);
  const sum = getPeriodSummary(period, rows);
  const arTotal = receivables.reduce((s, r) => s + Number(r.outstanding), 0);
  const apTotal = payables.reduce((s, r) => s + Number(r.outstanding), 0);

  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return {
    period,
    title: `Báo cáo tài chính AIECOS — ${periodLabel[period]} (${dateStr})`,
    dateStr,
    periodText: periodLabel[period],
    sum,
    rows: sum.rows,
    arTotal,
    apTotal,
  };
}

/** Dựng nội dung dạng text thuần cho Google Docs (insertText). */
export function buildPlainText(d: ReportData): string {
  const monthlyLines = d.rows
    .map(
      (r) =>
        `  ${r.month}\t\tDT ${r.revenue} tr\tChi phí ${r.expense} tr\tHĐ vào ${r.invoiceIn} tr\tGAP ${r.gap} tr`
    )
    .join("\n");

  return [
    "1. TỔNG QUAN",
    `   • Doanh thu:                ${fmtVND(d.sum.revenue * 1_000_000)}`,
    `   • Chi phí thực:             ${fmtVND(d.sum.expense * 1_000_000)}`,
    `   • Hoá đơn đầu vào đã có (${d.sum.coverage}%): ${fmtVND(d.sum.invoiceIn * 1_000_000)}`,
    `   • GAP (chi phí chưa có HĐ): ${fmtVND(d.sum.gap * 1_000_000)}`,
    `   • Thuế TNDN tiết kiệm nếu bù đủ GAP (~20%): ${fmtVND(d.sum.taxSaving * 1_000_000)}`,
    "",
    "2. DÒNG TIỀN THEO THÁNG (triệu đồng)",
    monthlyLines || "   (chưa có dữ liệu)",
    "",
    "3. CÔNG NỢ HIỆN TẠI",
    `   • Phải thu (khách hàng):    ${fmtVND(d.arTotal)}`,
    `   • Phải trả (nhà cung cấp):  ${fmtVND(d.apTotal)}`,
    "",
    "— Báo cáo tạo tự động từ ERP-CRM AIECOS.",
  ].join("\n");
}
