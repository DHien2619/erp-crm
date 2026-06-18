-- =============================================================
-- ERP-CRM · Migration DỰ ÁN — chạy 1 lần trong Supabase SQL Editor
-- An toàn chạy lại (if not exists). Bật RLS + policy mở cho anon.
-- =============================================================

-- 1) Dự án
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  code            text,
  name            text not null,
  client_name     text,                       -- khách hàng
  contract_value  numeric(15,0) not null default 0,  -- giá trị dự án (₫)
  status          text not null default 'active',    -- active / done / paused
  start_date      date,
  note            text,
  created_at      timestamptz not null default now()
);

-- 2) Đợt thanh toán của khách (đợt 1, đợt 2, ...)
create table if not exists project_payments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  label       text,                           -- "Đợt 1", "Tạm ứng", ...
  amount      numeric(15,0) not null default 0,
  paid_at     date,
  note        text,
  created_at  timestamptz not null default now()
);

-- 3) Chi phí dự án (theo hạng mục: công cụ AI, phần mềm, nhân sự, ...)
create table if not exists project_costs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  category    text not null default 'other',  -- ai_tools / software / personnel / outsource / other
  name        text,                           -- mô tả cụ thể (vd "ChatGPT Team")
  amount      numeric(15,0) not null default 0,
  spent_at    date,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_project_payments_project on project_payments(project_id);
create index if not exists idx_project_costs_project on project_costs(project_id);

-- RLS + policy mở (giai đoạn internal/demo)
do $$
declare t text;
begin
  foreach t in array array['projects','project_payments','project_costs']
  loop
    execute format('alter table %s enable row level security;', t);
    execute format('drop policy if exists "open access" on %s;', t);
    execute format(
      'create policy "open access" on %s
       for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Dữ liệu mẫu (chỉ chèn nếu chưa có dự án nào) — để thử ngay
do $$
declare pid uuid;
begin
  if not exists (select 1 from projects) then
    insert into projects (code, name, client_name, contract_value, status, start_date, note)
    values ('DA-001', 'Website + AI Chatbot cho Dược Liệu Việt',
            'Công ty TNHH Ứng dụng Dược Liệu Việt', 120000000, 'active', current_date - 40,
            'Landing page + tích hợp AI Sale Agent')
    returning id into pid;

    insert into project_payments (project_id, label, amount, paid_at) values
      (pid, 'Đợt 1 (tạm ứng 40%)', 48000000, current_date - 38);

    insert into project_costs (project_id, category, name, amount, spent_at) values
      (pid, 'ai_tools',  'ChatGPT Team + Claude',  3500000, current_date - 30),
      (pid, 'software',  'Vercel Pro + Supabase',  1800000, current_date - 28),
      (pid, 'personnel', 'Dev frontend (part-time)', 18000000, current_date - 20),
      (pid, 'outsource', 'Thiết kế UI/UX',          6000000, current_date - 25);
  end if;
end $$;
