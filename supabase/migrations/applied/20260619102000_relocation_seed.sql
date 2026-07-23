-- Relocation Engine — seed (Faz 1a).
-- Gerçek dataset gelmeden Faz 1 fixture/seed ile çalışır (dataset-acceptance-contract.md).
-- Kaynaklar: source-registry.md Tier-1. Şehir örnekleri: Berlin (DE), Amsterdam (NL).
-- Tüm upsert'ler idempotent (on conflict).

-- ---------------------------------------------------------------------------
-- Tier-1 kaynaklar (source-registry.md'den özet alt küme)
-- ---------------------------------------------------------------------------
insert into public.relocation_source_registry (source_key, provider_name, authority_level, category, refresh_sla_hours)
values
  ('eu_your_europe',        'Your Europe',            'official',      'bureaucracy', 168),
  ('de_make_it_in_germany', 'Make it in Germany',     'official',      'bureaucracy', 168),
  ('de_berlin_service',     'Berlin Service Portal',  'official_city', 'bureaucracy', 168),
  ('nl_government',         'government.nl / BRP',     'official',      'bureaucracy', 168),
  ('de_bnetza',             'BNetzA',                 'regulator',     'gsm',         720),
  ('de_kbv_116117',         'KBV / 116117',           'official',      'doctor',      168),
  ('tr_konsolosluk',        'T.C. Konsolosluk',       'official',      'consulate',   168),
  ('tr_ytb',                'YTB',                    'official',      'community',   336)
on conflict (source_key) do update
  set provider_name = excluded.provider_name,
      authority_level = excluded.authority_level,
      category = excluded.category,
      refresh_sla_hours = excluded.refresh_sla_hours,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- Lokasyon metrikleri (örnek; ingestion worker Faz 2'de günceller)
-- ---------------------------------------------------------------------------
insert into public.relocation_locations
  (country_code, city_code, city_name, cost_index, safety_index, housing_availability,
   healthcare_access, gsm_coverage, community_density, flight_access, bureaucracy_complexity,
   language_availability, freshness_at)
values
  ('DE', 'BERLIN',    'Berlin',    0.620, 0.720, 0.480, 0.850, 0.900, 0.910, 0.880, 0.650,
   array['de','en','tr'], now()),
  ('NL', 'AMSTERDAM', 'Amsterdam', 0.700, 0.800, 0.350, 0.820, 0.880, 0.600, 0.840, 0.600,
   array['nl','en','tr'], now())
on conflict (country_code, city_code) do update
  set cost_index = excluded.cost_index,
      safety_index = excluded.safety_index,
      housing_availability = excluded.housing_availability,
      healthcare_access = excluded.healthcare_access,
      gsm_coverage = excluded.gsm_coverage,
      community_density = excluded.community_density,
      flight_access = excluded.flight_access,
      bureaucracy_complexity = excluded.bureaucracy_complexity,
      language_availability = excluded.language_availability,
      freshness_at = excluded.freshness_at,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- Bürokratik adımlar (Berlin ikamet kaydı / Amsterdam gemeente kaydı)
-- Idempotent: aynı (country, city, name) için tek satır.
-- ---------------------------------------------------------------------------
with src as (select id, source_key from public.relocation_source_registry)
insert into public.relocation_bureaucratic_steps
  (country_code, city_code, name, description, trigger, deadline_rule, sort_order,
   required_documents, output_artifacts, official_url_label, source_id)
select v.country_code, v.city_code, v.name, v.description, v.trigger, v.deadline_rule, v.sort_order,
       v.required_documents, v.output_artifacts, v.official_url_label, src.id
from (values
  ('DE', 'BERLIN', 'Adres kaydı (Anmeldung)',
   'Almanya''ya yerleşince ikamet adresini Bürgeramt''ta kaydettir. Vergi numarası ve banka hesabı için ön koşuldur.',
   'after_arrival', 'within_14_days', 10,
   array['passport', 'wohnungsgeberbestaetigung'],
   array['registration_certificate'],
   'Berlin Service Portal — Anmeldung', 'de_berlin_service'),
  ('NL', 'AMSTERDAM', 'Belediye kaydı (Inschrijving gemeente)',
   'Amsterdam belediyesine kayıt; BSN (vatandaşlık servis numarası) üretiminin kapısıdır.',
   'after_arrival', 'within_5_days', 10,
   array['passport', 'rental_contract', 'birth_certificate'],
   array['bsn'],
   'government.nl — BRP registration', 'nl_government')
) as v(country_code, city_code, name, description, trigger, deadline_rule, sort_order,
       required_documents, output_artifacts, official_url_label, source_key)
join src on src.source_key = v.source_key
where not exists (
  select 1 from public.relocation_bureaucratic_steps b
  where b.country_code = v.country_code and coalesce(b.city_code,'') = v.city_code and b.name = v.name
);

-- ---------------------------------------------------------------------------
-- Acil iletişim
-- ---------------------------------------------------------------------------
insert into public.relocation_emergency_contacts (country_code, city_code, type, label, phone)
select v.country_code, v.city_code, v.type, v.label, v.phone
from (values
  ('DE', null, 'emergency', 'Acil (ambulans/itfaiye)', '112'),
  ('DE', null, 'police',    'Polis',                   '110'),
  ('NL', null, 'emergency', 'Acil (genel)',            '112'),
  ('TR', null, 'consulate', 'T.C. Konsolosluk hattı',  null)
) as v(country_code, city_code, type, label, phone)
where not exists (
  select 1 from public.relocation_emergency_contacts e
  where e.country_code = v.country_code
    and coalesce(e.city_code,'') = coalesce(v.city_code,'')
    and e.type = v.type and e.label = v.label
);
