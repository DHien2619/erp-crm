import {
  getKpiData,
  getFinanceData,
  getProjectsWithStats,
} from "@/lib/data";

/** Định nghĩa tool theo chuẩn function-calling (Groq/OpenAI). */
export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_financial_overview",
      description:
        "Tổng quan tài chính: doanh thu, chi phí, lợi nhuận gộp & ròng (ước tính) theo từng tháng và luỹ kế. Dùng khi hỏi lãi/lỗ, doanh thu, chi phí.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_overdue_debts",
      description:
        "Danh sách công nợ quá hạn: phải thu (khách nợ) và phải trả (nợ NCC), kèm số ngày quá hạn và số tiền. Dùng khi hỏi ai nợ, nợ quá hạn.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_top_customers",
      description: "Top khách hàng theo doanh thu (kèm số tiền và số hoá đơn).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_top_suppliers",
      description: "Top nhà cung cấp theo chi phí (kèm số tiền và số hoá đơn).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_invoice_gap",
      description:
        "Khoảng cách (gap) giữa chi phí thực và hoá đơn đã có theo tháng — cần bao nhiêu hoá đơn để cân, tiết kiệm thuế. Dùng khi hỏi thiếu hoá đơn, cần bù bao nhiêu.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_projects",
      description:
        "Danh sách dự án kèm giá trị, đã thu, chi phí, lãi/lỗ. Dùng khi hỏi về dự án.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  // ----- WRITE (đề xuất — cần người dùng xác nhận trước khi lưu) -----
  {
    type: "function" as const,
    function: {
      name: "propose_add_expense",
      description:
        "ĐỀ XUẤT thêm 1 hoá đơn/chi phí đầu vào. KHÔNG lưu ngay — hệ thống sẽ hỏi người dùng xác nhận. Gọi khi người dùng muốn ghi nhận chi phí mua vào.",
      parameters: {
        type: "object",
        properties: {
          supplier_name: { type: "string", description: "Tên nhà cung cấp" },
          amount: { type: "number", description: "Số tiền trước VAT (VND)" },
          category: {
            type: "string",
            description: "Hạng mục: saas, marketing, travel, office, fnb, logistics, freelancer, other",
          },
          vat_rate: { type: "number", description: "% VAT (0,5,8,10). Mặc định 10." },
          note: { type: "string", description: "Ghi chú (tuỳ chọn)" },
        },
        required: ["supplier_name", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_add_revenue",
      description:
        "ĐỀ XUẤT ghi nhận doanh thu (hoá đơn đầu ra) cho khách hàng. KHÔNG lưu ngay — hệ thống sẽ hỏi xác nhận. Gọi khi người dùng muốn ghi doanh thu.",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "Tên khách hàng" },
          amount: { type: "number", description: "Số tiền trước VAT (VND)" },
          vat_rate: { type: "number", description: "% VAT (0,8,10). Mặc định 10." },
          note: { type: "string", description: "Ghi chú (tuỳ chọn)" },
        },
        required: ["company_name", "amount"],
      },
    },
  },
];

/** Các tool ghi — route sẽ DỪNG và trả về để client xác nhận, không tự chạy. */
export const WRITE_TOOLS = new Set(["propose_add_expense", "propose_add_revenue"]);

/** Chạy 1 tool ĐỌC, trả về chuỗi JSON ngắn gọn cho model. */
export async function runReadTool(name: string, _args: Record<string, unknown>): Promise<string> {
  const m = (n: number) => Math.round(n);
  if (name === "get_financial_overview") {
    const kpi = await getKpiData();
    const revenue = kpi.monthly.reduce((s, x) => s + x.revenue, 0);
    const expense = kpi.monthly.reduce((s, x) => s + x.expense, 0);
    const net = kpi.monthly.reduce((s, x) => s + x.net, 0);
    return JSON.stringify({
      luy_ke: { doanh_thu: m(revenue), chi_phi: m(expense), loi_nhuan_gop: m(revenue - expense), loi_nhuan_rong_uoc_tinh: m(net) },
      theo_thang: kpi.monthly.map((x) => ({ thang: x.month, doanh_thu: m(x.revenue), chi_phi: m(x.expense), ln_rong: m(x.net) })),
    });
  }
  if (name === "get_overdue_debts") {
    const kpi = await getKpiData();
    const total = kpi.overdue.reduce((s, o) => s + o.amount, 0);
    return JSON.stringify({
      tong_qua_han: m(total),
      so_khoan: kpi.overdue.length,
      chi_tiet: kpi.overdue.slice(0, 15).map((o) => ({
        loai: o.kind === "AR" ? "phai_thu" : "phai_tra",
        doi_tac: o.name,
        so_tien: m(o.amount),
        qua_han_ngay: o.daysOverdue,
      })),
    });
  }
  if (name === "get_top_customers") {
    const kpi = await getKpiData();
    return JSON.stringify(kpi.topCustomers.map((c) => ({ khach: c.name, doanh_thu: m(c.amount), so_hd: c.count })));
  }
  if (name === "get_top_suppliers") {
    const kpi = await getKpiData();
    return JSON.stringify(kpi.topSuppliers.map((c) => ({ ncc: c.name, chi_phi: m(c.amount), so_hd: c.count })));
  }
  if (name === "get_invoice_gap") {
    const fin = await getFinanceData();
    // gap = chi phí chưa đủ HĐ (status != matched) trong invoices_in
    const pending = fin.in.filter((r) => r.status !== "matched");
    const gapTotal = pending.reduce((s, r) => s + r.net, 0);
    return JSON.stringify({
      chi_phi_chua_du_hoa_don: m(gapTotal),
      so_khoan_thieu_hd: pending.length,
      thue_tndn_tiet_kiem_uoc_tinh: m(gapTotal * 0.2),
      ghi_chu: "Nếu thu đủ hoá đơn hợp lệ cho phần này sẽ được trừ chi phí và giảm thuế.",
    });
  }
  if (name === "get_projects") {
    const ps = await getProjectsWithStats();
    return JSON.stringify(
      ps.map((p) => ({
        ten: p.name,
        khach: p.client_name,
        gia_tri: m(Number(p.contract_value)),
        da_thu: m(p.totalPaid),
        chi_phi: m(p.totalCost),
        lai_lo: m(p.totalPaid - p.totalCost),
      }))
    );
  }
  return JSON.stringify({ error: "unknown tool" });
}
