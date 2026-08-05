-- Workshop WS2 m78 + m79 — cadde_cities veri temizliği.
--
-- ÖLÇÜM (04.08.2026, canlı DB): 51 şehir / 18 ülke.
--   m79: 9 şehir küçük harfle başlıyor, 1'i tamamen büyük harf.
--   m78: 2 şehir yanlış ülkeye bağlı.
--
-- ⚠️ REVİZYON (05.08.2026) — bu dosya yazıldıktan SONRA canlı veri değişti.
-- `78fe9e1` (migration 20260805140000, profil konum verisi onarımı) katalogda
-- eksik olan 4 ülkeyi ve 4 şehri ekledi; bunların arasında `İtalya` ve ona bağlı
-- doğru bir `Roma` kaydı da vardı. Yani canlıda artık İKİ `Roma` var:
--     c3775e58… Roma -> Amerika Birlesik Devletleri   (eski, kirli kayıt)
--     3b36318f… Roma -> İtalya                        (yeni, DOĞRU kayıt)
-- Bu dosyanın ilk hali ABD'deki Roma'yı İtalya'ya TAŞIYORDU; şimdi çalıştırılsa
-- iki adet `Roma -> İtalya` üretirdi. Fold eşleşmesi (`cadde_fold_text` + `limit 1`)
-- mükerrer kayıtta hangisini seçeceğini garanti etmez → sessiz yanlış eşleşme.
-- Bu yüzden taşıma SİLMEYE çevrildi. Ölçüm (05.08, canlı): ABD'ye bağlı Roma
-- kaydına bağlı 0 post, 0 hedef, 0 kafe — silmek collateral damage üretmez.
--
-- ⚠️ TÜRKÇE TUZAĞI — bu yüzden initcap() KULLANILMADI:
--   Postgres initcap('izmir')  -> 'Izmir'   ✗  (doğrusu 'İzmir', noktalı İ)
--   Postgres initcap('ısparta')-> 'Isparta' ✗  (doğrusu 'Isparta', noktasız I)
-- Türkçe i/İ ve ı/I kuralı locale'siz dönüşümlerde yanlış sonuç verir (CLAUDE.md
-- "Türkçe Metin Kuralları"). Bu yüzden her satır ELLE yazıldı, toplu fonksiyon yok.
--
-- ⚠️ ÜLKE ADLARINA DOKUNULMADI. Canlıda "Turkiye", "Birlesik Krallik",
-- "Amerika Birlesik Devletleri" diakritiksiz duruyor. Düzeltmek cazip ama RİSKLİ:
-- Cadde filtreleri ülkeyi ADIYLA taşır (?country=Almanya) ve kayıtlı/paylaşılmış
-- bağlantılar eski yazımla gelir. Ayrı bir karar + yönlendirme planı ister.
--
-- Eşleşme mantığı cadde_fold_text ile aksan/harf-durumu duyarsız olduğu için bu
-- düzeltmeler mevcut post/profil eşleşmelerini BOZMAZ (yalnız görünen ad değişir).

-- Çalıştırma (Türkçe karakterler komut satırından geçmez — `-c` DEĞİL, `-f`):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f supabase/migrations/20260804190000_cadde_geo_data_cleanup.sql
\encoding UTF8
\set ON_ERROR_STOP on

begin;
set client_encoding = 'UTF8';

-- 1) m79 — harf durumu ------------------------------------------------------
update public.cadde_cities set name = 'Aschaffenburg'    where name = 'aschaffenburg';
update public.cadde_cities set name = 'Maxhütte-Haidhof' where name = 'MAXHÜTTE-HAIDHOF';
update public.cadde_cities set name = 'Vancouver'        where name = 'vancouver';
update public.cadde_cities set name = 'Ashford'          where name = 'ashford';
update public.cadde_cities set name = 'Kingston'         where name = 'kingston';
update public.cadde_cities set name = 'Ankara'           where name = 'ankara';
update public.cadde_cities set name = 'Bilecik'          where name = 'bilecik';
update public.cadde_cities set name = 'Diyarbakır'       where name = 'diyarbakır';
-- Noktalı İ: Türkçe'de 'i' büyüyünce 'İ' olur, 'I' DEĞİL.
update public.cadde_cities set name = 'İzmir'            where name = 'izmir';
-- Noktasız I: 'ı' büyüyünce 'I' olur, 'İ' DEĞİL. Kayıt zaten yanlış yazılmış.
update public.cadde_cities set name = 'Isparta'          where name = 'ısparta';

-- 2) m78 — yanlış ülkeye bağlı şehirler --------------------------------------
-- İtalya kayıtlı değilse eklenir. (20260805140000 bunu zaten ekledi; blok
-- idempotentlik için duruyor — sıfırdan kurulan bir veritabanında gerekli.)
insert into public.cadde_countries (code, name, is_active)
select 'IT', 'İtalya', true
where not exists (
  select 1 from public.cadde_countries where public.cadde_fold_text(name) = public.cadde_fold_text('İtalya')
);

-- Roma: ABD'ye bağlı kirli kayıt SİLİNİR (taşınmaz — bkz. baştaki REVİZYON notu).
-- Doğru `Roma -> İtalya` kaydı 20260805140000 tarafından zaten eklendi. Taşımak
-- ikinci bir kopya üretirdi.
--
-- ⚠️ cadde_cities'e 7 tablo FK ile bağlı ve 6'sı ON DELETE SET NULL — yani silme
-- sessizce veri kaybettirebilir. Bu yüzden önce referans sayılır, varsa DURULUR.
do $$
declare
  v_us_roma uuid;
  v_it_roma uuid;
  v_ref     int;
begin
  select c.id into v_us_roma
  from public.cadde_cities c join public.cadde_countries co on co.id = c.country_id
  where public.cadde_fold_text(c.name) = public.cadde_fold_text('Roma')
    and public.cadde_fold_text(co.name) = public.cadde_fold_text('Amerika Birlesik Devletleri');

  if v_us_roma is null then
    raise notice 'm78: ABD ye bagli Roma kaydi yok, atlaniyor';
    return;
  end if;

  select c.id into v_it_roma
  from public.cadde_cities c join public.cadde_countries co on co.id = c.country_id
  where public.cadde_fold_text(c.name) = public.cadde_fold_text('Roma')
    and public.cadde_fold_text(co.name) = public.cadde_fold_text('İtalya');

  if v_it_roma is null then
    raise exception 'm78 iptal: Italya ya bagli Roma kaydi yok, silmek sehri tamamen kaldirirdi';
  end if;

  select (select count(*) from public.cadde_posts               where city_id = v_us_roma)
       + (select count(*) from public.cadde_post_targets        where city_id = v_us_roma)
       + (select count(*) from public.cadde_cafes               where city_id = v_us_roma)
       + (select count(*) from public.cadde_billboard_cards     where city_id = v_us_roma)
       + (select count(*) from public.cadde_promotion_placements where city_id = v_us_roma)
       + (select count(*) from public.cadde_sponsored_placements where city_id = v_us_roma)
       + (select count(*) from public.carsi_items               where city_id = v_us_roma)
    into v_ref;

  if v_ref > 0 then
    raise exception 'm78 iptal: ABD ye bagli Roma kaydinin % bagli satiri var, elle birlestirme gerekiyor', v_ref;
  end if;

  delete from public.cadde_cities where id = v_us_roma;
  raise notice 'm78: ABD ye bagli mukerrer Roma kaydi silindi';
end;
$$;

-- Vancouver, ABD'ye bağlıydı; Kanada zaten kayıtlı.
update public.cadde_cities c
set country_id = (
  select id from public.cadde_countries
  where public.cadde_fold_text(name) = public.cadde_fold_text('Kanada')
  limit 1
)
where c.name = 'Vancouver'
  and c.country_id = (
    select id from public.cadde_countries
    where public.cadde_fold_text(name) = public.cadde_fold_text('Amerika Birlesik Devletleri')
    limit 1
  );

-- 3) Sessiz başarısızlığa karşı doğrulama ------------------------------------
-- Yukarıdaki UPDATE'ler 0 satır etkilerse hata dönmez; kontrol burada.
--
-- ⚠️ `select ... into` STRICT değilse birden fazla satırda SESSİZCE İLKİNİ alır.
-- Bu dosyanın ilk hali tam da buna düşüyordu: iki `Roma` varken doğrulama geçiyor,
-- mükerrer kayıt fark edilmiyordu. Aşağıdaki kontroller bu yüzden tekil satır
-- okumak yerine SAYIM yapar.
do $$
declare
  v_lower  int;
  v_dupe   int;
  v_dupe_l text;
  v_bad    int;
begin
  select count(*) into v_lower from public.cadde_cities where name ~ '^[[:lower:]]';
  if v_lower > 0 then
    raise exception 'm79 eksik: hala % sehir kucuk harfle basliyor', v_lower;
  end if;

  -- Fold bazlı mükerrer: eşleşme `cadde_fold_text(...) = ...` + `limit 1` ile
  -- yapıldığı için aynı ada sahip iki kayıt hangi ülkeye düşüleceğini belirsiz
  -- bırakır. Bu bir uyarı değil, hata.
  select count(*), coalesce(string_agg(f, ', '), '')
    into v_dupe, v_dupe_l
  from (
    select public.cadde_fold_text(name) as f
    from public.cadde_cities
    group by 1 having count(*) > 1
  ) d;
  if v_dupe > 0 then
    raise exception 'Katalog mukerrer: % sehir adi birden fazla kayitta (%)', v_dupe, v_dupe_l;
  end if;

  select count(*) into v_bad
  from public.cadde_cities c join public.cadde_countries co on co.id = c.country_id
  where (public.cadde_fold_text(c.name) = public.cadde_fold_text('Roma')
         and public.cadde_fold_text(co.name) <> public.cadde_fold_text('İtalya'))
     or (public.cadde_fold_text(c.name) = public.cadde_fold_text('Vancouver')
         and public.cadde_fold_text(co.name) <> public.cadde_fold_text('Kanada'));
  if v_bad > 0 then
    raise exception 'm78 eksik: % sehir hala yanlis ulkeye bagli', v_bad;
  end if;
end;
$$;

commit;

-- Uygulandıktan sonra: bu dosyayı supabase/migrations/applied/ altına taşı.
-- CLAUDE.md'ye göre parent dizinde .sql bulunmamalı; burada durduğu sürece
-- `npm run check:migrations` bu migration'ı hiç görmez.
