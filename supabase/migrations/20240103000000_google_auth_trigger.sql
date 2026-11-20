-- Migration: Enhanced Google Auth & New User Signup Trigger
-- File: supabase/migrations/20240103000000_google_auth_trigger.sql

-- Guarantees:
-- 1. Correct candidate full_name extraction from Google OAuth metadata (full_name or name)
-- 2. New Google & email users get exactly 1 free credit in public.profiles
-- 3. Existing email/password users logging in with the same Gmail do NOT get a duplicate profile or a second free credit
-- 4. Safe upsert logic preventing duplicate profiles

create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate_name text;
  existing_profile record;
begin
  -- Extract candidate name from metadata (Google OAuth provides 'full_name' or 'name')
  candidate_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 1. Check if profile for this user ID already exists
  select * into existing_profile from public.profiles where id = new.id;
  if existing_profile.id is not null then
    -- Profile already exists for this ID; preserve credits, update name if previously missing
    if (existing_profile.full_name is null or existing_profile.full_name = split_part(existing_profile.email, '@', 1)) and candidate_name is not null then
      update public.profiles set full_name = candidate_name where id = new.id;
    end if;
    return new;
  end if;

  -- 2. Check if a profile exists with the same email (e.g. existing email/password user signing in via Google)
  select * into existing_profile from public.profiles where lower(email) = lower(new.email) limit 1;
  if existing_profile.id is not null then
    -- Existing profile found by email; DO NOT grant extra credit, link user ID and update name if needed
    update public.profiles
    set id = new.id,
        full_name = coalesce(nullif(trim(public.profiles.full_name), ''), candidate_name)
    where id = existing_profile.id;
    return new;
  end if;

  -- 3. Brand new user: insert profile with exactly 1 free credit
  insert into public.profiles (id, email, full_name, credits)
  values (
    new.id,
    new.email,
    candidate_name,
    1
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

