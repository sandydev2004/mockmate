-- 20240107000000_payments_hardening.sql
-- Idempotent migration for Payments hardening & unique constraints

-- 1. Ensure credits column exists on profiles table with default 1 free credit
alter table public.profiles add column if not exists credits int not null default 1;

-- 2. Add pack, order_id, payment_id columns to payments table for clean canonical access
alter table public.payments add column if not exists pack text;
alter table public.payments add column if not exists order_id text;
alter table public.payments add column if not exists payment_id text;

-- Sync existing rows so order_id and payment_id match razorpay equivalents
update public.payments
set order_id = razorpay_order_id
where order_id is null and razorpay_order_id is not null;

update public.payments
set payment_id = razorpay_payment_id
where payment_id is null and razorpay_payment_id is not null;

-- 3. Add unique constraints/indexes for order_id and payment_id (idempotent)
create unique index if not exists idx_payments_order_id on public.payments (order_id) where order_id is not null;
create unique index if not exists idx_payments_payment_id on public.payments (payment_id) where payment_id is not null;
create unique index if not exists idx_payments_rzp_payment_id on public.payments (razorpay_payment_id) where razorpay_payment_id is not null;

-- 4. Atomic, idempotent function to fulfill payments and credit user
create or replace function public.fulfill_payment(
  p_order_id text,
  p_payment_id text,
  p_user_id uuid,
  p_credits int
)
returns boolean as $$
declare
  v_status text;
begin
  -- Row-level locking to avoid race conditions from concurrent webhook retries
  select status into v_status 
  from public.payments 
  where razorpay_order_id = p_order_id or order_id = p_order_id 
  for update;

  if not found then
    return false;
  end if;

  -- Idempotency check: if already paid, do NOT double-credit
  if v_status = 'paid' then
    return true;
  end if;

  -- Update payment record to paid
  update public.payments
  set status = 'paid', 
      razorpay_payment_id = p_payment_id,
      payment_id = p_payment_id
  where razorpay_order_id = p_order_id or order_id = p_order_id;

  -- Add credits atomically to user profile
  update public.profiles
  set credits = credits + p_credits, 
      updated_at = now()
  where id = p_user_id;

  return true;
end;
$$ language plpgsql security definer;
