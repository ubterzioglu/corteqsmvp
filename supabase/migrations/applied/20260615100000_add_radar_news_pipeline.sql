-- Radar News Pipeline — Faz 1
-- Yeni tablolar: radar_news_sources, radar_news_scan_runs,
--                radar_news_candidates, radar_news_review_logs, radar_news_keywords
-- RLS: anon/normal kullanıcı erişimi kapalı; sadece admin okuyabilir;
--       ingestion service_role ile yapılır.
-- NOT: admin_users tablosu kaldırıldı (mig 20260609003000).
--      Admin kontrolü is_admin(auth.uid()) RPC ile yapılır.

BEGIN;

-- ─────────────────────────────────────────────
-- 1. radar_news_sources
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radar_news_sources (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT        NOT NULL,
  source_type             TEXT        NOT NULL CHECK (source_type IN ('rss', 'atom', 'gdelt', 'json_api')),
  adapter_key             TEXT        NOT NULL,
  endpoint_url            TEXT        NOT NULL,
  website_url             TEXT,
  language                TEXT,
  country                 TEXT,
  category_default        TEXT,
  query_text              TEXT,
  trust_level             TEXT        NOT NULL DEFAULT 'standard'
                            CHECK (trust_level IN ('official', 'high', 'standard', 'discovery_only')),
  is_enabled              BOOLEAN     NOT NULL DEFAULT false,
  allow_public_image_hotlink BOOLEAN  NOT NULL DEFAULT false,
  terms_checked           BOOLEAN     NOT NULL DEFAULT false,
  terms_checked_at        TIMESTAMPTZ,
  terms_notes             TEXT,
  max_items_per_scan      INTEGER     NOT NULL DEFAULT 100,
  timeout_ms              INTEGER     NOT NULL DEFAULT 12000,
  config                  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  last_success_at         TIMESTAMPTZ,
  last_error_at           TIMESTAMPTZ,
  last_error_message      TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_radar_news_sources_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_radar_news_sources_updated_at ON public.radar_news_sources;
CREATE TRIGGER trg_radar_news_sources_updated_at
  BEFORE UPDATE ON public.radar_news_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_radar_news_sources_updated_at();

ALTER TABLE public.radar_news_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radar sources: admin read"
  ON public.radar_news_sources FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Radar sources: admin insert"
  ON public.radar_news_sources FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Radar sources: admin update"
  ON public.radar_news_sources FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Radar sources: admin delete"
  ON public.radar_news_sources FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────
-- 2. radar_news_scan_runs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radar_news_scan_runs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type        TEXT        NOT NULL CHECK (trigger_type IN ('cron', 'manual', 'retry')),
  status              TEXT        NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  started_by          UUID,
  source_count        INTEGER     NOT NULL DEFAULT 0,
  fetched_count       INTEGER     NOT NULL DEFAULT 0,
  inserted_count      INTEGER     NOT NULL DEFAULT 0,
  duplicate_count     INTEGER     NOT NULL DEFAULT 0,
  filtered_count      INTEGER     NOT NULL DEFAULT 0,
  failed_source_count INTEGER     NOT NULL DEFAULT 0,
  error_message       TEXT,
  metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_scan_runs_started_at_idx
  ON public.radar_news_scan_runs (started_at DESC);

ALTER TABLE public.radar_news_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radar scan runs: admin read"
  ON public.radar_news_scan_runs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Radar scan runs: admin insert"
  ON public.radar_news_scan_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Radar scan runs: admin update"
  ON public.radar_news_scan_runs FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────
-- 3. radar_news_candidates
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radar_news_candidates (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id                 UUID        NOT NULL REFERENCES public.radar_news_sources(id) ON DELETE RESTRICT,
  scan_run_id               UUID        REFERENCES public.radar_news_scan_runs(id) ON DELETE SET NULL,

  source_external_id        TEXT,
  source_name               TEXT        NOT NULL,
  source_url                TEXT,
  original_url              TEXT        NOT NULL,
  canonical_url             TEXT        NOT NULL,

  title                     TEXT        NOT NULL,
  normalized_title          TEXT        NOT NULL,
  summary                   TEXT,
  image_source_url          TEXT,

  category                  TEXT,
  language                  TEXT,
  country                   TEXT,
  city                      TEXT,
  published_at              TIMESTAMPTZ,

  relevance_score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  relevance_reasons         JSONB        NOT NULL DEFAULT '[]'::jsonb,

  canonical_url_hash        TEXT        NOT NULL,
  content_hash              TEXT        NOT NULL,

  review_status             TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (review_status IN ('pending', 'approved', 'rejected', 'duplicate', 'archived')),

  approved_news_post_id     BIGINT,
  duplicate_of_candidate_id UUID        REFERENCES public.radar_news_candidates(id) ON DELETE SET NULL,

  reviewed_by               UUID,
  reviewed_at               TIMESTAMPTZ,
  review_note               TEXT,

  raw_payload               JSONB       NOT NULL DEFAULT '{}'::jsonb,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS radar_candidates_canonical_url_hash_idx
  ON public.radar_news_candidates (canonical_url_hash);

CREATE INDEX IF NOT EXISTS radar_candidates_review_queue_idx
  ON public.radar_news_candidates (review_status, relevance_score DESC, published_at DESC);

CREATE INDEX IF NOT EXISTS radar_candidates_source_idx
  ON public.radar_news_candidates (source_id, published_at DESC);

CREATE INDEX IF NOT EXISTS radar_candidates_content_hash_idx
  ON public.radar_news_candidates (content_hash);

CREATE OR REPLACE FUNCTION public.set_radar_news_candidates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_radar_news_candidates_updated_at ON public.radar_news_candidates;
CREATE TRIGGER trg_radar_news_candidates_updated_at
  BEFORE UPDATE ON public.radar_news_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_radar_news_candidates_updated_at();

ALTER TABLE public.radar_news_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radar candidates: admin read"
  ON public.radar_news_candidates FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Radar candidates: admin update"
  ON public.radar_news_candidates FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- INSERT yalnızca service_role (Edge Function) yapar — authenticated policy yok.
-- service_role RLS bypass kullanır.

-- ─────────────────────────────────────────────
-- 4. radar_news_review_logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radar_news_review_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID        NOT NULL REFERENCES public.radar_news_candidates(id) ON DELETE CASCADE,
  action        TEXT        NOT NULL CHECK (
    action IN (
      'approve_to_pool',
      'approve_and_publish',
      'reject',
      'mark_duplicate',
      'archive',
      'restore',
      'edit_before_publish'
    )
  ),
  actor_user_id UUID,
  note          TEXT,
  before_value  JSONB,
  after_value   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_review_logs_candidate_idx
  ON public.radar_news_review_logs (candidate_id, created_at DESC);

ALTER TABLE public.radar_news_review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radar review logs: admin read"
  ON public.radar_news_review_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Radar review logs: admin insert"
  ON public.radar_news_review_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────
-- 5. radar_news_keywords
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radar_news_keywords (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT        NOT NULL,
  language    TEXT        NOT NULL,
  category    TEXT,
  weight      NUMERIC(5,2) NOT NULL DEFAULT 1,
  is_negative BOOLEAN     NOT NULL DEFAULT false,
  is_enabled  BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_radar_news_keywords_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_radar_news_keywords_updated_at ON public.radar_news_keywords;
CREATE TRIGGER trg_radar_news_keywords_updated_at
  BEFORE UPDATE ON public.radar_news_keywords
  FOR EACH ROW EXECUTE FUNCTION public.set_radar_news_keywords_updated_at();

ALTER TABLE public.radar_news_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Radar keywords: admin read"
  ON public.radar_news_keywords FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Radar keywords: admin insert"
  ON public.radar_news_keywords FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Radar keywords: admin update"
  ON public.radar_news_keywords FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Radar keywords: admin delete"
  ON public.radar_news_keywords FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────
-- 6. news_posts tablosuna radar sütunları ekle
--    (tablo canlıda var; types regen sonrası görünür)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  -- news_posts tablosu canlıda mevcut ama lokal migration ile oluşturulmamış.
  -- Sütunlar IF NOT EXISTS ile güvenle eklenir.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'news_posts'
  ) THEN
    ALTER TABLE public.news_posts
      ADD COLUMN IF NOT EXISTS radar_candidate_id    UUID,
      ADD COLUMN IF NOT EXISTS approved_by           UUID,
      ADD COLUMN IF NOT EXISTS approved_at           TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS ingestion_source_type TEXT;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- 7. Seed: GDELT kaynak — ilk production kaynağı
-- ─────────────────────────────────────────────
INSERT INTO public.radar_news_sources (
  name,
  source_type,
  adapter_key,
  endpoint_url,
  language,
  trust_level,
  is_enabled,
  terms_checked,
  terms_checked_at,
  terms_notes,
  max_items_per_scan,
  config
) VALUES (
  'GDELT DOC 2.0 — Turkish Diaspora EN',
  'gdelt',
  'gdelt_doc_v2',
  'https://api.gdeltproject.org/api/v2/doc/doc',
  'en',
  'discovery_only',
  true,
  true,
  now(),
  'GDELT açık keşif katmanı. Metadata ve kaynak linki kullanılır; tam metin scraping yapılmaz. Lisans: https://www.gdeltproject.org/about.html',
  100,
  jsonb_build_object(
    'query',      '"Turkish diaspora" OR "Turkish community Germany"',
    'timespan',   '1d',
    'maxrecords', 100,
    'format',     'json',
    'mode',       'artlist',
    'sort',       'datedesc'
  )
) ON CONFLICT DO NOTHING;

INSERT INTO public.radar_news_sources (
  name,
  source_type,
  adapter_key,
  endpoint_url,
  language,
  trust_level,
  is_enabled,
  terms_checked,
  terms_checked_at,
  terms_notes,
  max_items_per_scan,
  config
) VALUES (
  'GDELT DOC 2.0 — Türk Diasporası TR',
  'gdelt',
  'gdelt_doc_v2',
  'https://api.gdeltproject.org/api/v2/doc/doc',
  'tr',
  'discovery_only',
  true,
  true,
  now(),
  'GDELT açık keşif katmanı — Türkçe sorgu. Metadata ve kaynak linki kullanılır.',
  100,
  jsonb_build_object(
    'query',      '"Türk diasporası" OR "yurt dışında Türkler" OR "Almanya Türkler"',
    'timespan',   '1d',
    'maxrecords', 100,
    'format',     'json',
    'mode',       'artlist',
    'sort',       'datedesc'
  )
) ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 8. Seed: başlangıç keyword seti
-- ─────────────────────────────────────────────
INSERT INTO public.radar_news_keywords (keyword, language, category, weight, is_negative, is_enabled) VALUES
  -- Türkçe pozitif
  ('Türk diasporası',          'tr', 'diaspora',       35, false, true),
  ('yurt dışında yaşayan Türkler', 'tr', 'diaspora',  30, false, true),
  ('Almanya Türkler',          'tr', 'almanya',        25, false, true),
  ('Avrupa Türkler',           'tr', 'avrupa',         20, false, true),
  ('göçmenlik Almanya',        'tr', 'gocmenlik_oturum', 20, false, true),
  ('oturum izni Almanya',      'tr', 'gocmenlik_oturum', 20, false, true),
  ('vatandaşlık Almanya',      'tr', 'vatandaslik',    20, false, true),
  ('çifte vatandaşlık',        'tr', 'vatandaslik',    20, false, true),
  ('Türk girişimciler',        'tr', 'ekonomi_girisimcilik', 15, false, true),
  -- Almanca pozitif
  ('türkische Diaspora',       'de', 'diaspora',       35, false, true),
  ('Türken in Deutschland',    'de', 'almanya',        25, false, true),
  ('Einbürgerung Deutschland', 'de', 'vatandaslik',    20, false, true),
  ('doppelte Staatsbürgerschaft', 'de', 'vatandaslik', 20, false, true),
  ('Aufenthaltsrecht',         'de', 'gocmenlik_oturum', 15, false, true),
  -- İngilizce pozitif
  ('Turkish diaspora',         'en', 'diaspora',       35, false, true),
  ('Turkish community Germany','en', 'almanya',        25, false, true),
  ('Turkish community Europe', 'en', 'avrupa',         20, false, true),
  ('Turkish migrants Germany', 'en', 'gocmenlik_oturum', 20, false, true),
  ('German citizenship reform','en', 'vatandaslik',    15, false, true),
  ('residence permit Germany', 'en', 'gocmenlik_oturum', 15, false, true),
  -- Negatif filtreler
  ('spor magazin',             'tr', NULL,              0, true, true),
  ('clickbait',                'en', NULL,              0, true, true)
ON CONFLICT DO NOTHING;

COMMIT;
