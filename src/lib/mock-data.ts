export type MonthlyPoint = {
  month: string;
  revenue: number;
  expense: number;
  invoiceIn: number;
};

export const monthlyData: MonthlyPoint[] = [
  { month: "T1", revenue: 380, expense: 290, invoiceIn: 180 },
  { month: "T2", revenue: 420, expense: 310, invoiceIn: 200 },
  { month: "T3", revenue: 460, expense: 340, invoiceIn: 195 },
  { month: "T4", revenue: 500, expense: 380, invoiceIn: 220 },
  { month: "T5", revenue: 540, expense: 405, invoiceIn: 245 },
  { month: "T6", revenue: 580, expense: 430, invoiceIn: 260 },
  { month: "T7", revenue: 610, expense: 450, invoiceIn: 275 },
  { month: "T8", revenue: 595, expense: 445, invoiceIn: 280 },
  { month: "T9", revenue: 640, expense: 470, invoiceIn: 295 },
  { month: "T10", revenue: 680, expense: 495, invoiceIn: 310 },
  { month: "T11", revenue: 720, expense: 525, invoiceIn: 330 },
  { month: "T12", revenue: 750, expense: 550, invoiceIn: 345 },
];

export const currentMonth = {
  revenue: 500_000_000,
  expense: 380_000_000,
  invoiceIn: 220_000_000,
  get gap() {
    return this.expense - this.invoiceIn;
  },
};

export type Supplier = {
  id: string;
  name: string;
  category: string;
  potentialAmount: number;
  collectedAmount: number;
  icon: "cloud" | "megaphone" | "package" | "coffee" | "truck";
};

export const suppliers: Supplier[] = [
  {
    id: "1",
    name: "Google Workspace",
    category: "SaaS · Email + Drive",
    potentialAmount: 18_000_000,
    collectedAmount: 12_600_000,
    icon: "cloud",
  },
  {
    id: "2",
    name: "Facebook Ads",
    category: "Quảng cáo · Marketing",
    potentialAmount: 45_000_000,
    collectedAmount: 20_250_000,
    icon: "megaphone",
  },
  {
    id: "3",
    name: "Văn phòng phẩm",
    category: "Chi phí · Vận hành",
    potentialAmount: 8_000_000,
    collectedAmount: 7_200_000,
    icon: "package",
  },
];

export type RecentInvoice = {
  id: string;
  supplier: string;
  amount: number;
  status: "matched" | "pending" | "missing";
  date: string;
  initials: string;
};

export const recentInvoices: RecentInvoice[] = [
  {
    id: "INV-0421",
    supplier: "Grab Business",
    amount: 1_850_000,
    status: "matched",
    date: "2 giờ trước",
    initials: "GR",
  },
  {
    id: "INV-0420",
    supplier: "Google Workspace",
    amount: 4_200_000,
    status: "matched",
    date: "5 giờ trước",
    initials: "GW",
  },
  {
    id: "INV-0419",
    supplier: "Facebook Ads",
    amount: 12_500_000,
    status: "pending",
    date: "Hôm qua",
    initials: "FB",
  },
  {
    id: "INV-0418",
    supplier: "Highlands Coffee",
    amount: 680_000,
    status: "missing",
    date: "2 ngày trước",
    initials: "HL",
  },
  {
    id: "INV-0417",
    supplier: "Vietnam Airlines",
    amount: 8_900_000,
    status: "matched",
    date: "3 ngày trước",
    initials: "VN",
  },
];

export type InvoiceCategory =
  | "saas"
  | "marketing"
  | "travel"
  | "office"
  | "fnb"
  | "logistics"
  | "freelancer"
  | "other";

export const categoryLabel: Record<InvoiceCategory, string> = {
  saas: "Phần mềm / SaaS",
  marketing: "Marketing",
  travel: "Đi lại",
  office: "Văn phòng",
  fnb: "Ăn uống",
  logistics: "Vận chuyển",
  freelancer: "Freelancer",
  other: "Khác",
};

export type InvoiceIn = {
  id: string;
  code: string;
  supplier: string;
  initials: string;
  category: InvoiceCategory;
  date: string;
  amount: number;
  vatRate: number;
  status: "matched" | "pending" | "missing";
  note?: string;
};

export const invoicesIn: InvoiceIn[] = [
  { id: "1", code: "0000421", supplier: "Google Workspace", initials: "GW", category: "saas", date: "2026-06-02", amount: 4_200_000, vatRate: 10, status: "matched" },
  { id: "2", code: "0000420", supplier: "Facebook Ads", initials: "FB", category: "marketing", date: "2026-06-02", amount: 12_500_000, vatRate: 5, status: "pending" },
  { id: "3", code: "0000419", supplier: "Grab Business", initials: "GR", category: "travel", date: "2026-06-02", amount: 1_850_000, vatRate: 10, status: "matched" },
  { id: "4", code: "0000418", supplier: "Highlands Coffee", initials: "HL", category: "fnb", date: "2026-06-01", amount: 680_000, vatRate: 8, status: "missing", note: "Cần xin lại từ NCC" },
  { id: "5", code: "0000417", supplier: "Vietnam Airlines", initials: "VN", category: "travel", date: "2026-05-31", amount: 8_900_000, vatRate: 10, status: "matched" },
  { id: "6", code: "0000416", supplier: "ChatGPT Team", initials: "CT", category: "saas", date: "2026-05-30", amount: 750_000, vatRate: 10, status: "pending" },
  { id: "7", code: "0000415", supplier: "Notion AI", initials: "NT", category: "saas", date: "2026-05-30", amount: 480_000, vatRate: 10, status: "matched" },
  { id: "8", code: "0000414", supplier: "TikTok Ads", initials: "TT", category: "marketing", date: "2026-05-29", amount: 18_400_000, vatRate: 5, status: "missing", note: "Quên xin HĐ" },
  { id: "9", code: "0000413", supplier: "VNPT eInvoice", initials: "VP", category: "saas", date: "2026-05-28", amount: 2_200_000, vatRate: 10, status: "matched" },
  { id: "10", code: "0000412", supplier: "Văn phòng phẩm Hồng Hà", initials: "HH", category: "office", date: "2026-05-28", amount: 1_350_000, vatRate: 10, status: "matched" },
  { id: "11", code: "0000411", supplier: "Be Group", initials: "BE", category: "travel", date: "2026-05-27", amount: 920_000, vatRate: 10, status: "matched" },
  { id: "12", code: "0000410", supplier: "GHN Express", initials: "GH", category: "logistics", date: "2026-05-26", amount: 3_400_000, vatRate: 10, status: "pending" },
  { id: "13", code: "0000409", supplier: "Anthropic Claude", initials: "AN", category: "saas", date: "2026-05-25", amount: 4_800_000, vatRate: 10, status: "matched" },
  { id: "14", code: "0000408", supplier: "The Coffee House", initials: "CH", category: "fnb", date: "2026-05-25", amount: 1_120_000, vatRate: 8, status: "missing" },
  { id: "15", code: "0000407", supplier: "Designer freelance", initials: "DF", category: "freelancer", date: "2026-05-24", amount: 15_000_000, vatRate: 0, status: "missing", note: "Cá nhân, không có HĐ" },
  { id: "16", code: "0000406", supplier: "Microsoft 365", initials: "MS", category: "saas", date: "2026-05-23", amount: 3_900_000, vatRate: 10, status: "matched" },
  { id: "17", code: "0000405", supplier: "LinkedIn Ads", initials: "LK", category: "marketing", date: "2026-05-22", amount: 6_700_000, vatRate: 5, status: "pending" },
  { id: "18", code: "0000404", supplier: "VinFuel", initials: "VF", category: "travel", date: "2026-05-22", amount: 2_500_000, vatRate: 10, status: "matched" },
  { id: "19", code: "0000403", supplier: "AWS Cloud", initials: "AW", category: "saas", date: "2026-05-21", amount: 18_200_000, vatRate: 10, status: "matched" },
  { id: "20", code: "0000402", supplier: "J&T Express", initials: "JT", category: "logistics", date: "2026-05-20", amount: 2_100_000, vatRate: 10, status: "pending" },
  { id: "21", code: "0000401", supplier: "Phúc Long", initials: "PL", category: "fnb", date: "2026-05-20", amount: 850_000, vatRate: 8, status: "missing" },
  { id: "22", code: "0000400", supplier: "Vercel Pro", initials: "VC", category: "saas", date: "2026-05-19", amount: 1_650_000, vatRate: 10, status: "matched" },
  { id: "23", code: "0000399", supplier: "Lazada Ads", initials: "LZ", category: "marketing", date: "2026-05-18", amount: 9_800_000, vatRate: 5, status: "pending" },
  { id: "24", code: "0000398", supplier: "Văn phòng phẩm Hồng Hà", initials: "HH", category: "office", date: "2026-05-17", amount: 2_800_000, vatRate: 10, status: "matched" },
  { id: "25", code: "0000397", supplier: "Content writer freelance", initials: "CW", category: "freelancer", date: "2026-05-15", amount: 8_500_000, vatRate: 0, status: "missing", note: "Cá nhân, không có HĐ" },
];

export type TaxDeadline = {
  label: string;
  date: string;
  daysLeft: number;
  urgent: boolean;
};

export const taxDeadlines: TaxDeadline[] = [
  { label: "Báo cáo VAT Q2", date: "20/07", daysLeft: 8, urgent: true },
  { label: "Tạm nộp TNDN Q2", date: "30/07", daysLeft: 18, urgent: false },
  { label: "Báo cáo TNCN Q2", date: "30/07", daysLeft: 18, urgent: false },
];
