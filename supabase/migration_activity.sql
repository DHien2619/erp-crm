-- =============================================================
-- ERP-CRM · Nhật ký hoạt động AI — chạy 1 lần trong SQL Editor
-- Lưu mọi lần nhân viên hỏi Trợ lý AI trong ERP (câu hỏi, trả lời, tool dùng).
-- =============================================================

create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'agent_chat',  -- loại hoạt động
  user_id     uuid,                                 -- ai thực hiện (nếu đăng nhập)
  user_email  text,
  question    text,                                 -- câu hỏi / mục đích
  answer      text,                                 -- trả lời / kết quả
  tools       text[],                               -- các tool AI đã gọi
  created_at  timestamptz not null default now()
);
create index if not exists idx_activity_created on activity_log (created_at desc);

alter table activity_log enable row level security;

-- Gỡ chính sách mở cũ (nếu đã chạy bản trước)
drop policy if exists "open access" on activity_log;
drop policy if exists "insert log" on activity_log;
drop policy if exists "read own or admin" on activity_log;

-- Ghi log: cho phép (server set user_id theo phiên đăng nhập)
create policy "insert log" on activity_log
  for insert to anon, authenticated with check (true);

-- ĐỌC: chỉ nhật ký CỦA CHÍNH MÌNH; riêng admin được xem tất cả
create policy "read own or admin" on activity_log
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Bật realtime để báo cáo tự cập nhật
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table activity_log';
  exception when duplicate_object then null; when undefined_table then null;
  end;
end $$;
