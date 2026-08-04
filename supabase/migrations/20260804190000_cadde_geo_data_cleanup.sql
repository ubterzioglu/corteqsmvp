-- Workshop WS2 m78 + m79 — cadde_cities veri temizliği.
--
-- ÖLÇÜM (04.08.2026, canlı DB): 51 şehir / 18 ülke.
--   m79: 9 şehir küçük harfle başlıyor, 1'i tamamen büyük harf.
--   m78: 2 şehir yanlış ülkeye bağlı.
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
-- Roma, ABD'ye bağlıydı. İtalya kayıtlı değilse eklenir.
insert into public.cadde_countries (code, name, is_active)
select 'IT', 'İtalya', true
where not exists (
  select 1 from public.cadde_countries where public.cadde_fold_text(name) = public.cadde_fold_text('İtalya')
);

update public.cadde_cities c
set country_id = (
  select id from public.cadde_countries
  where public.cadde_fold_text(name) = public.cadde_fold_text('İtalya')
  limit 1
)
where c.name = 'Roma'
  and c.country_id = (
    select id from public.cadde_countries
    where public.cadde_fold_text(name) = public.cadde_fold_text('Amerika Birlesik Devletleri')
    limit 1
  );

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
do $$
declare
  v_lower int;
  v_roma_country text;
  v_vancouver_country text;
begin
  select count(*) into v_lower from public.cadde_cities where name ~ '^[[:lower:]]';
  if v_lower > 0 then
    raise exception 'm79 eksik: hala % sehir kucuk harfle basliyor', v_lower;
  end if;

  select co.name into v_roma_country
  from public.cadde_cities c join public.cadde_countries co on co.id = c.country_id
  where c.name = 'Roma';
  if v_roma_country is not null and public.cadde_fold_text(v_roma_country) <> public.cadde_fold_text('İtalya') then
    raise exception 'm78 eksik: Roma hala % ulkesine bagli', v_roma_country;
  end if;

  select co.name into v_vancouver_country
  from public.cadde_cities c join public.cadde_countries co on co.id = c.country_id
  where c.name = 'Vancouver';
  if v_vancouver_country is not null and public.cadde_fold_text(v_vancouver_country) <> public.cadde_fold_text('Kanada') then
    raise exception 'm78 eksik: Vancouver hala % ulkesine bagli', v_vancouver_country;
  end if;
end;
$$;
