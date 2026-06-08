begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Restore the auth.users → catalog_items member bridge.
--
-- Background / root cause:
--   /admin/data lists records via admin_list_unified_records, which (since
--   20260608030000) reads ONLY from catalog_items, treating rows with
--   item_type='member' AND linked_user_id IS NOT NULL as member profiles.
--
--   The bridge that created those member rows lived in
--   upsert_profile_from_auth_identity() (20260607020000), invoked by an
--   auth.users trigger. 20260609003000_drop_legacy_tables dropped the profiles
--   / user_profiles tables and cascade-dropped that function + trigger. The
--   replacement trigger (20260609015000) only assigns the 'bireysel' role into
--   user_role_assignments — it never creates the catalog_items member row.
--
--   sync_member_catalog_role_for_user() (run from the user_role_assignments
--   trigger) only UPDATEs an existing member row and still references the
--   dropped public.user_profiles table, so it (a) never inserts a bridge and
--   (b) raises "relation user_profiles does not exist" whenever it executes.
--
--   Net effect: 93 of 107 auth users have no member catalog_items row, so
--   /admin/data shows only the 14 pre-existing bridges.
--
-- Fix (single source of truth = catalog_items):
--   1. Rewrite sync_member_catalog_role_for_user() to be an idempotent UPSERT:
--      create the member bridge if missing, otherwise keep its role in sync.
--      Drop the dead user_profiles fallback. Default visibility = 'public'.
--   2. Have the new-user trigger create the bridge right after role assignment.
--   3. Backfill: ensure every existing auth user has a member bridge.
--
-- Role / attribute / feature / section definitions are unchanged — they stay
-- role-driven (roles, role_attribute_rules, role_feature_flags,
-- role_profile_section_rules). Only the per-user RECORD lives in catalog_items.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Idempotent member-bridge upsert ─────────────────────────────────────

create or replace function public.sync_member_catalog_role_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_key   text;
  v_email      text;
  v_title      text;
  v_slug       text;
  v_item_id    uuid;
begin
  if p_user_id is null then
    return;
  end if;

  -- Resolve the user's role from the role-assignment system (single source).
  select r.key
  into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = p_user_id
  limit 1;

  -- Every authenticated user defaults to 'bireysel' when no explicit role yet.
  v_role_key := coalesce(v_role_key, 'bireysel');

  -- Guard: platform_role_key has a FK to roles(key); skip role if it vanished.
  if not exists (select 1 from public.roles where key = v_role_key) then
    v_role_key := null;
  end if;

  -- Existing bridge?
  select ci.id
  into v_item_id
  from public.catalog_items ci
  where ci.linked_user_id = p_user_id
    and ci.item_type = 'member'
  order by ci.created_at asc
  limit 1;

  if v_item_id is not null then
    -- Keep the existing member row's role in sync (original behaviour).
    update public.catalog_items ci
    set
      platform_role_key = v_role_key,
      attributes = coalesce(ci.attributes, '{}'::jsonb)
                   || jsonb_build_object('platform_role_key', v_role_key),
      updated_at = now()
    where ci.id = v_item_id
      and (
        ci.platform_role_key is distinct from v_role_key
        or coalesce(ci.attributes ->> 'platform_role_key', '') is distinct from coalesce(v_role_key, '')
      );

    -- Ensure an owner membership exists.
    insert into public.catalog_item_memberships (item_id, user_id, role, status)
    values (v_item_id, p_user_id, 'owner', 'active')
    on conflict (item_id, user_id, role) do update
    set status = 'active', updated_at = now();

    return;
  end if;

  -- No bridge yet → create one. Title falls back to the email local-part.
  select au.email into v_email from auth.users au where au.id = p_user_id;
  v_title := coalesce(
    nullif(btrim(split_part(coalesce(v_email, ''), '@', 1)), ''),
    'CorteQS Üyesi'
  );

  v_slug := 'member-' || substr(replace(p_user_id::text, '-', ''), 1, 16);
  if exists (
    select 1 from public.catalog_items ci
    where ci.slug = v_slug and ci.linked_user_id is distinct from p_user_id
  ) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.catalog_items (
    item_type,
    slug,
    title,
    status,
    visibility,
    verification_status,
    linked_user_id,
    created_by_user_id,
    platform_role_key,
    attributes,
    published_at
  )
  values (
    'member',
    v_slug,
    v_title,
    'published',
    'public',
    'claimed',
    p_user_id,
    p_user_id,
    v_role_key,
    jsonb_build_object('bridge_source', 'auth_member_sync', 'platform_role_key', v_role_key),
    now()
  )
  on conflict (slug) do nothing
  returning id into v_item_id;

  -- Race / pre-existing slug fallback.
  if v_item_id is null then
    select ci.id into v_item_id
    from public.catalog_items ci
    where ci.linked_user_id = p_user_id and ci.item_type = 'member'
    order by ci.created_at asc
    limit 1;
  end if;

  if v_item_id is not null then
    insert into public.catalog_item_memberships (item_id, user_id, role, status)
    values (v_item_id, p_user_id, 'owner', 'active')
    on conflict (item_id, user_id, role) do update
    set status = 'active', updated_at = now();
  end if;
end;
$$;

comment on function public.sync_member_catalog_role_for_user(uuid) is
  'Idempotently ensures a member catalog_items bridge exists for the auth user '
  'and keeps its platform_role_key in sync with user_role_assignments. '
  'catalog_items is the single source of truth for member records.';

-- ─── 2. New-user trigger: assign role AND create the bridge ──────────────────

create or replace function public.handle_new_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bireysel_role_id uuid;
begin
  select id into v_bireysel_role_id
  from public.roles
  where key = 'bireysel' and is_active = true
  limit 1;

  if v_bireysel_role_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (new.id, v_bireysel_role_id)
    on conflict (user_id) do nothing;
  end if;

  -- Create / refresh the catalog_items member bridge so the user is visible
  -- in /admin/data and the member directory immediately.
  perform public.sync_member_catalog_role_for_user(new.id);

  return new;
end;
$$;

-- Trigger object already exists (on_auth_user_created_assign_role); the
-- CREATE OR REPLACE above updates its body. No trigger DDL change needed.

-- ─── 3. Backfill every existing auth user ───────────────────────────────────

do $$
declare
  r record;
begin
  for r in select id from auth.users loop
    perform public.sync_member_catalog_role_for_user(r.id);
  end loop;
end
$$;

commit;
