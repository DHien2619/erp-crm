-- Bảng biến động số dư ngân hàng (nguồn: SePay webhook).
-- Chạy trong Supabase SQL Editor. Idempotent — chạy lại an toàn.

create table if not exists public.bank_transactions (
  id              uuid primary key default gen_random_uuid(),
  sepay_id        bigint unique,                 -- id giao dịch từ SePay (chống trùng)
  gateway         text,                          -- tên ngân hàng (VCB, ACB, MB...)
  account_number  text,                          -- số tài khoản nhận webhook
  sub_account     text,
  txn_date        timestamptz,                   -- thời điểm giao dịch
  amount          numeric not null default 0,    -- số tiền (luôn dương)
  direction       text not null default 'in',    -- 'in' = tiền vào, 'out' = tiền ra
  content         text,                          -- nội dung chuyển khoản (memo)
  counterparty    text,                          -- đối tác (parse từ memo, có thể null)
  accumulated     numeric,                       -- số dư sau giao dịch
  reference_code  text,                          -- mã tham chiếu ngân hàng
  code            text,
  raw             jsonb,                         -- payload gốc từ SePay
  created_at      timestamptz not null default now()
);

create index if not exists idx_bank_tx_date on public.bank_transactions (txn_date desc);
create index if not exists idx_bank_tx_dir  on public.bank_transactions (direction);

-- RLS: mở cho anon đọc/ghi (đồng bộ với phần còn lại của project; siết lại khi có Auth).
alter table public.bank_transactions enable row level security;
drop policy if exists "open_bank_transactions" on public.bank_transactions;
create policy "open_bank_transactions" on public.bank_transactions
  for all to anon using (true) with check (true);
grant all on public.bank_transactions to anon;

-- Cho PostgREST thấy bảng mới.
notify pgrst, 'reload schema';
