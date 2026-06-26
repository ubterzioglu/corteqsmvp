-- Relocation Tools — #4 Şehir Eşleştirme (city_match).
-- Sözleşme: docs/10tool/04-sehir-eslestirme-e2e.md. result_kind = ranked_list.
-- Mevcut relocation_locations satırlarını skorlar (seed YOK — gerçek veri bootstrap).
--
-- AYNA SÖZLEŞMESİ: ağırlıklar (budget_housing 0.25 / job_hub 0.20 / lifestyle 0.15 /
-- community 0.15 / safety_healthcare 0.15 / mobility_flight 0.10) hem relocation_tools.weights'te
-- hem src/lib/relocation-tools-city.ts'te birebir (relocation-tools-city.test.ts kilitler).

-- ---------------------------------------------------------------------------
-- 1) Araç seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'city_match',
  'sehir-eslestirme',
  'Hangi Şehir Sana Daha Uygun? — Şehir Eşleştirme Aracı',
  'City Match',
  'Hedef ülkelerdeki şehirleri bütçe, iş, yaşam tarzı, topluluk ve ulaşım tercihlerine göre sıralar.',
  'relocation_assessment',
  7, 16, 'ranked_list', true, true, 40,
  jsonb_build_object(
    'budget_housing_fit', 0.25,
    'job_hub_fit', 0.20,
    'lifestyle_fit', 0.15,
    'community_fit', 0.15,
    'safety_healthcare_fit', 0.15,
    'mobility_flight_fit', 0.10
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
-- 2) Soru seed (idempotent)
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'city_match';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (7)
  ('city_match', 'target_countries', 'both', 'plan',
   'Hangi ülke(ler)de şehir arıyorsun?', 'ISO ülke kodu (ör. DE), virgülle ayırabilirsin', 'country',
   '[]'::jsonb, true, 1),
  ('city_match', 'city_size', 'both', 'lifestyle',
   'Şehir ölçeği tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','metropolis','label','Metropol'),
     jsonb_build_object('value','large_city','label','Büyük şehir'),
     jsonb_build_object('value','mid_size','label','Orta ölçek'),
     jsonb_build_object('value','small_city','label','Küçük şehir'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), true, 2),
  ('city_match', 'rent_budget', 'both', 'budget',
   'Aylık kira/konut bütçen?', 'Yaklaşık (EUR)', 'currency', '[]'::jsonb, true, 3),
  ('city_match', 'industry_hub', 'both', 'job',
   'Meslek alanın için güçlü bir sektör ekosistemi ister misin?', '1 = önemsiz, 5 = çok önemli', 'scale',
   '[]'::jsonb, true, 4),
  ('city_match', 'community_need', 'both', 'community',
   'Türk/diaspora topluluğu şehir seçiminde ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, true, 5),
  ('city_match', 'safety_family', 'both', 'safety',
   'Güvenlik, okul ve aile dostu ortam önceliğin?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, true, 6),
  ('city_match', 'airport_access', 'both', 'mobility',
   'Türkiye''ye uçuş erişimi önemli mi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, true, 7),
  -- DETAILED (+9)
  ('city_match', 'commute_tolerance', 'detailed', 'mobility',
   'Günlük ulaşım toleransın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','15m','label','15 dk'),
     jsonb_build_object('value','30m','label','30 dk'),
     jsonb_build_object('value','60m','label','60 dk'),
     jsonb_build_object('value','flexible','label','Esnek')
   ), false, 8),
  ('city_match', 'nightlife_culture', 'detailed', 'lifestyle',
   'Kültür, etkinlik, gece hayatı önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 9),
  ('city_match', 'quiet_preference', 'detailed', 'lifestyle',
   'Sessiz/sakin yaşam senin için önemli mi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 10),
  ('city_match', 'climate', 'detailed', 'lifestyle',
   'Şehir iklimi tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','mild','label','Ilıman'),
     jsonb_build_object('value','cold','label','Soğuk'),
     jsonb_build_object('value','warm','label','Sıcak'),
     jsonb_build_object('value','coastal','label','Kıyı'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), false, 11),
  ('city_match', 'language_comfort', 'detailed', 'lifestyle',
   'Yerel dili bilmeden şehirde başlama konforu ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 12),
  ('city_match', 'housing_priority', 'detailed', 'budget',
   'Konut bulunabilirliği maliyetten daha önemli mi?', '1 = maliyet, 5 = bulunabilirlik', 'scale',
   '[]'::jsonb, false, 13),
  ('city_match', 'healthcare_priority', 'detailed', 'safety',
   'Sağlık erişimi önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('city_match', 'deal_breakers', 'detailed', 'plan',
   'Şehir için kırmızı çizgilerin?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','too_expensive','label','Çok pahalı'),
     jsonb_build_object('value','no_jobs','label','İş yok'),
     jsonb_build_object('value','no_community','label','Topluluk yok'),
     jsonb_build_object('value','unsafe','label','Güvensiz'),
     jsonb_build_object('value','poor_transport','label','Ulaşım kötü')
   ), false, 15),
  ('city_match', 'preferred_examples', 'detailed', 'lifestyle',
   'Sevdiğin şehir tiplerine örnek ver', 'Opsiyonel', 'text', '[]'::jsonb, false, 16);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_city_match_v1
--    relocation_locations satırlarını hedef ülke filtresiyle skorlar, top 5 döndürür.
--    boyut türetme src/lib/relocation-tools-city.ts ile birebir.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_city_match_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_weights jsonb;
  -- Hedef ülkeler: country answer string ("DE,NL") → upper text[].
  v_targets text[] := coalesce(
    (select array_agg(upper(trim(t)))
     from regexp_split_to_table(coalesce(v_ans ->> 'target_countries', ''), ',') t
     where trim(t) <> ''),
    '{}'::text[]
  );
  -- Kullanıcı tercih çarpanları (scale 1..5 → 0..1; eksik nötr 0.5).
  v_community_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_need')::numeric, 3) - 1) / 4));
  v_safety_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'safety_family')::numeric, 3) - 1) / 4));
  v_airport_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'airport_access')::numeric, 3) - 1) / 4));
  v_industry_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'industry_hub')::numeric, 3) - 1) / 4));
  v_health_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_priority')::numeric, 3) - 1) / 4));
  v_ranked jsonb;
  v_top jsonb;
  v_top_score numeric;
begin
  select weights into v_weights from public.relocation_tools where key = 'city_match';

  with scored as (
    select
      l.id, l.country_code, l.city_code, l.city_name, l.freshness_at,
      jsonb_build_object(
        -- budget_housing: ucuzluk (1-cost) + konut bulunabilirliği
        'budget_housing_fit', round(
          (public.rl_tool_clamp_neutral(1 - coalesce(l.cost_index, 0.5)) * 0.6
           + public.rl_tool_clamp_neutral(l.housing_availability) * 0.4), 4),
        -- job_hub: bürokrasi kolaylığı proxy (sektör verisi yok) × sektör önceliği
        'job_hub_fit', round(
          (public.rl_tool_clamp_neutral(1 - coalesce(l.bureaucracy_complexity, 0.5)) * (0.5 + 0.5 * v_industry_pref)), 4),
        -- lifestyle: gsm/altyapı proxy (şehir lifestyle tag'leri MVP'de yok) → nötr-ağırlıklı
        'lifestyle_fit', round(public.rl_tool_clamp_neutral(l.gsm_coverage), 4),
        -- community: topluluk yoğunluğu × topluluk önceliği
        'community_fit', round(
          (public.rl_tool_clamp_neutral(l.community_density) * (0.4 + 0.6 * v_community_pref)), 4),
        -- safety_healthcare: güvenlik + sağlık, önceliklerle ağırlıklı
        'safety_healthcare_fit', round(
          (public.rl_tool_clamp_neutral(l.safety_index) * (0.4 + 0.6 * v_safety_pref) * 0.5
           + public.rl_tool_clamp_neutral(l.healthcare_access) * (0.4 + 0.6 * v_health_pref) * 0.5), 4),
        -- mobility_flight: uçuş erişimi × uçuş önceliği
        'mobility_flight_fit', round(
          (public.rl_tool_clamp_neutral(l.flight_access) * (0.4 + 0.6 * v_airport_pref)), 4)
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
    jsonb_build_object('ranked_cities', v_ranked),
    coalesce(v_top, '{}'::jsonb),       -- sub_scores = en iyi şehrin kırılımı
    v_ranked,                           -- recommendations = sıralı şehir listesi
    case when v_ranked = '[]'::jsonb
      then jsonb_build_array('Seçtiğin ülkelerde aktif şehir verisi bulunamadı. Hedef ülkeyi genişletmeyi dene.')
      else jsonb_build_array('Tercihlerine en uygun şehirler sıralandı.', 'Skorlar mevcut şehir verisine dayanır; veri tazeliği sonuçta gösterilir.') end,
    jsonb_build_array(
      jsonb_build_object('key','view_directory','label','Bu Şehirdeki Üyeleri Gör'),
      jsonb_build_object('key','open_cadde','label','Cadde Şehir Akışını Aç'),
      jsonb_build_object('key','start_related_tool','label','İlk 90 Gün Planlayıcı','href','/relocation/tools/ilk-90-gun-planlayici')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_city_match_v1(uuid) to authenticated;
