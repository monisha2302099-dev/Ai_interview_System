create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'ai')),
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index interview_sessions_user_updated_idx
  on public.interview_sessions (user_id, updated_at desc);

create index interview_messages_session_created_idx
  on public.interview_messages (session_id, created_at);

grant select, insert, update, delete
  on public.interview_sessions
  to authenticated;

grant select, insert
  on public.interview_messages
  to authenticated;

alter table public.interview_sessions enable row level security;
alter table public.interview_messages enable row level security;

create policy "Users can read their own interview sessions"
  on public.interview_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own interview sessions"
  on public.interview_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own interview sessions"
  on public.interview_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own interview sessions"
  on public.interview_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read messages in their own interview sessions"
  on public.interview_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_messages.session_id
        and interview_sessions.user_id = (select auth.uid())
    )
  );

create policy "Users can add messages to their own interview sessions"
  on public.interview_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_messages.session_id
        and interview_sessions.user_id = (select auth.uid())
    )
  );
