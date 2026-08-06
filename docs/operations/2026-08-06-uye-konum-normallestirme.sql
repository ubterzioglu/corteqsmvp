-- Üye konum değerlerinin katalog yazımına normalleştirilmesi (25 satır / 13 üye)
-- Uygulandı: 2026-08-06, canlı Supabase (injprdrsklkxgnaiixzh).
-- Yedek: docs/operations/2026-08-06-uye-konum-normallestirme-yedek.sql
--
-- NEDEN: profil formu artık seçim listesi (`SearchableCountrySelect` / `SearchableCitySelect`,
-- kaynak `geo_countries` / `geo_cities`, hepsi `is_active = true` filtreli — src/lib/geo.ts).
-- Ama eski serbest-metin döneminden kalan değerler katalogla birebir tutmuyor: `türkiye`,
-- `istanbul`, `DOha`, `new york` gibi. Bu kayıtlar dropdown'da seçili görünmüyor ve
-- Cadde eşleşmesini de bozuyor.
--
-- ⚠️ ASIL KIRILAN ALAN ŞEHİR DEĞİL, ÜLKE. Ölçüldü: ülke değeri katalogla birebir tuttuğunda
-- şehir zaten `cadde_fold_text` ile çözülüyor (`diyarbakır`+`Türkiye` → `Diyarbakır`,
-- `istanbul`+`Türkiye` → `İstanbul`). Ülke bozuk olduğunda daraltma boşa düşüyor ve şehir de
-- çözülemiyor. Bu yüzden ülke ve şehir BİRLİKTE düzeltilir.
--
-- ⚠️ TÜRKÇE KÜÇÜK/BÜYÜK HARF TUZAĞI (CLAUDE.md kuralı, ölçümde bizzat yaşandı):
-- `lower('İstanbul')` PostgreSQL'de `i̇stanbul` (i + birleşen nokta) verir, sade `istanbul`
-- ile EŞLEŞMEZ. Bu yüzden eşleştirme `lower()` ile değil `cadde_fold_text()` ile doğrulandı.
-- Aşağıdaki hedefler o doğrulamanın sonucudur, tahmin değildir.
--
-- KAPSAM DIŞI (bilinçli):
--   `Belirtilmedi` (27) · `a` · `Mb` · `Vanuu` · `De` → kullanıcı kararı: kalsın (2026-08-05).
--   `Kisinev` (1 üye) → DOKUNULMADI. `Chisinau`ya çevirmek profil dropdown'ını düzeltir ama
--     CADDE EŞLEŞMESİNİ KIRAR: Cadde adla eşleşiyor ve `cadde_cities`'te `Kişinev` yazıyor,
--     `chisinau` ile fold tutmaz. Yapısal çözüm Cadde'nin adla değil köprüyle (geo_city_id)
--     eşleşmesidir — ayrı iş.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez — daima -f):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-06-uye-konum-normallestirme.sql
-- ─────────────────────────────────────────────────────────────────────────────

begin;

set local statement_timeout = '30s';

-- 1) ÜLKE (beklenen: UPDATE 13) ----------------------------------------------
-- `Amerika Birlesik Devletleri` → `ABD`: geo kataloğu ABD kısaltmasını kullanıyor.
-- `Birlesik Krallik` → `İngiltere`: geo kataloğunda Birleşik Krallık ayrı bir kayıt DEĞİL;
--   İngiltere altında modellenmiş (`Ashford (İngiltere)`, `Kingston (İngiltere)`).
--   Katalogun modelleme tercihi budur; üye değeri ona uyduruluyor.
with a as (select id, key from public.afs_attributes where key = 'country')
update public.user_profile_attributes upa
set value_text = case btrim(upa.value_text)
      when 'türkiye'                     then 'Türkiye'
      when 'Turkiye'                     then 'Türkiye'
      when 'almanya'                     then 'Almanya'
      when 'kanada'                      then 'Kanada'
      when 'Amerika Birlesik Devletleri' then 'ABD'
      when 'Birlesik Krallik'            then 'İngiltere'
    end
from a
where a.id = upa.attribute_id
  and btrim(coalesce(upa.value_text, '')) in
      ('türkiye', 'Turkiye', 'almanya', 'kanada', 'Amerika Birlesik Devletleri', 'Birlesik Krallik');

-- 2) ŞEHİR (beklenen: UPDATE 12) ---------------------------------------------
-- `MAXHÜTTE-HAIDHOF` → `Maxhutte-Haidhof`: geo kataloğu bu şehri ASCII yazıyor; cadde
--   tarafındaki `Maxhütte-Haidhof` zaten bu satıra köprülü.
with a as (select id, key from public.afs_attributes where key = 'city')
update public.user_profile_attributes upa
set value_text = case btrim(upa.value_text)
      when 'ankara'           then 'Ankara'
      when 'aschaffenburg'    then 'Aschaffenburg'
      when 'ashford'          then 'Ashford'
      when 'bilecik'          then 'Bilecik'
      when 'diyarbakır'       then 'Diyarbakır'
      when 'DOha'             then 'Doha'
      when 'istanbul'         then 'İstanbul'
      when 'izmir'            then 'İzmir'
      when 'ısparta'          then 'Isparta'
      when 'kingston'         then 'Kingston'
      when 'MAXHÜTTE-HAIDHOF' then 'Maxhutte-Haidhof'
      when 'new york'         then 'New York'
    end
from a
where a.id = upa.attribute_id
  and btrim(coalesce(upa.value_text, '')) in
      ('ankara', 'aschaffenburg', 'ashford', 'bilecik', 'diyarbakır', 'DOha', 'istanbul',
       'izmir', 'ısparta', 'kingston', 'MAXHÜTTE-HAIDHOF', 'new york');

-- 3) DOĞRULAMA ---------------------------------------------------------------
-- Beklenen: eski değer 0; katalogda karşılığı olmayan değer olarak yalnız bilinçli
-- bırakılanlar (Belirtilmedi / a / Mb / Vanuu / De / Kisinev) kalmalı.
select 'kalan eski deger (beklenen 0)' as olcum, count(*)::text as sonuc
from public.user_profile_attributes upa
join public.afs_attributes a on a.id = upa.attribute_id
where (a.key = 'country' and btrim(coalesce(upa.value_text,'')) in
        ('türkiye','Turkiye','almanya','kanada','Amerika Birlesik Devletleri','Birlesik Krallik'))
   or (a.key = 'city' and btrim(coalesce(upa.value_text,'')) in
        ('ankara','aschaffenburg','ashford','bilecik','diyarbakır','DOha','istanbul',
         'izmir','ısparta','kingston','MAXHÜTTE-HAIDHOF','new york'))
union all
select 'katalogda karsiligi olmayan ULKE',
       coalesce(string_agg(distinct btrim(upa.value_text), ', '), '-')
from public.user_profile_attributes upa
join public.afs_attributes a on a.id = upa.attribute_id
where a.key = 'country' and btrim(coalesce(upa.value_text,'')) <> ''
  and not exists (select 1 from public.geo_countries g
                  where g.is_active and g.name = btrim(upa.value_text))
union all
select 'katalogda karsiligi olmayan SEHIR',
       coalesce(string_agg(distinct btrim(upa.value_text), ', '), '-')
from public.user_profile_attributes upa
join public.afs_attributes a on a.id = upa.attribute_id
where a.key = 'city' and btrim(coalesce(upa.value_text,'')) <> ''
  and not exists (select 1 from public.geo_cities g
                  where g.is_active and g.name = btrim(upa.value_text));

commit;
