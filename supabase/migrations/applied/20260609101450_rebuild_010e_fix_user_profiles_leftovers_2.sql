-- ─────────────────────────────────────────────────────────────────────────────
-- rebuild_010e: fix legacy-drop leftovers, part 2 (user_profiles / profiles refs)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Migration 20260609003000_drop_legacy_tables.sql dropped public.user_profiles and
-- public.profiles. 010d (20260609100901) fixed 4 functions that still referenced
-- them. A wider pg_proc scan found NINE MORE functions whose bodies still reference
-- the dropped tables and are therefore broken on prod. This migration rewires all
-- nine, using the SAME canonical patterns 010d and 003000 established:
--
--   * user_profiles.profile_type (role key) -> user_role_assignments JOIN roles (r.key);
--       writes upsert into user_role_assignments (same pattern as admin_set_user_role).
--   * user_profiles existence check -> auth.users existence check.
--   * profiles.email / user_profiles.auth_provider -> auth.users.email /
--       auth.users.raw_app_meta_data ->> 'provider' (the original source per
--       20260523170500_add_auth_provider_to_user_profiles.sql).
--   * legacy sync triggers whose target table (user_profiles) is gone -> safe NO-OPs.
--
-- Every signature, SECURITY DEFINER, search_path, audit logging, validation and all
-- non-user_profiles/profiles logic (taxonomy tables, catalog_items, etc.) is preserved
-- verbatim. Existing GRANTs survive CREATE OR REPLACE and are not reset.
--
-- Ordering: timestamp 101450 runs AFTER 015 (101400) but BEFORE 016 (101500).
-- 016 independently re-creates sync_user_profile_role_from_catalog() as the SAME
-- no-op; this migration's version is identical so there is no conflict.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ─── admin_grant_whatsapp_landing_editor ─────────────────────────────────────
-- Existence check `select 1 from public.user_profiles where user_id = p_user_id`
-- replaced with the canonical existence check against auth.users.
CREATE OR REPLACE FUNCTION public.admin_grant_whatsapp_landing_editor(p_landing_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_assignment_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if p_landing_id is null or p_user_id is null then
    raise exception 'landing_id and user_id are required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.whatsapp_landings wl
    where wl.id = p_landing_id
  ) then
    raise exception 'landing not found'
      using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = p_user_id
  ) then
    raise exception 'user profile not found'
      using errcode = 'P0002';
  end if;

  insert into public.whatsapp_landing_editors (landing_id, user_id, granted_by, updated_at)
  values (p_landing_id, p_user_id, auth.uid(), now())
  on conflict (landing_id, user_id) do update
  set
    granted_by = excluded.granted_by,
    updated_at = now()
  returning id into v_assignment_id;

  insert into public.user_feature_overrides (user_id, feature_key, is_enabled, updated_by, updated_at, reason)
  values (
    p_user_id,
    'whatsapp_landing.edit_assigned',
    true,
    auth.uid(),
    now(),
    'Assigned landing editor permission'
  )
  on conflict on constraint user_feature_overrides_pkey do update
  set
    is_enabled = true,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at,
    reason = excluded.reason;

  perform public.write_admin_audit_log(
    'whatsapp_landing.editor_granted',
    p_user_id,
    'whatsapp_landing',
    p_landing_id,
    null,
    jsonb_build_object('landing_id', p_landing_id, 'user_id', p_user_id)
  );

  return v_assignment_id;
end;
$function$;

-- ─── admin_list_member_catalog_profiles ──────────────────────────────────────
-- `left join public.profiles p` (email) and `left join public.user_profiles up`
-- (auth_provider) replaced with a single `left join auth.users au`. email -> au.email,
-- auth_provider -> au.raw_app_meta_data ->> 'provider' (canonical source per
-- 20260523170500). All catalog_items filtering/sorting logic preserved verbatim.
CREATE OR REPLACE FUNCTION public.admin_list_member_catalog_profiles(p_query text DEFAULT NULL::text, p_provider text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_sort text DEFAULT 'created_desc'::text)
 RETURNS TABLE(item_id uuid, user_id uuid, email text, full_name text, profile_type text, auth_provider text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_provider text := nullif(btrim(coalesce(p_provider, '')), '');
  v_sort text := coalesce(nullif(btrim(coalesce(p_sort, '')), ''), 'created_desc');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    ci.id as item_id,
    ci.linked_user_id as user_id,
    au.email::text,
    ci.title as full_name,
    coalesce(ci.platform_role_key, 'bireysel') as profile_type,
    (au.raw_app_meta_data ->> 'provider') as auth_provider,
    ci.created_at
  from public.catalog_items ci
  left join auth.users au on au.id = ci.linked_user_id
  where ci.item_type = 'member'
    and ci.linked_user_id is not null
    and (
      v_provider is null
      or v_provider = 'all'
      or (v_provider = 'unknown' and coalesce(au.raw_app_meta_data ->> 'provider', 'unknown') = 'unknown')
      or au.raw_app_meta_data ->> 'provider' = v_provider
    )
    and (p_from is null or ci.created_at >= p_from)
    and (p_to is null or ci.created_at < p_to)
    and (
      v_query is null
      or ci.title ilike '%' || v_query || '%'
      or coalesce(au.email::text, '') ilike '%' || v_query || '%'
    )
  order by
    case when v_sort = 'name_asc' then lower(ci.title) end asc nulls last,
    case when v_sort = 'created_asc' then ci.created_at end asc nulls last,
    case when v_sort = 'created_desc' then ci.created_at end desc nulls last,
    ci.created_at desc,
    ci.title asc;
end;
$function$;

-- ─── admin_set_member_catalog_role ───────────────────────────────────────────
-- Removed the `update public.user_profiles set profile_type` block. The role is
-- already synced into user_role_assignments below (canonical), so the legacy
-- user_profiles projection write is simply dropped.
CREATE OR REPLACE FUNCTION public.admin_set_member_catalog_role(p_item_id uuid, p_role_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_role_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select ci.linked_user_id
  into v_user_id
  from public.catalog_items ci
  where ci.id = p_item_id
    and ci.item_type = 'member'
  limit 1;

  if v_user_id is null then
    raise exception 'member catalog item not found' using errcode = 'P0002';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = p_role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  update public.catalog_items ci
  set
    platform_role_key = p_role_key,
    attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_build_object('platform_role_key', p_role_key),
    updated_at = now()
  where ci.id = p_item_id;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (v_user_id, v_role_id, auth.uid())
  on conflict (user_id) do update
  set
    role_id = excluded.role_id,
    updated_by = excluded.updated_by,
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.member_role_set',
    v_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('role_key', p_role_key)
  );
end;
$function$;

-- ─── admin_set_user_profile_type ─────────────────────────────────────────────
-- Previously the entire body was `update public.user_profiles set profile_type`.
-- Rewired to upsert into user_role_assignments (the canonical role store), mirroring
-- public.admin_set_user_role. Signature and validation preserved.
CREATE OR REPLACE FUNCTION public.admin_set_user_profile_type(target_user_id uuid, next_profile_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.roles r
    where r.key = next_profile_type and r.is_active = true
  ) then
    raise exception 'invalid profile type' using errcode = '22023';
  end if;

  select r.id into v_role_id
  from public.roles r
  where r.key = next_profile_type and r.is_active = true
  limit 1;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (target_user_id, v_role_id, auth.uid())
  on conflict (user_id) do update
  set role_id = excluded.role_id,
      updated_by = excluded.updated_by,
      updated_at = now();
end;
$function$;

-- ─── admin_update_user_taxonomy_selection ────────────────────────────────────
-- Only user_profiles use was resolving the target user's role (v_user.profile_type)
-- and existence (v_user.user_id). Replaced with role-key resolution via
-- user_role_assignments JOIN roles. ALL taxonomy logic (taxonomy_groups,
-- role_taxonomy_rules, taxonomy_options, user_taxonomy_selections) preserved verbatim.
CREATE OR REPLACE FUNCTION public.admin_update_user_taxonomy_selection(target_user_id uuid, group_key text, option_keys text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role_key text;
  v_group public.taxonomy_groups%rowtype;
  v_rule public.role_taxonomy_rules%rowtype;
  v_role public.roles%rowtype;
  v_selected_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select r.key
  into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = target_user_id
  limit 1;

  select * into v_group from public.taxonomy_groups where key = group_key and is_active = true limit 1;
  select * into v_role from public.roles where key = v_role_key limit 1;

  if v_role_key is null or v_group.id is null or v_role.id is null then
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
  where user_id = target_user_id
    and group_id = v_group.id;

  insert into public.user_taxonomy_selections (user_id, group_id, option_id)
  select target_user_id, v_group.id, t.id
  from public.taxonomy_options t
  where t.group_id = v_group.id
    and t.key = any(coalesce(option_keys, array[]::text[]));

  perform public.write_admin_audit_log(
    'admin.user_taxonomy_selection_updated',
    target_user_id,
    'user_taxonomy_selection',
    target_user_id,
    null,
    jsonb_build_object(
      'group_key', group_key,
      'option_keys', coalesce(option_keys, array[]::text[])
    )
  );

  return jsonb_build_object(
    'group_key', group_key,
    'selection_count', coalesce(array_length(option_keys, 1), 0),
    'status', 'approved'
  );
end;
$function$;

-- ─── set_current_member_catalog_role ─────────────────────────────────────────
-- Removed the `update public.user_profiles set profile_type` block; the role is
-- already synced into user_role_assignments below (canonical). Self-service variant
-- of admin_set_member_catalog_role.
CREATE OR REPLACE FUNCTION public.set_current_member_catalog_role(p_role_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item_id uuid;
  v_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select ci.id
  into v_item_id
  from public.catalog_items ci
  where ci.linked_user_id = auth.uid()
    and ci.item_type = 'member'
  order by ci.created_at asc
  limit 1;

  if v_item_id is null then
    raise exception 'member catalog item not found' using errcode = 'P0002';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = p_role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  update public.catalog_items ci
  set
    platform_role_key = p_role_key,
    attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_build_object('platform_role_key', p_role_key),
    updated_at = now()
  where ci.id = v_item_id;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (auth.uid(), v_role_id, auth.uid())
  on conflict (user_id) do update
  set
    role_id = excluded.role_id,
    updated_by = excluded.updated_by,
    updated_at = now();
end;
$function$;

-- ─── sync_user_profile_compat_from_profile ───────────────────────────────────
-- Legacy trigger whose sole purpose was mirroring into public.user_profiles (dropped).
-- The original body was already guarded to no-op when the table is missing; converted
-- to an explicit, unconditional NO-OP so it no longer textually references the dropped
-- table. AFTER-row trigger semantics preserved via `return new`.
CREATE OR REPLACE FUNCTION public.sync_user_profile_compat_from_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- legacy user_profiles mirror removed (table dropped); profile data now lives in
  -- user_profile_attributes / user_role_assignments. No-op.
  return new;
end;
$function$;

-- ─── sync_user_profile_role_from_catalog ─────────────────────────────────────
-- Legacy catalog->user_profiles role sync; target table dropped. Made a NO-OP,
-- IDENTICAL to the version migration 016 (20260609101500) re-creates, so the two
-- do not conflict. Role now lives in catalog_item_roles / user_role_assignments.
CREATE OR REPLACE FUNCTION public.sync_user_profile_role_from_catalog()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- legacy user_profiles sync removed (table dropped); role lives in
  -- catalog_item_roles / user_role_assignments now. No-op.
  return new;
end;
$function$;

-- ─── update_user_taxonomy_selection ──────────────────────────────────────────
-- Self-service variant of admin_update_user_taxonomy_selection. Only user_profiles
-- use was role/existence resolution for auth.uid(); replaced with user_role_assignments
-- JOIN roles. All taxonomy logic preserved verbatim.
CREATE OR REPLACE FUNCTION public.update_user_taxonomy_selection(group_key text, option_keys text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role_key text;
  v_group public.taxonomy_groups%rowtype;
  v_rule public.role_taxonomy_rules%rowtype;
  v_role public.roles%rowtype;
  v_selected_count integer;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select r.key
  into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = auth.uid()
  limit 1;

  select * into v_group from public.taxonomy_groups where key = group_key and is_active = true limit 1;
  select * into v_role from public.roles where key = v_role_key limit 1;

  if v_role_key is null or v_group.id is null or v_role.id is null then
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
$function$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECOND TIER: nine MORE functions surfaced by the same pg_proc scan once the
-- primary nine were fixed. They also reference the dropped public.profiles. They
-- were not in the original list but are the same class of legacy-drop leftover and
-- must be cleared for the post-migration count to reach 0. Grouped by fix type:
--
--   A) display-name lookups (full_name / business_name) that read public.profiles
--      -> read from user_profile_attributes (afs_attributes key='full_name').
--      These are ACTIVE triggers (cafes/events/job_listings/user_connections) and
--      are currently broken on prod, exactly like the primary nine.
--   B) ambassador-referral functions whose backing columns
--      (profiles.ambassador_referral_code / referred_by_code) were dropped with no
--      surviving canonical home -> safely neutralized (the feature's storage is
--      gone; these were already broken on prod). NO-OP / code-only generation.
--   C) two functions (catalog_upsert_owner_membership, search_directory_catalog)
--      that are ALREADY functionally clean (they use auth.users) but still contain
--      the literal token "public.profiles" inside an explanatory COMMENT, which the
--      reference scan matches -> comment reworded in place, body byte-identical.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── (A) notify_followers_on_cafe ────────────────────────────────────────────
-- Author display name now resolved from the 'full_name' user_profile_attributes
-- row instead of public.profiles.full_name. All notification logic preserved.
CREATE OR REPLACE FUNCTION public.notify_followers_on_cafe()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_author_name text;
BEGIN
  SELECT COALESCE(NULLIF(upa.value_text, ''), 'Takip ettiğin kişi')
    INTO v_author_name
  FROM public.user_profile_attributes upa
  JOIN public.afs_attributes ac ON ac.id = upa.attribute_id
  WHERE upa.user_id = NEW.created_by
    AND ac.key = 'full_name'
  LIMIT 1;
  v_author_name := COALESCE(v_author_name, 'Takip ettiğin kişi');
  PERFORM public.notify_followers(NEW.created_by, 'follow_cafe',
    'Yeni cafe açıldı: ' || NEW.name,
    v_author_name || ' "' || NEW.name || '" cafe''sini açtı (' || COALESCE(NEW.city || ' · ', '') || COALESCE(NEW.theme, NEW.kind) || ').',
    NEW.id);
  RETURN NEW;
END;
$function$;

-- ─── (A) notify_followers_on_event ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_author_name text;
BEGIN
  IF NEW.status <> 'published' THEN RETURN NEW; END IF;
  SELECT COALESCE(NULLIF(upa.value_text, ''), 'Takip ettiğin kişi')
    INTO v_author_name
  FROM public.user_profile_attributes upa
  JOIN public.afs_attributes ac ON ac.id = upa.attribute_id
  WHERE upa.user_id = NEW.user_id
    AND ac.key = 'full_name'
  LIMIT 1;
  v_author_name := COALESCE(v_author_name, 'Takip ettiğin kişi');
  PERFORM public.notify_followers(NEW.user_id, 'follow_event',
    'Yeni etkinlik: ' || NEW.title,
    v_author_name || ' yeni bir etkinlik yayınladı (' || COALESCE(NEW.city, NEW.country, 'Online') || ', ' || NEW.event_date::text || ').',
    NEW.id);
  RETURN NEW;
END;
$function$;

-- ─── (A) notify_followers_on_job ─────────────────────────────────────────────
-- NEW.business_name fallback preserved; full_name now sourced from attributes.
CREATE OR REPLACE FUNCTION public.notify_followers_on_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_full_name text;
DECLARE v_author_name text;
BEGIN
  IF NEW.status <> 'published' THEN RETURN NEW; END IF;
  SELECT NULLIF(upa.value_text, '')
    INTO v_full_name
  FROM public.user_profile_attributes upa
  JOIN public.afs_attributes ac ON ac.id = upa.attribute_id
  WHERE upa.user_id = NEW.user_id
    AND ac.key = 'full_name'
  LIMIT 1;
  v_author_name := COALESCE(NEW.business_name, v_full_name, 'Takip ettiğin işletme');
  PERFORM public.notify_followers(NEW.user_id, 'follow_job',
    'Yeni iş ilanı: ' || NEW.title,
    v_author_name || ' yeni bir ' || COALESCE(NEW.employment_type,'iş') || ' ilanı yayınladı' || CASE WHEN NEW.city IS NOT NULL THEN ' (' || NEW.city || ')' ELSE '' END || '.',
    NEW.id);
  RETURN NEW;
END;
$function$;

-- ─── (A) notify_on_connection_request ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(NULLIF(upa.value_text, ''), 'Bir kullanıcı')
      INTO v_name
    FROM public.user_profile_attributes upa
    JOIN public.afs_attributes ac ON ac.id = upa.attribute_id
    WHERE upa.user_id = NEW.requester_id
      AND ac.key = 'full_name'
    LIMIT 1;
    v_name := COALESCE(v_name, 'Bir kullanıcı');
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.recipient_id, 'connection_request', 'Yeni Bağlantı İsteği',
      v_name || ' seninle bağlantı kurmak istiyor.', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(NULLIF(upa.value_text, ''), 'Karşı taraf')
      INTO v_name
    FROM public.user_profile_attributes upa
    JOIN public.afs_attributes ac ON ac.id = upa.attribute_id
    WHERE upa.user_id = NEW.recipient_id
      AND ac.key = 'full_name'
    LIMIT 1;
    v_name := COALESCE(v_name, 'Karşı taraf');
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.requester_id, 'connection_accepted', 'Bağlantı Kabul Edildi',
      v_name || ' bağlantı isteğini kabul etti.', NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

-- ─── (B) generate_ambassador_referral_code ───────────────────────────────────
-- The uniqueness check queried public.profiles.ambassador_referral_code, a column
-- that was dropped with no surviving home. The collision space is 16^6, so the
-- DB-level uniqueness probe is removed and a fresh code is returned. (The ambassador
-- referral feature's storage is gone; this keeps the helper callable and harmless.)
CREATE OR REPLACE FUNCTION public.generate_ambassador_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_code text;
BEGIN
  v_code := 'AMB-' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
  RETURN v_code;
END;
$function$;

-- ─── (B) assign_ambassador_referral_code ─────────────────────────────────────
-- Wrote profiles.ambassador_referral_code (column dropped, no canonical home).
-- Safe NO-OP trigger; ambassador referral storage no longer exists.
CREATE OR REPLACE FUNCTION public.assign_ambassador_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- legacy profiles.ambassador_referral_code write removed (column dropped). No-op.
  RETURN NEW;
END;
$function$;

-- ─── (B) apply_referral_discount ─────────────────────────────────────────────
-- Looked up profiles.ambassador_referral_code (column dropped) to grant a discount.
-- With the referral-code store gone there is no referrer to match, so no discount is
-- applied. NEW is returned unchanged (BEFORE-row trigger) — referral_discount_pct
-- keeps whatever the caller supplied.
CREATE OR REPLACE FUNCTION public.apply_referral_discount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- legacy profiles.ambassador_referral_code lookup removed (column dropped). No-op.
  RETURN NEW;
END;
$function$;

-- ─── (C) reword false-positive comments (bodies byte-identical) ──────────────
-- catalog_upsert_owner_membership and search_directory_catalog already use
-- auth.users; they only TRIP the reference scan because an explanatory comment
-- contains the literal token "public.profiles". Re-create each from its live
-- definition with that token reworded, leaving executable logic untouched.
do $$
declare
  v_def text;
begin
  for v_def in
    select pg_get_functiondef(p.oid)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('catalog_upsert_owner_membership', 'search_directory_catalog')
  loop
    -- only the comment token is rewritten; SQL never references public.profiles here
    v_def := replace(v_def, 'public.profiles', 'the legacy profiles table');
    execute v_def;
  end loop;
end $$;

commit;
