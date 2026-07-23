begin;

create table if not exists public.feature_catalog (
  key text primary key,
  label text not null,
  description text,
  scope_role text not null,
  is_active_globally boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_feature_defaults (
  profile_type text not null,
  feature_key text not null references public.feature_catalog(key) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (profile_type, feature_key)
);

create table if not exists public.user_feature_overrides (
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  feature_key text not null references public.feature_catalog(key) on delete cascade,
  is_enabled boolean not null,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature_key)
);

create or replace function public.sync_role_feature_default_on_catalog_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
  values (new.scope_role, new.key, true)
  on conflict (profile_type, feature_key) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_sync_role_feature_default_on_catalog_insert on public.feature_catalog;
create trigger trg_sync_role_feature_default_on_catalog_insert
after insert on public.feature_catalog
for each row execute function public.sync_role_feature_default_on_catalog_insert();

create index if not exists idx_feature_catalog_scope_role on public.feature_catalog(scope_role);
create index if not exists idx_user_feature_overrides_feature_key on public.user_feature_overrides(feature_key);

insert into public.feature_catalog (key, label, description, scope_role, is_active_globally)
values
  ('individual.about', 'Hakkında', 'Bireysel kullanıcı hakkında/özet modülü', 'bireysel', true),
  ('individual.service_requests', 'Hizmet Talepleri', 'Bireysel hizmet talepleri modülü', 'bireysel', true),
  ('individual.events', 'Etkinlikler', 'Bireysel etkinlikler modülü', 'bireysel', true),
  ('individual.follows', 'Takipler', 'Bireysel takip edilenler modülü', 'bireysel', true),
  ('individual.whatsapp', 'WhatsApp', 'Bireysel WhatsApp modülü', 'bireysel', true),
  ('individual.messages', 'Mesajlar', 'Bireysel mesajlar modülü', 'bireysel', true),
  ('individual.activity', 'Aktivite', 'Bireysel aktivite akışı modülü', 'bireysel', true),
  ('individual.cv_request', 'CV Talebi', 'Bireysel CV talebi modülü', 'bireysel', true)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  is_active_globally = excluded.is_active_globally,
  updated_at = now();

insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
select 'bireysel', fc.key, true
from public.feature_catalog fc
where fc.scope_role = 'bireysel'
on conflict (profile_type, feature_key) do update
set is_enabled = excluded.is_enabled;

alter table public.feature_catalog enable row level security;
alter table public.role_feature_defaults enable row level security;
alter table public.user_feature_overrides enable row level security;

drop policy if exists "feature_catalog_select_authenticated" on public.feature_catalog;
create policy "feature_catalog_select_authenticated"
on public.feature_catalog
for select
to authenticated
using (true);

drop policy if exists "role_feature_defaults_select_authenticated" on public.role_feature_defaults;
create policy "role_feature_defaults_select_authenticated"
on public.role_feature_defaults
for select
to authenticated
using (true);

drop policy if exists "user_feature_overrides_select_self_or_admin" on public.user_feature_overrides;
create policy "user_feature_overrides_select_self_or_admin"
on public.user_feature_overrides
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

revoke all on public.feature_catalog from authenticated;
revoke all on public.role_feature_defaults from authenticated;
revoke all on public.user_feature_overrides from authenticated;

grant select on public.feature_catalog to authenticated;
grant select on public.role_feature_defaults to authenticated;
grant select on public.user_feature_overrides to authenticated;

create or replace function public.admin_set_user_feature_override(
  target_user_id uuid,
  feature_key text,
  is_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope_role text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required'
      using errcode = '22023';
  end if;

  if feature_key is null or btrim(feature_key) = '' then
    raise exception 'feature key is required'
      using errcode = '22023';
  end if;

  select fc.scope_role
  into v_scope_role
  from public.feature_catalog fc
  where fc.key = feature_key;

  if v_scope_role is null then
    raise exception 'invalid feature key'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.user_profiles up
    where up.user_id = target_user_id
      and up.profile_type = v_scope_role
  ) then
    raise exception 'user profile not found for feature scope'
      using errcode = 'P0002';
  end if;

  insert into public.user_feature_overrides (user_id, feature_key, is_enabled, updated_by, updated_at)
  values (target_user_id, feature_key, is_enabled, auth.uid(), now())
  on conflict (user_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    updated_at = now();
end;
$$;

create or replace function public.admin_clear_user_feature_override(
  target_user_id uuid,
  feature_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required'
      using errcode = '22023';
  end if;

  if feature_key is null or btrim(feature_key) = '' then
    raise exception 'feature key is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.feature_catalog fc
    where fc.key = feature_key
  ) then
    raise exception 'invalid feature key'
      using errcode = '22023';
  end if;

  delete from public.user_feature_overrides ufo
  where ufo.user_id = target_user_id
    and ufo.feature_key = feature_key;
end;
$$;

create or replace function public.get_current_user_features()
returns table(feature_key text, is_enabled boolean, source text)
language sql
security definer
set search_path = public
as $$
  with current_user_profile as (
    select coalesce(
      (
        select up.profile_type
        from public.user_profiles up
        where up.user_id = auth.uid()
      ),
      'bireysel'
    ) as profile_type
  )
  select
    fc.key as feature_key,
    (
      fc.is_active_globally
      and coalesce(ufo.is_enabled, rfd.is_enabled, false)
    ) as is_enabled,
    case
      when ufo.user_id is not null then 'override'
      when rfd.profile_type is not null then 'role_default'
      else 'fallback'
    end as source
  from public.feature_catalog fc
  join current_user_profile cup
    on cup.profile_type = fc.scope_role
  left join public.role_feature_defaults rfd
    on rfd.profile_type = cup.profile_type
   and rfd.feature_key = fc.key
  left join public.user_feature_overrides ufo
    on ufo.user_id = auth.uid()
   and ufo.feature_key = fc.key
  order by fc.key;
$$;

grant execute on function public.admin_set_user_feature_override(uuid, text, boolean) to authenticated;
grant execute on function public.admin_clear_user_feature_override(uuid, text) to authenticated;
grant execute on function public.get_current_user_features() to authenticated;

commit;
