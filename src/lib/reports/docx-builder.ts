import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  TableLayoutType,
  VerticalAlign,
  HeightRule,
  Footer,
  PageNumber,
} from "docx";
import type { ReportData } from "@/lib/reports/report-data";

const PRIMARY = "5B4FCF";
const PRIMARY_DEEP = "3F35A8";
const INK = "1C1B3A";
const MUTED = "6B6A8A";
const BORDER = "E7E6F4";
const ZEBRA = "F5F4FF";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n)) +
  " ₫";
const fmtNum = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n));

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const noBorders = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};
const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: BORDER } as const;
const gridBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
  insideHorizontal: thinBorder,
  insideVertical: thinBorder,
};

/** Tiêu đề mục: chữ tím + gạch chân mảnh. */
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 24, color: PRIMARY_DEEP })],
  });
}

/** Ô tiêu đề bảng (nền tím, chữ trắng). */
function th(text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) {
  return new TableCell({
    shading: { fill: PRIMARY },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })],
      }),
    ],
  });
}

/** Ô dữ liệu (zebra theo dòng). */
function td(
  text: string,
  opts: { right?: boolean; zebra?: boolean; bold?: boolean; color?: string } = {}
) {
  return new TableCell({
    shading: opts.zebra ? { fill: ZEBRA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [
          new TextRun({ text, size: 18, bold: opts.bold, color: opts.color ?? INK }),
        ],
      }),
    ],
  });
}

/** Bảng 2 cột "nhãn — giá trị" (không kẻ viền, zebra nhẹ). */
function kvTable(rows: { label: string; value: string; strong?: boolean }[]): Table {
  return new Table({
    layout: TableLayoutType.FIXED,
    columnWidths: [5600, 3420],
    width: { size: 9020, type: WidthType.DXA },
    borders: noBorders,
    rows: rows.map(
      (r, i) =>
        new TableRow({
          cantSplit: true,
          height: { value: 360, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({
              shading: i % 2 === 1 ? { fill: ZEBRA } : undefined,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 50, bottom: 50, left: 140, right: 120 },
              children: [
                new Paragraph({ children: [new TextRun({ text: r.label, size: 19, color: MUTED })] }),
              ],
            }),
            new TableCell({
              shading: i % 2 === 1 ? { fill: ZEBRA } : undefined,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 50, bottom: 50, left: 120, right: 140 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: r.value,
                      bold: true,
                      size: 19,
                      color: r.strong ? PRIMARY_DEEP : INK,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

/** Dựng file Word báo cáo tài chính (đã chuẩn hoá: cố định cột, lặp header, zebra). */
export async function buildReportDocxBuffer(
  data: ReportData
): Promise<Uint8Array<ArrayBuffer>> {
  const { sum, arTotal, apTotal, dateStr, periodText } = data;

  // ----- Bảng dòng tiền: header lặp lại + dòng không cắt ngang trang -----
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    height: { value: 420, rule: HeightRule.ATLEAST },
    children: [
      th("Tháng"),
      th("Doanh thu", AlignmentType.RIGHT),
      th("Chi phí thực", AlignmentType.RIGHT),
      th("HĐ đã có", AlignmentType.RIGHT),
      th("GAP", AlignmentType.RIGHT),
      th("Thuế TK", AlignmentType.RIGHT),
    ],
  });
  const dataRows = sum.rows.map((r, i) => {
    const z = i % 2 === 1;
    return new TableRow({
      cantSplit: true,
      height: { value: 360, rule: HeightRule.ATLEAST },
      children: [
        td(r.month, { zebra: z, bold: true }),
        td(fmtNum(r.revenue), { right: true, zebra: z }),
        td(fmtNum(r.expense), { right: true, zebra: z }),
        td(fmtNum(r.invoiceIn), { right: true, zebra: z }),
        td(fmtNum(r.gap), { right: true, zebra: z, color: r.gap > 0 ? "C2410C" : INK }),
        td(fmtNum(r.taxSaving), { right: true, zebra: z }),
      ],
    });
  });

  const monthlyTable = new Table({
    layout: TableLayoutType.FIXED,
    columnWidths: [1180, 1568, 1568, 1568, 1568, 1568],
    width: { size: 9020, type: WidthType.DXA },
    borders: gridBorders,
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    creator: "ERP-CRM AIECOS",
    title: data.title,
    styles: { default: { document: { run: { font: "Calibri", size: 20, color: INK } } } },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 1080, bottom: 1134, left: 1080 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 6 } },
                tabStops: [{ type: "right", position: 9020 }],
                children: [
                  new TextRun({ text: "ERP-CRM · AIECOS", size: 15, color: MUTED }),
                  new TextRun({ text: "\tTrang ", size: 15, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, color: MUTED }),
                  new TextRun({ text: " / ", size: 15, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ----- Tiêu đề -----
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "BÁO CÁO TÀI CHÍNH", bold: true, size: 40, color: PRIMARY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "AIECOS", bold: true, size: 22, color: PRIMARY_DEEP, characterSpacing: 60 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY, space: 8 } },
            children: [
              new TextRun({ text: `${periodText}  ·  Xuất ngày ${dateStr}`, italics: true, size: 19, color: MUTED }),
            ],
          }),

          // ----- 1. Tổng quan -----
          sectionHeading("1. Tổng quan"),
          kvTable([
            { label: "Doanh thu", value: fmtVND(sum.revenue * 1_000_000) },
            { label: "Chi phí thực", value: fmtVND(sum.expense * 1_000_000) },
            { label: `Hoá đơn đầu vào đã có (${sum.coverage}%)`, value: fmtVND(sum.invoiceIn * 1_000_000) },
            { label: "GAP — chi phí chưa có hoá đơn", value: fmtVND(sum.gap * 1_000_000), strong: true },
            { label: "Thuế TNDN tiết kiệm nếu bù đủ GAP (~20%)", value: fmtVND(sum.taxSaving * 1_000_000), strong: true },
          ]),

          // ----- 2. Dòng tiền theo tháng -----
          sectionHeading("2. Dòng tiền theo tháng"),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: "Đơn vị: triệu đồng", italics: true, size: 16, color: MUTED })],
          }),
          monthlyTable,

          // ----- 3. Công nợ -----
          sectionHeading("3. Công nợ hiện tại"),
          kvTable([
            { label: "Phải thu (khách hàng)", value: fmtVND(arTotal) },
            { label: "Phải trả (nhà cung cấp)", value: fmtVND(apTotal) },
          ]),

          new Paragraph({
            spacing: { before: 360 },
            children: [
              new TextRun({ text: "Báo cáo tạo tự động từ hệ thống ERP-CRM AIECOS.", italics: true, size: 16, color: "A8A7BF" }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const out = new Uint8Array(buffer.length);
  out.set(buffer);
  return out;
}
