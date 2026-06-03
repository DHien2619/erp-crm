import json, urllib.request, urllib.parse, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE = "https://verrksogurlxraawdhni.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcnJrc29ndXJseHJhYXdkaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTU0MzksImV4cCI6MjA5NjAzMTQzOX0.6g7qzRYbsHx6iiRFYgcPPBsjcWcr3Qag2spqzB51-T0"

H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def req(method, path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method,
                               headers={**H, **(headers or {})})
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode()
        return resp.status, (json.loads(raw) if raw.strip() else None)

def clear(table):
    # xoá tất cả (policy mở cho anon)
    try:
        req("DELETE", f"/{table}?id=not.is.null")
        print(f"  cleared {table}")
    except Exception as e:
        print(f"  clear {table} ERR {e}")

def insert(table, rows):
    if not rows:
        print(f"  {table}: 0 rows")
        return
    st, _ = req("POST", f"/{table}", rows, {"Prefer": "return=minimal"})
    print(f"  inserted {len(rows)} -> {table} (HTTP {st})")

data = json.load(open(r"D:\AMAX\erp-crm\supabase\_data.json", encoding="utf-8"))

def cell(row, i):
    return row[i] if i < len(row) and row[i] not in (None, "") else None

# ---------- category mapping ----------
def map_cat(loai, cc):
    loai = (loai or "").lower()
    cc = (cc or "").lower()
    if "công cụ marketing" in cc:
        return "saas"
    if "tiếp khách" in cc:
        return "fnb"
    if "pháp lý" in cc:
        return "other"
    if "văn phòng" in cc:
        return "office"
    if "media" in cc or "kol" in cc:
        return "marketing"
    if "chi ngoài" in loai:
        return "fnb"
    if "vendor" in loai or "đối tác" in loai:
        return "other"
    if "văn phòng" in loai:
        return "office"
    return "other"

def ease(name):
    n = (name or "").lower()
    if any(k in n for k in ["gpt", "claude", "openai", "heygen", "api", "fobese"]):
        return "easy"
    if "hộ kinh doanh" in n:
        return "hard"
    if "công ty" in n or "ct " in n or "chi nhánh" in n:
        return "medium"
    return "medium"

# ================= CHI PHÍ -> expenses + invoices_in =================
chi = data["01. Chi phí"][1:]
expenses, invoices_in = [], []
supplier_set = {}
for r in chi:
    code = cell(r, 0)
    date = cell(r, 3)
    loai = cell(r, 4)
    supplier = (cell(r, 5) or "").strip().replace("\n", " ") or None
    cc = cell(r, 6)
    amount = cell(r, 7) or 0
    chungtu = (cell(r, 10) or "").strip()
    so_hd = cell(r, 11)
    note = cell(r, 13)
    cat = map_cat(loai, cc)
    vat = 8 if cat == "fnb" else 10
    sup_name = supplier or (cc or "Chi phí khác")
    status = "matched" if chungtu == "Đủ" else "missing"

    expenses.append({
        "supplier_name": sup_name, "category": cat, "amount": int(amount),
        "vat_rate": vat, "spent_at": date or "2026-04-01",
        "note": (loai or "") + (f" · {cc}" if cc else ""),
    })
    invoices_in.append({
        "supplier_name": sup_name, "code": str(so_hd) if so_hd else code,
        "category": cat, "amount": int(amount), "vat_rate": vat,
        "status": status, "invoice_date": date, "note": note,
    })
    if supplier and supplier not in supplier_set:
        supplier_set[supplier] = {"name": supplier, "category": cat, "ease_to_collect": ease(supplier)}

suppliers = list(supplier_set.values())

# ================= DOANH THU -> invoices_out =================
MAIN_CUSTOMER = "Công ty TNHH Ứng dụng Dược Liệu Việt"
dt = data["02. Doanh thu"][1:]
invoices_out = []
for i, r in enumerate(dt):
    contract = cell(r, 3)
    date = cell(r, 4)
    due = cell(r, 5)
    raw_company = (cell(r, 6) or "").strip()
    # tên KH trong xlsx bị cụt ("Công ty ") -> map về KH chính; nhỏ lẻ -> Khách lẻ
    if raw_company.lower().startswith("công ty"):
        company = MAIN_CUSTOMER
    else:
        company = raw_company or "Khách hàng lẻ"
    amount = int(cell(r, 8) or 0)
    paid_raw = cell(r, 9)
    cong_no = (cell(r, 10) or "")
    status = "matched" if "đủ" in cong_no.lower() else "pending"
    paid = amount if status == "matched" else int(paid_raw or 0)
    invoices_out.append({
        "company_name": company, "code": contract or f"DT-{i+1:03d}",
        "amount": amount, "paid_amount": paid, "vat_rate": 10,
        "status": status, "invoice_date": date, "due_date": due,
    })

# ================= KHÁCH HÀNG -> companies =================
kh = data["03. Quản lý khách hàng"][1:]
companies = []
for r in kh:
    companies.append({
        "name": cell(r, 1) or "Khách hàng", "tax_code": cell(r, 3),
        "address": cell(r, 4), "email": cell(r, 6), "phone": str(cell(r, 7) or "") or None,
    })

# ================= LOAD =================
print("Clearing old data...")
for t in ["invoices_in", "invoices_out", "expenses", "suppliers", "companies"]:
    clear(t)

print("Inserting real data...")
insert("companies", companies)
insert("suppliers", suppliers)
insert("expenses", expenses)
insert("invoices_in", invoices_in)
insert("invoices_out", invoices_out)

print("\nSummary:")
print(f"  companies={len(companies)} suppliers={len(suppliers)} expenses={len(expenses)} invoices_in={len(invoices_in)} invoices_out={len(invoices_out)}")
print(f"  total expense = {sum(e['amount'] for e in expenses):,}")
print(f"  total revenue = {sum(o['amount'] for o in invoices_out):,}")
print(f"  matched invoice_in = {sum(i['amount'] for i in invoices_in if i['status']=='matched'):,}")
print(f"  missing (gap) = {sum(i['amount'] for i in invoices_in if i['status']=='missing'):,}")
