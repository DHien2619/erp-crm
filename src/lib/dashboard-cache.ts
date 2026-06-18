import { unstable_cache } from "next/cache";
import { createPlainClient } from "@/lib/supabase/plain";
import { getSupplierStats } from "@/lib/analytics";
import type { MonthlyGap, InvoiceIn as DbInvoiceIn, InvoiceOut as DbInvoiceOut } from "@/lib/database.types";
import type { InvoiceIn, RecentInvoice } from "@/lib/mock-data";
import type { DailyCashflow } from "@/lib/data";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type DashboardData = {
  summary: { revenue: number; expense: number; invoiceIn: number; gap: number };
  daily: DailyCashflow[];
  supplierStats: ReturnType<typeof getSupplierStats>;
  recentIn: RecentInvoice[];
  recentOut: RecentInvoice[];
};

/**
 * Toàn bộ dữ liệu Dashboard, CACHE 30s (giảm tải khi dữ liệu lớn).
 * Đánh đổi: số liệu Dashboard có thể trễ tối đa 30s so với realtime — chấp nhận
 * để tải nhanh. Các trang danh sách vẫn cập nhật tức thời như cũ.
 */
export const getDashboardData = unstable_cache(
  async (): Promise<DashboardData> => {
    const supabase = createPlainClient();

    const [gap, inn, out] = await Promise.all([
      supabase.from("monthly_gap").select("*"),
      supabase
        .from("invoices_in")
        .select("id, code, supplier_name, category, amount, vat_rate, status, invoice_date")
        .order("invoice_date", { ascending: false }),
      supabase.from("invoices_out").select("id, company_name, amount, status, invoice_date"),
    ]);

    // summary
    const gapRows = (gap.data ?? []) as MonthlyGap[];
    const revenue = gapRows.reduce((s, r) => s + Number(r.revenue), 0);
    const expense = gapRows.reduce((s, r) => s + Number(r.expense), 0);
    const invoiceIn = gapRows.reduce((s, r) => s + Number(r.invoice_in), 0);
    const summary = { revenue, expense, invoiceIn, gap: Math.max(0, expense - invoiceIn) };

    // supplier stats
    const invRows = (inn.data ?? []) as Partial<DbInvoiceIn>[];
    const mapped: InvoiceIn[] = invRows.map((r) => ({
      id: r.id ?? "",
      code: r.code ?? "",
      supplier: r.supplier_name ?? "",
      initials: initialsOf(r.supplier_name ?? ""),
      category: (r.category ?? "other") as InvoiceIn["category"],
      date: r.invoice_date ?? "",
      amount: Number(r.amount ?? 0),
      vatRate: Number(r.vat_rate ?? 0),
      status: (r.status ?? "pending") as InvoiceIn["status"],
    }));
    const supplierStats = getSupplierStats(mapped);

    // cashflow daily
    const map = new Map<string, DailyCashflow>();
    const touch = (d: string) => {
      let row = map.get(d);
      if (!row) {
        row = { date: d, revenue: 0, expense: 0 };
        map.set(d, row);
      }
      return row;
    };
    for (const e of invRows) {
      if (!e.invoice_date) continue;
      touch(e.invoice_date).expense += Number(e.amount ?? 0);
    }
    for (const o of (out.data ?? []) as Partial<DbInvoiceOut>[]) {
      if (!o.invoice_date) continue;
      touch(o.invoice_date).revenue += Number(o.amount ?? 0);
    }
    const daily = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));

    // recent
    const recentIn: RecentInvoice[] = invRows.slice(0, 5).map((r) => ({
      id: r.id ?? "",
      supplier: r.supplier_name ?? "",
      amount: Number(r.amount ?? 0),
      status: (r.status ?? "pending") as RecentInvoice["status"],
      date: shortDate(r.invoice_date ?? null),
      initials: initialsOf(r.supplier_name ?? ""),
    }));
    const outRows = (out.data ?? []) as Partial<DbInvoiceOut>[];
    const recentOut: RecentInvoice[] = [...outRows]
      .sort((a, b) => (b.invoice_date ?? "").localeCompare(a.invoice_date ?? ""))
      .slice(0, 5)
      .map((r) => ({
        id: r.id ?? "",
        supplier: r.company_name ?? "",
        amount: Number(r.amount ?? 0),
        status: (r.status ?? "pending") as RecentInvoice["status"],
        date: shortDate(r.invoice_date ?? null),
        initials: initialsOf(r.company_name ?? ""),
      }));

    return { summary, daily, supplierStats, recentIn, recentOut };
  },
  ["dashboard-data"],
  { revalidate: 30, tags: ["dashboard"] }
);
