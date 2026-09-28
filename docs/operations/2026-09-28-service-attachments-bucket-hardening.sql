-- service-attachments bucket sıkılaştırması — G03 (HAZIRLIK, HENÜZ UYGULANMADI)
-- ============================================================================
--
-- ⚠️ BU DOSYA CANLIDA ÇALIŞTIRILMADI. Uygulaması onaya tabidir (P01): canlı
-- migration. Onaylandığında aşağıdaki "UYGULAMA" bölümündeki adımlar izlenir.
--
-- ⚠️ Bu dosya BİLEREK `supabase/migrations/` altında DEĞİL. CLAUDE.md kuralı:
-- migration dosyası parent dizinde bırakılmaz (sürüm karşılaştırmasına girmez ve
-- `check:migrations` onu başıboş dosya sayıp exit 1 verir), `applied/` altına ise
-- ancak UYGULANDIKTAN sonra taşınır. Uygulanmamış SQL'in yeri `docs/operations/`
-- (`2026-09-22-relocation-demo-seed.sql` ile aynı desen).
--
-- ----------------------------------------------------------------------------
-- MEVCUT DURUM (ölçüldü: archive/20260326112832_*.sql, bucket'ın kurulduğu yer)
-- ----------------------------------------------------------------------------
--
--   insert into storage.buckets (id, name, public)
--   values ('service-attachments', 'service-attachments', true);
--
--   create policy "Authenticated users can upload attachments"
--     on storage.objects for insert to authenticated
--     with check (bucket_id = 'service-attachments');
--
--   create policy "Anyone can view attachments"
--     on storage.objects for select to authenticated
--     using (bucket_id = 'service-attachments');
--
-- Buradan çıkan DÖRT bulgu:
--
-- B1. BOYUT/TÜR SINIRI YOK. `file_size_limit` ve `allowed_mime_types` boş; giriş
--     yapmış herhangi bir kullanıcı istediği boyutta ve türde dosya yükleyebilir.
--     G01'de eklenen istemci denetimi bunu kullanıcı hatasına karşı kapatır ama
--     istemciyi atlayan birine karşı KAPATMAZ.
--
-- B2. INSERT'te SAHİPLİK DENETİMİ YOK. Kural yalnız `bucket_id`ye bakıyor, yola
--     bakmıyor. Kod anahtarı `<user_id>/<zaman>-<ad>` biçiminde kuruyor, ama bu
--     yalnız İSTEMCİNİN nezaketi: kullanıcı A doğrudan depolama API'sine giderek
--     kullanıcı B'nin klasörüne yazabilir.
--
-- B3. BUCKET PUBLIC + HERKESE SELECT. `public = true` olduğu için adresi bilen
--     HERKES (giriş yapmamışlar dahil) eki okuyabilir; ayrıca SELECT kuralı giriş
--     yapmış her kullanıcıya TÜM ekleri açıyor. Hizmet talebi ekleri CV, sözleşme,
--     kimlik gibi kişisel belge taşıyabilir.
--
-- B4. UPDATE/DELETE kuralı yok: kullanıcı kendi ekini silemiyor (KVKK/GDPR silme
--     talebi geldiğinde elle müdahale gerekir).
--
-- ----------------------------------------------------------------------------
-- BU DOSYA NEYİ KAPSIYOR
-- ----------------------------------------------------------------------------
--
-- B1, B2 ve B4 burada kapatılır: bunlar DAVRANIŞI BOZMAZ, yalnız sıkılaştırır.
--
-- ⚠️ B3 BİLEREK BU DOSYADA YOK ve tek başına uygulanamaz. Bucket'ı private yapmak
-- çalışan kodu KIRAR: `ServiceRequestForm` `getPublicUrl()` kullanıyor ve private
-- bucket'ta o adres 400 döner. Private'a geçiş, ekleri gösteren her yüzeyin
-- `createSignedUrl()`e taşınmasını gerektirir — yani ayrı bir kod işi + ürün kararı
-- (mevcut eklerin adresleri de geçersizleşir). Karar maddesi olarak ayrıldı.
--
-- ----------------------------------------------------------------------------
-- UYGULAMA (onay geldiğinde)
-- ----------------------------------------------------------------------------
--   1) psql -f docs/operations/2026-09-28-service-attachments-bucket-hardening.sql
--      (⚠️ PowerShell'den Türkçe karakter bozulur; dosyayla gönder, satır yapıştırma)
--   2) Dosyayı `supabase/migrations/applied/20260928120000_service_attachments_hardening.sql`
--      olarak TAŞI
--   3) schema_migrations kaydını at (aksi halde `check:migrations` sapma gösterir)
--   4) `npm run check:migrations` → sapma yok
--   5) Gerçek bir yüklemeyle uçtan uca dene: geçerli PDF geçmeli, 20 MB'lık dosya
--      ve .exe REDDEDİLMELİ, başka kullanıcının klasörüne yazma REDDEDİLMELİ
--
-- ============================================================================

begin;

-- ── B1: boyut ve tür sınırı ────────────────────────────────────────────────
-- Tavan istemcideki 15 MB ile AYNI (src/lib/security.ts → SERVICE_ATTACHMENT_MAX_SIZE).
-- İkisi ayrışırsa kullanıcı istemcide kabul edilen bir dosyada sunucudan anlamsız
-- hata alır — m94'te (Cadde videosu) tam olarak bu yaşandı, oradan öğrenildi.
update storage.buckets
set
  file_size_limit = 15728640, -- 15 MB
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
where id = 'service-attachments';

-- ── B2: yükleme yalnız kendi klasörüne ─────────────────────────────────────
-- `storage.foldername(name)[1]` anahtarın ilk parçasıdır; kod onu `<user_id>` olarak
-- kuruyor. Kural artık bunu ZORUNLU kılar, yani istemciyi atlayan biri de başka
-- kullanıcının klasörüne yazamaz.
drop policy if exists "Authenticated users can upload attachments" on storage.objects;

create policy "service_attachments_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── B4: kendi ekini silebilme ──────────────────────────────────────────────
-- KVKK/GDPR silme talebinde elle müdahale gerekmesin.
create policy "service_attachments_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- begin;
-- update storage.buckets
-- set file_size_limit = null, allowed_mime_types = null
-- where id = 'service-attachments';
--
-- drop policy if exists "service_attachments_insert_own_folder" on storage.objects;
-- drop policy if exists "service_attachments_delete_own" on storage.objects;
--
-- create policy "Authenticated users can upload attachments"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'service-attachments');
-- commit;
--
-- ⚠️ Geri alma ESKİ HÂLİ döndürür, yani B1/B2/B4 açıklarını da geri getirir.
-- Yalnız bir regresyon çıkarsa kullan; kalıcı çözüm değildir.
