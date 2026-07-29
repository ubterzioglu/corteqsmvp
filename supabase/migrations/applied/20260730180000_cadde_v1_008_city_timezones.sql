-- Cadde V1 (8/8): yeni eklenen şehirlerin zaman dilimleri.
--
-- Mig 007'nin backfill'i şehirleri geo kataloğundan getirdi ama geo_cities'te TIMEZONE
-- KOLONU YOK. Aynı ülkede önceden şehir varsa devralındı (Türkiye → Europe/Istanbul);
-- yeni açılan 13 ülkede devralınacak şehir olmadığı için 15 şehir 'UTC' kaldı ve
-- saat şeridinde yanlış saat gösterirdi.
--
-- Ülke kodu → zaman dilimi eşlemesi. Birden çok zaman dilimi olan ülkelerde (Kanada,
-- Avustralya, ABD) üyelerin bulunduğu şehrin dilimi seçildi — tam çözüm şehir bazlı
-- bir tz veri kaynağı gerektirir, o ayrı bir iş.

begin;

update public.cadde_cities ci
set timezone = m.tz
from (values
  ('AU', 'Australia/Melbourne'),
  ('AZ', 'Asia/Baku'),
  ('AE', 'Asia/Dubai'),
  ('BG', 'Europe/Sofia'),
  ('FR', 'Europe/Paris'),
  ('KR', 'Asia/Seoul'),
  ('JP', 'Asia/Tokyo'),
  ('CA', 'America/Toronto'),
  ('QA', 'Asia/Qatar'),
  ('LU', 'Europe/Luxembourg'),
  ('PL', 'Europe/Warsaw'),
  ('RO', 'Europe/Bucharest'),
  ('TH', 'Asia/Bangkok')
) as m(code, tz)
join public.cadde_countries c on c.code = m.code
where ci.country_id = c.id and ci.timezone = 'UTC';

-- Bundan sonra açılacak ülkeler için: cadde_ensure_geo_city aynı ülkedeki bir şehirden
-- devralıyor; ilk şehirde devralacak bir şey olmadığında yine UTC kalır. Frontend
-- CaddeWorldClocks 'UTC'yi "bilinmiyor" sayıp o şehri atlar, yanlış saat göstermez.
commit;
