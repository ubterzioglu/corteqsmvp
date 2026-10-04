-- Özgeçmiş kovaları herkese açıklıktan çıkarılır.
--
-- ── BULGU (04.10, dışarıdan DOĞRULANDI) ─────────────────────────────────────
-- `cv-files` kovası `public = true` idi ve içinde **3 özgeçmiş PDF'i** vardı
-- (Nisan 2026). Anonim istekle ölçüldü:
--   · LİSTELEME: `POST /storage/v1/object/list/cv-files` → `[]`
--     (storage.objects RLS'i listelemeyi engelliyor → dosya adları keşfedilemez)
--   · İNDİRME:  `GET /storage/v1/object/public/cv-files/<uuid>.pdf`
--     → **HTTP 200 · application/pdf · 1.557.159 bayt**
-- Yani sızıntı DEĞİL (sayılamaz/keşfedilemez) ama bağlantısı eline geçen
-- herkes kimlik doğrulamadan özgeçmiş indirebiliyordu. Genel URL'ler sızar:
-- tarayıcı geçmişi, sunucu logu, referrer başlığı, paylaşılan ekran.
--
-- ⚠️ BU RİSK EYLÜL'DE RAPOR EDİLDİ AMA KAPATILMADI.
--    `src/lib/admin-shell/admin-updates/2026-09.ts:545`:
--    "AÇIK GÜVENLİK RİSKİ 2 — ÖZGEÇMİŞ KOVASI HERKESE AÇIK … taşımadan ÖNCE
--     kapatılmalı." Rapor edilmiş bir riskin açık kalması, raporun kendisini
--    değersizleştirir; bu migration o maddeyi kapatır.
--
-- ── NEDEN GÜVENLE KAPATILABİLİR (ölçüldü) ───────────────────────────────────
-- Uygulama bu dosyaları ZATEN imzalı bağlantıyla okuyor:
--   `src/lib/dashboard/resource-storage.ts:48` → `createSignedUrl(path, ...)`
-- `createSignedUrl` özel kovalarda da çalışır; `getPublicUrl` bu yolda HİÇ
-- kullanılmıyor. Yani `public=false` yapmak hiçbir ekranı bozmaz.
-- (Karşıt örnek: `avatars`, `cadde-media`, `newsimage` gerçekten `getPublicUrl`
--  ile okunuyor — onlara DOKUNULMUYOR.)
--
-- ── KAPSAM ──────────────────────────────────────────────────────────────────
--   `cv-files`   3 dosya · kod `getStorageBucket()` üzerinden kullanıyor → KAPAT
--   `cv`         0 dosya · kodda 0 referans · sınırsız boyut/MIME → KAPAT
--                (bugün boş; açık kalırsa gelecekteki ilk yükleme halka açılır)
--   `arge-files` 0 dosya · aynı imzalı-bağlantı yolunu kullanıyor → KAPAT
--
-- DOKUNULMAYANLAR (bilinçli): `avatars` · `cadde-media` · `newsimage` ·
-- `whatsapp-landing-hero` · `fallback-image-pool` · `event-covers` ·
-- `onepagers` (logo/maskot) — hepsi gerçekten herkese açık görsel.

update storage.buckets
   set public = false
 where id in ('cv-files', 'cv', 'arge-files');

-- ⚠️ `storage.objects` politikalarına DOKUNULMUYOR. Listeleme zaten kapalıydı
--    (anonim `list` çağrısı `[]` döndü) ve imzalı bağlantı politikadan
--    bağımsız çalışır. Buradaki tek değişiklik `public` bayrağıdır.
