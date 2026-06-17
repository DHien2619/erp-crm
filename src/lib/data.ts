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
