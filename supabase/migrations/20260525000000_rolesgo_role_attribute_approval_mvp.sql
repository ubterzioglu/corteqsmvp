begin;

alter table public.user_feature_overrides
  add column if not exists reason text;

create table if not exists public.attribute_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  data_type text not null check (data_type in ('text','textarea','select','multi_select','url','phone','boolean','json')),
  is_active boolean not null default true,
  is_system boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_attribute_rules (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  attribute_id uuid not null references public.attribute_catalog(id) on delete cascade,
  is_enabled boolean not null default true,
  is_required boolean not null default false,
  is_public_default boolean not null default false,
  user_can_edit boolean not null default true,
  user_can_hide boolean not null default true,
  requires_admin_approval_on_change boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, attribute_id)
);

create table if not exists public.user_profile_attributes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  attribute_id uuid not null references public.attribute_catalog(id) on delete cascade,
  value_text text,
  value_json jsonb,
  visibility text not null default 'private' check (visibility in ('public','private','admin_only')),
  approval_status text not null default 'approved' check (approval_status in ('draft','pending','approved','rejected')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, attribute_id),
  constraint user_profile_attributes_value_check check (
    value_text is not null
    or value_json is not null
  )
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('role_change','directory_visibility','contact_visibility','featured_listing','event_create','offer_create','referral_create','attribute_change','city_manage')),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  target_role_key text,
  target_feature_key text references public.feature_catalog(key) on delete set null,
  target_entity_type text,
  target_entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.approval_requests
  add column if not exists target_role_key text,
  add column if not exists target_feature_key text,
  add column if not exists target_entity_type text,
  add column if not exists target_entity_id uuid,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz;

alter table public.approval_requests
  alter column payload set default '{}'::jsonb,
  alter column status set default 'pending',
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'approval_requests_target_feature_key_fkey'
      and conrelid = 'public.approval_requests'::regclass
  ) then
    alter table public.approval_requests
      add constraint approval_requests_target_feature_key_fkey
      foreign key (target_feature_key)
      references public.feature_catalog(key)
      on delete set null;
  end if;
end $$;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  target_user_id uuid,
  target_entity_type text,
  target_entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attribute_catalog_key on public.attribute_catalog(key);
create index if not exists idx_role_attribute_rules_role_id on public.role_attribute_rules(role_id);
create index if not exists idx_role_attribute_rules_attribute_id on public.role_attribute_rules(attribute_id);
create index if not exists idx_user_profile_attributes_user_id on public.user_profile_attributes(user_id);
create index if not exists idx_user_profile_attributes_attribute_id on public.user_profile_attributes(attribute_id);
create index if not exists idx_approval_requests_user_status on public.approval_requests(user_id, status);
create index if not exists idx_approval_requests_type_status on public.approval_requests(request_type, status);
create index if not exists idx_approval_requests_created_at on public.approval_requests(created_at desc);
create index if not exists idx_admin_audit_logs_actor_created on public.admin_audit_logs(actor_user_id, created_at desc);
create index if not exists idx_admin_audit_logs_target_user_created on public.admin_audit_logs(target_user_id, created_at desc);
create index if not exists idx_admin_audit_logs_action_created on public.admin_audit_logs(action, created_at desc);
create unique index if not exists idx_approval_requests_pending_unique
  on public.approval_requests (
    user_id,
    request_type,
    coalesce(target_role_key, ''),
    coalesce(target_feature_key, ''),
    coalesce(target_entity_type, ''),
    coalesce(target_entity_id::text, '')
  )
  where status = 'pending';

insert into public.attribute_catalog (key, label, description, data_type, is_active, is_system, sort_order)
values
  ('full_name', 'Gorunen Isim', 'Profilin gorunen ismi', 'text', true, true, 10),
  ('country', 'Ulke', 'Profilin ulkesi', 'text', true, true, 20),
  ('city', 'Sehir', 'Profilin sehri', 'text', true, true, 30),
  ('profile_photo_url', 'Profil Gorseli', 'Profil veya logo gorseli', 'url', true, true, 40),
  ('bio_short', 'Kisa Aciklama', 'Kisa profil aciklamasi', 'textarea', true, true, 50),
  ('interests', 'Ilgi Alanlari', 'Bireysel kullanicinin ilgi alanlari', 'textarea', true, false, 110),
  ('expertise_area', 'Uzmanlik Alani', 'Consultant ana uzmanlik alani', 'text', true, false, 120),
  ('business_category', 'Isletme Kategorisi', 'Isletmenin faaliyet kategorisi', 'text', true, false, 130),
  ('organization_type', 'Kurulus Turu', 'Kurulus tipi', 'text', true, false, 140),
  ('main_platform', 'Ana Platform', 'Influencer ana platformu', 'text', true, false, 150),
  ('ambassador_city', 'Sorumlu Sehir', 'Elcinin sorumlu oldugu sehir', 'text', true, false, 160)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  sort_order = excluded.sort_order,
  updated_at = now();

with role_meta as (
  select * from (
    values
      ('bireysel', 'interests', 100),
      ('danisman', 'expertise_area', 110),
      ('isletme', 'business_category', 120),
      ('kurulus-dernek', 'organization_type', 130),
      ('blogger-vlogger-youtuber', 'main_platform', 140),
      ('sehir-elcisi', 'ambassador_city', 150)
  ) as t(role_key, default_attribute_key, special_sort_order)
),
common_attributes as (
  select ac.id as attribute_id, ac.key, ac.sort_order
  from public.attribute_catalog ac
  where ac.key in ('full_name', 'country', 'city', 'profile_photo_url', 'bio_short')
),
special_attributes as (
  select ac.id as attribute_id, ac.key, rm.role_key, rm.special_sort_order
  from public.attribute_catalog ac
  join role_meta rm on rm.default_attribute_key = ac.key
),
common_rules as (
  select
    r.id as role_id,
    ca.attribute_id,
    true as is_enabled,
    (ca.key = 'full_name') as is_required,
    true as is_public_default,
    true as user_can_edit,
    (ca.key <> 'full_name') as user_can_hide,
    false as requires_admin_approval_on_change,
    ca.sort_order as sort_order
  from public.roles r
  cross join common_attributes ca
),
special_rules as (
  select
    r.id as role_id,
    sa.attribute_id,
    true as is_enabled,
    false as is_required,
    true as is_public_default,
    true as user_can_edit,
    true as user_can_hide,
    false as requires_admin_approval_on_change,
    sa.special_sort_order as sort_order
  from public.roles r
  join special_attributes sa on sa.role_key = r.key
)
insert into public.role_attribute_rules (
  role_id,
  attribute_id,
  is_enabled,
  is_required,
  is_public_default,
  user_can_edit,
  user_can_hide,
  requires_admin_approval_on_change,
  sort_order
)
select * from common_rules
union all
select * from special_rules
on conflict (role_id, attribute_id) do update
set
  is_enabled = excluded.is_enabled,
  is_required = excluded.is_required,
  is_public_default = excluded.is_public_default,
  user_can_edit = excluded.user_can_edit,
  user_can_hide = excluded.user_can_hide,
  requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.feature_catalog (key, label, description, scope_role, is_active_globally)
select feature_key, label, description, '*' as scope_role, global_enabled
from (
  values
    ('profile.view_own','Profilimi Goruntule','Kendi profilini goruntuleme', true),
    ('profile.edit_own','Profilimi Duzenle','Kendi profilini duzenleme', true),
    ('profile.edit_public','Public Profil Alanlari','Public alanlarini duzenleme', true),
    ('directory.visible','Directory Gorunurlugu','Public directory gorunurlugu', true),
    ('directory.featured','One Cikarilmis Profil','One cikarilmis listing', true),
    ('contact.receive','Iletisim Talebi Al','Iletisim talebi alma', true),
    ('contact.show_whatsapp','WhatsApp Goster','WhatsApp bilgisini gosterme', true),
    ('content.create','Icerik Olustur','Icerik/post olusturma', true),
    ('content.edit_own','Icerik Duzenle','Kendi icerigini duzenleme', true),
    ('events.create','Etkinlik Olustur','Etkinlik olusturma', true),
    ('offers.create','Teklif Olustur','Hizmet/teklif olusturma', true),
    ('referral.create','Referral Olustur','Referral olusturma', true),
    ('city.manage','Sehir Yonetimi','Sehir bazli yonetim', false),
    ('admin.requires_approval','Admin Onayi Gerektirir','Islem admin onayina tabi', true)
) as seeds(feature_key, label, description, global_enabled)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  is_active_globally = excluded.is_active_globally,
  updated_at = now();

with seeded_flags as (
  select * from (
    values
      ('bireysel','profile.view_own', true),
      ('bireysel','profile.edit_own', true),
      ('bireysel','profile.edit_public', true),
      ('bireysel','directory.visible', false),
      ('bireysel','directory.featured', false),
      ('bireysel','contact.receive', true),
      ('bireysel','contact.show_whatsapp', false),
      ('bireysel','content.create', true),
      ('bireysel','content.edit_own', true),
      ('bireysel','events.create', false),
      ('bireysel','offers.create', false),
      ('bireysel','referral.create', true),
      ('bireysel','city.manage', false),
      ('bireysel','admin.requires_approval', true),
      ('danisman','profile.view_own', true),
      ('danisman','profile.edit_own', true),
      ('danisman','profile.edit_public', true),
      ('danisman','directory.visible', false),
      ('danisman','directory.featured', false),
      ('danisman','contact.receive', true),
      ('danisman','contact.show_whatsapp', false),
      ('danisman','content.create', true),
      ('danisman','content.edit_own', true),
      ('danisman','events.create', false),
      ('danisman','offers.create', false),
      ('danisman','referral.create', false),
      ('danisman','city.manage', false),
      ('danisman','admin.requires_approval', true),
      ('isletme','profile.view_own', true),
      ('isletme','profile.edit_own', true),
      ('isletme','profile.edit_public', true),
      ('isletme','directory.visible', false),
      ('isletme','directory.featured', false),
      ('isletme','contact.receive', true),
      ('isletme','contact.show_whatsapp', false),
      ('isletme','content.create', true),
      ('isletme','content.edit_own', true),
      ('isletme','events.create', false),
      ('isletme','offers.create', false),
      ('isletme','referral.create', false),
      ('isletme','city.manage', false),
      ('isletme','admin.requires_approval', true),
      ('kurulus-dernek','profile.view_own', true),
      ('kurulus-dernek','profile.edit_own', true),
      ('kurulus-dernek','profile.edit_public', true),
      ('kurulus-dernek','directory.visible', false),
      ('kurulus-dernek','directory.featured', false),
      ('kurulus-dernek','contact.receive', true),
      ('kurulus-dernek','contact.show_whatsapp', false),
      ('kurulus-dernek','content.create', true),
      ('kurulus-dernek','content.edit_own', true),
      ('kurulus-dernek','events.create', false),
      ('kurulus-dernek','offers.create', false),
      ('kurulus-dernek','referral.create', false),
      ('kurulus-dernek','city.manage', false),
      ('kurulus-dernek','admin.requires_approval', true),
      ('blogger-vlogger-youtuber','profile.view_own', true),
      ('blogger-vlogger-youtuber','profile.edit_own', true),
      ('blogger-vlogger-youtuber','profile.edit_public', true),
      ('blogger-vlogger-youtuber','directory.visible', false),
      ('blogger-vlogger-youtuber','directory.featured', false),
      ('blogger-vlogger-youtuber','contact.receive', true),
      ('blogger-vlogger-youtuber','contact.show_whatsapp', false),
      ('blogger-vlogger-youtuber','content.create', true),
      ('blogger-vlogger-youtuber','content.edit_own', true),
      ('blogger-vlogger-youtuber','events.create', false),
      ('blogger-vlogger-youtuber','offers.create', false),
      ('blogger-vlogger-youtuber','referral.create', false),
      ('blogger-vlogger-youtuber','city.manage', false),
      ('blogger-vlogger-youtuber','admin.requires_approval', true),
      ('sehir-elcisi','profile.view_own', true),
      ('sehir-elcisi','profile.edit_own', true),
      ('sehir-elcisi','profile.edit_public', true),
      ('sehir-elcisi','directory.visible', false),
      ('sehir-elcisi','directory.featured', false),
      ('sehir-elcisi','contact.receive', true),
      ('sehir-elcisi','contact.show_whatsapp', false),
      ('sehir-elcisi','content.create', true),
      ('sehir-elcisi','content.edit_own', true),
      ('sehir-elcisi','events.create', false),
      ('sehir-elcisi','offers.create', false),
      ('sehir-elcisi','referral.create', false),
      ('sehir-elcisi','city.manage', false),
      ('sehir-elcisi','admin.requires_approval', true)
  ) as t(role_key, feature_key, is_enabled)
)
insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select r.id, sf.feature_key, sf.is_enabled, null
from seeded_flags sf
join public.roles r on r.key = sf.role_key
on conflict (role_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

alter table public.attribute_catalog enable row level security;
alter table public.role_attribute_rules enable row level security;
alter table public.user_profile_attributes enable row level security;
alter table public.approval_requests enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "attribute_catalog_select_authenticated" on public.attribute_catalog;
create policy "attribute_catalog_select_authenticated"
on public.attribute_catalog
for select
to authenticated
using (true);

drop policy if exists "role_attribute_rules_select_authenticated" on public.role_attribute_rules;
create policy "role_attribute_rules_select_authenticated"
on public.role_attribute_rules
for select
to authenticated
using (true);

drop policy if exists "user_profile_attributes_select_self_or_admin" on public.user_profile_attributes;
create policy "user_profile_attributes_select_self_or_admin"
on public.user_profile_attributes
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "approval_requests_select_self_or_admin" on public.approval_requests;
create policy "approval_requests_select_self_or_admin"
on public.approval_requests
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "admin_audit_logs_select_admin_only" on public.admin_audit_logs;
create policy "admin_audit_logs_select_admin_only"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin(auth.uid()));

revoke all on public.attribute_catalog from authenticated;
revoke all on public.role_attribute_rules from authenticated;
revoke all on public.user_profile_attributes from authenticated;
revoke all on public.approval_requests from authenticated;
revoke all on public.admin_audit_logs from authenticated;

grant select on public.attribute_catalog to authenticated;
grant select on public.role_attribute_rules to authenticated;
grant select on public.user_profile_attributes to authenticated;
grant select on public.approval_requests to authenticated;
grant select on public.admin_audit_logs to authenticated;

create or replace function public.write_admin_audit_log(
  p_action text,
  p_target_user_id uuid default null,
  p_target_entity_type text default null,
  p_target_entity_id uuid default null,
  p_before_value jsonb default null,
  p_after_value jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_audit_logs (
    actor_user_id,
    action,
    target_user_id,
    target_entity_type,
    target_entity_id,
    before_value,
    after_value
  )
  values (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_target_entity_type,
    p_target_entity_id,
    p_before_value,
    p_after_value
  );
end;
$$;

create or replace function public.resolve_approval_request_type(p_feature_key text)
returns text
language sql
immutable
as $$
  select case p_feature_key
    when 'directory.visible' then 'directory_visibility'
    when 'contact.show_whatsapp' then 'contact_visibility'
    when 'directory.featured' then 'featured_listing'
    when 'events.create' then 'event_create'
    when 'offers.create' then 'offer_create'
    when 'referral.create' then 'referral_create'
    when 'city.manage' then 'city_manage'
    else 'contact_visibility'
  end;
$$;

create or replace function public.get_current_user_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.user_profiles%rowtype;
  v_role_key text;
  v_role_label text;
  v_role_description text;
  v_role_slug text;
  v_features jsonb;
  v_attributes jsonb;
  v_pending jsonb;
  v_completion_total integer;
  v_completion_completed integer;
begin
  select *
  into v_user
  from public.user_profiles up
  where up.user_id = auth.uid()
  limit 1;

  if v_user.user_id is null then
    return '{}'::jsonb;
  end if;

  select r.key, r.label, r.description
  into v_role_key, v_role_label, v_role_description
  from public.roles r
  where r.key = v_user.profile_type
  limit 1;

  v_role_key := coalesce(v_role_key, v_user.profile_type);
  v_role_slug := case v_role_key
    when 'bireysel' then 'individual'
    when 'danisman' then 'consultant'
    when 'isletme' then 'business'
    when 'kurulus-dernek' then 'organization'
    when 'blogger-vlogger-youtuber' then 'influencer'
    when 'sehir-elcisi' then 'ambassador'
    else v_role_key
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'key', feature_key,
    'is_enabled', is_enabled,
    'source', source
  ) order by feature_key), '[]'::jsonb)
  into v_features
  from public.get_current_user_features();

  select coalesce(jsonb_agg(jsonb_build_object(
    'attribute_key', ac.key,
    'label', ac.label,
    'description', ac.description,
    'data_type', ac.data_type,
    'is_system', ac.is_system,
    'sort_order', rar.sort_order,
    'is_required', rar.is_required,
    'is_public_default', rar.is_public_default,
    'user_can_edit', rar.user_can_edit,
    'user_can_hide', rar.user_can_hide,
    'requires_admin_approval_on_change', rar.requires_admin_approval_on_change,
    'visibility', coalesce(
      upa.visibility,
      case when rar.is_public_default then 'public' else 'private' end
    ),
    'approval_status', coalesce(upa.approval_status, 'approved'),
    'value_text', case when ac.key = 'full_name' then coalesce(v_user.full_name, '') else upa.value_text end,
    'value_json', upa.value_json,
    'display_value', case
      when ac.key = 'full_name' then to_jsonb(coalesce(v_user.full_name, ''))
      when upa.value_json is not null then upa.value_json
      else to_jsonb(coalesce(upa.value_text, ''))
    end
  ) order by rar.sort_order, ac.label), '[]'::jsonb)
  into v_attributes
  from public.role_attribute_rules rar
  join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  join public.roles r on r.id = rar.role_id
  left join public.user_profile_attributes upa
    on upa.user_id = v_user.user_id
   and upa.attribute_id = ac.id
  where r.key = v_role_key
    and rar.is_enabled = true;

  select count(*) filter (where rar.is_required),
         count(*) filter (where rar.is_required and (
           (ac.key = 'full_name' and coalesce(v_user.full_name, '') <> '')
           or upa.value_text is not null
           or upa.value_json is not null
         ))
  into v_completion_total, v_completion_completed
  from public.role_attribute_rules rar
  join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  join public.roles r on r.id = rar.role_id
  left join public.user_profile_attributes upa
    on upa.user_id = v_user.user_id
   and upa.attribute_id = ac.id
   and upa.approval_status = 'approved'
  where r.key = v_role_key
    and rar.is_enabled = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ar.id,
    'request_type', ar.request_type,
    'status', ar.status,
    'target_role_key', ar.target_role_key,
    'target_feature_key', ar.target_feature_key,
    'target_entity_type', ar.target_entity_type,
    'created_at', ar.created_at,
    'admin_note', ar.admin_note,
    'payload', ar.payload
  ) order by ar.created_at desc), '[]'::jsonb)
  into v_pending
  from public.approval_requests ar
  where ar.user_id = v_user.user_id
    and ar.status = 'pending';

  return jsonb_build_object(
    'user_id', v_user.user_id,
    'email', v_user.email,
    'full_name', v_user.full_name,
    'profile_type', v_user.profile_type,
    'role_key', v_role_key,
    'role_label', coalesce(v_role_label, v_role_key),
    'role_description', v_role_description,
    'role_slug', v_role_slug,
    'features', coalesce(v_features, '[]'::jsonb),
    'attributes', coalesce(v_attributes, '[]'::jsonb),
    'pending_requests', coalesce(v_pending, '[]'::jsonb),
    'profile_completion', jsonb_build_object(
      'required_total', coalesce(v_completion_total, 0),
      'required_completed', coalesce(v_completion_completed, 0),
      'percentage', case
        when coalesce(v_completion_total, 0) = 0 then 100
        else floor((coalesce(v_completion_completed, 0)::numeric / v_completion_total::numeric) * 100)
      end
    )
  );
end;
$$;

create or replace function public.submit_role_change_request(target_role_key text, note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_current_role_key text;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_role_key is null or btrim(target_role_key) = '' then
    raise exception 'target role key is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.roles r where r.key = target_role_key and r.is_active = true) then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  select up.profile_type into v_current_role_key
  from public.user_profiles up
  where up.user_id = auth.uid();

  if v_current_role_key = target_role_key then
    raise exception 'user already has this role' using errcode = '22023';
  end if;

  insert into public.approval_requests (
    request_type,
    user_id,
    target_role_key,
    target_entity_type,
    payload,
    status
  ) values (
    'role_change',
    auth.uid(),
    target_role_key,
    'profile',
    jsonb_build_object('note', note),
    'pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.submit_feature_request(feature_key text, payload jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_scope_role text;
  v_request_type text;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select fc.scope_role into v_scope_role
  from public.feature_catalog fc
  join public.user_profiles up
    on up.user_id = auth.uid()
   and (fc.scope_role = '*' or up.profile_type = fc.scope_role)
  where fc.key = feature_key
  limit 1;

  if v_scope_role is null then
    raise exception 'invalid feature key for current role' using errcode = '22023';
  end if;

  v_request_type := public.resolve_approval_request_type(feature_key);

  insert into public.approval_requests (
    request_type,
    user_id,
    target_feature_key,
    target_entity_type,
    payload,
    status
  ) values (
    v_request_type,
    auth.uid(),
    feature_key,
    'feature',
    coalesce(payload, '{}'::jsonb),
    'pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.update_profile_attribute(
  attribute_key text,
  attribute_value jsonb,
  visibility text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user public.user_profiles%rowtype;
  v_role_key text;
  v_attribute public.attribute_catalog%rowtype;
  v_rule public.role_attribute_rules%rowtype;
  v_visibility text;
  v_value_text text;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_user from public.user_profiles where user_id = v_user_id limit 1;
  if v_user.user_id is null then
    raise exception 'user profile not found' using errcode = 'P0002';
  end if;

  v_role_key := v_user.profile_type;

  select * into v_attribute from public.attribute_catalog where key = attribute_key and is_active = true limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select rar.* into v_rule
  from public.role_attribute_rules rar
  join public.roles r on r.id = rar.role_id
  where r.key = v_role_key
    and rar.attribute_id = v_attribute.id
    and rar.is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute is not enabled for current role' using errcode = '42501';
  end if;

  if not v_rule.user_can_edit then
    raise exception 'attribute is not editable' using errcode = '42501';
  end if;

  v_visibility := coalesce(visibility, case when v_rule.is_public_default then 'public' else 'private' end);
  if v_visibility not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if not v_rule.user_can_hide and v_visibility <> 'public' then
    raise exception 'attribute visibility cannot be changed' using errcode = '42501';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  if v_rule.requires_admin_approval_on_change then
    insert into public.approval_requests (
      request_type,
      user_id,
      target_entity_type,
      payload,
      status
    ) values (
      'attribute_change',
      v_user_id,
      'attribute',
      jsonb_build_object(
        'attribute_key', attribute_key,
        'attribute_value', attribute_value,
        'visibility', v_visibility
      ),
      'pending'
    ) returning id into v_request_id;

    return jsonb_build_object(
      'status', 'pending',
      'request_id', v_request_id,
      'attribute_key', attribute_key
    );
  end if;

  if attribute_key = 'full_name' then
    update public.user_profiles
    set full_name = v_value_text,
        updated_at = now()
    where user_id = v_user_id;
  else
    insert into public.user_profile_attributes (
      user_id,
      attribute_id,
      value_text,
      value_json,
      visibility,
      approval_status,
      approved_by,
      approved_at,
      updated_at
    ) values (
      v_user_id,
      v_attribute.id,
      case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
      case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
      v_visibility,
      'approved',
      v_user_id,
      now(),
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = excluded.value_json,
      visibility = excluded.visibility,
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();
  end if;

  return jsonb_build_object(
    'status', 'approved',
    'attribute_key', attribute_key,
    'visibility', v_visibility
  );
end;
$$;

create or replace function public.admin_set_attribute_rule(
  role_key text,
  attribute_key text,
  rule_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.roles%rowtype;
  v_attribute public.attribute_catalog%rowtype;
  v_existing public.role_attribute_rules%rowtype;
  v_rule_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_role from public.roles where key = role_key and is_active = true limit 1;
  if v_role.id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  select * into v_attribute from public.attribute_catalog where key = attribute_key limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select * into v_existing
  from public.role_attribute_rules
  where role_id = v_role.id
    and attribute_id = v_attribute.id
  limit 1;

  insert into public.role_attribute_rules (
    role_id,
    attribute_id,
    is_enabled,
    is_required,
    is_public_default,
    user_can_edit,
    user_can_hide,
    requires_admin_approval_on_change,
    sort_order
  ) values (
    v_role.id,
    v_attribute.id,
    coalesce((rule_payload ->> 'is_enabled')::boolean, coalesce(v_existing.is_enabled, true)),
    coalesce((rule_payload ->> 'is_required')::boolean, coalesce(v_existing.is_required, false)),
    coalesce((rule_payload ->> 'is_public_default')::boolean, coalesce(v_existing.is_public_default, false)),
    coalesce((rule_payload ->> 'user_can_edit')::boolean, coalesce(v_existing.user_can_edit, true)),
    coalesce((rule_payload ->> 'user_can_hide')::boolean, coalesce(v_existing.user_can_hide, true)),
    coalesce((rule_payload ->> 'requires_admin_approval_on_change')::boolean, coalesce(v_existing.requires_admin_approval_on_change, false)),
    coalesce((rule_payload ->> 'sort_order')::integer, coalesce(v_existing.sort_order, v_attribute.sort_order))
  ) on conflict (role_id, attribute_id) do update
  set
    is_enabled = excluded.is_enabled,
    is_required = excluded.is_required,
    is_public_default = excluded.is_public_default,
    user_can_edit = excluded.user_can_edit,
    user_can_hide = excluded.user_can_hide,
    requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id into v_rule_id;

  perform public.write_admin_audit_log(
    'attribute.rule_updated',
    null,
    'role_attribute_rule',
    v_rule_id,
    case when v_existing.id is null then null else to_jsonb(v_existing) end,
    rule_payload
  );
end;
$$;

create or replace function public.admin_set_feature_global_state(feature_key text, is_active_globally boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.feature_catalog%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_before from public.feature_catalog where key = feature_key limit 1;
  if v_before.key is null then
    raise exception 'invalid feature key' using errcode = '22023';
  end if;

  update public.feature_catalog
  set is_active_globally = admin_set_feature_global_state.is_active_globally,
      updated_at = now()
  where key = feature_key;

  perform public.write_admin_audit_log(
    case when is_active_globally then 'feature.enabled' else 'feature.disabled' end,
    null,
    'feature_catalog',
    null,
    to_jsonb(v_before),
    jsonb_build_object('feature_key', feature_key, 'is_active_globally', is_active_globally)
  );
end;
$$;

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
  v_before_role text;
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

  select profile_type into v_before_role
  from public.user_profiles
  where user_id = target_user_id;

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

  perform public.write_admin_audit_log(
    case when v_before_role is null then 'role.assigned' else 'role.changed' end,
    target_user_id,
    'user_role_assignment',
    target_user_id,
    jsonb_build_object('role_key', v_before_role),
    jsonb_build_object('role_key', role_key)
  );
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
  v_before boolean;
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

  select rff.is_enabled into v_before
  from public.role_feature_flags rff
  where rff.role_id = v_role_id and rff.feature_key = admin_set_role_feature_flag.feature_key;

  insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
  values (v_role_id, feature_key, is_enabled, auth.uid())
  on conflict (role_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    updated_at = now();

  perform public.write_admin_audit_log(
    case when is_enabled then 'feature.enabled' else 'feature.disabled' end,
    null,
    'role_feature_flag',
    null,
    jsonb_build_object('role_key', role_key, 'feature_key', feature_key, 'is_enabled', v_before),
    jsonb_build_object('role_key', role_key, 'feature_key', feature_key, 'is_enabled', is_enabled)
  );
end;
$$;

create or replace function public.admin_set_user_feature_override_detailed(
  target_user_id uuid,
  feature_key text,
  is_enabled boolean,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope_role text;
  v_before public.user_feature_overrides%rowtype;
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
      and (v_scope_role = '*' or up.profile_type = v_scope_role)
  ) then
    raise exception 'user profile not found for feature scope'
      using errcode = 'P0002';
  end if;

  select * into v_before
  from public.user_feature_overrides
  where user_id = target_user_id and feature_key = admin_set_user_feature_override_detailed.feature_key;

  insert into public.user_feature_overrides (user_id, feature_key, is_enabled, updated_by, updated_at, reason)
  values (target_user_id, feature_key, is_enabled, auth.uid(), now(), reason)
  on conflict (user_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    updated_at = now(),
    reason = excluded.reason;

  perform public.write_admin_audit_log(
    'feature.override_set',
    target_user_id,
    'user_feature_override',
    target_user_id,
    case when v_before.user_id is null then null else to_jsonb(v_before) end,
    jsonb_build_object('feature_key', feature_key, 'is_enabled', is_enabled, 'reason', reason)
  );
end;
$$;

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
begin
  perform public.admin_set_user_feature_override_detailed(target_user_id, feature_key, is_enabled, null);
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
declare
  v_before public.user_feature_overrides%rowtype;
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

  select * into v_before
  from public.user_feature_overrides ufo
  where ufo.user_id = target_user_id
    and ufo.feature_key = admin_clear_user_feature_override.feature_key;

  delete from public.user_feature_overrides ufo
  where ufo.user_id = target_user_id
    and ufo.feature_key = admin_clear_user_feature_override.feature_key;

  perform public.write_admin_audit_log(
    'feature.override_cleared',
    target_user_id,
    'user_feature_override',
    target_user_id,
    case when v_before.user_id is null then null else to_jsonb(v_before) end,
    jsonb_build_object('feature_key', feature_key)
  );
end;
$$;

create or replace function public.admin_review_approval_request(
  request_id uuid,
  decision text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.approval_requests%rowtype;
  v_attribute public.attribute_catalog%rowtype;
  v_attribute_value jsonb;
  v_visibility text;
  v_value_text text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select * into v_request
  from public.approval_requests
  where id = request_id
  limit 1;

  if v_request.id is null then
    raise exception 'approval request not found' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'approval request is not pending' using errcode = '22023';
  end if;

  if decision = 'approved' then
    if v_request.request_type = 'role_change' then
      perform public.admin_set_user_role(v_request.user_id, v_request.target_role_key);
    elsif v_request.request_type = 'attribute_change' then
      select * into v_attribute
      from public.attribute_catalog
      where key = v_request.payload ->> 'attribute_key'
      limit 1;

      v_attribute_value := v_request.payload -> 'attribute_value';
      v_visibility := coalesce(v_request.payload ->> 'visibility', 'private');
      v_value_text := nullif(btrim(coalesce(v_attribute_value #>> '{}', '')), '');

      if v_attribute.key = 'full_name' then
        update public.user_profiles
        set full_name = v_value_text,
            updated_at = now()
        where user_id = v_request.user_id;
      else
        insert into public.user_profile_attributes (
          user_id,
          attribute_id,
          value_text,
          value_json,
          visibility,
          approval_status,
          approved_by,
          approved_at,
          updated_at
        ) values (
          v_request.user_id,
          v_attribute.id,
          case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
          case when v_attribute.data_type in ('multi_select','boolean','json') then v_attribute_value else null end,
          v_visibility,
          'approved',
          auth.uid(),
          now(),
          now()
        )
        on conflict (user_id, attribute_id) do update
        set
          value_text = excluded.value_text,
          value_json = excluded.value_json,
          visibility = excluded.visibility,
          approval_status = 'approved',
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at,
          updated_at = now();
      end if;

      perform public.write_admin_audit_log(
        'attribute.value_approved',
        v_request.user_id,
        'attribute',
        null,
        null,
        v_request.payload
      );
    elsif v_request.request_type in ('directory_visibility','contact_visibility','featured_listing','event_create','offer_create','referral_create','city_manage') then
      if v_request.target_feature_key is not null then
        perform public.admin_set_user_feature_override_detailed(
          v_request.user_id,
          v_request.target_feature_key,
          true,
          coalesce(note, 'approval_request:' || v_request.id::text)
        );
      end if;
    end if;
  elsif v_request.request_type = 'attribute_change' then
    perform public.write_admin_audit_log(
      'attribute.value_rejected',
      v_request.user_id,
      'attribute',
      null,
      null,
      v_request.payload
    );
  end if;

  update public.approval_requests
  set
    status = decision,
    admin_note = note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = request_id;

  perform public.write_admin_audit_log(
    case when decision = 'approved' then 'approval.approved' else 'approval.rejected' end,
    v_request.user_id,
    'approval_request',
    v_request.id,
    to_jsonb(v_request),
    jsonb_build_object('status', decision, 'admin_note', note)
  );
end;
$$;

create or replace function public.list_public_directory_profiles(
  search_text text default null,
  role_filter text default null,
  country_filter text default null,
  city_filter text default null,
  featured_only boolean default false,
  verified_only boolean default false
)
returns table (
  user_id uuid,
  role_key text,
  role_label text,
  role_slug text,
  display_name text,
  short_bio text,
  country text,
  city text,
  profile_image_url text,
  special_attribute_key text,
  special_attribute_label text,
  special_attribute_value text,
  is_featured boolean,
  is_verified boolean,
  whatsapp text,
  linkedin_url text,
  website_url text
)
language sql
security definer
set search_path = public
as $$
  with feature_state as (
    select
      up.user_id,
      up.profile_type,
      coalesce(dir_override.is_enabled, dir_role.is_enabled, false) and coalesce(dir_catalog.is_active_globally, false) as directory_visible,
      coalesce(featured_override.is_enabled, featured_role.is_enabled, false) and coalesce(featured_catalog.is_active_globally, false) as directory_featured
    from public.user_profiles up
    join public.roles r on r.key = up.profile_type
    left join public.feature_catalog dir_catalog on dir_catalog.key = 'directory.visible'
    left join public.feature_catalog featured_catalog on featured_catalog.key = 'directory.featured'
    left join public.role_feature_flags dir_role on dir_role.role_id = r.id and dir_role.feature_key = dir_catalog.key
    left join public.role_feature_flags featured_role on featured_role.role_id = r.id and featured_role.feature_key = featured_catalog.key
    left join public.user_feature_overrides dir_override on dir_override.user_id = up.user_id and dir_override.feature_key = 'directory.visible'
    left join public.user_feature_overrides featured_override on featured_override.user_id = up.user_id and featured_override.feature_key = 'directory.featured'
  ),
  resolved_attributes as (
    select
      up.user_id,
      max(case when ac.key = 'bio_short' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as short_bio,
      max(case when ac.key = 'country' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as country,
      max(case when ac.key = 'city' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as city,
      max(case when ac.key = 'profile_photo_url' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as profile_image_url,
      max(case when ac.key = 'main_platform' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as main_platform,
      max(case when ac.key = 'interests' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as interests,
      max(case when ac.key = 'expertise_area' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as expertise_area,
      max(case when ac.key = 'business_category' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as business_category,
      max(case when ac.key = 'organization_type' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as organization_type,
      max(case when ac.key = 'ambassador_city' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as ambassador_city
    from public.user_profiles up
    left join public.user_profile_attributes upa on upa.user_id = up.user_id
    left join public.attribute_catalog ac on ac.id = upa.attribute_id
    group by up.user_id
  )
  select
    up.user_id,
    up.profile_type as role_key,
    r.label as role_label,
    case up.profile_type
      when 'bireysel' then 'individual'
      when 'danisman' then 'consultant'
      when 'isletme' then 'business'
      when 'kurulus-dernek' then 'organization'
      when 'blogger-vlogger-youtuber' then 'influencer'
      when 'sehir-elcisi' then 'ambassador'
      else up.profile_type
    end as role_slug,
    coalesce(nullif(up.full_name, ''), 'CorteQS Uyesi') as display_name,
    ra.short_bio,
    ra.country,
    coalesce(ra.city, ra.ambassador_city) as city,
    ra.profile_image_url,
    case up.profile_type
      when 'bireysel' then 'interests'
      when 'danisman' then 'expertise_area'
      when 'isletme' then 'business_category'
      when 'kurulus-dernek' then 'organization_type'
      when 'blogger-vlogger-youtuber' then 'main_platform'
      when 'sehir-elcisi' then 'ambassador_city'
      else null
    end as special_attribute_key,
    case up.profile_type
      when 'bireysel' then 'Ilgi Alanlari'
      when 'danisman' then 'Uzmanlik Alani'
      when 'isletme' then 'Isletme Kategorisi'
      when 'kurulus-dernek' then 'Kurulus Turu'
      when 'blogger-vlogger-youtuber' then 'Ana Platform'
      when 'sehir-elcisi' then 'Sorumlu Sehir'
      else null
    end as special_attribute_label,
    case up.profile_type
      when 'bireysel' then ra.interests
      when 'danisman' then ra.expertise_area
      when 'isletme' then ra.business_category
      when 'kurulus-dernek' then ra.organization_type
      when 'blogger-vlogger-youtuber' then ra.main_platform
      when 'sehir-elcisi' then ra.ambassador_city
      else null
    end as special_attribute_value,
    fs.directory_featured as is_featured,
    fs.directory_visible as is_verified,
    null::text as whatsapp,
    null::text as linkedin_url,
    null::text as website_url
  from public.user_profiles up
  join public.roles r on r.key = up.profile_type
  join feature_state fs on fs.user_id = up.user_id
  left join resolved_attributes ra on ra.user_id = up.user_id
  where fs.directory_visible = true
    and (role_filter is null or up.profile_type = role_filter)
    and (country_filter is null or ra.country = country_filter)
    and (city_filter is null or coalesce(ra.city, ra.ambassador_city) = city_filter)
    and (not featured_only or fs.directory_featured = true)
    and (not verified_only or fs.directory_visible = true)
    and (
      search_text is null
      or coalesce(up.full_name, '') ilike '%' || search_text || '%'
      or coalesce(ra.short_bio, '') ilike '%' || search_text || '%'
      or coalesce(
        case up.profile_type
          when 'bireysel' then ra.interests
          when 'danisman' then ra.expertise_area
          when 'isletme' then ra.business_category
          when 'kurulus-dernek' then ra.organization_type
          when 'blogger-vlogger-youtuber' then ra.main_platform
          when 'sehir-elcisi' then ra.ambassador_city
          else ''
        end,
        ''
      ) ilike '%' || search_text || '%'
    )
  order by fs.directory_featured desc, coalesce(up.full_name, '') asc;
$$;

create or replace function public.get_public_directory_profile(target_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(p)
  from (
    select *
    from public.list_public_directory_profiles(null, null, null, null, false, false)
    where user_id = target_user_id
    limit 1
  ) p;
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
    on fc.scope_role = '*'
    or fc.scope_role = er.role_key
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

grant execute on function public.get_current_user_profile() to authenticated;
grant execute on function public.get_current_user_features() to authenticated;
grant execute on function public.submit_role_change_request(text, text) to authenticated;
grant execute on function public.submit_feature_request(text, jsonb) to authenticated;
grant execute on function public.update_profile_attribute(text, jsonb, text) to authenticated;
grant execute on function public.admin_set_attribute_rule(text, text, jsonb) to authenticated;
grant execute on function public.admin_set_feature_global_state(text, boolean) to authenticated;
grant execute on function public.admin_set_user_feature_override_detailed(uuid, text, boolean, text) to authenticated;
grant execute on function public.admin_review_approval_request(uuid, text, text) to authenticated;
grant execute on function public.list_public_directory_profiles(text, text, text, text, boolean, boolean) to anon, authenticated;
grant execute on function public.get_public_directory_profile(uuid) to anon, authenticated;
grant execute on function public.write_admin_audit_log(text, uuid, text, uuid, jsonb, jsonb) to authenticated;

commit;
