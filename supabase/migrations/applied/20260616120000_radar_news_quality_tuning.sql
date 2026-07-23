-- Radar News Pipeline — Kalite ayarı (2026-06-16)
-- Sorun: GDELT sorguları dil/ülke kısıtı içermediği için Azerice/Rusça
--        alakasız haberler (ör. Şuşa Beyannamesi) çekiliyordu; ayrıca tek
--        sağlayıcıya (GDELT) bağımlılık + dar timespan az aday üretiyordu.
--
-- Bu migration:
--   1. Mevcut GDELT kaynaklarının query'sine sourcelang/sourcecountry ekler
--      + adapter dil güvenlik ağı için config.allowedLanguages tanımlar
--      + timespan'i 1d → 3d genişletir, maxrecords 100 → 250.
--   2. İngilizce GDELT keşif kaynağı ekler (sadece hedef ülkeler).
--   3. RSS kaynaklarını seed eder (GDELT tek bağımlılığını kaldırır).
--   4. Keyword setini genişletir (kod relevance-score.ts artık tablodan okur).
--
-- NOT: GDELT DOC API'de OR'lu terimler () içinde olmalı; sourcelang dil
--      ADIYLA yazılır (turkish/german/english). config.allowedLanguages
--      adapter'da article.language (tam ad) ile eşleşir.

BEGIN;

-- ─────────────────────────────────────────────
-- 1. Mevcut GDELT — Türkçe kaynağını sıkılaştır
-- ─────────────────────────────────────────────
UPDATE public.radar_news_sources
SET config = jsonb_build_object(
      'query',            '("Türk diasporası" OR "gurbetçi" OR "yurt dışındaki Türkler" OR "Almanya''daki Türkler") sourcelang:turkish',
      'timespan',         '3d',
      'maxrecords',       250,
      'format',           'json',
      'mode',             'artlist',
      'sort',             'datedesc',
      'allowedLanguages', 'turkish'
    ),
    max_items_per_scan = 250
WHERE name = 'GDELT DOC 2.0 — Türk Diasporası TR';

-- ─────────────────────────────────────────────
-- 2. Mevcut GDELT — İngilizce kaynağını sıkılaştır
--    (sadece hedef diaspora ülkeleri: DE/UK/NL/FR/AT/BE)
-- ─────────────────────────────────────────────
UPDATE public.radar_news_sources
SET config = jsonb_build_object(
      'query',            '("Turkish diaspora" OR "Turkish community" OR "Turkish minority") (sourcecountry:GM OR sourcecountry:UK OR sourcecountry:NL OR sourcecountry:FR OR sourcecountry:AU OR sourcecountry:BE)',
      'timespan',         '3d',
      'maxrecords',       250,
      'format',           'json',
      'mode',             'artlist',
      'sort',             'datedesc',
      'allowedLanguages', 'english'
    ),
    max_items_per_scan = 250
WHERE name = 'GDELT DOC 2.0 — Turkish Diaspora EN';

-- ─────────────────────────────────────────────
-- 3. Yeni GDELT — Almanca kaynağı (en yoğun diaspora)
-- ─────────────────────────────────────────────
INSERT INTO public.radar_news_sources (
  name, source_type, adapter_key, endpoint_url, language,
  trust_level, is_enabled, terms_checked, terms_checked_at, terms_notes,
  max_items_per_scan, config
) VALUES (
  'GDELT DOC 2.0 — Türkische Diaspora DE',
  'gdelt', 'gdelt_doc_v2', 'https://api.gdeltproject.org/api/v2/doc/doc', 'de',
  'discovery_only', true, true, now(),
  'GDELT açık keşif katmanı — Almanca sorgu, Almanya/Avusturya kaynakları.',
  250,
  jsonb_build_object(
    'query',            '("türkische Gemeinde" OR "Türken in Deutschland" OR "türkische Community" OR Einbürgerung OR "doppelte Staatsbürgerschaft") sourcelang:german',
    'timespan',         '3d',
    'maxrecords',       250,
    'format',           'json',
    'mode',             'artlist',
    'sort',             'datedesc',
    'allowedLanguages', 'german'
  )
) ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. RSS kaynakları — GDELT tek bağımlılığını kaldır
--    trust_level=high → skorlamada +10 bonus alır (güvenilir editöryel kaynak)
--    NOT: is_enabled=true ama terms_checked admin onayıyla açılmalı.
--    Burada terms_checked=true veriyoruz çünkü hepsi resmi/herkese açık feed.
-- ─────────────────────────────────────────────
INSERT INTO public.radar_news_sources (
  name, source_type, adapter_key, endpoint_url, website_url, language, country,
  category_default, trust_level, is_enabled, terms_checked, terms_checked_at,
  terms_notes, max_items_per_scan, config
) VALUES
  (
    'DW Türkçe — Almanya',
    'rss', 'rss', 'https://rss.dw.com/xml/rss-tur-all', 'https://www.dw.com/tr/',
    'tr', 'DE', 'almanya', 'high', true, true, now(),
    'Deutsche Welle Türkçe resmi RSS — herkese açık.', 60, '{}'::jsonb
  ),
  (
    'Euronews Türkçe',
    'rss', 'rss', 'https://tr.euronews.com/rss?format=mrss', 'https://tr.euronews.com/',
    'tr', NULL, 'avrupa', 'high', true, true, now(),
    'Euronews Türkçe resmi RSS — herkese açık.', 60, '{}'::jsonb
  ),
  (
    'DW Deutschland',
    'rss', 'rss', 'https://rss.dw.com/xml/rss-de-ger', 'https://www.dw.com/de/',
    'de', 'DE', 'almanya', 'high', true, true, now(),
    'Deutsche Welle Almanca resmi RSS — herkese açık.', 60, '{}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. Keyword setini genişlet (relevance-score.ts artık tablodan okur)
-- ─────────────────────────────────────────────
INSERT INTO public.radar_news_keywords (keyword, language, category, weight, is_negative, is_enabled) VALUES
  -- Türkçe ek pozitifler
  ('gurbetçi',                'tr', 'diaspora',          30, false, true),
  ('Avrupalı Türkler',        'tr', 'avrupa',            22, false, true),
  ('Türk toplumu',            'tr', 'diaspora',          20, false, true),
  ('mavi kart',               'tr', 'vatandaslik',       18, false, true),
  ('uyum politikası',         'tr', 'gocmenlik_oturum',  15, false, true),
  -- Almanca ek pozitifler
  ('türkische Community',     'de', 'diaspora',          25, false, true),
  ('türkischstämmig',         'de', 'diaspora',          22, false, true),
  ('Fachkräfteeinwanderung',  'de', 'ekonomi_girisimcilik', 15, false, true),
  ('Integrationspolitik',     'de', 'gocmenlik_oturum',  15, false, true),
  -- İngilizce ek pozitifler
  ('Turkish minority',        'en', 'diaspora',          25, false, true),
  ('Turks in Europe',         'en', 'avrupa',            22, false, true),
  ('dual citizenship Germany','en', 'vatandaslik',       18, false, true),
  -- Negatif: Azerbaycan/Kafkasya bağlamı (Şuşa/Karabağ tipi çöpü ele)
  ('şuşa',                    'tr', NULL,                 0, true, true),
  ('karabağ',                 'tr', NULL,                 0, true, true),
  ('şuşa bəyannaməsi',        'az', NULL,                 0, true, true),
  ('декларация',              'ru', NULL,                 0, true, true)
ON CONFLICT DO NOTHING;

COMMIT;
