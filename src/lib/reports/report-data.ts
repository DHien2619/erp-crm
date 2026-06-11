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

/** Dựng nội dung text cho Google Docs — bố cục trang trọng (title, mục La Mã, kẻ phân cách). */
export function buildPlainText(d: ReportData): string {
  const RULE = "─".repeat(56);
  const m = (n: number) => `${fmtVND(n * 1_000_000)}`;
  const monthName = (t: string) => t.replace(/^T/, "Tháng ");

  const monthlyLines = d.rows.length
    ? d.rows
        .map(
          (r) =>
            `      • ${monthName(r.month)}  —  Doanh thu ${r.revenue} · Chi phí ${r.expense} · HĐ vào ${r.invoiceIn} · GAP ${r.gap}`
        )
        .join("\n")
    : "      (chưa có dữ liệu)";

  return [
    "BÁO CÁO TÀI CHÍNH",
    "AIECOS",
    `${d.periodText}  ·  Xuất ngày ${d.dateStr}`,
    "",
    RULE,
    "",
    "I.  TỔNG QUAN",
    "",
    `      • Doanh thu:  ${m(d.sum.revenue)}`,
    `      • Chi phí thực:  ${m(d.sum.expense)}`,
    `      • Hoá đơn đầu vào đã có (${d.sum.coverage}%):  ${m(d.sum.invoiceIn)}`,
    `      • GAP — chi phí chưa có hoá đơn:  ${m(d.sum.gap)}`,
    `      • Thuế TNDN tiết kiệm nếu bù đủ GAP (~20%):  ${m(d.sum.taxSaving)}`,
    "",
    "II.  DÒNG TIỀN THEO THÁNG    (đơn vị: triệu đồng)",
    "",
    monthlyLines,
    "",
    "III.  CÔNG NỢ HIỆN TẠI",
    "",
    `      • Phải thu (khách hàng):  ${fmtVND(d.arTotal)}`,
    `      • Phải trả (nhà cung cấp):  ${fmtVND(d.apTotal)}`,
    "",
    RULE,
    "",
    `Báo cáo được tạo tự động từ hệ thống ERP-CRM AIECOS · ${d.dateStr}`,
  ].join("\n");
}
