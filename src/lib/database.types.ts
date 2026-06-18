// Types khớp với supabase/schema.sql.
// Sau khi tạo project thật, có thể tự sinh lại bằng:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type InvoiceStatus = "matched" | "pending" | "missing";
export type InvoiceCategoryDb =
  | "saas"
  | "marketing"
  | "travel"
  | "office"
  | "fnb"
  | "logistics"
  | "freelancer"
  | "other";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Company = Timestamps & {
  id: string;
  name: string;
  tax_code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  payment_terms: string | null;
  note: string | null;
};

export type Supplier = Timestamps & {
  id: string;
  name: string;
  tax_code: string | null;
  category: InvoiceCategoryDb;
  ease_to_collect: string;
  phone: string | null;
  email: string | null;
  bank_name: string | null;
  bank_account: string | null;
  note: string | null;
};

export type Expense = Timestamps & {
  id: string;
  supplier_id: string | null;
  supplier_name: string;
  category: InvoiceCategoryDb;
  amount: number;
  vat_rate: number;
  spent_at: string;
  note: string | null;
};

export type InvoiceIn = Timestamps & {
  id: string;
  expense_id: string | null;
  supplier_id: string | null;
  supplier_name: string;
  code: string | null;
  category: InvoiceCategoryDb;
  amount: number;
  vat_rate: number;
  status: InvoiceStatus;
  invoice_date: string | null;
  due_date: string | null;
  paid_amount: number;
  file_url: string | null;
  note: string | null;
};

export type InvoiceOut = Timestamps & {
  id: string;
  company_id: string | null;
  company_name: string;
  code: string | null;
  amount: number;
  vat_rate: number;
  status: InvoiceStatus;
  invoice_date: string | null;
  due_date: string | null;
  paid_amount: number;
  file_url: string | null;
  note: string | null;
};

export type CostCenter = {
  id: string;
  code: string | null;
  name: string;
  group_name: string | null;
  owner: string | null;
  purpose: string | null;
  active: boolean;
  created_at: string;
};

export type BankAccount = {
  id: string;
  code: string | null;
  type: string | null;
  bank: string | null;
  account_no: string | null;
  owner: string | null;
  currency: string;
  opening_balance: number;
  manager: string | null;
  active: boolean;
  created_at: string;
};

export type Advance = {
  id: string;
  code: string | null;
  person: string | null;
  department: string | null;
  project: string | null;
  advance_date: string | null;
  amount: number;
  purpose: string | null;
  due_date: string | null;
  settled: number;
  status: string;
  note: string | null;
  created_at: string;
};

export type PaymentRequest = {
  id: string;
  code: string | null;
  request_date: string | null;
  requester: string | null;
  type: string | null;
  supplier_name: string | null;
  cost_center: string | null;
  amount: number;
  need_by: string | null;
  status: string;
  approver: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  code: string | null;
  txn_date: string | null;
  direction: string | null;
  method: string | null;
  amount: number;
  account: string | null;
  ref_request: string | null;
  ref_invoice: string | null;
  status: string;
  created_at: string;
};

export type BankTransaction = {
  id: string;
  sepay_id: number | null;
  gateway: string | null; // tên ngân hàng
  account_number: string | null;
  sub_account: string | null;
  txn_date: string | null;
  amount: number; // luôn dương
  direction: "in" | "out";
  content: string | null; // nội dung CK (memo)
  counterparty: string | null; // đối tác (parse từ memo, có thể null)
  accumulated: number | null; // số dư sau giao dịch
  reference_code: string | null;
  code: string | null;
  raw: Record<string, unknown> | null;
  created_at: string;
};

export type Budget = {
  id: string;
  code: string | null;
  quarter: string | null;
  cost_center: string | null;
  budget: number;
  committed: number;
  actual: number;
  status: string;
  created_at: string;
};

export type MonthlyGap = {
  month: string;
  revenue: number;
  expense: number;
  invoice_in: number;
  gap: number;
  tax_saving: number;
};

export type Receivable = {
  company_name: string;
  invoice_count: number;
  total: number;
  paid: number;
  outstanding: number;
  last_due: string | null;
};

export type Payable = {
  supplier_name: string;
  invoice_count: number;
  total: number;
  paid: number;
  outstanding: number;
};

export type Project = {
  id: string;
  code: string | null;
  name: string;
  client_name: string | null;
  contract_value: number;
  status: string; // active / done / paused
  start_date: string | null;
  note: string | null;
  created_at: string;
};

export type ProjectPayment = {
  id: string;
  project_id: string;
  label: string | null;
  amount: number;
  paid_at: string | null;
  note: string | null;
  created_at: string;
};

export type ProjectCostCategory =
  | "ai_tools"
  | "software"
  | "personnel"
  | "outsource"
  | "other";

export type ProjectCost = {
  id: string;
  project_id: string;
  category: ProjectCostCategory;
  name: string | null;
  amount: number;
  spent_at: string | null;
  note: string | null;
  created_at: string;
};

type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      companies: Row<Company>;
      suppliers: Row<Supplier>;
      expenses: Row<Expense>;
      invoices_in: Row<InvoiceIn>;
      invoices_out: Row<InvoiceOut>;
      cost_centers: Row<CostCenter>;
      bank_accounts: Row<BankAccount>;
      advances: Row<Advance>;
      payment_requests: Row<PaymentRequest>;
      transactions: Row<Transaction>;
      budgets: Row<Budget>;
      bank_transactions: Row<BankTransaction>;
      projects: Row<Project>;
      project_payments: Row<ProjectPayment>;
      project_costs: Row<ProjectCost>;
    };
    Views: {
      monthly_gap: { Row: MonthlyGap; Relationships: [] };
      receivables: { Row: Receivable; Relationships: [] };
      payables: { Row: Payable; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: {
      invoice_status: InvoiceStatus;
      invoice_category: InvoiceCategoryDb;
    };
    CompositeTypes: Record<string, never>;
  };
};
