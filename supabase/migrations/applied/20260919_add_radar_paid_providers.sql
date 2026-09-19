-- Radar: Ücretli haber API sağlayıcıları için kaynak kayıtları.
-- Bu kaynaklar başlangıçta devre dışıdır (is_enabled = false).
-- API key eklendiğinde admin panelden veya bu migration'ı güncelleyerek aktif edilebilir.
--
-- Provider rotation sistemi sayesinde ücretsiz ve ücretli sağlayıcılar dönüşümlü
-- kullanılabilir. Detay: supabase/functions/radar-news-scan/lib/provider-config.ts

-- NewsAPI.org kaynakları
INSERT INTO radar_news_sources (
  name, source_type, adapter_key, endpoint_url, website_url,
  language, country, trust_level, is_enabled, terms_checked,
  max_items_per_scan, timeout_ms, config
) VALUES (
  'NewsAPI - Turkish Diaspora EN', 'json_api', 'newsapi',
  'https://newsapi.org/v2/everything', 'https://newsapi.org',
  'en', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Turkish diaspora OR Turkish community abroad", "sortBy": "publishedAt", "pageSize": 50}'
), (
  'NewsAPI - Türkiye Gündemi TR', 'json_api', 'newsapi',
  'https://newsapi.org/v2/top-headlines', 'https://newsapi.org',
  'tr', 'tr', 'standard', false, true, 50, 15000,
  '{"query": "Türkiye", "country": "tr", "sortBy": "publishedAt"}'
), (
  'NewsAPI - Türk Diasporası DE', 'json_api', 'newsapi',
  'https://newsapi.org/v2/everything', 'https://newsapi.org',
  'de', 'de', 'standard', false, true, 50, 15000,
  '{"query": "türkische Gemeinschaft OR türkische Diaspora", "sortBy": "publishedAt"}'
);

-- GNews.io kaynakları
INSERT INTO radar_news_sources (
  name, source_type, adapter_key, endpoint_url, website_url,
  language, country, trust_level, is_enabled, terms_checked,
  max_items_per_scan, timeout_ms, config
) VALUES (
  'GNews - Turkish Diaspora', 'json_api', 'gnews',
  'https://gnews.io/api/v4/search', 'https://gnews.io',
  'en', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Turkish diaspora OR Turkish community", "lang": "en", "max": 50}'
), (
  'GNews - Türkiye TR', 'json_api', 'gnews',
  'https://gnews.io/api/v4/search', 'https://gnews.io',
  'tr', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Türkiye diaspora", "lang": "tr", "max": 50}'
);

-- Bing News Search kaynakları
INSERT INTO radar_news_sources (
  name, source_type, adapter_key, endpoint_url, website_url,
  language, country, trust_level, is_enabled, terms_checked,
  max_items_per_scan, timeout_ms, config
) VALUES (
  'Bing News - Turkish Diaspora', 'json_api', 'bing_news',
  'https://api.bing.microsoft.com/v7.0/news/search', 'https://www.bing.com/news',
  'en', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Turkish diaspora", "sortBy": "Date", "freshness": "Day"}'
), (
  'Bing News - Türk Topluluğu', 'json_api', 'bing_news',
  'https://api.bing.microsoft.com/v7.0/news/search', 'https://www.bing.com/news',
  'tr', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Türk diasporası", "sortBy": "Date", "freshness": "Day", "market": "tr-TR"}'
);

-- TheNewsAPI.com kaynakları
INSERT INTO radar_news_sources (
  name, source_type, adapter_key, endpoint_url, website_url,
  language, country, trust_level, is_enabled, terms_checked,
  max_items_per_scan, timeout_ms, config
) VALUES (
  'TheNewsAPI - Turkish Diaspora', 'json_api', 'thenewsapi',
  'https://api.thenewsapi.com/v1/news/all', 'https://thenewsapi.com',
  'en', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Turkish diaspora", "language": "en", "limit": 50}'
), (
  'TheNewsAPI - Türkiye TR', 'json_api', 'thenewsapi',
  'https://api.thenewsapi.com/v1/news/all', 'https://thenewsapi.com',
  'tr', NULL, 'standard', false, true, 50, 15000,
  '{"query": "Türk diasporası", "language": "tr", "limit": 50}'
);
