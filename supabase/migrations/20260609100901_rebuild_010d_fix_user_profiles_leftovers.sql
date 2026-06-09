-- ─────────────────────────────────────────────────────────────────────────────
-- rebuild_010d: fix legacy-drop leftovers (user_profiles / profiles references)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Migration 20260609003000_drop_legacy_tables.sql dropped public.user_profiles,
-- public.profiles, public.admin_users and public.role_feature_defaults, and
-- rewired 10+ stored procedures (e.g. get_current_user_profile,
-- update_profile_attribute). It missed 4 functions whose bodies still reference
-- the dropped tables. Those broken definitions were captured verbatim in
-- 20260609100900_rebuild_010c_backend_rewire.sql; their CREATE OR REPLACE blocks
-- have been removed from 010c and are superseded by this migration.
--
-- Canonical replacements applied here (same pattern as the already-fixed siblings):
--   * user_profiles.profile_type (role key)  -> user_role_assignments JOIN roles (r.key)
--   * user_profiles.full_name (now an attribute) -> read/write user_profile_attributes
--       for the afs_attributes row where key = 'full_name'
--   * public.profiles (avatar) -> DROPPED; canonical avatar is the
--       'profile_photo_url' attribute already written into user_profile_attributes
--   * public.role_feature_defaults (dropped) -> join removed; role-level defaults
--       now live solely in role_features
--   * renamed catalog tables (attribute_catalog -> afs_attributes, etc.)
--
-- Everything else in each function (signature, security definer, search_path,
-- audit logging, validation, all other logic) is preserved verbatim.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ─── update_profile_avatar ───────────────────────────────────────────────────
-- Removed the `update public.profiles` and `update public.user_profiles` blocks.
-- The user_profile_attributes upsert (profile_photo_url) is the canonical avatar
-- store and is kept as-is.
CREATE OR REPLACE FUNCTION public.update_profile_avatar(next_avatar_url text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_attribute_id uuid;
  v_normalized_url text := nullif(btrim(next_avatar_url), '');
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select id
  into v_attribute_id
  from public.afs_attributes
  where key = 'profile_photo_url'
    and is_active = true
  limit 1;

  if v_attribute_id is null then
    raise exception 'profile_photo_url attribute missing' using errcode = 'P0002';
  end if;

  if v_normalized_url is null then
    delete from public.user_profile_attributes
    where user_id = v_user_id
      and attribute_id = v_attribute_id;
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
      v_attribute_id,
      v_normalized_url,
      null,
      'public',
      'approved',
      v_user_id,
      now(),
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = null,
      visibility = 'public',
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();
  end if;

  return jsonb_build_object(
    'status', 'approved',
    'avatar_url', v_normalized_url
  );
end;
$function$;

-- ─── admin_update_user_profile_attribute ─────────────────────────────────────
-- The full_name branch previously did `update public.user_profiles set full_name`.
-- Replaced with an upsert into user_profile_attributes for the 'full_name'
-- afs_attributes row (same pattern as the non-full_name path).
CREATE OR REPLACE FUNCTION public.admin_update_user_profile_attribute(target_user_id uuid, attribute_key text, attribute_value jsonb, visibility text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attribute public.afs_attributes%rowtype;
  v_visibility text;
  v_value_text text;
  v_before public.user_profile_attributes%rowtype;
  v_full_name_attribute_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;

  if attribute_key is null or btrim(attribute_key) = '' then
    raise exception 'attribute key is required' using errcode = '22023';
  end if;

  if attribute_key = 'full_name' then
    select id
    into v_full_name_attribute_id
    from public.afs_attributes
    where key = 'full_name'
    limit 1;

    if v_full_name_attribute_id is null then
      raise exception 'full_name attribute missing' using errcode = 'P0002';
    end if;

    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');

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
      target_user_id,
      v_full_name_attribute_id,
      v_value_text,
      null,
      'public',
      'approved',
      auth.uid(),
      now(),
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = null,
      visibility = excluded.visibility,
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();

    perform public.write_admin_audit_log(
      'admin.user_profile_attribute_updated',
      target_user_id,
      'user_profile',
      target_user_id,
      null,
      jsonb_build_object(
        'attribute_key', attribute_key,
        'value', attribute_value,
        'visibility', 'public'
      )
    );

    return jsonb_build_object(
      'attribute_key', attribute_key,
      'status', 'approved'
    );
  end if;

  select * into v_attribute
  from public.afs_attributes
  where key = attribute_key
    and is_active = true
  limit 1;

  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  if v_attribute.key in ('referral_code', 'referral_source') then
    v_visibility := 'private';
  else
    v_visibility := coalesce(visibility, 'private');
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  if v_attribute.key = 'referral_code' and v_value_text is not null then
    v_value_text := upper(v_value_text);
    attribute_value := to_jsonb(v_value_text);
  end if;

  if v_attribute.key = 'referral_source' then
    v_value_text := public.validate_profile_onboarding_referral_source(v_value_text);
    attribute_value := to_jsonb(v_value_text);
  end if;

  select * into v_before
  from public.user_profile_attributes
  where user_id = target_user_id
    and attribute_id = v_attribute.id
  limit 1;

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
    target_user_id,
    v_attribute.id,
    case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
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

  perform public.write_admin_audit_log(
    'admin.user_profile_attribute_updated',
    target_user_id,
    'user_profile_attribute',
    target_user_id,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    jsonb_build_object(
      'attribute_key', attribute_key,
      'value', attribute_value,
      'visibility', v_visibility
    )
  );

  return jsonb_build_object(
    'attribute_key', attribute_key,
    'status', 'approved'
  );
end;
$function$;

-- ─── admin_review_approval_request ───────────────────────────────────────────
-- The full_name approval branch previously did `update public.user_profiles set
-- full_name`. Replaced with an upsert into user_profile_attributes for the
-- 'full_name' afs_attributes row.
CREATE OR REPLACE FUNCTION public.admin_review_approval_request(request_id uuid, decision text, note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_request public.approval_requests%rowtype;
  v_attribute public.afs_attributes%rowtype;
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
      from public.afs_attributes
      where key = v_request.payload ->> 'attribute_key'
      limit 1;

      v_attribute_value := v_request.payload -> 'attribute_value';
      v_visibility := coalesce(v_request.payload ->> 'visibility', 'private');
      v_value_text := nullif(btrim(coalesce(v_attribute_value #>> '{}', '')), '');

      if v_attribute.key = 'full_name' then
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
          v_value_text,
          null,
          'public',
          'approved',
          auth.uid(),
          now(),
          now()
        )
        on conflict (user_id, attribute_id) do update
        set
          value_text = excluded.value_text,
          value_json = null,
          visibility = excluded.visibility,
          approval_status = 'approved',
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at,
          updated_at = now();
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
$function$;

-- ─── get_public_profile_sections ─────────────────────────────────────────────
-- base_user previously read from public.user_profiles (profile_type, full_name).
-- Rewritten to resolve the role key via user_role_assignments JOIN roles and the
-- display name via the 'full_name' user_profile_attributes row. The
-- role_feature_defaults (rfd) join was removed (table dropped); role-level
-- defaults now live solely in role_features (rff).
CREATE OR REPLACE FUNCTION public.get_public_profile_sections(target_user_id uuid)
 RETURNS TABLE(section_key text, section_area text, label text, component_name text, sort_order integer, content jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with base_user as (
    select
      ura.user_id,
      r.key as profile_type,
      coalesce(nullif(fn.value_text, ''), 'CorteQS Üyesi') as display_name
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    left join lateral (
      select upa.value_text
      from public.user_profile_attributes upa
      join public.afs_attributes ac on ac.id = upa.attribute_id
      where upa.user_id = ura.user_id
        and ac.key = 'full_name'
      limit 1
    ) fn on true
    where ura.user_id = target_user_id
  ),
  feature_state as (
    select
      fc.key,
      coalesce(ufo.is_enabled, rff.is_enabled, false)
        and coalesce(fc.is_active_globally, false) as is_enabled
    from base_user bu
    join public.roles r on r.key = bu.profile_type
    join public.afs_features fc
      on fc.key in (
        'directory.visible',
        'profile.linkedin_card',
        'profile.website_card',
        'individual.job_seeking_badge',
        'individual.moving_soon_badge',
        'individual.volunteer_mentorship'
      )
    left join public.role_features rff
      on rff.role_id = r.id
     and rff.feature_key = fc.key
    left join public.user_feature_overrides ufo
      on ufo.user_id = bu.user_id
     and ufo.feature_key = fc.key
  ),
  visibility_gate as (
    select
      bu.user_id,
      coalesce(
        (select fs.is_enabled from feature_state fs where fs.key = 'directory.visible'),
        false
      ) as directory_visible
    from base_user bu
  ),
  role_meta as (
    select
      r.key,
      r.label
    from base_user bu
    join public.roles r on r.key = bu.profile_type
  ),
  public_attributes as (
    select
      ac.key,
      upa.value_text,
      upa.value_json
    from public.user_profile_attributes upa
    join public.afs_attributes ac on ac.id = upa.attribute_id
    where upa.user_id = target_user_id
      and upa.visibility = 'public'
      and upa.approval_status = 'approved'
  ),
  extra_badges as (
    select coalesce(jsonb_agg(label order by sort_order), '[]'::jsonb) as labels
    from (
      select 10 as sort_order, 'İş Arıyorum' as label
      where exists (
        select 1
        from public_attributes pa
        where pa.key = 'job_seeking_opt_in'
          and pa.value_json = 'true'::jsonb
      )
        and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'individual.job_seeking_badge'), false)

      union all

      select 20 as sort_order, 'Yakında Taşınacağım' as label
      where exists (
        select 1
        from public_attributes pa
        where pa.key = 'moving_soon_opt_in'
          and pa.value_json = 'true'::jsonb
      )
        and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'individual.moving_soon_badge'), false)

      union all

      select 30 as sort_order, 'Gönüllü Mentör' as label
      where exists (
        select 1
        from public_attributes pa
        where pa.key = 'volunteer_mentorship_opt_in'
          and pa.value_json = 'true'::jsonb
      )
        and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'individual.volunteer_mentorship'), false)
    ) badges
  ),
  public_links as (
    select 10 as sort_order, jsonb_build_object('label', 'Website', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'website_url'
      and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'profile.website_card'), false)

    union all

    select 20 as sort_order, jsonb_build_object('label', 'LinkedIn', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'linkedin_url'
      and coalesce((select fs.is_enabled from feature_state fs where fs.key = 'profile.linkedin_card'), false)

    union all

    select 30 as sort_order, jsonb_build_object('label', 'Instagram', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'instagram_url'

    union all

    select 40 as sort_order, jsonb_build_object('label', 'Facebook', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'facebook_url'

    union all

    select 50 as sort_order, jsonb_build_object('label', 'YouTube', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'youtube_url'

    union all

    select 60 as sort_order, jsonb_build_object('label', 'TikTok', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'tiktok_url'

    union all

    select 70 as sort_order, jsonb_build_object('label', 'X (Twitter)', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'x_url'

    union all

    select 80 as sort_order, jsonb_build_object('label', 'Reddit', 'url', pa.value_text) as link
    from public_attributes pa
    where pa.key = 'reddit_url'
  ),
  allowed_sections as (
    select
      psc.key,
      psc.section_area,
      psc.label,
      psc.component_key as component_name,
      coalesce(rpsr.sort_order, psc.sort_order) as sort_order
    from base_user bu
    join public.roles r on r.key = bu.profile_type
    join public.role_sections rpsr on rpsr.role_id = r.id and rpsr.is_enabled = true
    join public.afs_sections psc on psc.id = rpsr.section_id and psc.is_active = true
    where psc.key <> 'detail.taxonomy_etiketleri'
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
          (select label from role_meta limit 1)
        ),
        'extra_badges',
        coalesce((select labels from extra_badges), '[]'::jsonb)
      )
      when 'detail.hakkinda_bio' then jsonb_build_object('text', (select value_text from public_attributes where key = 'bio_short'))
      when 'detail.iletisim_linkleri' then jsonb_build_object(
        'links',
        coalesce((select jsonb_agg(pl.link order by pl.sort_order) from public_links pl), '[]'::jsonb)
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
        or exists (select 1 from role_meta)
        or exists (select 1 from extra_badges eb, jsonb_array_elements_text(eb.labels) badge)
      ))
      or (s.key = 'detail.hakkinda_bio' and exists (select 1 from public_attributes where key = 'bio_short'))
      or (s.key = 'detail.iletisim_linkleri' and exists (select 1 from public_links))
    )
  order by s.sort_order, s.key;
$function$;

commit;
