begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  profile_type text not null default 'bireysel'
    check (profile_type in ('bireysel', 'danisman', 'isletme', 'kurulus-dernek', 'blogger-vlogger-youtuber', 'sehir-elcisi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_profile_type on public.user_profiles(profile_type);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_auth_user_profile_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, profile_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'bireysel'
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_profile_v2 on auth.users;
create trigger on_auth_user_created_user_profile_v2
after insert on auth.users
for each row execute function public.handle_auth_user_profile_v2();

insert into public.user_profiles (user_id, email, full_name, profile_type)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name') as full_name,
  'bireysel' as profile_type
from auth.users u
on conflict (user_id) do nothing;

do $$
begin
  if to_regclass('public.profiles') is not null then
    update public.user_profiles up
    set profile_type = p.profile_type
    from public.profiles p
    where p.id = up.user_id
      and p.profile_type in ('bireysel', 'danisman', 'isletme', 'kurulus-dernek', 'blogger-vlogger-youtuber', 'sehir-elcisi');
  end if;
end $$;

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_self_select" on public.user_profiles;
create policy "user_profiles_self_select"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_profiles_self_insert" on public.user_profiles;
create policy "user_profiles_self_insert"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_profiles_self_update" on public.user_profiles;
create policy "user_profiles_self_update"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.user_profiles to authenticated;

commit;
