export type TaxDeadlineItem = {
  label: string;
  date: string; // "dd/mm"
  iso: string; // yyyy-mm-dd
  daysLeft: number;
  urgent: boolean;
};

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Sinh các deadline thuế VN sắp tới tính từ `now`:
 * - Tờ khai GTGT tháng: ngày 20 hằng tháng (cho tháng liền trước)
 * - Tạm nộp TNDN quý + tờ khai GTGT quý: ngày cuối tháng đầu quý sau
 * - Quyết toán năm: 31/03 năm sau
 */
export function getUpcomingTaxDeadlines(
  now: Date = new Date(),
  count = 4
): TaxDeadlineItem[] {
  const candidates: { label: string; d: Date }[] = [];
  const y = now.getFullYear();

  // VAT tháng — ngày 20 của 12 tháng tới
  for (let i = 0; i < 12; i++) {
    const d = new Date(y, now.getMonth() + i, 20);
    const prevMonth = ((d.getMonth() + 11 - 1) % 12) + 1; // tháng kê khai = tháng trước
    candidates.push({ label: `Tờ khai GTGT tháng ${prevMonth}`, d });
  }

  // TNDN tạm nộp theo quý — ngày 30 tháng đầu quý sau (quý 1..4)
  for (let q = 0; q < 5; q++) {
    const firstMonthNextQuarter = Math.floor(now.getMonth() / 3) * 3 + 3 + q * 3;
    const d = new Date(y, firstMonthNextQuarter, 30);
    const quarter = Math.floor(((firstMonthNextQuarter - 1) / 3)) % 4 || 4;
    candidates.push({ label: `Tạm nộp TNDN quý ${quarter}`, d });
  }

  // Quyết toán năm
  candidates.push({ label: "Quyết toán thuế năm", d: new Date(y + 1, 2, 31) });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return candidates
    .filter((c) => c.d >= today)
    .sort((a, b) => a.d.getTime() - b.d.getTime())
    .slice(0, count)
    .map((c) => {
      const daysLeft = Math.round((c.d.getTime() - today.getTime()) / 86400000);
      return {
        label: c.label,
        date: `${String(c.d.getDate()).padStart(2, "0")}/${String(
          c.d.getMonth() + 1
        ).padStart(2, "0")}`,
        iso: iso(c.d),
        daysLeft,
        urgent: daysLeft <= 7,
      };
    });
}
