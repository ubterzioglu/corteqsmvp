-- Cadde ↔ geo katalog köprüsünün doldurulması + eksik şehir (m77, Batch 2)
--
-- NEDEN: profil formu `geo_countries`(251)/`geo_cities`(76.990) sunuyor, Cadde ise
-- `cadde_countries`(22)/`cadde_cities`(54) ile eşleştiriyor. İki liste ayrı olduğu için
-- üye geçerli bir şehir seçiyor ("München") ama Cadde onu tanımıyor ("Münih").
-- Köprü kolonları (geo_country_id / geo_city_id) ZATEN VAR; 9 satırı boştu — hepsi
-- 20260805140000'de elle eklenen kayıtlar, eklenirken köprü doldurulmamış.
--
-- ÖLÇÜM (05.08.2026 akşamı, canlı, distinct değerler):
--   şehir: 68 farklı değerin 60'ı çözülüyor · ülke: 29'un 26'sı
--   köprü eksiği: cadde_countries 4/22 · cadde_cities 5/54
--
-- ⚠️ PERFORMANS KURALI (bu gece öğrenildi, tekrar etme):
-- `geo_cities` 76.990 satır ve üretim örneği 904 MB RAM. Bu dosyada fold karşılaştırması
-- ASLA tüm tabloya uygulanmaz — önce ülkeye daraltılır, sonra o alt küme içinde eşleşilir.
-- Satır başına fonksiyon çağıran bir sorgu bu örnekte Postgres'i düşürdü (05.08, ~50 dk
-- kesinti). Aşağıdaki her sorgu ya tam ad eşitliği ya da ülkeye daraltılmış fold kullanır.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez — dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f supabase/migrations/applied/20260805200000_cadde_geo_bridge_backfill.sql
--
-- ═══ UYGULAMA KAYDI — 2026-08-05, canlı (injprdrsklkxgnaiixzh) ═══════════════
-- BÖLÜM 1: UYGULANDI. Sonuç prova ile birebir aynı çıktı:
--   UPDATE 4 (ülke köprüsü) · UPDATE 3 + UPDATE 1 (şehir köprüsü) · INSERT 1 (Böblingen)
--   ülke köprüsü 22/22 · şehir köprüsü 53/55 · köprüsüz kalan: Böblingen, Kişinev
--   schema_migrations kaydı atıldı, dosya applied/ altına taşındı.
--
-- ⚠️ 79-84. satırlardaki tahmin KISMEN yanlış çıktı: `Istanbul` fold adımında ÇÖZÜLDÜ.
-- Açık kalan `Kişinev` (farklı kelime, karar ister — beklenen) ve `Böblingen`. Böblingen'in
-- köprüsüz kalması yapısaldır: 3. adımdaki INSERT, köprü UPDATE'lerinden SONRA çalışıyor.
-- Zararsız — Cadde eşleşmesi ad üzerinden yürüyor. Köprü istenirse ayrı migration ister.
--
-- BÖLÜM 2: AŞAĞIDAKİ HÂLİYLE ÇALIŞTIRILAMADI. `value_text = NULL` şema kısıtını ihlal eder:
--     CHECK (value_text IS NOT NULL OR value_json IS NOT NULL)
--   Hedef 35 satırın hiçbirinde `value_json` dolu değil (ölçüldü), yani NULL'a çekmek
--   satırı geçersiz kılıyor. Şemanın kastı: "değer yoksa satır da olmaz" → DELETE gerekirdi.
--   Ayrıca 122. satırdaki "4 çöp" sayımı yanlış: `a` HEM şehirde HEM ülkede var → toplam 34 değil 35.
--
--   KULLANICI KARARI: 32 satır (27 'Belirtilmedi' + 5 çöp) SİLİNMEDİ, olduğu gibi bırakıldı.
--   Yalnız 3 gerçek onarım uygulandı → docs/operations/2026-08-05-uye-konum-onarim.sql
--   Yedek (35 satır, geri yükleme) → docs/operations/2026-08-05-uye-konum-yedek.sql
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Geri alma:
--   update public.cadde_countries set geo_country_id = null where name in ('Güney Afrika','İtalya','Moldova','Suudi Arabistan');
--   update public.cadde_cities    set geo_city_id    = null where name in ('Cape Town','Riyad','Roma');
--   delete from public.cadde_cities where name = 'Böblingen';
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Kaçak sorguya karşı emniyet: bu dosyadaki hiçbir ifade 30 sn'yi geçemez.
set local statement_timeout = '30s';

-- 1) ÜLKE KÖPRÜSÜ ------------------------------------------------------------
-- Dördü de geo tarafında TAM ad eşitliğiyle 1:1 eşleşiyor (ölçüldü). Belirsizlik yok.
update public.cadde_countries c
set geo_country_id = g.id
from public.geo_countries g
where c.geo_country_id is null
  and g.name = c.name;

-- 2) ŞEHİR KÖPRÜSÜ -----------------------------------------------------------
-- ⚠️ Şehir adı TEK BAŞINA benzersiz DEĞİL: 'Roma' geo tarafında 4 satırla eşleşiyor
-- (ABD'de de Rome var). Ülke kısıtı olmadan yapılan bir güncelleme rastgele birini
-- seçerdi — CLAUDE.md'nin uyardığı "mükerrer Roma" sınıfının aynısı.
-- Bu yüzden eşleşme ÜLKE üzerinden bağlanır (1. adım bunu mümkün kıldı).
update public.cadde_cities c
set geo_city_id = g.id
from public.geo_cities g
     join public.cadde_countries cc on cc.geo_country_id = g.country_id
where c.geo_city_id is null
  and c.country_id = cc.id
  and g.name = c.name;

-- Tam ad tutmayanlar için ülkeye DARALTILMIŞ fold denemesi.
-- Alt küme tek bir ülkenin şehirleri olduğu için fold burada güvenli.
update public.cadde_cities c
set geo_city_id = g.id
from public.geo_cities g
     join public.cadde_countries cc on cc.geo_country_id = g.country_id
where c.geo_city_id is null
  and c.country_id = cc.id
  and public.cadde_fold_text(g.name) = public.cadde_fold_text(c.name);

-- 3) EKSİK ŞEHİR: Böblingen --------------------------------------------------
-- Gerçek bir Almanya şehri, katalogda yoktu ve bir üyenin profilinde yazıyor.
insert into public.cadde_cities (country_id, name, timezone, sort_order, is_active)
select cc.id, 'Böblingen', 'Europe/Berlin',
       coalesce((select max(sort_order) from public.cadde_cities), 0) + 1, true
from public.cadde_countries cc
where cc.name = 'Almanya'
  and not exists (
    select 1 from public.cadde_cities x
    where x.country_id = cc.id
      and public.cadde_fold_text(x.name) = public.cadde_fold_text('Böblingen')
  );

-- 4) DOĞRULAMA ---------------------------------------------------------------
-- Beklenen: ülke köprüsü 22/22. Şehirde 'Istanbul' ve 'Kişinev' AÇIK KALIR:
--   Istanbul → geo tarafında 'İstanbul' (Türkçe İ) yazımı farklı, fold denemesi bunu
--              yakalamalı; yakalamazsa ad varyantı kararı gerekir.
--   Kişinev  → geo'da büyük olasılıkla 'Chisinau'/'Chișinău'. Bu bir YAZIM VARYANTI
--              DEĞİL, FARKLI KELİME — fold çözemez, karar ister (bkz. CLAUDE.md'deki
--              Qatar/Katar, Deutschland/Almanya notu). Tahminle eşleştirme YAPILMADI.
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
select 'Boblingen eklendi mi',
       case when exists (select 1 from public.cadde_cities where name = 'Böblingen')
            then 'evet' else 'HAYIR' end;

-- 5) SÜRÜM KAYDI -------------------------------------------------------------
-- Bu repoda migration dosyaları sürüm kaydını KENDİLERİ yazmıyor; kayıt ayrıca
-- atılıyor ve DÖRT KEZ unutuldu (bkz. admin-todos + CLAUDE.md). Döngüyü kırmak için
-- kayıt burada, işin kendisiyle aynı transaction'da atılıyor.
insert into supabase_migrations.schema_migrations (version, name)
values ('20260805200000', 'cadde_geo_bridge_backfill')
on conflict (version) do nothing;

commit;

-- ═════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 2 — ÜYE VERİSİ. ÇALIŞTIRMA, KARAR İSTER.
--
-- Aşağıdaki değerler üyelerin KENDİ profil kayıtlarıdır. Bu repoda üye verisine
-- dokunmak kullanıcı kararına bağlıdır (cenkkarakuz kaydında aynı sınır konuldu).
-- Ölçülen etki (05.08 akşamı, üye sayısı):
--
--   München                 1   → katalogdaki karşılığı 'Münih'
--   Çankaya                 1   → Ankara'nın İLÇESİ, şehir değil → 'Ankara'
--   Düsseldorf/Grevenbroich 1   → tek alana iki şehir → 'Düsseldorf'
--   Böblingen               1   → artık katalogda (yukarıda eklendi), onarım GEREKMEZ
--   Mb, Vanuu, a, De        4   → çöp/yarım giriş → NULL
--   Belirtilmedi           14 ülke + 13 şehir → WhatsApp bot kayıt akışından gelen ESKİ
--                                VERİ (arşiv yedeklerinde 'register / WhatsApp Bot /
--                                @wa.local' satırları). Gerçek bir yer değil; katalog
--                                işi değil. Doğru tedavi büyük olasılıkla NULL'a çekmek,
--                                çünkü "belirtilmemiş" bir değer konum gibi davranıyor.
--
-- İSTERSEN aç:
-- begin;
-- set local statement_timeout = '30s';
-- with a as (select id, key from public.afs_attributes where key in ('country','city'))
-- update public.user_profile_attributes upa
-- set value_text = case
--       when btrim(upa.value_text) = 'München'                 then 'Münih'
--       when btrim(upa.value_text) = 'Çankaya'                 then 'Ankara'
--       when btrim(upa.value_text) = 'Düsseldorf/Grevenbroich' then 'Düsseldorf'
--       else null
--     end
-- from a
-- where a.id = upa.attribute_id
--   and btrim(coalesce(upa.value_text,'')) in
--       ('München','Çankaya','Düsseldorf/Grevenbroich','Mb','Vanuu','a','De','Belirtilmedi');
-- -- Beklenen: 3 onarım + 4 çöp NULL + 27 'Belirtilmedi' NULL = 34 satır.
-- commit;
-- ═════════════════════════════════════════════════════════════════════════════
