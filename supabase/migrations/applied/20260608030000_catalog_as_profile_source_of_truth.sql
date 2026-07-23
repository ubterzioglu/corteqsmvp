begin;

-- Make catalog_items the single source of truth for member role/profile data.
--
-- 1. When catalog_items.platform_role_key changes, keep user_profiles.profile_type in sync
--    (the reverse direction already exists via sync_member_catalog_role_for_user).
-- 2. Add deprecated_at to user_profiles so tooling can detect the table is superseded
--    without dropping it (preserves backward compatibility for any legacy reads).

-- ─── 1. Reverse sync trigger: catalog_items → user_profiles ─────────────────

create or replace function public.sync_user_profile_role_from_catalog()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.item_type <> 'member' then
    return new;
  end if;

  if new.linked_user_id is null then
    return new;
  end if;

  if new.platform_role_key is not distinct from old.platform_role_key then
    return new;
  end if;

  update public.user_profiles
  set
    profile_type = new.platform_role_key,
    updated_at   = now()
  where user_id = new.linked_user_id
    and profile_type is distinct from new.platform_role_key;

  return new;
end;
$$;

drop trigger if exists trg_sync_user_profile_role_from_catalog on public.catalog_items;
create trigger trg_sync_user_profile_role_from_catalog
after update of platform_role_key on public.catalog_items
for each row
execute function public.sync_user_profile_role_from_catalog();

-- ─── 2. Mark user_profiles as superseded ────────────────────────────────────

alter table public.user_profiles
  add column if not exists deprecated_at timestamptz;

comment on column public.user_profiles.deprecated_at is
  'Set when this table is superseded by catalog_items (item_type=member + linked_user_id). '
  'Reads should prefer catalog_items; this table is kept for backward compatibility only.';

comment on table public.user_profiles is
  'SUPERSEDED by catalog_items (item_type=member). '
  'Kept for backward compatibility. New code should read/write via catalog_items + linked_user_id.';

-- ─── 3. One-time backfill: align user_profiles.profile_type from catalog ────
-- For any member catalog item where platform_role_key disagrees with
-- user_profiles.profile_type, treat catalog as authoritative and update profiles.

update public.user_profiles up
set
  profile_type = ci.platform_role_key,
  updated_at   = now()
from public.catalog_items ci
where ci.linked_user_id = up.user_id
  and ci.item_type = 'member'
  and ci.platform_role_key is not null
  and ci.platform_role_key is distinct from up.profile_type;

commit;
