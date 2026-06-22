# HANDOFF — ERP-CRM (AIECOS)

Tài liệu bàn giao trạng thái dự án. Cập nhật: 2026-06.

---

## 1. Dự án là gì

Web ERP-CRM nội bộ cho AIECOS — quản trị tài chính, theo dõi **gap hoá đơn** (cần bao nhiêu HĐ hợp lệ để cân chi phí, tối ưu thuế), quản lý dự án (lãi/lỗ), báo cáo thuế, KPI, báo cáo tài chính tự động.

**Vai trò:** công cụ quản trị cho CHỦ DN (ra quyết định). KHÔNG thay MISA — việc nộp thuế chính thức + chữ ký số vẫn qua MISA/kế toán. Web lo phần MISA yếu (góc nhìn quản trị), xuất Excel để kế toán import MISA.

---

## 2. Truy cập

| | |
|---|---|
| Web production | https://erp-crm-kappa.vercel.app |
| GitHub (public) | https://github.com/DHien2619/erp-crm |
| Supabase project | verrksogurlxraawdhni (region gần sin1) |
| Vercel team | hienld1109-7953s-projects / project `erp-crm` |
| Local | `D:\AMAX\erp-crm` |

---

## 3. Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind CSS v4 (`@theme inline` trong globals.css)
- **Supabase** (@supabase/ssr + supabase-js), Postgres, RLS **đang MỞ cho anon** (chưa có Auth)
- **Recharts v3** (chart) — nhớ `isAnimationActive={false}`, định nghĩa local tooltip types
- **Lark/Feishu Bitable API** (host `open.larksuite.com`, tenant_access_token)
- **Sentry** (@sentry/nextjs) — gated theo DSN, chưa bật (chưa có DSN)
- Deploy bằng **Vercel CLI** (`npx vercel --prod --yes`), KHÔNG qua GitHub. `vercel.json` region `sin1`.

---

## 4. Các trang (đã chạy thật)

| Route | Chức năng |
|---|---|
| `/` | Dashboard (cache 30s) — doanh thu/chi phí/dòng tiền/top NCC |
| `/invoices/in` | Hoá đơn đầu vào — CRUD + **pagination/search server-side** |
| `/customers` | Khách hàng + doanh thu + ghi nhận doanh thu |
| `/suppliers` | Nhà cung cấp + gợi ý xin HĐ |
| `/debts` | Công nợ phải thu/phải trả + tuổi nợ |
| `/projects` + `/projects/[id]` | **Dự án** — tiến độ thu (%), cơ cấu chi phí + donut, payments/costs CRUD, % từng dòng |
| `/reports` | Báo cáo Gap + xuất Word/Google Doc |
| `/kpi` | KPI nâng cao — LN gộp/ròng, công nợ quá hạn, top KH/NCC, ngân sách, dự báo dòng tiền, Export Excel/PDF |
| `/finance` | **Báo cáo tài chính tự động** — P&L, lưu chuyển tiền, cân đối rút gọn, chỉ số, Export |
| `/tax` | Báo cáo thuế — tờ khai GTGT (01/GTGT)/TNDN ước tính, bảng kê, lịch nộp, **Xuất Excel import MISA** |
| `/forecast` | Dự báo tài chính (nhập giả định tay) |
| `/strategy` | Đề xuất chiến lược tự động (ROAS, hoà vốn) |
| `/modules/*` | Tạm ứng, trung tâm chi phí, tài khoản NH, ngân sách, đối soát, giao dịch, yêu cầu TT |
| `/settings` | Cấu hình + nút Đồng bộ Lark |

---

## 5. SQL — thứ tự chạy trong Supabase SQL Editor

Tất cả an toàn chạy lại (if not exists). Đã chạy hết tính tới bản này:

1. `schema.sql` — bảng gốc (companies, suppliers, invoices_in/out, expenses, views monthly_gap/receivables/payables)
2. `migration_crm.sql` — cột paid_amount, due_date, thông tin NCC
3. `migration_modules.sql` — module nghiệp vụ (cost_centers, bank_accounts, advances, payment_requests, transactions, budgets)
4. `migration_sepay.sql` — bank_transactions (SePay, tuỳ chọn)
5. `migration_projects.sql` — **projects, project_payments, project_costs** + sample
6. `migration_perf.sql` — **index + trigram + bảng error_logs** (monitoring)
7. `realtime.sql` — thêm bảng vào publication (tự refresh không F5)
8. `policies_open.sql` — RLS mở cho anon
9. `seed_stress.sql` — 10k bản ghi test (CHỈ khi cần test hiệu năng; xoá sau: `delete from invoices_in where note='STRESS'`)

> Trạng thái dữ liệu thật hiện tại: invoices_in=40, invoices_out=5, projects=1 (data STRESS đã xoá).

---

## 6. Biến môi trường

`.env.local` (local) và Vercel env (Production) — xem mẫu `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # public, an toàn
LARK_APP_ID / LARK_APP_SECRET / LARK_BASE_TOKEN   # server-only
SYNC_SECRET=...                          # bảo vệ /api/lark/sync
# (chưa bật) SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN
```

⚠️ App Secret Lark từng dán trong chat — nên regenerate nếu lo lộ.

---

## 7. Tích hợp Lark

- `src/lib/lark/client.ts` — token cache + list tables/fields/records (host open.larksuite.com)
- `src/lib/lark/sync.ts` — đọc 16 bảng Lark → map → ghi đè Supabase. `matchCompany` xử lý tên "Công ty " bị cắt
- `src/app/api/lark/sync/route.ts` — POST, check header `x-sync-secret`
- Nút "Đồng bộ ngay" ở `/settings` + FAB. 1 chiều Lark → web.

---

## 8. Deploy & cập nhật

```bash
cd D:\AMAX\erp-crm
npx tsc --noEmit          # typecheck
npm run build             # build (Turbopack)
npx vercel --prod --yes   # deploy CLI (không qua GitHub)
git push origin master    # đẩy code lên GitHub (DHien2619/erp-crm)
```
Hoặc dùng skill `vercel-update`. Domain ổn định: `erp-crm-kappa.vercel.app`.

---

## 9. Hiệu năng & chất lượng (đã làm)

- Pagination + search server-side (`.range()` + count + ilike/trigram), `useTransition` không mất focus
- DB index (ngày/trạng thái/hạng mục/số tiền) + GIN trigram — tìm trên 10k ~0.24s
- Error boundary (`error.tsx`, `global-error.tsx`) — không trắng màn hình
- Loading skeleton (global + route)
- Cache dashboard 30s (`unstable_cache` + client thuần `src/lib/supabase/plain.ts`)
- Realtime auto-refresh (`src/components/realtime-refresh.tsx`)
- Monitoring: bảng `error_logs` + Sentry (gated). Logger: `src/lib/log.ts`

---

## 10. Còn lại / TODO

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| 🔴 Cao | **Auth + siết RLS** | DB đang mở, repo public — bắt buộc trước khi dùng thật/công khai |
| 🟡 | Bật Sentry | Tạo DSN trên sentry.io → thêm SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN vào Vercel |
| 🟡 | Xuất XML tờ khai HTKK | Cần biết phiên bản HTKK để khớp schema |
| 🟢 | OCR hoá đơn, CRM bán hàng (pipeline), AI chat hỏi số liệu | Mở rộng |
| 🟢 | Lark 2 chiều, pagination server-side cho bảng khác | Mở rộng |

---

## 11. Lưu ý quan trọng

- **Báo cáo tài chính/thuế là bản QUẢN TRỊ** (ước tính để ra quyết định), KHÔNG thay BCTC pháp lý / tờ khai chính thức. Chi phí lương/khấu hao nếu chưa nhập thì chưa phản ánh.
- **Không tự nộp thuế được** — cần chữ ký số + giấy phép T-VAN (MISA có). Web chỉ chuẩn bị + xuất Excel.
- **Bảo mật:** anon key là public-safe, nhưng RLS mở = ai có URL Supabase trong code đều đọc/ghi. Phải thêm Auth trước khi public rộng.
- Máy chính: `D:\AMAX\erp-crm` (Windows, COMPUTERNAME HIENZ). HANDOFF + CLAUDE.md không sync giữa máy.
