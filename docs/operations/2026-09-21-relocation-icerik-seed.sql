-- Relocation motoru — İÇERİK SEED'İ (12 ülke)
-- Şablon/kurallar: docs/operations/2026-09-20-relocation-icerik-seed-sablonu.sql
-- Plan: docs/plans/2026-09-20-relocation-modulu-plani.md (Batch 3–4)
--
-- ÖN KOŞUL
--   supabase/migrations/applied/20260921100000_relocation_required_documents_uniq.sql
--   UYGULANMIŞ olmalı. Belge insert'i o indekse `on conflict` ile dayanır; indeks
--   yoksa 42P10 ile durur (ON ERROR STOP sayesinde yarım veri kalmaz).
--
-- NASIL ÇALIŞTIRILIR — DOSYA olarak gönder, komut satırından yapıştırma:
--   $env:PGPASSWORD = "<SUPABASE_DB_PASSWORD>"
--   psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres `
--     user=postgres.injprdrsklkxgnaiixzh sslmode=require" `
--     -v ON_ERROR_STOP=1 -f docs/operations/2026-09-21-relocation-icerik-seed.sql
--
-- İDEMPOTENT: iki tabloda da `on conflict ... do update` var. Tekrar çalıştırmak
-- satır ÇOĞALTMAZ, değerleri tazeler.
--
-- ===========================================================================
-- RAKAMLARIN NİTELİĞİ — OKUMADAN DEĞİŞTİRME
-- ===========================================================================
-- Tutarlar, ilgili ülkenin BÜYÜK ŞEHİRLERİ için tipik AYLIK ARALIKLARDIR;
-- tek bir şehrin ölçülmüş fiyatı değildir (`city_code` bu yüzden NULL =
-- "ülke geneli"). Aralıklar bilerek geniştir: dar ve kesin görünen bir rakam,
-- geniş ve dürüst bir aralıktan daha yanıltıcıdır.
--
-- Kaynak: genel piyasa bilgisi (2026 başı). Resmî bir fiyat endeksinden
-- TÜRETİLMEMİŞTİR. `freshness_at` bu yüzden doldurulur — arayüz ileride
-- "veri şu tarihte girildi" diyebilsin ve bayatlık görünür olsun.
--
-- Her ülke TEK para birimi kullanır. `sumMonthlyCosts` (relocation-content-format.ts)
-- karışık para biriminde toplamayı REDDEDER ve panelde toplam hiç görünmez —
-- bir ülkeye ikinci bir para birimi eklersen sessizce toplamı öldürürsün.
--
-- childcare YALNIZ household_size = 4 satırlarında vardır (çocuklu hane).
-- 1 ve 2 kişilik hanede bu kalem yoktur; `groupCostsByItem` verisi olmayan
-- kalemi zaten atlar.

begin;

-- ===========================================================================
-- 1) YAŞAM MASRAFLARI
-- ===========================================================================

insert into public.relocation_living_costs
  (country_code, city_code, item_key, amount_min, amount_max, currency, household_size, period, note, freshness_at)
values
  -- ---------------- Almanya (EUR) ----------------
  ('DE', null, 'rent',       700,  1300, 'EUR', 1, 'monthly', 'Şehir içinde 1+1, sıcak kira (Warmmiete) hariç', now()),
  ('DE', null, 'groceries',  250,   400, 'EUR', 1, 'monthly', null, now()),
  ('DE', null, 'transport',   58,    90, 'EUR', 1, 'monthly', 'Deutschlandticket ülke geneli geçerlidir', now()),
  ('DE', null, 'insurance',  200,   450, 'EUR', 1, 'monthly', 'Zorunlu sağlık sigortası; çalışanda maaştan kesilir', now()),
  ('DE', null, 'utilities',  150,   280, 'EUR', 1, 'monthly', 'Isınma, elektrik, su, internet', now()),
  ('DE', null, 'rent',       950,  1700, 'EUR', 2, 'monthly', null, now()),
  ('DE', null, 'groceries',  420,   650, 'EUR', 2, 'monthly', null, now()),
  ('DE', null, 'transport',  116,   180, 'EUR', 2, 'monthly', null, now()),
  ('DE', null, 'insurance',  400,   800, 'EUR', 2, 'monthly', null, now()),
  ('DE', null, 'utilities',  200,   350, 'EUR', 2, 'monthly', null, now()),
  ('DE', null, 'rent',      1300,  2400, 'EUR', 4, 'monthly', '3+1 veya daha büyük', now()),
  ('DE', null, 'groceries',  650,  1000, 'EUR', 4, 'monthly', null, now()),
  ('DE', null, 'transport',  150,   250, 'EUR', 4, 'monthly', null, now()),
  ('DE', null, 'insurance',  500,   950, 'EUR', 4, 'monthly', 'Aile sigortasında çocuk genelde ek ücretsizdir', now()),
  ('DE', null, 'utilities',  280,   450, 'EUR', 4, 'monthly', null, now()),
  ('DE', null, 'childcare',    0,   400, 'EUR', 4, 'monthly', 'Eyalete göre değişir; bazı eyaletlerde kreş ücretsizdir', now()),

  -- ---------------- Hollanda (EUR) ----------------
  ('NL', null, 'rent',      1100,  1800, 'EUR', 1, 'monthly', 'Serbest piyasa kirası; sosyal konut sırası yıllarcadır', now()),
  ('NL', null, 'groceries',  280,   450, 'EUR', 1, 'monthly', null, now()),
  ('NL', null, 'transport',   80,   140, 'EUR', 1, 'monthly', 'OV-chipkaart; bisiklet günlük ulaşımın belkemiğidir', now()),
  ('NL', null, 'insurance',  140,   185, 'EUR', 1, 'monthly', 'Zorunlu basisverzekering; 18 yaş üstü herkes için ayrı poliçe', now()),
  ('NL', null, 'utilities',  150,   250, 'EUR', 1, 'monthly', null, now()),
  ('NL', null, 'rent',      1400,  2200, 'EUR', 2, 'monthly', null, now()),
  ('NL', null, 'groceries',  470,   700, 'EUR', 2, 'monthly', null, now()),
  ('NL', null, 'transport',  160,   260, 'EUR', 2, 'monthly', null, now()),
  ('NL', null, 'insurance',  280,   370, 'EUR', 2, 'monthly', 'İki yetişkin için iki ayrı poliçe', now()),
  ('NL', null, 'utilities',  200,   320, 'EUR', 2, 'monthly', null, now()),
  ('NL', null, 'rent',      1800,  2800, 'EUR', 4, 'monthly', null, now()),
  ('NL', null, 'groceries',  700,  1100, 'EUR', 4, 'monthly', null, now()),
  ('NL', null, 'transport',  200,   330, 'EUR', 4, 'monthly', null, now()),
  ('NL', null, 'insurance',  280,   370, 'EUR', 4, 'monthly', '18 yaş altı çocuklar ebeveyn poliçesinde ücretsizdir', now()),
  ('NL', null, 'utilities',  280,   420, 'EUR', 4, 'monthly', null, now()),
  ('NL', null, 'childcare',  600,  1600, 'EUR', 4, 'monthly', 'Kinderopvangtoeslag (devlet desteği) düşülmeden önceki tutar', now()),

  -- ---------------- Birleşik Krallık (GBP) ----------------
  ('GB', null, 'rent',       900,  1800, 'GBP', 1, 'monthly', 'Londra üst bandın da üzerindedir; Birmingham/Manchester alt banda yakındır', now()),
  ('GB', null, 'groceries',  200,   350, 'GBP', 1, 'monthly', null, now()),
  ('GB', null, 'transport',   80,   200, 'GBP', 1, 'monthly', 'Londra bölge sayısına göre değişir', now()),
  ('GB', null, 'insurance',    0,   100, 'GBP', 1, 'monthly', 'NHS kullanımı ücretsizdir; vize IHS ücreti AYRI ve peşindir', now()),
  ('GB', null, 'utilities',  120,   220, 'GBP', 1, 'monthly', 'Council tax dahil değildir', now()),
  ('GB', null, 'rent',      1200,  2400, 'GBP', 2, 'monthly', null, now()),
  ('GB', null, 'groceries',  350,   550, 'GBP', 2, 'monthly', null, now()),
  ('GB', null, 'transport',  160,   350, 'GBP', 2, 'monthly', null, now()),
  ('GB', null, 'insurance',    0,   160, 'GBP', 2, 'monthly', null, now()),
  ('GB', null, 'utilities',  160,   280, 'GBP', 2, 'monthly', null, now()),
  ('GB', null, 'rent',      1600,  3000, 'GBP', 4, 'monthly', null, now()),
  ('GB', null, 'groceries',  550,   850, 'GBP', 4, 'monthly', null, now()),
  ('GB', null, 'transport',  200,   420, 'GBP', 4, 'monthly', null, now()),
  ('GB', null, 'insurance',    0,   220, 'GBP', 4, 'monthly', null, now()),
  ('GB', null, 'utilities',  200,   350, 'GBP', 4, 'monthly', null, now()),
  ('GB', null, 'childcare',  700,  1600, 'GBP', 4, 'monthly', 'Ücretsiz saat hakkı düşülmeden önceki tutar', now()),

  -- ---------------- Amerika Birleşik Devletleri (USD) ----------------
  ('US', null, 'rent',      1200,  2500, 'USD', 1, 'monthly', 'Eyalet ve şehir farkı çok büyüktür; New York/San Francisco bandın üzerindedir', now()),
  ('US', null, 'groceries',  350,   600, 'USD', 1, 'monthly', null, now()),
  ('US', null, 'transport',   80,   350, 'USD', 1, 'monthly', 'Çoğu şehirde araç zorunludur; sigorta ve yakıt dahildir', now()),
  ('US', null, 'insurance',  350,   700, 'USD', 1, 'monthly', 'Sağlık sigortası; işveren katkısı bu tutarı belirgin düşürür', now()),
  ('US', null, 'utilities',  130,   250, 'USD', 1, 'monthly', null, now()),
  ('US', null, 'rent',      1500,  3200, 'USD', 2, 'monthly', null, now()),
  ('US', null, 'groceries',  600,   950, 'USD', 2, 'monthly', null, now()),
  ('US', null, 'transport',  150,   600, 'USD', 2, 'monthly', null, now()),
  ('US', null, 'insurance',  700,  1400, 'USD', 2, 'monthly', null, now()),
  ('US', null, 'utilities',  170,   320, 'USD', 2, 'monthly', null, now()),
  ('US', null, 'rent',      2000,  4200, 'USD', 4, 'monthly', null, now()),
  ('US', null, 'groceries',  950,  1500, 'USD', 4, 'monthly', null, now()),
  ('US', null, 'transport',  250,   800, 'USD', 4, 'monthly', 'Aile genelde iki araç kullanır', now()),
  ('US', null, 'insurance', 1200,  2200, 'USD', 4, 'monthly', 'Aile planı; muafiyet (deductible) ayrıca hesaba katılmalıdır', now()),
  ('US', null, 'utilities',  220,   420, 'USD', 4, 'monthly', null, now()),
  ('US', null, 'childcare',  900,  2500, 'USD', 4, 'monthly', 'ABD''de en yüksek kalemlerden biridir; eyalete göre iki katına çıkabilir', now()),

  -- ---------------- Kanada (CAD) ----------------
  ('CA', null, 'rent',      1400,  2400, 'CAD', 1, 'monthly', 'Toronto/Vancouver bandın üzerindedir; Montreal alt banda yakındır', now()),
  ('CA', null, 'groceries',  400,   650, 'CAD', 1, 'monthly', null, now()),
  ('CA', null, 'transport',  100,   160, 'CAD', 1, 'monthly', 'Aylık toplu taşıma kartı', now()),
  ('CA', null, 'insurance',   60,   150, 'CAD', 1, 'monthly', 'Eyalet sağlık sistemi + tamamlayıcı poliçe; ilk aylarda bekleme süresi olabilir', now()),
  ('CA', null, 'utilities',  120,   250, 'CAD', 1, 'monthly', 'Kışın ısıtma belirgin artar', now()),
  ('CA', null, 'rent',      1800,  3000, 'CAD', 2, 'monthly', null, now()),
  ('CA', null, 'groceries',  700,  1050, 'CAD', 2, 'monthly', null, now()),
  ('CA', null, 'transport',  200,   320, 'CAD', 2, 'monthly', null, now()),
  ('CA', null, 'insurance',  120,   280, 'CAD', 2, 'monthly', null, now()),
  ('CA', null, 'utilities',  160,   320, 'CAD', 2, 'monthly', null, now()),
  ('CA', null, 'rent',      2300,  4000, 'CAD', 4, 'monthly', null, now()),
  ('CA', null, 'groceries', 1100,  1700, 'CAD', 4, 'monthly', null, now()),
  ('CA', null, 'transport',  250,   420, 'CAD', 4, 'monthly', null, now()),
  ('CA', null, 'insurance',  180,   400, 'CAD', 4, 'monthly', null, now()),
  ('CA', null, 'utilities',  200,   400, 'CAD', 4, 'monthly', null, now()),
  ('CA', null, 'childcare',  400,  1400, 'CAD', 4, 'monthly', 'Eyalete göre değişir; düşük ücretli program uygulayan eyaletlerde alt banda iner', now()),

  -- ---------------- Fransa (EUR) ----------------
  ('FR', null, 'rent',       900,  1500, 'EUR', 1, 'monthly', 'Paris bandın üzerindedir; APL konut yardımı ayrıca değerlendirilir', now()),
  ('FR', null, 'groceries',  250,   420, 'EUR', 1, 'monthly', null, now()),
  ('FR', null, 'transport',   60,    90, 'EUR', 1, 'monthly', 'Paris bölgesi Navigo aboneliği', now()),
  ('FR', null, 'insurance',   30,    80, 'EUR', 1, 'monthly', 'Tamamlayıcı sigorta (mutuelle); temel sistem sécurité sociale üzerindendir', now()),
  ('FR', null, 'utilities',  120,   220, 'EUR', 1, 'monthly', null, now()),
  ('FR', null, 'rent',      1200,  2000, 'EUR', 2, 'monthly', null, now()),
  ('FR', null, 'groceries',  430,   650, 'EUR', 2, 'monthly', null, now()),
  ('FR', null, 'transport',  120,   180, 'EUR', 2, 'monthly', null, now()),
  ('FR', null, 'insurance',   60,   160, 'EUR', 2, 'monthly', null, now()),
  ('FR', null, 'utilities',  160,   280, 'EUR', 2, 'monthly', null, now()),
  ('FR', null, 'rent',      1700,  2800, 'EUR', 4, 'monthly', null, now()),
  ('FR', null, 'groceries',  650,  1000, 'EUR', 4, 'monthly', null, now()),
  ('FR', null, 'transport',  150,   230, 'EUR', 4, 'monthly', null, now()),
  ('FR', null, 'insurance',  100,   250, 'EUR', 4, 'monthly', 'Aile mutuelle poliçesi', now()),
  ('FR', null, 'utilities',  220,   380, 'EUR', 4, 'monthly', null, now()),
  ('FR', null, 'childcare',  200,   900, 'EUR', 4, 'monthly', 'Crèche ücreti gelire göre hesaplanır', now()),

  -- ---------------- Avusturya (EUR) ----------------
  ('AT', null, 'rent',       650,  1100, 'EUR', 1, 'monthly', 'Viyana belediye konutları piyasayı belirgin ucuzlatır', now()),
  ('AT', null, 'groceries',  250,   400, 'EUR', 1, 'monthly', null, now()),
  ('AT', null, 'transport',   31,    55, 'EUR', 1, 'monthly', 'Viyana yıllık kartı aya bölündüğünde alt banda iner', now()),
  ('AT', null, 'insurance',   70,   200, 'EUR', 1, 'monthly', 'Çalışanda maaştan kesilir; serbest çalışanda bireysel ödenir', now()),
  ('AT', null, 'utilities',  130,   230, 'EUR', 1, 'monthly', null, now()),
  ('AT', null, 'rent',       900,  1500, 'EUR', 2, 'monthly', null, now()),
  ('AT', null, 'groceries',  430,   650, 'EUR', 2, 'monthly', null, now()),
  ('AT', null, 'transport',   62,   110, 'EUR', 2, 'monthly', null, now()),
  ('AT', null, 'insurance',  140,   400, 'EUR', 2, 'monthly', null, now()),
  ('AT', null, 'utilities',  170,   290, 'EUR', 2, 'monthly', null, now()),
  ('AT', null, 'rent',      1200,  2000, 'EUR', 4, 'monthly', null, now()),
  ('AT', null, 'groceries',  650,  1000, 'EUR', 4, 'monthly', null, now()),
  ('AT', null, 'transport',   80,   150, 'EUR', 4, 'monthly', null, now()),
  ('AT', null, 'insurance',  180,   480, 'EUR', 4, 'monthly', null, now()),
  ('AT', null, 'utilities',  220,   380, 'EUR', 4, 'monthly', null, now()),
  ('AT', null, 'childcare',    0,   300, 'EUR', 4, 'monthly', 'Viyana''da anaokulu büyük ölçüde ücretsizdir; diğer eyaletlerde ücretlidir', now()),

  -- ---------------- Belçika (EUR) ----------------
  ('BE', null, 'rent',       750,  1200, 'EUR', 1, 'monthly', null, now()),
  ('BE', null, 'groceries',  260,   420, 'EUR', 1, 'monthly', null, now()),
  ('BE', null, 'transport',   40,    60, 'EUR', 1, 'monthly', 'Brüksel STIB aboneliği', now()),
  ('BE', null, 'insurance',   15,    45, 'EUR', 1, 'monthly', 'Mutualité (sağlık kasası) üyelik aidatı', now()),
  ('BE', null, 'utilities',  150,   280, 'EUR', 1, 'monthly', 'Belçika''da ısıtma gideri Avrupa ortalamasının üzerindedir', now()),
  ('BE', null, 'rent',      1000,  1600, 'EUR', 2, 'monthly', null, now()),
  ('BE', null, 'groceries',  440,   680, 'EUR', 2, 'monthly', null, now()),
  ('BE', null, 'transport',   80,   120, 'EUR', 2, 'monthly', null, now()),
  ('BE', null, 'insurance',   30,    90, 'EUR', 2, 'monthly', null, now()),
  ('BE', null, 'utilities',  200,   350, 'EUR', 2, 'monthly', null, now()),
  ('BE', null, 'rent',      1300,  2200, 'EUR', 4, 'monthly', null, now()),
  ('BE', null, 'groceries',  680,  1050, 'EUR', 4, 'monthly', null, now()),
  ('BE', null, 'transport',  100,   170, 'EUR', 4, 'monthly', null, now()),
  ('BE', null, 'insurance',   60,   140, 'EUR', 4, 'monthly', null, now()),
  ('BE', null, 'utilities',  260,   450, 'EUR', 4, 'monthly', null, now()),
  ('BE', null, 'childcare',  300,   800, 'EUR', 4, 'monthly', 'Ücret gelire göre hesaplanır', now()),

  -- ---------------- İsviçre (CHF) ----------------
  ('CH', null, 'rent',      1500,  2500, 'CHF', 1, 'monthly', 'Zürih ve Cenevre bandın üzerindedir', now()),
  ('CH', null, 'groceries',  400,   650, 'CHF', 1, 'monthly', null, now()),
  ('CH', null, 'transport',   85,   120, 'CHF', 1, 'monthly', 'Bölgesel abonman; Halbtax ülke geneli yolculuğu yarıya indirir', now()),
  ('CH', null, 'insurance',  350,   550, 'CHF', 1, 'monthly', 'Zorunlu sağlık sigortası bireyseldir ve maaştan KESİLMEZ; ayrıca ödenir', now()),
  ('CH', null, 'utilities',  150,   280, 'CHF', 1, 'monthly', null, now()),
  ('CH', null, 'rent',      2000,  3400, 'CHF', 2, 'monthly', null, now()),
  ('CH', null, 'groceries',  700,  1100, 'CHF', 2, 'monthly', null, now()),
  ('CH', null, 'transport',  170,   240, 'CHF', 2, 'monthly', null, now()),
  ('CH', null, 'insurance',  700,  1100, 'CHF', 2, 'monthly', null, now()),
  ('CH', null, 'utilities',  200,   350, 'CHF', 2, 'monthly', null, now()),
  ('CH', null, 'rent',      2600,  4500, 'CHF', 4, 'monthly', null, now()),
  ('CH', null, 'groceries', 1100,  1700, 'CHF', 4, 'monthly', null, now()),
  ('CH', null, 'transport',  220,   330, 'CHF', 4, 'monthly', null, now()),
  ('CH', null, 'insurance', 1000,  1600, 'CHF', 4, 'monthly', 'Çocuk için de ayrı poliçe gerekir', now()),
  ('CH', null, 'utilities',  260,   450, 'CHF', 4, 'monthly', null, now()),
  ('CH', null, 'childcare', 1500,  3000, 'CHF', 4, 'monthly', 'Avrupa''nın en pahalı kreş ücretlerindendir', now()),

  -- ---------------- İsveç (SEK) ----------------
  ('SE', null, 'rent',      9000, 16000, 'SEK', 1, 'monthly', 'Stokholm''de ilk elden kira sırası yıllarcadır; ikinci el kiralama yaygındır', now()),
  ('SE', null, 'groceries', 3000,  4500, 'SEK', 1, 'monthly', null, now()),
  ('SE', null, 'transport',  970,  1100, 'SEK', 1, 'monthly', 'Aylık bölge kartı', now()),
  ('SE', null, 'insurance',    0,   500, 'SEK', 1, 'monthly', 'Sağlık sistemi vergiyle finanse edilir; ev/eşya sigortası bu banttadır', now()),
  ('SE', null, 'utilities',  700,  1500, 'SEK', 1, 'monthly', 'Kiraya dahil olabilir — sözleşmeyi kontrol edin', now()),
  ('SE', null, 'rent',     12000, 20000, 'SEK', 2, 'monthly', null, now()),
  ('SE', null, 'groceries', 5000,  7500, 'SEK', 2, 'monthly', null, now()),
  ('SE', null, 'transport', 1900,  2200, 'SEK', 2, 'monthly', null, now()),
  ('SE', null, 'insurance',    0,   900, 'SEK', 2, 'monthly', null, now()),
  ('SE', null, 'utilities', 1000,  2000, 'SEK', 2, 'monthly', null, now()),
  ('SE', null, 'rent',     15000, 26000, 'SEK', 4, 'monthly', null, now()),
  ('SE', null, 'groceries', 8000, 12000, 'SEK', 4, 'monthly', null, now()),
  ('SE', null, 'transport', 2400,  2900, 'SEK', 4, 'monthly', null, now()),
  ('SE', null, 'insurance',    0,  1300, 'SEK', 4, 'monthly', null, now()),
  ('SE', null, 'utilities', 1400,  2600, 'SEK', 4, 'monthly', null, now()),
  ('SE', null, 'childcare', 1000,  1700, 'SEK', 4, 'monthly', 'Tavan ücret (maxtaxa) uygulanır; gelire göre düşer', now()),

  -- ---------------- Birleşik Arap Emirlikleri (AED) ----------------
  ('AE', null, 'rent',      4000,  8000, 'AED', 1, 'monthly', 'Kira genelde YILLIK ve az taksitle peşin istenir — nakit akışını buna göre planlayın', now()),
  ('AE', null, 'groceries', 1000,  1800, 'AED', 1, 'monthly', null, now()),
  ('AE', null, 'transport',  300,   800, 'AED', 1, 'monthly', 'Metro/taksi ya da araç; şehirler arası mesafeler uzundur', now()),
  ('AE', null, 'insurance',  500,  1200, 'AED', 1, 'monthly', 'Sağlık sigortası zorunludur; çoğu işveren karşılar', now()),
  ('AE', null, 'utilities',  400,   800, 'AED', 1, 'monthly', 'Yazın klima gideri belirgin artar', now()),
  ('AE', null, 'rent',      6000, 11000, 'AED', 2, 'monthly', null, now()),
  ('AE', null, 'groceries', 1800,  3000, 'AED', 2, 'monthly', null, now()),
  ('AE', null, 'transport',  600,  1500, 'AED', 2, 'monthly', null, now()),
  ('AE', null, 'insurance', 1000,  2400, 'AED', 2, 'monthly', null, now()),
  ('AE', null, 'utilities',  600,  1200, 'AED', 2, 'monthly', null, now()),
  ('AE', null, 'rent',      8000, 16000, 'AED', 4, 'monthly', null, now()),
  ('AE', null, 'groceries', 3000,  5000, 'AED', 4, 'monthly', null, now()),
  ('AE', null, 'transport',  900,  2200, 'AED', 4, 'monthly', null, now()),
  ('AE', null, 'insurance', 1800,  4500, 'AED', 4, 'monthly', null, now()),
  ('AE', null, 'utilities',  900,  1800, 'AED', 4, 'monthly', null, now()),
  ('AE', null, 'childcare', 2000,  5000, 'AED', 4, 'monthly', 'Okul ücretleri bütçenin en büyük kalemidir; kayıt ücreti ayrıdır', now()),

  -- ---------------- Katar (QAR) ----------------
  ('QA', null, 'rent',      4000,  7500, 'QAR', 1, 'monthly', 'Mobilyalı daire yaygındır ve kira buna göre değişir', now()),
  ('QA', null, 'groceries', 1000,  1800, 'QAR', 1, 'monthly', null, now()),
  ('QA', null, 'transport',  300,   900, 'QAR', 1, 'monthly', 'Doha metrosu sınırlı hatta hizmet verir; araç yaygındır', now()),
  ('QA', null, 'insurance',  300,   900, 'QAR', 1, 'monthly', 'Sağlık sigortası zorunludur; çoğu işveren karşılar', now()),
  ('QA', null, 'utilities',  300,   700, 'QAR', 1, 'monthly', 'Kahramaa; yazın klima gideri artar', now()),
  ('QA', null, 'rent',      5500, 10000, 'QAR', 2, 'monthly', null, now()),
  ('QA', null, 'groceries', 1800,  3000, 'QAR', 2, 'monthly', null, now()),
  ('QA', null, 'transport',  600,  1600, 'QAR', 2, 'monthly', null, now()),
  ('QA', null, 'insurance',  700,  1800, 'QAR', 2, 'monthly', null, now()),
  ('QA', null, 'utilities',  450,  1000, 'QAR', 2, 'monthly', null, now()),
  ('QA', null, 'rent',      7500, 14000, 'QAR', 4, 'monthly', null, now()),
  ('QA', null, 'groceries', 3000,  5000, 'QAR', 4, 'monthly', null, now()),
  ('QA', null, 'transport',  900,  2400, 'QAR', 4, 'monthly', null, now()),
  ('QA', null, 'insurance', 1200,  3500, 'QAR', 4, 'monthly', null, now()),
  ('QA', null, 'utilities',  700,  1500, 'QAR', 4, 'monthly', null, now()),
  ('QA', null, 'childcare', 2000,  4500, 'QAR', 4, 'monthly', 'Uluslararası okul ücretleri; kayıt ücreti ayrıdır', now())

on conflict (country_code, coalesce(city_code, ''), item_key, household_size, period)
do update set
  amount_min   = excluded.amount_min,
  amount_max   = excluded.amount_max,
  currency     = excluded.currency,
  note         = excluded.note,
  freshness_at = excluded.freshness_at,
  is_active    = true,
  updated_at   = now();

-- ===========================================================================
-- 2) GEREKLİ BELGELER — ortak çekirdek
-- ===========================================================================
-- Bu 13 belge 12 ülkenin HEPSİNDE istenir. Ülke listesiyle çapraz birleştirilir;
-- elle 12 kez kopyalamak, bir ülkede unutulan satır sınıfını doğurur.
--
-- ⚠️ Apostil ve yeminli tercüme gereksinimleri konsolosluğa göre değişebilir.
-- Notlar yol gösterir, resmî listenin yerini TUTMAZ.

insert into public.relocation_required_documents
  (country_code, doc_name, category, note, sort_order)
select c.code, d.doc_name, d.category, d.note, d.sort_order
from (values
  ('DE'), ('NL'), ('GB'), ('US'), ('CA'), ('FR'),
  ('AT'), ('BE'), ('CH'), ('SE'), ('AE'), ('QA')
) as c(code)
cross join (values
  ('Pasaport (en az 6 ay geçerli)',            'Kimlik',    'Orijinal + fotokopi. Bazı başvurularda eski pasaportlar da istenir.', 1),
  ('Biyometrik fotoğraf',                      'Kimlik',    'Başvurulan ülkenin ölçü standardına uygun olmalı; vesikalık her zaman kabul edilmez.', 2),
  ('Uluslararası doğum belgesi (Formül A)',    'Kimlik',    'Nüfus müdürlüğünden alınır. Çok dilli olduğu için çoğu ülkede tercüme istenmez.', 3),
  ('Evlilik cüzdanı / uluslararası aile cüzdanı', 'Kimlik', 'Evli veya çocuklu başvurularda. Apostil + yeminli tercüme gerekebilir.', 4),
  ('Adli sicil belgesi',                       'Kimlik',    'e-Devlet''ten "yurt dışında kullanılmak üzere" alın. Apostil gerekir, geçerlilik genelde 3 aydır.', 5),
  ('Diploma ve transkript',                    'Eğitim',    'Apostil tasdikli + yeminli tercüme. Denklik başvurusu AYRI bir süreçtir.', 1),
  ('Dil yeterlilik belgesi',                   'Eğitim',    'Kabul edilen sınav ve seviye ülkeye ve vize türüne göre değişir.', 2),
  ('Sağlık sigortası poliçesi',                'Sağlık',    'Oturum başvurusunda belge olarak istenir. Seyahat sigortası çoğu zaman yeterli sayılmaz.', 1),
  ('Aşı karnesi',                              'Sağlık',    'Çocukların okul kaydında istenir. Eksik aşılar varışta tamamlanabilir.', 2),
  ('Banka hesap özeti / maddi yeterlilik',     'Finans',    'Genelde son 3-6 ay. İstenen tutar vize türüne göre değişir.', 1),
  ('İş sözleşmesi veya kabul mektubu',         'İstihdam',  'Çalışma ya da öğrenci vizesinin dayanağıdır. Maaş eşiği aranan vizelerde tutar görünür olmalıdır.', 1),
  ('Kira sözleşmesi / konaklama belgesi',      'Konut',     'Adres kaydı ve çoğu zaman banka hesabı açılışı buna bağlıdır.', 1),
  ('Ehliyet ve uluslararası ehliyet',          'Ulaşım',    'Türk ehliyetinin geçerlilik süresi ve değiştirme koşulları ülkeye göre değişir.', 1)
) as d(doc_name, category, note, sort_order)
on conflict (country_code, doc_name) do update set
  category   = excluded.category,
  note       = excluded.note,
  sort_order = excluded.sort_order,
  is_active  = true,
  updated_at = now();

-- ===========================================================================
-- 3) GEREKLİ BELGELER — ülkeye özgü
-- ===========================================================================
-- sort_order ortak çekirdeğin ardından gelsin diye 10''dan başlar.

insert into public.relocation_required_documents
  (country_code, doc_name, category, note, sort_order)
values
  -- Almanya
  ('DE', 'Anabin / ZAB denklik belgesi',        'Eğitim',   'Yükseköğrenim diplomasının tanınması. İş başvurusundan ÖNCE başlatın, haftalar sürer.', 10),
  ('DE', 'Almanca dil belgesi (A1-B1)',         'Eğitim',   'Aile birleşiminde A1, oturum/vatandaşlıkta daha yüksek seviye aranır.', 11),
  ('DE', 'Anmeldung (adres kaydı) randevusu',   'Konut',    'Varıştan sonra yapılması gereken ilk işlemdir; vergi numarası ve banka hesabı buna bağlıdır.', 10),
  ('DE', 'Krankenversicherung kayıt onayı',     'Sağlık',   'Zorunlu sağlık sigortası kaydı olmadan oturum ve çoğu işe giriş tamamlanmaz.', 10),

  -- Hollanda
  ('NL', 'MVV / TEV onay yazısı',               'Hukuk',    'Uzun süreli giriş vizesi. Genelde işveren ya da okul IND nezdinde başlatır.', 10),
  ('NL', 'Nuffic diploma değerlendirmesi',      'Eğitim',   'Hollanda''da diploma denkliğinin karşılığıdır.', 10),
  ('NL', 'Basisverzekering poliçesi',           'Sağlık',   'Zorunludur ve varıştan sonra 4 ay içinde yapılmalıdır; geriye dönük prim işler.', 10),
  ('NL', 'Gemeente kayıt (BRP) randevusu',      'Konut',    'BSN numarası bu kayıttan çıkar; çalışmak ve banka hesabı için gereklidir.', 10),

  -- Birleşik Krallık
  ('GB', 'Certificate of Sponsorship (CoS)',    'İstihdam', 'Lisanslı işveren tarafından düzenlenir; çalışma vizesinin dayanağıdır.', 10),
  ('GB', 'IHS (sağlık ücreti) ödeme dekontu',   'Sağlık',   'Vize başvurusunda peşin ödenir ve yıllıktır; tutar aile üyesi başına artar.', 10),
  ('GB', 'Tüberküloz (TB) test sertifikası',    'Sağlık',   'Türkiye''den 6 aydan uzun süreli başvurularda yetkili klinikten alınır.', 11),
  ('GB', 'İngilizce dil belgesi (SELT/IELTS UKVI)', 'Eğitim', 'Yalnız UKVI onaylı merkezlerden alınan sınav kabul edilir.', 10),

  -- Amerika Birleşik Devletleri
  ('US', 'DS-160 onay sayfası',                 'Hukuk',    'Vize görüşmesine barkodlu onay sayfasıyla gidilir.', 10),
  ('US', 'Vize randevu ve SEVIS/ücret dekontu', 'Hukuk',    'Öğrenci ve değişim vizelerinde SEVIS ücreti ayrıca ödenir.', 11),
  ('US', 'I-20 / DS-2019 / I-797 onayı',        'İstihdam', 'Vize türüne göre okul ya da işveren tarafından düzenlenir.', 10),
  ('US', 'Aşı kaydı ve sağlık muayenesi',       'Sağlık',   'Göçmen vizelerinde panel doktoru muayenesi zorunludur.', 10),

  -- Kanada
  ('CA', 'IRCC başvuru numarası ve biyometri randevusu', 'Hukuk', 'Biyometri yetkili merkezde verilir ve 10 yıl geçerlidir.', 10),
  ('CA', 'ECA denklik raporu',                  'Eğitim',   'Express Entry puanı için gereklidir; WES gibi yetkili kuruluşlardan alınır.', 10),
  ('CA', 'IELTS / CELPIP dil sonucu',           'Eğitim',   'Puan hesabının en belirleyici kalemidir; sonuç 2 yıl geçerlidir.', 11),
  ('CA', 'Panel doktoru sağlık raporu',         'Sağlık',   'Yalnız IRCC''nin yetkilendirdiği doktorlar düzenleyebilir.', 10),
  ('CA', 'Proof of funds (maddi yeterlilik)',   'Finans',   'Aile büyüklüğüne göre belirlenen asgari tutar aranır.', 10),

  -- Fransa
  ('FR', 'VLS-TS uzun süreli vize',             'Hukuk',    'Varıştan sonra çevrimiçi doğrulanmazsa oturum geçersiz sayılır.', 10),
  ('FR', 'OFII kayıt formu',                    'Hukuk',    'Varıştan sonraki 3 ay içinde tamamlanmalıdır.', 11),
  ('FR', 'Campus France dosyası',               'Eğitim',   'Öğrenci başvurularında vize öncesi zorunlu adımdır.', 10),
  ('FR', 'Attestation d''hébergement',          'Konut',    'Kendi kira sözleşmeniz yoksa konaklatan kişinin beyanı istenir.', 10),

  -- Avusturya
  ('AT', 'Rot-Weiß-Rot Karte başvuru formu',    'İstihdam', 'Nitelikli çalışan puanlamasına göre değerlendirilir.', 10),
  ('AT', 'Meldezettel (adres kaydı)',           'Konut',    'Varıştan sonra 3 gün içinde yapılmalıdır — süre kısadır, atlanmamalı.', 10),
  ('AT', 'Almanca dil belgesi (A1)',            'Eğitim',   'Aile birleşiminde giriş öncesi aranır.', 10),
  ('AT', 'Diploma tanıma başvurusu',            'Eğitim',   'Düzenlenmiş mesleklerde (sağlık, hukuk, eğitim) zorunludur.', 11),

  -- Belçika
  ('BE', 'D tipi uzun süreli vize',             'Hukuk',    'Çalışma izni ya da kabul belgesiyle birlikte başvurulur.', 10),
  ('BE', 'Commune (belediye) kayıt randevusu',  'Konut',    'Kayıt sonrası polis adres doğrulaması için eve gelir.', 10),
  ('BE', 'Diploma denkliği (equivalence)',      'Eğitim',   'Bölgeye göre ayrı kurumlar yürütür (Flaman / Valon / Brüksel).', 10),
  ('BE', 'Mutualité (sağlık kasası) kaydı',     'Sağlık',   'Sağlık giderlerinin geri ödemesi bu kayda bağlıdır.', 10),

  -- İsviçre
  ('CH', 'Aufenthaltsbewilligung B başvurusu',  'Hukuk',    'Kanton makamı yürütür; kurallar kantona göre değişir.', 10),
  ('CH', 'İşveren kota / izin onayı',           'İstihdam', 'AB/EFTA dışı vatandaşlar için yıllık kota uygulanır.', 10),
  ('CH', 'Gemeinde adres kaydı',                'Konut',    'Varıştan sonra 14 gün içinde yapılmalıdır.', 10),
  ('CH', 'Zorunlu sağlık sigortası (KVG) poliçesi', 'Sağlık', 'Varıştan sonra 3 ay içinde yaptırılmalı; primler maaştan kesilmez, ayrıca ödenir.', 10),

  -- İsveç
  ('SE', 'Migrationsverket oturum kararı',      'Hukuk',    'Karar çıkmadan çalışmaya başlanamaz.', 10),
  ('SE', 'Personnummer başvurusu (Skatteverket)', 'Kimlik',  'Bankadan sağlığa neredeyse her hizmet bu numaraya bağlıdır.', 10),
  ('SE', 'UHR diploma değerlendirmesi',         'Eğitim',   'İsveç''te diploma tanınmasının karşılığıdır.', 10),

  -- Birleşik Arap Emirlikleri
  ('AE', 'İşveren sponsorluk mektubu ve giriş izni', 'İstihdam', 'Oturum işveren sponsorluğuna bağlıdır; iş değişikliği izni etkiler.', 10),
  ('AE', 'Medical fitness testi sonucu',        'Sağlık',   'Oturum için zorunludur ve ülke içinde yetkili merkezde yapılır.', 10),
  ('AE', 'Emirates ID başvurusu',               'Kimlik',   'Günlük hayatta pasaport yerine kullanılan kimliktir.', 10),
  ('AE', 'Belge tasdiki (Dışişleri + konsolosluk)', 'Hukuk', 'Diploma ve evlilik belgeleri apostil DEĞİL, tasdik zinciri ister.', 10),

  -- Katar
  ('QA', 'İşveren iş vizesi ve giriş izni',     'İstihdam', 'Oturum işveren sponsorluğuna bağlıdır.', 10),
  ('QA', 'Medical commission sağlık testi',     'Sağlık',   'Oturum için zorunludur ve ülke içinde yapılır.', 10),
  ('QA', 'QID (Qatar ID) başvurusu',            'Kimlik',   'Banka, sağlık ve kira işlemlerinin tamamı bu kimliğe bağlıdır.', 10),
  ('QA', 'Belge tasdiki (Dışişleri + konsolosluk)', 'Hukuk', 'Diploma ve evlilik belgeleri apostil DEĞİL, tasdik zinciri ister.', 10)

on conflict (country_code, doc_name) do update set
  category   = excluded.category,
  note       = excluded.note,
  sort_order = excluded.sort_order,
  is_active  = true,
  updated_at = now();

commit;

-- ===========================================================================
-- 4) DOĞRULAMA — "girdim" demeden önce satırı gör
-- ===========================================================================

select country_code,
       count(*) filter (where household_size = 1) as h1,
       count(*) filter (where household_size = 2) as h2,
       count(*) filter (where household_size = 4) as h4,
       count(distinct currency)                   as para_birimi_sayisi
from public.relocation_living_costs
where is_active
group by country_code
order by country_code;

select country_code, count(*) as belge, count(distinct category) as kategori
from public.relocation_required_documents
where is_active
group by country_code
order by country_code;

-- Karışık para birimi = panelde toplam HİÇ görünmez. Bu sorgu boş dönmelidir.
select country_code, array_agg(distinct currency) as para_birimleri
from public.relocation_living_costs
where is_active
group by country_code
having count(distinct currency) > 1;
