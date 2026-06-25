# HANDOFF — ERP-CRM (AIECOS)

Tài liệu bàn giao trạng thái dự án. Cập nhật: 2026-06.

---

## 1. Dự án là gì

Web ERP-CRM nội bộ cho AIECOS — quản trị tài chính, theo dõi **gap hoá đơn** (cần bao nhiêu HĐ hợp lệ để cân chi phí, tối ưu thuế), quản lý dự án, báo cáo thuế/KPI/tài chính, **AI agent trợ lý** + **nhật ký + báo cáo AI**, có **đăng nhập + phân quyền**.

**Vai trò:** công cụ quản trị cho chủ DN. KHÔNG thay MISA — nộp thuế chính thức + chữ ký số vẫn qua MISA/kế toán. Web lo quản trị + xuất Excel để import MISA.

---

## 2. Truy cập

| | |
|---|---|
| Web production | https://erp-crm-kappa.vercel.app (giờ **yêu cầu đăng nhập**) |
| GitHub (public) | https://github.com/DHien2619/erp-crm |
| Supabase project | verrksogurlxraawdhni |
| Vercel | hienld1109-7953s-projects / project `erp-crm` |
| Local | `D:\AMAX\erp-crm` (máy lap1: COMPUTERNAME=HIENZ) |
| Tài khoản test | `hien@gmail.com` / `123123` — vai trò `hr` (nhân sự) |

---

## 3. Tech stack

- **Next.js 16** (App Router, Turbopack) + TS + Tailwind v4
- **Supabase** (@supabase/ssr) — Postgres + **Auth (email/password)** + RLS
- **Recharts v3** · **Lark Bitable API** · **Sentry** (gated DSN)
- **Groq SDK** (`groq-sdk`) — AI agent dùng model `llama-3.3-70b-versatile` (FREE)
- Deploy bằng **Vercel CLI** (`npx vercel --prod --yes`), region sin1

---

## 4. Các trang

| Route | Chức năng | Vai trò thấy |
|---|---|---|
| `/login` | Đăng nhập | công khai |
| `/` | Dashboard (cache 30s) | tất cả |
| `/invoices/in` | Hoá đơn vào — pagination/search server-side | admin, accountant, staff |
| `/customers` | Khách hàng + doanh thu | admin, accountant, hr |
| `/suppliers` `/debts` | NCC, công nợ | admin, accountant |
| `/projects` `/projects/[id]` | Dự án (lãi/lỗ, %, donut) | admin, accountant, hr |
| `/reports` `/kpi` `/finance` `/tax` `/forecast` `/strategy` | Báo cáo Gap, KPI, BCTC, Thuế, Dự báo, Chiến lược | admin, accountant |
| `/activity` ⭐ | **Nhật ký + Báo cáo AI** | admin, accountant, hr |
| `/modules/*` | Nghiệp vụ (tạm ứng, quỹ, ngân sách...) | admin, accountant |
| `/settings` | Cấu hình + Đồng bộ Lark | tất cả |

Phân quyền route khai báo ở `src/lib/roles.ts` (dùng cả cho middleware chặn URL + ẩn sidebar).

---

## 5. Auth & phân quyền (mục mới quan trọng)

- **Đăng nhập:** Supabase Auth email/password. Trang `/login` (`login-form.tsx`).
- **Middleware** `src/middleware.ts` + `src/lib/supabase/middleware.ts`: chưa đăng nhập → đẩy `/login`; sai quyền → đẩy `/`. (`/api`, `/login` công khai.)
- **Vai trò** lưu ở bảng `profiles.role`: `admin | accountant | hr | staff`. Map quyền: `src/lib/roles.ts`.
- **Lấy vai trò ở SERVER** (`src/lib/auth.ts` → `getCurrentUser()`), truyền qua `RoleProvider` (context) trong `layout.tsx` → Sidebar + UserMenu đọc context (KHÔNG fetch client → hết nháy menu).
- Tạo tài khoản: Supabase → Authentication → Users → Add user (tick Auto Confirm). Set role bằng SQL.

---

## 6. AI Agent + Nhật ký + Báo cáo (mục mới)

- **Trợ lý tài chính** (nút 🤖 góc phải): `src/components/agent/agent-chat.tsx` → `POST /api/agent`.
  - Backend `src/app/api/agent/route.ts`: vòng lặp tool-calling (Groq). Tool đọc ở `src/lib/agent/tools.ts` (financial overview, công nợ, top KH/NCC, gap, dự án). Tool ghi (`propose_add_expense/revenue`) → trả về client xác nhận trước khi lưu.
  - **GROQ_API_KEY** được làm sạch BOM: `.replace(/[^\x21-\x7e]/g,"")`.
- **Tự lưu nhật ký:** mỗi lượt hỏi ghi vào bảng `activity_log` (ai/lúc nào/hỏi gì/đáp gì/tool). Riêng tư qua RLS (mỗi người xem log của mình; admin xem tất cả).
- **Báo cáo tổng hợp:** `POST /api/agent/report` — gom số liệu THẬT (tài chính nếu admin/accountant, công nợ, top KH, dự án, hoạt động) + Groq viết nhận định & khuyến nghị (JSON). Render đẹp theo mục ở `activity-client.tsx`.

---

## 7. SQL — thứ tự chạy trong Supabase SQL Editor

An toàn chạy lại. Trạng thái: hầu hết đã chạy; kiểm tra nếu tính năng nào trống.

1. `schema.sql`, `migration_crm.sql`, `migration_modules.sql`, `migration_sepay.sql` — bảng gốc + module
2. `migration_projects.sql` — dự án
3. `migration_perf.sql` — index + error_logs (monitoring)
4. `realtime.sql` — realtime publication
5. `policies_open.sql` — RLS mở cho các bảng nghiệp vụ
6. **`migration_auth.sql`** — bảng `profiles` + trigger tạo profile khi đăng ký (BẮT BUỘC để đăng nhập)
7. **`migration_activity.sql`** — bảng `activity_log` + RLS **own-or-admin** (riêng tư)
8. `seed_stress.sql` — 10k bản ghi test (đã xoá sau khi test)

> Sau khi tạo user: `update profiles set role='admin' where email='...';` (hoặc 'hr'/'accountant').

---

## 8. Biến môi trường (Vercel Production + .env.local)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY   # public, an toàn
LARK_APP_ID / LARK_APP_SECRET / LARK_BASE_TOKEN            # server-only
SYNC_SECRET                                                # bảo vệ /api/lark/sync
GROQ_API_KEY                                               # AI agent (free, console.groq.com) — ĐÃ cấu hình
# (chưa bật) SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN
```
⚠️ Key Lark + Groq từng dán trong chat — nên regenerate nếu lo lộ.

---

## 9. Deploy & cập nhật

```bash
cd D:\AMAX\erp-crm
npx tsc --noEmit && npm run build
npx vercel --prod --yes
git push origin master
```
Domain ổn định: `erp-crm-kappa.vercel.app`. Thêm env: `npx vercel env add NAME production` rồi redeploy (cẩn thận BOM khi pipe trên PowerShell).

---

## 10. Hiệu năng & chất lượng (đã làm)

Pagination/search server-side (HĐ) · DB index + trigram (~0.24s/10k) · error boundary · loading skeleton · cache dashboard 30s · realtime auto-refresh · monitoring (error_logs + Sentry gated).

---

## 11. Còn lại / TODO

| Ưu tiên | Việc |
|---|---|
| 🟡 | Siết RLS toàn diện theo user (hiện nhiều bảng nghiệp vụ vẫn mở anon; chỉ profiles/activity_log đã riêng tư) |
| 🟡 | Bật Sentry (thêm DSN) |
| 🟢 | Log cả phiên Claude Code ngoài ERP vào nhật ký (cần hook) — hiện chỉ log agent trong ERP (phương án A) |
| 🟢 | Xuất tờ khai XML cho HTKK; CRM bán hàng (pipeline); OCR hoá đơn |
| 🟢 | Agent ghi nâng cao (thêm dự án/chi phí dự án) |

---

## 12. Lưu ý quan trọng

- **Báo cáo tài chính/thuế/KPI là QUẢN TRỊ** (ước tính), không thay BCTC pháp lý / tờ khai chính thức.
- **Không tự nộp thuế / không tự đăng nhập / không nhập mật khẩu thay user** — quy tắc an toàn (kể cả khi được yêu cầu).
- **Lái trình duyệt:** chỉ trên lap1 (COMPUTERNAME=HIENZ) + **ground-truth bằng server localhost bền nền** (KHÔNG tin cờ `isLocal` vì 2 máy chung tài khoản Claude). Xem cách đã làm: mở node server cổng 8799 trên lap1 → bắt browser đọc token.
- **Bảo mật:** anon key public-safe; profiles/activity_log đã RLS riêng tư; các bảng nghiệp vụ khác còn mở — siết trước khi public rộng.
- HANDOFF.md nằm trong repo → `git pull` để có ở máy khác. CLAUDE.md (preferences) không sync.
