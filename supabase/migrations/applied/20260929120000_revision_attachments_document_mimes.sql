-- revision-attachments bucket — belge MIME genişletmesi (A09a)
-- ============================================================================
--
-- ✅ 2026-09-29'da CANLIYA UYGULANDI ve doğrulandı:
--    UPDATE 1 · allowed_mime_types = 11 tür (4 görsel + pdf + Word/Excel/
--    PowerPoint legacy+OOXML) · file_size_limit 15728640 DEĞİŞMEDİ ·
--    `schema_migrations` kaydı atıldı (version 20260929120000) ·
--    `npm run check:migrations` → sapma yok.
--    Uygulandığı için `docs/operations/`ten buraya TAŞINDI.
--
-- Amaç: revizyon talebi/yorum ekleri bugüne kadar yalnız GÖRSEL kabul ediyordu
-- (image/jpeg, image/png, image/webp, image/gif). Revizyon eklerine PDF ve
-- Office belgeleri de eklenebilsin (A09 serisi: A09a sunucu → A09b istemci →
-- A09c görsel olmayan kart).
--
-- ⚠️ SIRA: bu dosya ÖNCE uygulanır; istemci `accept` listesi (A09b) ancak
-- bundan SONRA genişletilir — aksi halde yükleme sunucuda SESSİZCE reddedilir.
--
-- Ölçüm (29.09, uygulama öncesi):
--   revision-attachments: private · 15 MB · {image/jpeg,image/png,image/webp,image/gif}
--
-- Karar: mevcut 4 görsel türü KORUNUR (geriye dönük ekler bozulmasın), üstüne
-- PDF + Word/Excel/PowerPoint (legacy + OOXML) eklenir → 11 MIME.
-- service-attachments'tan (6 MIME) BİLEREK geniş: revizyon ekleri admin-only
-- (RLS: public.is_admin) ve toplantı notları Excel/PowerPoint de taşıyor.
--
-- Boyut sınırı DEĞİŞMEZ: 15 MB (istemcideki sınırla aynı kalması m94 dersi).
--
-- UYGULAMA:
--   1) psql -f <bu dosya>   (PowerShell'den satır yapıştırma — Türkçe bozulur)
--   2) supabase/migrations/applied/20260929120000_revision_attachments_document_mimes.sql olarak taşı
--   3) schema_migrations kaydı at (version 20260929120000)
--   4) npm run check:migrations → sapma yok
--   5) Doğrula: select allowed_mime_types from storage.buckets where id='revision-attachments';
-- ============================================================================

begin;

update storage.buckets
set
  allowed_mime_types = array[
    -- mevcut görseller (korunur)
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    -- belgeler (yeni)
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
where id = 'revision-attachments';

commit;

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- begin;
-- update storage.buckets
-- set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
-- where id = 'revision-attachments';
-- commit;
-- ⚠️ Geri alma, bu arada yüklenmiş PDF/Office eklerini GÖSTERMEZ yapmaz
-- (objeler kalır) ama YENİ belge yüklemesini reddeder.
