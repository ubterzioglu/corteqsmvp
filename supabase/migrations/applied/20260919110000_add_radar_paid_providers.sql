-- Radar: Ucretli haber API saglayicilari icin kaynak kayitlari.
-- Bu kaynaklar baslangicta devre disidir (is_enabled = false).
-- API key eklendiginde admin panelden aktif edilebilir.
--
-- Provider rotation sistemi sayesinde ucretsiz ve ucretli saglayicilar donusumlu
-- kullanilabilir. Detay: supabase/functions/radar-news-scan/lib/provider-config.ts
--
-- NOT (2026-09-19 duzeltmesi): Bu dosya once "20260919_..." adiyla, 14 haneli damga
-- yerine 8 haneli bir onekle yazilmisti; check:migrations onu "20260919" surumu olarak
-- okuyup "canlida kaydi yok" diyordu. Ayrica applied/ altindaydi ama canliya hic
-- uygulanmamisti ve INSERT'lerde idempotenslik korumasi yoktu - ikinci calistirmada
-- 9 kaynak ciftlenirdi. Damga duzeltildi ve her satir ada gore korumaya alindi.

insert into radar_news_sources (
  name, source_type, adapter_key, endpoint_url, website_url,
  language, country, trust_level, is_enabled, terms_checked,
  max_items_per_scan, timeout_ms, config
)
select
  v.name, v.source_type, v.adapter_key, v.endpoint_url, v.website_url,
  v.language, v.country, v.trust_level, v.is_enabled, v.terms_checked,
  v.max_items_per_scan, v.timeout_ms, v.config
from (
  values
    -- NewsAPI.org
    ('NewsAPI - Turkish Diaspora EN', 'json_api', 'newsapi',
     'https://newsapi.org/v2/everything', 'https://newsapi.org',
     'en', null::text, 'standard', false, true, 50, 15000,
     '{"query": "Turkish diaspora OR Turkish community abroad", "sortBy": "publishedAt", "pageSize": 50}'::jsonb),
    ('NewsAPI - Türkiye Gündemi TR', 'json_api', 'newsapi',
     'https://newsapi.org/v2/top-headlines', 'https://newsapi.org',
     'tr', 'tr', 'standard', false, true, 50, 15000,
     '{"query": "Türkiye", "country": "tr", "sortBy": "publishedAt"}'::jsonb),
    ('NewsAPI - Türk Diasporası DE', 'json_api', 'newsapi',
     'https://newsapi.org/v2/everything', 'https://newsapi.org',
     'de', 'de', 'standard', false, true, 50, 15000,
     '{"query": "türkische Gemeinschaft OR türkische Diaspora", "sortBy": "publishedAt"}'::jsonb),

    -- GNews.io
    ('GNews - Turkish Diaspora', 'json_api', 'gnews',
     'https://gnews.io/api/v4/search', 'https://gnews.io',
     'en', null, 'standard', false, true, 50, 15000,
     '{"query": "Turkish diaspora OR Turkish community", "lang": "en", "max": 50}'::jsonb),
    ('GNews - Türkiye TR', 'json_api', 'gnews',
     'https://gnews.io/api/v4/search', 'https://gnews.io',
     'tr', null, 'standard', false, true, 50, 15000,
     '{"query": "Türkiye diaspora", "lang": "tr", "max": 50}'::jsonb),

    -- Bing News Search
    ('Bing News - Turkish Diaspora', 'json_api', 'bing_news',
     'https://api.bing.microsoft.com/v7.0/news/search', 'https://www.bing.com/news',
     'en', null, 'standard', false, true, 50, 15000,
     '{"query": "Turkish diaspora", "sortBy": "Date", "freshness": "Day"}'::jsonb),
    ('Bing News - Türk Topluluğu', 'json_api', 'bing_news',
     'https://api.bing.microsoft.com/v7.0/news/search', 'https://www.bing.com/news',
     'tr', null, 'standard', false, true, 50, 15000,
     '{"query": "Türk diasporası", "sortBy": "Date", "freshness": "Day", "market": "tr-TR"}'::jsonb),

    -- TheNewsAPI.com
    ('TheNewsAPI - Turkish Diaspora', 'json_api', 'thenewsapi',
     'https://api.thenewsapi.com/v1/news/all', 'https://thenewsapi.com',
     'en', null, 'standard', false, true, 50, 15000,
     '{"query": "Turkish diaspora", "language": "en", "limit": 50}'::jsonb),
    ('TheNewsAPI - Türkiye TR', 'json_api', 'thenewsapi',
     'https://api.thenewsapi.com/v1/news/all', 'https://thenewsapi.com',
     'tr', null, 'standard', false, true, 50, 15000,
     '{"query": "Türk diasporası", "language": "tr", "limit": 50}'::jsonb)
) as v(
  name, source_type, adapter_key, endpoint_url, website_url,
  language, country, trust_level, is_enabled, terms_checked,
  max_items_per_scan, timeout_ms, config
)
where not exists (
  select 1 from radar_news_sources r where r.name = v.name
);
