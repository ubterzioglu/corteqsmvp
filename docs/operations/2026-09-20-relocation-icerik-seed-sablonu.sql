-- Relocation motoru — İÇERİK GİRİŞ ŞABLONU
-- Plan: docs/plans/2026-09-20-relocation-motor-plani.md (Faz 2)
--
-- BU DOSYA NE İŞE YARAR
-- Motorun kodu hazır; sekmeler veriyi bu iki tablodan okur. Veri girilmeden sekme
-- HİÇ ÇİZİLMEZ (boş sekme göstermiyoruz). Aşağıdaki blokları doldurup çalıştırınca
-- "Yaşam Masrafları" ve "Gerekli Belgeler" sekmeleri kendiliğinden görünür.
--
-- ⚠️ NASIL ÇALIŞTIRILIR — PowerShell'den KOMUT SATIRIYLA GÖNDERME
-- PowerShell komut satırından psql'e geçen Türkçe karakterler bozulur (ı→i).
-- Bu dosyayı UTF-8 olarak kaydet ve DOSYA olarak gönder:
--
--   $env:PGPASSWORD = "<SUPABASE_DB_PASSWORD>"
--   psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres `
--     user=postgres.injprdrsklkxgnaiixzh sslmode=require" `
--     -v ON_ERROR_STOP=1 -f docs/operations/2026-09-20-relocation-icerik-seed-sablonu.sql
--
-- ⚠️ ÖNCE PROVA: komutu çalıştırmadan önce dosyanın başına `BEGIN;` sonuna `ROLLBACK;`
-- ekleyip bir kez koş. Hata yoksa ROLLBACK'i COMMIT yap ya da satırları kaldırıp
-- yeniden çalıştır.

-- ===========================================================================
-- 1) YAŞAM MASRAFLARI  →  public.relocation_living_costs
-- ===========================================================================
--
-- KURALLAR
--   • country_code: ISO 3166-1 alpha-2, BÜYÜK harf. Almanya=DE, Hollanda=NL,
--     Fransa=FR, Kanada=CA, Avustralya=AU, İngiltere=GB, ABD=US.
--   • city_code: şehir kırılımı yoksa NULL bırak (ülke geneli demektir).
--   • item_key: YALNIZ şu altı değer — rent, groceries, transport, insurance,
--     utilities, childcare. Başka değer CHECK kısıtına takılır (sessizce kaydolmaz).
--   • amount_min / amount_max: SAYI. "€800-1500" gibi metin YAZMA. Tek değer
--     biliniyorsa ikisine de aynı sayıyı yaz ya da birini NULL bırak.
--   • household_size: 1 = yalnız, 2 = çift, 3+ = aile. Aynı kalem için birden çok
--     hane satırı girebilirsin; arayüz haneye en uygun olanı seçer.
--     ⚠️ Katsayıyla çarpma YAPMA — gerçek rakamı gir, motor çarpmaz.
--   • period: 'monthly' (aylık) veya 'one_off' (tek seferlik, ör. depozito).
--
-- ÖRNEK — Almanya, tek kişi, aylık. KENDİ RAKAMLARINLA DEĞİŞTİR.
insert into public.relocation_living_costs
  (country_code, city_code, item_key, amount_min, amount_max, currency, household_size, period, note)
values
  ('DE', null, 'rent',      800,  1500, 'EUR', 1, 'monthly', null),
  ('DE', null, 'groceries', 300,   500, 'EUR', 1, 'monthly', null),
  ('DE', null, 'transport',  80,   120, 'EUR', 1, 'monthly', 'Aylık toplu taşıma kartı'),
  ('DE', null, 'insurance', 200,   400, 'EUR', 1, 'monthly', 'Zorunlu sağlık sigortası'),
  ('DE', null, 'utilities', 200,   350, 'EUR', 1, 'monthly', null)
on conflict (country_code, coalesce(city_code, ''), item_key, household_size, period)
do update set
  amount_min = excluded.amount_min,
  amount_max = excluded.amount_max,
  currency   = excluded.currency,
  note       = excluded.note,
  updated_at = now();

-- ===========================================================================
-- 2) GEREKLİ BELGELER  →  public.relocation_required_documents
-- ===========================================================================
--
-- KURALLAR
--   • category: serbest Türkçe metin (ör. Kimlik, Eğitim, Finans, Sağlık, Konut).
--     Arayüz bu alana göre gruplar ve Türkçe alfabeye göre sıralar.
--   • note: apostil / yeminli tercüme / kurum bilgisi buraya. En değerli alan budur.
--   • sort_order: kategori İÇİNDEKİ sıra. Aynı sayı verirsen sıra garanti değildir.
--
-- ÖRNEK — Almanya. KENDİ LİSTENLE DEĞİŞTİR.
insert into public.relocation_required_documents
  (country_code, doc_name, category, note, sort_order)
values
  ('DE', 'Pasaport (min. 6 ay geçerli)', 'Kimlik', 'Orijinal + 2 fotokopi', 1),
  ('DE', 'Doğum Belgesi',                'Kimlik', 'Apostil tasdikli, yeminli tercüme', 2),
  ('DE', 'Evlilik Cüzdanı',              'Kimlik', 'Apostil tasdikli, yeminli tercüme', 3),
  ('DE', 'Diploma ve Transkript',        'Eğitim', 'Apostil tasdikli, yeminli tercüme + Anabin kaydı', 1),
  ('DE', 'Dil Belgesi (B1/B2)',          'Eğitim', 'Goethe / TestDaF / telc', 2);

-- ===========================================================================
-- 3) DOĞRULAMA — seed sonrası MUTLAKA çalıştır
-- ===========================================================================
-- "Girdim" demeden önce satırı gör. Boş dönerse sekme canlıda da çizilmez.

select country_code, item_key, household_size, amount_min, amount_max, currency, period
from public.relocation_living_costs
where is_active
order by country_code, item_key, household_size;

select country_code, category, doc_name, note, sort_order
from public.relocation_required_documents
where is_active
order by country_code, category, sort_order;

-- Ülke bazında özet — hangi ülkede kaç satır var?
select 'maliyet' as tur, country_code, count(*)
from public.relocation_living_costs where is_active group by country_code
union all
select 'belge', country_code, count(*)
from public.relocation_required_documents where is_active group by country_code
order by 1, 2;

-- ===========================================================================
-- 4) SATIR KALDIRMA (silme yerine pasifleştirme önerilir)
-- ===========================================================================
-- update public.relocation_living_costs set is_active = false where country_code = 'XX';
-- update public.relocation_required_documents set is_active = false where country_code = 'XX';
