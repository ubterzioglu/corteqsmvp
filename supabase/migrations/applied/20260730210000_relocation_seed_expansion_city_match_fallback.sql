-- ============================================================
-- Purpose:                Araçlar veri tabanını gerçek kullanıma yetecek genişliğe çıkar:
--                         30 yeni meslek + 30 yeni şehir + city_match'e ülke-girdisi
--                         normalizasyonu ve boş-sonuç fallback'i.
-- Module:                 RELOCATION TOOLS (revizyon panosu B18+B19+B23/SQL —
--                         docs/plans/2026-07-30-revizyon-istekleri-pano-mutabakati.md §2A)
-- Risk level:             medium (bir skorlama fonksiyonu yeniden tanımlanır; seed'ler
--                         WHERE NOT EXISTS ile idempotent, mevcut satırlara dokunulmaz)
--
-- Kök nedenler (canlı ölçüm 2026-07-30):
--   * relocation_professions = 5 satır → "Meslek seçeneği az" maddesi literal doğru.
--     Soru seçenekleri (relocation_tool_questions.options) tablodan bağımsız kopyaydı —
--     artık tablodan türetiliyor (tek kaynak).
--   * relocation_locations = 2 satır (1×DE, 1×NL) → "UK'de şehir bulunamadı"nın kök nedeni.
--   * ÜSTELİK ülke girişi serbest metin (QuestionRenderer MVP fallback): kullanıcı "UK"
--     yazıyor, tablo ISO "GB" tutuyor → seed tek başına yetmezdi. city_match artık yaygın
--     yazımları ISO'ya çeviriyor (UK→GB, USA/ABD→US, ALMANYA→DE, İNGİLTERE→GB…).
--   * Hedef ülkede hiç şehir yoksa sonuç boş dönüyordu → şimdi tüm aktif şehirlere düşer,
--     payload'a fallback_no_target_match=true koyar ve açıklama metni durumu söyler
--     (B23'ün SQL yarısı; UI etiketi ToolResultView'da).
--
-- Veri notu: şehir endeksleri (maliyet/güvenlik/konut/sağlık/GSM/topluluk/uçuş/bürokrasi,
--   0-1 aralığı) küratörlü İLK tahminlerdir — mevcut Berlin/Amsterdam satırlarıyla aynı
--   yöntem. Kaynak bağlanınca source_id + freshness_at üzerinden rafine edilecek.
--
-- Rollback:               delete from relocation_locations where city_code in (aşağıdaki liste);
--                         delete from relocation_professions where profession_key in (liste);
--                         önceki fonksiyon gövdesi scratchpad/fn_city_match.sql'de.
-- Estimated lock impact:  low.
-- ============================================================

BEGIN;

-- ── 1) B18: Meslek seed (30 yeni; profession_key üzerinden idempotent) ────────
INSERT INTO public.relocation_professions (esco_code, profession_key, label_tr, label_en, normalized_family, is_regulated_default, is_active)
SELECT v.esco, v.pkey, v.tr, v.en, v.fam, v.reg, true
FROM (VALUES
  ('2211.1','doctor_general','Doktor (Pratisyen)','General Practitioner','healthcare',true),
  ('2261.1','dentist','Diş Hekimi','Dentist','healthcare',true),
  ('2262.1','pharmacist','Eczacı','Pharmacist','healthcare',true),
  ('2264.1','physiotherapist','Fizyoterapist','Physiotherapist','healthcare',true),
  ('2634.1','psychologist','Psikolog','Psychologist','healthcare',true),
  ('2151.1','electrical_engineer','Elektrik Mühendisi','Electrical Engineer','engineering',true),
  ('2144.1','mechanical_engineer','Makine Mühendisi','Mechanical Engineer','engineering',true),
  ('2141.1','industrial_engineer','Endüstri Mühendisi','Industrial Engineer','engineering',false),
  ('2161.1','architect','Mimar','Architect','engineering',true),
  ('2511.4','data_scientist','Veri Bilimci','Data Scientist','tech',false),
  ('2522.2','devops_engineer','DevOps Mühendisi','DevOps Engineer','tech',false),
  ('2513.2','ux_designer','UX/UI Tasarımcı','UX/UI Designer','tech',false),
  ('2529.1','cyber_security_specialist','Siber Güvenlik Uzmanı','Cybersecurity Specialist','tech',false),
  ('2166.1','graphic_designer','Grafik Tasarımcı','Graphic Designer','creative',false),
  ('2431.1','marketing_specialist','Pazarlama Uzmanı','Marketing Specialist','business',false),
  ('1221.1','sales_manager','Satış Yöneticisi','Sales Manager','business',false),
  ('2423.1','hr_specialist','İnsan Kaynakları Uzmanı','HR Specialist','business',false),
  ('1219.2','project_manager','Proje Yöneticisi','Project Manager','business',false),
  ('2421.1','business_analyst','İş Analisti','Business Analyst','business',false),
  ('2413.1','financial_analyst','Finansal Analist','Financial Analyst','finance',false),
  ('2611.1','lawyer','Avukat','Lawyer','legal',true),
  ('2310.1','academic_researcher','Akademisyen / Araştırmacı','Academic Researcher','education',false),
  ('2643.1','translator','Çevirmen','Translator','services',false),
  ('3434.1','chef','Aşçı / Şef','Chef','services',false),
  ('5141.1','hairdresser','Kuaför','Hairdresser','services',false),
  ('7411.1','electrician','Elektrikçi','Electrician','trades',true),
  ('7126.1','plumber','Tesisatçı','Plumber','trades',true),
  ('7212.1','welder','Kaynakçı','Welder','trades',false),
  ('8332.1','truck_driver','Tır / Kamyon Şoförü','Truck Driver','logistics',true),
  ('3331.1','logistics_specialist','Lojistik Uzmanı','Logistics Specialist','logistics',false)
) AS v(esco, pkey, tr, en, fam, reg)
WHERE NOT EXISTS (
  SELECT 1 FROM public.relocation_professions p WHERE p.profession_key = v.pkey
);

-- Soru seçenekleri artık tablodan türetilir (tek kaynak; "seçenek listesi tabloyla
-- senkron tutulmalı" sınıfı bir ikinci-kopya sorunu bir daha yaşanmasın).
UPDATE public.relocation_tool_questions q
SET options = (
      SELECT jsonb_agg(jsonb_build_object('label', p.label_tr, 'value', p.profession_key)
                       ORDER BY lower(p.label_tr))
      FROM public.relocation_professions p
      WHERE p.is_active
    ),
    updated_at = now()
WHERE q.question_key = 'profession_title';

-- ── 2) B19: Şehir seed (30 yeni; country_code+city_code üzerinden idempotent) ─
INSERT INTO public.relocation_locations
  (country_code, city_code, city_name, cost_index, safety_index, housing_availability,
   healthcare_access, gsm_coverage, community_density, flight_access, bureaucracy_complexity,
   language_availability, freshness_at, is_active)
SELECT v.cc, v.code, v.name, v.cost, v.safety, v.housing, v.health, v.gsm, v.community,
       v.flight, v.bureau, v.langs, now(), true
FROM (VALUES
  ('GB','LONDON','Londra',0.85,0.70,0.30,0.80,0.90,0.85,0.95,0.45,'{en,tr}'::text[]),
  ('GB','MANCHESTER','Manchester',0.60,0.65,0.55,0.78,0.88,0.55,0.80,0.45,'{en,tr}'::text[]),
  ('GB','BIRMINGHAM','Birmingham',0.55,0.60,0.60,0.76,0.88,0.60,0.75,0.45,'{en,tr}'::text[]),
  ('GB','EDINBURGH','Edinburgh',0.65,0.80,0.45,0.80,0.85,0.30,0.70,0.45,'{en}'::text[]),
  ('US','NEW_YORK','New York',0.90,0.60,0.30,0.70,0.90,0.75,0.95,0.55,'{en,tr}'::text[]),
  ('US','LOS_ANGELES','Los Angeles',0.85,0.55,0.35,0.68,0.88,0.55,0.90,0.55,'{en}'::text[]),
  ('US','CHICAGO','Chicago',0.70,0.50,0.55,0.70,0.88,0.50,0.85,0.55,'{en,tr}'::text[]),
  ('US','MIAMI','Miami',0.75,0.55,0.45,0.68,0.85,0.45,0.85,0.55,'{en,es}'::text[]),
  ('US','SAN_FRANCISCO','San Francisco',0.95,0.60,0.25,0.72,0.90,0.40,0.85,0.55,'{en}'::text[]),
  ('US','HOUSTON','Houston',0.60,0.50,0.65,0.68,0.85,0.45,0.80,0.55,'{en,es}'::text[]),
  ('DE','MUNICH','Münih',0.80,0.85,0.30,0.88,0.90,0.75,0.85,0.65,'{de,en,tr}'::text[]),
  ('DE','FRANKFURT','Frankfurt',0.75,0.70,0.40,0.86,0.90,0.80,0.95,0.65,'{de,en,tr}'::text[]),
  ('DE','HAMBURG','Hamburg',0.70,0.75,0.40,0.86,0.88,0.75,0.80,0.65,'{de,en,tr}'::text[]),
  ('DE','COLOGNE','Köln',0.65,0.72,0.45,0.85,0.88,0.90,0.75,0.65,'{de,en,tr}'::text[]),
  ('DE','DUSSELDORF','Düsseldorf',0.70,0.75,0.45,0.85,0.88,0.85,0.80,0.65,'{de,en,tr}'::text[]),
  ('DE','STUTTGART','Stuttgart',0.72,0.80,0.35,0.86,0.88,0.85,0.70,0.65,'{de,en,tr}'::text[]),
  ('NL','ROTTERDAM','Rotterdam',0.65,0.75,0.40,0.82,0.88,0.80,0.75,0.60,'{nl,en,tr}'::text[]),
  ('NL','THE_HAGUE','Lahey',0.68,0.78,0.38,0.82,0.88,0.70,0.70,0.60,'{nl,en,tr}'::text[]),
  ('NL','EINDHOVEN','Eindhoven',0.62,0.78,0.45,0.80,0.88,0.55,0.65,0.60,'{nl,en}'::text[]),
  ('CA','TORONTO','Toronto',0.78,0.75,0.35,0.78,0.85,0.65,0.85,0.50,'{en,tr}'::text[]),
  ('CA','VANCOUVER','Vancouver',0.82,0.78,0.30,0.78,0.85,0.40,0.80,0.50,'{en}'::text[]),
  ('CA','MONTREAL','Montreal',0.60,0.75,0.55,0.76,0.85,0.45,0.80,0.55,'{fr,en}'::text[]),
  ('AE','DUBAI','Dubai',0.75,0.85,0.55,0.80,0.92,0.80,0.95,0.35,'{ar,en,tr}'::text[]),
  ('AE','ABU_DHABI','Abu Dabi',0.70,0.88,0.60,0.80,0.92,0.55,0.85,0.35,'{ar,en}'::text[]),
  ('QA','DOHA','Doha',0.70,0.88,0.60,0.78,0.92,0.75,0.85,0.40,'{ar,en,tr}'::text[]),
  ('FR','PARIS','Paris',0.80,0.60,0.30,0.85,0.88,0.65,0.95,0.70,'{fr,en,tr}'::text[]),
  ('AT','VIENNA','Viyana',0.68,0.85,0.45,0.88,0.88,0.70,0.80,0.60,'{de,en,tr}'::text[]),
  ('CH','ZURICH','Zürih',0.95,0.90,0.30,0.90,0.92,0.55,0.85,0.50,'{de,en,tr}'::text[]),
  ('BE','BRUSSELS','Brüksel',0.65,0.65,0.45,0.84,0.86,0.70,0.85,0.65,'{fr,nl,en,tr}'::text[]),
  ('SE','STOCKHOLM','Stokholm',0.75,0.80,0.30,0.86,0.90,0.50,0.80,0.55,'{sv,en}'::text[])
) AS v(cc, code, name, cost, safety, housing, health, gsm, community, flight, bureau, langs)
WHERE NOT EXISTS (
  SELECT 1 FROM public.relocation_locations l
  WHERE l.country_code = v.cc AND l.city_code = v.code
);

-- ── 3) B19+B23/SQL: city_match — girdi normalizasyonu + boş-sonuç fallback ────
-- Gövde bu oturumda canlıdan alınan dökümün (B17 sonrası) deterministik yamasıdır.
CREATE OR REPLACE FUNCTION public.relocation_score_city_match_v1(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_weights jsonb;
  -- Ülke girişi serbest metin (MVP): yaygın yazımlar ISO alpha-2'ye çevrilir.
  -- upper() Türkçe 'i'yi 'I' yapar (İ değil) — bu yüzden aksansız yazımlar da listede.
  v_targets text[] := coalesce(
    (select array_agg(distinct
       case upper(trim(t))
         when 'UK' then 'GB' when 'ENGLAND' then 'GB' when 'BİRLEŞİK KRALLIK' then 'GB'
         when 'İNGİLTERE' then 'GB' when 'INGILTERE' then 'GB'
         when 'USA' then 'US' when 'ABD' then 'US' when 'AMERİKA' then 'US' when 'AMERIKA' then 'US'
         when 'UAE' then 'AE' when 'BAE' then 'AE' when 'DUBAI' then 'AE' when 'DUBAİ' then 'AE'
         when 'ALMANYA' then 'DE' when 'GERMANY' then 'DE' when 'DEUTSCHLAND' then 'DE'
         when 'HOLLANDA' then 'NL' when 'NETHERLANDS' then 'NL'
         when 'FRANSA' then 'FR' when 'FRANCE' then 'FR'
         when 'İSVİÇRE' then 'CH' when 'ISVICRE' then 'CH' when 'SWITZERLAND' then 'CH'
         when 'AVUSTURYA' then 'AT' when 'AUSTRIA' then 'AT'
         when 'BELÇİKA' then 'BE' when 'BELCIKA' then 'BE' when 'BELGIUM' then 'BE'
         when 'KANADA' then 'CA' when 'CANADA' then 'CA'
         when 'KATAR' then 'QA' when 'QATAR' then 'QA'
         when 'İSVEÇ' then 'SE' when 'ISVEC' then 'SE' when 'SWEDEN' then 'SE'
         when 'DANİMARKA' then 'DK' when 'DANIMARKA' then 'DK' when 'DENMARK' then 'DK'
         when 'NORVEÇ' then 'NO' when 'NORVEC' then 'NO' when 'NORWAY' then 'NO'
         when 'İSPANYA' then 'ES' when 'ISPANYA' then 'ES' when 'SPAIN' then 'ES'
         when 'İTALYA' then 'IT' when 'ITALYA' then 'IT' when 'ITALY' then 'IT'
         when 'POLONYA' then 'PL' when 'POLAND' then 'PL'
         when 'AVUSTRALYA' then 'AU' when 'AUSTRALIA' then 'AU'
         else upper(trim(t))
       end)
     from regexp_split_to_table(coalesce(v_ans ->> 'target_countries', ''), ',') t
     where trim(t) <> ''),
    '{}'::text[]
  );
  v_community_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_need')::numeric, 3) - 1) / 4));
  v_safety_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'safety_family')::numeric, 3) - 1) / 4));
  v_airport_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'airport_access')::numeric, 3) - 1) / 4));
  v_industry_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'industry_hub')::numeric, 3) - 1) / 4));
  v_health_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_priority')::numeric, 3) - 1) / 4));
  v_transport_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'public_transport_importance')::numeric, 3) - 1) / 4));
  v_green_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'green_space_preference')::numeric, 3) - 1) / 4));
  v_expat_pref text := v_ans ->> 'expat_community_size';
  v_health_urgency numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_access_urgency')::numeric, 3) - 1) / 4));
  v_ranked jsonb;
  v_top jsonb;
  v_top_score numeric;
  -- B23/SQL: hedef ülkede hiç aktif şehir yoksa tüm şehirlere düş, durumu işaretle.
  v_fallback boolean := false;
begin
  select weights into v_weights from public.relocation_tools where key = 'city_match';

  if array_length(v_targets, 1) is not null and not exists (
    select 1 from public.relocation_locations l
    where l.is_active and l.country_code = any (v_targets)
  ) then
    v_fallback := true;
    v_targets := '{}'::text[];
  end if;

  with scored as (
    select
      l.id, l.country_code, l.city_code, l.city_name, l.freshness_at,
      jsonb_build_object(
        'budget_housing_fit', round(
          (public.rl_tool_clamp_neutral(1 - coalesce(l.cost_index, 0.5)) * 0.6
           + public.rl_tool_clamp_neutral(l.housing_availability) * 0.4), 4),
        'job_hub_fit', round(
          (public.rl_tool_clamp_neutral(1 - coalesce(l.bureaucracy_complexity, 0.5)) * (0.5 + 0.5 * v_industry_pref)), 4),
        'lifestyle_fit', round(
          public.rl_tool_clamp_neutral(l.gsm_coverage) * (1 - 0.2 * v_green_pref) + 0.2 * v_green_pref, 4),
        'community_fit', round(
          (public.rl_tool_clamp_neutral(l.community_density) * (0.4 + 0.6 * v_community_pref))
          * (case when v_expat_pref = 'large' then 1.05 when v_expat_pref = 'no_preference' then 0.95 else 1.0 end), 4),
        'safety_healthcare_fit', round(
          (public.rl_tool_clamp_neutral(l.safety_index) * (0.4 + 0.6 * v_safety_pref) * 0.5
           + public.rl_tool_clamp_neutral(l.healthcare_access) * (0.4 + 0.6 * greatest(v_health_pref, v_health_urgency)) * 0.5), 4),
        'mobility_flight_fit', round(
          (public.rl_tool_clamp_neutral(l.flight_access) * (0.4 + 0.6 * v_airport_pref)) * 0.8
          + public.rl_tool_clamp_neutral(l.gsm_coverage) * v_transport_pref * 0.2, 4)
      ) as breakdown,
      (select count(*) filter (where r.authority_level in ('official','official_city','regulator'))::numeric
              / nullif(count(*), 0)
       from public.relocation_source_registry r where r.id = l.source_id) as official_ratio,
      case when l.freshness_at is null then null
           else extract(epoch from (now() - l.freshness_at)) / 3600.0 end as freshness_hours
    from public.relocation_locations l
    where l.is_active
      and (array_length(v_targets, 1) is null or l.country_code = any (v_targets))
  ),
  ranked as (
    select
      id, country_code, city_code, city_name, breakdown, official_ratio, freshness_hours,
      round(public.rl_tool_weighted_score(breakdown, v_weights) * 100, 2) as score
    from scored
  ),
  numbered as (
    select *, row_number() over (order by score desc, city_name) as rn from ranked
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'key', city_code,
        'country_code', country_code,
        'title', city_name,
        'score', score,
        'sub_scores', breakdown,
        'detail', city_name || ' · ' || country_code || ' — ' || score::text || '/100',
        'source_quality', jsonb_build_object(
          'official_sources_ratio', coalesce(official_ratio, 0),
          'freshness_hours', freshness_hours
        )
      ) order by score desc, city_name
    ) filter (where rn <= 5), '[]'::jsonb),
    (jsonb_agg(breakdown order by score desc, city_name) filter (where rn = 1)) -> 0,
    max(score) filter (where rn = 1)
  into v_ranked, v_top, v_top_score
  from numbered;

  return public.rl_tool_write_result(
    p_session_id,
    'ranked_list',
    v_top_score,
    null,
    jsonb_build_object('ranked_cities', v_ranked, 'fallback_no_target_match', v_fallback),
    coalesce(v_top, '{}'::jsonb),
    v_ranked,
    case
      when v_ranked = '[]'::jsonb
        then jsonb_build_array('Seçtiğin ülkelerde aktif şehir verisi bulunamadı. Hedef ülkeyi genişletmeyi dene.')
      when v_fallback
        then jsonb_build_array(
          'Hedef ülkende henüz aktif şehir verimiz yok — tercihlerin diğer ülkelerdeki şehirlerle eşleştirildi.',
          'Skorlar mevcut şehir verisine dayanır; veri tazeliği sonuçta gösterilir.')
      else jsonb_build_array('Tercihlerine en uygun şehirler sıralandı.', 'Skorlar mevcut şehir verisine dayanır; veri tazeliği sonuçta gösterilir.')
    end,
    jsonb_build_array(
      jsonb_build_object('key','view_directory','label','Bu Şehirdeki Üyeleri Gör'),
      jsonb_build_object('key','open_cadde','label','Cadde Şehir Akışını Aç'),
      jsonb_build_object('key','start_related_tool','label','İlk 90 Gün Planlayıcı','href','/tools/ilk-90-gun-planlayici')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$function$;

-- ── 4) Son kontroller ─────────────────────────────────────────────────────────
DO $$
declare
  v_prof int; v_loc int; v_gb int; v_opt int;
begin
  select count(*) into v_prof from public.relocation_professions where is_active;
  select count(*) into v_loc from public.relocation_locations where is_active;
  select count(*) into v_gb from public.relocation_locations where country_code = 'GB' and is_active;
  select jsonb_array_length(options) into v_opt
  from public.relocation_tool_questions where question_key = 'profession_title' limit 1;

  if v_prof < 30 then raise exception 'SON KONTROL: meslek sayisi % (>=30 beklenir)', v_prof; end if;
  if v_loc < 30 then raise exception 'SON KONTROL: sehir sayisi % (>=30 beklenir)', v_loc; end if;
  if v_gb < 3 then raise exception 'SON KONTROL: GB sehir sayisi % (>=3 beklenir)', v_gb; end if;
  if v_opt < 30 then raise exception 'SON KONTROL: meslek secenegi % (>=30 beklenir)', v_opt; end if;
  raise notice 'OK: % meslek · % sehir (GB=%) · % meslek secenegi', v_prof, v_loc, v_gb, v_opt;
end $$;

COMMIT;
