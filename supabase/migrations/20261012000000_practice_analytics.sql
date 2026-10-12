create table public.practice_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  active_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, active_on)
);

create table public.practice_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('technical', 'general')),
  score integer not null check (score between 0 and 100),
  created_at timestamptz not null default now()
);

create index practice_scores_user_created_idx
  on public.practice_scores (user_id, created_at desc);

alter table public.practice_activity enable row level security;
alter table public.practice_scores enable row level security;

grant select, insert on public.practice_activity to authenticated;
grant select, insert on public.practice_scores to authenticated;

create policy "Users can read their own practice activity"
  on public.practice_activity
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can record their own practice activity"
  on public.practice_activity
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can read their own practice scores"
  on public.practice_scores
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can record their own practice scores"
  on public.practice_scores
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
