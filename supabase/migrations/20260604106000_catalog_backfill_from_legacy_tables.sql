begin;

do $$
declare
  v_event_id uuid;
  v_job_id uuid;
  v_group_id uuid;
  v_profile_id uuid;
  v_mission_id uuid;
  v_user_id uuid;
begin
  for v_event_id in
    select id from public.events
  loop
    perform public.catalog_sync_event(v_event_id);
  end loop;

  for v_job_id in
    select id from public.job_listings
  loop
    perform public.catalog_sync_job_listing(v_job_id);
  end loop;

  for v_group_id in
    select id from public.whatsapp_landings
  loop
    perform public.catalog_sync_whatsapp_landing(v_group_id);
  end loop;

  for v_profile_id in
    select id from public.independent_profiles
  loop
    perform public.catalog_sync_independent_profile(v_profile_id);
  end loop;

  for v_mission_id in
    select id from public.turkish_missions
  loop
    perform public.catalog_sync_turkish_mission(v_mission_id);
  end loop;

  for v_user_id in
    select id from public.profiles
  loop
    perform public.catalog_sync_person_profile(v_user_id);
  end loop;
end
$$;

with org_sources as (
  select
    ci.id as item_id,
    lower(coalesce(ci.title, '')) as normalized_title,
    lower(coalesce(loc.city, '')) as normalized_city,
    lower(coalesce(loc.country_code, '')) as normalized_country_code,
    min(sr.source_type) as source_type
  from public.catalog_items ci
  join public.source_records sr on sr.item_id = ci.id
  left join public.catalog_item_locations loc on loc.item_id = ci.id and loc.is_primary = true
  where ci.item_type = 'organization'
  group by ci.id, lower(coalesce(ci.title, '')), lower(coalesce(loc.city, '')), lower(coalesce(loc.country_code, ''))
),
pairs as (
  select
    left_src.item_id as left_item_id,
    right_src.item_id as right_item_id,
    0.92::numeric(5,2) as confidence,
    'legacy-backfill-similar-title-city'::text as reason
  from org_sources left_src
  join org_sources right_src
    on left_src.item_id < right_src.item_id
   and left_src.normalized_title = right_src.normalized_title
   and left_src.normalized_city = right_src.normalized_city
   and left_src.normalized_country_code = right_src.normalized_country_code
   and left_src.source_type <> right_src.source_type
)
insert into public.duplicate_candidates (
  left_item_id,
  right_item_id,
  confidence,
  reason,
  status,
  payload
)
select
  p.left_item_id,
  p.right_item_id,
  p.confidence,
  p.reason,
  'pending',
  jsonb_build_object('seeded_by', 'catalog_backfill_from_legacy_tables')
from pairs p
on conflict (left_item_id, right_item_id) do update
set
  confidence = excluded.confidence,
  reason = excluded.reason,
  payload = excluded.payload,
  updated_at = now();

commit;
