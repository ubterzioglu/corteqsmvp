begin;

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table if not exists public.catalog_search_documents (
  item_id uuid primary key references public.catalog_items(id) on delete cascade,
  item_type text not null,
  title text not null,
  search_text text not null,
  search_vector tsvector,
  country_code text,
  city text,
  category_slugs text[] not null default '{}'::text[],
  language_codes text[] not null default '{}'::text[],
  filter_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.catalog_search_documents enable row level security;

create or replace function public.catalog_search_normalize(input_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both ' ' from lower(unaccent(coalesce(input_text, ''))));
$$;

create index if not exists idx_catalog_search_documents_vector
  on public.catalog_search_documents using gin (search_vector);
create index if not exists idx_catalog_search_documents_item_type
  on public.catalog_search_documents(item_type);
create index if not exists idx_catalog_search_documents_city
  on public.catalog_search_documents(city);
create index if not exists idx_catalog_search_documents_country
  on public.catalog_search_documents(country_code);
create index if not exists idx_catalog_search_documents_category_slugs
  on public.catalog_search_documents using gin (category_slugs);
create index if not exists idx_catalog_search_documents_language_codes
  on public.catalog_search_documents using gin (language_codes);
create index if not exists idx_catalog_search_documents_title_trgm
  on public.catalog_search_documents using gin (title gin_trgm_ops);
create index if not exists idx_catalog_search_documents_search_text_trgm
  on public.catalog_search_documents using gin (search_text gin_trgm_ops);

create or replace function public.catalog_rebuild_search_document(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
      ci.title,
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
$$;

create or replace function public.catalog_rebuild_search_documents_for_category(p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  for v_item_id in
    select cic.item_id
    from public.catalog_item_categories cic
    where cic.category_id = p_category_id
  loop
    perform public.catalog_rebuild_search_document(v_item_id);
  end loop;
end;
$$;

create or replace function public.catalog_refresh_all_search_documents()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  for v_item_id in
    select ci.id
    from public.catalog_items ci
  loop
    perform public.catalog_rebuild_search_document(v_item_id);
  end loop;
end;
$$;

create or replace function public.catalog_search_document_item_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.catalog_search_documents
    where item_id = old.id;
    return old;
  end if;

  perform public.catalog_rebuild_search_document(new.id);
  return new;
end;
$$;

create or replace function public.catalog_search_document_related_item_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid := coalesce(new.item_id, old.item_id);
begin
  perform public.catalog_rebuild_search_document(v_item_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.catalog_search_document_category_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.catalog_rebuild_search_documents_for_category(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_catalog_search_document_items on public.catalog_items;
create trigger trg_catalog_search_document_items
after insert or update or delete on public.catalog_items
for each row execute function public.catalog_search_document_item_trigger();

drop trigger if exists trg_catalog_search_document_item_categories on public.catalog_item_categories;
create trigger trg_catalog_search_document_item_categories
after insert or update or delete on public.catalog_item_categories
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_contacts on public.catalog_item_contacts;
create trigger trg_catalog_search_document_item_contacts
after insert or update or delete on public.catalog_item_contacts
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_services on public.catalog_item_services;
create trigger trg_catalog_search_document_item_services
after insert or update or delete on public.catalog_item_services
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_tags on public.catalog_item_tags;
create trigger trg_catalog_search_document_item_tags
after insert or update or delete on public.catalog_item_tags
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_locations on public.catalog_item_locations;
create trigger trg_catalog_search_document_item_locations
after insert or update or delete on public.catalog_item_locations
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_languages on public.catalog_item_languages;
create trigger trg_catalog_search_document_item_languages
after insert or update or delete on public.catalog_item_languages
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_links on public.catalog_item_links;
create trigger trg_catalog_search_document_item_links
after insert or update or delete on public.catalog_item_links
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_item_media on public.catalog_item_media;
create trigger trg_catalog_search_document_item_media
after insert or update or delete on public.catalog_item_media
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_event_details on public.event_details;
create trigger trg_catalog_search_document_event_details
after insert or update or delete on public.event_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_marketplace_details on public.marketplace_listing_details;
create trigger trg_catalog_search_document_marketplace_details
after insert or update or delete on public.marketplace_listing_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_job_details on public.job_posting_details;
create trigger trg_catalog_search_document_job_details
after insert or update or delete on public.job_posting_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_business_details on public.business_details;
create trigger trg_catalog_search_document_business_details
after insert or update or delete on public.business_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_organization_details on public.organization_details;
create trigger trg_catalog_search_document_organization_details
after insert or update or delete on public.organization_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_advisor_details on public.advisor_details;
create trigger trg_catalog_search_document_advisor_details
after insert or update or delete on public.advisor_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_group_details on public.community_group_details;
create trigger trg_catalog_search_document_group_details
after insert or update or delete on public.community_group_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_person_details on public.person_profile_details;
create trigger trg_catalog_search_document_person_details
after insert or update or delete on public.person_profile_details
for each row execute function public.catalog_search_document_related_item_trigger();

drop trigger if exists trg_catalog_search_document_categories on public.catalog_categories;
create trigger trg_catalog_search_document_categories
after insert or update or delete on public.catalog_categories
for each row execute function public.catalog_search_document_category_trigger();

drop policy if exists "catalog_search_documents_no_direct_anon_read" on public.catalog_search_documents;
create policy "catalog_search_documents_no_direct_anon_read"
on public.catalog_search_documents
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "catalog_search_documents_service_role_all" on public.catalog_search_documents;
create policy "catalog_search_documents_service_role_all"
on public.catalog_search_documents
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete on public.catalog_search_documents to authenticated, service_role;

select public.catalog_refresh_all_search_documents();

commit;
