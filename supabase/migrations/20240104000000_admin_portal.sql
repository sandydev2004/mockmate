-- Migration: Admin Portal Schema (Role, Suspension, Audit Logs, Platform Settings, Problem Management)

-- 1. ADD ROLE AND SUSPENSION TO PROFILES
alter table public.profiles 
  add column if not exists role text not null default 'user' check (role in ('user', 'admin')),
  add column if not exists is_suspended boolean not null default false;

-- Create index on role and suspension for quick filtering
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_is_suspended on public.profiles (is_suspended);

-- 2. HARDEN RLS & TRIGGER ON PROFILES TO PREVENT SELF-ESCALATION
create or replace function public.protect_profile_admin_fields()
returns trigger as $$
begin
  if auth.role() = 'authenticated' then
    -- Regular authenticated users cannot alter their role or suspension status
    if new.role is distinct from old.role then
      raise exception 'Permission denied: Cannot modify role';
    end if;
    if new.is_suspended is distinct from old.is_suspended then
      raise exception 'Permission denied: Cannot modify suspension status';
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

-- 3. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid not null,
  admin_email text not null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Audit logs are strictly server-side / service-role managed
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create index if not exists idx_audit_logs_action on public.audit_logs (action);
create index if not exists idx_audit_logs_target on public.audit_logs (target_type, target_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- 4. PLATFORM SETTINGS TABLE
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

create policy "Admins can view platform settings"
  on public.platform_settings for select
  using (true);

-- Seed default platform settings
insert into public.platform_settings (key, value)
values 
  ('llm_kill_switch', 'false'::jsonb),
  ('max_daily_interviews_per_user', '10'::jsonb),
  ('max_strikes', '3'::jsonb),
  ('strike_grace_seconds', '15'::jsonb)
on conflict (key) do nothing;

-- 5. REVIEW FIELDS ON INTERVIEWS
alter table public.interviews
  add column if not exists admin_reviewed boolean not null default false,
  add column if not exists admin_notes text,
  add column if not exists admin_review_verdict text check (admin_review_verdict in ('approved', 'flagged', 'inconclusive')),
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_interviews_admin_reviewed on public.interviews (admin_reviewed);

-- 6. ACTIVE STATUS ON DSA PROBLEMS
alter table public.dsa_problems
  add column if not exists is_active boolean not null default true;

