-- Migration: Add is_admin_test to interviews table

alter table public.interviews
  add column if not exists is_admin_test boolean not null default false;

create index if not exists idx_interviews_is_admin_test on public.interviews (is_admin_test);
