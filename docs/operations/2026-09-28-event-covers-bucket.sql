-- `event-covers` bucket'ı — etkinlik kapak görseli yükleme (A10a, HENÜZ UYGULANMADI)
-- ============================================================================
--
-- ⚠️ BU DOSYA CANLIDA ÇALIŞTIRILMADI. Ajanın izin sınıflandırıcısı canlı DB yazımını
-- reddediyor; dosya `docs/operations/` altında bekliyor (P1'in
-- `2026-09-28-service-attachments-bucket-hardening.sql` dosyasıyla aynı desen).
--
-- ⚠️ Bu dosya BİLEREK `supabase/migrations/` parent dizininde DEĞİL: orada kalan bir
-- dosya sürüm karşılaştırmasına girmez ve `check:migrations` onu başıboş sayıp exit 1
-- verir. `applied/` altına ancak UYGULANDIKTAN sonra taşınır.
--
-- ----------------------------------------------------------------------------
-- NEDEN YENİ BİR BUCKET
-- ----------------------------------------------------------------------------
--
-- Ölçüldü (28.09, canlı): 22 bucket var ve etkinliklere ait olan YOK.
-- `events.cover_image` **text** ve bugün forma ham URL kutusu olarak giriliyor
-- (`CreateEventFormSection.tsx:495-503`, T20 maddesi). Canlıda 1 etkinlik var ve
-- kapağı dolu — yani mevcut veri bir URL, yüklenmiş dosya değil. Bu yüzden geçiş
-- kırıcı değildir: kolon tipi değişmiyor, eski URL'ler aynen çalışmaya devam eder.
--
-- ⚠️ `cadde-media` KULLANILMADI, bilerek. Etkinlikler Cadde'nin parçası değildir
-- (`src/pages/EventsPage.tsx` + `src/lib/events-api.ts`, ayrı modül); o bucket'ı
-- kullanmak alan sınırını ihlal ederdi. Reponun kendi deseni de amaç başına ayrı
-- bucket'tır (`job-applications`, `newsimage`, `whatsapp-landing-hero`, ...).
--
-- Desen kaynağı: `applied/20260730100000_cadde_v1_000_media_bucket.sql` §3.
--
-- ----------------------------------------------------------------------------
-- UYGULAMA
-- ----------------------------------------------------------------------------
--   1) psql -f docs/operations/2026-09-28-event-covers-bucket.sql
--      (⚠️ PowerShell'den satır yapıştırma — Türkçe karakter bozulur, dosyayla gönder)
--   2) Dosyayı `supabase/migrations/applied/20260928140000_event_covers_bucket.sql`
--      olarak TAŞI
--   3) schema_migrations kaydını at (yoksa `check:migrations` sapma gösterir)
--   4) `npm run check:migrations` → sapma yok
--   5) Uçtan uca dene: 2 MB JPG **geçmeli** · 10 MB dosya ve `.pdf` **reddedilmeli** ·
--      başka kullanıcının klasörüne yazma **reddedilmeli**
--
-- ============================================================================

begin;

-- ── Bucket ──────────────────────────────────────────────────────────────────
-- Public READ: kapak görselleri herkese açık etkinlik sayfasında ve OG etiketinde
-- kullanılıyor (`EventDetailPage.tsx` → `ogImage`), yani anonim erişim ZORUNLU.
--
-- Tavan istemcideki sınırla AYNI (src/lib/event-media.ts → EVENT_COVER_MAX_BYTES).
-- İkisi ayrışırsa kullanıcı istemcide kabul edilen bir dosyada sunucudan anlamsız
-- hata alır — m94'te (Cadde videosu) tam olarak bu yaşandı, oradan öğrenildi.
-- `event-media-contract.test.ts` bu iki sayıyı birbirine kilitler.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'event-covers',
  'event-covers',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where not exists (select 1 from storage.buckets where id = 'event-covers');

-- ── Okuma: herkes ───────────────────────────────────────────────────────────
drop policy if exists "event covers public read" on storage.objects;
create policy "event covers public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'event-covers');

-- ── Yazma: yalnız kendi `{uid}/` klasörü ────────────────────────────────────
-- ⚠️ `bucket_id` tek başına YETMEZ: yola bakmayan bir kural, kullanıcı A'nın
-- doğrudan depolama API'sine giderek kullanıcı B'nin klasörüne yazmasına izin verir.
-- (Bu tam olarak `service-attachments`'ta bulunan B2 kusuruydu.)
drop policy if exists "event covers own insert" on storage.objects;
create policy "event covers own insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event covers own update" on storage.objects;
create policy "event covers own update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'event-covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_user(auth.uid()))
  )
  with check (
    bucket_id = 'event-covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_user(auth.uid()))
  );

drop policy if exists "event covers own delete" on storage.objects;
create policy "event covers own delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_user(auth.uid()))
  );

commit;

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- ⚠️ Bucket'ta dosya varsa önce onları silmek gerekir; `storage.buckets` satırı
-- bağımlı nesneler yüzünden aksi halde silinmez.
--
-- begin;
-- drop policy if exists "event covers public read" on storage.objects;
-- drop policy if exists "event covers own insert" on storage.objects;
-- drop policy if exists "event covers own update" on storage.objects;
-- drop policy if exists "event covers own delete" on storage.objects;
-- delete from storage.objects where bucket_id = 'event-covers';
-- delete from storage.buckets where id = 'event-covers';
-- commit;
