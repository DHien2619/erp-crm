-- =============================================================
-- ERP-CRM · Hiệu năng & monitoring — chạy 1 lần trong SQL Editor
-- 1) Index tăng tốc lọc/sắp xếp/tìm kiếm
-- 2) Bảng error_logs để theo dõi lỗi production
-- An toàn chạy lại (if not exists).
-- =============================================================

-- ---------- 1) INDEX ----------
-- Hoá đơn đầu vào: lọc theo ngày / trạng thái / hạng mục, tìm theo NCC + mã
create index if not exists idx_inv_in_date     on invoices_in (invoice_date desc);
create index if not exists idx_inv_in_status   on invoices_in (status);
create index if not exists idx_inv_in_category on invoices_in (category);
create index if not exists idx_inv_in_supplier on invoices_in (lower(supplier_name));
create index if not exists idx_inv_in_amount   on invoices_in (amount);

-- Hoá đơn đầu ra: ngày / trạng thái / khách hàng
create index if not exists idx_inv_out_date    on invoices_out (invoice_date desc);
create index if not exists idx_inv_out_status  on invoices_out (status);
create index if not exists idx_inv_out_company on invoices_out (lower(company_name));

-- Tìm kiếm full-text nhẹ bằng trigram (tăng tốc ilike '%...%')
create extension if not exists pg_trgm;
create index if not exists idx_inv_in_supplier_trgm  on invoices_in  using gin (supplier_name gin_trgm_ops);
create index if not exists idx_inv_in_code_trgm      on invoices_in  using gin (code gin_trgm_ops);
create index if not exists idx_inv_out_company_trgm  on invoices_out using gin (company_name gin_trgm_ops);

-- ---------- 2) BẢNG ERROR_LOGS ----------
create table if not exists error_logs (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  stack       text,
  context     jsonb,
  url         text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_error_logs_created on error_logs (created_at desc);

alter table error_logs enable row level security;
drop policy if exists "open access" on error_logs;
create policy "open access" on error_logs
  for all to anon, authenticated using (true) with check (true);
