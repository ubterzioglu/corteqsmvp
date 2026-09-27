-- ============================================================
-- Purpose: m94 kararı (UBT, 25.09 18:39): Cadde videosu en fazla 10 MB ve 30 sn.
--          Video yükleme zaten açıktı (cadde.media.video_enabled=true, 50 MB);
--          yalnız sınır daraltılır. Depolama ücretsiz kotayı aşarsa aylık
--          25 USD'lik plana bakılacak (ürün kararı, kod işi değil).
--          - Bayt sınırının GERÇEK enforce noktası bucket'ın file_size_limit'idir;
--            görsel sınırı 5 MB olduğundan bucket tavanı 10 MB yeterlidir.
--          - Süre (30 sn) DB'de ölçülemez; yalnız istemcide denetlenir
--            (src/lib/cadde-media.ts CADDE_MEDIA_LIMITS.maxVideoSeconds).
--          TS aynası: CADDE_MEDIA_LIMITS.maxVideoBytes (cadde-media.test.ts kilitler).
-- Risk:    Düşük. Mevcut 10 MB üstü dosyalar silinmez, yalnız yeni yükleme etkilenir.
-- Rollback: file_size_limit=52428800, cadde.media.max_video_mb=50.
-- ============================================================

BEGIN;

UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'cadde-media';

UPDATE public.cadde_settings
SET value = '10'::jsonb
WHERE key = 'cadde.media.max_video_mb';

INSERT INTO public.cadde_settings (key, value)
VALUES ('cadde.media.max_video_seconds', '30'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
