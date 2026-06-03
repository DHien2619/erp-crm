-- =============================================================
-- ERP-CRM · Schema (Supabase / Postgres)
-- Internal tool AIECOS — quản lý gap hoá đơn đầu vào
-- Chạy file này trong Supabase Studio > SQL Editor
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type invoice_status as enum ('matched', 'pending', 'missing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_category as enum (
    'saas','marketing','travel','office','fnb','logistics','freelancer','other'
  );
exception when duplicate_object then null; end $$;

-- ---------- updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =============================================================
-- COMPANIES (khách hàng / đối tác — phục vụ CRM + hoá đơn đầu ra)
-- =============================================================
create table if not exists companies (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  tax_code     text,
  phone        text,
  email        text,
  address      text,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =============================================================
-- SUPPLIERS (nhà cung cấp — hoá đơn đầu vào)
-- =============================================================
create table if not exists suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  tax_code      text,
  category      invoice_category not null default 'other',
  ease_to_collect text not null default 'medium', -- easy | medium | hard
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================
-- EXPENSES (chi phí thực tế — có thể chưa có hoá đơn)
-- =============================================================
create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid references suppliers(id) on delete set null,
  supplier_name text not null,                 -- denormalized cho hiển thị nhanh
  category      invoice_category not null default 'other',
  amount        numeric(15,0) not null,        -- VND, trước VAT
  vat_rate      smallint not null default 10,  -- %
  spent_at      date not null,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================
-- INVOICES_IN (hoá đơn đầu vào — gắn với expense + supplier)
-- =============================================================
create table if not exists invoices_in (
  id            uuid primary key default gen_random_uuid(),
  expense_id    uuid references expenses(id) on delete set null,
  supplier_id   uuid references suppliers(id) on delete set null,
  supplier_name text not null,
  code          text,                          -- số hoá đơn
  category      invoice_category not null default 'other',
  amount        numeric(15,0) not null,
  vat_rate      smallint not null default 10,
  status        invoice_status not null default 'pending',
  invoice_date  date,
  file_url      text,                          -- ảnh/PDF trong Storage
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================
-- INVOICES_OUT (hoá đơn đầu ra — doanh thu, gắn với company)
-- =============================================================
create table if not exists invoices_out (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies(id) on delete set null,
  company_name  text not null,
  code          text,
  amount        numeric(15,0) not null,
  vat_rate      smallint not null default 10,
  status        invoice_status not null default 'pending',
  invoice_date  date,
  file_url      text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_expenses_spent_at     on expenses(spent_at);
create index if not exists idx_expenses_supplier     on expenses(supplier_id);
create index if not exists idx_invoices_in_date      on invoices_in(invoice_date);
create index if not exists idx_invoices_in_status    on invoices_in(status);
create index if not exists idx_invoices_in_supplier  on invoices_in(supplier_id);
create index if not exists idx_invoices_out_date     on invoices_out(invoice_date);
create index if not exists idx_invoices_out_company  on invoices_out(company_id);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['companies','suppliers','expenses','invoices_in','invoices_out']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on %1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- =============================================================
-- VIEW: tổng hợp gap theo tháng (đơn vị VND)
-- =============================================================
create or replace view monthly_gap as
with months as (
  select date_trunc('month', d)::date as m
  from generate_series(
    date_trunc('year', now()),
    date_trunc('month', now()),
    interval '1 month'
  ) as d
),
exp as (
  select date_trunc('month', spent_at)::date as m, sum(amount) as expense
  from expenses group by 1
),
inv as (
  select date_trunc('month', invoice_date)::date as m, sum(amount) as invoice_in
  from invoices_in where status = 'matched' group by 1
),
rev as (
  select date_trunc('month', invoice_date)::date as m, sum(amount) as revenue
  from invoices_out group by 1
)
select
  months.m as month,
  coalesce(rev.revenue, 0)    as revenue,
  coalesce(exp.expense, 0)    as expense,
  coalesce(inv.invoice_in, 0) as invoice_in,
  greatest(coalesce(exp.expense,0) - coalesce(inv.invoice_in,0), 0) as gap,
  round(greatest(coalesce(exp.expense,0) - coalesce(inv.invoice_in,0), 0) * 0.2) as tax_saving
from months
left join exp on exp.m = months.m
left join inv on inv.m = months.m
left join rev on rev.m = months.m
order by months.m;

-- =============================================================
-- ROW LEVEL SECURITY
-- Internal tool: mọi user đã đăng nhập (authenticated) full quyền.
-- (Nâng cấp multi-org sau bằng cột org_id + policy theo org.)
-- =============================================================
do $$
declare t text;
begin
  foreach t in array array['companies','suppliers','expenses','invoices_in','invoices_out']
  loop
    execute format('alter table %s enable row level security;', t);
    execute format('drop policy if exists "auth full access" on %s;', t);
    execute format(
      'create policy "auth full access" on %s
       for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;
