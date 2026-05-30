begin;

alter table public.feature_catalog
  add column if not exists scope text not null default 'general',
  add column if not exists feature_type text not null default 'capability',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists sort_order integer not null default 100;

create table if not exists public.profile_section_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  section_area text not null check (section_area in ('preview_card', 'detail_card')),
  label text not null,
  description text,
  component_name text,
  data_source text not null default 'derived',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_profile_section_rules (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  section_id uuid not null references public.profile_section_catalog(id) on delete cascade,
  is_enabled boolean not null default true,
  requires_approval boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, section_id)
);

create table if not exists public.taxonomy_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  selection_mode text not null check (selection_mode in ('single', 'multiple')),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taxonomy_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.taxonomy_groups(id) on delete cascade,
  key text not null unique,
  label text not null,
  description text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_taxonomy_rules (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  group_id uuid not null references public.taxonomy_groups(id) on delete cascade,
  is_enabled boolean not null default true,
  is_required boolean not null default false,
  selection_mode text not null check (selection_mode in ('single', 'multiple')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, group_id)
);

create table if not exists public.user_taxonomy_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  group_id uuid not null references public.taxonomy_groups(id) on delete cascade,
  option_id uuid not null references public.taxonomy_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, group_id, option_id)
);

create index if not exists idx_profile_section_catalog_area on public.profile_section_catalog(section_area, sort_order);
create index if not exists idx_role_profile_section_rules_role on public.role_profile_section_rules(role_id);
create index if not exists idx_taxonomy_options_group on public.taxonomy_options(group_id, sort_order);
create index if not exists idx_role_taxonomy_rules_role on public.role_taxonomy_rules(role_id);
create index if not exists idx_user_taxonomy_selections_user on public.user_taxonomy_selections(user_id);

insert into public.attribute_catalog (key, label, description, data_type, is_active, is_system, sort_order)
values
  ('linkedin_url', 'LinkedIn URL', 'Public LinkedIn profil linki', 'url', true, false, 170),
  ('website_url', 'Website', 'Public website veya landing adresi', 'url', true, false, 180),
  ('service_regions', 'Servis Bölgeleri', 'Hizmet verilen şehir, ülke veya bölgeler', 'textarea', true, false, 190),
  ('physical_address', 'Fiziksel Adres', 'Ofis veya işletme fiziksel adresi', 'textarea', true, false, 200),
  ('map_link', 'Harita Linki', 'Google Maps veya yön tarifi linki', 'url', true, false, 210),
  ('founded_year', 'Kuruluş Yılı', 'Startup veya işletme kuruluş yılı', 'text', true, false, 220),
  ('real_estate_media_urls', 'Gayrimenkul Medya Linkleri', 'Gayrimenkul danışmanlığı için görsel veya video linkleri', 'textarea', true, false, 230)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.profile_section_catalog (key, section_area, label, description, component_name, data_source, metadata, sort_order)
values
  ('preview.isim_kurulus_adi', 'preview_card', 'İsim / Kuruluş Adı', 'Public ön kart ana başlığı', 'title', 'user_profiles', jsonb_build_object('kind', 'name'), 10),
  ('preview.konum', 'preview_card', 'Konum', 'Şehir ve ülke konumu', 'location', 'user_profile_attributes', jsonb_build_object('attribute_keys', jsonb_build_array('city', 'country')), 20),
  ('preview.profil_logo_gorseli', 'preview_card', 'Profil / Logo Görseli', 'Public profil görseli', 'image', 'user_profile_attributes', jsonb_build_object('attribute_keys', jsonb_build_array('profile_photo_url')), 30),
  ('preview.kategori_sektor_etiketi', 'preview_card', 'Kategori / Sektör Etiketi', 'Rol özel alanı veya taxonomy etiketleri', 'badges', 'derived', jsonb_build_object('attribute_keys', jsonb_build_array('interests', 'expertise_area', 'business_category', 'organization_type', 'main_platform', 'ambassador_city')), 40),
  ('detail.hakkinda_bio', 'detail_card', 'Hakkında', 'Public kısa açıklama', 'rich_text', 'user_profile_attributes', jsonb_build_object('attribute_keys', jsonb_build_array('bio_short')), 110),
  ('detail.taxonomy_etiketleri', 'detail_card', 'Uzmanlık / Alt Tip Etiketleri', 'Taxonomy etiketleri', 'badges', 'taxonomy', jsonb_build_object('group_keys', jsonb_build_array('consultant_subcategory', 'business_subtype')), 120),
  ('detail.iletisim_linkleri', 'detail_card', 'İletişim Linkleri', 'Public website ve LinkedIn linkleri', 'links', 'user_profile_attributes', jsonb_build_object('attribute_keys', jsonb_build_array('website_url', 'linkedin_url')), 130)
on conflict (key) do update
set
  section_area = excluded.section_area,
  label = excluded.label,
  description = excluded.description,
  component_name = excluded.component_name,
  data_source = excluded.data_source,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into public.taxonomy_groups (key, label, description, selection_mode, metadata, sort_order)
values
  ('consultant_subcategory', 'Consultant Alt Kategorileri', 'Consultant rolü için uzmanlık seçimleri', 'multiple', jsonb_build_object('role_key', 'danisman'), 10),
  ('business_subtype', 'Business Alt Tipi', 'İşletme rolü için tek alt tip seçimi', 'single', jsonb_build_object('role_key', 'isletme'), 20)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  selection_mode = excluded.selection_mode,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with option_seed(group_key, option_key, label, description, sort_order) as (
  values
    ('consultant_subcategory', 'consultant_category.egitim', 'Eğitim', 'Üniversite, burs ve denklik danışmanlığı', 10),
    ('consultant_subcategory', 'consultant_category.finansal', 'Finansal', 'Banka ve yatırım odaklı danışmanlık', 20),
    ('consultant_subcategory', 'consultant_category.gayrimenkul', 'Gayrimenkul', 'Emlak ve taşınma danışmanlığı', 30),
    ('consultant_subcategory', 'consultant_category.hukuk', 'Hukuk', 'Hukuki danışmanlık', 40),
    ('consultant_subcategory', 'consultant_category.marka_and_patent', 'Marka & Patent', 'Marka ve patent süreçleri', 50),
    ('consultant_subcategory', 'consultant_category.mentor', 'Mentör', 'Gönüllü mentörlük', 60),
    ('consultant_subcategory', 'consultant_category.saglik', 'Sağlık', 'Sağlık danışmanlığı', 70),
    ('consultant_subcategory', 'consultant_category.wellbeing', 'Wellbeing', 'Psikolog ve wellbeing hizmetleri', 80),
    ('business_subtype', 'business_subtype.classic', 'Classic', 'Fiziksel adres odaklı işletme', 10),
    ('business_subtype', 'business_subtype.online', 'Online', 'Dijital ve servis bölgesi odaklı işletme', 20),
    ('business_subtype', 'business_subtype.startup', 'Startup', 'Kuruluş yılı odaklı girişim', 30)
)
insert into public.taxonomy_options (group_id, key, label, description, sort_order)
select tg.id, os.option_key, os.label, os.description, os.sort_order
from option_seed os
join public.taxonomy_groups tg on tg.key = os.group_key
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

with section_rules(role_key, section_key, sort_order) as (
  values
    ('bireysel', 'preview.isim_kurulus_adi', 10),
    ('bireysel', 'preview.konum', 20),
    ('bireysel', 'preview.profil_logo_gorseli', 30),
    ('bireysel', 'preview.kategori_sektor_etiketi', 40),
    ('bireysel', 'detail.hakkinda_bio', 110),
    ('danisman', 'preview.isim_kurulus_adi', 10),
    ('danisman', 'preview.konum', 20),
    ('danisman', 'preview.profil_logo_gorseli', 30),
    ('danisman', 'preview.kategori_sektor_etiketi', 40),
    ('danisman', 'detail.hakkinda_bio', 110),
    ('danisman', 'detail.taxonomy_etiketleri', 120),
    ('danisman', 'detail.iletisim_linkleri', 130),
    ('isletme', 'preview.isim_kurulus_adi', 10),
    ('isletme', 'preview.konum', 20),
    ('isletme', 'preview.profil_logo_gorseli', 30),
    ('isletme', 'preview.kategori_sektor_etiketi', 40),
    ('isletme', 'detail.hakkinda_bio', 110),
    ('isletme', 'detail.taxonomy_etiketleri', 120),
    ('isletme', 'detail.iletisim_linkleri', 130),
    ('kurulus-dernek', 'preview.isim_kurulus_adi', 10),
    ('kurulus-dernek', 'preview.konum', 20),
    ('kurulus-dernek', 'preview.profil_logo_gorseli', 30),
    ('kurulus-dernek', 'preview.kategori_sektor_etiketi', 40),
    ('kurulus-dernek', 'detail.hakkinda_bio', 110),
    ('kurulus-dernek', 'detail.iletisim_linkleri', 130),
    ('blogger-vlogger-youtuber', 'preview.isim_kurulus_adi', 10),
    ('blogger-vlogger-youtuber', 'preview.konum', 20),
    ('blogger-vlogger-youtuber', 'preview.profil_logo_gorseli', 30),
    ('blogger-vlogger-youtuber', 'preview.kategori_sektor_etiketi', 40),
    ('blogger-vlogger-youtuber', 'detail.hakkinda_bio', 110),
    ('blogger-vlogger-youtuber', 'detail.iletisim_linkleri', 130),
    ('sehir-elcisi', 'preview.isim_kurulus_adi', 10),
    ('sehir-elcisi', 'preview.konum', 20),
    ('sehir-elcisi', 'preview.profil_logo_gorseli', 30),
    ('sehir-elcisi', 'preview.kategori_sektor_etiketi', 40),
    ('sehir-elcisi', 'detail.hakkinda_bio', 110)
)
insert into public.role_profile_section_rules (role_id, section_id, is_enabled, requires_approval, sort_order)
select r.id, psc.id, true, false, sr.sort_order
from section_rules sr
join public.roles r on r.key = sr.role_key
join public.profile_section_catalog psc on psc.key = sr.section_key
on conflict (role_id, section_id) do update
set
  is_enabled = excluded.is_enabled,
  requires_approval = excluded.requires_approval,
  sort_order = excluded.sort_order,
  updated_at = now();

with taxonomy_rules(role_key, group_key, is_required, selection_mode) as (
  values
    ('danisman', 'consultant_subcategory', false, 'multiple'),
    ('isletme', 'business_subtype', true, 'single')
)
insert into public.role_taxonomy_rules (role_id, group_id, is_enabled, is_required, selection_mode)
select r.id, tg.id, true, tr.is_required, tr.selection_mode
from taxonomy_rules tr
join public.roles r on r.key = tr.role_key
join public.taxonomy_groups tg on tg.key = tr.group_key
on conflict (role_id, group_id) do update
set
  is_enabled = true,
  is_required = excluded.is_required,
  selection_mode = excluded.selection_mode,
  updated_at = now();

with feature_seed(feature_key, label, description, scope_role, scope, feature_type, sort_order, global_enabled) as (
  values
    ('dashboard.tab_profil_ayarlari', 'Dashboard: Profil Ayarları', 'Profil ayarları tabına erişim', '*', 'dashboard', 'tab', 510, true),
    ('dashboard.tab_mesaj_kutusu', 'Dashboard: Mesaj Kutusu', 'Mesaj kutusu tabına erişim', '*', 'dashboard', 'tab', 520, true),
    ('dashboard.tab_takip_ettiklerim', 'Dashboard: Takip Ettiklerim', 'Takip listesi tabına erişim', '*', 'dashboard', 'tab', 530, true),
    ('dashboard.tab_etkinlikler', 'Dashboard: Etkinlikler', 'Etkinlikler tabına erişim', '*', 'dashboard', 'tab', 540, true),
    ('dashboard.tab_whatsapp', 'Dashboard: WhatsApp', 'WhatsApp tabına erişim', '*', 'dashboard', 'tab', 550, false),
    ('dashboard.tab_analitik', 'Dashboard: Analitik', 'Analitik tabına erişim', '*', 'dashboard', 'tab', 560, false),
    ('dashboard.admin_onizleme_modu', 'Dashboard: Admin Önizleme Modu', 'Admin için önizleme modu', 'admin', 'admin', 'admin', 570, false)
)
insert into public.feature_catalog (key, label, description, scope_role, scope, feature_type, metadata, sort_order, is_active_globally)
select feature_key, label, description, scope_role, scope, feature_type, '{}'::jsonb, sort_order, global_enabled
from feature_seed
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  scope = excluded.scope,
  feature_type = excluded.feature_type,
  sort_order = excluded.sort_order,
  is_active_globally = excluded.is_active_globally,
  updated_at = now();

with dashboard_flags(role_key, feature_key, is_enabled) as (
  values
    ('bireysel', 'dashboard.tab_profil_ayarlari', true),
    ('bireysel', 'dashboard.tab_mesaj_kutusu', true),
    ('bireysel', 'dashboard.tab_takip_ettiklerim', true),
    ('bireysel', 'dashboard.tab_etkinlikler', true),
    ('danisman', 'dashboard.tab_profil_ayarlari', true),
    ('danisman', 'dashboard.tab_mesaj_kutusu', true),
    ('danisman', 'dashboard.tab_takip_ettiklerim', true),
    ('danisman', 'dashboard.tab_etkinlikler', true),
    ('danisman', 'dashboard.tab_analitik', true),
    ('isletme', 'dashboard.tab_profil_ayarlari', true),
    ('isletme', 'dashboard.tab_mesaj_kutusu', true),
    ('isletme', 'dashboard.tab_takip_ettiklerim', true),
    ('isletme', 'dashboard.tab_etkinlikler', true),
    ('isletme', 'dashboard.tab_analitik', true),
    ('kurulus-dernek', 'dashboard.tab_profil_ayarlari', true),
    ('kurulus-dernek', 'dashboard.tab_mesaj_kutusu', true),
    ('kurulus-dernek', 'dashboard.tab_takip_ettiklerim', true),
    ('kurulus-dernek', 'dashboard.tab_etkinlikler', true),
    ('blogger-vlogger-youtuber', 'dashboard.tab_profil_ayarlari', true),
    ('blogger-vlogger-youtuber', 'dashboard.tab_mesaj_kutusu', true),
    ('blogger-vlogger-youtuber', 'dashboard.tab_takip_ettiklerim', true),
    ('blogger-vlogger-youtuber', 'dashboard.tab_etkinlikler', true),
    ('blogger-vlogger-youtuber', 'dashboard.tab_analitik', true),
    ('sehir-elcisi', 'dashboard.tab_profil_ayarlari', true),
    ('sehir-elcisi', 'dashboard.tab_mesaj_kutusu', true),
    ('sehir-elcisi', 'dashboard.tab_takip_ettiklerim', true),
    ('sehir-elcisi', 'dashboard.tab_etkinlikler', true)
)
insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select r.id, df.feature_key, df.is_enabled, null
from dashboard_flags df
join public.roles r on r.key = df.role_key
on conflict (role_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.role_attribute_rules (role_id, attribute_id, is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order)
select r.id, ac.id, true, false, true, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key in ('linkedin_url', 'website_url')
where r.key in ('danisman', 'isletme', 'kurulus-dernek', 'blogger-vlogger-youtuber')
on conflict (role_id, attribute_id) do update
set
  is_enabled = true,
  is_public_default = true,
  user_can_edit = true,
  user_can_hide = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.role_attribute_rules (role_id, attribute_id, is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order)
select r.id, ac.id, true, false, false, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key in ('service_regions', 'physical_address', 'map_link', 'founded_year')
where r.key = 'isletme'
on conflict (role_id, attribute_id) do update
set
  is_enabled = true,
  user_can_edit = true,
  user_can_hide = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.role_attribute_rules (role_id, attribute_id, is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order)
select r.id, ac.id, true, false, false, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key = 'real_estate_media_urls'
where r.key = 'danisman'
on conflict (role_id, attribute_id) do update
set
  is_enabled = true,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.profile_section_catalog enable row level security;
alter table public.role_profile_section_rules enable row level security;
alter table public.taxonomy_groups enable row level security;
alter table public.taxonomy_options enable row level security;
alter table public.role_taxonomy_rules enable row level security;
alter table public.user_taxonomy_selections enable row level security;

drop policy if exists "profile_section_catalog_select_authenticated" on public.profile_section_catalog;
create policy "profile_section_catalog_select_authenticated"
on public.profile_section_catalog
for select to authenticated
using (true);

drop policy if exists "role_profile_section_rules_select_authenticated" on public.role_profile_section_rules;
create policy "role_profile_section_rules_select_authenticated"
on public.role_profile_section_rules
for select to authenticated
using (true);

drop policy if exists "taxonomy_groups_select_authenticated" on public.taxonomy_groups;
create policy "taxonomy_groups_select_authenticated"
on public.taxonomy_groups
for select to authenticated
using (true);

drop policy if exists "taxonomy_options_select_authenticated" on public.taxonomy_options;
create policy "taxonomy_options_select_authenticated"
on public.taxonomy_options
for select to authenticated
using (true);

drop policy if exists "role_taxonomy_rules_select_authenticated" on public.role_taxonomy_rules;
create policy "role_taxonomy_rules_select_authenticated"
on public.role_taxonomy_rules
for select to authenticated
using (true);

drop policy if exists "user_taxonomy_selections_select_self_or_admin" on public.user_taxonomy_selections;
create policy "user_taxonomy_selections_select_self_or_admin"
on public.user_taxonomy_selections
for select to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

revoke all on public.profile_section_catalog from authenticated;
revoke all on public.role_profile_section_rules from authenticated;
revoke all on public.taxonomy_groups from authenticated;
revoke all on public.taxonomy_options from authenticated;
revoke all on public.role_taxonomy_rules from authenticated;
revoke all on public.user_taxonomy_selections from authenticated;

grant select on public.profile_section_catalog to authenticated;
grant select on public.role_profile_section_rules to authenticated;
grant select on public.taxonomy_groups to authenticated;
grant select on public.taxonomy_options to authenticated;
grant select on public.role_taxonomy_rules to authenticated;
grant select on public.user_taxonomy_selections to authenticated;

create or replace function public.admin_upsert_role_profile_section_rule(
  role_key text,
  section_key text,
  is_enabled boolean,
  requires_approval boolean default false,
  sort_order integer default 100
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.roles%rowtype;
  v_section public.profile_section_catalog%rowtype;
  v_before public.role_profile_section_rules%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_role from public.roles where key = role_key and is_active = true limit 1;
  select * into v_section from public.profile_section_catalog where key = section_key limit 1;

  if v_role.id is null or v_section.id is null then
    raise exception 'invalid role or section key' using errcode = '22023';
  end if;

  select * into v_before
  from public.role_profile_section_rules
  where role_id = v_role.id and section_id = v_section.id
  limit 1;

  insert into public.role_profile_section_rules (role_id, section_id, is_enabled, requires_approval, sort_order)
  values (v_role.id, v_section.id, is_enabled, requires_approval, coalesce(sort_order, v_section.sort_order))
  on conflict (role_id, section_id) do update
  set
    is_enabled = excluded.is_enabled,
    requires_approval = excluded.requires_approval,
    sort_order = excluded.sort_order,
    updated_at = now();

  perform public.write_admin_audit_log(
    'profile_section.rule_upserted',
    null,
    'role_profile_section_rule',
    null,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    jsonb_build_object(
      'role_key', role_key,
      'section_key', section_key,
      'is_enabled', is_enabled,
      'requires_approval', requires_approval,
      'sort_order', sort_order
    )
  );
end;
$$;

create or replace function public.admin_upsert_role_taxonomy_rule(
  role_key text,
  group_key text,
  is_enabled boolean,
  is_required boolean,
  selection_mode text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.roles%rowtype;
  v_group public.taxonomy_groups%rowtype;
  v_before public.role_taxonomy_rules%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if selection_mode not in ('single', 'multiple') then
    raise exception 'invalid selection mode' using errcode = '22023';
  end if;

  select * into v_role from public.roles where key = role_key and is_active = true limit 1;
  select * into v_group from public.taxonomy_groups where key = group_key limit 1;

  if v_role.id is null or v_group.id is null then
    raise exception 'invalid role or group key' using errcode = '22023';
  end if;

  select * into v_before
  from public.role_taxonomy_rules
  where role_id = v_role.id and group_id = v_group.id
  limit 1;

  insert into public.role_taxonomy_rules (role_id, group_id, is_enabled, is_required, selection_mode)
  values (v_role.id, v_group.id, is_enabled, is_required, selection_mode)
  on conflict (role_id, group_id) do update
  set
    is_enabled = excluded.is_enabled,
    is_required = excluded.is_required,
    selection_mode = excluded.selection_mode,
    updated_at = now();

  perform public.write_admin_audit_log(
    'taxonomy.rule_upserted',
    null,
    'role_taxonomy_rule',
    null,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    jsonb_build_object(
      'role_key', role_key,
      'group_key', group_key,
      'is_enabled', is_enabled,
      'is_required', is_required,
      'selection_mode', selection_mode
    )
  );
end;
$$;

create or replace function public.admin_set_taxonomy_option_active(
  option_key text,
  is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.taxonomy_options%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_before from public.taxonomy_options where key = option_key limit 1;
  if v_before.id is null then
    raise exception 'invalid option key' using errcode = '22023';
  end if;

  update public.taxonomy_options
  set is_active = admin_set_taxonomy_option_active.is_active,
      updated_at = now()
  where key = option_key;

  perform public.write_admin_audit_log(
    case when is_active then 'taxonomy.option_activated' else 'taxonomy.option_deactivated' end,
    null,
    'taxonomy_option',
    v_before.id,
    to_jsonb(v_before),
    jsonb_build_object('key', option_key, 'is_active', is_active)
  );
end;
$$;

create or replace function public.update_user_taxonomy_selection(
  group_key text,
  option_keys text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.user_profiles%rowtype;
  v_group public.taxonomy_groups%rowtype;
  v_rule public.role_taxonomy_rules%rowtype;
  v_role public.roles%rowtype;
  v_selected_count integer;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_user from public.user_profiles where user_id = auth.uid() limit 1;
  select * into v_group from public.taxonomy_groups where key = group_key and is_active = true limit 1;
  select * into v_role from public.roles where key = v_user.profile_type limit 1;

  if v_user.user_id is null or v_group.id is null or v_role.id is null then
    raise exception 'invalid taxonomy update context' using errcode = '22023';
  end if;

  select * into v_rule
  from public.role_taxonomy_rules
  where role_id = v_role.id and group_id = v_group.id and is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'taxonomy group is not enabled for current role' using errcode = '42501';
  end if;

  select count(*)
  into v_selected_count
  from public.taxonomy_options
  where group_id = v_group.id
    and is_active = true
    and key = any(coalesce(option_keys, array[]::text[]));

  if v_selected_count <> coalesce(array_length(option_keys, 1), 0) then
    raise exception 'one or more taxonomy options are invalid' using errcode = '22023';
  end if;

  if v_rule.selection_mode = 'single' and coalesce(array_length(option_keys, 1), 0) > 1 then
    raise exception 'single selection group cannot accept multiple options' using errcode = '22023';
  end if;

  if v_rule.is_required and coalesce(array_length(option_keys, 1), 0) = 0 then
    raise exception 'at least one taxonomy option is required' using errcode = '22023';
  end if;

  delete from public.user_taxonomy_selections
  where user_id = auth.uid()
    and group_id = v_group.id;

  insert into public.user_taxonomy_selections (user_id, group_id, option_id)
  select auth.uid(), v_group.id, t.id
  from public.taxonomy_options t
  where t.group_id = v_group.id
    and t.key = any(coalesce(option_keys, array[]::text[]));

  return jsonb_build_object(
    'group_key', group_key,
    'selection_count', coalesce(array_length(option_keys, 1), 0),
    'status', 'approved'
  );
end;
$$;

create or replace function public.get_current_user_dashboard()
returns table (
  feature_key text,
  label text,
  description text,
  scope text,
  feature_type text,
  is_enabled boolean,
  source text,
  sort_order integer
)
language sql
security definer
set search_path = public
as $$
  select
    fc.key as feature_key,
    fc.label,
    fc.description,
    fc.scope,
    fc.feature_type,
    guf.is_enabled,
    guf.source,
    fc.sort_order
  from public.get_current_user_features() guf
  join public.feature_catalog fc on fc.key = guf.feature_key
  where fc.key like 'dashboard.%'
  order by fc.sort_order, fc.key;
$$;

create or replace function public.get_public_profile_sections(target_user_id uuid)
returns table (
  section_key text,
  section_area text,
  label text,
  component_name text,
  sort_order integer,
  content jsonb
)
language sql
security definer
set search_path = public
as $$
  with base_user as (
    select up.user_id, up.profile_type, coalesce(nullif(up.full_name, ''), 'CorteQS Üyesi') as display_name
    from public.user_profiles up
    where up.user_id = target_user_id
  ),
  visibility_gate as (
    select
      up.user_id,
      coalesce(dir_override.is_enabled, dir_role.is_enabled, false) and coalesce(dir_catalog.is_active_globally, false) as directory_visible
    from public.user_profiles up
    join public.roles r on r.key = up.profile_type
    left join public.feature_catalog dir_catalog on dir_catalog.key = 'directory.visible'
    left join public.role_feature_flags dir_role on dir_role.role_id = r.id and dir_role.feature_key = 'directory.visible'
    left join public.user_feature_overrides dir_override on dir_override.user_id = up.user_id and dir_override.feature_key = 'directory.visible'
    where up.user_id = target_user_id
  ),
  public_attributes as (
    select
      ac.key,
      upa.value_text,
      upa.value_json
    from public.user_profile_attributes upa
    join public.attribute_catalog ac on ac.id = upa.attribute_id
    where upa.user_id = target_user_id
      and upa.visibility = 'public'
      and upa.approval_status = 'approved'
  ),
  taxonomy_labels as (
    select
      tg.key as group_key,
      jsonb_agg(
        jsonb_build_object('key', topt.key, 'label', topt.label)
        order by topt.sort_order, topt.label
      ) as options
    from public.user_taxonomy_selections uts
    join public.taxonomy_groups tg on tg.id = uts.group_id and tg.is_active = true
    join public.taxonomy_options topt on topt.id = uts.option_id and topt.is_active = true
    where uts.user_id = target_user_id
    group by tg.key
  ),
  allowed_sections as (
    select
      psc.key,
      psc.section_area,
      psc.label,
      psc.component_name,
      coalesce(rpsr.sort_order, psc.sort_order) as sort_order
    from base_user bu
    join public.roles r on r.key = bu.profile_type
    join public.role_profile_section_rules rpsr on rpsr.role_id = r.id and rpsr.is_enabled = true
    join public.profile_section_catalog psc on psc.id = rpsr.section_id and psc.is_active = true
  )
  select
    s.key as section_key,
    s.section_area,
    s.label,
    s.component_name,
    s.sort_order,
    case s.key
      when 'preview.isim_kurulus_adi' then jsonb_build_object('text', (select display_name from base_user))
      when 'preview.konum' then jsonb_build_object(
        'city', (select value_text from public_attributes where key = 'city'),
        'country', (select value_text from public_attributes where key = 'country')
      )
      when 'preview.profil_logo_gorseli' then jsonb_build_object('url', (select value_text from public_attributes where key = 'profile_photo_url'))
      when 'preview.kategori_sektor_etiketi' then jsonb_build_object(
        'primary_label',
        coalesce(
          (select value_text from public_attributes where key in ('interests', 'expertise_area', 'business_category', 'organization_type', 'main_platform', 'ambassador_city') limit 1),
          null
        ),
        'taxonomy',
        coalesce((select jsonb_agg(option_item ->> 'label') from taxonomy_labels tl, jsonb_array_elements(tl.options) option_item), '[]'::jsonb)
      )
      when 'detail.hakkinda_bio' then jsonb_build_object('text', (select value_text from public_attributes where key = 'bio_short'))
      when 'detail.taxonomy_etiketleri' then jsonb_build_object(
        'groups',
        coalesce(
          (
            select jsonb_object_agg(group_key, options)
            from taxonomy_labels
          ),
          '{}'::jsonb
        )
      )
      when 'detail.iletisim_linkleri' then jsonb_build_object(
        'links',
        jsonb_strip_nulls(
          jsonb_build_array(
            case when (select value_text from public_attributes where key = 'website_url') is not null then jsonb_build_object('label', 'Website', 'url', (select value_text from public_attributes where key = 'website_url')) end,
            case when (select value_text from public_attributes where key = 'linkedin_url') is not null then jsonb_build_object('label', 'LinkedIn', 'url', (select value_text from public_attributes where key = 'linkedin_url')) end
          )
        )
      )
      else '{}'::jsonb
    end as content
  from allowed_sections s
  join visibility_gate vg on vg.directory_visible = true
  where (
      s.key = 'preview.isim_kurulus_adi'
      or (s.key = 'preview.konum' and exists (select 1 from public_attributes where key in ('city', 'country')))
      or (s.key = 'preview.profil_logo_gorseli' and exists (select 1 from public_attributes where key = 'profile_photo_url'))
      or (s.key = 'preview.kategori_sektor_etiketi' and (
        exists (select 1 from public_attributes where key in ('interests', 'expertise_area', 'business_category', 'organization_type', 'main_platform', 'ambassador_city'))
        or exists (select 1 from taxonomy_labels)
      ))
      or (s.key = 'detail.hakkinda_bio' and exists (select 1 from public_attributes where key = 'bio_short'))
      or (s.key = 'detail.taxonomy_etiketleri' and exists (select 1 from taxonomy_labels))
      or (s.key = 'detail.iletisim_linkleri' and exists (select 1 from public_attributes where key in ('website_url', 'linkedin_url')))
    )
  order by s.sort_order, s.key;
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
  v_taxonomy jsonb;
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'attribute_key', ac.key,
        'label', ac.label,
        'description', ac.description,
        'data_type', ac.data_type,
        'is_system', ac.is_system,
        'sort_order', rar.sort_order,
        'is_required',
        (
          rar.is_required
          or (
            v_role_key = 'isletme'
            and ac.key in ('physical_address', 'map_link')
            and exists (
              select 1
              from public.user_taxonomy_selections uts
              join public.taxonomy_groups tg on tg.id = uts.group_id
              join public.taxonomy_options topt on topt.id = uts.option_id
              where uts.user_id = v_user.user_id
                and tg.key = 'business_subtype'
                and topt.key = 'business_subtype.classic'
            )
          )
          or (
            v_role_key = 'isletme'
            and ac.key in ('website_url', 'service_regions')
            and exists (
              select 1
              from public.user_taxonomy_selections uts
              join public.taxonomy_groups tg on tg.id = uts.group_id
              join public.taxonomy_options topt on topt.id = uts.option_id
              where uts.user_id = v_user.user_id
                and tg.key = 'business_subtype'
                and topt.key = 'business_subtype.online'
            )
          )
          or (
            v_role_key = 'isletme'
            and ac.key in ('founded_year', 'website_url')
            and exists (
              select 1
              from public.user_taxonomy_selections uts
              join public.taxonomy_groups tg on tg.id = uts.group_id
              join public.taxonomy_options topt on topt.id = uts.option_id
              where uts.user_id = v_user.user_id
                and tg.key = 'business_subtype'
                and topt.key = 'business_subtype.startup'
            )
          )
        ),
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
      )
      order by rar.sort_order, ac.label
    ),
    '[]'::jsonb
  )
  into v_attributes
  from public.role_attribute_rules rar
  join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  join public.roles r on r.id = rar.role_id
  left join public.user_profile_attributes upa
    on upa.user_id = v_user.user_id
   and upa.attribute_id = ac.id
  where r.key = v_role_key
    and rar.is_enabled = true
    and (
      ac.key <> 'real_estate_media_urls'
      or exists (
        select 1
        from public.user_taxonomy_selections uts
        join public.taxonomy_groups tg on tg.id = uts.group_id
        join public.taxonomy_options topt on topt.id = uts.option_id
        where uts.user_id = v_user.user_id
          and tg.key = 'consultant_subcategory'
          and topt.key = 'consultant_category.gayrimenkul'
      )
    );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'group_key', tg.key,
        'label', tg.label,
        'description', tg.description,
        'selection_mode', rtr.selection_mode,
        'is_required', rtr.is_required,
        'options',
        (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'key', topt.key,
                'label', topt.label,
                'description', topt.description,
                'is_active', topt.is_active,
                'is_selected', exists (
                  select 1
                  from public.user_taxonomy_selections uts
                  where uts.user_id = v_user.user_id
                    and uts.group_id = tg.id
                    and uts.option_id = topt.id
                )
              )
              order by topt.sort_order, topt.label
            ),
            '[]'::jsonb
          )
          from public.taxonomy_options topt
          where topt.group_id = tg.id
        )
      )
      order by tg.sort_order, tg.label
    ),
    '[]'::jsonb
  )
  into v_taxonomy
  from public.role_taxonomy_rules rtr
  join public.taxonomy_groups tg on tg.id = rtr.group_id and tg.is_active = true
  join public.roles r on r.id = rtr.role_id
  where r.key = v_role_key
    and rtr.is_enabled = true;

  select count(*) filter (
           where (
             rar.is_required
             or (
               v_role_key = 'isletme'
               and ac.key in ('physical_address', 'map_link')
               and exists (
                 select 1
                 from public.user_taxonomy_selections uts
                 join public.taxonomy_groups tg on tg.id = uts.group_id
                 join public.taxonomy_options topt on topt.id = uts.option_id
                 where uts.user_id = v_user.user_id
                   and tg.key = 'business_subtype'
                   and topt.key = 'business_subtype.classic'
               )
             )
             or (
               v_role_key = 'isletme'
               and ac.key in ('website_url', 'service_regions')
               and exists (
                 select 1
                 from public.user_taxonomy_selections uts
                 join public.taxonomy_groups tg on tg.id = uts.group_id
                 join public.taxonomy_options topt on topt.id = uts.option_id
                 where uts.user_id = v_user.user_id
                   and tg.key = 'business_subtype'
                   and topt.key = 'business_subtype.online'
               )
             )
             or (
               v_role_key = 'isletme'
               and ac.key in ('founded_year', 'website_url')
               and exists (
                 select 1
                 from public.user_taxonomy_selections uts
                 join public.taxonomy_groups tg on tg.id = uts.group_id
                 join public.taxonomy_options topt on topt.id = uts.option_id
                 where uts.user_id = v_user.user_id
                   and tg.key = 'business_subtype'
                   and topt.key = 'business_subtype.startup'
               )
             )
           )
         ),
         count(*) filter (where (
           (
             rar.is_required
             or (
               v_role_key = 'isletme'
               and ac.key in ('physical_address', 'map_link')
               and exists (
                 select 1
                 from public.user_taxonomy_selections uts
                 join public.taxonomy_groups tg on tg.id = uts.group_id
                 join public.taxonomy_options topt on topt.id = uts.option_id
                 where uts.user_id = v_user.user_id
                   and tg.key = 'business_subtype'
                   and topt.key = 'business_subtype.classic'
               )
             )
             or (
               v_role_key = 'isletme'
               and ac.key in ('website_url', 'service_regions')
               and exists (
                 select 1
                 from public.user_taxonomy_selections uts
                 join public.taxonomy_groups tg on tg.id = uts.group_id
                 join public.taxonomy_options topt on topt.id = uts.option_id
                 where uts.user_id = v_user.user_id
                   and tg.key = 'business_subtype'
                   and topt.key = 'business_subtype.online'
               )
             )
             or (
               v_role_key = 'isletme'
               and ac.key in ('founded_year', 'website_url')
               and exists (
                 select 1
                 from public.user_taxonomy_selections uts
                 join public.taxonomy_groups tg on tg.id = uts.group_id
                 join public.taxonomy_options topt on topt.id = uts.option_id
                 where uts.user_id = v_user.user_id
                   and tg.key = 'business_subtype'
                   and topt.key = 'business_subtype.startup'
               )
             )
           )
           and (
             (ac.key = 'full_name' and coalesce(v_user.full_name, '') <> '')
             or upa.value_text is not null
             or upa.value_json is not null
           )
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
    and rar.is_enabled = true
    and (
      ac.key <> 'real_estate_media_urls'
      or exists (
        select 1
        from public.user_taxonomy_selections uts
        join public.taxonomy_groups tg on tg.id = uts.group_id
        join public.taxonomy_options topt on topt.id = uts.option_id
        where uts.user_id = v_user.user_id
          and tg.key = 'consultant_subcategory'
          and topt.key = 'consultant_category.gayrimenkul'
      )
    );

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
    'taxonomy_groups', coalesce(v_taxonomy, '[]'::jsonb),
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

grant execute on function public.admin_upsert_role_profile_section_rule(text, text, boolean, boolean, integer) to authenticated;
grant execute on function public.admin_upsert_role_taxonomy_rule(text, text, boolean, boolean, text) to authenticated;
grant execute on function public.admin_set_taxonomy_option_active(text, boolean) to authenticated;
grant execute on function public.update_user_taxonomy_selection(text, text[]) to authenticated;
grant execute on function public.get_current_user_dashboard() to authenticated;
grant execute on function public.get_public_profile_sections(uuid) to authenticated;
grant execute on function public.get_current_user_profile() to authenticated;

commit;
