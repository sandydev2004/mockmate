-- Migration: Hardened Admin Portal (RBAC, MFA, Append-Only Audit Logs with Hash Chain, Approvals, Soft Delete)

-- 1. EXTEND ROLES ON PROFILES TABLE
-- Roles: 'user', 'support', 'admin', 'super_admin'
alter table public.profiles 
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check 
  check (role in ('user', 'support', 'admin', 'super_admin'));

-- 2. ADD SOFT DELETE & SESSION REVOCATION COLUMNS
alter table public.profiles
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists admin_session_revoked_at timestamptz;

create index if not exists idx_profiles_is_deleted on public.profiles (is_deleted);

-- 3. HARDEN RLS & TRIGGER ON PROFILES TO PREVENT SELF-ESCALATION
create or replace function public.protect_profile_admin_fields()
returns trigger as $$
begin
  if auth.role() = 'authenticated' then
    -- Regular authenticated users cannot alter their role, suspension, deletion, or credits
    if new.role is distinct from old.role then
      raise exception 'Permission denied: Cannot modify role';
    end if;
    if new.is_suspended is distinct from old.is_suspended then
      raise exception 'Permission denied: Cannot modify suspension status';
    end if;
    if new.is_deleted is distinct from old.is_deleted then
      raise exception 'Permission denied: Cannot modify deletion status';
    end if;
    if new.credits is distinct from old.credits then
      raise exception 'Permission denied: Credits can only be changed server-side or via secure RPC';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_protect_profile_admin_fields on public.profiles;
create trigger tr_protect_profile_admin_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_admin_fields();

-- 4. HARDEN AUDIT LOGS TABLE (TAMPER-PROOF & APPEND-ONLY WITH HASH CHAIN)
alter table public.audit_logs
  add column if not exists request_id text,
  add column if not exists prev_hash text,
  add column if not exists entry_hash text;

create index if not exists idx_audit_logs_entry_hash on public.audit_logs (entry_hash);

-- Enforce append-only on public.audit_logs: reject UPDATE and DELETE
create or replace function public.audit_logs_append_only()
returns trigger as $$
begin
  raise exception 'audit_logs is append-only: updates and deletes are strictly forbidden';
end;
$$ language plpgsql;

drop trigger if exists tr_audit_logs_append_only on public.audit_logs;
create trigger tr_audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute procedure public.audit_logs_append_only();

-- 5. ADMIN DUAL APPROVAL TABLE
create table if not exists public.admin_approvals (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid not null,
  requester_email text not null,
  action text not null,
  target_type text not null,
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  approver_id uuid,
  approver_email text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.admin_approvals enable row level security;

create policy "Admins can view approvals"
  on public.admin_approvals for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

create index if not exists idx_admin_approvals_status on public.admin_approvals (status);
create index if not exists idx_admin_approvals_requester on public.admin_approvals (requester_id);
create index if not exists idx_admin_approvals_created_at on public.admin_approvals (created_at desc);
