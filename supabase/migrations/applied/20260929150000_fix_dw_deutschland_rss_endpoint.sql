-- DW Deutschland RSS endpoint düzeltmesi (A99-R2 yan iş)
-- ============================================================================
--
-- ✅ 2026-09-30'da CANLIYA UYGULANDI ve doğrulandı:
--    UPDATE 1 · endpoint_url = rss-de-all · last_error_* temizlendi ·
--    `schema_migrations` 20260929150000 · `check:migrations` sapma yok.
--    Kesin doğrulama: sonraki radar taramasında `last_success_at` dolmalı.
--    Uygulandığı için `docs/operations/`ten buraya TAŞINDI.
--
-- Kusur: `radar_news_sources` satırı "DW Deutschland" 20.07'den beri
-- "RSS channel bulunamadı" hatası veriyor; last_success_at HİÇ dolmamış.
--
-- Ölçüm (30.09, canlı):
--   https://rss.dw.com/xml/rss-de-ger → HTTP 200 ama gövde "Error: no feed by
--     that name." (28 bayt, RSS değil) — adapter XML bulamayınca hata yazıyor.
--   https://rss.dw.com/xml/rss-de-all → HTTP 200, geçerli RSS 2.0 (61 KB).
--   Kardeş satır "DW Türkçe — Almanya" (rss-tur-all) 14.09'a kadar ÇALIŞIYORDU —
--   yani sorun DW'de değil, yanlış endpoint adında.
--
-- Düzeltme: endpoint_url → rss-de-all (DW'nin Almanca TAM akışı).
--
-- UYGULAMA:
--   1) psql -f <bu dosya>
--   2) supabase/migrations/applied/20260929150000_fix_dw_deutschland_rss_endpoint.sql olarak taşı
--   3) schema_migrations kaydı at (version 20260929150000)
--   4) npm run check:migrations → sapma yok
--   5) Doğrula: sonraki taramada last_success_at dolmalı, last_error_* temizlenmeli
-- ============================================================================

update public.radar_news_sources
set endpoint_url = 'https://rss.dw.com/xml/rss-de-all',
    last_error_message = null,
    last_error_at = null,
    updated_at = now()
where id = '3fe543c0-2bdc-43ab-bfaa-a929ff7f363c'
  and name = 'DW Deutschland';

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- update public.radar_news_sources
-- set endpoint_url = 'https://rss.dw.com/xml/rss-de-ger', updated_at = now()
-- where id = '3fe543c0-2bdc-43ab-bfaa-a929ff7f363c';
-- (Geri alma kusuru da geri getirir: rss-de-ger geçerli bir akış değil.)
