-- Fallback görsel havuzu YALNIZCA Radar News (haber) akışı için kullanılacak.
-- 20260720200603_fallback_image_pool.sql, admin_publish_service_finder_candidate
-- RPC'sine mekan/sağlayıcı cover görseli atayan bir adım eklemişti — bu yanlış
-- kapsamdı ve geri alınıyor. fallback_image_pool tablosu, bucket'ı ve
-- pick_fallback_image RPC'si kalır (radar tarafı hâlâ kullanıyor); yalnızca
-- service-finder'ın bu havuza dokunan kısmı kaldırılıyor.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_publish_service_finder_candidate(
  p_candidate_id uuid,
  p_patch jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.service_finder_require_admin();
  v_c public.service_finder_candidates%rowtype;
  v_job public.service_finder_jobs%rowtype;
  v_category_slug text;
  v_category_id uuid;
  v_slug text;
  v_item_id uuid;
  v_headline text;
  v_description text;
  v_contact jsonb;
  v_idx int := 0;
  v_lang text;
  v_service text;
  v_tag text;
  v_tags text[];
  v_appointment text;
  v_source_url text;
BEGIN
  -- Onaylı adayı kilitle
  SELECT * INTO v_c FROM public.service_finder_candidates WHERE id = p_candidate_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'sf_candidate_not_found';
  END IF;
  IF v_c.review_status = 'published' THEN
    RAISE EXCEPTION 'sf_candidate_already_published';
  END IF;

  -- Yayın öncesi son düzenlemeler (review ile aynı alanlar)
  IF p_patch <> '{}'::jsonb THEN
    PERFORM public.admin_review_service_finder_candidate(p_candidate_id, 'approved', p_patch);
    SELECT * INTO v_c FROM public.service_finder_candidates WHERE id = p_candidate_id;
  END IF;

  IF v_c.review_status <> 'approved' THEN
    RAISE EXCEPTION 'sf_candidate_not_approved';
  END IF;

  SELECT * INTO v_job FROM public.service_finder_jobs WHERE id = v_c.job_id;

  -- Kategori çözümle (importer: ensureCatalogCategory)
  v_category_slug := coalesce(v_c.category_slug, v_job.category_slug);
  IF v_category_slug IS NULL THEN
    RAISE EXCEPTION 'sf_category_required';
  END IF;

  SELECT id INTO v_category_id FROM public.catalog_categories WHERE slug = v_category_slug;
  IF v_category_id IS NULL THEN
    INSERT INTO public.catalog_categories (module, slug, name, description, is_active, sort_order)
    VALUES (
      v_c.item_type,
      v_category_slug,
      coalesce(v_c.profession_label, v_category_slug),
      coalesce(v_c.profession_label, v_category_slug) || ' category for ' || v_c.item_type,
      true,
      1000
    )
    RETURNING id INTO v_category_id;
  END IF;

  -- Slug: importer deseni [city, roleLabel, title]
  v_slug := public.service_finder_slugify(
    concat_ws(' ', v_c.city, coalesce(v_c.profession_label, v_c.role_key), v_c.canonical_name)
  );
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'sf_slug_generation_failed';
  END IF;

  v_headline := coalesce(
    nullif(array_to_string(v_c.services, ', '), ''),
    v_c.profession_label,
    v_c.role_key
  );
  v_description := concat_ws(' ',
    v_c.canonical_name,
    CASE WHEN v_c.city IS NOT NULL THEN v_c.city || ' lokasyonunda' END,
    v_c.profession_label,
    CASE WHEN array_length(v_c.services, 1) > 0 THEN '(' || array_to_string(v_c.services, ', ') || ')' END
  );
  v_source_url := coalesce(
    v_c.website_url,
    (SELECT s.source_url FROM public.service_finder_job_sources s WHERE s.id = v_c.primary_source_id)
  );

  -- Kanonik upsert
  v_item_id := public.catalog_upsert_source_item(
    p_source_type => 'service_finder',
    p_external_id => v_c.id::text,
    p_item_type => v_c.item_type,
    p_slug => v_slug,
    p_title => v_c.canonical_name,
    p_headline => v_headline,
    p_short_description => v_description,
    p_long_description => v_description || ' Service Finder taraması ile bulunmuş, admin onayı sonrası yayınlanmıştır.',
    p_status => 'published',
    p_visibility => 'public',
    p_verification_status => 'unverified',
    p_created_by_user_id => v_uid,
    p_published_at => now(),
    p_attributes => jsonb_build_object(
      'import_source', 'service_finder',
      'source_label', 'Service Finder',
      'platform_role_label', coalesce(v_c.profession_label, v_c.role_key),
      'service_finder_job_id', v_c.job_id,
      'service_finder_candidate_id', v_c.id,
      'confidence_score', v_c.confidence_score
    ),
    p_source_url => v_source_url,
    p_raw_snapshot => v_c.normalized_payload,
    p_platform_role_key => v_c.role_key
  );

  PERFORM public.catalog_reset_item_projection(v_item_id);

  -- Uydu tablolar (importer sırası ve alan değerleriyle birebir)
  INSERT INTO public.catalog_item_categories (item_id, category_id, is_primary)
  VALUES (v_item_id, v_category_id, true)
  ON CONFLICT (item_id, category_id) DO UPDATE SET is_primary = excluded.is_primary;

  FOR v_contact IN SELECT value FROM jsonb_array_elements(coalesce(v_c.contacts, '[]'::jsonb))
  LOOP
    IF nullif(v_contact ->> 'value', '') IS NOT NULL THEN
      INSERT INTO public.catalog_item_contacts
        (item_id, contact_type, contact_value, label, is_primary, is_public, sort_order)
      VALUES
        (v_item_id,
         coalesce(nullif(v_contact ->> 'type', ''), 'website'),
         v_contact ->> 'value',
         nullif(v_contact ->> 'label', ''),
         coalesce((v_contact ->> 'is_primary')::boolean, v_idx = 0),
         true,
         v_idx * 10);
      v_idx := v_idx + 1;
    END IF;
  END LOOP;

  INSERT INTO public.catalog_item_locations
    (item_id, country_code, region, city, address_line, postal_code, latitude, longitude, is_primary)
  VALUES
    (v_item_id, v_c.country_code, v_c.region, v_c.city, v_c.address_line, null, null, null, true);

  v_idx := 0;
  FOREACH v_lang IN ARRAY coalesce(v_c.languages, '{}'::text[])
  LOOP
    INSERT INTO public.catalog_item_languages (item_id, language_code, proficiency, is_primary)
    VALUES (v_item_id, v_lang, CASE WHEN v_idx = 0 THEN 'native_or_fluent' ELSE 'professional' END, v_idx = 0)
    ON CONFLICT (item_id, language_code) DO NOTHING;
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_service IN ARRAY coalesce(v_c.services, '{}'::text[])
  LOOP
    INSERT INTO public.catalog_item_services
      (item_id, service_slug, service_name, description, is_public, sort_order)
    VALUES
      (v_item_id, public.service_finder_slugify(v_service), v_service, null, true, v_idx * 10)
    ON CONFLICT (item_id, service_slug) DO NOTHING;
    v_idx := v_idx + 1;
  END LOOP;

  SELECT coalesce(array_agg(t), '{}'::text[]) INTO v_tags
  FROM unnest(array[
    coalesce(v_c.profession_label, v_c.role_key), v_c.city, v_c.country_code
  ]) AS t WHERE t IS NOT NULL AND t <> '';

  FOREACH v_tag IN ARRAY v_tags
  LOOP
    INSERT INTO public.catalog_item_tags (item_id, tag_slug, tag_label)
    VALUES (v_item_id, public.service_finder_slugify(v_tag), v_tag)
    ON CONFLICT (item_id, tag_slug) DO NOTHING;
  END LOOP;

  -- item_type'a göre uzantı tablosu (importer: upsertExtensionRecord)
  v_appointment := coalesce(
    v_c.appointment_url,
    (SELECT c ->> 'value' FROM jsonb_array_elements(coalesce(v_c.contacts, '[]'::jsonb)) c
      WHERE c ->> 'type' = 'appointment_url' LIMIT 1)
  );

  IF v_c.item_type = 'advisor' THEN
    INSERT INTO public.advisor_details
      (item_id, consultation_modes, languages, supports_online_consultation, appointment_url)
    VALUES
      (v_item_id, array['in_person'], v_c.languages, false, v_appointment)
    ON CONFLICT (item_id) DO UPDATE
      SET languages = excluded.languages, appointment_url = excluded.appointment_url;
  ELSIF v_c.item_type = 'business' THEN
    INSERT INTO public.business_details (item_id, supports_online_booking, appointment_url)
    VALUES (v_item_id, false, v_appointment)
    ON CONFLICT (item_id) DO UPDATE SET appointment_url = excluded.appointment_url;
  ELSIF v_c.item_type = 'organization' THEN
    INSERT INTO public.organization_details (item_id, organization_kind, metadata)
    VALUES (v_item_id, coalesce(v_c.profession_label, v_c.role_key), v_c.normalized_payload)
    ON CONFLICT (item_id) DO UPDATE
      SET organization_kind = excluded.organization_kind, metadata = excluded.metadata;
  END IF;

  -- Aday durumunu yayınlandı yap
  UPDATE public.service_finder_candidates
  SET review_status = 'published',
      catalog_item_id = v_item_id,
      published_at = now(),
      reviewed_by_user_id = v_uid,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_candidate_id;

  INSERT INTO public.service_finder_job_events (job_id, candidate_id, event_type, message, event_payload)
  VALUES (v_c.job_id, p_candidate_id, 'candidate_published',
          'Aday kataloğa yayınlandı.',
          jsonb_build_object('catalog_item_id', v_item_id, 'published_by', v_uid));

  RETURN jsonb_build_object(
    'candidate_id', p_candidate_id,
    'catalog_item_id', v_item_id,
    'review_status', 'published'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_publish_service_finder_candidate(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_publish_service_finder_candidate(uuid, jsonb) TO authenticated;

-- Herhangi bir mekan yayınında zaten fallback havuzundan atanmış cover
-- kayıtlarını temizle (yalnızca bu kaynaktan gelenler; kullanıcı/başka
-- kaynaklı cover görselleri dokunulmaz).
DELETE FROM public.catalog_item_media
WHERE media_type = 'cover'
  AND metadata ->> 'source' = 'fallback_image_pool';

-- mekan kategorisi artık kullanılmıyor; sadece haber (news_diaspora) kalır.
DELETE FROM public.fallback_image_pool WHERE category = 'mekan';

ALTER TABLE public.fallback_image_pool
  DROP CONSTRAINT IF EXISTS fallback_image_pool_category_check;
ALTER TABLE public.fallback_image_pool
  ADD CONSTRAINT fallback_image_pool_category_check CHECK (category = 'news_diaspora');

CREATE OR REPLACE FUNCTION public.pick_fallback_image(p_category text)
RETURNS TABLE (public_url text, pool_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.fallback_image_pool%rowtype;
  v_base_url constant text := 'https://injprdrsklkxgnaiixzh.supabase.co';
BEGIN
  IF p_category <> 'news_diaspora' THEN
    RAISE EXCEPTION 'fallback_image_invalid_category';
  END IF;

  SELECT * INTO v_row
  FROM public.fallback_image_pool
  WHERE category = p_category AND is_active = true
  ORDER BY used_count ASC, random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.fallback_image_pool
  SET used_count = used_count + 1
  WHERE id = v_row.id;

  RETURN QUERY SELECT
    v_base_url || '/storage/v1/object/public/' || v_row.storage_bucket || '/' || v_row.storage_path,
    v_row.id;
END;
$$;

COMMENT ON FUNCTION public.pick_fallback_image(text) IS
  'category=''news_diaspora'' için en az kullanılan aktif görseli seçer, used_count''ı artırır, public URL döner. Yalnızca Radar News akışı kullanır — service-finder/mekan bu havuzu kullanmaz. Havuz boşsa satır dönmez.';

COMMENT ON TABLE public.fallback_image_pool IS
  'Radar News (haber) taramasında görsel bulunamadığında kalıcı atanacak serbest lisanslı görsel havuzu (Pexels vb). Yalnızca category=news_diaspora — service-finder/mekan kapsam dışı.';

COMMIT;
