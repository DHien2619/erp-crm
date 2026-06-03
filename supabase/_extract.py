import zipfile, re, shutil, os, io, sys, json, datetime
import openpyxl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

src = r"D:\AMAX\erp-crm\Quản trị tài chính.xlsx"
clean = r"D:\AMAX\erp-crm\supabase\_clean.xlsx"

# Copy zip, stripping the broken <dataValidations> blocks from each worksheet xml.
with zipfile.ZipFile(src, "r") as zin:
    names = zin.namelist()
    with zipfile.ZipFile(clean, "w", zipfile.ZIP_DEFLATED) as zout:
        for n in names:
            data = zin.read(n)
            if n.startswith("xl/worksheets/") and n.endswith(".xml"):
                txt = data.decode("utf-8", errors="replace")
                txt = re.sub(r"<dataValidations[\s\S]*?</dataValidations>", "", txt)
                txt = re.sub(r"<dataValidation[^>]*/>", "", txt)
                data = txt.encode("utf-8")
            zout.writestr(n, data)

wb = openpyxl.load_workbook(clean, data_only=True, read_only=True)

def norm(v):
    if isinstance(v, datetime.datetime):
        return v.date().isoformat()
    if isinstance(v, datetime.date):
        return v.isoformat()
    return v

result = {}
for ws in wb.worksheets:
    rows = []
    for r in ws.iter_rows(min_row=1, max_row=1000, max_col=40, values_only=True):
        vals = [norm(c) for c in r]
        while vals and vals[-1] in (None, ""):
            vals.pop()
        if any(c not in (None, "") for c in vals):
            rows.append(vals)
    result[ws.title] = rows
    print(f"{ws.title}: {len(rows)} rows")

with open(r"D:\AMAX\erp-crm\supabase\_data.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)
print("\nSaved _data.json")
