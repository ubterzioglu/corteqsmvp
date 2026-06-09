-- Catalog/Flat-Role/AFS Rebuild — Migration 010b: rewire write-path functions
--
-- The title->display_name rename (migration 002) broke catalog_rebuild_search_document,
-- which is invoked by the AFTER INSERT/UPDATE/DELETE trigger on catalog_items
-- (trg_catalog_search_document_items -> catalog_search_document_item_trigger ->
-- catalog_rebuild_search_document). Any write to catalog_items — including the
-- placeholder seed (migration 014) — fires it and fails with "column ci.title
-- does not exist". This migration must run BEFORE the seeds.
--
-- Only catalog_items.title is renamed; catalog_search_documents.title is NOT.
-- Minimal-touch fix: alias catalog_items.display_name AS title in the base CTE,
-- so all downstream references (bi.title x3, v_payload.title, the INSERT target
-- catalog_search_documents.title) remain unchanged.
--
-- (The 16 read-only RPCs that reference catalog_items.title are rewired in Phase 4.)

create or replace function public.catalog_rebuild_search_document(p_item_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_payload record;
begin
  if p_item_id is null then
    return;
  end if;

  with base_item as (
    select
      ci.id,
      ci.item_type,
      ci.display_name as title,
      ci.headline,
      ci.short_description,
      ci.long_description,
      ci.status,
      ci.visibility,
      ci.verification_status,
      ci.published_at
    from public.catalog_items ci
    where ci.id = p_item_id
  ),
  locations as (
    select
      cil.item_id,
      max(cil.country_code) filter (where cil.is_primary) as country_code,
      max(cil.city) filter (where cil.is_primary) as city
    from public.catalog_item_locations cil
    where cil.item_id = p_item_id
    group by cil.item_id
  ),
  categories as (
    select
      cic.item_id,
      coalesce(array_agg(distinct cc.slug order by cc.slug), '{}'::text[]) as category_slugs,
      string_agg(distinct cc.name, ' ') as category_text
    from public.catalog_item_categories cic
    join public.catalog_categories cc on cc.id = cic.category_id
    where cic.item_id = p_item_id
    group by cic.item_id
  ),
  languages as (
    select
      cil.item_id,
      coalesce(array_agg(distinct cil.language_code order by cil.language_code), '{}'::text[]) as language_codes
    from public.catalog_item_languages cil
    where cil.item_id = p_item_id
    group by cil.item_id
  ),
  contacts as (
    select
      cic.item_id,
      string_agg(distinct cic.contact_value, ' ') filter (where cic.is_public) as public_contacts
    from public.catalog_item_contacts cic
    where cic.item_id = p_item_id
    group by cic.item_id
  ),
  tags as (
    select
      cit.item_id,
      string_agg(distinct cit.tag_label, ' ') as tag_text
    from public.catalog_item_tags cit
    where cit.item_id = p_item_id
    group by cit.item_id
  ),
  services as (
    select
      cis.item_id,
      string_agg(distinct cis.service_name, ' ') filter (where cis.is_public) as service_text
    from public.catalog_item_services cis
    where cis.item_id = p_item_id
    group by cis.item_id
  ),
  media as (
    select
      cim.item_id,
      max(coalesce(cim.thumbnail_url, cim.url)) filter (where cim.is_public and cim.is_primary) as thumbnail_url
    from public.catalog_item_media cim
    where cim.item_id = p_item_id
    group by cim.item_id
  ),
  person_visibility as (
    select
      ppd.item_id,
      ppd.directory_opt_in
    from public.person_profile_details ppd
    where ppd.item_id = p_item_id
  ),
  expiry_state as (
    select
      ed.item_id,
      ed.ends_at as expires_at
    from public.event_details ed
    where ed.item_id = p_item_id
    union all
    select
      jpd.item_id,
      jpd.expires_at
    from public.job_posting_details jpd
    where jpd.item_id = p_item_id
    union all
    select
      mld.item_id,
      mld.expires_at
    from public.marketplace_listing_details mld
    where mld.item_id = p_item_id
  )
  select
    bi.id as item_id,
    bi.item_type,
    bi.title,
    concat_ws(
      ' ',
      bi.title,
      bi.headline,
      bi.short_description,
      bi.long_description,
      cat.category_text,
      c.public_contacts,
      t.tag_text,
      s.service_text,
      loc.city,
      loc.country_code
    ) as search_text,
    loc.country_code,
    loc.city,
    coalesce(cat.category_slugs, '{}'::text[]) as category_slugs,
    coalesce(lang.language_codes, '{}'::text[]) as language_codes,
    jsonb_build_object(
      'status', bi.status,
      'visibility', bi.visibility,
      'verification_status', bi.verification_status,
      'published_at', bi.published_at,
      'thumbnail_url', media.thumbnail_url,
      'directory_opt_in', coalesce(pv.directory_opt_in, false),
      'expires_at', (
        select max(expires_at)
        from expiry_state es
        where es.item_id = bi.id
      )
    ) as filter_data
  into v_payload
  from base_item bi
  left join locations loc on loc.item_id = bi.id
  left join categories cat on cat.item_id = bi.id
  left join languages lang on lang.item_id = bi.id
  left join contacts c on c.item_id = bi.id
  left join tags t on t.item_id = bi.id
  left join services s on s.item_id = bi.id
  left join media on media.item_id = bi.id
  left join person_visibility pv on pv.item_id = bi.id;

  if v_payload.item_id is null then
    delete from public.catalog_search_documents
    where item_id = p_item_id;
    return;
  end if;

  insert into public.catalog_search_documents (
    item_id,
    item_type,
    title,
    search_text,
    search_vector,
    country_code,
    city,
    category_slugs,
    language_codes,
    filter_data,
    updated_at
  )
  values (
    v_payload.item_id,
    v_payload.item_type,
    v_payload.title,
    coalesce(v_payload.search_text, v_payload.title),
    to_tsvector('simple', public.catalog_search_normalize(coalesce(v_payload.search_text, v_payload.title))),
    v_payload.country_code,
    v_payload.city,
    v_payload.category_slugs,
    v_payload.language_codes,
    v_payload.filter_data,
    now()
  )
  on conflict (item_id) do update
  set
    item_type = excluded.item_type,
    title = excluded.title,
    search_text = excluded.search_text,
    search_vector = excluded.search_vector,
    country_code = excluded.country_code,
    city = excluded.city,
    category_slugs = excluded.category_slugs,
    language_codes = excluded.language_codes,
    filter_data = excluded.filter_data,
    updated_at = now();
end;
$function$;
