begin;

alter table public.user_profiles
  add column if not exists auth_provider text;

update public.user_profiles up
set auth_provider = coalesce(u.raw_app_meta_data ->> 'provider', up.auth_provider, 'unknown')
from auth.users u
where u.id = up.user_id
  and (
    up.auth_provider is null
    or up.auth_provider = ''
    or up.auth_provider = 'unknown'
  );

create or replace function public.handle_auth_user_profile_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, profile_type, auth_provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'bireysel',
    coalesce(new.raw_app_meta_data ->> 'provider', 'unknown')
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    auth_provider = coalesce(excluded.auth_provider, public.user_profiles.auth_provider),
    updated_at = now();

  return new;
end;
$$;

drop policy if exists "user_profiles_admin_select_all" on public.user_profiles;
create policy "user_profiles_admin_select_all"
on public.user_profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

commit;
