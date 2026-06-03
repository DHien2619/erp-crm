-- =============================================================
-- ERP-CRM · Migration MODULE NGHIỆP VỤ (Nhóm A) — chạy 1 lần
-- An toàn chạy lại (if not exists / create or replace).
-- =============================================================

-- 1) Trung tâm chi phí
create table if not exists cost_centers (
  id          uuid primary key default gen_random_uuid(),
  code        text,
  name        text not null,
  group_name  text,
  owner       text,
  purpose     text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) Tài khoản ngân hàng / quỹ
create table if not exists bank_accounts (
  id            uuid primary key default gen_random_uuid(),
  code          text,
  type          text,                 -- Ngân hàng / Tiền mặt
  bank          text,
  account_no    text,
  owner         text,
  currency      text default 'VND',
  opening_balance numeric(15,0) not null default 0,
  manager       text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 3) Tạm ứng & hoàn ứng
create table if not exists advances (
  id            uuid primary key default gen_random_uuid(),
  code          text,
  person        text,
  department    text,
  project       text,
  advance_date  date,
  amount        numeric(15,0) not null default 0,
  purpose       text,
  due_date      date,
  settled       numeric(15,0) not null default 0,
  status        text default 'Đang treo',
  note          text,
  created_at    timestamptz not null default now()
);

-- 4) Yêu cầu thanh toán (có duyệt)
create table if not exists payment_requests (
  id            uuid primary key default gen_random_uuid(),
  code          text,
  request_date  date,
  requester     text,
  type          text,
  supplier_name text,
  cost_center   text,
  amount        numeric(15,0) not null default 0,
  need_by       date,
  status        text default 'Chờ duyệt',  -- Chờ duyệt / Đã duyệt / Từ chối / Đã chi
  approver      text,
  created_at    timestamptz not null default now()
);

-- 5) Giao dịch thanh toán (sổ thu–chi)
create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  code          text,
  txn_date      date,
  direction     text,                 -- Thu / Chi
  method        text,
  amount        numeric(15,0) not null default 0,
  account       text,
  ref_request   text,
  ref_invoice   text,
  status        text default 'Thành công',
  created_at    timestamptz not null default now()
);

-- 6) Kế hoạch ngân sách
create table if not exists budgets (
  id            uuid primary key default gen_random_uuid(),
  code          text,
  quarter       text,
  cost_center   text,
  budget        numeric(15,0) not null default 0,
  committed     numeric(15,0) not null default 0,
  actual        numeric(15,0) not null default 0,
  status        text default 'Đang dùng',
  created_at    timestamptz not null default now()
);

-- RLS mở cho anon (giai đoạn internal)
do $$
declare t text;
begin
  foreach t in array array['cost_centers','bank_accounts','advances','payment_requests','transactions','budgets']
  loop
    execute format('alter table %s enable row level security;', t);
    execute format('drop policy if exists "open access" on %s;', t);
    execute format('create policy "open access" on %s for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Buộc PostgREST nạp lại schema cache (để REST API thấy bảng mới ngay)
notify pgrst, 'reload schema';
