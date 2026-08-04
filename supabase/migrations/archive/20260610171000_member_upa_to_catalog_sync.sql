-- Bridge user_profile_attributes -> catalog_item_attribute_values for members.
--
-- Problem: the public profile RPC (get_catalog_item_public_page_v2) reads
-- attribute values ONLY from catalog_item_attribute_values (item-scoped), while
-- the member self-service editor (/profile -> update_profile_attribute) writes
-- ONLY user_profile_attributes (user-scoped). Without a bridge, everything a
-- member fills in on /profile stays invisible on /directory/catalog/member-*.
--
-- Fix:
--   1. Trigger on user_profile_attributes: after insert/update, mirror the row
--      onto the user's member catalog item (last write wins).
--   2. One-time backfill of existing user_profile_attributes onto member items
--      (only fills empty item values - item-specific edits are never clobbered).
--
-- Deletes are intentionally NOT mirrored: an item-side value may be curated
-- independently (e.g. by an admin); losing it on a user-side delete would be
-- surprising. The reverse direction (catalog editor -> upa) is handled inside
-- update_catalog_item_attribute (see 20260610172000).
--
-- Idempotent: create or replace + drop trigger if exists + guarded backfill.

begin;

create or replace function public.sync_member_attribute_from_user_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_item_id uuid;
begin
  if new.user_id is null then
    return new;
  end if;

  select ci.id
  into v_item_id
  from public.catalog_items ci
  where ci.linked_user_id = new.user_id
    and ci.item_type = 'member'
    and ci.deleted_at is null
  order by ci.created_at asc
  limit 1;

  if v_item_id is null then
    return new;
  end if;

  insert into public.catalog_item_attribute_values (
    item_id, attribute_id, value_text, value_json,
    visibility, approval_status, approved_by, approved_at, updated_at
  )
  values (
    v_item_id, new.attribute_id, new.value_text, new.value_json,
    new.visibility, new.approval_status, new.approved_by, new.approved_at, now()
  )
  on conflict (item_id, attribute_id) do update
  set
    value_text = excluded.value_text,
    value_json = excluded.value_json,
    visibility = excluded.visibility,
    approval_status = excluded.approval_status,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = now();

  return new;
end;
$$;

comment on function public.sync_member_attribute_from_user_profile() is
  'Mirrors user_profile_attributes rows onto the user''s member catalog item so '
  'the public profile (catalog_item_attribute_values) reflects /profile edits.';

drop trigger if exists trg_sync_member_attribute_from_user_profile on public.user_profile_attributes;
create trigger trg_sync_member_attribute_from_user_profile
after insert or update on public.user_profile_attributes
for each row
execute function public.sync_member_attribute_from_user_profile();

-- One-time backfill: copy existing user attribute values onto member items.
-- Only fills item values that are currently empty - never overwrites.
insert into public.catalog_item_attribute_values (
  item_id, attribute_id, value_text, value_json,
  visibility, approval_status, approved_by, approved_at, updated_at
)
select
  ci.id, upa.attribute_id, upa.value_text, upa.value_json,
  upa.visibility, upa.approval_status, upa.approved_by, upa.approved_at, now()
from public.user_profile_attributes upa
join public.catalog_items ci
  on ci.linked_user_id = upa.user_id
 and ci.item_type = 'member'
 and ci.deleted_at is null
on conflict (item_id, attribute_id) do update
set
  value_text = excluded.value_text,
  value_json = excluded.value_json,
  visibility = excluded.visibility,
  approval_status = excluded.approval_status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  updated_at = now()
where catalog_item_attribute_values.value_text is null
  and catalog_item_attribute_values.value_json is null;

commit;
