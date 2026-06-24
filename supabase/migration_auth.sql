-- =============================================================
-- ERP-CRM · Auth & phân quyền — chạy 1 lần trong Supabase SQL Editor
-- Tạo bảng profiles (gắn role cho mỗi user) + tự tạo profile khi đăng ký.
-- =============================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'staff',   -- admin | accountant | hr | staff
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles
  for select to authenticated using (true);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update to authenticated using (auth.uid() = id);

-- Tự tạo profile khi có user mới đăng ký
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===== SAU KHI TẠO USER (Authentication > Users > Add user) =====
-- Đặt vai trò cho tài khoản của bạn, ví dụ "nhân sự" (hr) hoặc "admin":
--   update profiles set role = 'hr'    where email = 'ban@email.com';
--   update profiles set role = 'admin' where email = 'ban@email.com';
