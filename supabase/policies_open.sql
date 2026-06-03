-- =============================================================
-- ERP-CRM · Mở quyền truy cập cho anon (KHÔNG cần đăng nhập)
-- Dùng cho giai đoạn internal/demo. Siết lại bằng Auth khi public.
-- Chạy trong Supabase Studio > SQL Editor.
-- =============================================================
do $$
declare t text;
begin
  foreach t in array array['companies','suppliers','expenses','invoices_in','invoices_out']
  loop
    execute format('drop policy if exists "auth full access" on %s;', t);
    execute format('drop policy if exists "open access" on %s;', t);
    execute format(
      'create policy "open access" on %s
       for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;
