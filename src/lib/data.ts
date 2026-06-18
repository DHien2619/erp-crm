import { createClient } from "@/lib/supabase/server";
import type {
  InvoiceIn as DbInvoiceIn,
  InvoiceOut as DbInvoiceOut,
  Company,
  Supplier,
  Receivable,
  Payable,
  MonthlyGap,
  CostCenter,
  BankAccount,
  Advance,
  PaymentRequest,
  Transaction,
  Budget,
  BankTransaction,
  Project,
  ProjectPayment,
  ProjectCost,
} from "@/lib/database.types";
import type {
  InvoiceIn,
  MonthlyPoint,
  RecentInvoice,
} from "@/lib/mock-data";

/** Tạo initials từ tên NCC: "Google Workspace" -> "GW" */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

/** Map row DB invoices_in -> shape UI (mock InvoiceIn) */
function mapInvoiceIn(r: DbInvoiceIn): InvoiceIn {
  return {
    id: r.id,
    code: r.code ?? "",
    supplier: r.supplier_name,
    initials: initialsOf(r.supplier_name),
    category: r.category,
    date: r.invoice_date ?? "",
    amount: Number(r.amount),
    vatRate: r.vat_rate,
    status: r.status,
    note: r.note ?? undefined,
  };
}

/** Danh sách hoá đơn đầu vào (mới nhất trước) */
export async function getInvoicesIn(): Promise<InvoiceIn[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices_in")
    .select("*")
    .order("invoice_date", { ascending: false });
  if (error) throw new Error(`getInvoicesIn: ${error.message}`);
  return (data ?? []).map(mapInvoiceIn);
}

export type InvoicesInQuery = {
  page?: number;
  q?: string;
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
};
export type InvoicesInPage = {
  rows: InvoiceIn[];
  total: number;
  page: number;
  pageSize: number;
};

const INVOICES_PAGE_SIZE = 12;

/** Hoá đơn đầu vào — phân trang + lọc + tìm kiếm SERVER-SIDE (chỉ tải đúng 1 trang). */
export async function getInvoicesInPaged(p: InvoicesInQuery): Promise<InvoicesInPage> {
  const supabase = await createClient();
  const page = Math.max(1, Number(p.page) || 1);
  const pageSize = INVOICES_PAGE_SIZE;

  let query = supabase.from("invoices_in").select("*", { count: "exact" });

  if (p.status && p.status !== "all")
    query = query.eq("status", p.status as DbInvoiceIn["status"]);
  if (p.category && p.category !== "all")
    query = query.eq("category", p.category as DbInvoiceIn["category"]);
  if (p.from) query = query.gte("invoice_date", p.from);
  if (p.to) query = query.lte("invoice_date", p.to);
  if (p.min) query = query.gte("amount", Number(p.min));
  if (p.max) query = query.lte("amount", Number(p.max));
  if (p.q) {
    const safe = p.q.replace(/[,()%*]/g, " ").trim();
    if (safe) query = query.or(`supplier_name.ilike.%${safe}%,code.ilike.%${safe}%`);
  }

  query = query
    .order("invoice_date", { ascending: false, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`getInvoicesInPaged: ${error.message}`);
  return {
    rows: (data ?? []).map(mapInvoiceIn),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export type InvoicesInStats = {
  total: number;
  totalAmount: number;
  missing: number;
  missingAmount: number;
};

/** Tổng hợp toàn bộ hoá đơn đầu vào cho 3 card thống kê (không phụ thuộc trang). */
export async function getInvoicesInStats(): Promise<InvoicesInStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices_in").select("amount, status");
  if (error) throw new Error(`getInvoicesInStats: ${error.message}`);
  const rows = (data ?? []) as { amount: number; status: string }[];
  const missingRows = rows.filter((r) => r.status === "missing");
  return {
    total: rows.length,
    totalAmount: rows.reduce((s, r) => s + Number(r.amount), 0),
    missing: missingRows.length,
    missingAmount: missingRows.reduce((s, r) => s + Number(r.amount), 0),
  };
}

/** 5 hoá đơn đầu vào gần nhất cho right rail Dashboard */
export async function getRecentInvoices(limit = 5): Promise<RecentInvoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices_in")
    .select("*")
    .order("invoice_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentInvoices: ${error.message}`);
  return (data ?? []).map((r: DbInvoiceIn) => ({
    id: r.id,
    supplier: r.supplier_name,
    amount: Number(r.amount),
    status: r.status,
    date: shortDate(r.invoice_date),
    initials: initialsOf(r.supplier_name),
  }));
}

/** 5 hoá đơn đầu ra gần nhất (cho tab "Đầu ra" của right rail) */
export async function getRecentInvoicesOut(limit = 5): Promise<RecentInvoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices_out")
    .select("*")
    .order("invoice_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentInvoicesOut: ${error.message}`);
  return (data ?? []).map((r: DbInvoiceOut) => ({
    id: r.id,
    supplier: r.company_name,
    amount: Number(r.amount),
    status: r.status,
    date: shortDate(r.invoice_date),
    initials: initialsOf(r.company_name),
  }));
}

/** Dữ liệu gap theo tháng từ view monthly_gap (đổi VND -> triệu) */
export async function getMonthlyPoints(): Promise<MonthlyPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_gap")
    .select("*")
    .order("month", { ascending: true });
  if (error) throw new Error(`getMonthlyPoints: ${error.message}`);
  const toM = (n: number) => Math.round(Number(n) / 1_000_000);
  return (data ?? []).map((r: MonthlyGap) => {
    const monthNum = new Date(r.month).getMonth() + 1;
    return {
      month: `T${monthNum}`,
      revenue: toM(r.revenue),
      expense: toM(r.expense),
      invoiceIn: toM(r.invoice_in),
    };
  });
}

/** Tổng hợp luỹ kế (VND) cho các card Dashboard — cộng tất cả các tháng có dữ liệu */
export async function getCurrentMonthSummary() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("monthly_gap").select("*");
  if (error) throw new Error(`getCurrentMonthSummary: ${error.message}`);
  const rows = (data ?? []) as MonthlyGap[];
  const revenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
  const expense = rows.reduce((s, r) => s + Number(r.expense), 0);
  const invoiceIn = rows.reduce((s, r) => s + Number(r.invoice_in), 0);
  return { revenue, expense, invoiceIn, gap: Math.max(0, expense - invoiceIn) };
}

export type DailyCashflow = { date: string; revenue: number; expense: number };

/** Dòng tiền theo ngày (VND) — gộp doanh thu (invoices_out) + chi phí (expenses) theo ngày */
export async function getCashflowDaily(): Promise<DailyCashflow[]> {
  const supabase = await createClient();
  const [exp, out] = await Promise.all([
    supabase.from("invoices_in").select("invoice_date, amount"),
    supabase.from("invoices_out").select("invoice_date, amount"),
  ]);
  if (exp.error) throw new Error(`getCashflowDaily/exp: ${exp.error.message}`);
  if (out.error) throw new Error(`getCashflowDaily/out: ${out.error.message}`);

  const map = new Map<string, DailyCashflow>();
  const touch = (d: string) => {
    let row = map.get(d);
    if (!row) {
      row = { date: d, revenue: 0, expense: 0 };
      map.set(d, row);
    }
    return row;
  };
  for (const e of exp.data ?? []) {
    if (!e.invoice_date) continue;
    touch(e.invoice_date).expense += Number(e.amount);
  }
  for (const o of out.data ?? []) {
    if (!o.invoice_date) continue;
    touch(o.invoice_date).revenue += Number(o.amount);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Hoá đơn mua vào + bán ra đã chuẩn hoá cho báo cáo thuế (VND) */
export async function getTaxInvoices() {
  const supabase = await createClient();
  const [inn, out] = await Promise.all([
    supabase
      .from("invoices_in")
      .select("id, code, supplier_name, invoice_date, amount, vat_rate, status"),
    supabase
      .from("invoices_out")
      .select("id, code, company_name, invoice_date, amount, vat_rate, status"),
  ]);
  if (inn.error) throw new Error(`getTaxInvoices/in: ${inn.error.message}`);
  if (out.error) throw new Error(`getTaxInvoices/out: ${out.error.message}`);

  const mk = (
    r: { id: string; code: string | null; invoice_date: string | null; amount: number; vat_rate: number; status: DbInvoiceIn["status"] },
    kind: "in" | "out",
    partner: string
  ) => {
    const net = Number(r.amount);
    const vatRate = Number(r.vat_rate);
    return {
      id: r.id,
      kind,
      code: r.code ?? "",
      partner,
      date: r.invoice_date,
      net,
      vatRate,
      vat: Math.round((net * vatRate) / 100),
      status: r.status,
    };
  };

  return [
    ...(inn.data ?? []).map((r) => mk(r, "in", r.supplier_name)),
    ...(out.data ?? []).map((r) => mk(r, "out", r.company_name)),
  ];
}

/** Doanh thu đầu ra */
export async function getInvoicesOut(): Promise<DbInvoiceOut[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices_out")
    .select("*")
    .order("invoice_date", { ascending: false });
  if (error) throw new Error(`getInvoicesOut: ${error.message}`);
  return data ?? [];
}

export type CompanyWithStats = Company & {
  revenue: number;
  outstanding: number;
  invoiceCount: number;
};

/** Khách hàng + doanh thu & công nợ phải thu mỗi khách */
export async function getCompaniesWithStats(): Promise<CompanyWithStats[]> {
  const supabase = await createClient();
  const [co, out] = await Promise.all([
    supabase.from("companies").select("*").order("created_at", { ascending: true }),
    supabase.from("invoices_out").select("company_name, amount, paid_amount"),
  ]);
  if (co.error) throw new Error(`getCompanies: ${co.error.message}`);
  if (out.error) throw new Error(`getCompanies/out: ${out.error.message}`);

  const agg = new Map<string, { revenue: number; outstanding: number; n: number }>();
  for (const o of out.data ?? []) {
    const k = (o.company_name || "").trim();
    const a = agg.get(k) ?? { revenue: 0, outstanding: 0, n: 0 };
    a.revenue += Number(o.amount);
    a.outstanding += Number(o.amount) - Number(o.paid_amount ?? 0);
    a.n += 1;
    agg.set(k, a);
  }
  return (co.data ?? []).map((c: Company) => {
    const a = agg.get((c.name || "").trim());
    return {
      ...c,
      revenue: a?.revenue ?? 0,
      outstanding: a?.outstanding ?? 0,
      invoiceCount: a?.n ?? 0,
    };
  });
}

export async function getSuppliersFull(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(`getSuppliersFull: ${error.message}`);
  return data ?? [];
}

export async function getReceivables(): Promise<Receivable[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("receivables").select("*");
  if (error) throw new Error(`getReceivables: ${error.message}`);
  return ((data ?? []) as Receivable[]).sort(
    (a, b) => Number(b.outstanding) - Number(a.outstanding)
  );
}

export async function getPayables(): Promise<Payable[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payables").select("*");
  if (error) throw new Error(`getPayables: ${error.message}`);
  return ((data ?? []) as Payable[]).sort(
    (a, b) => Number(b.outstanding) - Number(a.outstanding)
  );
}

// ---------- Module nghiệp vụ (Nhóm A) ----------
export async function getCostCenters(): Promise<CostCenter[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cost_centers").select("*").order("code");
  if (error) throw new Error(`getCostCenters: ${error.message}`);
  return data ?? [];
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bank_accounts").select("*").order("code");
  if (error) throw new Error(`getBankAccounts: ${error.message}`);
  return data ?? [];
}

export async function getAdvances(): Promise<Advance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("advances").select("*").order("advance_date", { ascending: false });
  if (error) throw new Error(`getAdvances: ${error.message}`);
  return data ?? [];
}

export async function getPaymentRequests(): Promise<PaymentRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payment_requests").select("*").order("request_date", { ascending: false });
  if (error) throw new Error(`getPaymentRequests: ${error.message}`);
  return data ?? [];
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").select("*").order("txn_date", { ascending: false });
  if (error) throw new Error(`getTransactions: ${error.message}`);
  return data ?? [];
}

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").select("*").order("quarter");
  if (error) throw new Error(`getBudgets: ${error.message}`);
  return data ?? [];
}

export type StrategyData = {
  revenue: number;
  expense: number;
  marketingSpend: number;
  gapMissing: number; // chi phí chưa có HĐ
  customerCount: number;
  receivableOutstanding: number;
  monthly: MonthlyPoint[]; // triệu đồng
};

/** Gom toàn bộ số liệu cho trang Đề xuất chiến lược (VND) */
export async function getStrategyData(): Promise<StrategyData> {
  const supabase = await createClient();
  const [out, inn, co, rec, monthly] = await Promise.all([
    supabase.from("invoices_out").select("amount"),
    supabase.from("invoices_in").select("amount, category, status"),
    supabase.from("companies").select("id"),
    supabase.from("receivables").select("outstanding"),
    getMonthlyPoints(),
  ]);
  if (out.error) throw new Error(`getStrategyData/out: ${out.error.message}`);
  if (inn.error) throw new Error(`getStrategyData/in: ${inn.error.message}`);

  const revenue = (out.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const inRows = inn.data ?? [];
  const expense = inRows.reduce((s, r) => s + Number(r.amount), 0);
  const marketingSpend = inRows
    .filter((r) => r.category === "marketing")
    .reduce((s, r) => s + Number(r.amount), 0);
  const gapMissing = inRows
    .filter((r) => r.status === "missing")
    .reduce((s, r) => s + Number(r.amount), 0);
  const customerCount = (co.data ?? []).length;
  const receivableOutstanding = ((rec.data ?? []) as { outstanding: number }[]).reduce(
    (s, r) => s + Number(r.outstanding),
    0
  );

  return {
    revenue,
    expense,
    marketingSpend,
    gapMissing,
    customerCount,
    receivableOutstanding,
    monthly,
  };
}

/** Tổng số dư đầu kỳ các tài khoản (VND) — dùng cho dự báo */
export async function getTotalOpeningBalance(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bank_accounts").select("opening_balance");
  if (error) throw new Error(`getTotalOpeningBalance: ${error.message}`);
  return (data ?? []).reduce((s, b) => s + Number(b.opening_balance), 0);
}

// ---------- Dự án ----------
export type ProjectWithStats = Project & {
  totalPaid: number; // khách đã thanh toán
  totalCost: number; // tổng chi phí dự án
};

/** Danh sách dự án + tổng đã thu / tổng chi phí mỗi dự án. [] nếu chưa chạy migration. */
export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const supabase = await createClient();
  const proj = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (proj.error) return []; // bảng chưa tồn tại
  const projects = (proj.data ?? []) as Project[];
  if (projects.length === 0) return [];

  const [pay, cost] = await Promise.all([
    supabase.from("project_payments").select("project_id, amount"),
    supabase.from("project_costs").select("project_id, amount"),
  ]);

  const sumBy = (rows: { project_id: string; amount: number }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.project_id, (m.get(r.project_id) ?? 0) + Number(r.amount));
    return m;
  };
  const paidMap = sumBy(pay.data as { project_id: string; amount: number }[] | null);
  const costMap = sumBy(cost.data as { project_id: string; amount: number }[] | null);

  return projects.map((p) => ({
    ...p,
    totalPaid: paidMap.get(p.id) ?? 0,
    totalCost: costMap.get(p.id) ?? 0,
  }));
}

export type ProjectDetail = {
  project: Project;
  payments: ProjectPayment[];
  costs: ProjectCost[];
};

/** Chi tiết 1 dự án + các đợt thanh toán + chi phí. null nếu không tìm thấy. */
export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const proj = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (proj.error || !proj.data) return null;

  const [pay, cost] = await Promise.all([
    supabase.from("project_payments").select("*").eq("project_id", id).order("paid_at", { ascending: true }),
    supabase.from("project_costs").select("*").eq("project_id", id).order("spent_at", { ascending: true }),
  ]);

  return {
    project: proj.data as Project,
    payments: (pay.data ?? []) as ProjectPayment[],
    costs: (cost.data ?? []) as ProjectCost[],
  };
}

// ---------- Báo cáo & KPI nâng cao ----------
export type KpiMonthly = {
  month: string; // "T4/2026"
  revenue: number;
  expense: number;
  gross: number; // lợi nhuận gộp ước tính = DT - CP
  net: number; // lợi nhuận ròng ước tính = gộp - thuế TNDN 20% (nếu lãi)
};
export type TopEntity = { name: string; amount: number; count: number };
export type OverdueDebt = {
  name: string;
  code: string | null;
  amount: number;
  dueDate: string | null;
  daysOverdue: number;
  kind: "AR" | "AP";
};
export type BudgetCompare = {
  label: string;
  budget: number;
  actual: number;
  usedPct: number;
};
export type KpiData = {
  monthly: KpiMonthly[];
  topCustomers: TopEntity[];
  topSuppliers: TopEntity[];
  overdue: OverdueDebt[];
  budgets: BudgetCompare[];
  forecast: { month: string; net: number; cumulative: number }[];
};

const CIT = 0.2;

function dayDiff(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/** Gom toàn bộ số liệu cho trang KPI nâng cao (VND). */
export async function getKpiData(): Promise<KpiData> {
  const supabase = await createClient();
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [gap, out, inn, budgetRows] = await Promise.all([
    supabase.from("monthly_gap").select("*").order("month", { ascending: true }),
    supabase.from("invoices_out").select("company_name, amount, paid_amount, due_date, code, status"),
    supabase.from("invoices_in").select("supplier_name, amount, paid_amount, due_date, code, status"),
    supabase.from("budgets").select("*"),
  ]);

  // Lợi nhuận theo tháng
  const monthly: KpiMonthly[] = ((gap.data ?? []) as MonthlyGap[]).map((r) => {
    const revenue = Number(r.revenue);
    const expense = Number(r.expense);
    const gross = revenue - expense;
    const net = gross > 0 ? Math.round(gross * (1 - CIT)) : gross;
    const d = new Date(r.month);
    return { month: `T${d.getMonth() + 1}/${d.getFullYear()}`, revenue, expense, gross, net };
  });

  // Top khách hàng theo doanh thu
  const custMap = new Map<string, TopEntity>();
  for (const o of out.data ?? []) {
    const k = (o.company_name || "—").trim();
    const e = custMap.get(k) ?? { name: k, amount: 0, count: 0 };
    e.amount += Number(o.amount);
    e.count += 1;
    custMap.set(k, e);
  }
  const topCustomers = [...custMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);

  // Top nhà cung cấp theo chi phí
  const supMap = new Map<string, TopEntity>();
  for (const i of inn.data ?? []) {
    const k = (i.supplier_name || "—").trim();
    const e = supMap.get(k) ?? { name: k, amount: 0, count: 0 };
    e.amount += Number(i.amount);
    e.count += 1;
    supMap.set(k, e);
  }
  const topSuppliers = [...supMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);

  // Công nợ quá hạn (AR: khách chưa trả đủ & quá hạn; AP: mình chưa trả NCC & quá hạn)
  const overdue: OverdueDebt[] = [];
  for (const o of out.data ?? []) {
    const out_ = Number(o.amount) - Number(o.paid_amount ?? 0);
    if (out_ <= 0 || !o.due_date) continue;
    const due = new Date(o.due_date);
    const d = dayDiff(todayMid, new Date(due.getFullYear(), due.getMonth(), due.getDate()));
    if (d > 0) overdue.push({ name: o.company_name, code: o.code, amount: out_, dueDate: o.due_date, daysOverdue: d, kind: "AR" });
  }
  for (const i of inn.data ?? []) {
    const out_ = Number(i.amount) - Number(i.paid_amount ?? 0);
    if (out_ <= 0 || !i.due_date) continue;
    const due = new Date(i.due_date);
    const d = dayDiff(todayMid, new Date(due.getFullYear(), due.getMonth(), due.getDate()));
    if (d > 0) overdue.push({ name: i.supplier_name, code: i.code, amount: out_, dueDate: i.due_date, daysOverdue: d, kind: "AP" });
  }
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Ngân sách vs thực chi
  const budgets: BudgetCompare[] = ((budgetRows.data ?? []) as Budget[]).map((b) => {
    const budget = Number(b.budget);
    const actual = Number(b.actual);
    return {
      label: `${b.quarter ?? ""} · ${b.cost_center ?? "—"}`.trim(),
      budget,
      actual,
      usedPct: budget ? Math.round((actual / budget) * 100) : 0,
    };
  });

  // Dự báo dòng tiền 6 tháng tới (auto): trung bình net 3 tháng gần nhất
  const lastNet = monthly.slice(-3).map((m) => m.revenue - m.expense);
  const avgNet = lastNet.length ? Math.round(lastNet.reduce((s, n) => s + n, 0) / lastNet.length) : 0;
  const forecast: { month: string; net: number; cumulative: number }[] = [];
  let cum = 0;
  for (let k = 1; k <= 6; k++) {
    const d = new Date(today.getFullYear(), today.getMonth() + k, 1);
    cum += avgNet;
    forecast.push({ month: `T${d.getMonth() + 1}/${d.getFullYear()}`, net: avgNet, cumulative: cum });
  }

  return { monthly, topCustomers, topSuppliers, overdue, budgets, forecast };
}

/** Biến động số dư ngân hàng (SePay). Trả [] nếu bảng chưa tạo (chưa chạy migration). */
export async function getBankTransactions(limit = 200): Promise<BankTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_transactions")
    .select("*")
    .order("txn_date", { ascending: false })
    .order("sepay_id", { ascending: false }) // tie-break: cùng phút -> id lớn (mới) lên trước
    .limit(limit);
  if (error) return []; // bảng chưa tồn tại -> rỗng (không vỡ trang)
  return (data ?? []) as BankTransaction[];
}
