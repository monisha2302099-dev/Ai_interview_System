create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, updated_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_auth_user_profile() from public, anon, authenticated;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.sync_auth_user_profile();

create trigger on_auth_user_updated_profile
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_auth_user_profile();

insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();
