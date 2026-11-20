-- 11. INTEGRITY EVENTS & PROCTORING TABLE
alter table public.interviews add column if not exists mode text default 'proctored';
alter table public.interviews add column if not exists strikes int default 0;
alter table public.interviews add column if not exists auto_submit_reason text;
alter table public.interviews add column if not exists last_heartbeat_at timestamptz;
alter table public.interviews add column if not exists active_session_token text;
alter table public.interviews add column if not exists seed int;
alter table public.interviews add column if not exists question_started_at timestamptz;

alter table public.feedback add column if not exists authenticity_score int;
alter table public.feedback add column if not exists authenticity_reason text;
alter table public.feedback add column if not exists risk_score int;
alter table public.feedback add column if not exists top_risk_reasons jsonb;

create table if not exists public.integrity_events (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references public.interviews(id) on delete cascade not null,
  event_type text not null,
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
