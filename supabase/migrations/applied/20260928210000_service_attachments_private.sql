-- service-attachments bucket'ı PRIVATE'a geçiş — B3 / Y6 / P2
-- ============================================================================
--
-- ONAY: 28.09 akşam karar turu "önce ölç" dedi → ÖLÇÜLDÜ (28.09 gece, canlı):
--   · bucket'ta 0 nesne (storage/v1/object/list → [])
--   · service_requests'te attachment_urls DOLU satır 0
-- Yani "private'a geçersen mevcut ek adresleri geçersizleşir" bedeli SIFIR —
-- geçişin en ucuz anı (KALANLAR P2 ölçüm 2). Kullanıcı kararı: GEÇİLSİN (Y6).
--
-- ----------------------------------------------------------------------------
-- NE DEĞİŞİR
-- ----------------------------------------------------------------------------
--   1) storage.buckets.public = false → /object/public/... adresleri 400 döner.
--      Giriş yapmamış kimse ekleri OKUYAMAZ (ekler CV/sözleşme taşıyabilir).
--   2) "Anyone can view attachments" SELECT policy'si DÜŞER → giriş yapmış her
--      kullanıcıya TÜM ekleri açan kural kalkar.
--   3) Yerine "service_attachments_select_own_or_admin": kullanıcı YALNIZ kendi
--      klasöründeki eki okur/imzalar; Admin_* rolleri (public.is_admin, security
--      definer) tümünü okur — destek/denetim vakaları için.
--
-- KOD TARAFI (bu SQL ile AYNA ANDA canlıda olmalı, aynı oturumda):
--   · ServiceRequestForm artık getPublicUrl DEĞİL, storage PATH yazar
--     (private bucket'ta public URL ölü doğar: 400).
--   · ServiceRequestsList eki ServiceAttachmentLink ile açar: tıklamada
--     createSignedUrl → 15 dk ömürlü imzalı link (RLS: own-or-admin).
--   · Eski public-URL kayıtları src/lib/service-attachment-url.ts içinde
--     path'e normalize edilir (bugün 0 kayıt, sözleşme yine de dayanıklı).
--
-- ----------------------------------------------------------------------------
-- UYGULAMA
-- ----------------------------------------------------------------------------
--   1) psql -f docs/operations/2026-09-28-service-attachments-private.sql
--      (⚠️ PowerShell'den Türkçe karakter bozulur; dosyayla gönder)
--   2) Dosyayı supabase/migrations/applied/20260928210000_service_attachments_private.sql
--      olarak TAŞI (parent migrations/ dizininde BIRAKMA)
--   3) schema_migrations kaydını at: version 20260928210000
--   4) npm run check:migrations → sapma yok
--   5) Doğrulama: storage API → public=false · anon /object/public/... → 400 ·
--      pg_policies → own_or_admin VAR, "Anyone can view attachments" YOK
--
-- ============================================================================

begin;

-- ── B3a: bucket private ─────────────────────────────────────────────────────
update storage.buckets
set public = false
where id = 'service-attachments';

-- ── B3b: herkese SELECT kalkar; own-or-admin gelir ─────────────────────────
drop policy if exists "Anyone can view attachments" on storage.objects;

create policy "service_attachments_select_own_or_admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'service-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );

commit;

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- begin;
-- update storage.buckets set public = true where id = 'service-attachments';
-- drop policy if exists "service_attachments_select_own_or_admin" on storage.objects;
-- create policy "Anyone can view attachments"
--   on storage.objects for select to authenticated
--   using (bucket_id = 'service-attachments');
-- commit;
--
-- ⚠️ Geri alma B3 açığını (giriş yapmamış herkesin okuyabilmesi) GERİ GETİRİR.
-- Yalnız bir regresyon çıkarsa kullan; kalıcı çözüm değildir.
