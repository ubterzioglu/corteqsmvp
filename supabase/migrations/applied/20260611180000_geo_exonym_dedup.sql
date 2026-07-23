-- Geo şehir dedup: 77k global seed, elle eklenen Türkçe exonym'lerle (Münih, Londra, Viyana…)
-- aynı şehrin İngilizce/aksansız kopyalarını yan yana bıraktı. Bu migration kopyaları
-- is_active=false yapar (DROP değil — FK/geri dönüş güvenliği). Kural:
--   1. Bilinen exonym çiftlerinde Türkçe ad kalır, native/İngilizce kopya kapanır
--      (kayıtlı kullanıcı verisi ve elle seed'ler Türkçe adları kullanıyor).
--   2. Aksan-varyantı gruplarında (Düsseldorf|Dusseldorf) aksanlı doğru form kalır.
-- İdempotent: yeniden çalıştırmak ek satır kapatmaz. Çift listesi join-korumalı:
-- bir taraf yoksa no-op. Canlı tespit (2026-06-11): 93 exonym çifti + 23 aksan grubu.

begin;

set local statement_timeout = '300s';

-- 1) Exonym çiftleri: aynı ülkede Türkçe exonym aktifken native kopyayı kapat
with pairs(code, exonym, native) as (
  values
    ('AL','Tiran','Tirana'),('AL','Draç','Durrës'),('AL','İşkodra','Shkodër'),
    ('AM','Erivan','Yerevan'),('AM','Gümrü','Gyumri'),
    ('AT','Viyana','Vienna'),
    ('AZ','Bakü','Baku'),('AZ','Gence','Ganja'),('AZ','Sumgayıt','Sumqayit'),
    ('BA','Saraybosna','Sarajevo'),
    ('BD','Dakka','Dhaka'),('BD','Çitagong','Chittagong'),
    ('BE','Brüksel','Brussels'),('BE','Gent','Ghent'),('BE','Brugge','Bruges'),('BE','Antwerp','Antwerpen'),
    ('BG','Sofya','Sofia'),('BG','Burgaz','Burgas'),
    ('CH','Zürih','Zurich'),('CH','Cenevre','Geneva'),('CH','Cenevre','Genève'),('CH','Lozan','Lausanne'),
    ('CN','Pekin','Beijing'),('CN','Şanghay','Shanghai'),('CN','Şenzhen','Shenzhen'),
    ('CY','Lefkoşa','Nicosia'),('CY','Girne','Kyrenia'),('CY','Gazimağusa','Famagusta'),
    ('CZ','Prag','Prague'),
    ('DE','Münih','Munich'),('DE','Köln','Cologne'),
    ('DK','Kopenhag','Copenhagen'),
    ('DZ','Cezayir','Algiers'),('DZ','Vahran','Oran'),('DZ','Konstantin','Constantine'),
    ('EG','Kahire','Cairo'),('EG','İskenderiye','Alexandria'),
    ('EG','Şarm El-Şeyh','Sharm El-Sheikh'),('EG','Şarm El-Şeyh','Sharm el-Sheikh'),
    ('ES','Sevilla','Seville'),
    ('FR','Marsilya','Marseille'),
    ('GB','Londra','London'),
    ('GE','Tiflis','Tbilisi'),('GE','Batum','Batumi'),
    ('GR','Atina','Athens'),('GR','Selanik','Thessaloniki'),
    ('HU','Budapeşte','Budapest'),
    ('ID','Cakarta','Jakarta'),
    ('IL','Kudüs','Jerusalem'),('IL','Hayfa','Haifa'),
    ('IN','Yeni Delhi','New Delhi'),
    ('IQ','Bağdat','Baghdad'),('IQ','Süleymaniye','Sulaymaniyah'),('IQ','Basra','Basrah'),
    ('IR','Tahran','Tehran'),('IR','İsfahan','Isfahan'),('IR','Şiraz','Shiraz'),('IR','Meşhed','Mashhad'),
    ('IT','Roma','Rome'),('IT','Milano','Milan'),('IT','Napoli','Naples'),('IT','Floransa','Florence'),
    ('IT','Torino','Turin'),('IT','Venedik','Venice'),('IT','Genova','Genoa'),('IT','Padova','Padua'),
    ('JO','Akabe','Aqaba'),('JO','Zerka','Zarqa'),
    ('KG','Bişkek','Bishkek'),('KG','Oş','Osh'),
    ('KKTC','Lefkoşa','Nicosia'),('KKTC','Girne','Kyrenia'),('KKTC','Gazimağusa','Famagusta'),
    ('KR','Seul','Seoul'),
    ('KW','Kuveyt','Kuwait City'),('KW','Kuveyt','Kuwait'),
    ('KZ','Almatı','Almaty'),('KZ','Şımkent','Shymkent'),
    ('LB','Beyrut','Beirut'),('LB','Trablus','Tripoli'),('LB','Sayda','Sidon'),('LB','Sayda','Saida'),
    ('LK','Kolombo','Colombo'),
    ('LY','Trablus','Tripoli'),('LY','Bingazi','Benghazi'),
    ('MA','Kazablanka','Casablanca'),('MA','Marakeş','Marrakesh'),('MA','Marakeş','Marrakech'),
    ('MA','Tanca','Tangier'),('MA','Tanca','Tanger'),('MA','Fes','Fez'),('MA','Fes','Fès'),
    ('MK','Üsküp','Skopje'),('MK','Manastır','Bitola'),
    ('NL','Den Haag','The Hague'),
    ('OM','Maskat','Muscat'),
    ('PK','İslamabad','Islamabad'),('PK','Karaçi','Karachi'),('PK','Lahor','Lahore'),('PK','Peşaver','Peshawar'),
    ('PL','Varşova','Warsaw'),('PL','Krakov','Krakow'),('PL','Krakov','Kraków'),
    ('PT','Lizbon','Lisbon'),
    ('RO','Bükreş','Bucharest'),('RO','İaşi','Iasi'),('RO','İaşi','Iași'),
    ('RS','Belgrad','Belgrade'),('RS','Niş','Niš'),('RS','Niş','Nis'),
    ('RU','Moskova','Moscow'),
    ('SA','Riyad','Riyadh'),('SA','Cidde','Jeddah'),('SA','Mekke','Mecca'),('SA','Medine','Medina'),
    ('SD','Hartum','Khartoum'),
    ('SE','Göteborg','Gothenburg'),
    ('SG','Singapur','Singapore'),
    ('SO','Mogadişu','Mogadishu'),
    ('TJ','Duşanbe','Dushanbe'),
    ('TM','Aşkabat','Ashgabat'),
    ('TN','Tunus','Tunis'),('TN','Sfaks','Sfax'),('TN','Sus','Sousse'),
    ('UA','Kiev','Kyiv'),('UA','Harkov','Kharkiv'),('UA','Odessa','Odesa'),
    ('UZ','Taşkent','Tashkent'),('UZ','Semerkant','Samarkand'),('UZ','Buhara','Bukhara'),
    ('VN','Ho Chi Minh','Ho Chi Minh City'),
    ('XK','Priştine','Pristina'),('XK','Priştine','Prishtina')
)
update public.geo_cities n
set is_active = false
from pairs p
join public.geo_countries gc on gc.code = p.code
join public.geo_cities e
  on e.country_id = gc.id and e.name = p.exonym and e.is_active = true
where n.country_id = gc.id
  and n.name = p.native
  and n.is_active = true;

-- 2) Aksan-varyantı grupları: aksanlı ikizi varken aksansız kopyayı kapat
--    (yalnız aksansız taraf kapanır; iki aksanlı varyant birbirine dokunmaz).
--    unaccent satır başına tek kez hesaplanır; self-join'li hali 77k satırda timeout'a takılıyordu.
with norm as (
  select id, country_id, lower(unaccent(name)) as norm, (name = unaccent(name)) as is_plain
  from public.geo_cities
  where is_active = true
),
dups as (
  select country_id, norm
  from norm
  group by country_id, norm
  having count(*) > 1 and bool_or(is_plain) and bool_or(not is_plain)
)
update public.geo_cities c
set is_active = false
from norm n
join dups d on d.country_id = n.country_id and d.norm = n.norm
where c.id = n.id
  and n.is_plain;

commit;
