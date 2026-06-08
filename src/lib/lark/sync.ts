import { larkListTables, larkListRecords } from "@/lib/lark/client";
import { createClient } from "@/lib/supabase/server";

// ---------- helpers đọc giá trị field Lark (kiểu trả về đa dạng) ----------
type F = Record<string, unknown>;

function txt(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) {
    const s = v
      .map((x) =>
        typeof x === "string"
          ? x
          : (x as { text?: string; name?: string })?.text ??
            (x as { name?: string })?.name ??
            ""
      )
      .join("")
      .trim();
    return s || null;
  }
  if (typeof v === "object") {
    const o = v as { text?: string; name?: string };
    return o.text ?? o.name ?? null;
  }
  return String(v);
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const neg = v.trim().startsWith("-");
    const n = Number(v.replace(/[^\d.]/g, "")) || 0;
    return neg ? -n : n;
  }
  if (Array.isArray(v) && v.length) return num(txt(v));
  return 0;
}

function dateISO(v: unknown): string | null {
  if (typeof v === "number" && v > 0) {
    const d = new Date(v);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  const s = txt(v);
  if (s && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

// ---------- mapping nghiệp vụ (port từ _load.py) ----------
type Cat =
  | "saas" | "marketing" | "travel" | "office" | "fnb" | "logistics" | "freelancer" | "other";

function mapCat(loai: string | null, cc: string | null): Cat {
  const l = (loai ?? "").toLowerCase();
  const c = (cc ?? "").toLowerCase();
  if (c.includes("công cụ marketing")) return "saas";
  if (c.includes("tiếp khách")) return "fnb";
  if (c.includes("pháp lý")) return "other";
  if (c.includes("văn phòng")) return "office";
  if (c.includes("media") || c.includes("kol")) return "marketing";
  if (l.includes("chi ngoài")) return "fnb";
  if (l.includes("vendor") || l.includes("đối tác")) return "other";
  if (l.includes("văn phòng")) return "office";
  return "other";
}

function ease(name: string | null): "easy" | "medium" | "hard" {
  const n = (name ?? "").toLowerCase();
  if (["gpt", "claude", "openai", "heygen", "api", "fobese"].some((k) => n.includes(k)))
    return "easy";
  if (n.includes("hộ kinh doanh")) return "hard";
  return "medium";
}

// ---------- tìm table_id theo tên (khớp tiền tố số "01.", "02."...) ----------
function pick(
  tables: { table_id: string; name: string }[],
  ...keywords: string[]
): string | null {
  const t = tables.find((x) =>
    keywords.some((k) => x.name.toLowerCase().includes(k.toLowerCase()))
  );
  return t?.table_id ?? null;
}

export type SyncResult = { tables: string[]; counts: Record<string, number> };

/** Đọc Lark Base → map → ghi đè Supabase (1 chiều, Lark là nguồn) */
export async function syncFromLark(): Promise<SyncResult> {
  const supabase = await createClient();
  const tables = await larkListTables();
  const counts: Record<string, number> = {};

  const readBy = async (...kw: string[]) => {
    const id = pick(tables, ...kw);
    if (!id) return [];
    const recs = await larkListRecords(id);
    return recs.map((r) => r.fields as F);
  };

  // ===== Chi phí -> expenses + invoices_in =====
  const chi = await readBy("chi phí");
  const expenses: F[] = [];
  const invoicesIn: F[] = [];
  const supSet = new Map<string, F>();
  for (const r of chi) {
    const loai = txt(r["Loại chi phí"]);
    const cc = txt(r["Trung tâm chi phí"]);
    const supplier = txt(r["Nhà cung cấp"]);
    const amount = num(r["Số tiền (VND)"]);
    const cat = mapCat(loai, cc);
    const vat = cat === "fnb" ? 8 : 10;
    const date = dateISO(r["Ngày chi"]);
    const chungtu = (txt(r["Trạng thái chứng từ"]) ?? "").trim();
    const status = chungtu === "Đủ" ? "matched" : "missing";
    const supName = supplier ?? cc ?? "Chi phí khác";
    const code = txt(r["Hóa đơn"]) ?? txt(r["Mã chi phí"]);

    expenses.push({
      supplier_name: supName, category: cat, amount, vat_rate: vat,
      spent_at: date ?? "2026-01-01", note: [loai, cc].filter(Boolean).join(" · "),
    });
    invoicesIn.push({
      supplier_name: supName, code, category: cat, amount, vat_rate: vat,
      status, invoice_date: date, note: txt(r["Ghi chú"]),
    });
    if (supplier && !supSet.has(supplier))
      supSet.set(supplier, { name: supplier, category: cat, ease_to_collect: ease(supplier) });
  }

  // ===== Khách hàng -> companies (đọc trước để khớp tên cho doanh thu) =====
  const kh = await readBy("khách hàng");
  const companies: F[] = kh.map((r) => ({
    name: txt(r["Tên khách hàng"]) ?? "Khách hàng",
    tax_code: txt(r["MST"]),
    phone: txt(r["SĐT"]),
    email: txt(r["Email nhận HĐ"]),
    address: txt(r["Địa chỉ xuất HĐ"]),
    payment_terms: txt(r["Điều khoản thanh toán"]),
  }));
  const companyNames = companies
    .map((c) => c.name as string)
    .filter((n) => n && n !== "Khách hàng");
  // Lark "Khách hàng" trong Doanh thu hay bị cụt ("Công ty ") → khớp về tên đầy đủ
  const matchCompany = (raw: string | null): string => {
    if (!raw) return "Khách hàng lẻ";
    const r = raw.trim();
    const hit = companyNames.find((n) => n.startsWith(r) || r.startsWith(n));
    return hit ?? r;
  };

  // ===== Doanh thu -> invoices_out =====
  const dt = await readBy("doanh thu");
  const invoicesOut: F[] = dt.map((r, i) => {
    const amount = num(r["Tổng tiền (VND)"]);
    const congno = (txt(r["Trạng thái công nợ"]) ?? "").toLowerCase();
    const status = congno.includes("đủ") ? "matched" : "pending";
    const paid = status === "matched" ? amount : num(r["Đã thu (VND)"]);
    return {
      company_name: matchCompany(txt(r["Khách hàng"])),
      code: txt(r["Số hợp đồng"]) ?? `DT-${i + 1}`,
      amount, paid_amount: paid, vat_rate: 10, status,
      invoice_date: dateISO(r["Ngày xuất hóa đơn"]),
      due_date: dateISO(r["Hạn thanh toán"]),
    };
  });

  // ===== Vendors -> suppliers (nếu trống thì lấy từ Chi phí) =====
  const ven = await readBy("vendor");
  let suppliers: F[];
  if (ven.length > 0) {
    suppliers = ven.map((r) => ({
      name: txt(r["Tên nhà cung cấp"]) ?? "NCC",
      tax_code: txt(r["MST"]),
      category: "other",
      ease_to_collect: ease(txt(r["Tên nhà cung cấp"])),
      phone: null, email: txt(r["Email"]),
      bank_name: txt(r["Ngân hàng"]), bank_account: txt(r["Số tài khoản"]),
    }));
  } else {
    suppliers = [...supSet.values()];
  }

  // ===== Trung tâm chi phí =====
  const cc = await readBy("trung tâm chi phí");
  const costCenters: F[] = cc.map((r) => ({
    code: txt(r["Mã CC"]), name: txt(r["Tên trung tâm chi phí"]) ?? "—",
    group_name: txt(r["Nhóm"]), owner: txt(r["Owner"]),
    purpose: txt(r["Mục đích"]), active: (txt(r["Trạng thái"]) ?? "").startsWith("Đang"),
  }));

  // ===== Tài khoản ngân hàng =====
  const bank = await readBy("tài khoản ngân hàng");
  const bankAccounts: F[] = bank.map((r) => ({
    code: txt(r["Mã tài khoản/quỹ"]), type: txt(r["Loại"]), bank: txt(r["Ngân hàng"]),
    account_no: txt(r["Số tài khoản"]), owner: txt(r["Chủ tài khoản"]),
    currency: txt(r["Tiền tệ"]) ?? "VND", opening_balance: num(r["Số dư đầu kỳ (VND)"]),
    manager: txt(r["Người quản lý"]), active: (txt(r["Trạng thái"]) ?? "").startsWith("Đang"),
  }));

  // ===== Tạm ứng =====
  const adv = await readBy("tạm ứng");
  const advances: F[] = adv.map((r) => ({
    code: txt(r["Mã tạm ứng"]), person: txt(r["Người tạm ứng"]),
    department: txt(r["Phòng ban"]), project: txt(r["Dự án"]),
    advance_date: dateISO(r["Ngày tạm ứng"]), amount: num(r["Số tiền tạm ứng (VND)"]),
    purpose: txt(r["Mục đích"]), due_date: dateISO(r["Hạn hoàn ứng"]),
    settled: num(r["Số đã hoàn (VND)"]), status: txt(r["Trạng thái"]) ?? "Đang treo",
    note: txt(r["Note"]),
  }));

  // ---------- ghi đè Supabase (xoá hết rồi insert) ----------
  // cast vì tên bảng + shape là động (đến từ Lark)
  const sb = supabase as unknown as {
    from: (t: string) => {
      delete: () => { not: (c: string, op: string, v: unknown) => Promise<unknown> };
      insert: (r: unknown) => Promise<{ error: { message: string } | null }>;
    };
  };
  async function replace(table: string, rows: F[]) {
    await sb.from(table).delete().not("id", "is", null);
    if (rows.length) {
      const { error } = await sb.from(table).insert(rows);
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    counts[table] = rows.length;
  }

  // xoá con trước (FK), rồi cha
  await replace("invoices_in", invoicesIn);
  await replace("invoices_out", invoicesOut);
  await replace("expenses", expenses);
  await replace("suppliers", suppliers);
  await replace("companies", companies);
  await replace("cost_centers", costCenters);
  await replace("bank_accounts", bankAccounts);
  await replace("advances", advances);

  return { tables: tables.map((t) => t.name), counts };
}
