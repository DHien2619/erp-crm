-- =============================================================
-- ERP-CRM · Migration mở rộng CRM + công nợ (chạy 1 lần trong SQL Editor)
-- An toàn chạy lại nhiều lần (if not exists).
-- =============================================================

-- Số đã thanh toán + hạn thanh toán (để tính công nợ phải thu/phải trả)
alter table invoices_out add column if not exists paid_amount numeric(15,0) not null default 0;
alter table invoices_out add column if not exists due_date date;
alter table invoices_in  add column if not exists paid_amount numeric(15,0) not null default 0;
alter table invoices_in  add column if not exists due_date date;

-- Thông tin nhà cung cấp đầy đủ hơn
alter table suppliers add column if not exists phone text;
alter table suppliers add column if not exists email text;
alter table suppliers add column if not exists bank_name text;
alter table suppliers add column if not exists bank_account text;

-- Điều khoản thanh toán khách hàng
alter table companies add column if not exists payment_terms text;

-- View công nợ phải thu (AR) theo khách hàng
create or replace view receivables as
select
  company_name,
  count(*)                                   as invoice_count,
  sum(amount)                                as total,
  sum(paid_amount)                           as paid,
  sum(amount - paid_amount)                  as outstanding,
  max(due_date)                              as last_due
from invoices_out
group by company_name
having sum(amount - paid_amount) > 0;

-- Định nghĩa lại monthly_gap: chi phí lấy từ invoices_in (nguồn duy nhất),
-- để khi thêm/sửa hoá đơn thì dashboard cập nhật nhất quán.
create or replace view monthly_gap as
with months as (
  select date_trunc('month', d)::date as m
  from generate_series(date_trunc('year', now()), date_trunc('month', now()), interval '1 month') as d
),
exp as (
  select date_trunc('month', invoice_date)::date as m, sum(amount) as expense
  from invoices_in group by 1
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

-- View công nợ phải trả (AP) theo nhà cung cấp
create or replace view payables as
select
  supplier_name,
  count(*)                                   as invoice_count,
  sum(amount)                                as total,
  sum(paid_amount)                           as paid,
  sum(amount - paid_amount)                  as outstanding
from invoices_in
group by supplier_name
having sum(amount - paid_amount) > 0;
