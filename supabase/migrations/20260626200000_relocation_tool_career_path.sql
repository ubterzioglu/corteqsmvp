-- Relocation Tools — #6 Yurtdışı Kariyer Yolu (career_path_abroad).
-- Sözleşme: docs/10tool/06-yurtdisi-kariyer-yolu-e2e.md. result_kind = persona (6 kariyer patikası).
-- Araç/soru seed + relocation_score_career_path_v1 RPC. (Persona deseni — #7 ile aynı sınıf.)
--
-- AYNA SÖZLEŞMESİ: patika sinyal matrisi + hibrit eşiği (fark < 0.08) hem bu RPC'de hem
-- src/lib/relocation-tools-career.ts'te birebir (relocation-tools-career.test.ts kilitler).
-- Patika skoru = Σ coef * normalize (scale 1..5 → 0..1; multi üyelik → 1/0; single eşleşme → 1/0).

-- ---------------------------------------------------------------------------
-- 1) Araç seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'career_path_abroad',
  'yurtdisi-kariyer-yolu',
  'Yurt Dışında Hangi Kariyer Sana Uygun? — Kariyer Yolu Aracı',
  'Career Path Abroad',
  'Beceri, ilgi, eğitim isteği ve risk toleransına göre yurt dışı kariyer patikalarını önerir.',
  'relocation_assessment',
  7, 15, 'persona', true, true, 60,
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
delete from public.relocation_tool_questions where tool_key = 'career_path_abroad';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (7)
  ('career_path_abroad', 'current_field', 'both', 'career', 'Şu anki alanın / bölümün / mesleğin?', 'Serbest metin', 'profession', '[]'::jsonb, true, 1),
  ('career_path_abroad', 'favorite_work', 'both', 'interest', 'En çok hangi iş tipinden enerji alırsın?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','analysis','label','Analiz'),
     jsonb_build_object('value','building','label','İnşa/üretme'),
     jsonb_build_object('value','people','label','İnsanlarla çalışma'),
     jsonb_build_object('value','research','label','Araştırma'),
     jsonb_build_object('value','operations','label','Operasyon'),
     jsonb_build_object('value','sales','label','Satış'),
     jsonb_build_object('value','teaching','label','Öğretme')
   ), true, 2),
  ('career_path_abroad', 'core_skills', 'both', 'skills', 'Güçlü becerilerin?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','technical','label','Teknik'),
     jsonb_build_object('value','communication','label','İletişim'),
     jsonb_build_object('value','language','label','Dil'),
     jsonb_build_object('value','leadership','label','Liderlik'),
     jsonb_build_object('value','craft','label','El/zanaat'),
     jsonb_build_object('value','healthcare','label','Sağlık'),
     jsonb_build_object('value','finance','label','Finans')
   ), true, 3),
  ('career_path_abroad', 'study_willingness', 'both', 'interest', 'Yurt dışında yeniden eğitim/sertifika almaya açık mısın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, true, 4),
  ('career_path_abroad', 'risk_appetite', 'both', 'interest', 'Kariyerde yeniden başlama riskine toleransın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, true, 5),
  ('career_path_abroad', 'work_environment', 'both', 'interest', 'Çalışma ortamı tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','startup','label','Startup'),
     jsonb_build_object('value','corporate','label','Kurumsal'),
     jsonb_build_object('value','academic','label','Akademik'),
     jsonb_build_object('value','public','label','Kamu'),
     jsonb_build_object('value','freelance','label','Freelance'),
     jsonb_build_object('value','field_work','label','Saha')
   ), true, 6),
  ('career_path_abroad', 'salary_vs_stability', 'both', 'interest', 'Maaş mı istikrar mı?', '1 = istikrar, 5 = maaş', 'scale', '[]'::jsonb, true, 7),
  -- DETAILED (+8)
  ('career_path_abroad', 'regulated_barrier', 'detailed', 'legal', 'Alanında lisans/denklik bariyeri var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 8),
  ('career_path_abroad', 'language_level', 'detailed', 'skills', 'İş dilinde seviyen?', '0 = hiç, 5 = ileri', 'scale', '[]'::jsonb, false, 9),
  ('career_path_abroad', 'portfolio_signal', 'detailed', 'skills', 'Portföy, yayın, proje veya referansların var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü'),
     jsonb_build_object('value','partial','label','Kısmen'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 10),
  ('career_path_abroad', 'entrepreneurship', 'detailed', 'interest', 'Girişimcilik/freelance çalışma ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 11),
  ('career_path_abroad', 'research_interest', 'detailed', 'interest', 'Araştırma/akademi ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 12),
  ('career_path_abroad', 'hands_on_interest', 'detailed', 'interest', 'Pratik/mesleki uygulama ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 13),
  ('career_path_abroad', 'people_helping', 'detailed', 'interest', 'İnsanlara doğrudan destek veren rollere ilgin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('career_path_abroad', 'timeline', 'detailed', 'plan', 'Kariyer dönüşümü için zaman ufkun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','0-3m','label','0-3 ay'),
     jsonb_build_object('value','3-12m','label','3-12 ay'),
     jsonb_build_object('value','1-2y','label','1-2 yıl'),
     jsonb_build_object('value','2y+','label','2 yıldan uzak')
   ), false, 15);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_career_path_v1 — 6 patika skoru, primary + hibrit + roadmap.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_career_path_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  -- scale 1..5 → 0..1; eksik nötr 0.5
  v_study numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'study_willingness')::numeric, 3) - 1) / 4));
  v_risk numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'risk_appetite')::numeric, 3) - 1) / 4));
  v_salary_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'salary_vs_stability')::numeric, 3) - 1) / 4));
  v_lang numeric := public.rl_tool_clamp_neutral((coalesce((v_ans ->> 'language_level')::numeric, 2.5) / 5));
  v_entre numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'entrepreneurship')::numeric, 3) - 1) / 4));
  v_research numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'research_interest')::numeric, 3) - 1) / 4));
  v_hands numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'hands_on_interest')::numeric, 3) - 1) / 4));
  v_people numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'people_helping')::numeric, 3) - 1) / 4));
  -- multi üyelik (1/0)
  v_skills text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'core_skills', '[]'::jsonb))), '{}'::text[]);
  v_fav text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'favorite_work', '[]'::jsonb))), '{}'::text[]);
  v_tech numeric := case when 'technical' = any(v_skills) then 1 else 0 end;
  v_leadership numeric := case when 'leadership' = any(v_skills) then 1 else 0 end;
  v_healthcare numeric := case when 'healthcare' = any(v_skills) then 1 else 0 end;
  v_fav_research numeric := case when 'research' = any(v_fav) then 1 else 0 end;
  v_fav_people numeric := case when 'people' = any(v_fav) then 1 else 0 end;
  v_fav_building numeric := case when 'building' = any(v_fav) then 1 else 0 end;
  -- single sinyaller
  v_env text := v_ans ->> 'work_environment';
  v_portfolio text := v_ans ->> 'portfolio_signal';
  v_portfolio_score numeric := case v_portfolio when 'strong' then 1.0 when 'partial' then 0.5 else 0.0 end;
  -- Patika puanları (Σ coef * sinyal; coef'ler relocation-tools-career.ts PATH_SIGNALS aynası)
  v_intl numeric;
  v_acad numeric;
  v_voc numeric;
  v_startup numeric;
  v_remote numeric;
  v_public numeric;
  v_scores jsonb;
  v_top_key text;
  v_top_val numeric;
  v_second_key text;
  v_second_val numeric;
  v_is_hybrid boolean;
  v_labels jsonb;
  v_roadmaps jsonb;
begin
  v_intl := v_tech * 0.25 + v_lang * 0.25 + v_leadership * 0.2
            + (case when v_env = 'corporate' then 0.2 else 0 end) + (1 - v_risk) * 0.1;
  v_acad := v_research * 0.4 + v_study * 0.3 + v_fav_research * 0.15
            + (case when v_env = 'academic' then 0.15 else 0 end);
  v_voc := v_hands * 0.4 + v_fav_building * 0.2 + v_study * 0.2
           + (case when v_env = 'field_work' then 0.2 else 0 end);
  v_startup := v_risk * 0.3 + v_entre * 0.35 + v_salary_pref * 0.15
               + (case when v_env = 'startup' then 0.2 else 0 end);
  v_remote := v_tech * 0.3 + v_portfolio_score * 0.3 + v_entre * 0.2
              + (case when v_env = 'freelance' then 0.2 else 0 end);
  v_public := v_people * 0.35 + v_fav_people * 0.2 + v_healthcare * 0.15 + v_lang * 0.15
              + (case when v_env = 'public' then 0.15 else 0 end);

  v_scores := jsonb_build_object(
    'international_professional', round(v_intl, 4),
    'academic_research', round(v_acad, 4),
    'vocational_practical', round(v_voc, 4),
    'startup_entrepreneur', round(v_startup, 4),
    'remote_global', round(v_remote, 4),
    'public_ngo_community', round(v_public, 4)
  );

  select key, value::numeric into v_top_key, v_top_val
  from jsonb_each_text(v_scores) order by value::numeric desc, key limit 1;
  select key, value::numeric into v_second_key, v_second_val
  from jsonb_each_text(v_scores) order by value::numeric desc, key offset 1 limit 1;

  -- Hibrit: fark < 0.08 (docs: <8/100).
  v_is_hybrid := (v_top_val - v_second_val) < 0.08;

  v_labels := jsonb_build_object(
    'international_professional', 'Uluslararası Profesyonel',
    'academic_research', 'Akademi & Araştırma',
    'vocational_practical', 'Mesleki & Pratik',
    'startup_entrepreneur', 'Girişimci',
    'remote_global', 'Uzaktan Global',
    'public_ngo_community', 'Kamu & STK & Topluluk'
  );

  v_roadmaps := jsonb_build_object(
    'international_professional', 'Dil seviyeni B2+''ya taşı, CV/portföyünü hedef ülke formatına çevir, maaş ve iş bulma araçlarını çalıştır.',
    'academic_research', 'Hedef program/danışman araştır, yayın/proje portföyünü düzenle, başvuru ve burs takvimini çıkar.',
    'vocational_practical', 'Mesleki denklik/sertifika adımlarını öğren, pratik portföyünü belgeleyin, atölye/staj fırsatlarına bak.',
    'startup_entrepreneur', 'Fikir/ürün doğrulaması yap, hedef ülke girişim vizesi ve ekosistemini araştır, network kur.',
    'remote_global', 'Portföyünü İngilizceye çevir, uzaktan iş platformlarında profil aç, zaman dilimi ve sözleşme modelini netleştir.',
    'public_ngo_community', 'İlgili kurum/STK''ları listele, dil ve saha deneyimini öne çıkar, gönüllülük/staj ile başla.'
  );

  return public.rl_tool_write_result(
    p_session_id,
    'persona',
    null,
    v_top_key,
    jsonb_build_object(
      'persona_key', v_top_key,
      'persona_label', v_labels ->> v_top_key,
      'is_hybrid', v_is_hybrid,
      'secondary_key', case when v_is_hybrid then v_second_key else null end,
      'secondary_label', case when v_is_hybrid then v_labels ->> v_second_key else null end,
      'roadmap', v_roadmaps ->> v_top_key
    ),
    v_scores,
    '[]'::jsonb,
    jsonb_build_array(
      'Birincil kariyer yolun: ' || (v_labels ->> v_top_key) ||
        case when v_is_hybrid then ' (hibrit — ' || (v_labels ->> v_second_key) || ' ile yakın)' else '' end || '.',
      '6 aylık odak: ' || (v_roadmaps ->> v_top_key)
    ),
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Maaş Karşılaştırma','href','/relocation/tools/meslek-maas-karsilastirma'),
      jsonb_build_object('key','start_related_tool','label','İş Bulma Olasılığı','href','/relocation/tools/yurtdisi-is-bulma-olasiligi'),
      jsonb_build_object('key','find_mentor','label','Bu Patikada Mentor Bul')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_career_path_v1(uuid) to authenticated;
