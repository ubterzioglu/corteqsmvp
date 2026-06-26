-- Relocation Tools — #7 Expat Yaşam Tarzı Persona (expat_lifestyle_persona).
-- Sözleşme: docs/10tool/07-expat-yasam-tarzi-persona-e2e.md. result_kind = persona.
-- Araç/soru seed + relocation_score_expat_lifestyle_persona_v1 RPC.
--
-- AYNA SÖZLEŞMESİ: persona ağırlık matrisi (PERSONA_SIGNALS) hem bu RPC'de hem
-- src/lib/relocation-tools-ranking.ts'te birebir (relocation-tools-ranking.test.ts kilitler).
-- Persona skorlama: her cevap 0..1 normalize edilir (scale → (v-1)/4; single → option score),
-- persona puanı = Σ coef * normalize. En yüksek persona kazanır; ±0.001 içinde eşitlik → hibrit.

-- ---------------------------------------------------------------------------
-- 1) Araç seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'expat_lifestyle_persona',
  'expat-yasam-tarzi-persona',
  'Sizin Yurt Dışı Yaşam Tarzınız? — Expat Persona Quiz',
  'Your Expat Lifestyle Persona',
  'Birkaç hafif soruyla yurt dışı yaşam tarzı personanı keşfet ve sana uygun CorteQS adımlarını gör.',
  'relocation_assessment',
  8, 10, 'persona', true, true, 70,
  '{}'::jsonb  -- persona araçta boyut-ağırlık yok; persona sinyal matrisi RPC'de.
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  quick_question_count = excluded.quick_question_count,
  detailed_question_count = excluded.detailed_question_count,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order, updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) Soru seed (idempotent: önce sil, sonra ekle)
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'expat_lifestyle_persona';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  ('expat_lifestyle_persona', 'weekend_style', 'both', 'lifestyle',
   'Yeni bir şehirde ilk hafta sonu ne yaparsın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','network_event','label','Bir networking etkinliğine giderim'),
     jsonb_build_object('value','museum_walk','label','Müze/şehir turu yaparım'),
     jsonb_build_object('value','hiking','label','Doğaya/yürüyüşe çıkarım'),
     jsonb_build_object('value','family_market','label','Aileyle pazar/market gezerim'),
     jsonb_build_object('value','quiet_cafe','label','Sakin bir kafede vakit geçiririm')
   ), true, 1),
  ('expat_lifestyle_persona', 'social_energy', 'both', 'lifestyle',
   'Yeni insanlarla tanışmak sana nasıl gelir?', '1 = zorlayıcı, 5 = enerji verici', 'scale',
   '[]'::jsonb, true, 2),
  ('expat_lifestyle_persona', 'planning_style', 'both', 'lifestyle',
   'Planlı mısın spontane mi?', '1 = planlı, 5 = spontane', 'scale', '[]'::jsonb, true, 3),
  ('expat_lifestyle_persona', 'local_language', 'both', 'lifestyle',
   'Yerel dili yanlış yaparak konuşmayı dener misin?', '1 = denemem, 5 = hep denerim', 'scale',
   '[]'::jsonb, true, 4),
  ('expat_lifestyle_persona', 'community_need', 'both', 'lifestyle',
   'Kendi kültüründen insanlarla bağ kurma ihtiyacın?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, true, 5),
  ('expat_lifestyle_persona', 'comfort_zone', 'both', 'lifestyle',
   'Konfor alanından çıkma isteğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, true, 6),
  ('expat_lifestyle_persona', 'career_focus', 'both', 'lifestyle',
   'Taşınmada kariyer/network odağın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, true, 7),
  ('expat_lifestyle_persona', 'family_rhythm', 'both', 'lifestyle',
   'Aile ve rutin odaklı yaşam sana ne kadar uygun?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, true, 8),
  -- DETAYLI mod ek soruları
  ('expat_lifestyle_persona', 'city_vs_nature', 'detailed', 'lifestyle',
   'Büyük şehir mi doğa/sakinlik mi?', '1 = doğa, 5 = şehir', 'scale', '[]'::jsonb, false, 9),
  ('expat_lifestyle_persona', 'sharing', 'detailed', 'lifestyle',
   'Sonucunu toplulukla paylaşmak ister misin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 10);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_expat_lifestyle_persona_v1
--    Persona puanlarını cevaplardan deterministic hesaplar, en yükseği yazar.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_expat_lifestyle_persona_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  -- scale cevabı 1..5 → 0..1 normalize; eksikse nötr 0.5.
  v_social numeric   := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'social_energy')::numeric, 3) - 1) / 4));
  v_plan numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'planning_style')::numeric, 3) - 1) / 4));
  v_lang numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'local_language')::numeric, 3) - 1) / 4));
  v_comm numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_need')::numeric, 3) - 1) / 4));
  v_comfort numeric  := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'comfort_zone')::numeric, 3) - 1) / 4));
  v_career numeric   := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'career_focus')::numeric, 3) - 1) / 4));
  v_family numeric   := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'family_rhythm')::numeric, 3) - 1) / 4));
  v_city numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'city_vs_nature')::numeric, 3) - 1) / 4));
  -- weekend_style single → persona başına küçük katkı (0..1).
  v_weekend text := v_ans ->> 'weekend_style';
  -- Persona puanları
  v_global numeric;
  v_quiet numeric;
  v_adventure numeric;
  v_family_p numeric;
  v_career_p numeric;
  v_community numeric;
  v_scores jsonb;
  v_top_key text;
  v_top_val numeric;
  v_second_key text;
  v_second_val numeric;
  v_is_hybrid boolean;
  v_persona_label text;
  v_explanation text;
begin
  -- Persona = Σ coef * normalize (coef'ler relocation-tools-ranking.ts PERSONA_SIGNALS aynası).
  v_global := v_social * 0.4 + v_career * 0.3 + v_city * 0.3
              + case when v_weekend = 'network_event' then 0.15 else 0 end;
  v_quiet := (1 - v_social) * 0.35 + (1 - v_city) * 0.3 + (1 - v_plan) * 0.2 + (1 - v_comfort) * 0.15
              + case when v_weekend = 'quiet_cafe' then 0.15 else 0 end;
  v_adventure := v_plan * 0.35 + v_comfort * 0.35 + (1 - v_city) * 0.15 + v_lang * 0.15
              + case when v_weekend = 'hiking' then 0.15 else 0 end;
  v_family_p := v_family * 0.45 + (1 - v_comfort) * 0.2 + (1 - v_plan) * 0.2 + (1 - v_social) * 0.15
              + case when v_weekend = 'family_market' then 0.15 else 0 end;
  v_career_p := v_career * 0.45 + v_city * 0.3 + v_social * 0.25
              + case when v_weekend = 'network_event' then 0.15 else 0 end;
  v_community := v_comm * 0.5 + v_lang * 0.25 + v_social * 0.25
              + case when v_weekend = 'family_market' then 0.10 else 0 end;

  v_scores := jsonb_build_object(
    'global_networker', round(v_global, 4),
    'quiet_local', round(v_quiet, 4),
    'adventure_seeker', round(v_adventure, 4),
    'family_planner', round(v_family_p, 4),
    'career_builder', round(v_career_p, 4),
    'community_anchor', round(v_community, 4)
  );

  -- En yüksek + ikinci (hibrit kontrolü).
  select key, value::numeric into v_top_key, v_top_val
  from jsonb_each_text(v_scores) order by value::numeric desc limit 1;
  select key, value::numeric into v_second_key, v_second_val
  from jsonb_each_text(v_scores) order by value::numeric desc offset 1 limit 1;

  v_is_hybrid := (v_top_val - v_second_val) <= 0.001;

  v_persona_label := case v_top_key
    when 'global_networker' then 'Global Networker'
    when 'quiet_local' then 'Sakin Yerleşik'
    when 'adventure_seeker' then 'Maceracı Kaşif'
    when 'family_planner' then 'Aile Planlayıcısı'
    when 'career_builder' then 'Kariyer İnşacısı'
    when 'community_anchor' then 'Topluluk Çapası'
    else v_top_key end;

  v_explanation := case v_top_key
    when 'global_networker' then 'Yeni şehirlerde hızlı bağlantı kurar, etkinlik ve profesyonel ağlardan enerji alırsın.'
    when 'quiet_local' then 'Sakin bir tempoda, yerel hayata yavaş ve derin uyum sağlamayı seversin.'
    when 'adventure_seeker' then 'Spontane, konfor alanı dışına çıkmaya hevesli ve keşfe açıksın.'
    when 'family_planner' then 'Aile, güvenlik ve planlı bir rutin senin için önceliklidir.'
    when 'career_builder' then 'Kariyer ve yoğun şehir hayatı taşınma kararının merkezinde.'
    when 'community_anchor' then 'Kendi kültürünle bağ kurmak ve topluluğa katkı senin için değerli.'
    else 'Yaşam tarzı personan hesaplandı.' end;

  return public.rl_tool_write_result(
    p_session_id,
    'persona',
    null,                          -- persona araçta numeric total yok
    v_top_key,                     -- score_bucket = persona anahtarı
    jsonb_build_object(
      'persona_key', v_top_key,
      'persona_label', v_persona_label,
      'is_hybrid', v_is_hybrid,
      'secondary_key', case when v_is_hybrid then v_second_key else null end
    ),
    v_scores,                      -- sub_scores = tüm persona puanları
    '[]'::jsonb,
    jsonb_build_array(
      'Persona''n: ' || v_persona_label ||
        case when v_is_hybrid then ' (hibrit)' else '' end || '.',
      v_explanation
    ),
    jsonb_build_array(
      jsonb_build_object('key','open_cadde','label','Cadde''ye Git'),
      jsonb_build_object('key','find_mentor','label','Benzer Personadaki Üyeleri Gör'),
      jsonb_build_object('key','complete_profile','label','Profil Badge''i Olarak Kaydet')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_expat_lifestyle_persona_v1(uuid) to authenticated;
