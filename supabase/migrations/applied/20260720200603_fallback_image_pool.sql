-- Fallback görsel havuzu — haber (news_diaspora) ve mekan (mekan) kayıtlarında
-- taramada görsel bulunamadığında kalıcı olarak atanacak serbest lisanslı görseller.
-- Desen kaynağı: 20260708120000_burak_share_assets.sql (tablo+RLS+bucket),
-- 20260424110000_add_marquee_items.sql (public read bucket policy deseni).

BEGIN;

-- ─────────────────────────────────────────────
-- 1) fallback_image_pool
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fallback_image_pool (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category            TEXT        NOT NULL CHECK (category IN ('news_diaspora', 'mekan')),
  storage_bucket      TEXT        NOT NULL DEFAULT 'fallback-image-pool',
  storage_path        TEXT        NOT NULL,
  source_attribution  TEXT,
  used_count          INTEGER     NOT NULL DEFAULT 0,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_fallback_image_pool_pick
  ON public.fallback_image_pool (category, is_active, used_count);

ALTER TABLE public.fallback_image_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fallback_image_pool_admin_select" ON public.fallback_image_pool;
CREATE POLICY "fallback_image_pool_admin_select"
  ON public.fallback_image_pool FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "fallback_image_pool_admin_insert" ON public.fallback_image_pool;
CREATE POLICY "fallback_image_pool_admin_insert"
  ON public.fallback_image_pool FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "fallback_image_pool_admin_update" ON public.fallback_image_pool;
CREATE POLICY "fallback_image_pool_admin_update"
  ON public.fallback_image_pool FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "fallback_image_pool_admin_delete" ON public.fallback_image_pool;
CREATE POLICY "fallback_image_pool_admin_delete"
  ON public.fallback_image_pool FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

COMMENT ON TABLE public.fallback_image_pool IS
  'Taramada görsel bulunamadığında haber/mekan kayıtlarına kalıcı atanacak serbest lisanslı görsel havuzu (Pexels vb). category: news_diaspora | mekan.';

-- ─────────────────────────────────────────────
-- 2) Public storage bucket (görseller son kullanıcıya gösterilecek)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'fallback-image-pool',
  'fallback-image-pool',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'fallback-image-pool'
);

DROP POLICY IF EXISTS "fallback image pool public read" ON storage.objects;
CREATE POLICY "fallback image pool public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'fallback-image-pool');

DROP POLICY IF EXISTS "fallback image pool admin insert" ON storage.objects;
CREATE POLICY "fallback image pool admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fallback-image-pool' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "fallback image pool admin update" ON storage.objects;
CREATE POLICY "fallback image pool admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fallback-image-pool' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'fallback-image-pool' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "fallback image pool admin delete" ON storage.objects;
CREATE POLICY "fallback image pool admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fallback-image-pool' AND public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────
-- 3) pick_fallback_image — en az kullanılanı tercih eden atomik seçim.
--    security definer: authenticated (admin onay akışları) ve service_role
--    (radar/service-finder arka plan işleri) tarafından çağrılır.
--    Public URL sabit proje base'i ile inşa edilir (bkz. CLAUDE.md
--    "Hardcoded Supabase Project ID" — zaten .env.local'da açık referans).
--    Farklı bir Supabase projesine taşınırsa bu sabit güncellenmeli.
-- ─────────────────────────────────────────────
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
  IF p_category NOT IN ('news_diaspora', 'mekan') THEN
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

REVOKE ALL ON FUNCTION public.pick_fallback_image(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pick_fallback_image(text) TO authenticated, service_role;

COMMENT ON FUNCTION public.pick_fallback_image(text) IS
  'category (news_diaspora|mekan) için en az kullanılan aktif görseli seçer, used_count''ı artırır, public URL döner. Havuz boşsa satır dönmez (çağıran taraf null''a fallback eder).';

-- ─────────────────────────────────────────────
-- 4) admin_publish_service_finder_candidate — cover görsel eksikse
--    fallback havuzundan mekan görseli ataması eklenir.
--    Fonksiyonun geri kalanı 20260614103000_create_service_finder_rpcs.sql
--    ile birebir aynı; yalnızca catalog_item_media adımı eklendi.
-- ─────────────────────────────────────────────
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
  v_has_cover boolean;
  v_fallback_url text;
  v_fallback_pool_id uuid;
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

  -- Cover görsel yoksa fallback havuzundan ata (yalnızca eksikse — kalıcı atama).
  SELECT EXISTS (
    SELECT 1 FROM public.catalog_item_media
    WHERE item_id = v_item_id AND media_type = 'cover'
  ) INTO v_has_cover;

  IF NOT v_has_cover THEN
    SELECT public_url, pool_id INTO v_fallback_url, v_fallback_pool_id
    FROM public.pick_fallback_image('mekan');

    IF v_fallback_url IS NOT NULL THEN
      INSERT INTO public.catalog_item_media
        (item_id, media_type, url, storage_bucket, storage_path, is_public, is_primary, sort_order, metadata)
      VALUES
        (v_item_id, 'cover', v_fallback_url, 'fallback-image-pool', null, true, true, 0,
         jsonb_build_object('source', 'fallback_image_pool', 'fallback_image_pool_id', v_fallback_pool_id));
    END IF;
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

COMMIT;
