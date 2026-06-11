-- Backfill platform_role_key for roleless catalog items
--
-- get_catalog_item_profile resolves editable attributes solely from
-- catalog_items.platform_role_key — its fallback (catalog_item_types.linked_role_key)
-- died when catalog_item_types was dropped in the AFS rebuild. Items without a
-- role key therefore render an empty editor ("düzenlenebilir attribute bulunamadı").
--
-- Affected (24 items, audited live on 2026-06-11):
--   * 14 person_profile items (pre-rebuild, created 2026-06-04): take the
--     owner's assigned role from user_role_assignments (12x User_DiasporaMember,
--     2x Admin_SuperAdmin).
--   * 10 community_group items: Organization_DigitalCommunity — the entity-side
--     role for digital communities (Community_* keys are person/admin roles).
--
-- Also mirrors the assignment into catalog_item_roles so these items match the
-- member/advisor convention (one primary role row per item).

-- 1) person_profile → owner's assigned role
update public.catalog_items ci
set platform_role_key = r.key,
    updated_at = now()
from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
where ci.item_type = 'person_profile'
  and ci.platform_role_key is null
  and ci.deleted_at is null
  and ura.user_id = ci.created_by;

-- 2) community_group → Organization_DigitalCommunity
update public.catalog_items
set platform_role_key = 'Organization_DigitalCommunity',
    updated_at = now()
where item_type = 'community_group'
  and platform_role_key is null
  and deleted_at is null;

-- 3) Mirror into catalog_item_roles (unique on catalog_item_id + role_id)
insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
select ci.id, r.id, true
from public.catalog_items ci
join public.roles r
  on r.key = ci.platform_role_key
where ci.deleted_at is null
  and not exists (
    select 1
    from public.catalog_item_roles cir
    where cir.catalog_item_id = ci.id
  );
