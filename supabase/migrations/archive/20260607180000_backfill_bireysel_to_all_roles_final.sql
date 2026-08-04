begin;

-- Final idempotent backfill: copy bireysel baseline rules to ALL active roles
-- that do not yet have any role_attribute_rules entries.
-- Roles that already have custom rules (e.g. Healthcare_Doctor from migration
-- 20260607150000) are NOT overwritten — on conflict do nothing for those.
--
-- Also ensures role_feature_flags and role_profile_section_rules are seeded
-- for roles that currently have zero entries in those tables.

-- ── 1. Widen feature_catalog scope: bireysel-scoped → global ────────────────
with source_role as (
  select id, key from public.roles where key = 'bireysel' limit 1
),
source_features as (
  select distinct fc.key as feature_key
  from source_role sr
  join public.feature_catalog fc on true
  left join public.role_feature_flags rff
    on rff.role_id = sr.id and rff.feature_key = fc.key
  left join public.role_feature_defaults rfd
    on rfd.profile_type = sr.key and rfd.feature_key = fc.key
  where coalesce(rff.is_enabled, rfd.is_enabled, false) = true
)
update public.feature_catalog fc
set scope_role = '*', updated_at = now()
where fc.scope_role = 'bireysel'
  and fc.key in (select feature_key from source_features);

-- ── 2. role_feature_defaults for every active role ──────────────────────────
with source_role as (
  select id, key from public.roles where key = 'bireysel' limit 1
),
target_roles as (
  select id, key from public.roles where is_active = true and key <> 'bireysel'
),
source_features as (
  select distinct fc.key as feature_key
  from source_role sr
  join public.feature_catalog fc on true
  left join public.role_feature_flags rff
    on rff.role_id = sr.id and rff.feature_key = fc.key
  left join public.role_feature_defaults rfd
    on rfd.profile_type = sr.key and rfd.feature_key = fc.key
  where coalesce(rff.is_enabled, rfd.is_enabled, false) = true
)
insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
select tr.key, sf.feature_key, true
from target_roles tr cross join source_features sf
on conflict (profile_type, feature_key) do update
  set is_enabled = excluded.is_enabled;

-- ── 3. role_feature_flags for every active role ─────────────────────────────
with source_role as (
  select id, key from public.roles where key = 'bireysel' limit 1
),
target_roles as (
  select id, key from public.roles where is_active = true and key <> 'bireysel'
),
source_features as (
  select distinct fc.key as feature_key
  from source_role sr
  join public.feature_catalog fc on true
  left join public.role_feature_flags rff
    on rff.role_id = sr.id and rff.feature_key = fc.key
  left join public.role_feature_defaults rfd
    on rfd.profile_type = sr.key and rfd.feature_key = fc.key
  where coalesce(rff.is_enabled, rfd.is_enabled, false) = true
)
insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select tr.id, sf.feature_key, true, null
from target_roles tr cross join source_features sf
on conflict (role_id, feature_key) do update
  set is_enabled = excluded.is_enabled,
      updated_by = excluded.updated_by,
      updated_at = now();

-- ── 4. role_attribute_rules for every active role ───────────────────────────
with source_role as (
  select id from public.roles where key = 'bireysel' limit 1
),
target_roles as (
  select id from public.roles where is_active = true and key <> 'bireysel'
),
source_attribute_rules as (
  select
    rar.attribute_id,
    rar.is_enabled,
    rar.is_required,
    rar.is_public_default,
    rar.user_can_edit,
    rar.user_can_hide,
    rar.requires_admin_approval_on_change,
    rar.sort_order
  from public.role_attribute_rules rar
  join source_role sr on sr.id = rar.role_id
  join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  where rar.is_enabled = true
)
insert into public.role_attribute_rules (
  role_id, attribute_id,
  is_enabled, is_required, is_public_default,
  user_can_edit, user_can_hide, requires_admin_approval_on_change,
  sort_order
)
select
  tr.id,
  sar.attribute_id,
  sar.is_enabled,
  sar.is_required,
  sar.is_public_default,
  sar.user_can_edit,
  sar.user_can_hide,
  sar.requires_admin_approval_on_change,
  sar.sort_order
from target_roles tr cross join source_attribute_rules sar
on conflict (role_id, attribute_id) do update
  set is_enabled                        = excluded.is_enabled,
      is_required                       = excluded.is_required,
      is_public_default                 = excluded.is_public_default,
      user_can_edit                     = excluded.user_can_edit,
      user_can_hide                     = excluded.user_can_hide,
      requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
      sort_order                        = excluded.sort_order,
      updated_at                        = now();

-- ── 5. role_profile_section_rules for every active role ─────────────────────
with source_role as (
  select id from public.roles where key = 'bireysel' limit 1
),
target_roles as (
  select id from public.roles where is_active = true and key <> 'bireysel'
),
source_section_rules as (
  select
    rpsr.section_id,
    rpsr.is_enabled,
    rpsr.requires_approval,
    rpsr.sort_order
  from public.role_profile_section_rules rpsr
  join source_role sr on sr.id = rpsr.role_id
  join public.profile_section_catalog psc
    on psc.id = rpsr.section_id and psc.is_active = true
  where rpsr.is_enabled = true
)
insert into public.role_profile_section_rules (
  role_id, section_id, is_enabled, requires_approval, sort_order
)
select
  tr.id,
  ssr.section_id,
  ssr.is_enabled,
  ssr.requires_approval,
  ssr.sort_order
from target_roles tr cross join source_section_rules ssr
on conflict (role_id, section_id) do update
  set is_enabled        = excluded.is_enabled,
      requires_approval = excluded.requires_approval,
      sort_order        = excluded.sort_order,
      updated_at        = now();

commit;
