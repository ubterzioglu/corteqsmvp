begin;

-- ============================================================
-- ADIM 1: Tüm aktif roller için directory.visible = true
-- role_feature_flags (yeni sistem)
-- ============================================================
insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select r.id, 'directory.visible', true, null
from public.roles r
where r.is_active = true
on conflict (role_id, feature_key) do update
set
  is_enabled = true,
  updated_at = now();

-- role_feature_defaults (eski compat layer)
insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
select r.key, 'directory.visible', true
from public.roles r
where r.is_active = true
on conflict (profile_type, feature_key) do update
set is_enabled = true;

-- ============================================================
-- ADIM 2: profiles.directory_opt_in mass update
-- ============================================================
update public.profiles p
set
  directory_opt_in = true,
  updated_at = now()
where coalesce(p.directory_opt_in, false) = false;

-- ============================================================
-- ADIM 3: catalog_items member kayıtlarını published + public
-- ============================================================
update public.catalog_items
set
  status = 'published',
  visibility = 'public',
  updated_at = now()
where item_type = 'member'
  and linked_user_id is not null
  and (
    status is distinct from 'published'
    or visibility is distinct from 'public'
  );

-- ============================================================
-- ADIM 4: catalog_search_documents — member item rebuild
-- ============================================================
do $$
declare
  v_item_id uuid;
begin
  for v_item_id in
    select ci.id
    from public.catalog_items ci
    where ci.item_type = 'member'
      and ci.linked_user_id is not null
      and ci.status = 'published'
      and ci.visibility = 'public'
  loop
    perform public.catalog_rebuild_search_document(v_item_id);
  end loop;
end;
$$;

-- ============================================================
-- ADIM 5: role_attribute_rules — temel attribute backfill
-- Tüm aktif roller için ortak attribute kuralları
-- ============================================================
insert into public.role_attribute_rules (
  role_id, attribute_id,
  is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change,
  sort_order
)
select
  r.id,
  ac.id,
  true,
  case when ac.key = 'full_name' then true else false end,
  true,
  true,
  case when ac.key = 'full_name' then false else true end,
  false,
  ac.sort_order
from public.roles r
cross join public.attribute_catalog ac
where r.is_active = true
  and ac.is_active = true
  and ac.key in (
    'full_name',
    'bio_short',
    'city',
    'country',
    'profile_photo_url',
    'interests',
    'expertise_area',
    'linkedin_url',
    'website_url'
  )
on conflict (role_id, attribute_id) do update
set
  is_enabled = true,
  is_public_default = excluded.is_public_default,
  user_can_edit = excluded.user_can_edit,
  updated_at = now();

-- Rol-spesifik: business_category → isletme
insert into public.role_attribute_rules (
  role_id, attribute_id,
  is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change,
  sort_order
)
select r.id, ac.id, true, false, true, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key = 'business_category' and ac.is_active = true
where r.key = 'isletme' and r.is_active = true
on conflict (role_id, attribute_id) do update
set is_enabled = true, updated_at = now();

-- Rol-spesifik: organization_type → kurulus-dernek
insert into public.role_attribute_rules (
  role_id, attribute_id,
  is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change,
  sort_order
)
select r.id, ac.id, true, false, true, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key = 'organization_type' and ac.is_active = true
where r.key = 'kurulus-dernek' and r.is_active = true
on conflict (role_id, attribute_id) do update
set is_enabled = true, updated_at = now();

-- Rol-spesifik: main_platform → blogger-vlogger-youtuber
insert into public.role_attribute_rules (
  role_id, attribute_id,
  is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change,
  sort_order
)
select r.id, ac.id, true, false, true, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key = 'main_platform' and ac.is_active = true
where r.key = 'blogger-vlogger-youtuber' and r.is_active = true
on conflict (role_id, attribute_id) do update
set is_enabled = true, updated_at = now();

-- Rol-spesifik: ambassador_city → sehir-elcisi
insert into public.role_attribute_rules (
  role_id, attribute_id,
  is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change,
  sort_order
)
select r.id, ac.id, true, false, true, true, true, false, ac.sort_order
from public.roles r
join public.attribute_catalog ac on ac.key = 'ambassador_city' and ac.is_active = true
where r.key = 'sehir-elcisi' and r.is_active = true
on conflict (role_id, attribute_id) do update
set is_enabled = true, updated_at = now();

-- ============================================================
-- ADIM 6: role_profile_section_rules — eksik section backfill
-- ============================================================
with section_rules(role_key, section_key, sort_order) as (
  values
    ('sehir-elcisi',    'detail.iletisim_linkleri',  130),
    ('bireysel',        'detail.iletisim_linkleri',  130),
    ('sehir-elcisi',    'detail.taxonomy_etiketleri', 120),
    ('bireysel',        'detail.taxonomy_etiketleri', 120),
    ('kurulus-dernek',  'detail.taxonomy_etiketleri', 120)
)
insert into public.role_profile_section_rules (role_id, section_id, is_enabled, requires_approval, sort_order)
select r.id, psc.id, true, false, sr.sort_order
from section_rules sr
join public.roles r on r.key = sr.role_key and r.is_active = true
join public.profile_section_catalog psc on psc.key = sr.section_key and psc.is_active = true
on conflict (role_id, section_id) do update
set
  is_enabled = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ============================================================
-- ADIM 7: user_profile_attributes — visibility + approval backfill
-- is_public_default = true olan attribute'lar için public + approved
-- ============================================================
update public.user_profile_attributes upa
set
  visibility = 'public',
  approval_status = 'approved',
  approved_at = coalesce(upa.approved_at, now()),
  updated_at = now()
where (
    upa.visibility is distinct from 'public'
    or upa.approval_status is distinct from 'approved'
  )
  and exists (
    select 1
    from public.role_attribute_rules rar
    join public.roles r on r.id = rar.role_id
    join public.user_profiles up on up.profile_type = r.key and up.user_id = upa.user_id
    where rar.attribute_id = upa.attribute_id
      and rar.is_public_default = true
      and rar.is_enabled = true
  );

commit;
