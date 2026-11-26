-- Migration: Fix Google Auth Trigger to Prevent PK/FK Constraint Violations
-- File: supabase/migrations/20240109000000_fix_google_signup_trigger.sql

create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate_name text;
begin
  -- 1. Extract candidate name from metadata
  candidate_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 2. Idempotently insert or update profile for new user ID
  -- NEVER mutate the primary key (id) of existing profiles!
  insert into public.profiles (id, email, full_name, credits)
  values (
    new.id,
    lower(new.email),
    candidate_name,
    1
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(trim(public.profiles.full_name), ''), excluded.full_name);

  return new;
exception when others then
  -- Do not block auth.users creation if profile trigger fails;
  -- The auth callback route (/auth/callback) acts as a robust secondary guarantee
  raise warning 'handle_new_user trigger error: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger on auth.users idempotently
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
