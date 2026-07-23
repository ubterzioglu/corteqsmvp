-- Relocation Tools — #3 Taşınma Hazırlık Skoru (relocation_readiness).
-- Sözleşme: docs/10tool/03-tasinma-hazirlik-skoru-e2e.md. result_kind = score (ağırlıklı 6 boyut).
-- İLK gerçek ağırlıklı-boyut aracı → ortak rl_tool_weighted_score kullanır.
--
-- AYNA SÖZLEŞMESİ: ağırlıklar (financial 0.25 / legal 0.20 / language 0.15 / housing 0.15 /
-- job_income 0.15 / support 0.10) hem assessment_tools.weights'te hem
-- src/lib/relocation-tools-readiness.ts'te birebir (relocation-tools-readiness.test.ts kilitler).
-- Boyut türetme (cevap → 0..1) da iki tarafta aynı.

-- ---------------------------------------------------------------------------
-- 1) Araç seed (weights jsonb dolu — ağırlıklı araç)
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'relocation_readiness',
  'tasinma-hazirlik-skoru',
  'Yurt Dışına Taşınmaya Hazır mısınız? — Hazırlık Skoru',
  'Relocation Readiness Score',
  'Finans, evrak, dil, iş, konaklama ve destek ağına göre taşınma hazırlığını ölç ve aksiyon listeni al.',
  'relocation_assessment',
  6, 15, 'score', true, true, 30,
  jsonb_build_object(
    'financial_readiness', 0.25,
    'legal_document_readiness', 0.20,
    'language_readiness', 0.15,
    'housing_logistics', 0.15,
    'job_income_readiness', 0.15,
    'support_adaptability', 0.10
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
-- 2) Soru seed (idempotent). single option'larında 'score' (0..1) taşınır.
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'relocation_readiness';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (6)
  ('relocation_readiness', 'target_known', 'both', 'plan',
   'Hedef ülke/şehir belli mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','city_known','label','Evet, şehir belli','score',1.0),
     jsonb_build_object('value','country_known','label','Ülke belli, şehir değil','score',0.6),
     jsonb_build_object('value','not_yet','label','Henüz net değil','score',0.2)
   ), true, 1),
  ('relocation_readiness', 'savings_months', 'both', 'finance',
   'Kaç aylık yaşam gideri birikimin var?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','6+','label','6 ay ve üzeri','score',1.0),
     jsonb_build_object('value','3-5','label','3-5 ay','score',0.7),
     jsonb_build_object('value','1-2','label','1-2 ay','score',0.35),
     jsonb_build_object('value','0','label','Yok','score',0.0)
   ), true, 2),
  ('relocation_readiness', 'passport_validity', 'both', 'legal',
   'Pasaport ve temel kimlik evrakların güncel mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet, güncel','score',1.0),
     jsonb_build_object('value','expiring','label','Yakında doluyor','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), true, 3),
  ('relocation_readiness', 'language_level', 'both', 'language',
   'Hedef ülke iş/yaşam dili seviyen?', '0 = hiç, 5 = ileri', 'scale', '[]'::jsonb, true, 4),
  ('relocation_readiness', 'housing_first_month', 'both', 'housing',
   'İlk ay konaklama planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','secured','label','Hazır/garanti','score',1.0),
     jsonb_build_object('value','leads','label','Birkaç seçenek var','score',0.5),
     jsonb_build_object('value','no','label','Yok','score',0.0)
   ), true, 5),
  ('relocation_readiness', 'job_income_plan', 'both', 'job',
   'İlk 3 ay gelir/iş planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','job_offer','label','İş teklifim var','score',1.0),
     jsonb_build_object('value','remote_income','label','Uzaktan gelirim var','score',0.85),
     jsonb_build_object('value','savings_only','label','Sadece birikim','score',0.4),
     jsonb_build_object('value','no','label','Plan yok','score',0.0)
   ), true, 6),
  -- DETAILED (+9)
  ('relocation_readiness', 'debt_pressure', 'detailed', 'finance',
   'Kısa vadede taşınmayı zorlayacak borç/ödeme baskın var mı?', '1 = yüksek baskı, 5 = baskı yok', 'scale',
   '[]'::jsonb, false, 7),
  ('relocation_readiness', 'visa_route', 'detailed', 'legal',
   'Hedef ülke için net bir vize/oturum rotan var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet, net','score',1.0),
     jsonb_build_object('value','researching','label','Araştırıyorum','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 8),
  ('relocation_readiness', 'diploma_docs', 'detailed', 'legal',
   'Diploma, transkript, referans ve iş belgelerin hazır mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazır','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 9),
  ('relocation_readiness', 'health_insurance', 'detailed', 'support',
   'Sağlık sigortası / erişim planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet','score',1.0),
     jsonb_build_object('value','researching','label','Araştırıyorum','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 10),
  ('relocation_readiness', 'support_network', 'detailed', 'support',
   'Hedef yerde tanıdık/topluluk desteğin var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü','score',1.0),
     jsonb_build_object('value','weak','label','Zayıf','score',0.5),
     jsonb_build_object('value','none','label','Yok','score',0.0)
   ), false, 11),
  ('relocation_readiness', 'family_alignment', 'detailed', 'housing',
   'Eş/çocuk/aile kararları net mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','not_applicable','label','Geçerli değil','score',1.0),
     jsonb_build_object('value','aligned','label','Net/uyumlu','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','conflict','label','Anlaşmazlık var','score',0.0)
   ), false, 12),
  ('relocation_readiness', 'emergency_plan', 'detailed', 'support',
   'Acil durumda iletişim ve dönüş planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 13),
  ('relocation_readiness', 'adaptability', 'detailed', 'support',
   'Belirsizlik ve kültürel uyuma hazır hissediyor musun?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 14),
  ('relocation_readiness', 'timeline_realism', 'detailed', 'housing',
   'Taşınma takvimin gerçekçi mi?', '1 = gerçekçi değil, 5 = çok gerçekçi', 'scale',
   '[]'::jsonb, false, 15);

-- ---------------------------------------------------------------------------
-- Ortak yardımcı: total_score (0..100) → bucket anahtarı. bands = [{key,min},...]
-- azalan min'e göre; score >= min olan ilk bucket. (#1/#2/#10 da kullanacak.)
-- src/lib/relocation-tools-ranking.ts resolveBucket aynası.
-- ---------------------------------------------------------------------------
create or replace function public.rl_tool_resolve_bucket(p_score numeric, p_bands jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select b ->> 'key'
  from jsonb_array_elements(coalesce(p_bands, '[]'::jsonb)) as b
  where p_score >= (b ->> 'min')::numeric
  order by (b ->> 'min')::numeric desc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Yardımcı: bir single sorunun seçilen option 'score' değerini getirir (0..1).
-- Eksik cevap → nötr 0.5.
-- ---------------------------------------------------------------------------
create or replace function public.rl_readiness_opt_score(p_tool_key text, p_question_key text, p_value text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select (opt ->> 'score')::numeric
    from public.relocation_tool_questions q,
         jsonb_array_elements(q.options) opt
    where q.tool_key = p_tool_key and q.question_key = p_question_key
      and opt ->> 'value' = p_value
    limit 1
  ), 0.5);
$$;

-- ---------------------------------------------------------------------------
-- 3) relocation_score_readiness_v1 — 6 boyut → ağırlıklı skor + zayıf 3 + aksiyon.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_readiness_v1(p_session_id uuid)
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
    jsonb_build_object('key','ready','min',80),
    jsonb_build_object('key','proceed','min',60),
    jsonb_build_object('key','prepare','min',40),
    jsonb_build_object('key','high_risk','min',0)
  );
  -- single option skorları (eksik → 0.5)
  s_savings numeric := public.rl_readiness_opt_score('relocation_readiness','savings_months', v_ans ->> 'savings_months');
  s_passport numeric := public.rl_readiness_opt_score('relocation_readiness','passport_validity', v_ans ->> 'passport_validity');
  s_visa numeric := public.rl_readiness_opt_score('relocation_readiness','visa_route', v_ans ->> 'visa_route');
  s_diploma numeric := public.rl_readiness_opt_score('relocation_readiness','diploma_docs', v_ans ->> 'diploma_docs');
  s_housing numeric := public.rl_readiness_opt_score('relocation_readiness','housing_first_month', v_ans ->> 'housing_first_month');
  s_job numeric := public.rl_readiness_opt_score('relocation_readiness','job_income_plan', v_ans ->> 'job_income_plan');
  s_health numeric := public.rl_readiness_opt_score('relocation_readiness','health_insurance', v_ans ->> 'health_insurance');
  s_support numeric := public.rl_readiness_opt_score('relocation_readiness','support_network', v_ans ->> 'support_network');
  s_family numeric := public.rl_readiness_opt_score('relocation_readiness','family_alignment', v_ans ->> 'family_alignment');
  s_emergency numeric := public.rl_readiness_opt_score('relocation_readiness','emergency_plan', v_ans ->> 'emergency_plan');
  -- scale skorları (1..5 → 0..1; debt 1=yüksek baskı → düşük skor; lang 0..5 → /5)
  s_debt numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'debt_pressure')::numeric, 3) - 1) / 4));
  s_lang numeric := public.rl_tool_clamp_neutral((coalesce((v_ans ->> 'language_level')::numeric, 2.5) / 5));
  s_adapt numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'adaptability')::numeric, 3) - 1) / 4));
  s_timeline numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'timeline_realism')::numeric, 3) - 1) / 4));
  v_breakdown jsonb;
  v_score01 numeric;
  v_score100 numeric;
  v_bucket text;
  v_labels jsonb;
  v_weak jsonb;
begin
  select weights into v_weights from public.relocation_tools where key = 'relocation_readiness';

  -- Boyut türetme (ortalama; relocation-tools-readiness.ts ile birebir).
  v_breakdown := jsonb_build_object(
    'financial_readiness', round((s_savings * 0.6 + s_debt * 0.4), 4),
    'legal_document_readiness', round((s_passport * 0.35 + s_visa * 0.35 + s_diploma * 0.30), 4),
    'language_readiness', round(s_lang, 4),
    'housing_logistics', round((s_housing * 0.5 + s_timeline * 0.3 + s_family * 0.2), 4),
    'job_income_readiness', round(s_job, 4),
    'support_adaptability', round((s_support * 0.35 + s_emergency * 0.2 + s_health * 0.2 + s_adapt * 0.25), 4)
  );

  v_score01 := public.rl_tool_weighted_score(v_breakdown, v_weights);
  v_score100 := round(v_score01 * 100, 2);
  v_bucket := public.rl_tool_resolve_bucket(v_score100, v_bands);

  v_labels := jsonb_build_object(
    'financial_readiness', 'Finansal Hazırlık',
    'legal_document_readiness', 'Evrak & Yasal',
    'language_readiness', 'Dil',
    'housing_logistics', 'Konaklama & Lojistik',
    'job_income_readiness', 'İş & Gelir',
    'support_adaptability', 'Destek & Uyum'
  );

  -- En zayıf 3 boyut → aksiyon önerileri.
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'key', dim, 'title', v_labels ->> dim, 'score', val,
      'detail', 'Bu alanı bu hafta güçlendir: ' || (v_labels ->> dim) || '.'
    ) order by val asc
  ) filter (where rn <= 3), '[]'::jsonb)
  into v_weak
  from (
    select key as dim, value::numeric as val,
           row_number() over (order by value::numeric asc, key) as rn
    from jsonb_each_text(v_breakdown)
  ) r;

  return public.rl_tool_write_result(
    p_session_id,
    'score',
    v_score100,
    v_bucket,
    jsonb_build_object('weakest3', v_weak, 'score', v_score100),
    v_breakdown,
    v_weak,
    jsonb_build_array(
      'Hazırlık skorun: ' || v_score100::text || '/100.',
      'En zayıf alanlarınla bu hafta başla; her negatif cevap bir aksiyon adımı.'
    ),
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','İlk 90 Gün Planlayıcı''ya Geç','href','/relocation/tools/ilk-90-gun-planlayici'),
      jsonb_build_object('key','start_related_tool','label','Ülke Seçimi Aracına Dön','href','/relocation/tools/ulke-secimi'),
      jsonb_build_object('key','find_mentor','label','Mentor/Topluluk Desteği Bul')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.rl_tool_resolve_bucket(numeric, jsonb) to authenticated;
grant execute on function public.rl_readiness_opt_score(text, text, text) to authenticated;
grant execute on function public.relocation_score_readiness_v1(uuid) to authenticated;
