-- Relocation motoru — DEMO İÇERİK SEED'İ (12 ülke)
--
-- Karar (22.09): motor çalışan bir demo olacak; **yalnız veri demo**, kod gerçek.
-- Bu dosya boş kalan iki tabloyu (servis, bürokrasi) demo içerikle doldurur ve acil
-- numaraları GERÇEK değerlerle tamamlar.
--
-- ===========================================================================
-- ÜÇ KURAL — OKUMADAN DEĞİŞTİRME
-- ===========================================================================
-- 1. **Demo satırlar makine tarafından ayırt edilebilir.** Hepsi
--    `relocation_source_registry`'deki `demo_seed_relocation` kaydına bağlanır
--    (`authority_level = 'user_generated'`). "Bu veri gerçek mi?" sorusu SQL ile
--    cevaplanabilir; başlıktaki `[DEMO]` öneki yalnız ikinci bir işarettir.
--
-- 2. **ACİL NUMARALAR DEMO DEĞİLDİR.** Sahte bir acil numara gerçekten aranabilir.
--    Buradaki numaralar kamuya açık, sabit resmî değerlerdir (AB genelinde 112,
--    US/CA 911, GB 999, CH 112/117/144, AE 999/998/997, QA 999) ve `official_url`
--    ile birlikte girilir. Bunlara demo kaynağı DEĞİL, gerçek kaynak bağlanır.
--
-- 3. **Fiyatlar kaba aralıktır, teklif değildir.** `price_min/price_max` demo
--    sağlayıcılar içindir; maliyet sekmesindeki `relocation_living_costs` ile
--    karıştırılmamalıdır (o ayrı bir veri kümesi ve kendi niteliğini yazıyor).
--
-- NASIL ÇALIŞTIRILIR — DOSYA olarak gönder:
--   psql "<conn>" -v ON_ERROR_STOP=1 -f docs/operations/2026-09-22-relocation-demo-seed.sql
--
-- İDEMPOTENT: tüm insert'lerde `on conflict ... do update` ya da önce demo satırların
-- silinmesi vardır. Tekrar çalıştırmak satır ÇOĞALTMAZ.

begin;

-- ---------------------------------------------------------------------------
-- 1. Kaynak kayıtları
-- ---------------------------------------------------------------------------

insert into public.relocation_source_registry
  (source_key, provider_name, authority_level, category, license_type,
   api_terms_summary, refresh_sla_hours, is_active)
values
  ('demo_seed_relocation', 'CorteQS demo verisi', 'user_generated', 'demo', 'internal',
   'Ornek icerik. Gercek saglayici ya da resmi surec bilgisi DEGILDIR.', 0, true),
  ('emergency_official_numbers', 'Resmi acil numaralar', 'official', 'emergency', 'public',
   'Ulkelerin kamuya acik resmi acil numaralari. Demo DEGILDIR.', 8760, true)
on conflict (source_key) do update
  set provider_name = excluded.provider_name,
      authority_level = excluded.authority_level,
      category = excluded.category,
      is_active = true,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. Acil numaralar — GERÇEK veri
-- ---------------------------------------------------------------------------
-- Var olan 4 satır (DE, NL, TR) korunur; eksik 10 ülke tamamlanır ve hepsine
-- gerçek kaynak bağlanır.

with src as (
  select id from public.relocation_source_registry where source_key = 'emergency_official_numbers'
),
rows(country_code, type, label, phone, url) as (
  values
    -- AB tek acil numarası 112, üye ülkelerin tamamında geçerlidir.
    ('AT', 'emergency', 'Acil (AB tek numara)', '112', 'https://european-union.europa.eu/live-work-study/emergency-number-112_en'),
    ('BE', 'emergency', 'Acil (AB tek numara)', '112', 'https://european-union.europa.eu/live-work-study/emergency-number-112_en'),
    ('FR', 'emergency', 'Acil (AB tek numara)', '112', 'https://european-union.europa.eu/live-work-study/emergency-number-112_en'),
    ('SE', 'emergency', 'Acil (AB tek numara)', '112', 'https://european-union.europa.eu/live-work-study/emergency-number-112_en'),
    -- İsviçre AB üyesi değildir ama 112 yönlendirilir; ulusal numaralar ayrıca verilir.
    ('CH', 'emergency', 'Acil (genel)', '112', 'https://www.ch.ch/en/emergency-numbers/'),
    ('CH', 'police', 'Polis', '117', 'https://www.ch.ch/en/emergency-numbers/'),
    ('CH', 'ambulance', 'Ambulans', '144', 'https://www.ch.ch/en/emergency-numbers/'),
    -- Birleşik Krallık'ta 999 ulusal numaradır; 112 de yönlendirilir.
    ('GB', 'emergency', 'Acil (ulusal)', '999', 'https://www.gov.uk/find-emergency-services'),
    ('GB', 'emergency_alt', 'Acil (AB numarası da çalışır)', '112', 'https://www.gov.uk/find-emergency-services'),
    ('US', 'emergency', 'Acil (polis/ambulans/itfaiye)', '911', 'https://www.fcc.gov/general/9-1-1-and-e9-1-1-services'),
    ('CA', 'emergency', 'Acil (polis/ambulans/itfaiye)', '911', 'https://www.canada.ca/en.html'),
    ('AE', 'police', 'Polis', '999', 'https://u.ae/en'),
    ('AE', 'ambulance', 'Ambulans', '998', 'https://u.ae/en'),
    ('AE', 'fire', 'İtfaiye', '997', 'https://u.ae/en'),
    ('QA', 'emergency', 'Acil (genel)', '999', 'https://portal.www.gov.qa/wps/portal/homepage'),
    -- Almanya ve Hollanda'da eksik kalan kalemler tamamlanıyor.
    ('NL', 'police', 'Polis (acil olmayan)', '0900-8844', 'https://www.politie.nl/'),
    ('DE', 'fire', 'İtfaiye / acil', '112', 'https://european-union.europa.eu/live-work-study/emergency-number-112_en')
)
insert into public.relocation_emergency_contacts
  (country_code, city_code, type, label, phone, url, source_id, is_active)
select r.country_code, null, r.type, r.label, r.phone, r.url, src.id, true
from rows r cross join src
where not exists (
  select 1 from public.relocation_emergency_contacts e
  where e.country_code = r.country_code and e.type = r.type
);

-- Var olan DE/NL satırlarına da gerçek kaynağı bağla (source_id NULL idi).
update public.relocation_emergency_contacts e
set source_id = (select id from public.relocation_source_registry where source_key = 'emergency_official_numbers')
where e.source_id is null and e.type in ('emergency', 'police');

-- ---------------------------------------------------------------------------
-- 3. Bürokrasi adımları — DEMO
-- ---------------------------------------------------------------------------
-- Önce bu seed'in daha önce yazdığı demo satırlar silinir (idempotent).

delete from public.relocation_bureaucratic_steps
where source_id = (select id from public.relocation_source_registry where source_key = 'demo_seed_relocation');

with src as (
  select id from public.relocation_source_registry where source_key = 'demo_seed_relocation'
),
countries(country_code) as (
  values ('AE'),('AT'),('BE'),('CA'),('CH'),('DE'),('FR'),('GB'),('NL'),('QA'),('SE'),('US')
),
steps(name, description, trigger, deadline_rule, sort_order, required_documents, output_artifacts) as (
  values
    ('[DEMO] Oturum kaydı',
     'Örnek adım: varıştan sonra yerel yönetime adres kaydı yaptırılır. Gerçek süreç ülkeye göre değişir.',
     'after_arrival', 'Varıştan sonraki ilk haftalar', 1,
     array['Pasaport','Kira sözleşmesi'], array['Adres kayıt belgesi']),
    ('[DEMO] Vergi numarası başvurusu',
     'Örnek adım: çalışmaya başlamadan önce vergi kimlik numarası alınır.',
     'after_arrival', 'Oturum kaydından sonra', 2,
     array['Adres kayıt belgesi','Pasaport'], array['Vergi numarası']),
    ('[DEMO] Sağlık sigortası',
     'Örnek adım: zorunlu ya da özel sağlık sigortası yaptırılır.',
     'after_arrival', 'İlk ay içinde', 3,
     array['Adres kayıt belgesi'], array['Sigorta poliçesi']),
    ('[DEMO] Banka hesabı açılışı',
     'Örnek adım: maaş ve kira ödemeleri için yerel banka hesabı açılır.',
     'after_arrival', 'İlk ay içinde', 4,
     array['Pasaport','Adres kayıt belgesi'], array['IBAN']),
    ('[DEMO] Vize / oturum izni hazırlığı',
     'Örnek adım: yola çıkmadan önce vize veya oturum izni evrakları toplanır.',
     'before_departure', 'Taşınmadan önce', 0,
     array['Pasaport','İş sözleşmesi'], array['Vize / oturum izni'])
)
insert into public.relocation_bureaucratic_steps
  (country_code, city_code, name, description, trigger, deadline_rule, sort_order,
   required_documents, output_artifacts, official_url_label, official_url, source_id, is_active)
select c.country_code, null, s.name, s.description, s.trigger, s.deadline_rule, s.sort_order,
       s.required_documents, s.output_artifacts, null, null, src.id, true
from countries c cross join steps s cross join src;

-- ---------------------------------------------------------------------------
-- 4. Servis sağlayıcılar — DEMO
-- ---------------------------------------------------------------------------

delete from public.relocation_services
where source_id = (select id from public.relocation_source_registry where source_key = 'demo_seed_relocation');

with src as (
  select id from public.relocation_source_registry where source_key = 'demo_seed_relocation'
),
countries(country_code, currency) as (
  values ('AE','AED'),('AT','EUR'),('BE','EUR'),('CA','CAD'),('CH','CHF'),('DE','EUR'),
         ('FR','EUR'),('GB','GBP'),('NL','EUR'),('QA','QAR'),('SE','SEK'),('US','USD')
),
cats(category, label, price_min, price_max, contract_months) as (
  values
    ('housing',       'Konut Danışmanı',        900::numeric, 1800::numeric, 12),
    ('airline',       'Uçuş Acentesi',          150::numeric,  600::numeric, null::integer),
    ('gsm_operator',  'Mobil Operatör',          15::numeric,   45::numeric, 24),
    ('doctor',        'Aile Hekimi / Klinik',    30::numeric,  120::numeric, null::integer),
    ('community_hub', 'Türk Topluluk Merkezi',    0::numeric,    0::numeric, null::integer)
),
variants(suffix, trust, coverage) as (
  values ('A', 0.72::numeric, 0.80::numeric), ('B', 0.61::numeric, 0.65::numeric)
)
insert into public.relocation_services
  (category, provider_name, location_id, country_code, city_code, district, plan_name,
   price_min, price_max, currency, contract_months, coverage_score, languages,
   website_url, appointment_url, source_id, trust_score, freshness_at, is_active)
select
  cat.category,
  format('[DEMO] %s %s — %s', cat.label, v.suffix, c.country_code),
  null, c.country_code, null, null,
  format('[DEMO] Örnek paket %s', v.suffix),
  cat.price_min, cat.price_max, c.currency, cat.contract_months,
  v.coverage, array['tr','en'],
  null, null, src.id, v.trust, now(), true
from countries c cross join cats cat cross join variants v cross join src;

commit;

-- Özet
select 'services' t, count(*) from public.relocation_services
union all select 'bureaucratic_steps', count(*) from public.relocation_bureaucratic_steps
union all select 'emergency_contacts', count(*) from public.relocation_emergency_contacts
order by 1;
