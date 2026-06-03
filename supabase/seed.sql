-- =============================================================
-- ERP-CRM · Seed data mẫu (chạy SAU schema.sql)
-- Mục đích: có sẵn số liệu để Dashboard / Reports hiển thị.
-- An toàn chạy lại: xoá dữ liệu cũ trước khi insert.
-- =============================================================

truncate invoices_in, invoices_out, expenses, suppliers, companies restart identity cascade;

-- ---------- SUPPLIERS ----------
insert into suppliers (name, category, ease_to_collect) values
  ('Google Workspace', 'saas', 'easy'),
  ('Facebook Ads', 'marketing', 'easy'),
  ('AWS Cloud', 'saas', 'easy'),
  ('TikTok Ads', 'marketing', 'easy'),
  ('Văn phòng phẩm Hồng Hà', 'office', 'medium'),
  ('Grab Business', 'travel', 'medium'),
  ('Highlands Coffee', 'fnb', 'hard'),
  ('Designer freelance', 'freelancer', 'hard');

-- ---------- COMPANIES (khách hàng) ----------
insert into companies (name, tax_code, phone) values
  ('Công ty TNHH ABC', '0312345678', '0901111222'),
  ('Cổ phần XYZ Retail', '0398765432', '0903333444'),
  ('Startup DEF', '0301122334', '0905555666');

-- ---------- EXPENSES + INVOICES_IN (tháng 5 & 6/2026) ----------
-- matched = đã có HĐ ; missing = thiếu HĐ ; pending = chờ duyệt
insert into expenses (supplier_name, category, amount, vat_rate, spent_at) values
  ('Google Workspace', 'saas', 4200000, 10, '2026-06-02'),
  ('AWS Cloud', 'saas', 18200000, 10, '2026-06-05'),
  ('Facebook Ads', 'marketing', 12500000, 5, '2026-06-02'),
  ('TikTok Ads', 'marketing', 18400000, 5, '2026-06-08'),
  ('Văn phòng phẩm Hồng Hà', 'office', 2800000, 10, '2026-06-10'),
  ('Grab Business', 'travel', 1850000, 10, '2026-06-02'),
  ('Highlands Coffee', 'fnb', 680000, 8, '2026-06-01'),
  ('Designer freelance', 'freelancer', 15000000, 0, '2026-06-12');

insert into invoices_in (supplier_name, code, category, amount, vat_rate, status, invoice_date) values
  ('Google Workspace', '0000421', 'saas', 4200000, 10, 'matched', '2026-06-02'),
  ('AWS Cloud', '0000419', 'saas', 18200000, 10, 'matched', '2026-06-05'),
  ('Facebook Ads', '0000420', 'marketing', 12500000, 5, 'pending', '2026-06-02'),
  ('TikTok Ads', '0000414', 'marketing', 18400000, 5, 'missing', '2026-06-08'),
  ('Văn phòng phẩm Hồng Hà', '0000398', 'office', 2800000, 10, 'matched', '2026-06-10'),
  ('Grab Business', '0000413', 'travel', 1850000, 10, 'matched', '2026-06-02'),
  ('Highlands Coffee', '0000418', 'fnb', 680000, 8, 'missing', '2026-06-01'),
  ('Designer freelance', '0000397', 'freelancer', 15000000, 0, 'missing', '2026-06-12');

-- ---------- INVOICES_OUT (doanh thu) ----------
insert into invoices_out (company_name, code, amount, vat_rate, status, invoice_date) values
  ('Công ty TNHH ABC', 'OUT-0101', 180000000, 10, 'matched', '2026-06-03'),
  ('Cổ phần XYZ Retail', 'OUT-0102', 220000000, 10, 'matched', '2026-06-09'),
  ('Startup DEF', 'OUT-0103', 100000000, 10, 'pending', '2026-06-15');
