-- G02 · whatsapp_landings RLS temizliği (Dijital Gruplar politikası v1.1)
--
-- NEDEN: canlıda ölçüldü 2026-10-01 — "Anyone can insert whatsapp landings"
-- politikası {anon, authenticated} için açıktı ve WITH CHECK'i `true` idi.
-- Yani oturumu olmayan herkes, sınırsız sayıda, istediği `user_id` ile grup
-- kaydı ekleyebiliyordu. Tasarımın kabul testi bu yüzden başarısızdı.
--
-- ⚠️ YERİNE YENİ BİR INSERT POLİTİKASI YAZILMIYOR — gerek yok.
-- Aynı tabloda zaten DOĞRU olan bir politika var:
--   "Users can create own landings" · {authenticated} · WITH CHECK (auth.uid() = user_id)
-- Permissive politikalar OR'lanır; yanlış olan silinince INSERT yolu
-- kendiliğinden doğru politikaya düşer.
--
-- ⚠️ Sahip kolonu `user_id`'dir. `submitted_by` diye bir kolon YOKTUR
-- (plan dosyasında öyle yazıyordu; o hâliyle 42703 ile patlardı).
--
-- Ayrıca iki MÜKERRER SELECT politikası siliniyor (ölçüldü: birebir aynı ifade):
--   "Public approved whatsapp landings select" ≡ "Anyone can view approved landings"
--   "Owners can select own whatsapp landings"  ≡ "Users can view own landings"
-- Kopyalar okuma yetkisini genişletmiyor ama ileride birini daraltıp diğerini
-- unutma riskini taşıyor — bu tabloda tam olarak o risk G03'te gerçekleşecek.
--
-- ⚠️ BU MIGRATION DAVET LİNKİNİ KAPATMAZ. Kalan "Anyone can view approved
-- landings" politikası anon'a `status='approved'` satırının TÜM kolonlarını,
-- yani `whatsapp_link`'i, döndürmeye devam eder. K1'i kapatan G03'tür.
--
-- ⚠️ Günlük 5 gönderim sınırı bu migration'da YOK: sınır `group_settings`
-- tablosundan okunacak, o tablo G09'da açılıyor (eşik kodda sabit yazılmaz —
-- `cadde_settings` deseni). Sınır G09'dan sonraki ayrı batch'te eklenecek.

begin;

drop policy if exists "Anyone can insert whatsapp landings" on public.whatsapp_landings;
drop policy if exists "Public approved whatsapp landings select" on public.whatsapp_landings;
drop policy if exists "Owners can select own whatsapp landings" on public.whatsapp_landings;

-- Doğrulama: anon'un INSERT politikası kalmamalı, girişli kullanıcının kalmalı.
do $$
declare
  anon_insert_policies int;
  auth_insert_policies int;
begin
  select count(*) into anon_insert_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'whatsapp_landings'
    and cmd = 'INSERT'
    and 'anon' = any (roles);

  select count(*) into auth_insert_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'whatsapp_landings'
    and cmd = 'INSERT'
    and 'authenticated' = any (roles);

  if anon_insert_policies <> 0 then
    raise exception 'G02: anon hala INSERT edebiliyor (% politika)', anon_insert_policies;
  end if;

  if auth_insert_policies < 1 then
    raise exception 'G02: girisli kullanicinin INSERT politikasi kalmadi - form kirilirdi';
  end if;
end $$;

commit;
