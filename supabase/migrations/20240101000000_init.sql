-- Supabase Schema for MockMate
-- Enables extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  target_role text default 'SDE',
  target_company_type text default 'product',
  credits int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Prevent authenticated clients from modifying credits directly
create or replace function public.protect_profile_credits()
returns trigger as $$
begin
  if auth.role() = 'authenticated' and new.credits is distinct from old.credits then
    raise exception 'Permission denied: Credits can only be changed server-side or via secure RPC';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_protect_profile_credits on public.profiles;
create trigger tr_protect_profile_credits
  before update on public.profiles
  for each row execute procedure public.protect_profile_credits();

-- Trigger for new user signup (Email & Google OAuth) to automatically insert a profile with 1 free credit
create or replace function public.handle_new_user()
returns trigger as $$
declare
  candidate_name text;
  existing_profile record;
begin
  candidate_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 1. Check if profile for this user ID already exists
  select * into existing_profile from public.profiles where id = new.id;
  if existing_profile.id is not null then
    if (existing_profile.full_name is null or existing_profile.full_name = split_part(existing_profile.email, '@', 1)) and candidate_name is not null then
      update public.profiles set full_name = candidate_name where id = new.id;
    end if;
    return new;
  end if;

  -- 2. Check if a profile exists with the same email (e.g. existing email/password user signing in via Google)
  select * into existing_profile from public.profiles where lower(email) = lower(new.email) limit 1;
  if existing_profile.id is not null then
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. RESUMES TABLE
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  filename text not null,
  file_path text not null,
  extracted_text text not null,
  file_size int,
  created_at timestamptz not null default now()
);

alter table public.resumes enable row level security;

create policy "Users can view own resumes" 
  on public.resumes for select 
  using (auth.uid() = user_id);

create policy "Users can insert own resumes" 
  on public.resumes for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own resumes" 
  on public.resumes for delete 
  using (auth.uid() = user_id);

-- 3. INTERVIEWS TABLE
create table if not exists public.interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('SDE', 'Data/ML', 'Core')),
  company_type text not null check (company_type in ('service', 'product', 'startup')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  round text not null check (round in ('dsa', 'hr', 'cs_fundamentals', 'system_design')),
  resume_id uuid references public.resumes(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  overall_score int,
  current_question_index int not null default 1,
  total_questions int not null default 6,
  dsa_problem_id text
);

alter table public.interviews enable row level security;

create policy "Users can view own interviews" 
  on public.interviews for select 
  using (auth.uid() = user_id);

create policy "Users can insert own interviews" 
  on public.interviews for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own interviews" 
  on public.interviews for update 
  using (auth.uid() = user_id);

-- 4. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references public.interviews(id) on delete cascade not null,
  sender text not null check (sender in ('ai', 'user', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages for own interviews" 
  on public.messages for select 
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = messages.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can insert messages for own interviews" 
  on public.messages for insert 
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = messages.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- 5. CODE SUBMISSIONS TABLE
create table if not exists public.code_submissions (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references public.interviews(id) on delete cascade not null,
  language text not null,
  code text not null,
  test_results jsonb,
  execution_status text,
  created_at timestamptz not null default now()
);

alter table public.code_submissions enable row level security;

create policy "Users can view submissions for own interviews" 
  on public.code_submissions for select 
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = code_submissions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can insert submissions for own interviews" 
  on public.code_submissions for insert 
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = code_submissions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- 6. FEEDBACK TABLE
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references public.interviews(id) on delete cascade not null unique,
  scores jsonb not null, -- { correctness: 0-10, communication: 0-10, depth: 0-10, problem_solving: 0-10 }
  overall int not null check (overall between 0 and 100),
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  summary text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Users can view feedback for own interviews" 
  on public.feedback for select 
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = feedback.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can insert feedback for own interviews" 
  on public.feedback for insert 
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = feedback.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- 7. PAYMENTS TABLE
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount int not null, -- in paise
  credits_added int not null,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments" 
  on public.payments for select 
  using (auth.uid() = user_id);

-- 8. DSA PROBLEMS TABLE
create table if not exists public.dsa_problems (
  id text primary key,
  title text not null,
  slug text not null unique,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  category text not null,
  description text not null,
  starter_code jsonb not null,
  test_cases jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.dsa_problems enable row level security;

create policy "Anyone can read DSA problems" 
  on public.dsa_problems for select 
  using (true);

-- 9. ATOMIC FUNCTION TO DEDUCT CREDIT
create or replace function public.deduct_interview_credit(p_user_id uuid)
returns boolean as $$
declare
  v_credits int;
begin
  select credits into v_credits from public.profiles where id = p_user_id for update;
  if v_credits is null or v_credits < 1 then
    return false;
  end if;

  update public.profiles
  set credits = credits - 1, updated_at = now()
  where id = p_user_id;

  return true;
end;
$$ language plpgsql security definer;

-- 10. ATOMIC FUNCTION TO ADD CREDITS (IDEMPOTENT FOR PAYMENTS)
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
  select status into v_status from public.payments where razorpay_order_id = p_order_id for update;
  if v_status = 'paid' then
    return true; -- already fulfilled
  end if;

  update public.payments
  set status = 'paid', razorpay_payment_id = p_payment_id
  where razorpay_order_id = p_order_id;

  update public.profiles
  set credits = credits + p_credits, updated_at = now()
  where id = p_user_id;

  return true;
end;
$$ language plpgsql security definer;

-- Supabase Storage bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Users can upload own resume files"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own resume files"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

-- 11. INTEGRITY EVENTS TABLE (Anti-cheating & proctoring metrics)
create table if not exists public.integrity_events (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references public.interviews(id) on delete cascade not null,
  event_type text not null check (event_type in ('tab_switch', 'window_blur', 'fullscreen_exit', 'paste_attempt')),
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.integrity_events enable row level security;

create policy "Users can view integrity events for own interviews" 
  on public.integrity_events for select 
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = integrity_events.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can insert integrity events for own interviews" 
  on public.integrity_events for insert 
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = integrity_events.interview_id
      and interviews.user_id = auth.uid()
    )
  );

