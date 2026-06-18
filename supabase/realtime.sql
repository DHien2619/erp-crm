-- =============================================================
-- ERP-CRM · Bật Realtime cho các bảng — chạy 1 lần trong SQL Editor
-- Thêm bảng vào publication "supabase_realtime" để web nhận sự kiện
-- INSERT/UPDATE/DELETE và tự refresh (không cần F5).
-- An toàn chạy lại: bỏ qua bảng đã có / chưa tồn tại.
-- =============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'projects','project_payments','project_costs',
    'invoices_in','invoices_out','expenses',
    'companies','suppliers',
    'cost_centers','bank_accounts','advances',
    'payment_requests','transactions','budgets','bank_transactions'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception
      when duplicate_object then null;  -- đã có trong publication
      when undefined_table then null;   -- bảng chưa tạo
    end;
  end loop;
end $$;
