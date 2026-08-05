-- Cadde açılış sonrası iki küçük düzeltme — 2026-08-05
-- ============================================================================
-- Uygulama sonrası doğrulamada iki eksik çıktı:
--
-- 1. `schema_migrations` kaydı yok. Migration canlıda ÇALIŞTI (fonksiyon var, feed
--    yardımcıyı çağırıyor, emniyet supabı yerinde) ama sürüm kaydı yazılmadı.
--    Bu repoda daha önce iki kez yaşandı (2026-07-18, 2026-07-20): tablo/fonksiyon
--    varlığı `schema_migrations` kaydı olduğu anlamına GELMEZ. Kayıt olmazsa
--    `npm run check:migrations` sonsuza dek "uygulanmamış" der.
--
-- 2. Global yönlendirme postları 4 ülkeyi hedeflemiyor. Sıra sorunu: açılış script'i
--    çalıştığında katalogda 18 aktif ülke vardı ve 4 global posta 18'er hedef yazıldı.
--    ARDINDAN migration'ın backfill'i 4 ülke daha ekledi (Güney Afrika, İtalya,
--    Moldova, Suudi Arabistan). O ülkelerdeki 5 üyenin konumu artık çözülüyor —
--    yani emniyet supabı da devreye girmiyor — ama hiçbir post onları hedeflemiyor.
--    Sonuç yine boş akış.
--
-- ⚠️ YAPISAL NOT: "global post" bugün N adet hedef satırıyla, yani bir ANLIK
-- GÖRÜNTÜYLE ifade ediliyor. Katalog `trg_cadde_profile_city_sync` ile büyümeye
-- devam edecek, dolayısıyla bu anlık görüntü her yeni ülkede tekrar bayatlayacak.
-- Kalıcı çözüm "global"i sayım yerine ÖZELLİK olarak ifade etmek (bkz. session notu);
-- bu script yalnız bugünkü boşluğu kapatır.
--
-- ÇALIŞTIRMA:
--   psql "<conn>" -f docs/operations/2026-08-05-cadde-acilis-duzeltme.sql
-- ============================================================================
\encoding UTF8
\set ON_ERROR_STOP on

BEGIN;
SET client_encoding = 'UTF8';

\echo '=== ONCE ==='
SELECT (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20260805120000') AS mig_kaydi,
       (SELECT count(*) FROM public.cadde_post_targets) AS hedef_satiri,
       (SELECT count(*) FROM public.cadde_countries c WHERE c.is_active AND NOT EXISTS (
          SELECT 1 FROM public.cadde_post_targets t
          JOIN public.cadde_posts p ON p.id = t.post_id AND p.country_id IS NULL
          WHERE t.country_id = c.id)) AS hedeflenmemis_ulke;

\echo '=== 1) Migration surum kaydi ==='
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260805120000', 'cadde_viewer_geo_bridge')
ON CONFLICT (version) DO NOTHING;

\echo '=== 2) Global postlari eksik ulkelere de hedefle ==='
-- Yalnız gerçekten global olan postlar (country_id IS NULL) genişletilir; şehir
-- postlarına dokunulmaz. ON CONFLICT yok çünkü tabloda benzersizlik kısıtı yok —
-- NOT EXISTS ile tekrar eklemeyi engelliyoruz (script tekrar çalıştırılabilir).
INSERT INTO public.cadde_post_targets (post_id, country_id, city_id)
SELECT p.id, c.id, NULL
FROM public.cadde_posts p
CROSS JOIN public.cadde_countries c
WHERE p.country_id IS NULL
  AND c.is_active
  AND NOT EXISTS (
    SELECT 1 FROM public.cadde_post_targets t
    WHERE t.post_id = p.id AND t.country_id = c.id AND t.city_id IS NULL
  );

\echo '=== SONRA ==='
SELECT (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20260805120000') AS mig_kaydi,
       (SELECT count(*) FROM public.cadde_post_targets) AS hedef_satiri,
       (SELECT count(*) FROM public.cadde_countries c WHERE c.is_active AND NOT EXISTS (
          SELECT 1 FROM public.cadde_post_targets t
          JOIN public.cadde_posts p ON p.id = t.post_id AND p.country_id IS NULL
          WHERE t.country_id = c.id)) AS hedeflenmemis_ulke;

COMMIT;

\echo ''
\echo '=== DOGRULAMA: kac uye hala 0 post goruyor ==='
WITH v AS (
  SELECT u.id, l.out_country_id AS vc, l.out_city_id AS vci
  FROM auth.users u CROSS JOIN LATERAL public.cadde_resolve_viewer_location(u.id) l
)
SELECT count(*) AS uye,
       count(*) FILTER (WHERE vc IS NULL AND vci IS NULL) AS konumu_cozulemeyen,
       count(*) FILTER (WHERE 0 = (
         SELECT count(*) FROM public.cadde_posts p
          WHERE p.visibility='public' AND p.status='published' AND p.content_mode='real'
            AND p.diaspora_key='tr'
            AND ((v.vci IS NULL AND v.vc IS NULL)
              OR (v.vci IS NOT NULL AND (p.city_id=v.vci OR EXISTS (SELECT 1 FROM public.cadde_post_targets t WHERE t.post_id=p.id AND t.city_id=v.vci)))
              OR (v.vc  IS NOT NULL AND (p.country_id=v.vc OR EXISTS (SELECT 1 FROM public.cadde_post_targets t WHERE t.post_id=p.id AND t.country_id=v.vc)))
              OR (p.reaction_count>=10 OR p.comment_count>=5 OR coalesce(p.share_count,0)>=10))
       )) AS HALA_BOS_AKIS
FROM v;
