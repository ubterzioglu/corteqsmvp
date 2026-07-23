begin;

create or replace function public.catalog_reset_item_projection(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.catalog_item_categories where item_id = p_item_id;
  delete from public.catalog_item_contacts where item_id = p_item_id;
  delete from public.catalog_item_locations where item_id = p_item_id;
  delete from public.catalog_item_links where item_id = p_item_id;
  delete from public.catalog_item_media where item_id = p_item_id;
  delete from public.catalog_item_languages where item_id = p_item_id;
  delete from public.catalog_item_tags where item_id = p_item_id;
  delete from public.catalog_item_services where item_id = p_item_id;
end;
$$;

create or replace function public.catalog_upsert_source_item(
  p_source_type text,
  p_external_id text,
  p_item_type text,
  p_slug text,
  p_title text,
  p_headline text,
  p_short_description text,
  p_long_description text,
  p_status text,
  p_visibility text,
  p_verification_status text,
  p_created_by_user_id uuid,
  p_published_at timestamptz,
  p_attributes jsonb default '{}'::jsonb,
  p_source_url text default null,
  p_raw_snapshot jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  select sr.item_id
  into v_item_id
  from public.source_records sr
  where sr.source_type = p_source_type
    and sr.external_id = p_external_id
  limit 1;

  if v_item_id is null then
    insert into public.catalog_items (
      item_type,
      slug,
      title,
      headline,
      short_description,
      long_description,
      status,
      visibility,
      verification_status,
      created_by_user_id,
      published_at,
      attributes
    )
    values (
      p_item_type,
      p_slug,
      p_title,
      p_headline,
      p_short_description,
      p_long_description,
      p_status,
      p_visibility,
      p_verification_status,
      p_created_by_user_id,
      p_published_at,
      coalesce(p_attributes, '{}'::jsonb)
    )
    on conflict (slug) do update
    set
      item_type = excluded.item_type,
      title = excluded.title,
      headline = excluded.headline,
      short_description = excluded.short_description,
      long_description = excluded.long_description,
      status = excluded.status,
      visibility = excluded.visibility,
      verification_status = excluded.verification_status,
      created_by_user_id = coalesce(excluded.created_by_user_id, public.catalog_items.created_by_user_id),
      published_at = excluded.published_at,
      attributes = coalesce(public.catalog_items.attributes, '{}'::jsonb) || excluded.attributes,
      updated_at = now()
    returning id into v_item_id;
  else
    update public.catalog_items
    set
      item_type = p_item_type,
      slug = p_slug,
      title = p_title,
      headline = p_headline,
      short_description = p_short_description,
      long_description = p_long_description,
      status = p_status,
      visibility = p_visibility,
      verification_status = p_verification_status,
      created_by_user_id = coalesce(p_created_by_user_id, created_by_user_id),
      published_at = p_published_at,
      attributes = coalesce(attributes, '{}'::jsonb) || coalesce(p_attributes, '{}'::jsonb),
      updated_at = now()
    where id = v_item_id;
  end if;

  insert into public.source_records (
    item_id,
    source_type,
    external_id,
    source_url,
    raw_snapshot,
    imported_at,
    last_seen_at
  )
  values (
    v_item_id,
    p_source_type,
    p_external_id,
    p_source_url,
    coalesce(p_raw_snapshot, '{}'::jsonb),
    now(),
    now()
  )
  on conflict (source_type, external_id) do update
  set
    item_id = excluded.item_id,
    source_url = excluded.source_url,
    raw_snapshot = excluded.raw_snapshot,
    last_seen_at = now(),
    updated_at = now();

  return v_item_id;
end;
$$;

create or replace function public.catalog_upsert_owner_membership(
  p_item_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_item_id is null or p_user_id is null then
    return;
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    return;
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_user_id, 'owner', 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();
end;
$$;

create or replace function public.catalog_delete_item_for_source(
  p_source_type text,
  p_external_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  select sr.item_id
  into v_item_id
  from public.source_records sr
  where sr.source_type = p_source_type
    and sr.external_id = p_external_id
  limit 1;

  if v_item_id is null then
    return;
  end if;

  delete from public.source_records
  where source_type = p_source_type
    and external_id = p_external_id;

  if not exists (
    select 1
    from public.source_records sr
    where sr.item_id = v_item_id
  ) then
    delete from public.catalog_items
    where id = v_item_id;
  end if;
end;
$$;

create or replace function public.catalog_create_duplicate_candidates_for_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_other record;
  v_left uuid;
  v_right uuid;
begin
  select
    ci.id,
    ci.item_type,
    public.catalog_search_normalize(ci.title) as normalized_title,
    public.catalog_search_normalize(coalesce(loc.city, '')) as normalized_city,
    public.catalog_search_normalize(coalesce(loc.country_code, '')) as normalized_country_code
  into v_item
  from public.catalog_items ci
  left join public.catalog_item_locations loc
    on loc.item_id = ci.id
   and loc.is_primary = true
  where ci.id = p_item_id;

  if v_item.id is null or v_item.normalized_title = '' then
    return;
  end if;

  for v_other in
    select
      other_ci.id,
      public.catalog_search_normalize(other_ci.title) as normalized_title,
      public.catalog_search_normalize(coalesce(other_loc.city, '')) as normalized_city,
      public.catalog_search_normalize(coalesce(other_loc.country_code, '')) as normalized_country_code
    from public.catalog_items other_ci
    left join public.catalog_item_locations other_loc
      on other_loc.item_id = other_ci.id
     and other_loc.is_primary = true
    where other_ci.id <> v_item.id
      and other_ci.item_type = v_item.item_type
      and public.catalog_search_normalize(other_ci.title) = v_item.normalized_title
      and public.catalog_search_normalize(coalesce(other_loc.city, '')) = v_item.normalized_city
      and public.catalog_search_normalize(coalesce(other_loc.country_code, '')) = v_item.normalized_country_code
  loop
    v_left := least(v_item.id, v_other.id);
    v_right := greatest(v_item.id, v_other.id);

    insert into public.duplicate_candidates (
      left_item_id,
      right_item_id,
      confidence,
      reason,
      status,
      payload
    )
    values (
      v_left,
      v_right,
      0.88,
      'auto-detected-equal-title-and-primary-location',
      'pending',
      jsonb_build_object('detected_from_item_id', p_item_id)
    )
    on conflict (left_item_id, right_item_id) do update
    set
      confidence = greatest(public.duplicate_candidates.confidence, excluded.confidence),
      reason = excluded.reason,
      payload = excluded.payload,
      updated_at = now();
  end loop;
end;
$$;

create or replace function public.catalog_sync_event(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_item_id uuid;
  v_category_slug text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  select *
  into v_event
  from public.events
  where id = p_event_id;

  if v_event.id is null then
    perform public.catalog_delete_item_for_source('legacy.events', p_event_id::text);
    return null;
  end if;

  v_starts_at := case
    when v_event.event_date is null then null
    when v_event.start_time is null then (v_event.event_date::timestamp at time zone 'UTC')
    else ((v_event.event_date::text || ' ' || v_event.start_time::text)::timestamp at time zone 'UTC')
  end;

  v_ends_at := case
    when v_event.event_date is null then null
    when v_event.end_time is null then null
    else ((v_event.event_date::text || ' ' || v_event.end_time::text)::timestamp at time zone 'UTC')
  end;

  v_item_id := public.catalog_upsert_source_item(
    'legacy.events',
    v_event.id::text,
    'event',
    'event-' || v_event.id::text,
    v_event.title,
    coalesce(v_event.organizer_name, v_event.category),
    left(coalesce(v_event.description, v_event.title), 240),
    v_event.description,
    case when v_event.status = 'published' then 'published' else 'draft' end,
    'public',
    'unverified',
    v_event.user_id,
    case when v_event.status = 'published' then coalesce(v_starts_at, v_event.created_at) else null end,
    jsonb_build_object(
      'legacy_table', 'events',
      'legacy_id', v_event.id,
      'legacy_category', v_event.category,
      'legacy_type', v_event.type,
      'featured', v_event.featured
    ),
    null,
    to_jsonb(v_event)
  );

  perform public.catalog_reset_item_projection(v_item_id);

  v_category_slug := public.catalog_slugify(v_event.category);
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_item_id, cc.id, true
  from public.catalog_categories cc
  where cc.module = 'event'
    and cc.slug = v_category_slug
  on conflict do nothing;

  insert into public.catalog_item_locations (
    item_id,
    country_code,
    city,
    address_line,
    is_primary
  )
  values (
    v_item_id,
    null,
    nullif(v_event.city, ''),
    nullif(v_event.location, ''),
    true
  );

  if nullif(v_event.online_url, '') is not null then
    insert into public.catalog_item_links (item_id, link_type, url, label, is_public, sort_order)
    values (v_item_id, 'registration', v_event.online_url, 'Online URL', true, 10);
  end if;

  if nullif(v_event.cover_image, '') is not null then
    insert into public.catalog_item_media (
      item_id,
      media_type,
      url,
      thumbnail_url,
      alt_text,
      is_public,
      is_primary,
      sort_order
    )
    values (
      v_item_id,
      'cover',
      v_event.cover_image,
      v_event.cover_image,
      v_event.title,
      true,
      true,
      10
    );
  end if;

  insert into public.catalog_item_tags (item_id, tag_slug, tag_label)
  select
    v_item_id,
    public.catalog_slugify(tag_row.tag_value),
    tag_row.tag_value
  from unnest(coalesce(v_event.tags, '{}'::text[])) as tag_row(tag_value)
  where nullif(btrim(tag_row.tag_value), '') is not null
  on conflict do nothing;

  insert into public.event_details (
    item_id,
    starts_at,
    ends_at,
    venue_name,
    registration_url,
    capacity,
    timezone,
    is_online
  )
  values (
    v_item_id,
    v_starts_at,
    v_ends_at,
    nullif(v_event.location, ''),
    nullif(v_event.online_url, ''),
    v_event.max_attendees,
    'UTC',
    nullif(v_event.online_url, '') is not null
  )
  on conflict (item_id) do update
  set
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    venue_name = excluded.venue_name,
    registration_url = excluded.registration_url,
    capacity = excluded.capacity,
    timezone = excluded.timezone,
    is_online = excluded.is_online,
    updated_at = now();

  perform public.catalog_upsert_owner_membership(v_item_id, v_event.user_id);
  perform public.catalog_create_duplicate_candidates_for_item(v_item_id);

  return v_item_id;
end;
$$;

create or replace function public.catalog_sync_job_listing(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.job_listings%rowtype;
  v_item_id uuid;
begin
  select *
  into v_listing
  from public.job_listings
  where id = p_listing_id;

  if v_listing.id is null then
    perform public.catalog_delete_item_for_source('legacy.job_listings', p_listing_id::text);
    return null;
  end if;

  v_item_id := public.catalog_upsert_source_item(
    'legacy.job_listings',
    v_listing.id::text,
    'job_posting',
    'job-' || v_listing.id::text,
    v_listing.title,
    coalesce(v_listing.business_name, v_listing.department),
    left(coalesce(v_listing.description, v_listing.title), 240),
    concat_ws(E'\n\n', v_listing.description, v_listing.requirements),
    case when v_listing.status = 'published' then 'published' else 'draft' end,
    'public',
    'unverified',
    v_listing.user_id,
    case when v_listing.status = 'published' then v_listing.created_at else null end,
    jsonb_build_object(
      'legacy_table', 'job_listings',
      'legacy_id', v_listing.id,
      'package', v_listing.package,
      'total_price', v_listing.total_price
    ),
    null,
    to_jsonb(v_listing)
  );

  perform public.catalog_reset_item_projection(v_item_id);

  insert into public.catalog_item_locations (
    item_id,
    city,
    address_line,
    is_primary
  )
  values (
    v_item_id,
    nullif(v_listing.city, ''),
    nullif(v_listing.location, ''),
    true
  );

  insert into public.job_posting_details (
    item_id,
    employment_type,
    workplace_mode,
    application_url,
    application_email,
    salary_min,
    salary_max,
    currency,
    expires_at
  )
  values (
    v_item_id,
    v_listing.employment_type,
    v_listing.location_type,
    null,
    null,
    v_listing.salary_min,
    v_listing.salary_max,
    v_listing.currency,
    v_listing.expires_at
  )
  on conflict (item_id) do update
  set
    employment_type = excluded.employment_type,
    workplace_mode = excluded.workplace_mode,
    application_url = excluded.application_url,
    application_email = excluded.application_email,
    salary_min = excluded.salary_min,
    salary_max = excluded.salary_max,
    currency = excluded.currency,
    expires_at = excluded.expires_at,
    updated_at = now();

  perform public.catalog_upsert_owner_membership(v_item_id, v_listing.user_id);
  perform public.catalog_create_duplicate_candidates_for_item(v_item_id);

  return v_item_id;
end;
$$;

create or replace function public.catalog_sync_whatsapp_landing(p_landing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing public.whatsapp_landings%rowtype;
  v_item_id uuid;
  v_primary_category text;
begin
  select *
  into v_landing
  from public.whatsapp_landings
  where id = p_landing_id;

  if v_landing.id is null then
    perform public.catalog_delete_item_for_source('legacy.whatsapp_landings', p_landing_id::text);
    return null;
  end if;

  v_item_id := public.catalog_upsert_source_item(
    'legacy.whatsapp_landings',
    v_landing.id::text,
    'community_group',
    coalesce(nullif(v_landing.slug, ''), 'group-' || v_landing.id::text),
    v_landing.group_name,
    nullif(v_landing.tagline, ''),
    left(coalesce(v_landing.description, v_landing.group_name), 240),
    v_landing.description,
    case when v_landing.status = 'approved' then 'published' when v_landing.status = 'rejected' then 'rejected' else 'pending_review' end,
    'public',
    case when coalesce(v_landing.admin_approved, false) then 'verified' else 'unverified' end,
    v_landing.user_id,
    case when v_landing.status = 'approved' then v_landing.created_at else null end,
    jsonb_build_object(
      'legacy_table', 'whatsapp_landings',
      'legacy_id', v_landing.id,
      'mode', v_landing.mode,
      'origin', v_landing.origin,
      'group_score', v_landing.group_score
    ),
    null,
    to_jsonb(v_landing)
  );

  perform public.catalog_reset_item_projection(v_item_id);

  v_primary_category := case v_landing.category
    when 'alumni' then 'alumni'
    when 'hobi' then 'hobby'
    when 'is' then 'business'
    when 'doktor' then 'doctor'
    else 'other'
  end;

  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_item_id, cc.id, cc.slug = v_primary_category
  from public.catalog_categories cc
  where cc.module = 'community_group'
    and cc.slug in ('whatsapp', v_primary_category)
  on conflict do nothing;

  insert into public.catalog_item_locations (item_id, city, is_primary)
  values (v_item_id, nullif(v_landing.city, ''), true);

  insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
  values (v_item_id, 'whatsapp', v_landing.whatsapp_link, 'Join Link', true, true, 10)
  on conflict do nothing;

  if nullif(v_landing.admin_contact, '') is not null then
    insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
    values (v_item_id, 'phone', v_landing.admin_contact, 'Admin Contact', false, false, 20)
    on conflict do nothing;
  end if;

  if nullif(v_landing.hero_image, '') is not null then
    insert into public.catalog_item_media (
      item_id,
      media_type,
      url,
      thumbnail_url,
      alt_text,
      is_public,
      is_primary,
      sort_order
    )
    values (
      v_item_id,
      'cover',
      v_landing.hero_image,
      v_landing.hero_image,
      v_landing.group_name,
      true,
      true,
      10
    );
  end if;

  insert into public.community_group_details (
    item_id,
    platform,
    join_url,
    member_count,
    requires_approval,
    admin_approved,
    language_code
  )
  values (
    v_item_id,
    'whatsapp',
    v_landing.whatsapp_link,
    v_landing.member_count,
    coalesce(v_landing.member_approved, false),
    coalesce(v_landing.admin_approved, false),
    v_landing.language
  )
  on conflict (item_id) do update
  set
    platform = excluded.platform,
    join_url = excluded.join_url,
    member_count = excluded.member_count,
    requires_approval = excluded.requires_approval,
    admin_approved = excluded.admin_approved,
    language_code = excluded.language_code,
    updated_at = now();

  perform public.catalog_upsert_owner_membership(v_item_id, v_landing.user_id);
  perform public.catalog_create_duplicate_candidates_for_item(v_item_id);

  return v_item_id;
end;
$$;

create or replace function public.catalog_sync_independent_profile(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.independent_profiles%rowtype;
  v_item_id uuid;
  v_category_slug text;
begin
  select *
  into v_profile
  from public.independent_profiles
  where id = p_profile_id;

  if v_profile.id is null then
    perform public.catalog_delete_item_for_source('legacy.independent_profiles', p_profile_id::text);
    return null;
  end if;

  v_category_slug := case
    when v_profile.profile_kind = 'embassy' then 'embassy'
    when v_profile.profile_kind = 'consulate' then 'consulate'
    else 'digital-community'
  end;

  v_item_id := public.catalog_upsert_source_item(
    'legacy.independent_profiles',
    v_profile.id::text,
    'organization',
    v_profile.slug,
    v_profile.title,
    v_profile.subtitle,
    left(coalesce(v_profile.description, v_profile.title), 240),
    v_profile.description,
    case when v_profile.is_published then 'published' else 'draft' end,
    'public',
    'verified',
    null,
    case when v_profile.is_published then v_profile.created_at else null end,
    jsonb_build_object(
      'legacy_table', 'independent_profiles',
      'legacy_id', v_profile.id,
      'profile_kind', v_profile.profile_kind,
      'type_label', v_profile.type_label
    ),
    v_profile.website_url,
    to_jsonb(v_profile)
  );

  perform public.catalog_reset_item_projection(v_item_id);

  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_item_id, cc.id, true
  from public.catalog_categories cc
  where cc.module = 'organization'
    and cc.slug = v_category_slug
  on conflict do nothing;

  insert into public.catalog_item_locations (item_id, city, address_line, is_primary)
  values (
    v_item_id,
    nullif(v_profile.city, ''),
    nullif(v_profile.address_text, ''),
    true
  );

  if nullif(v_profile.contact_email, '') is not null then
    insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
    values (v_item_id, 'email', v_profile.contact_email, 'Public Email', true, true, 10);
  end if;

  if nullif(v_profile.contact_phone, '') is not null then
    insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
    values (v_item_id, 'phone', v_profile.contact_phone, 'Public Phone', true, false, 20);
  end if;

  if nullif(v_profile.website_url, '') is not null then
    insert into public.catalog_item_links (item_id, link_type, url, label, is_public, sort_order)
    values (v_item_id, 'website', v_profile.website_url, 'Website', true, 10);
  end if;

  if nullif(v_profile.hero_image_url, '') is not null then
    insert into public.catalog_item_media (item_id, media_type, url, thumbnail_url, alt_text, is_public, is_primary, sort_order)
    values (v_item_id, 'cover', v_profile.hero_image_url, v_profile.hero_image_url, v_profile.title, true, true, 10);
  end if;

  if nullif(v_profile.logo_url, '') is not null then
    insert into public.catalog_item_media (item_id, media_type, url, thumbnail_url, alt_text, is_public, is_primary, sort_order)
    values (v_item_id, 'logo', v_profile.logo_url, v_profile.logo_url, v_profile.title, true, false, 20);
  end if;

  insert into public.organization_details (
    item_id,
    organization_kind,
    legal_name,
    metadata
  )
  values (
    v_item_id,
    v_profile.profile_kind,
    v_profile.title,
    jsonb_build_object(
      'working_hours', v_profile.working_hours,
      'services_json', v_profile.services_json,
      'announcements_json', v_profile.announcements_json,
      'cta_json', v_profile.cta_json
    )
  )
  on conflict (item_id) do update
  set
    organization_kind = excluded.organization_kind,
    legal_name = excluded.legal_name,
    metadata = excluded.metadata,
    updated_at = now();

  perform public.catalog_create_duplicate_candidates_for_item(v_item_id);

  return v_item_id;
end;
$$;

create or replace function public.catalog_sync_turkish_mission(p_mission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission public.turkish_missions%rowtype;
  v_item_id uuid;
  v_category_slug text;
begin
  select *
  into v_mission
  from public.turkish_missions
  where id = p_mission_id;

  if v_mission.id is null then
    perform public.catalog_delete_item_for_source('official.turkish_missions', p_mission_id::text);
    return null;
  end if;

  v_category_slug := case
    when v_mission.mission_type = 'embassy' then 'embassy'
    else 'consulate'
  end;

  v_item_id := public.catalog_upsert_source_item(
    'official.turkish_missions',
    v_mission.id::text,
    'organization',
    coalesce(v_mission.slug, 'mission-' || v_mission.id::text),
    v_mission.mission_name,
    initcap(replace(v_mission.mission_type, '_', ' ')),
    left(coalesce(v_mission.address, v_mission.mission_name), 240),
    concat_ws(E'\n\n', v_mission.address, v_mission.jurisdiction, v_mission.working_hours),
    case when v_mission.status = 'active' then 'published' when v_mission.status = 'needs_review' then 'pending_review' else 'archived' end,
    'public',
    'official_source',
    null,
    case when v_mission.status = 'active' then v_mission.scraped_at else null end,
    jsonb_build_object(
      'legacy_table', 'turkish_missions',
      'legacy_id', v_mission.id,
      'mission_type', v_mission.mission_type,
      'parser_confidence', v_mission.parser_confidence,
      'data_completeness_score', v_mission.data_completeness_score
    ),
    v_mission.source_url,
    to_jsonb(v_mission)
  );

  perform public.catalog_reset_item_projection(v_item_id);

  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_item_id, cc.id, true
  from public.catalog_categories cc
  where cc.module = 'organization'
    and cc.slug = v_category_slug
  on conflict do nothing;

  insert into public.catalog_item_locations (
    item_id,
    country_code,
    city,
    address_line,
    is_primary
  )
  values (
    v_item_id,
    nullif(v_mission.country_code, ''),
    nullif(v_mission.city, ''),
    nullif(v_mission.address, ''),
    true
  );

  if nullif(v_mission.website_url, '') is not null then
    insert into public.catalog_item_links (item_id, link_type, url, label, is_public, sort_order)
    values (v_item_id, 'website', v_mission.website_url, 'Official Website', true, 10);
  end if;

  if nullif(v_mission.appointment_url, '') is not null then
    insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
    values (v_item_id, 'appointment_url', v_mission.appointment_url, 'Appointment', true, false, 20);
  end if;

  insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
  select
    v_item_id,
    'phone',
    phone_row.phone_value,
    'Official Phone',
    true,
    row_number() over (order by phone_row.phone_value) = 1,
    row_number() over (order by phone_row.phone_value) * 10
  from jsonb_array_elements_text(coalesce(v_mission.phones, '[]'::jsonb)) as phone_row(phone_value)
  where nullif(btrim(phone_row.phone_value), '') is not null
  on conflict do nothing;

  insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
  select
    v_item_id,
    'email',
    email_row.email_value,
    'Official Email',
    true,
    false,
    row_number() over (order by email_row.email_value) * 10 + 100
  from jsonb_array_elements_text(coalesce(v_mission.emails, '[]'::jsonb)) as email_row(email_value)
  where nullif(btrim(email_row.email_value), '') is not null
  on conflict do nothing;

  insert into public.organization_details (
    item_id,
    organization_kind,
    legal_name,
    metadata
  )
  values (
    v_item_id,
    v_mission.mission_type,
    v_mission.mission_name,
    jsonb_build_object(
      'jurisdiction', v_mission.jurisdiction,
      'working_hours', v_mission.working_hours,
      'office_hours_structured', v_mission.office_hours_structured,
      'consular_call_center', v_mission.consular_call_center
    )
  )
  on conflict (item_id) do update
  set
    organization_kind = excluded.organization_kind,
    legal_name = excluded.legal_name,
    metadata = excluded.metadata,
    updated_at = now();

  perform public.catalog_create_duplicate_candidates_for_item(v_item_id);

  return v_item_id;
end;
$$;

create or replace function public.catalog_sync_person_profile(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_user_profile public.user_profiles%rowtype;
  v_item_id uuid;
  v_public_bio text;
  v_city text;
  v_country text;
  v_interests text;
  v_linkedin text;
  v_website text;
  v_tagline text;
  v_primary_category text;
begin
  select *
  into v_profile
  from public.profiles
  where id = p_user_id;

  if v_profile.id is null then
    perform public.catalog_delete_item_for_source('profile_person', p_user_id::text);
    return null;
  end if;

  select *
  into v_user_profile
  from public.user_profiles
  where user_id = p_user_id;

  select
    max(case when ac.key = 'bio_short' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end),
    max(case when ac.key = 'city' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end),
    max(case when ac.key = 'country' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end),
    max(case when ac.key = 'interests' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end),
    max(case when ac.key = 'linkedin_url' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end),
    max(case when ac.key = 'website_url' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end)
  into
    v_public_bio,
    v_city,
    v_country,
    v_interests,
    v_linkedin,
    v_website
  from public.user_profile_attributes upa
  join public.attribute_catalog ac on ac.id = upa.attribute_id
  where upa.user_id = p_user_id;

  select ipd.tagline
  into v_tagline
  from public.individual_profile_details ipd
  where ipd.user_id = p_user_id;

  v_primary_category := case coalesce(v_user_profile.profile_type, v_profile.profile_type, 'bireysel')
    when 'sehir-elcisi' then 'city-ambassador'
    when 'blogger-vlogger-youtuber' then 'blogger'
    else 'diaspora-individual'
  end;

  v_item_id := public.catalog_upsert_source_item(
    'profile_person',
    p_user_id::text,
    'person_profile',
    'person-' || p_user_id::text,
    coalesce(nullif(v_profile.display_name, ''), nullif(v_profile.full_name, ''), nullif(v_user_profile.full_name, ''), split_part(coalesce(v_profile.email, v_user_profile.email, 'corteqs-uye'), '@', 1)),
    nullif(v_tagline, ''),
    left(coalesce(v_public_bio, v_tagline, coalesce(v_profile.display_name, v_profile.full_name)), 240),
    v_public_bio,
    case when coalesce(v_profile.directory_opt_in, false) then 'published' else 'draft' end,
    case when coalesce(v_profile.directory_opt_in, false) then 'public' else 'private' end,
    'claimed',
    p_user_id,
    case when coalesce(v_profile.directory_opt_in, false) then now() else null end,
    jsonb_build_object(
      'legacy_source', 'profiles',
      'profile_type', coalesce(v_user_profile.profile_type, v_profile.profile_type, 'bireysel')
    ),
    null,
    jsonb_build_object(
      'profile', to_jsonb(v_profile),
      'user_profile', to_jsonb(v_user_profile)
    )
  );

  perform public.catalog_reset_item_projection(v_item_id);

  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_item_id, cc.id, true
  from public.catalog_categories cc
  where cc.module = 'person_profile'
    and cc.slug = v_primary_category
  on conflict do nothing;

  insert into public.catalog_item_locations (
    item_id,
    country_code,
    city,
    is_primary
  )
  values (
    v_item_id,
    nullif(v_profile.country_code, ''),
    nullif(v_city, ''),
    true
  );

  if nullif(v_linkedin, '') is not null then
    insert into public.catalog_item_links (item_id, link_type, url, label, is_public, sort_order)
    values (v_item_id, 'linkedin', v_linkedin, 'LinkedIn', true, 10);
  end if;

  if nullif(v_website, '') is not null then
    insert into public.catalog_item_links (item_id, link_type, url, label, is_public, sort_order)
    values (v_item_id, 'website', v_website, 'Website', true, 20);
  end if;

  if nullif(v_profile.avatar_url, '') is not null then
    insert into public.catalog_item_media (
      item_id,
      media_type,
      url,
      thumbnail_url,
      alt_text,
      is_public,
      is_primary,
      sort_order
    )
    values (
      v_item_id,
      'image',
      v_profile.avatar_url,
      v_profile.avatar_url,
      coalesce(v_profile.display_name, v_profile.full_name),
      true,
      true,
      10
    );
  end if;

  if nullif(v_interests, '') is not null then
    insert into public.catalog_item_tags (item_id, tag_slug, tag_label)
    select
      v_item_id,
      public.catalog_slugify(tag_row.tag_value),
      tag_row.tag_value
    from regexp_split_to_table(v_interests, '\s*,\s*') as tag_row(tag_value)
    where nullif(btrim(tag_row.tag_value), '') is not null
    on conflict do nothing;
  end if;

  insert into public.person_profile_details (
    item_id,
    linked_profile_id,
    directory_opt_in,
    interests,
    public_bio
  )
  values (
    v_item_id,
    p_user_id,
    coalesce(v_profile.directory_opt_in, false),
    case
      when nullif(v_interests, '') is null then '{}'::text[]
      else regexp_split_to_array(v_interests, '\s*,\s*')
    end,
    v_public_bio
  )
  on conflict (item_id) do update
  set
    linked_profile_id = excluded.linked_profile_id,
    directory_opt_in = excluded.directory_opt_in,
    interests = excluded.interests,
    public_bio = excluded.public_bio,
    updated_at = now();

  perform public.catalog_upsert_owner_membership(v_item_id, p_user_id);

  return v_item_id;
end;
$$;

create or replace function public.catalog_sync_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.catalog_delete_item_for_source('legacy.events', old.id::text);
    return old;
  end if;

  perform public.catalog_sync_event(new.id);
  return new;
end;
$$;

create or replace function public.catalog_sync_job_listing_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.catalog_delete_item_for_source('legacy.job_listings', old.id::text);
    return old;
  end if;

  perform public.catalog_sync_job_listing(new.id);
  return new;
end;
$$;

create or replace function public.catalog_sync_whatsapp_landing_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.catalog_delete_item_for_source('legacy.whatsapp_landings', old.id::text);
    return old;
  end if;

  perform public.catalog_sync_whatsapp_landing(new.id);
  return new;
end;
$$;

create or replace function public.catalog_sync_independent_profile_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.catalog_delete_item_for_source('legacy.independent_profiles', old.id::text);
    return old;
  end if;

  perform public.catalog_sync_independent_profile(new.id);
  return new;
end;
$$;

create or replace function public.catalog_sync_turkish_mission_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.catalog_delete_item_for_source('official.turkish_missions', old.id::text);
    return old;
  end if;

  perform public.catalog_sync_turkish_mission(new.id);
  return new;
end;
$$;

create or replace function public.catalog_sync_person_profile_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if tg_table_name = 'user_profile_attributes' then
    v_user_id := coalesce(new.user_id, old.user_id);
  elsif tg_table_name = 'individual_profile_details' then
    v_user_id := coalesce(new.user_id, old.user_id);
  elsif tg_table_name = 'user_profiles' then
    v_user_id := coalesce(new.user_id, old.user_id);
  else
    v_user_id := coalesce(new.id, old.id);
  end if;

  perform public.catalog_sync_person_profile(v_user_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.catalog_sync_person_profile_attribute_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_attribute_key text;
begin
  select ac.key
  into v_attribute_key
  from public.attribute_catalog ac
  where ac.id = coalesce(new.attribute_id, old.attribute_id)
  limit 1;

  if v_attribute_key not in ('bio_short', 'city', 'country', 'interests', 'linkedin_url', 'website_url') then
    return coalesce(new, old);
  end if;

  perform public.catalog_sync_person_profile(v_user_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_catalog_sync_event on public.events;
create trigger trg_catalog_sync_event
after insert or update or delete on public.events
for each row execute function public.catalog_sync_event_trigger();

drop trigger if exists trg_catalog_sync_job_listing on public.job_listings;
create trigger trg_catalog_sync_job_listing
after insert or update or delete on public.job_listings
for each row execute function public.catalog_sync_job_listing_trigger();

drop trigger if exists trg_catalog_sync_whatsapp_landing on public.whatsapp_landings;
create trigger trg_catalog_sync_whatsapp_landing
after insert or update or delete on public.whatsapp_landings
for each row execute function public.catalog_sync_whatsapp_landing_trigger();

drop trigger if exists trg_catalog_sync_independent_profile on public.independent_profiles;
create trigger trg_catalog_sync_independent_profile
after insert or update or delete on public.independent_profiles
for each row execute function public.catalog_sync_independent_profile_trigger();

drop trigger if exists trg_catalog_sync_turkish_mission on public.turkish_missions;
create trigger trg_catalog_sync_turkish_mission
after insert or update or delete on public.turkish_missions
for each row execute function public.catalog_sync_turkish_mission_trigger();

drop trigger if exists trg_catalog_sync_person_profile_profiles on public.profiles;
create trigger trg_catalog_sync_person_profile_profiles
after insert or update or delete on public.profiles
for each row execute function public.catalog_sync_person_profile_trigger();

drop trigger if exists trg_catalog_sync_person_profile_user_profiles on public.user_profiles;
create trigger trg_catalog_sync_person_profile_user_profiles
after insert or update or delete on public.user_profiles
for each row execute function public.catalog_sync_person_profile_trigger();

drop trigger if exists trg_catalog_sync_person_profile_details on public.individual_profile_details;
create trigger trg_catalog_sync_person_profile_details
after insert or update or delete on public.individual_profile_details
for each row execute function public.catalog_sync_person_profile_trigger();

drop trigger if exists trg_catalog_sync_person_profile_attributes on public.user_profile_attributes;
create trigger trg_catalog_sync_person_profile_attributes
after insert or update or delete on public.user_profile_attributes
for each row execute function public.catalog_sync_person_profile_attribute_trigger();

commit;
