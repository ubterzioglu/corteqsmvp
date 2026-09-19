-- catalog_upsert_source_item: olmayan catalog_items.created_by_user_id sutununa yazma hatasi.
--
-- Kanit (canli, 2026-09-19): events tablosuna test INSERT'i
--   SQLSTATE 42703 - column "created_by_user_id" of relation "catalog_items" does not exist
-- ile dustu. Zincir: insert events -> trg_catalog_sync_event -> catalog_sync_event()
--   -> catalog_upsert_source_item() -> insert into catalog_items (... created_by_user_id ...)
--
-- catalog_items'ta sutunun gercek adi "created_by" (AFS yeniden yapilandirmasinda yeniden
-- adlandirildi, fonksiyon guncellenmedi). Bu yuzden legacy katalog senkronizasyonu yapan
-- TUM yollar bozuktu: events, whatsapp_landings, independent_profiles.
--
-- Govde canli pg_get_functiondef ciktisindan alindi; yalnizca sutun adi degisti.
-- Parametre adi p_created_by_user_id BILEREK korundu - cagrilar konumsal, imza degismemeli.
-- CREATE OR REPLACE mevcut GRANT/REVOKE'lari korur.
CREATE OR REPLACE FUNCTION public.catalog_upsert_source_item(p_source_type text, p_external_id text, p_item_type text, p_slug text, p_title text, p_headline text, p_short_description text, p_long_description text, p_status text, p_visibility text, p_verification_status text, p_created_by_user_id uuid, p_published_at timestamp with time zone, p_attributes jsonb DEFAULT '{}'::jsonb, p_source_url text DEFAULT NULL::text, p_raw_snapshot jsonb DEFAULT '{}'::jsonb, p_platform_role_key text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item_id uuid;
  v_platform_role_key text := nullif(coalesce(p_platform_role_key, p_attributes ->> 'platform_role_key'), '');
begin
  if v_platform_role_key is not null and not exists (
    select 1 from public.roles where key = v_platform_role_key and is_active = true
  ) then
    raise exception 'invalid catalog item role' using errcode = '22023';
  end if;

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
      created_by,
      published_at,
      attributes,
      platform_role_key
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
      coalesce(p_attributes, '{}'::jsonb),
      v_platform_role_key
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
      created_by = coalesce(excluded.created_by, public.catalog_items.created_by),
      published_at = excluded.published_at,
      attributes = coalesce(public.catalog_items.attributes, '{}'::jsonb) || excluded.attributes,
      platform_role_key = coalesce(excluded.platform_role_key, public.catalog_items.platform_role_key),
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
      created_by = coalesce(p_created_by_user_id, created_by),
      published_at = p_published_at,
      attributes = coalesce(attributes, '{}'::jsonb) || coalesce(p_attributes, '{}'::jsonb),
      platform_role_key = coalesce(v_platform_role_key, platform_role_key),
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
$function$


