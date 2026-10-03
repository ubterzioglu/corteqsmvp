-- G03c · Taban tablonun anon yetkisi DARALTILIR (sızıntıyı kapatan adım)
--
-- Ön koşul GERÇEKLEŞTİ (03.10): yeni frontend deploy edildi (bundle'da
-- AdminGruplarPage referansı + index hash değişimi ölçüldü), ziyaretçi turu
-- data katmanında doğrulandı: anon dizini `whatsapp_landings_public` view'ından
-- okuyor (10 satır, motor kolonlar dolu, link/PII 0) ve `get_whatsapp_landing_invite`
-- anon'a 42501 veriyor.
--
-- ═══ İKİSİ BİRLİKTE (KALANLAR G03c bloğu birebir) ═══
-- Tek başına politikayı düşürmek tablo grant'ını bırakır; ileride biri yeni bir
-- anon politikası eklerse kapı SESSİZCE yeniden açılır. Grant'ı da çekmek o
-- sınıfı kapatır.
--
-- EK (KALANLAR'ın "ayrı karar" notu — karar: DAHİL): anon'un INSERT/UPDATE/
-- DELETE/TRUNCATE grant'ları da çekilir. G02'den beri anon'un hiçbir yazma
-- politikası yok (RLS kesiyor) ama RLS bir gün kapatılırsa anon tabloyu
-- TRUNCATE edebilirdi (01.10 ölçümü). Bu felaket sınıfı bedavaya kapanır;
-- authenticated grant'larına DOKUNULMAZ (admin moderasyon ekranı `updateLanding`
-- ile doğrudan UPDATE yazıyor — guard v3 admin'i muaf tutuyor, akış bozulmaz).
--
-- ═══ GERİ ALMA (dizin boşalırsa — KALANLAR'da da yazılı) ═══
--   grant select on public.whatsapp_landings to anon;
--   create policy "Anyone can view approved landings" on public.whatsapp_landings
--     for select to anon, authenticated using (status = 'approved');

begin;

drop policy if exists "Anyone can view approved landings" on public.whatsapp_landings;
revoke select on public.whatsapp_landings from anon;
revoke insert, update, delete, truncate on public.whatsapp_landings from anon;

commit;
