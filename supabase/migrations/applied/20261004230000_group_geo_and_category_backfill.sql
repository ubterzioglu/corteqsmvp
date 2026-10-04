-- U07 veri kararları uygulandı — 10 grubun yeni motor alanlarına bağlanması.
--
-- Kullanıcı onayı 04.10: "yüksek güvenli maddeleri uygula, düşük güvenli 2'yi bana bırak".
--
-- ── KAPSAM DÜZELTMESİ (ölçüldü, panoyu düzeltir) ────────────────────────────
-- Pano "6 grubun konumu" diyordu. Ölçüm: `country_code` ve `city_id`
-- **10 grubun HEPSİNDE boş** — gerçek ülkesi yazanlarda bile. Yani iş 6 grup
-- değil, 10 grup.
--
-- ⚠️ İKİ KATALOG AYRIŞMASI (Cadde'de aylarca sessiz kusur üreten sınıf):
--    `whatsapp_landings.country` = 'Birleşik Arap Emirlikleri'
--    `geo_countries.name`        = 'BAE'
--    Bu yüzden ülke metinle DEĞİL, açıkça ISO koduyla bağlanır.
--
-- ── BU MIGRATION SALT EKLEMEDİR ─────────────────────────────────────────────
-- Legacy `country`/`city` metin kolonlarına DOKUNULMAZ (G10'un salt-ekleme
-- deseni). Yeni motor `country_code`/`city_id`/`is_global` okur.
--
-- ── BİLEREK UYGULANMAYANLAR (kullanıcı kararı bekliyor) ─────────────────────
--   · AI Legion kategorisi: 'diger' KALIR (meslek-kariyer mi hobi-kultur mu?)
--   · TED InnoVenture konumu: Global/Genel KALIR ("Ankara Koleji ve TED
--     mezunları" diyor ama mezun grupları genelde diaspora geneli)
--   · HCD-Bilinç + SHAMAN'ın gizlenmesi: durum değişimi `set_group_status_v1`
--     kapısından geçer; migration içinden çağrı G22'de `group_forbidden`
--     vermişti. AYRI adım olarak yapılır — bu dosya durum DEĞİŞTİRMEZ.

begin;

-- ── A · kategori (politika §5: "'Diğer' kategorisi yoktur") ─────────────────
update whatsapp_landings set category = 'kisisel-gelisim'
 where group_name like 'SHAMAN%' and category = 'diger';

update whatsapp_landings set category = 'meslek-kariyer'
 where group_name like 'SEO %' and category = 'diger';

-- ── B · gerçekten global olanlar ────────────────────────────────────────────
update whatsapp_landings set is_global = true
 where group_name in ('InnoVenture Global', 'SEO & GEO Topluluğu', 'AI Legion')
    or group_name like 'SHAMAN%';

-- ── C · ülke kodu (metin eşleşmesi DEĞİL, açık ISO) ─────────────────────────
update whatsapp_landings set country_code = 'DE' where group_name = 'almanya101';
update whatsapp_landings set country_code = 'TR' where group_name like 'HCD-%';
update whatsapp_landings set country_code = 'QA' where group_name like 'METU QATAR%';
update whatsapp_landings set country_code = 'AE' where group_name like 'OIG-%'
                                                  or group_name like 'UAE-QATAR-GCC%';

-- ── D · şehir (geo_cities'ten id ile; almanya101 ülke geneli → şehir YOK) ───
update whatsapp_landings l set city_id = c.id
  from geo_cities c join geo_countries co on co.id = c.country_id
 where c.name = 'İstanbul' and co.code = 'TR' and l.group_name like 'HCD-%';

update whatsapp_landings l set city_id = c.id
  from geo_cities c join geo_countries co on co.id = c.country_id
 where c.name = 'Doha' and co.code = 'QA' and l.group_name like 'METU QATAR%';

update whatsapp_landings l set city_id = c.id
  from geo_cities c join geo_countries co on co.id = c.country_id
 where c.name = 'Dubai' and co.code = 'AE'
   and (l.group_name like 'OIG-%' or l.group_name like 'UAE-QATAR-GCC%');

-- ── E · short_description ───────────────────────────────────────────────────
-- 🔴 TEŞHİS DEĞİŞTİ: metinler "çok uzun" değil, içlerine MAKİNE ETİKETİ
--    tıkılmış ([Başvuru tipi: …] [Platform: …] [Badge member: …]).
--    Etiketler ayıklanınca 10'un 5'i zaten 160'ın altına düşüyor.
--    `description` etiketleriyle KALIR (G21 etiket kuyruğunu bilerek koruyor);
--    temiz metin `short_description`'a yazılır — alan 10 grubun hepsinde BOŞTU.
-- ⚠️ 160'ı aşan 5 metin kelime sınırında kesilir, harf ortasında DEĞİL.
update whatsapp_landings l
   set short_description = case
         when length(t.temiz) <= 160 then t.temiz
         else btrim(left(t.temiz, 157 - position(' ' in reverse(left(t.temiz, 157))))) || '…'
       end
  from (
    select id,
           btrim(regexp_replace(regexp_replace(description, '\[[^\]]*\]', '', 'g'),
                                '\s+', ' ', 'g')) as temiz
      from whatsapp_landings
  ) t
 where t.id = l.id and length(t.temiz) > 0;

\echo ''
\echo '=== SONUC ==='
select left(group_name,26) as grup, category, country_code,
       case when city_id is null then '-' else 'var' end as sehir,
       is_global, length(short_description) as kisa_uz
from whatsapp_landings order by group_name;

\echo ''
\echo '=== KABUL 1: diger kategorisi kac kaldi (1 olmali - AI Legion bilerek) ==='
select count(*) as diger_kalan from whatsapp_landings where category='diger';

-- ⚠️ İLK YAZIMDA BU İDDİA YANLIŞTI: "1 olmalı" denmişti, ölçüm 5 verdi.
-- Veri doğru, iddia yanlıştı: gerçekten global olan 4 grubun ülke kodu OLMAZ
-- (tasarım gereği). 5 = 4 global + 1 TED (bilerek ertelendi). Ders: beklenen
-- sayıyı yazmadan önce "hangi satırlar bu kümede" diye say.
\echo '=== KABUL 2: country_code bos kac kaldi (5 olmali = 4 global + 1 TED) ==='
select count(*) as kodsuz from whatsapp_landings where country_code is null or country_code='';

\echo '=== KABUL 3: short_description 160 asan var mi (0 olmali) ==='
select count(*) as asan from whatsapp_landings where length(short_description) > 160;

\echo '=== KABUL 4: short_description bos kalan (0 olmali) ==='
select count(*) as bos from whatsapp_landings where short_description is null or length(short_description)=0;

\echo '=== KABUL 5: legacy country/city metni DEGISMEDI mi ==='
select count(*) as global_metni_duruyor from whatsapp_landings where country='Global' and city='Genel';

commit;