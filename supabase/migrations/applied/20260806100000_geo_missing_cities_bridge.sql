-- Eksik iki şehir geo kataloğuna eklenir + Cadde köprüsü tamamlanır (m77 kuyruğu)
--
-- NEDEN: 20260805200000 sonrası `cadde_cities.geo_city_id` 53/55'te kaldı. Açık kalan iki
-- satır `Kişinev` (Moldova) ve `Böblingen` (Almanya). Önceki not "farklı kelime, karar
-- ister" diyordu — ÖLÇÜM BUNU DA AŞTI: köprünün bağlanacağı satır `geo_cities` içinde
-- HİÇ YOK. Yani sorun eşleştirme değil, KATALOG BOŞLUĞU.
--
-- ÖLÇÜM (06.08.2026, canlı):
--   Moldova geo_cities'te 19 şehir var, BAŞKENT ARALARINDA DEĞİL. Global arama
--   ('chi%in%', 'kisin%') tüm katalogda Chișinău döndürmedi; en yakın kayıt Romanya'daki
--   `Chisineu-Cris` — alakasız bir kasaba. Sonuç: bir Moldova üyesi profil formundan
--   kendi başkentini SEÇEMİYOR.
--   Almanya'da 7.261 şehir var (`Abtsbessingen` gibi köyler dahil) ama `Böblingen` yok —
--   50 bin nüfuslu ilçe merkezi. Bu şehri profilinde taşıyan 1 üye var (eski serbest
--   metin verisi; bugün formdan seçilmesi mümkün değil).
--
-- YAZIM KARARI (ölçülerek, tahminle değil):
--   Moldova'daki 19 adın 0'ı diakritik taşıyor (`Calarasi`, `Straseni`, `Durlesti`) →
--     ASCII `Chisinau` yazıldı, katalogla tutarlı.
--   Almanya'da 11 ad diakritikli (`Köln`, `Nürnberg`, `Düsseldorf`) → `Böblingen` diakritikli
--     yazıldı. Bu ayrıca ZORUNLU: cadde tarafındaki kayıt da `Böblingen` ve üyenin profil
--     değeri de öyle. `Boeblingen` yazılsaydı fold eşleşmesi kopardı (ö→o, ö→oe değil).
--
-- ⚠️ Kişinev↔Chisinau eşlemesi TAHMİN DEĞİL, açık bir karardır: Kişinev, Chișinău'nun
-- Türkçe egzonimidir ve Moldova kataloğunda başka başkent adayı yoktur. Bu yüzden fold'a
-- bırakılmadı — fold zaten çözemezdi (farklı kelime) — ad ad yazıldı.
--
-- ⚠️ PERFORMANS: `geo_cities` 76.990 satır, üretim örneği 904 MB RAM. Aşağıdaki her sorgu
-- ya `UNIQUE (country_id, name)` indeksini ya da ülkeye daraltılmış eşitliği kullanır.
-- Satır başına fonksiyon çağıran desen KULLANILMADI (05.08'de Postgres'i düşüren buydu).
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez — dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f supabase/migrations/applied/20260806100000_geo_missing_cities_bridge.sql
--
-- Geri alma:
--   update public.cadde_cities set geo_city_id = null where name in ('Kişinev','Böblingen');
--   delete from public.geo_cities where name = 'Chisinau'
--     and country_id = (select id from public.geo_countries where name = 'Moldova');
--   delete from public.geo_cities where name = 'Böblingen'
--     and country_id = (select id from public.geo_countries where name = 'Almanya');
-- ─────────────────────────────────────────────────────────────────────────────

begin;

set local statement_timeout = '30s';

-- 1) EKSİK ŞEHİRLER -----------------------------------------------------------
-- `UNIQUE (country_id, name)` mevcut → `on conflict do nothing` ile idempotent.
-- sort_order/is_active/created_at varsayılanlı (0 / true / now()).
insert into public.geo_cities (country_id, name)
select gc.id, 'Chisinau'
from public.geo_countries gc
where gc.name = 'Moldova'
on conflict (country_id, name) do nothing;

insert into public.geo_cities (country_id, name)
select gc.id, 'Böblingen'
from public.geo_countries gc
where gc.name = 'Almanya'
on conflict (country_id, name) do nothing;

-- 2) KÖPRÜ --------------------------------------------------------------------
-- Eşleşme ÜLKE üzerinden bağlanır. Ad tek başına benzersiz değildir; 20260805200000'in
-- "mükerrer Roma" notu burada da geçerli (`Chisineu-Cris` Romanya'da duruyor).
update public.cadde_cities c
set geo_city_id = g.id
from public.geo_cities g
     join public.cadde_countries cc on cc.geo_country_id = g.country_id
where c.geo_city_id is null
  and c.country_id = cc.id
  and (
    -- Türkçe egzonim eşlemesi: fold çözemez, bilinçli ad ad yazıldı.
    (c.name = 'Kişinev'   and g.name = 'Chisinau')
    -- Birebir ad eşitliği.
    or (c.name = 'Böblingen' and g.name = 'Böblingen')
  );

-- 3) DOĞRULAMA ----------------------------------------------------------------
-- Beklenen: şehir köprüsü 55/55, köprüsüz kalan yok.
select 'ulke koprusu' as olcum,
       count(*) filter (where geo_country_id is not null) || '/' || count(*) as sonuc
from public.cadde_countries
union all
select 'sehir koprusu',
       count(*) filter (where geo_city_id is not null) || '/' || count(*)
from public.cadde_cities
union all
select 'koprusuz kalan sehir',
       coalesce(string_agg(name, ', ' order by name), '-')
from public.cadde_cities where geo_city_id is null
union all
select 'geo Chisinau eklendi mi',
       case when exists (
         select 1 from public.geo_cities g
         join public.geo_countries gc on gc.id = g.country_id
         where gc.name = 'Moldova' and g.name = 'Chisinau'
       ) then 'evet' else 'HAYIR' end
union all
select 'geo Boblingen eklendi mi',
       case when exists (
         select 1 from public.geo_cities g
         join public.geo_countries gc on gc.id = g.country_id
         where gc.name = 'Almanya' and g.name = 'Böblingen'
       ) then 'evet' else 'HAYIR' end;

-- 4) SÜRÜM KAYDI --------------------------------------------------------------
-- 20260805200000'de olduğu gibi kayıt işin kendisiyle AYNI transaction'da atılır;
-- bu repoda kayıt ayrıca atılıp dört kez unutuldu.
insert into supabase_migrations.schema_migrations (version, name)
values ('20260806100000', 'geo_missing_cities_bridge')
on conflict (version) do nothing;

commit;
