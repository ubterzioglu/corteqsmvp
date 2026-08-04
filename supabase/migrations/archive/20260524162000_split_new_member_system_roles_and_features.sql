begin;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_role_assignments (
  user_id uuid primary key references public.user_profiles(user_id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_feature_flags (
  role_id uuid not null references public.roles(id) on delete cascade,
  feature_key text not null references public.feature_catalog(key) on delete cascade,
  is_enabled boolean not null default false,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role_id, feature_key)
);

create index if not exists idx_roles_key on public.roles(key);
create index if not exists idx_user_role_assignments_role_id on public.user_role_assignments(role_id);
create index if not exists idx_role_feature_flags_feature_key on public.role_feature_flags(feature_key);

insert into public.roles (key, label, description, sort_order)
values
  ('bireysel', 'Bireysel Kullanıcı', 'Bireysel login kullanıcı rolü', 10),
  ('danisman', 'Danışman', 'Danışman login kullanıcı rolü', 20),
  ('isletme', 'İşletme', 'İşletme login kullanıcı rolü', 30),
  ('kurulus-dernek', 'Kuruluş / Dernek', 'Kuruluş/dernek login kullanıcı rolü', 40),
  ('blogger-vlogger-youtuber', 'Blogger / Vlogger / YouTuber', 'İçerik üretici login kullanıcı rolü', 50),
  ('sehir-elcisi', 'Şehir Elçisi', 'Şehir elçisi login kullanıcı rolü', 60)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into public.user_role_assignments (user_id, role_id, updated_by)
select
  up.user_id,
  r.id,
  null
from public.user_profiles up
join public.roles r on r.key = up.profile_type
on conflict (user_id) do update
set
  role_id = excluded.role_id,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select
  r.id,
  rfd.feature_key,
  rfd.is_enabled,
  null
from public.role_feature_defaults rfd
join public.roles r on r.key = rfd.profile_type
on conflict (role_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_by = excluded.updated_by,
  updated_at = now();

create or replace function public.sync_user_role_assignment_from_profile_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  select r.id
  into v_role_id
  from public.roles r
  where r.key = new.profile_type
  limit 1;

  if v_role_id is null then
    return new;
  end if;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (new.user_id, v_role_id, null)
  on conflict (user_id) do update
  set
    role_id = excluded.role_id,
    updated_by = excluded.updated_by,
    updated_at = now()
  where public.user_role_assignments.role_id is distinct from excluded.role_id;

  return new;
end;
$$;

create or replace function public.sync_profile_type_from_user_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_key text;
begin
  select r.key
  into v_role_key
  from public.roles r
  where r.id = new.role_id
  limit 1;

  if v_role_key is null then
    return new;
  end if;

  update public.user_profiles up
  set
    profile_type = v_role_key,
    updated_at = now()
  where up.user_id = new.user_id
    and up.profile_type is distinct from v_role_key;

  return new;
end;
$$;

drop trigger if exists trg_sync_user_role_assignment_from_profile_type on public.user_profiles;
create trigger trg_sync_user_role_assignment_from_profile_type
after insert or update of profile_type on public.user_profiles
for each row execute function public.sync_user_role_assignment_from_profile_type();

drop trigger if exists trg_sync_profile_type_from_user_role_assignment on public.user_role_assignments;
create trigger trg_sync_profile_type_from_user_role_assignment
after insert or update of role_id on public.user_role_assignments
for each row execute function public.sync_profile_type_from_user_role_assignment();

alter table public.roles enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.role_feature_flags enable row level security;

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "user_role_assignments_select_self_or_admin" on public.user_role_assignments;
create policy "user_role_assignments_select_self_or_admin"
on public.user_role_assignments
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "role_feature_flags_select_authenticated" on public.role_feature_flags;
create policy "role_feature_flags_select_authenticated"
on public.role_feature_flags
for select
to authenticated
using (true);

revoke all on public.roles from authenticated;
revoke all on public.user_role_assignments from authenticated;
revoke all on public.role_feature_flags from authenticated;

grant select on public.roles to authenticated;
grant select on public.user_role_assignments to authenticated;
grant select on public.role_feature_flags to authenticated;

create or replace function public.admin_set_user_role(
  target_user_id uuid,
  role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required'
      using errcode = '22023';
  end if;

  if role_key is null or btrim(role_key) = '' then
    raise exception 'role key is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.user_profiles up
    where up.user_id = target_user_id
  ) then
    raise exception 'user profile not found'
      using errcode = 'P0002';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = admin_set_user_role.role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key'
      using errcode = '22023';
  end if;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (target_user_id, v_role_id, auth.uid())
  on conflict (user_id) do update
  set
    role_id = excluded.role_id,
    updated_by = excluded.updated_by,
    updated_at = now();
end;
$$;

create or replace function public.admin_set_role_feature_flag(
  role_key text,
  feature_key text,
  is_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if role_key is null or btrim(role_key) = '' then
    raise exception 'role key is required'
      using errcode = '22023';
  end if;

  if feature_key is null or btrim(feature_key) = '' then
    raise exception 'feature key is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.feature_catalog fc
    where fc.key = admin_set_role_feature_flag.feature_key
  ) then
    raise exception 'invalid feature key'
      using errcode = '22023';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = admin_set_role_feature_flag.role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key'
      using errcode = '22023';
  end if;

  insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
  values (v_role_id, feature_key, is_enabled, auth.uid())
  on conflict (role_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    updated_at = now();
end;
$$;

create or replace function public.get_current_user_features()
returns table(feature_key text, is_enabled boolean, source text)
language sql
security definer
set search_path = public
as $$
  with resolved_role as (
    select r.id as role_id, r.key as role_key
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
    limit 1
  ),
  fallback_profile_role as (
    select r.id as role_id, r.key as role_key
    from public.user_profiles up
    join public.roles r on r.key = up.profile_type
    where up.user_id = auth.uid()
      and not exists (select 1 from resolved_role)
    limit 1
  ),
  effective_role as (
    select * from resolved_role
    union all
    select * from fallback_profile_role
    limit 1
  )
  select
    fc.key as feature_key,
    (
      fc.is_active_globally
      and coalesce(ufo.is_enabled, rff.is_enabled, rfd.is_enabled, false)
    ) as is_enabled,
    case
      when ufo.user_id is not null then 'override'
      when rff.role_id is not null then 'role_default'
      when rfd.profile_type is not null then 'role_default'
      else 'fallback'
    end as source
  from public.feature_catalog fc
  join effective_role er
    on er.role_key = fc.scope_role
  left join public.role_feature_flags rff
    on rff.role_id = er.role_id
   and rff.feature_key = fc.key
  left join public.role_feature_defaults rfd
    on rfd.profile_type = er.role_key
   and rfd.feature_key = fc.key
  left join public.user_feature_overrides ufo
    on ufo.user_id = auth.uid()
   and ufo.feature_key = fc.key
  order by fc.key;
$$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_role_feature_flag(text, text, boolean) to authenticated;
grant execute on function public.get_current_user_features() to authenticated;

commit;
