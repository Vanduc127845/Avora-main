-- Avora free MVP schema for Supabase Free or local Supabase.
-- Run this in the Supabase SQL editor before connecting the app to real data.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  provider text default 'email',
  disability_profile jsonb not null default '{
    "primaryType": null,
    "secondaryTypes": [],
    "severity": null,
    "accommodations": [],
    "onsetAge": null,
    "disclosureLevel": "private"
  }',
  accessibility_settings jsonb not null default '{
    "fontSize": 100,
    "highContrast": false,
    "reducedMotion": false,
    "voiceNavigation": false,
    "keyboardOnly": false,
    "screenReaderOptimized": false,
    "extraTime": false,
    "preferredInput": "text"
  }',
  career_profile jsonb not null default '{
    "interests": [],
    "skills": [],
    "values": [],
    "workPreferences": {
      "remote": "flexible",
      "schedule": "flexible",
      "environment": [],
      "commuteTolerance": 30
    },
    "targetRoles": [],
    "experienceLevel": "entry"
  }',
  privacy_settings jsonb not null default '{
    "shareProfile": false,
    "shareProgress": false,
    "anonymousAnalytics": true
  }',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null,
  type text not null default 'full-time',
  salary_range text,
  description text not null,
  requirements jsonb not null default '[]',
  benefits jsonb not null default '[]',
  accessibility_features jsonb not null default '[]',
  accessibility_score integer not null default 0 check (accessibility_score between 0 and 100),
  source_url text,
  posted_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

drop policy if exists "jobs_select_authenticated" on public.jobs;
create policy "jobs_select_authenticated"
on public.jobs for select
to authenticated
using (true);

create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.saved_jobs enable row level security;

drop policy if exists "saved_jobs_own" on public.saved_jobs;
create policy "saved_jobs_own"
on public.saved_jobs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  current_step integer not null default 0,
  total_steps integer not null default 5,
  result jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function public.set_updated_at();

alter table public.assessments enable row level security;

drop policy if exists "assessments_own" on public.assessments;
create policy "assessments_own"
on public.assessments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.assessment_messages (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  extracted_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.assessment_messages enable row level security;

drop policy if exists "assessment_messages_own" on public.assessment_messages;
create policy "assessment_messages_own"
on public.assessment_messages for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_job_id uuid references public.jobs(id) on delete set null,
  title text not null,
  description text,
  target_role text not null,
  phases jsonb not null default '[]',
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists roadmaps_set_updated_at on public.roadmaps;
create trigger roadmaps_set_updated_at
before update on public.roadmaps
for each row execute function public.set_updated_at();

alter table public.roadmaps enable row level security;

drop policy if exists "roadmaps_own" on public.roadmaps;
create policy "roadmaps_own"
on public.roadmaps for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.interview_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in-progress',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists interview_sessions_set_updated_at on public.interview_sessions;
create trigger interview_sessions_set_updated_at
before update on public.interview_sessions
for each row execute function public.set_updated_at();

alter table public.interview_sessions enable row level security;

drop policy if exists "interview_sessions_own" on public.interview_sessions;
create policy "interview_sessions_own"
on public.interview_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.agent_memories (
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  summary text not null default '',
  facts jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, agent_id)
);

drop trigger if exists agent_memories_set_updated_at on public.agent_memories;
create trigger agent_memories_set_updated_at
before update on public.agent_memories
for each row execute function public.set_updated_at();

alter table public.agent_memories enable row level security;

drop policy if exists "agent_memories_own" on public.agent_memories;
create policy "agent_memories_own"
on public.agent_memories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.jobs (
  title,
  company,
  location,
  type,
  salary_range,
  description,
  requirements,
  benefits,
  accessibility_features,
  accessibility_score,
  source_url
) values
(
  'Junior Frontend Developer',
  'Inclusive Web Studio',
  'Remote',
  'full-time',
  '$55,000 - $75,000',
  'Build accessible React interfaces, fix UI issues, and collaborate with designers and backend engineers.',
  '["Basic React", "HTML and CSS", "Git", "Interest in accessibility"]',
  '["Remote work", "Flexible hours", "Mentorship", "Health insurance"]',
  '["Remote-first", "Flexible schedule", "Screen reader testing", "Async communication"]',
  92,
  'https://example.com/jobs/frontend'
),
(
  'Data Analyst Assistant',
  'Care Insights Lab',
  'Hybrid',
  'part-time',
  '$35 - $45/hour',
  'Clean spreadsheets, prepare simple dashboards, and summarize trends for nonprofit programs.',
  '["Excel or Google Sheets", "Basic SQL", "Attention to detail"]',
  '["Part-time schedule", "Quiet workspace", "Training budget"]',
  '["Hybrid option", "Extra time for tasks", "Written instructions", "Quiet workspace"]',
  86,
  'https://example.com/jobs/data-analyst'
),
(
  'Customer Support Specialist',
  'AccessHelp',
  'Remote',
  'full-time',
  '$42,000 - $58,000',
  'Help customers by email and chat, document issues, and work with product teams to improve accessibility.',
  '["Clear writing", "Problem solving", "Customer empathy"]',
  '["Remote work", "No phone requirement", "Wellness days"]',
  '["Text-based support", "Remote work", "Flexible break schedule", "Assistive tech friendly"]',
  90,
  'https://example.com/jobs/support'
)
on conflict do nothing;

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
on all tables in schema public
to authenticated, service_role;

grant usage, select
on all sequences in schema public
to authenticated, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables
to authenticated, service_role;

alter default privileges in schema public
grant usage, select on sequences
to authenticated, service_role;
