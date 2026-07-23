begin;

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists city_id uuid,
  add column if not exists country_code text,
  add column if not exists platform_role text,
  add column if not exists directory_opt_in boolean not null default false;

alter table public.user_profiles
  add column if not exists avatar_url text;

update public.profiles p
set
  display_name = coalesce(
    nullif(p.display_name, ''),
    nullif(p.full_name, ''),
    nullif(up.full_name, ''),
    split_part(coalesce(p.email, up.email, 'corteqs-uye'), '@', 1)
  ),
  avatar_url = coalesce(nullif(p.avatar_url, ''), nullif(up.avatar_url, '')),
  email = coalesce(nullif(p.email, ''), nullif(up.email, '')),
  country_code = coalesce(nullif(p.country_code, ''), nullif((u.raw_user_meta_data ->> 'country_code'), '')),
  platform_role = coalesce(nullif(p.platform_role, ''), 'user')
from public.user_profiles up
left join auth.users u on u.id = up.user_id
where up.user_id = p.id;

update public.profiles p
set
  display_name = coalesce(
    nullif(p.display_name, ''),
    nullif(p.full_name, ''),
    split_part(coalesce(p.email, 'corteqs-uye'), '@', 1)
  ),
  platform_role = coalesce(nullif(p.platform_role, ''), 'user')
where p.display_name is null
   or btrim(p.display_name) = ''
   or p.platform_role is null
   or btrim(p.platform_role) = '';

update public.profiles p
set platform_role = 'admin'
where exists (
  select 1
  from public.admin_users au
  where au.user_id = p.id
);

alter table public.profiles
  alter column platform_role set default 'user';

alter table public.profiles
  alter column platform_role set not null;

alter table public.profiles
  drop constraint if exists profiles_platform_role_check;

alter table public.profiles
  add constraint profiles_platform_role_check
  check (platform_role in ('user', 'moderator', 'admin'));

comment on column public.profiles.platform_role is
  'Platform-wide authorization role. Record-level authorization is handled by catalog_item_memberships.';

comment on column public.profiles.directory_opt_in is
  'Controls whether an authenticated person profile may be indexed into the public catalog.';

create index if not exists idx_profiles_platform_role on public.profiles(platform_role);
create index if not exists idx_profiles_directory_opt_in on public.profiles(directory_opt_in);
create index if not exists idx_profiles_country_code on public.profiles(country_code);

create or replace function public.catalog_resolve_directory_opt_in(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with base_profile as (
    select up.profile_type
    from public.user_profiles up
    where up.user_id = p_user_id
    limit 1
  )
  select coalesce(
    (
      select ufo.is_enabled
      from public.user_feature_overrides ufo
      where ufo.user_id = p_user_id
        and ufo.feature_key = 'directory.visible'
      limit 1
    ),
    (
      select rff.is_enabled
      from public.user_role_assignments ura
      join public.role_feature_flags rff
        on rff.role_id = ura.role_id
       and rff.feature_key = 'directory.visible'
      where ura.user_id = p_user_id
      limit 1
    ),
    (
      select rfd.is_enabled
      from base_profile bp
      join public.role_feature_defaults rfd
        on rfd.profile_type = bp.profile_type
       and rfd.feature_key = 'directory.visible'
      limit 1
    ),
    false
  );
$$;

update public.profiles p
set directory_opt_in = public.catalog_resolve_directory_opt_in(p.id)
where coalesce(p.directory_opt_in, false) is distinct from public.catalog_resolve_directory_opt_in(p.id);

create or replace function public.upsert_profile_from_auth_identity(
  p_user_id uuid,
  p_email text,
  p_raw_user_meta_data jsonb default '{}'::jsonb,
  p_raw_app_meta_data jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url text;
  v_country_code text;
  v_profile public.profiles%rowtype;
begin
  if p_user_id is null then
    raise exception 'user id is required' using errcode = '22023';
  end if;

  v_display_name := nullif(
    btrim(
      coalesce(
        p_raw_user_meta_data ->> 'display_name',
        p_raw_user_meta_data ->> 'full_name',
        p_raw_user_meta_data ->> 'name',
        split_part(coalesce(p_email, 'corteqs-uye'), '@', 1)
      )
    ),
    ''
  );

  v_avatar_url := nullif(
    btrim(
      coalesce(
        p_raw_user_meta_data ->> 'avatar_url',
        p_raw_user_meta_data ->> 'picture'
      )
    ),
    ''
  );

  v_country_code := nullif(
    btrim(
      coalesce(
        p_raw_user_meta_data ->> 'country_code',
        p_raw_app_meta_data ->> 'country_code'
      )
    ),
    ''
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    country_code,
    platform_role,
    directory_opt_in
  )
  values (
    p_user_id,
    p_email,
    v_display_name,
    v_display_name,
    v_avatar_url,
    v_country_code,
    'user',
    false
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name, public.profiles.full_name),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
    country_code = coalesce(nullif(excluded.country_code, ''), public.profiles.country_code),
    updated_at = now()
  returning * into v_profile;

  if to_regclass('public.user_profiles') is not null then
    insert into public.user_profiles (
      user_id,
      email,
      full_name,
      profile_type,
      auth_provider,
      avatar_url
    )
    values (
      p_user_id,
      p_email,
      v_profile.display_name,
      'bireysel',
      coalesce(nullif(p_raw_app_meta_data ->> 'provider', ''), 'unknown'),
      v_profile.avatar_url
    )
    on conflict (user_id) do update
    set
      email = coalesce(excluded.email, public.user_profiles.email),
      full_name = coalesce(nullif(excluded.full_name, ''), public.user_profiles.full_name),
      auth_provider = coalesce(nullif(excluded.auth_provider, ''), public.user_profiles.auth_provider),
      avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.user_profiles.avatar_url),
      updated_at = now();
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id;

  return v_profile;
end;
$$;

comment on function public.upsert_profile_from_auth_identity(uuid, text, jsonb, jsonb) is
  'Canonical helper for creating or refreshing public.profiles from auth identity data. Safe to call from triggers and smoke tests.';

create or replace function public.handle_auth_user_catalog_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.upsert_profile_from_auth_identity(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data, '{}'::jsonb),
    coalesce(new.raw_app_meta_data, '{}'::jsonb)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_profile on auth.users;
drop trigger if exists on_auth_user_created_user_profile_v2 on auth.users;
drop trigger if exists on_auth_user_created_catalog_profile on auth.users;

create trigger on_auth_user_created_catalog_profile
after insert on auth.users
for each row execute function public.handle_auth_user_catalog_profile();

drop trigger if exists on_auth_user_updated_catalog_profile on auth.users;
create trigger on_auth_user_updated_catalog_profile
after update of email, raw_user_meta_data, raw_app_meta_data on auth.users
for each row execute function public.handle_auth_user_catalog_profile();

create or replace function public.sync_user_profile_compat_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.user_profiles') is null then
    return new;
  end if;

  insert into public.user_profiles (
    user_id,
    email,
    full_name,
    profile_type,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(new.display_name, ''), nullif(new.full_name, ''), split_part(coalesce(new.email, 'corteqs-uye'), '@', 1)),
    coalesce((select up.profile_type from public.user_profiles up where up.user_id = new.id), 'bireysel'),
    new.avatar_url
  )
  on conflict (user_id) do update
  set
    email = coalesce(excluded.email, public.user_profiles.email),
    full_name = coalesce(nullif(excluded.full_name, ''), public.user_profiles.full_name),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.user_profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_user_profile_compat_from_profile on public.profiles;
create trigger trg_sync_user_profile_compat_from_profile
after insert or update of email, full_name, display_name, avatar_url on public.profiles
for each row execute function public.sync_user_profile_compat_from_profile();

update public.user_profiles up
set
  email = coalesce(p.email, up.email),
  full_name = coalesce(nullif(p.display_name, ''), nullif(p.full_name, ''), up.full_name),
  avatar_url = coalesce(nullif(p.avatar_url, ''), up.avatar_url),
  updated_at = now()
from public.profiles p
where p.id = up.user_id
  and (
    coalesce(up.email, '') is distinct from coalesce(p.email, '')
    or coalesce(up.full_name, '') is distinct from coalesce(coalesce(nullif(p.display_name, ''), nullif(p.full_name, '')), '')
    or coalesce(up.avatar_url, '') is distinct from coalesce(p.avatar_url, '')
  );

create or replace function public.catalog_sync_profile_directory_opt_in(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opt_in boolean;
begin
  if p_user_id is null then
    return;
  end if;

  v_opt_in := public.catalog_resolve_directory_opt_in(p_user_id);

  update public.profiles
  set
    directory_opt_in = v_opt_in,
    updated_at = now()
  where id = p_user_id
    and coalesce(directory_opt_in, false) is distinct from v_opt_in;
end;
$$;

create or replace function public.catalog_sync_directory_opt_in_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);

  if tg_table_name = 'user_feature_overrides'
     and coalesce(new.feature_key, old.feature_key) <> 'directory.visible' then
    return coalesce(new, old);
  end if;

  perform public.catalog_sync_profile_directory_opt_in(v_user_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_catalog_sync_directory_opt_in_from_overrides on public.user_feature_overrides;
create trigger trg_catalog_sync_directory_opt_in_from_overrides
after insert or update or delete on public.user_feature_overrides
for each row execute function public.catalog_sync_directory_opt_in_trigger();

drop trigger if exists trg_catalog_sync_directory_opt_in_from_roles on public.user_role_assignments;
create trigger trg_catalog_sync_directory_opt_in_from_roles
after insert or update or delete on public.user_role_assignments
for each row execute function public.catalog_sync_directory_opt_in_trigger();

drop trigger if exists trg_catalog_sync_directory_opt_in_from_profile_type on public.user_profiles;
create trigger trg_catalog_sync_directory_opt_in_from_profile_type
after update of profile_type on public.user_profiles
for each row execute function public.catalog_sync_directory_opt_in_trigger();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.platform_role = 'admin'
  )
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = uid
  );
$$;

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.platform_role in ('moderator', 'admin')
  )
  or public.is_admin(uid);
$$;

comment on function public.is_admin(uuid) is
  'Checks the canonical profiles.platform_role first and falls back to legacy admin_users during migration.';

comment on function public.is_moderator(uuid) is
  'Returns true for moderators and admins.';

commit;
