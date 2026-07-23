-- Relocation Tools — #1 Ülke Seçimi (country_match).
-- Sözleşme: docs/10tool/01-ulke-secimi-e2e.md. result_kind = ranked_list.
-- relocation_country_metrics seed tablosu + araç/soru seed + relocation_score_country_match_v1.
--
-- AYNA SÖZLEŞMESİ: ağırlıklar (budget 0.20 / career 0.20 / visa 0.15 / language 0.15 /
-- qol 0.15 / community 0.10 / climate 0.05) + deal-breaker cap (0.40) + boyut türetme
-- hem bu RPC'de hem src/lib/relocation-tools-country.ts'te birebir
-- (relocation-tools-country.test.ts kilitler).

-- ---------------------------------------------------------------------------
-- 1) relocation_country_metrics referans tablosu (public read; yazma seed/worker)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_country_metrics (
  country_code text primary key,                    -- ISO 3166-1 alpha-2
  country_name_tr text not null,
  cost_index numeric(6,3),                           -- 0..1 (düşük = ucuz)
  employment_index numeric(6,3),                     -- 0..1 (yüksek = güçlü iş piyasası)
  visa_complexity numeric(6,3),                      -- 0..1 (yüksek = zor)
  english_workability numeric(6,3),                  -- 0..1 (İngilizce ile yaşanabilirlik)
  healthcare_index numeric(6,3),                     -- 0..1
  safety_index numeric(6,3),                         -- 0..1
  inclusion_index numeric(6,3),                      -- 0..1
  community_density numeric(6,3),                    -- 0..1 (Türk/diaspora yoğunluğu)
  climate_tags text[] not null default '{}',         -- mild/cold/warm/mediterranean/coastal
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  freshness_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.relocation_country_metrics enable row level security;

drop policy if exists relocation_country_metrics_read on public.relocation_country_metrics;
create policy relocation_country_metrics_read on public.relocation_country_metrics
  for select to authenticated using (is_active);

-- Seed: küratörlü ~12 ülke (kaba normalize değerler — MVP; ingestion sonra günceller).
insert into public.relocation_country_metrics
  (country_code, country_name_tr, cost_index, employment_index, visa_complexity,
   english_workability, healthcare_index, safety_index, inclusion_index, community_density, climate_tags)
values
  ('DE', 'Almanya',        0.55, 0.85, 0.50, 0.65, 0.85, 0.82, 0.78, 0.80, array['cold','mild']),
  ('NL', 'Hollanda',       0.60, 0.80, 0.45, 0.90, 0.88, 0.85, 0.88, 0.55, array['mild','coastal']),
  ('SE', 'İsveç',          0.62, 0.75, 0.50, 0.88, 0.90, 0.88, 0.90, 0.40, array['cold']),
  ('CA', 'Kanada',         0.55, 0.80, 0.40, 0.92, 0.84, 0.85, 0.86, 0.45, array['cold','mild']),
  ('GB', 'Birleşik Krallık', 0.62, 0.78, 0.55, 0.95, 0.80, 0.78, 0.80, 0.70, array['mild','coastal']),
  ('US', 'Amerika',        0.58, 0.85, 0.65, 0.95, 0.72, 0.70, 0.74, 0.65, array['warm','cold','mild']),
  ('AU', 'Avustralya',     0.58, 0.78, 0.45, 0.92, 0.85, 0.84, 0.82, 0.40, array['warm','coastal']),
  ('AT', 'Avusturya',      0.55, 0.72, 0.50, 0.55, 0.86, 0.86, 0.78, 0.45, array['cold','mild']),
  ('ES', 'İspanya',        0.40, 0.55, 0.50, 0.45, 0.82, 0.80, 0.82, 0.35, array['mediterranean','warm','coastal']),
  ('PT', 'Portekiz',       0.38, 0.55, 0.45, 0.55, 0.80, 0.85, 0.84, 0.30, array['mediterranean','mild','coastal']),
  ('PL', 'Polonya',        0.30, 0.62, 0.50, 0.50, 0.72, 0.78, 0.60, 0.35, array['cold','mild']),
  ('AE', 'Birleşik Arap Emirlikleri', 0.50, 0.70, 0.40, 0.70, 0.74, 0.80, 0.45, 0.55, array['warm'])
on conflict (country_code) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Araç seed (weights jsonb dolu)
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'country_match',
  'ulke-secimi',
  'Hangi Ülke Sana Uygun? — Ülke Seçimi Aracı',
  'Country Match',
  'Bütçe, kariyer, dil, vize, yaşam tarzı ve topluluk önceliklerine göre taşınabileceğin ülkeleri sıralar.',
  'relocation_assessment',
  7, 18, 'ranked_list', true, true, 20,
  jsonb_build_object(
    'budget_fit', 0.20,
    'career_market_fit', 0.20,
    'visa_path_fit', 0.15,
    'language_fit', 0.15,
    'quality_of_life_fit', 0.15,
    'community_fit', 0.10,
    'climate_fit', 0.05
  )
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  quick_question_count = excluded.quick_question_count,
  detailed_question_count = excluded.detailed_question_count,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order,
  weights = excluded.weights, updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Soru seed (idempotent)
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'country_match';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (7)
  ('country_match', 'motivation', 'both', 'plan', 'Tek taşınma motivasyonun ne?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','career','label','Kariyer'),
     jsonb_build_object('value','education','label','Eğitim'),
     jsonb_build_object('value','family','label','Aile'),
     jsonb_build_object('value','safety','label','Güvenlik'),
     jsonb_build_object('value','lifestyle','label','Yaşam tarzı'),
     jsonb_build_object('value','community','label','Topluluk'),
     jsonb_build_object('value','remote_work','label','Uzaktan çalışma')
   ), true, 1),
  ('country_match', 'monthly_budget', 'both', 'budget', 'Aylık yaşam bütçen nedir?', 'Yaklaşık (EUR)', 'currency', '[]'::jsonb, true, 2),
  ('country_match', 'profession_field', 'both', 'career', 'Mesleğin veya ana uzmanlık alanın?', null, 'profession', '[]'::jsonb, true, 3),
  ('country_match', 'work_mode', 'both', 'career', 'Yurt dışında çalışma planın nasıl?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','local_job','label','Yerel iş'),
     jsonb_build_object('value','remote','label','Uzaktan'),
     jsonb_build_object('value','study_then_work','label','Önce eğitim, sonra iş'),
     jsonb_build_object('value','entrepreneur','label','Girişimci'),
     jsonb_build_object('value','undecided','label','Kararsız')
   ), true, 4),
  ('country_match', 'visa_assets', 'both', 'visa', 'Vize/oturum açısından güçlü varlıkların var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','eu_passport','label','AB pasaportu'),
     jsonb_build_object('value','ancestry','label','Ata bağı/vatandaşlık hakkı'),
     jsonb_build_object('value','student_admission','label','Öğrenci kabulü'),
     jsonb_build_object('value','job_offer','label','İş teklifi'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 5),
  ('country_match', 'community_importance', 'both', 'community', 'Türk/diaspora topluluğu senin için ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, true, 6),
  ('country_match', 'deal_breakers', 'both', 'plan', 'Kesin istemediğin koşullar?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','high_cost','label','Yüksek maliyet'),
     jsonb_build_object('value','no_english','label','İngilizce yetmiyor'),
     jsonb_build_object('value','weak_healthcare','label','Zayıf sağlık'),
     jsonb_build_object('value','low_safety','label','Düşük güvenlik'),
     jsonb_build_object('value','no_community','label','Topluluk yok'),
     jsonb_build_object('value','hard_visa','label','Zor vize')
   ), false, 7),
  -- DETAILED (+11)
  ('country_match', 'target_region', 'detailed', 'plan', 'Hangi bölgelere açıksın?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','eu_eea','label','AB/AEA'),
     jsonb_build_object('value','uk','label','Birleşik Krallık'),
     jsonb_build_object('value','north_america','label','Kuzey Amerika'),
     jsonb_build_object('value','gulf','label','Körfez'),
     jsonb_build_object('value','apac','label','Asya-Pasifik'),
     jsonb_build_object('value','any','label','Fark etmez')
   ), false, 8),
  ('country_match', 'setup_budget', 'detailed', 'budget', 'İlk kurulum için ayırabileceğin maksimum bütçe?', 'Depozito, uçuş, evrak (EUR)', 'currency', '[]'::jsonb, false, 9),
  ('country_match', 'language_profile', 'detailed', 'language', 'İngilizce dışında bir dil biliyor musun / öğrenmeye açık mısın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','english_only','label','Sadece İngilizce'),
     jsonb_build_object('value','open','label','Yeni dil öğrenmeye açığım'),
     jsonb_build_object('value','multilingual','label','Birden fazla dil biliyorum')
   ), false, 10),
  ('country_match', 'bureaucracy_tolerance', 'detailed', 'visa', 'Bürokrasi ve bekleme süresine toleransın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 11),
  ('country_match', 'family_needs', 'detailed', 'family', 'Aile, çocuk, okul veya evcil hayvan ihtiyaçların var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','children','label','Çocuk'),
     jsonb_build_object('value','school','label','Okul'),
     jsonb_build_object('value','spouse_job','label','Eş işi'),
     jsonb_build_object('value','pets','label','Evcil hayvan'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 12),
  ('country_match', 'healthcare_priority', 'detailed', 'qol', 'Sağlık sistemine erişim önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 13),
  ('country_match', 'safety_priority', 'detailed', 'qol', 'Güvenlik ve siyasi istikrar önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('country_match', 'inclusion_priority', 'detailed', 'qol', 'Kapsayıcılık / haklar / sosyal özgürlükler ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 15),
  ('country_match', 'climate_preference', 'detailed', 'lifestyle', 'İklim tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','mild','label','Ilıman'),
     jsonb_build_object('value','cold','label','Soğuk'),
     jsonb_build_object('value','warm','label','Sıcak'),
     jsonb_build_object('value','mediterranean','label','Akdeniz'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), false, 16),
  ('country_match', 'move_window', 'detailed', 'plan', 'Ne zaman taşınmak istiyorsun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','0-3m','label','0-3 ay'),
     jsonb_build_object('value','3-6m','label','3-6 ay'),
     jsonb_build_object('value','6-12m','label','6-12 ay'),
     jsonb_build_object('value','later','label','Daha sonra')
   ), false, 17),
  ('country_match', 'risk_tolerance', 'detailed', 'plan', 'Belirsizlik ve yeniden başlama riskine toleransın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 18);

-- ---------------------------------------------------------------------------
-- 4) relocation_score_country_match_v1 — ülkeleri 7 boyutta skorlar, deal-breaker cap, top 5.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_country_match_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_weights jsonb;
  v_bands jsonb := jsonb_build_array(
    jsonb_build_object('key','excellent','min',80),
    jsonb_build_object('key','strong','min',65),
    jsonb_build_object('key','moderate','min',50),
    jsonb_build_object('key','risky','min',0));
  -- Kullanıcı tercihleri
  v_community_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_importance')::numeric, 3) - 1) / 4));
  v_health_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_priority')::numeric, 3) - 1) / 4));
  v_safety_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'safety_priority')::numeric, 3) - 1) / 4));
  v_inclusion_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'inclusion_priority')::numeric, 3) - 1) / 4));
  v_has_budget boolean := (v_ans ->> 'monthly_budget') is not null and (v_ans ->> 'monthly_budget') <> '';
  v_english_only boolean := (v_ans ->> 'language_profile') = 'english_only';
  v_climate text := v_ans ->> 'climate_preference';
  -- Vize varlığı (boost): none dışı bir seçim varsa.
  v_visa_assets text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'visa_assets', '[]'::jsonb))), '{}'::text[]);
  v_has_visa_asset boolean := exists (select 1 from unnest(v_visa_assets) a where a <> 'none');
  -- Deal-breaker'lar
  v_dealbreakers text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'deal_breakers', '[]'::jsonb))), '{}'::text[]);
  v_ranked jsonb;
  v_top jsonb;
  v_top_score numeric;
begin
  select weights into v_weights from public.relocation_tools where key = 'country_match';

  with scored as (
    select
      m.country_code, m.country_name_tr,
      -- Ham boyutlar (0..1)
      jsonb_build_object(
        'budget_fit', case when not v_has_budget then 0.5
          else public.rl_tool_clamp_neutral(1 - coalesce(m.cost_index, 0.5)) end,
        'career_market_fit', public.rl_tool_clamp_neutral(m.employment_index),
        'visa_path_fit', public.rl_tool_clamp_neutral(
          (1 - coalesce(m.visa_complexity, 0.5)) * (case when v_has_visa_asset then 1.0 else 0.85 end)),
        'language_fit', case when v_english_only
          then public.rl_tool_clamp_neutral(m.english_workability)
          else public.rl_tool_clamp_neutral(0.5 + 0.5 * coalesce(m.english_workability, 0.5)) end,
        'quality_of_life_fit', public.rl_tool_clamp_neutral(
          coalesce(m.healthcare_index, 0.5) * (0.3 + 0.4 * v_health_pref)
          + coalesce(m.safety_index, 0.5) * (0.3 + 0.4 * v_safety_pref) * 0.5
          + coalesce(m.inclusion_index, 0.5) * (0.2 + 0.4 * v_inclusion_pref) * 0.5),
        'community_fit', public.rl_tool_clamp_neutral(
          coalesce(m.community_density, 0.5) * (0.4 + 0.6 * v_community_pref)),
        'climate_fit', case
          when v_climate is null or v_climate = 'no_preference' then 0.6
          when m.climate_tags @> array[v_climate] then 1.0
          else 0.3 end
      ) as raw_breakdown
    from public.relocation_country_metrics m
    where m.is_active
  ),
  capped as (
    -- Deal-breaker cap: seçilen alanda ilgili boyut max 0.40.
    select
      country_code, country_name_tr,
      jsonb_build_object(
        'budget_fit', case when 'high_cost' = any(v_dealbreakers)
          then least((raw_breakdown ->> 'budget_fit')::numeric, 0.40) else (raw_breakdown ->> 'budget_fit')::numeric end,
        'career_market_fit', (raw_breakdown ->> 'career_market_fit')::numeric,
        'visa_path_fit', case when 'hard_visa' = any(v_dealbreakers)
          then least((raw_breakdown ->> 'visa_path_fit')::numeric, 0.40) else (raw_breakdown ->> 'visa_path_fit')::numeric end,
        'language_fit', case when 'no_english' = any(v_dealbreakers)
          then least((raw_breakdown ->> 'language_fit')::numeric, 0.40) else (raw_breakdown ->> 'language_fit')::numeric end,
        'quality_of_life_fit', case when ('weak_healthcare' = any(v_dealbreakers) or 'low_safety' = any(v_dealbreakers))
          then least((raw_breakdown ->> 'quality_of_life_fit')::numeric, 0.40) else (raw_breakdown ->> 'quality_of_life_fit')::numeric end,
        'community_fit', case when 'no_community' = any(v_dealbreakers)
          then least((raw_breakdown ->> 'community_fit')::numeric, 0.40) else (raw_breakdown ->> 'community_fit')::numeric end,
        'climate_fit', (raw_breakdown ->> 'climate_fit')::numeric
      ) as breakdown
    from scored
  ),
  ranked as (
    select country_code, country_name_tr, breakdown,
      round(public.rl_tool_weighted_score(breakdown, v_weights) * 100, 2) as score
    from capped
  ),
  numbered as (
    select *, row_number() over (order by score desc, country_name_tr) as rn from ranked
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'key', country_code, 'title', country_name_tr, 'score', score,
        'bucket', public.rl_tool_resolve_bucket(score, v_bands),
        'sub_scores', breakdown,
        'detail', country_name_tr || ' — ' || score::text || '/100'
      ) order by score desc, country_name_tr
    ) filter (where rn <= 5), '[]'::jsonb),
    (jsonb_agg(breakdown order by score desc, country_name_tr) filter (where rn = 1)) -> 0,
    max(score) filter (where rn = 1)
  into v_ranked, v_top, v_top_score
  from numbered;

  return public.rl_tool_write_result(
    p_session_id,
    'ranked_list',
    v_top_score,
    public.rl_tool_resolve_bucket(coalesce(v_top_score, 0), v_bands),
    jsonb_build_object('ranked_countries', v_ranked),
    coalesce(v_top, '{}'::jsonb),
    v_ranked,
    jsonb_build_array(
      'Tercihlerine en uygun ülkeler sıralandı.',
      case when array_length(v_dealbreakers, 1) is not null
        then 'Kırmızı çizgi seçtiğin alanlar ilgili ülkelerde puanı sınırladı.'
        else 'Skorlar mevcut ülke verisine dayanır; garanti içermez.' end
    ),
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Şehir Eşleştirmeyi Başlat','href','/relocation/tools/sehir-eslestirme'),
      jsonb_build_object('key','view_directory','label','Bu Ülkedeki Üyeleri Gör'),
      jsonb_build_object('key','start_related_tool','label','İlk 90 Gün Planlayıcı','href','/relocation/tools/ilk-90-gun-planlayici')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_country_match_v1(uuid) to authenticated;
