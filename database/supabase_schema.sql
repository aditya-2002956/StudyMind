create table if not exists public.studymind_profiles (
  user_id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.studymind_quizzes (
  id text primary key,
  user_id text not null,
  subject text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists studymind_quizzes_user_id_idx
  on public.studymind_quizzes (user_id);

create table if not exists public.studymind_attempts (
  attempt_id text primary key,
  user_id text not null,
  quiz_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists studymind_attempts_user_id_idx
  on public.studymind_attempts (user_id);

create table if not exists public.studymind_revisions (
  id text primary key,
  user_id text not null,
  subject text not null,
  topic text not null,
  due_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, subject, topic)
);

create index if not exists studymind_revisions_user_id_due_date_idx
  on public.studymind_revisions (user_id, due_date);

alter table public.studymind_profiles enable row level security;
alter table public.studymind_quizzes enable row level security;
alter table public.studymind_attempts enable row level security;
alter table public.studymind_revisions enable row level security;

drop policy if exists "studymind_profiles_hackathon_access" on public.studymind_profiles;
drop policy if exists "studymind_quizzes_hackathon_access" on public.studymind_quizzes;
drop policy if exists "studymind_attempts_hackathon_access" on public.studymind_attempts;
drop policy if exists "studymind_revisions_hackathon_access" on public.studymind_revisions;

create policy "studymind_profiles_hackathon_access"
  on public.studymind_profiles
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "studymind_quizzes_hackathon_access"
  on public.studymind_quizzes
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "studymind_attempts_hackathon_access"
  on public.studymind_attempts
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "studymind_revisions_hackathon_access"
  on public.studymind_revisions
  for all
  to anon, authenticated
  using (true)
  with check (true);
