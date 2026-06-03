import json, urllib.request, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE = "https://verrksogurlxraawdhni.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcnJrc29ndXJseHJhYXdkaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTU0MzksImV4cCI6MjA5NjAzMTQzOX0.6g7qzRYbsHx6iiRFYgcPPBsjcWcr3Qag2spqzB51-T0"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}


def req(method, path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method, headers={**H, **(headers or {})})
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode()
        return resp.status, (json.loads(raw) if raw.strip() else None)


def clear(t):
    try:
        req("DELETE", f"/{t}?id=not.is.null")
    except Exception as e:
        print(f"  clear {t}: {e}")


def insert(t, rows):
    if not rows:
        print(f"  {t}: 0"); return
    st, _ = req("POST", f"/{t}", rows, {"Prefer": "return=minimal"})
    print(f"  {t}: +{len(rows)} (HTTP {st})")


def cell(r, i):
    return r[i] if i < len(r) and r[i] not in (None, "") else None


def money(v):
    if v is None:
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).replace("₫", "").replace(",", "").replace(".", "").replace("-", "").strip()
    try:
        n = int(s or 0)
        return -n if str(v).strip().startswith("-") else n
    except Exception:
        return 0


data = json.load(open(r"D:\AMAX\erp-crm\supabase\_data.json", encoding="utf-8"))

# ---- Trung tâm chi phí (sheet 14) ----
cc = []
for r in data["14. Trung tâm chi phí"][1:]:
    cc.append({
        "code": cell(r, 0), "name": cell(r, 1) or "—", "group_name": cell(r, 2),
        "owner": cell(r, 3), "purpose": cell(r, 4), "active": (cell(r, 5) or "").startswith("Đang"),
    })

# ---- Tài khoản ngân hàng (sheet 05) ----
ba = []
for r in data["05. Tài khoản ngân hàng"][1:]:
    ba.append({
        "code": cell(r, 0), "type": cell(r, 1), "bank": cell(r, 2), "account_no": str(cell(r, 3) or ""),
        "owner": cell(r, 4), "currency": cell(r, 5) or "VND", "opening_balance": money(cell(r, 6)),
        "manager": cell(r, 7), "active": (cell(r, 8) or "").startswith("Đang"),
    })

# ---- Tạm ứng (sheet 09) ----
adv = []
for r in data["09. Tạm ứng"][1:]:
    adv.append({
        "code": cell(r, 0), "person": cell(r, 2), "department": cell(r, 3), "project": cell(r, 4),
        "advance_date": cell(r, 5), "amount": money(cell(r, 6)), "purpose": cell(r, 7),
        "due_date": cell(r, 8), "settled": money(cell(r, 9)),
        "status": cell(r, 11) or "Đang treo", "note": cell(r, 13),
    })

print("Clearing...")
for t in ["cost_centers", "bank_accounts", "advances"]:
    clear(t)
print("Inserting...")
insert("cost_centers", cc)
insert("bank_accounts", ba)
insert("advances", adv)
print(f"\nDone: cost_centers={len(cc)} bank_accounts={len(ba)} advances={len(adv)}")
