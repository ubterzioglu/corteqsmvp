begin;

-- Run this script in the Supabase SQL editor or a privileged local test database.
-- It intentionally uses a transaction so that all inserted smoke-test records can be rolled back.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'google-user@example.com',
    '$2a$10$abcdefghijklmnopqrstuv',
    now(),
    '{"provider":"google"}'::jsonb,
    '{"full_name":"Google User","avatar_url":"https://example.com/google.png"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'email-user@example.com',
    '$2a$10$abcdefghijklmnopqrstuv',
    now(),
    '{"provider":"email"}'::jsonb,
    '{"full_name":"Email User"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'moderator@example.com',
    '$2a$10$abcdefghijklmnopqrstuv',
    now(),
    '{"provider":"email"}'::jsonb,
    '{"full_name":"Moderator User"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'manager@example.com',
    '$2a$10$abcdefghijklmnopqrstuv',
    now(),
    '{"provider":"email"}'::jsonb,
    '{"full_name":"Second Manager"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

update public.profiles
set platform_role = 'moderator'
where id = '33333333-3333-3333-3333-333333333333';

do $$
begin
  if not exists (select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111') then
    raise exception 'Google-authenticated user profile creation failed';
  end if;

  if not exists (select 1 from public.profiles where id = '22222222-2222-2222-2222-222222222222') then
    raise exception 'Email/password user profile creation failed';
  end if;
end;
$$;

do $$
declare
  v_restaurant_id uuid;
  v_advisor_id uuid;
  v_event_id uuid;
  v_group_id uuid;
  v_expired_event_id uuid;
  v_expired_listing_id uuid;
begin
  v_restaurant_id := public.catalog_upsert_source_item(
    'manual.import.business',
    'rest-1',
    'business',
    'ankara-kebap-berlin',
    'Ankara Kebap Berlin',
    'Berlin''de Türk restoranı',
    'Kebap ve ev yemekleri',
    'Berlin merkezinde Türk mutfağı sunan bir restoran.',
    'published',
    'public',
    'unverified',
    null,
    now(),
    '{"import_batch":"smoke"}'::jsonb,
    'https://example.com/ankara-kebap',
    '{"source":"manual"}'::jsonb
  );

  perform public.catalog_reset_item_projection(v_restaurant_id);
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_restaurant_id, id, true
  from public.catalog_categories
  where module = 'business' and slug = 'restaurant';
  insert into public.catalog_item_locations (item_id, country_code, city, address_line, is_primary)
  values (v_restaurant_id, 'DE', 'Berlin', 'Alexanderplatz 1', true);
  insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
  values
    (v_restaurant_id, 'website', 'https://ankarakebap.example.com', 'Website', true, true, 10),
    (v_restaurant_id, 'phone', '+49-555-SECRET', 'Owner Phone', false, false, 20);
  insert into public.business_details (item_id, opening_hours, price_segment, supports_delivery, supports_online_booking)
  values (v_restaurant_id, '{"mon":"10:00-22:00"}'::jsonb, 'mid', true, false)
  on conflict (item_id) do update
  set opening_hours = excluded.opening_hours;
  perform public.catalog_create_duplicate_candidates_for_item(v_restaurant_id);
  perform public.catalog_rebuild_search_document(v_restaurant_id);

  v_advisor_id := public.catalog_upsert_source_item(
    'manual.import.advisor',
    'advisor-1',
    'advisor',
    'frankfurt-visa-danismani',
    'Frankfurt Vize Danışmanı',
    'Türkçe göçmenlik danışmanlığı',
    'Frankfurt ve çevresinde destek',
    'Türkçe konuşan göçmenlik ve vize danışmanlığı.',
    'published',
    'public',
    'verified',
    '11111111-1111-1111-1111-111111111111',
    now(),
    '{}'::jsonb,
    null,
    '{"source":"manual"}'::jsonb
  );
  perform public.catalog_reset_item_projection(v_advisor_id);
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_advisor_id, id, true
  from public.catalog_categories
  where module = 'advisor' and slug = 'visa-immigration';
  insert into public.catalog_item_locations (item_id, country_code, city, is_primary)
  values (v_advisor_id, 'DE', 'Frankfurt', true);
  insert into public.catalog_item_languages (item_id, language_code, is_primary)
  values (v_advisor_id, 'tr', true);
  insert into public.advisor_details (item_id, consultation_modes, languages, supports_online_consultation, appointment_url)
  values (v_advisor_id, array['online', 'office'], array['tr', 'de'], true, 'https://advisor.example.com/book')
  on conflict (item_id) do update
  set appointment_url = excluded.appointment_url;
  perform public.catalog_rebuild_search_document(v_advisor_id);

  v_event_id := public.catalog_upsert_source_item(
    'manual.import.event',
    'event-1',
    'event',
    'berlin-networking-night',
    'Berlin Networking Night',
    'Diaspora networking etkinliği',
    'Kurucu ve profesyoneller için',
    'Diaspora profesyonelleri için networking etkinliği.',
    'published',
    'public',
    'unverified',
    '11111111-1111-1111-1111-111111111111',
    now(),
    '{}'::jsonb,
    null,
    '{"source":"manual"}'::jsonb
  );
  perform public.catalog_reset_item_projection(v_event_id);
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_event_id, id, true
  from public.catalog_categories
  where module = 'event' and slug = 'networking';
  insert into public.catalog_item_locations (item_id, country_code, city, is_primary)
  values (v_event_id, 'DE', 'Berlin', true);
  insert into public.event_details (item_id, starts_at, ends_at, venue_name)
  values (v_event_id, now() + interval '7 days', now() + interval '7 days 3 hours', 'Berlin Hub')
  on conflict (item_id) do update
  set starts_at = excluded.starts_at, ends_at = excluded.ends_at;
  perform public.catalog_rebuild_search_document(v_event_id);

  v_group_id := public.catalog_upsert_source_item(
    'manual.import.group',
    'group-1',
    'community_group',
    'berlin-whatsapp-toplulugu',
    'Berlin WhatsApp Topluluğu',
    'Şehir içi dayanışma grubu',
    'Berlin diaspora topluluğu',
    'Berlin ve çevresindeki diaspora üyeleri için WhatsApp topluluğu.',
    'published',
    'public',
    'verified',
    '11111111-1111-1111-1111-111111111111',
    now(),
    '{}'::jsonb,
    null,
    '{"source":"manual"}'::jsonb
  );
  perform public.catalog_reset_item_projection(v_group_id);
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  select v_group_id, id, true
  from public.catalog_categories
  where module = 'community_group' and slug in ('whatsapp', 'other');
  insert into public.catalog_item_locations (item_id, country_code, city, is_primary)
  values (v_group_id, 'DE', 'Berlin', true);
  insert into public.community_group_details (item_id, platform, join_url, member_count, requires_approval)
  values (v_group_id, 'whatsapp', 'https://chat.whatsapp.example.com/demo', 42, true)
  on conflict (item_id) do update
  set join_url = excluded.join_url;
  perform public.catalog_rebuild_search_document(v_group_id);

  v_expired_event_id := public.catalog_upsert_source_item(
    'manual.import.event',
    'event-expired',
    'event',
    'expired-event',
    'Expired Event',
    null,
    'Past event',
    'This event is already over.',
    'published',
    'public',
    'unverified',
    null,
    now() - interval '10 days',
    '{}'::jsonb,
    null,
    '{"source":"manual"}'::jsonb
  );
  insert into public.event_details (item_id, starts_at, ends_at, venue_name)
  values (v_expired_event_id, now() - interval '10 days', now() - interval '9 days', 'Old Venue')
  on conflict (item_id) do update
  set ends_at = excluded.ends_at;
  perform public.catalog_rebuild_search_document(v_expired_event_id);

  v_expired_listing_id := public.catalog_upsert_source_item(
    'manual.import.marketplace',
    'listing-expired',
    'marketplace_listing',
    'expired-listing',
    'Expired Listing',
    null,
    'Expired listing',
    'This listing has expired.',
    'published',
    'public',
    'unverified',
    null,
    now() - interval '15 days',
    '{}'::jsonb,
    null,
    '{"source":"manual"}'::jsonb
  );
  insert into public.marketplace_listing_details (item_id, listing_mode, price, currency, expires_at)
  values (v_expired_listing_id, 'other', 10, 'EUR', now() - interval '1 day')
  on conflict (item_id) do update
  set expires_at = excluded.expires_at;
  perform public.catalog_rebuild_search_document(v_expired_listing_id);
end;
$$;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select public.submit_catalog_claim_request(
  (select id from public.catalog_items where slug = 'ankara-kebap-berlin'),
  'ownership',
  '{"website":"https://ankarakebap.example.com"}'::jsonb,
  'Restoran kaydı tarafıma ait.'
);

do $$
begin
  if not exists (
    select 1
    from public.catalog_claim_requests
    where item_id = (select id from public.catalog_items where slug = 'ankara-kebap-berlin')
      and requested_by_user_id = '11111111-1111-1111-1111-111111111111'
      and status = 'pending'
  ) then
    raise exception 'Claim request was not created';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select public.review_catalog_claim_request(
  (
    select id
    from public.catalog_claim_requests
    where item_id = (select id from public.catalog_items where slug = 'ankara-kebap-berlin')
      and requested_by_user_id = '11111111-1111-1111-1111-111111111111'
    limit 1
  ),
  'approved',
  'Alan adı ve delil kontrolü tamamlandı.'
);

do $$
begin
  if not exists (
    select 1
    from public.catalog_item_memberships
    where item_id = (select id from public.catalog_items where slug = 'ankara-kebap-berlin')
      and user_id = '11111111-1111-1111-1111-111111111111'
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception 'Owner membership was not created after claim approval';
  end if;
end;
$$;

insert into public.catalog_item_memberships (item_id, user_id, role, status)
values (
  (select id from public.catalog_items where slug = 'ankara-kebap-berlin'),
  '44444444-4444-4444-4444-444444444444',
  'manager',
  'active'
)
on conflict (item_id, user_id, role) do update
set status = 'active', updated_at = now();

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
update public.catalog_items
set headline = 'Yeni sahip tarafından güncellendi'
where id = (select id from public.catalog_items where slug = 'ankara-kebap-berlin');

do $$
declare
  v_updated integer;
begin
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
  update public.catalog_items
  set headline = 'Yetkisiz güncelleme'
  where id = (select id from public.catalog_items where slug = 'ankara-kebap-berlin');
  get diagnostics v_updated = row_count;

  if v_updated <> 0 then
    raise exception 'Non-owner was able to update another item';
  end if;
end;
$$;

select public.catalog_sync_person_profile('22222222-2222-2222-2222-222222222222');
select public.catalog_refresh_all_search_documents();

do $$
begin
  if exists (
    select 1
    from public.search_catalog('Email User', array['person_profile'], null, null, null, null, false, 10, 0)
  ) then
    raise exception 'Person profile should remain hidden when directory_opt_in is false';
  end if;
end;
$$;

insert into public.independent_profiles (
  slug,
  profile_kind,
  type_label,
  title,
  subtitle,
  country,
  city,
  description,
  is_published
)
values
  ('ankara-restaurant-import-a', 'consulate', 'Test Import', 'Imported Test Organization', 'A', 'DE', 'Berlin', 'Duplicate candidate test A', true),
  ('ankara-restaurant-import-b', 'consulate', 'Test Import', 'Imported Test Organization', 'B', 'DE', 'Berlin', 'Duplicate candidate test B', true)
on conflict (slug) do nothing;

do $$
begin
  if not exists (
    select 1
    from public.duplicate_candidates dc
    join public.catalog_items left_ci on left_ci.id = dc.left_item_id
    join public.catalog_items right_ci on right_ci.id = dc.right_item_id
    where left_ci.title = 'Imported Test Organization'
      and right_ci.title = 'Imported Test Organization'
  ) then
    raise exception 'Duplicate import did not create a moderation candidate';
  end if;
end;
$$;

select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  if exists (
    select 1
    from public.catalog_item_contacts
    where item_id = (select id from public.catalog_items where slug = 'ankara-kebap-berlin')
      and contact_type = 'phone'
  ) then
    raise exception 'Private phone number is exposed through direct public reads';
  end if;
end;
$$;

do $$
declare
  v_count integer;
begin
  select count(distinct item_type)
  into v_count
  from public.search_catalog(
    'Berlin',
    array['business', 'advisor', 'event', 'community_group'],
    null,
    null,
    'DE',
    null,
    false,
    20,
    0
  );

  if v_count < 3 then
    raise exception 'Cross-type anonymous search did not return enough item types';
  end if;

  if exists (
    select 1
    from public.search_catalog('Expired Event', array['event'], null, null, null, null, false, 10, 0)
  ) then
    raise exception 'Expired event should not be returned';
  end if;

  if exists (
    select 1
    from public.search_catalog('Expired Listing', array['marketplace_listing'], null, null, null, null, false, 10, 0)
  ) then
    raise exception 'Expired marketplace listing should not be returned';
  end if;

  if not exists (
    select 1
    from public.search_catalog('Ankara Kebap Berlin', array['business'], array['restaurant'], 'Berlin', 'DE', null, false, 10, 0)
  ) then
    raise exception 'Anonymous visitor search did not return the restaurant';
  end if;
end;
$$;

rollback;
