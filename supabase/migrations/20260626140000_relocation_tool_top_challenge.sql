-- Relocation Tools — #9 Öncelikli Taşınma Sorunu (top_relocation_challenge).
-- Sözleşme: docs/10tool/09-oncelikli-tasinma-sorunu-e2e.md. result_kind = score (8 kategori sıralı).
-- Araç/soru seed + relocation_score_top_challenge_v1 RPC.
--
-- AYNA SÖZLEŞMESİ: kategori formülü + sinyal eşlemesi hem bu RPC'de hem
-- src/lib/relocation-tools-challenge.ts'te birebir (relocation-tools-challenge.test.ts kilitler).
-- category_score = user_stress*0.35 + progress_blocker*0.35 + urgency*0.20 + dependency*0.10  (docs §4)

-- ---------------------------------------------------------------------------
-- 1) Araç seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'top_relocation_challenge',
  'oncelikli-tasinma-sorunu',
  'Hangi Soruna Önce Odaklanmalısın? — Öncelikli Engel Aracı',
  'Your Top Relocation Challenge',
  'En çok seni zorlayan taşınma engelini bul ve bu hafta atılacak ilk adımları gör.',
  'relocation_assessment',
  5, 9, 'score', true, true, 90,
  '{}'::jsonb
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  quick_question_count = excluded.quick_question_count,
  detailed_question_count = excluded.detailed_question_count,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order, updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) Soru seed (idempotent)
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'top_relocation_challenge';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  ('top_relocation_challenge', 'stressors', 'both', 'challenge',
   'Şu an en çok ne zorlayıcı geliyor?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','visa','label','Vize/oturum'),
     jsonb_build_object('value','job','label','İş/gelir'),
     jsonb_build_object('value','language','label','Dil'),
     jsonb_build_object('value','housing','label','Konut'),
     jsonb_build_object('value','money','label','Finans/bütçe'),
     jsonb_build_object('value','paperwork','label','Evrak/bürokrasi'),
     jsonb_build_object('value','loneliness','label','Yalnızlık/topluluk'),
     jsonb_build_object('value','school','label','Diploma/okul denkliği'),
     jsonb_build_object('value','healthcare','label','Sağlık')
   ), true, 1),
  ('top_relocation_challenge', 'urgency', 'both', 'challenge',
   'Taşınma ne kadar yakın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','0-1m','label','0-1 ay'),
     jsonb_build_object('value','1-3m','label','1-3 ay'),
     jsonb_build_object('value','3-6m','label','3-6 ay'),
     jsonb_build_object('value','6m+','label','6 aydan uzak')
   ), true, 2),
  ('top_relocation_challenge', 'blocked_progress', 'both', 'challenge',
   'Hangi alan ilerlemeyi gerçekten durduruyor?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','visa','label','Vize/oturum'),
     jsonb_build_object('value','job','label','İş/gelir'),
     jsonb_build_object('value','language','label','Dil'),
     jsonb_build_object('value','housing','label','Konut'),
     jsonb_build_object('value','money','label','Finans/bütçe'),
     jsonb_build_object('value','paperwork','label','Evrak/bürokrasi'),
     jsonb_build_object('value','loneliness','label','Yalnızlık/topluluk'),
     jsonb_build_object('value','school','label','Diploma/okul denkliği'),
     jsonb_build_object('value','healthcare','label','Sağlık')
   ), true, 3),
  ('top_relocation_challenge', 'confidence', 'both', 'challenge',
   'Genel güven seviyen?', '1 = düşük (yüksek risk), 5 = yüksek', 'scale', '[]'::jsonb, true, 4),
  ('top_relocation_challenge', 'help_needed', 'both', 'challenge',
   'Dış destek almak istediğin alanlar?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','mentor','label','Mentor'),
     jsonb_build_object('value','legal','label','Hukuki/vize danışmanı'),
     jsonb_build_object('value','recruiter','label','İşe alım/kariyer'),
     jsonb_build_object('value','housing','label','Konut'),
     jsonb_build_object('value','language','label','Dil')
   ), false, 5),
  -- DETAYLI mod ek soruları
  ('top_relocation_challenge', 'documents_state', 'detailed', 'challenge',
   'Evrak/vize tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','clear','label','Net/hazır'),
     jsonb_build_object('value','partial','label','Kısmen hazır'),
     jsonb_build_object('value','confused','label','Kafam karışık')
   ), false, 6),
  ('top_relocation_challenge', 'income_state', 'detailed', 'challenge',
   'Gelir/iş tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','secured','label','Garanti/işim var'),
     jsonb_build_object('value','searching','label','Arıyorum'),
     jsonb_build_object('value','not_started','label','Henüz başlamadım')
   ), false, 7),
  ('top_relocation_challenge', 'support_state', 'detailed', 'challenge',
   'Destek ağı durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü'),
     jsonb_build_object('value','weak','label','Zayıf'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 8),
  ('top_relocation_challenge', 'health_family_complexity', 'detailed', 'challenge',
   'Sağlık/aile/okul gibi ek karmaşıklık var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','children','label','Çocuk'),
     jsonb_build_object('value','chronic_access_need','label','Süreklilik gerektiren sağlık erişimi'),
     jsonb_build_object('value','pets','label','Evcil hayvan'),
     jsonb_build_object('value','elder_support','label','Yaşlı bakımı'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 9);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_top_challenge_v1
--    8 kategori skorunu hesaplar, en yükseği primary challenge, ilk 3 öneri.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_top_challenge_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_urgency text := v_ans ->> 'urgency';
  v_urgency_mult numeric;
  v_conf numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'confidence')::numeric, 3) - 1) / 4));
  v_risk numeric;                      -- 1 - güven (düşük güven = yüksek risk)
  v_docs text := v_ans ->> 'documents_state';
  v_income text := v_ans ->> 'income_state';
  v_support text := v_ans ->> 'support_state';
  v_scores jsonb := '{}'::jsonb;
  v_top_key text;
  v_top_val numeric;
  v_labels jsonb;
  v_recs jsonb;
  v_ctas jsonb;
begin
  v_urgency_mult := case v_urgency
    when '0-1m' then 1.0 when '1-3m' then 0.75 when '3-6m' then 0.5 when '6m+' then 0.25
    else 0.5 end;
  v_risk := 1 - v_conf;

  -- Kategori sinyalleri: stressors/blocked_progress multi üyeliği (1.0 / 0.0).
  -- stress_key → kategori eşlemesi: visa,paperwork→visa_docs · job→job_income · language→language
  -- housing→housing · money→finance · loneliness→community_support · school→credential_recognition
  -- healthcare→healthcare_family
  with cat as (
    select * from (values
      ('visa_docs',  array['visa','paperwork']),
      ('job_income', array['job']),
      ('language',   array['language']),
      ('housing',    array['housing']),
      ('finance',    array['money']),
      ('community_support', array['loneliness']),
      ('credential_recognition', array['school']),
      ('healthcare_family', array['healthcare'])
    ) as t(cat_key, stress_keys)
  ),
  stress as (
    select array(select jsonb_array_elements_text(coalesce(v_ans -> 'stressors', '[]'::jsonb))) as keys
  ),
  blocked as (
    select array(select jsonb_array_elements_text(coalesce(v_ans -> 'blocked_progress', '[]'::jsonb))) as keys
  ),
  scored as (
    select
      c.cat_key,
      -- user_stress: stressors içinde bu kategoriye ait herhangi bir anahtar var mı (1/0)
      (case when exists (select 1 from unnest(c.stress_keys) sk where sk = any ((select keys from stress)))
            then 1.0 else 0.0 end) as user_stress,
      (case when exists (select 1 from unnest(c.stress_keys) sk where sk = any ((select keys from blocked)))
            then 1.0 else 0.0 end) as progress_blocker,
      -- dependency_factor: kategoriye özel ek sinyaller (0..1)
      (case c.cat_key
        when 'visa_docs' then case v_docs when 'confused' then 1.0 when 'partial' then 0.5 else 0.0 end
        when 'job_income' then case v_income when 'not_started' then 1.0 when 'searching' then 0.6 else 0.0 end
        when 'community_support' then case v_support when 'none' then 1.0 when 'weak' then 0.5 else 0.0 end
        when 'healthcare_family' then
          case when jsonb_array_length(coalesce(v_ans -> 'health_family_complexity', '[]'::jsonb)) > 0
                    and not (coalesce(v_ans -> 'health_family_complexity', '[]'::jsonb) ? 'none')
               then 1.0 else 0.0 end
        else 0.0 end) as dependency_factor
    from cat c
  ),
  final as (
    select
      cat_key,
      round(
        user_stress * 0.35 + progress_blocker * 0.35
        + (v_urgency_mult * v_risk) * 0.20 + dependency_factor * 0.10,
        4
      ) as score
    from scored
  )
  select
    jsonb_object_agg(cat_key, score),
    (array_agg(cat_key order by score desc, cat_key))[1],
    (array_agg(score order by score desc, cat_key))[1]
  into v_scores, v_top_key, v_top_val
  from final;

  v_labels := jsonb_build_object(
    'visa_docs', 'Vize & Evrak',
    'job_income', 'İş & Gelir',
    'language', 'Dil',
    'housing', 'Konut',
    'finance', 'Finans',
    'community_support', 'Topluluk & Destek',
    'credential_recognition', 'Diploma Denkliği',
    'healthcare_family', 'Sağlık & Aile'
  );

  -- İlk 3 kategori öneri olarak.
  select coalesce(jsonb_agg(
    jsonb_build_object('key', cat_key, 'title', v_labels ->> cat_key, 'score', score)
    order by score desc, cat_key
  ) filter (where rn <= 3), '[]'::jsonb)
  into v_recs
  from (
    select key as cat_key, value::numeric as score,
           row_number() over (order by value::numeric desc, key) as rn
    from jsonb_each_text(v_scores)
  ) r;

  -- CTA haritası (docs §5): kategori → ilgili araç.
  v_ctas := case v_top_key
    when 'job_income' then jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','İş Bulma Olasılığını Hesapla','href','/relocation/tools/yurtdisi-is-bulma-olasiligi'),
      jsonb_build_object('key','start_related_tool','label','Maaş Karşılaştırmasını Aç','href','/relocation/tools/meslek-maas-karsilastirma'))
    when 'visa_docs' then jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Hazırlık Skorunu Çalıştır','href','/relocation/tools/tasinma-hazirlik-skoru'),
      jsonb_build_object('key','start_related_tool','label','İlk 90 Gün Planı','href','/relocation/tools/ilk-90-gun-planlayici'))
    when 'language' then jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Kariyer Yolu Aracı','href','/relocation/tools/yurtdisi-kariyer-yolu'))
    when 'housing' then jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Şehir Eşleştirme','href','/relocation/tools/sehir-eslestirme'))
    when 'community_support' then jsonb_build_array(
      jsonb_build_object('key','find_mentor','label','Diaspora Eşleştirmeyi Dene','href','/relocation/tools/diaspora-ag-eslestirme'))
    else jsonb_build_array(
      jsonb_build_object('key','view_relocation_plan','label','Taşınma Planın'))
  end;
  -- Ortak mentor CTA her zaman eklenir.
  v_ctas := v_ctas || jsonb_build_array(jsonb_build_object('key','find_mentor','label','Mentor Bul'));

  return public.rl_tool_write_result(
    p_session_id,
    'score',
    round(v_top_val * 100, 2),         -- total_score = primary challenge yoğunluğu (0..100)
    v_top_key,                         -- score_bucket = primary kategori anahtarı
    jsonb_build_object(
      'primary_challenge', v_top_key,
      'primary_label', v_labels ->> v_top_key,
      'top3', v_recs
    ),
    v_scores,                          -- sub_scores = tüm kategori skorları
    v_recs,
    jsonb_build_array(
      'Öncelikli engelin: ' || (v_labels ->> v_top_key) || '.',
      'Bu alan netleşmeden diğer kararlar da riskli hale gelebilir; bu hafta buradan başla.'
    ),
    v_ctas,
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_top_challenge_v1(uuid) to authenticated;
