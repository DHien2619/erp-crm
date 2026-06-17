# ERP-CRM — Tài liệu bàn giao (Handoff)

> Internal tool quản trị tài chính AIECOS: theo dõi gap hoá đơn đầu vào, công nợ,
> dự báo & đề xuất chiến lược. Next.js + Supabase.

Cập nhật: 2026-06-11 · Tác giả khởi tạo: Claude (cho Duc Hien / AIECOS)

> **Phiên 2026-06-11 thêm:** PWA (cài app) · Export báo cáo .docx + Google Doc (qua n8n) ·
> OCR hoá đơn từ ảnh (Gemini, upload nhiều cùng lúc) · Tích hợp **SePay** (biến động số dư
> ngân hàng → ERP). Chi tiết ở mục 4c–4e + 6.

---

## 1. Link & truy cập

| | |
|---|---|
| **Production (dùng cái này)** | https://erp-crm-kappa.vercel.app |
| Local dev | http://localhost:3000 (chỉ khi chạy `npm run dev`) |
| Mã nguồn | `D:\AMAX\erp-crm` |
| GitHub | https://github.com/DHien2619/erp-crm (private, ĐÃ disconnect khỏi Vercel) |
| Vercel | team `hienld1109-7953`, project `erp-crm` |
| Supabase | project ref `verrksogurlxraawdhni` (region Singapore) |

> ⚠️ Ưu tiên dùng link Vercel. Localhost hay tắt vì cần tiến trình `npm run dev` chạy liên tục.

---

## 2. Tech stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4** (design tokens trong `src/app/globals.css`, `@theme inline`)
- **Recharts v3** (chart) · **lucide-react** (icon) · **Plus Jakarta Sans** (font)
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — Postgres + REST
- Màu: tím `#5B4FCF` + accent hồng `#FF8C9A`, nền lavender, glassmorphism.

---

## 3. Chạy & deploy

```bash
# Chạy local
cd D:\AMAX\erp-crm
npm install      # lần đầu
npm run dev      # http://localhost:3000

# Build kiểm tra
npm run build
npx tsc --noEmit

# Deploy (CLI-only, KHÔNG qua GitHub)
npx vercel --prod --yes
```

- Deploy đã link sẵn (`.vercel/project.json`), env đã set trên Vercel. Chỉ cần `vercel --prod`.
- **Env baked lúc build** → đổi env trên Vercel phải deploy lại mới có hiệu lực.
- Skill `vercel-update` (đã viết CLI-only) tự động hoá flow này khi user nói "deploy vercel".

### Biến môi trường (`.env.local`, đã gitignore)
```
NEXT_PUBLIC_SUPABASE_URL=https://verrksogurlxraawdhni.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key — public, an toàn>
```

---

## 4. Database (Supabase)

**Bảng:** `companies` (khách hàng), `suppliers` (NCC), `expenses`, `invoices_in` (hoá đơn đầu vào = chi phí), `invoices_out` (doanh thu), `cost_centers`, `bank_accounts`, `advances` (tạm ứng), `payment_requests`, `transactions`, `budgets`.

**View:** `monthly_gap` (DT/chi phí/HĐ/gap/thuế theo tháng — expense lấy từ `invoices_in`), `receivables` (công nợ phải thu theo KH), `payables` (phải trả theo NCC).

**RLS:** 🔴 ĐANG MỞ cho `anon` đọc/ghi (không cần đăng nhập). **Phải siết bằng Auth trước khi public rộng** — ai có link + anon key đều xem/sửa được dữ liệu tài chính.

**SQL đã chạy (trong `supabase/`):** `schema.sql` → `policies_open.sql` → `migration_crm.sql` → `migration_modules.sql`. Chạy lại an toàn (idempotent). Mở SQL Editor: https://supabase.com/dashboard/project/verrksogurlxraawdhni/sql/new

## 4b. Tích hợp Lark (🟢 LIVE — nguồn dữ liệu chính)

Dữ liệu thật đến từ **Lark Base "Quản trị tài chính"** (`AgenAI`), đồng bộ 1 chiều
**Lark → Supabase** (mô hình A). Lark là nơi NHẬP, web chỉ đọc Supabase (giữ tốc độ + views).

- **Lark app:** `ERP-billing` (Custom App, đã release + admin duyệt scope `bitable:app:readonly`).
  Host **larksuite quốc tế** → `https://open.larksuite.com`.
- **Env (server-only, có trong `.env.local` + Vercel):** `LARK_APP_ID=cli_aaacd24145789e15`,
  `LARK_APP_SECRET=…`, `LARK_BASE_TOKEN=LsipbJ26HaogeVs2hX0jjGQxpbb` (= app_token trong link base),
  `SYNC_SECRET=…` (bảo vệ endpoint sync).
- **Code:** `src/lib/lark/client.ts` (token cache + list tables/records), `src/lib/lark/sync.ts`
  (đọc bảng Lark → map → ghi đè Supabase; helper txt/num/dateISO xử lý field Lark:
  date = timestamp ms, linked-record = object `{text}`, số = string).
- **Endpoint:** `POST /api/lark/sync` (kéo Lark→Supabase; cần header `x-sync-secret` nếu gọi từ
  ngoài, nút web same-origin miễn). `GET /api/lark/discover` (dò bảng/field — dùng khi cần map lại).
- **Trigger:** nút **"Đồng bộ ngay"** trong `/settings` (LarkSyncCard) · hoặc **n8n** gọi
  `/api/lark/sync` định kỳ (header `x-sync-secret`) — chưa bật, user tự dựng.
- **Mapping (tên bảng/cột Lark tiếng Việt → Supabase):** 01.Chi phí→invoices_in+expenses ·
  02.Doanh thu→invoices_out (tên KH cụt "Công ty " → khớp prefix về tên đầy đủ trong companies) ·
  03.Khách hàng→companies · 04.Vendors→suppliers (trống thì derive từ Chi phí) ·
  14.Trung tâm chi phí→cost_centers · 05.Tài khoản NH→bank_accounts · 09.Tạm ứng→advances.
  Table IDs: Chi phí `tblqLkXZQVvW5G2k`, Doanh thu `tbl4z3Ch0elwKbmP` (resolve động theo tên, không hardcode).
- **Cập nhật khi Lark đổi:** bấm "Đồng bộ ngay" (hoặc đợi n8n). Sync = TRUNCATE + insert (Lark là chân lý).
- ⚠️ App Secret đã từng dán trong chat → có thể Regenerate trong Lark + cập nhật env nếu cần.

### Pipeline nạp dữ liệu (từ file gốc `Quản trị tài chính.xlsx` — cách CŨ, vẫn dùng được)
```bash
# Yêu cầu: PYTHONUTF8=1 (Windows)
python supabase/_extract.py      # xlsx -> supabase/_data.json (đã gỡ dataValidations lỗi của Lark)
python supabase/_load.py         # nạp companies/suppliers/expenses/invoices_in/invoices_out
python supabase/_load_modules.py # nạp cost_centers (30) / bank_accounts / advances
```
> Chạy lại `_load*.py` sẽ **TRUNCATE rồi nạp lại từ xlsx** → mất dữ liệu nhập tay qua UI.
> `*.xlsx` và `supabase/_data.json` đã gitignore (dữ liệu tài chính thô).

**Số liệu hiện tại (từ xlsx, T4-T5/2026):** doanh thu 212,5tr · chi phí 45tr · thiếu HĐ (gap) 15tr · 1 khách hàng (Dược Liệu Việt) · 29 NCC · số dư NH -25,9tr.

---

## 5. Cấu trúc code

```
src/
  app/
    page.tsx                    # Dashboard
    invoices/in/page.tsx        # Hoá đơn đầu vào
    customers/page.tsx          # Khách hàng
    suppliers/page.tsx          # Nhà cung cấp
    debts/page.tsx              # Công nợ (AR/AP)
    reports/page.tsx            # Báo cáo Gap
    forecast/page.tsx           # Dự báo tài chính
    strategy/page.tsx           # Đề xuất chiến lược (auto + manual)
    settings/page.tsx           # Cài đặt (localStorage)
    modules/                    # Hub + tạm ứng/cost-centers/bank-accounts/payment-requests/transactions/budgets
  components/
    app-shell.tsx               # Layout: sidebar hover-expand + drawer mobile + main + rightRail
    sidebar.tsx topbar.tsx right-rail.tsx
    ui/                         # modal, row-actions, select (CustomSelect), data-table,
                                #   notifications-bell, global-search, user-menu
    invoices/ customers/ suppliers/ debts/ forecast/ strategy/   # theo feature
  lib/
    data.ts                     # TẤT CẢ truy vấn Supabase (server) — đọc dữ liệu cho các trang
    analytics.ts                # tính gap, supplier stats, period summary, CIT_RATE=0.2
    tax-calendar.ts             # sinh deadline thuế VN từ ngày hiện tại
    settings.ts                 # đọc/ghi cài đặt localStorage
    supabase/client.ts server.ts
    database.types.ts           # types khớp schema (mỗi table cần `Relationships: []`)
    mock-data.ts                # types + (legacy) mock — vẫn dùng type InvoiceIn/InvoiceCategory
supabase/                       # SQL + python loaders + SETUP.md
```

**Pattern:** trang = Server Component (`export const dynamic = "force-dynamic"`) fetch qua `data.ts` → truyền props xuống Client Component. Mutation (insert/update/delete) chạy client-side qua `supabase/client.ts` + `router.refresh()`.

---

## 6. Tính năng ĐÃ XONG

- **Dashboard**: chart dòng tiền (lọc Ngày/Tháng/Quý/Năm), KPI luỹ kế, card GAP, top NCC, HĐ gần đây, lịch thuế.
- **Hoá đơn đầu vào**: CRUD (thêm/sửa/xoá/đổi trạng thái) + lọc + phân trang + lọc nâng cao (ngày/số tiền).
- **Khách hàng**: CRUD + doanh thu/công nợ mỗi KH + ghi nhận doanh thu (invoices_out).
- **Nhà cung cấp**: gợi ý xin HĐ, thêm/sửa NCC, xem HĐ theo NCC.
- **Công nợ**: phải thu/phải trả, tuổi nợ, nút tất toán.
- **Báo cáo Gap**: theo kỳ + thuế TNDN tiết kiệm.
- **Dự báo**: giả định nhập tay → projection dòng tiền + runway (startCash = số dư NH thật).
- **Đề xuất chiến lược**: 2 tab — **Tự đề xuất** (hệ thống tự suy tăng trưởng/biên lãi/ROAS từ data) + **Tuỳ chỉnh** (nhập tay). Tính hoà vốn, lãi gộp/ròng, ROAS, KPI tháng sau, đề xuất hành động.
- **Nghiệp vụ** (hub `/modules`): Tạm ứng, Trung tâm chi phí, Tài khoản NH (có data), Yêu cầu/Giao dịch TT, Ngân sách (bảng sẵn, chờ nhập).
- **Cài đặt**: thông tin công ty + thuế suất + VAT + tiền mặt đầu kỳ (localStorage).
- **UI chung**: chuông thông báo (cảnh báo nợ/HĐ/thuế), global search (Ctrl+K), custom dropdown, sidebar hover-expand, responsive mobile (drawer + grid 1 cột), menu avatar.

---

## 7. CHƯA LÀM (việc tiếp theo)

### Nhóm C — Nền tảng
- [ ] **Auth đăng nhập** (Supabase Auth) + middleware bảo vệ route + siết RLS lại theo user/org.
      → Sẽ kích hoạt nút **"Đăng xuất"** (hiện sidebar + menu avatar ghi "sắp có").
- [ ] **OCR hoá đơn**: upload ảnh → AI (Claude/GPT Vision) bóc tách → điền form.
      → Kích hoạt nút **"Chọn file"** + dropzone trong modal Thêm HĐ (tab "Upload ảnh (AI)" hiện chưa xử lý file).
- [ ] **Upload Storage** ảnh/PDF hoá đơn (Supabase Storage).
- [ ] **Export Excel/PDF** báo cáo.

### Nhóm D — CRM bán hàng
- [ ] Pipeline cơ hội (deal stages), lịch sử tương tác khách, tag/segment, nhắc follow-up, quản lý hợp đồng.

### Khác / nợ kỹ thuật
- [ ] Module Yêu cầu TT / Giao dịch TT / Ngân sách mới có bảng đọc, **chưa có form nhập + workflow duyệt**.
- [ ] Trang Đối soát + KQHĐ (P&L) riêng (hiện KQHĐ trỏ tạm `/reports`).
- [ ] Số khách hàng = 1 (companies) làm "DT/khách" lệch — sẽ chuẩn khi nhập thêm KH.
- [ ] ROAS = "—" vì data chưa có chi phí category "Marketing".

---

## 8. Gotchas (đã dính, ghi lại)

- **Recharts v3**: `TooltipProps` generic không còn `payload/label` → tự định nghĩa type tooltip cục bộ; set `isAnimationActive={false}`.
- **database.types.ts**: mỗi table phải có `Relationships: []` nếu không `supabase-js` infer ra `never` khi insert.
- **Trang fetch data**: cần `export const dynamic = "force-dynamic"` (không prerender static).
- **Đổi schema**: ALTER/CREATE TABLE phải chạy ở Supabase SQL Editor (anon key không có quyền DDL). Sau đó `notify pgrst, 'reload schema';` để REST thấy bảng mới.
- **Build trước deploy** luôn (next build bắt lỗi ESLint/type mà dev bỏ qua).
- **LF→CRLF warning** khi git add trên Windows: vô hại.
- **Screenshot tool** của môi trường Claude hay timeout → verify bằng đọc DOM/curl.
- Skill `vercel-update` đã đổi thành **CLI-only** (bản .skill ở `~/.claude/skills/vercel-update.skill` — cần upload claude.ai để sync máy khác).

---

## 9. Lệnh nhanh cho phiên Claude tiếp theo

- "deploy vercel" → chạy skill `vercel-update` (build → `vercel --prod`).
- "nạp lại data" → `python supabase/_load.py` (+ `_load_modules.py`).
- "làm nhóm C / D" → xem mục 7.
- Memory dự án: `~/.claude/projects/D--AMAX-ERB-bills/memory/project_erp_crm.md`.
