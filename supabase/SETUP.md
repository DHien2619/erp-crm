# Hướng dẫn kết nối Supabase — ERP-CRM

Phần code đã sẵn sàng. Bạn chỉ cần làm **5 bước thủ công** dưới đây (mất ~10 phút).
Đây là những bước Claude **không tự làm thay** được vì cần tài khoản Supabase của bạn.

---

## Bước 1 — Tạo project Supabase

1. Vào https://supabase.com → đăng nhập (dùng GitHub `DHien2619` cho tiện).
2. **New project** → đặt tên `erp-crm`, chọn region **Singapore** (gần VN nhất).
3. Đặt **Database Password** (lưu lại) → **Create**. Chờ ~2 phút.

## Bước 2 — Chạy schema

1. Trong project → menu trái **SQL Editor** → **New query**.
2. Mở file `supabase/schema.sql` trong dự án, copy toàn bộ, dán vào, bấm **Run**.
3. Thấy "Success. No rows returned" là xong (tạo bảng + view + RLS).

## Bước 3 — (Tuỳ chọn) Nạp dữ liệu mẫu

1. **SQL Editor** → **New query**.
2. Copy toàn bộ `supabase/seed.sql` → dán → **Run**.
3. Giờ các bảng đã có dữ liệu để Dashboard/Reports hiển thị.

## Bước 4 — Lấy URL + Anon key

1. Menu trái **Project Settings** (bánh răng) → **Data API**.
   - Copy **Project URL** → đây là `NEXT_PUBLIC_SUPABASE_URL`.
2. Sang tab **API Keys** → copy **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Bước 5 — Điền vào .env.local

1. Trong thư mục `erp-crm`, tạo file `.env.local` (copy từ `.env.local.example`).
2. Dán 2 giá trị vừa lấy:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

3. Khởi động lại dev server (`npm run dev`).

---

## Xong rồi thì sao?

Báo Claude **"đã xong Supabase"** — Claude sẽ:

- Thay mock data trong các trang bằng truy vấn Supabase thật (read/write).
- Wire form "Thêm hoá đơn" để **lưu thật** vào DB + upload ảnh lên Storage.
- Thêm đăng nhập (Auth) để bảo vệ dữ liệu.

## Đã có sẵn trong code

| File | Vai trò |
|------|---------|
| `src/lib/supabase/client.ts` | Client cho Client Components |
| `src/lib/supabase/server.ts` | Client cho Server Components / Actions |
| `src/lib/database.types.ts`  | Kiểu TypeScript khớp schema |
| `supabase/schema.sql`        | Tạo bảng + view `monthly_gap` + RLS |
| `supabase/seed.sql`          | Dữ liệu mẫu |
| `.env.local.example`         | Mẫu biến môi trường |

> ⚠️ Không commit `.env.local` (đã được `.gitignore` chặn). Chỉ commit file `.example`.
