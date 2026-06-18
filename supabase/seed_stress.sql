-- =============================================================
-- ERP-CRM · Seed STRESS TEST — sinh 10.000 hoá đơn đầu vào + 2.000 đầu ra
-- Mục đích: chứng minh độ ổn định & hiệu năng với dữ liệu lớn.
-- CHẠY SAU migration_perf.sql (để có index). Chạy 1 lần.
--
-- ⚠️ Dọn sau khi test xong:
--   delete from invoices_in  where note = 'STRESS';
--   delete from invoices_out where note = 'STRESS';
-- =============================================================

-- 10.000 hoá đơn đầu vào
insert into invoices_in (supplier_name, code, category, amount, vat_rate, status, invoice_date, paid_amount, note)
select
  'NCC test ' || (1 + (g % 200)),
  'HD-IN-' || lpad(g::text, 6, '0'),
  (array['saas','marketing','travel','office','fnb','logistics','freelancer','other'])[1 + (g % 8)]::invoice_category,
  (100000 + (g % 50) * 137000),
  (array[0,5,8,10])[1 + (g % 4)],
  (array['matched','pending','missing'])[1 + (g % 3)]::invoice_status,
  (date '2025-01-01' + ((g % 540)) ),                 -- rải ~1.5 năm
  case when g % 3 = 0 then (100000 + (g % 50) * 137000) else 0 end,
  'STRESS'
from generate_series(1, 10000) as g;

-- 2.000 hoá đơn đầu ra
insert into invoices_out (company_name, code, amount, vat_rate, status, invoice_date, paid_amount, due_date, note)
select
  'Khách test ' || (1 + (g % 80)),
  'HD-OUT-' || lpad(g::text, 6, '0'),
  (2000000 + (g % 40) * 511000),
  (array[0,8,10])[1 + (g % 3)],
  (array['matched','pending','missing'])[1 + (g % 3)]::invoice_status,
  (date '2025-01-01' + ((g % 540)) ),
  case when g % 2 = 0 then (2000000 + (g % 40) * 511000) else 0 end,
  (date '2025-01-01' + ((g % 540)) + 30),
  'STRESS'
from generate_series(1, 2000) as g;
