-- Relocation Tools — 10 genel değerlendirme aracını tek modlu (mode='both'), sabit 20 soruya
-- normalize eder. Quick/detaylı ayrımı UI'dan kalktı (RelocationToolPage artık mod seçici
-- göstermiyor, tek akış). Her araç için:
--   1) quick_question_count = detailed_question_count = 20
--   2) delete + yeniden insert (idempotent seed deseni korunur) — TÜM sorular mode='both'
--   3) yeni sorular mevcut skorlama boyutlarına (weights anahtarları) ek sinyal olarak bağlanır;
--      ağırlık şeması/toplamı DEĞİŞMEZ, sadece RPC breakdown formülleri zenginleşir.
-- Banka/sigorta (Almanya) araçları zaten 20/mode='both' — bu migration'da yer almaz.

-- ===========================================================================
-- 1) country_match (+2: remote_work_flexibility, tax_burden_tolerance)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'country_match';

delete from public.relocation_tool_questions where tool_key = 'country_match';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
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
  ('country_match', 'target_region', 'both', 'plan', 'Hangi bölgelere açıksın?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','eu_eea','label','AB/AEA'),
     jsonb_build_object('value','uk','label','Birleşik Krallık'),
     jsonb_build_object('value','north_america','label','Kuzey Amerika'),
     jsonb_build_object('value','gulf','label','Körfez'),
     jsonb_build_object('value','apac','label','Asya-Pasifik'),
     jsonb_build_object('value','any','label','Fark etmez')
   ), false, 8),
  ('country_match', 'setup_budget', 'both', 'budget', 'İlk kurulum için ayırabileceğin maksimum bütçe?', 'Depozito, uçuş, evrak (EUR)', 'currency', '[]'::jsonb, false, 9),
  ('country_match', 'language_profile', 'both', 'language', 'İngilizce dışında bir dil biliyor musun / öğrenmeye açık mısın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','english_only','label','Sadece İngilizce'),
     jsonb_build_object('value','open','label','Yeni dil öğrenmeye açığım'),
     jsonb_build_object('value','multilingual','label','Birden fazla dil biliyorum')
   ), false, 10),
  ('country_match', 'bureaucracy_tolerance', 'both', 'visa', 'Bürokrasi ve bekleme süresine toleransın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 11),
  ('country_match', 'family_needs', 'both', 'family', 'Aile, çocuk, okul veya evcil hayvan ihtiyaçların var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','children','label','Çocuk'),
     jsonb_build_object('value','school','label','Okul'),
     jsonb_build_object('value','spouse_job','label','Eş işi'),
     jsonb_build_object('value','pets','label','Evcil hayvan'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 12),
  ('country_match', 'healthcare_priority', 'both', 'qol', 'Sağlık sistemine erişim önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 13),
  ('country_match', 'safety_priority', 'both', 'qol', 'Güvenlik ve siyasi istikrar önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('country_match', 'inclusion_priority', 'both', 'qol', 'Kapsayıcılık / haklar / sosyal özgürlükler ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 15),
  ('country_match', 'climate_preference', 'both', 'lifestyle', 'İklim tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','mild','label','Ilıman'),
     jsonb_build_object('value','cold','label','Soğuk'),
     jsonb_build_object('value','warm','label','Sıcak'),
     jsonb_build_object('value','mediterranean','label','Akdeniz'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), false, 16),
  ('country_match', 'move_window', 'both', 'plan', 'Ne zaman taşınmak istiyorsun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','0-3m','label','0-3 ay'),
     jsonb_build_object('value','3-6m','label','3-6 ay'),
     jsonb_build_object('value','6-12m','label','6-12 ay'),
     jsonb_build_object('value','later','label','Daha sonra')
   ), false, 17),
  ('country_match', 'risk_tolerance', 'both', 'plan', 'Belirsizlik ve yeniden başlama riskine toleransın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 18),
  -- YENİ (+2)
  ('country_match', 'remote_work_flexibility', 'both', 'career', 'Uzaktan çalışma esnekliğin ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 19),
  ('country_match', 'tax_burden_tolerance', 'both', 'budget', 'Vergi yükü toleransın?', '1 = düşük tolerans, 5 = yüksek tolerans', 'scale', '[]'::jsonb, false, 20);

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
  v_community_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_importance')::numeric, 3) - 1) / 4));
  v_health_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_priority')::numeric, 3) - 1) / 4));
  v_safety_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'safety_priority')::numeric, 3) - 1) / 4));
  v_inclusion_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'inclusion_priority')::numeric, 3) - 1) / 4));
  v_has_budget boolean := (v_ans ->> 'monthly_budget') is not null and (v_ans ->> 'monthly_budget') <> '';
  v_english_only boolean := (v_ans ->> 'language_profile') = 'english_only';
  v_climate text := v_ans ->> 'climate_preference';
  v_visa_assets text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'visa_assets', '[]'::jsonb))), '{}'::text[]);
  v_has_visa_asset boolean := exists (select 1 from unnest(v_visa_assets) a where a <> 'none');
  v_dealbreakers text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'deal_breakers', '[]'::jsonb))), '{}'::text[]);
  -- YENİ sinyaller: uzaktan çalışma esnekliği (career_market_fit'i hafifçe güçlendirir) +
  -- vergi yükü toleransı (budget_fit'i hafifçe güçlendirir). Eksik cevap nötr 0.5.
  v_remote_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'remote_work_flexibility')::numeric, 3) - 1) / 4));
  v_tax_tolerance numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'tax_burden_tolerance')::numeric, 3) - 1) / 4));
  v_ranked jsonb;
  v_top jsonb;
  v_top_score numeric;
begin
  select weights into v_weights from public.relocation_tools where key = 'country_match';

  with scored as (
    select
      m.country_code, m.country_name_tr,
      jsonb_build_object(
        'budget_fit', case when not v_has_budget then 0.5
          else public.rl_tool_clamp_neutral(
            (1 - coalesce(m.cost_index, 0.5)) * 0.85 + v_tax_tolerance * 0.15) end,
        'career_market_fit', public.rl_tool_clamp_neutral(
          m.employment_index * 0.9 + v_remote_pref * 0.1),
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

-- ===========================================================================
-- 2) profession_salary (+8: industry_sector, company_size_pref, negotiation_experience,
--    benefits_priority, relocation_package_need, interview_readiness, visa_sponsor_need,
--    remote_salary_expectation)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'profession_salary';

delete from public.relocation_tool_questions where tool_key = 'profession_salary';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  ('profession_salary', 'profession_title', 'both', 'career', 'Mesleğin / rolün nedir?', 'Anahtar: software_engineer, civil_engineer, registered_nurse, accountant, teacher', 'single',
   jsonb_build_array(
     jsonb_build_object('value','software_engineer','label','Yazılım Mühendisi'),
     jsonb_build_object('value','civil_engineer','label','İnşaat Mühendisi'),
     jsonb_build_object('value','registered_nurse','label','Hemşire'),
     jsonb_build_object('value','accountant','label','Muhasebeci'),
     jsonb_build_object('value','teacher','label','Öğretmen')
   ), true, 1),
  ('profession_salary', 'seniority', 'both', 'career', 'Kıdem seviyen?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','junior','label','Junior'),
     jsonb_build_object('value','mid','label','Orta'),
     jsonb_build_object('value','senior','label','Senior'),
     jsonb_build_object('value','lead','label','Lead'),
     jsonb_build_object('value','manager','label','Yönetici')
   ), true, 2),
  ('profession_salary', 'years_experience', 'both', 'career', 'Kaç yıl ilgili deneyimin var?', '0-40', 'number', '[]'::jsonb, true, 3),
  ('profession_salary', 'target_countries', 'both', 'plan', 'Hangi ülkeleri karşılaştırmak istiyorsun?', 'ISO ülke kodları, virgülle (boş = hepsi)', 'country', '[]'::jsonb, true, 4),
  ('profession_salary', 'household_cost_context', 'both', 'budget', 'Alım gücü hesabı için hane tipin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','single','label','Tek kişi'),
     jsonb_build_object('value','couple','label','Çift'),
     jsonb_build_object('value','family_with_children','label','Çocuklu aile')
   ), true, 5),
  ('profession_salary', 'education_level', 'both', 'career', 'En yüksek eğitim seviyen?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','high_school','label','Lise'),
     jsonb_build_object('value','vocational','label','Meslek okulu'),
     jsonb_build_object('value','bachelor','label','Lisans'),
     jsonb_build_object('value','master','label','Yüksek lisans'),
     jsonb_build_object('value','phd','label','Doktora')
   ), false, 6),
  ('profession_salary', 'specialization', 'both', 'career', 'Uzmanlık/branş alanların?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','backend','label','Backend/Sistem'),
     jsonb_build_object('value','data_ai','label','Veri/Yapay Zeka'),
     jsonb_build_object('value','clinical','label','Klinik'),
     jsonb_build_object('value','management','label','Yönetim'),
     jsonb_build_object('value','other','label','Diğer')
   ), false, 7),
  ('profession_salary', 'certifications', 'both', 'career', 'Uluslararası geçerli sertifikan var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','aws','label','AWS/Cloud'),
     jsonb_build_object('value','pmp','label','PMP'),
     jsonb_build_object('value','medical_license','label','Tıbbi lisans'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 8),
  ('profession_salary', 'regulated_profession', 'both', 'legal', 'Mesleğin hedef ülkede lisans/denkliğe tabi mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 9),
  ('profession_salary', 'salary_preference', 'both', 'budget', 'Maaşı nasıl görmek istersin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','gross_yearly','label','Brüt yıllık'),
     jsonb_build_object('value','net_monthly','label','Net aylık'),
     jsonb_build_object('value','both','label','İkisi de')
   ), false, 10),
  ('profession_salary', 'current_salary_optional', 'both', 'budget', 'Mevcut net maaşını karşılaştırmaya dahil edelim mi?', 'Opsiyonel (EUR/ay)', 'currency', '[]'::jsonb, false, 11),
  ('profession_salary', 'target_cities', 'both', 'plan', 'Belirli şehirleri dahil edelim mi?', 'Opsiyonel', 'text', '[]'::jsonb, false, 12),
  -- YENİ (+8)
  ('profession_salary', 'industry_sector', 'both', 'career', 'Hangi sektörde çalışıyorsun/çalışmak istiyorsun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','tech','label','Teknoloji'),
     jsonb_build_object('value','finance','label','Finans'),
     jsonb_build_object('value','healthcare','label','Sağlık'),
     jsonb_build_object('value','public_sector','label','Kamu'),
     jsonb_build_object('value','other','label','Diğer')
   ), false, 13),
  ('profession_salary', 'company_size_pref', 'both', 'career', 'Şirket ölçeği tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','startup','label','Startup'),
     jsonb_build_object('value','mid_size','label','Orta ölçek'),
     jsonb_build_object('value','enterprise','label','Büyük/kurumsal'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), false, 14),
  ('profession_salary', 'negotiation_experience', 'both', 'career', 'Maaş pazarlığı deneyimin/özgüvenin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 15),
  ('profession_salary', 'benefits_priority', 'both', 'budget', 'Maaş dışında en çok önemsediğin yan haklar?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','health_insurance','label','Sağlık sigortası'),
     jsonb_build_object('value','pension','label','Emeklilik/pension'),
     jsonb_build_object('value','paid_leave','label','Ücretli izin'),
     jsonb_build_object('value','bonus','label','Prim/bonus'),
     jsonb_build_object('value','none','label','Önemli değil')
   ), false, 16),
  ('profession_salary', 'relocation_package_need', 'both', 'budget', 'İşveren taşınma paketi (relocation package) bekliyor musun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','essential','label','Şart'),
     jsonb_build_object('value','nice_to_have','label','Olursa iyi olur'),
     jsonb_build_object('value','not_needed','label','Gerek yok')
   ), false, 17),
  ('profession_salary', 'interview_readiness', 'both', 'career', 'Hedef ülke standartlarında mülakat hazırlığın nasıl?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 18),
  ('profession_salary', 'visa_sponsor_need', 'both', 'legal', 'İşe alım için vize sponsorluğuna ihtiyacın olur mu?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 19),
  ('profession_salary', 'remote_salary_expectation', 'both', 'budget', 'Uzaktan/hibrit çalışırsan maaş beklentin değişir mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','same','label','Aynı kalmalı'),
     jsonb_build_object('value','flexible','label','Esnek olabilirim'),
     jsonb_build_object('value','lower_ok','label','Daha düşüğü kabul ederim')
   ), false, 20);

create or replace function public.relocation_score_profession_salary_v1(p_session_id uuid)
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
    jsonb_build_object('key','high_value','min',75),
    jsonb_build_object('key','balanced','min',55),
    jsonb_build_object('key','expensive_but_high_salary','min',40),
    jsonb_build_object('key','low_salary_or_high_barrier','min',0));
  v_profession_key text := v_ans ->> 'profession_title';
  v_profession_id uuid;
  v_regulated text := v_ans ->> 'regulated_profession';
  v_targets text[] := coalesce(
    (select array_agg(upper(trim(t)))
     from regexp_split_to_table(coalesce(v_ans ->> 'target_countries', ''), ',') t
     where trim(t) <> ''), '{}'::text[]);
  v_global_max numeric;
  v_rows jsonb;
  v_top jsonb;
  v_top_score numeric;
  -- YENİ sinyaller: pazarlık özgüveni + mülakat hazırlığı → demand_fit'i hafifçe güçlendirir
  -- (kişinin talep tarafında ne kadar etkin olabileceğinin bir proxy'si);
  -- yan haklar önceliği + vize sponsor ihtiyacı → tax_social_fit'e katkı.
  v_negotiation numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'negotiation_experience')::numeric, 3) - 1) / 4));
  v_interview_ready numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'interview_readiness')::numeric, 3) - 1) / 4));
  v_visa_sponsor text := v_ans ->> 'visa_sponsor_need';
  v_benefits text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'benefits_priority', '[]'::jsonb))), '{}'::text[]);
  v_benefits_score numeric := case when cardinality(v_benefits) = 0 or v_benefits = array['none'] then 0.5
    else least(cardinality(v_benefits)::numeric / 3.0, 1.0) end;
begin
  select weights into v_weights from public.relocation_tools where key = 'profession_salary';

  select id into v_profession_id from public.relocation_professions where profession_key = v_profession_key and is_active;
  if v_profession_id is null then
    return public.rl_tool_write_result(
      p_session_id, 'comparison', null, null,
      jsonb_build_object('rows', '[]'::jsonb),
      '{}'::jsonb, '[]'::jsonb,
      jsonb_build_array('Seçilen meslek için maaş verisi bulunamadı.'),
      jsonb_build_array(jsonb_build_object('key','view_relocation_plan','label','Taşınma Planın')),
      '{}'::jsonb, 'rule-v1');
  end if;

  select max(salary_median) into v_global_max
  from public.relocation_salary_benchmarks
  where profession_id = v_profession_id and is_active;
  if coalesce(v_global_max, 0) = 0 then v_global_max := 1; end if;

  with rows0 as (
    select
      b.country_code,
      coalesce(cm.country_name_tr, b.country_code) as country_name,
      b.salary_min, b.salary_median, b.salary_max, b.currency,
      round(b.salary_median * b.net_ratio / 12.0, 0) as net_monthly_est,
      b.demand_index, b.confidence,
      cm.cost_index,
      jsonb_build_object(
        'salary_level', public.rl_tool_clamp_neutral(b.salary_median / v_global_max),
        'cost_adjusted_income', public.rl_tool_clamp_neutral(
          (b.salary_median * b.net_ratio / v_global_max) / nullif(0.4 + coalesce(cm.cost_index, 0.5), 0)),
        'demand_fit', public.rl_tool_clamp_neutral(
          b.demand_index * 0.8 + v_negotiation * 0.1 + v_interview_ready * 0.1),
        'tax_social_fit', public.rl_tool_clamp_neutral(
          b.net_ratio * 0.75 + v_benefits_score * 0.25),
        'credential_transferability', case
          when v_regulated = 'yes' then 0.3
          when v_regulated = 'not_sure' then 0.5
          else 0.85 end
          * (case when v_visa_sponsor = 'yes' then 0.9 else 1.0 end)
      ) as breakdown
    from public.relocation_salary_benchmarks b
    left join public.relocation_country_metrics cm on cm.country_code = b.country_code
    where b.profession_id = v_profession_id and b.is_active
      and (array_length(v_targets, 1) is null or b.country_code = any (v_targets))
  ),
  scored as (
    select *,
      round(public.rl_tool_weighted_score(breakdown, v_weights) * 100, 2) as power_index
    from rows0
  ),
  numbered as (
    select *, row_number() over (order by power_index desc, country_name) as rn from scored
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'key', country_code, 'title', country_name, 'score', power_index,
        'bucket', public.rl_tool_resolve_bucket(power_index, v_bands),
        'gross_min', salary_min, 'gross_median', salary_median, 'gross_max', salary_max,
        'net_monthly', net_monthly_est, 'currency', currency,
        'demand', demand_index, 'confidence', confidence,
        'sub_scores', breakdown,
        'detail', country_name || ' — brüt medyan ' || salary_median::text || ' ' || currency || '/yıl'
      ) order by power_index desc, country_name
    ) filter (where rn <= 8), '[]'::jsonb),
    (jsonb_agg(breakdown order by power_index desc, country_name) filter (where rn = 1)) -> 0,
    max(power_index) filter (where rn = 1)
  into v_rows, v_top, v_top_score
  from numbered;

  return public.rl_tool_write_result(
    p_session_id,
    'comparison',
    v_top_score,
    public.rl_tool_resolve_bucket(coalesce(v_top_score, 0), v_bands),
    jsonb_build_object('rows', v_rows),
    coalesce(v_top, '{}'::jsonb),
    v_rows,
    case when v_rows = '[]'::jsonb
      then jsonb_build_array('Seçtiğin ülkelerde bu meslek için maaş verisi bulunamadı.')
      else jsonb_build_array(
        'Meslek ve hedef ülkelere göre maaş gücü karşılaştırıldı.',
        'Brüt bandlar küratörlü veridir; net tahmin basitleştirilmiş ülke faktörüne dayanır, garanti değildir.') end,
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','İş Bulma Olasılığını Hesapla','href','/relocation/tools/yurtdisi-is-bulma-olasiligi'),
      jsonb_build_object('key','find_mentor','label','Bu Meslekte Mentor Bul'),
      jsonb_build_object('key','start_related_tool','label','Kariyer Yolu Aracı','href','/relocation/tools/yurtdisi-kariyer-yolu')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_profession_salary_v1(uuid) to authenticated;

-- ===========================================================================
-- 3) relocation_readiness (+5: emergency_fund_access, local_bank_account,
--    remote_work_transition, pet_relocation_plan, mental_health_readiness)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'relocation_readiness';

delete from public.relocation_tool_questions where tool_key = 'relocation_readiness';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
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
  ('relocation_readiness', 'debt_pressure', 'both', 'finance',
   'Kısa vadede taşınmayı zorlayacak borç/ödeme baskın var mı?', '1 = yüksek baskı, 5 = baskı yok', 'scale',
   '[]'::jsonb, false, 7),
  ('relocation_readiness', 'visa_route', 'both', 'legal',
   'Hedef ülke için net bir vize/oturum rotan var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet, net','score',1.0),
     jsonb_build_object('value','researching','label','Araştırıyorum','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 8),
  ('relocation_readiness', 'diploma_docs', 'both', 'legal',
   'Diploma, transkript, referans ve iş belgelerin hazır mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazır','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 9),
  ('relocation_readiness', 'health_insurance', 'both', 'support',
   'Sağlık sigortası / erişim planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet','score',1.0),
     jsonb_build_object('value','researching','label','Araştırıyorum','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 10),
  ('relocation_readiness', 'support_network', 'both', 'support',
   'Hedef yerde tanıdık/topluluk desteğin var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü','score',1.0),
     jsonb_build_object('value','weak','label','Zayıf','score',0.5),
     jsonb_build_object('value','none','label','Yok','score',0.0)
   ), false, 11),
  ('relocation_readiness', 'family_alignment', 'both', 'housing',
   'Eş/çocuk/aile kararları net mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','not_applicable','label','Geçerli değil','score',1.0),
     jsonb_build_object('value','aligned','label','Net/uyumlu','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','conflict','label','Anlaşmazlık var','score',0.0)
   ), false, 12),
  ('relocation_readiness', 'emergency_plan', 'both', 'support',
   'Acil durumda iletişim ve dönüş planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 13),
  ('relocation_readiness', 'adaptability', 'both', 'support',
   'Belirsizlik ve kültürel uyuma hazır hissediyor musun?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 14),
  ('relocation_readiness', 'timeline_realism', 'both', 'housing',
   'Taşınma takvimin gerçekçi mi?', '1 = gerçekçi değil, 5 = çok gerçekçi', 'scale',
   '[]'::jsonb, false, 15),
  -- YENİ (+5)
  ('relocation_readiness', 'emergency_fund_access', 'both', 'finance',
   'Acil durum fonuna (birikim dışında, hızlı erişilebilir) sahip misin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet','score',1.0),
     jsonb_build_object('value','partial','label','Kısmen','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 16),
  ('relocation_readiness', 'local_bank_account', 'both', 'legal',
   'Hedef ülkede banka hesabı açma sürecini araştırdın mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazırım/araştırdım','score',1.0),
     jsonb_build_object('value','researching','label','Araştırıyorum','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 17),
  ('relocation_readiness', 'remote_work_transition', 'both', 'job',
   'Mevcut işini uzaktan sürdürme/geçiş planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','not_applicable','label','Geçerli değil','score',1.0),
     jsonb_build_object('value','yes','label','Evet, netleşti','score',1.0),
     jsonb_build_object('value','negotiating','label','Görüşülüyor','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 18),
  ('relocation_readiness', 'pet_relocation_plan', 'both', 'housing',
   'Evcil hayvan taşıma/karantina planın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','not_applicable','label','Geçerli değil','score',1.0),
     jsonb_build_object('value','ready','label','Hazır','score',1.0),
     jsonb_build_object('value','researching','label','Araştırıyorum','score',0.5),
     jsonb_build_object('value','no','label','Hayır','score',0.0)
   ), false, 19),
  ('relocation_readiness', 'mental_health_readiness', 'both', 'support',
   'Taşınma stresine ruhsal/duygusal olarak hazır hissediyor musun?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 20);

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
  -- YENİ single option skorları
  s_emergency_fund numeric := public.rl_readiness_opt_score('relocation_readiness','emergency_fund_access', v_ans ->> 'emergency_fund_access');
  s_bank numeric := public.rl_readiness_opt_score('relocation_readiness','local_bank_account', v_ans ->> 'local_bank_account');
  s_remote_transition numeric := public.rl_readiness_opt_score('relocation_readiness','remote_work_transition', v_ans ->> 'remote_work_transition');
  s_pet numeric := public.rl_readiness_opt_score('relocation_readiness','pet_relocation_plan', v_ans ->> 'pet_relocation_plan');
  s_debt numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'debt_pressure')::numeric, 3) - 1) / 4));
  s_lang numeric := public.rl_tool_clamp_neutral((coalesce((v_ans ->> 'language_level')::numeric, 2.5) / 5));
  s_adapt numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'adaptability')::numeric, 3) - 1) / 4));
  s_timeline numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'timeline_realism')::numeric, 3) - 1) / 4));
  s_mental numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'mental_health_readiness')::numeric, 3) - 1) / 4));
  v_breakdown jsonb;
  v_score01 numeric;
  v_score100 numeric;
  v_bucket text;
  v_labels jsonb;
  v_weak jsonb;
begin
  select weights into v_weights from public.relocation_tools where key = 'relocation_readiness';

  -- Boyut türetme (ortalama; relocation-tools-readiness.ts ile birebir + yeni sinyaller).
  v_breakdown := jsonb_build_object(
    'financial_readiness', round((s_savings * 0.5 + s_debt * 0.3 + s_emergency_fund * 0.2), 4),
    'legal_document_readiness', round((s_passport * 0.30 + s_visa * 0.30 + s_diploma * 0.25 + s_bank * 0.15), 4),
    'language_readiness', round(s_lang, 4),
    'housing_logistics', round((s_housing * 0.45 + s_timeline * 0.25 + s_family * 0.15 + s_pet * 0.15), 4),
    'job_income_readiness', round((s_job * 0.75 + s_remote_transition * 0.25), 4),
    'support_adaptability', round((s_support * 0.30 + s_emergency * 0.15 + s_health * 0.15 + s_adapt * 0.20 + s_mental * 0.20), 4)
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

grant execute on function public.relocation_score_readiness_v1(uuid) to authenticated;

-- ===========================================================================
-- 4) city_match (+4: public_transport_importance, green_space_preference,
--    expat_community_size, healthcare_access_urgency)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'city_match';

delete from public.relocation_tool_questions where tool_key = 'city_match';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
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
  ('city_match', 'commute_tolerance', 'both', 'mobility',
   'Günlük ulaşım toleransın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','15m','label','15 dk'),
     jsonb_build_object('value','30m','label','30 dk'),
     jsonb_build_object('value','60m','label','60 dk'),
     jsonb_build_object('value','flexible','label','Esnek')
   ), false, 8),
  ('city_match', 'nightlife_culture', 'both', 'lifestyle',
   'Kültür, etkinlik, gece hayatı önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 9),
  ('city_match', 'quiet_preference', 'both', 'lifestyle',
   'Sessiz/sakin yaşam senin için önemli mi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 10),
  ('city_match', 'climate', 'both', 'lifestyle',
   'Şehir iklimi tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','mild','label','Ilıman'),
     jsonb_build_object('value','cold','label','Soğuk'),
     jsonb_build_object('value','warm','label','Sıcak'),
     jsonb_build_object('value','coastal','label','Kıyı'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), false, 11),
  ('city_match', 'language_comfort', 'both', 'lifestyle',
   'Yerel dili bilmeden şehirde başlama konforu ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 12),
  ('city_match', 'housing_priority', 'both', 'budget',
   'Konut bulunabilirliği maliyetten daha önemli mi?', '1 = maliyet, 5 = bulunabilirlik', 'scale',
   '[]'::jsonb, false, 13),
  ('city_match', 'healthcare_priority', 'both', 'safety',
   'Sağlık erişimi önceliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('city_match', 'deal_breakers', 'both', 'plan',
   'Şehir için kırmızı çizgilerin?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','too_expensive','label','Çok pahalı'),
     jsonb_build_object('value','no_jobs','label','İş yok'),
     jsonb_build_object('value','no_community','label','Topluluk yok'),
     jsonb_build_object('value','unsafe','label','Güvensiz'),
     jsonb_build_object('value','poor_transport','label','Ulaşım kötü')
   ), false, 15),
  ('city_match', 'preferred_examples', 'both', 'lifestyle',
   'Sevdiğin şehir tiplerine örnek ver', 'Opsiyonel', 'text', '[]'::jsonb, false, 16),
  -- YENİ (+4)
  ('city_match', 'public_transport_importance', 'both', 'mobility',
   'Toplu taşıma kalitesi/erişimi ne kadar önemli?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 17),
  ('city_match', 'green_space_preference', 'both', 'lifestyle',
   'Yeşil alan/park erişimi senin için önemli mi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 18),
  ('city_match', 'expat_community_size', 'both', 'community',
   'Uluslararası/expat topluluğunun büyüklüğü senin için önemli mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','large','label','Büyük olsun'),
     jsonb_build_object('value','moderate','label','Orta yeterli'),
     jsonb_build_object('value','no_preference','label','Fark etmez')
   ), false, 19),
  ('city_match', 'healthcare_access_urgency', 'both', 'safety',
   'Kronik/acil sağlık ihtiyacın nedeniyle sağlık erişimi kritik mi?', '1 = düşük, 5 = kritik', 'scale',
   '[]'::jsonb, false, 20);

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
  v_targets text[] := coalesce(
    (select array_agg(upper(trim(t)))
     from regexp_split_to_table(coalesce(v_ans ->> 'target_countries', ''), ',') t
     where trim(t) <> ''),
    '{}'::text[]
  );
  v_community_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_need')::numeric, 3) - 1) / 4));
  v_safety_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'safety_family')::numeric, 3) - 1) / 4));
  v_airport_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'airport_access')::numeric, 3) - 1) / 4));
  v_industry_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'industry_hub')::numeric, 3) - 1) / 4));
  v_health_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_priority')::numeric, 3) - 1) / 4));
  -- YENİ tercih çarpanları
  v_transport_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'public_transport_importance')::numeric, 3) - 1) / 4));
  v_green_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'green_space_preference')::numeric, 3) - 1) / 4));
  v_expat_pref text := v_ans ->> 'expat_community_size';
  v_health_urgency numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'healthcare_access_urgency')::numeric, 3) - 1) / 4));
  v_ranked jsonb;
  v_top jsonb;
  v_top_score numeric;
begin
  select weights into v_weights from public.relocation_tools where key = 'city_match';

  with scored as (
    select
      l.id, l.country_code, l.city_code, l.city_name, l.freshness_at,
      jsonb_build_object(
        'budget_housing_fit', round(
          (public.rl_tool_clamp_neutral(1 - coalesce(l.cost_index, 0.5)) * 0.6
           + public.rl_tool_clamp_neutral(l.housing_availability) * 0.4), 4),
        'job_hub_fit', round(
          (public.rl_tool_clamp_neutral(1 - coalesce(l.bureaucracy_complexity, 0.5)) * (0.5 + 0.5 * v_industry_pref)), 4),
        -- lifestyle_fit: gsm/altyapı proxy + yeşil alan tercihi ağırlıklı katkısı.
        'lifestyle_fit', round(
          public.rl_tool_clamp_neutral(l.gsm_coverage) * (1 - 0.2 * v_green_pref) + 0.2 * v_green_pref, 4),
        'community_fit', round(
          (public.rl_tool_clamp_neutral(l.community_density) * (0.4 + 0.6 * v_community_pref))
          * (case when v_expat_pref = 'large' then 1.05 when v_expat_pref = 'no_preference' then 0.95 else 1.0 end), 4),
        -- safety_healthcare: güvenlik + sağlık, önceliklerle ağırlıklı; sağlık aciliyeti ek ağırlık verir.
        'safety_healthcare_fit', round(
          (public.rl_tool_clamp_neutral(l.safety_index) * (0.4 + 0.6 * v_safety_pref) * 0.5
           + public.rl_tool_clamp_neutral(l.healthcare_access) * (0.4 + 0.6 * greatest(v_health_pref, v_health_urgency)) * 0.5), 4),
        -- mobility_flight: uçuş erişimi + toplu taşıma tercihi.
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
    jsonb_build_object('ranked_cities', v_ranked),
    coalesce(v_top, '{}'::jsonb),
    v_ranked,
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

-- ===========================================================================
-- 5) diaspora_matchmaker (+4: experience_years_in_target, preferred_group_size,
--    topic_interests, response_time_expectation)
-- ===========================================================================
alter table public.diaspora_match_preferences
  add column if not exists experience_years_in_target integer,
  add column if not exists preferred_group_size text,
  add column if not exists topic_interests text[] not null default '{}',
  add column if not exists response_time_expectation text;

update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'diaspora_matchmaker';

delete from public.relocation_tool_questions where tool_key = 'diaspora_matchmaker';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  ('diaspora_matchmaker', 'consent_match_visibility', 'both', 'consent',
   'Eşleşme havuzunda görünmeyi kabul ediyor musun?', 'Bu zorunlu; onay olmadan eşleşme üretilmez ve hiçbir şey kaydedilmez.', 'consent', '[]'::jsonb, true, 1),
  ('diaspora_matchmaker', 'profile_status', 'both', 'profile', 'Durumun ne?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','planning','label','Planlıyorum'),
     jsonb_build_object('value','newly_arrived','label','Yeni taşındım'),
     jsonb_build_object('value','settled','label','Yerleşik'),
     jsonb_build_object('value','mentor','label','Mentor'),
     jsonb_build_object('value','organization','label','Kurum/topluluk')
   ), true, 2),
  ('diaspora_matchmaker', 'target_location', 'both', 'geo', 'Hedef ülke/şehir?', 'ISO ülke kodu (ör. DE)', 'country', '[]'::jsonb, true, 3),
  ('diaspora_matchmaker', 'profession_field', 'both', 'field', 'Meslek/sektör alanın?', 'Serbest etiket', 'profession', '[]'::jsonb, true, 4),
  ('diaspora_matchmaker', 'needs', 'both', 'match', 'Hangi konularda yardıma ihtiyacın var?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','job','label','İş'),
     jsonb_build_object('value','housing','label','Konut'),
     jsonb_build_object('value','visa','label','Vize'),
     jsonb_build_object('value','language','label','Dil'),
     jsonb_build_object('value','school','label','Okul'),
     jsonb_build_object('value','community','label','Topluluk'),
     jsonb_build_object('value','healthcare','label','Sağlık')
   ), true, 5),
  ('diaspora_matchmaker', 'offers', 'both', 'match', 'Hangi konularda destek verebilirsin?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','mentoring','label','Mentorluk'),
     jsonb_build_object('value','cv_review','label','CV inceleme'),
     jsonb_build_object('value','local_tips','label','Yerel ipuçları'),
     jsonb_build_object('value','housing_lead','label','Konut yönlendirme'),
     jsonb_build_object('value','language_practice','label','Dil pratiği')
   ), true, 6),
  ('diaspora_matchmaker', 'languages', 'both', 'match', 'Hangi dillerde iletişim kurabilirsin?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','tr','label','Türkçe'),
     jsonb_build_object('value','en','label','İngilizce'),
     jsonb_build_object('value','de','label','Almanca'),
     jsonb_build_object('value','fr','label','Fransızca'),
     jsonb_build_object('value','nl','label','Felemenkçe')
   ), true, 7),
  ('diaspora_matchmaker', 'contact_style', 'both', 'match', 'İlk temas tercihin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','message','label','Mesaj'),
     jsonb_build_object('value','virtual_coffee','label','Sanal kahve'),
     jsonb_build_object('value','group_event','label','Grup etkinliği'),
     jsonb_build_object('value','anonymous_intro','label','Anonim tanışma')
   ), true, 8),
  ('diaspora_matchmaker', 'current_location', 'both', 'geo', 'Şu an neredesin?', 'ISO ülke kodu', 'country', '[]'::jsonb, false, 9),
  ('diaspora_matchmaker', 'availability', 'both', 'match', 'Görüşme uygunluğun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','weekdays','label','Hafta içi'),
     jsonb_build_object('value','evenings','label','Akşamlar'),
     jsonb_build_object('value','weekends','label','Hafta sonu'),
     jsonb_build_object('value','async_only','label','Sadece asenkron')
   ), false, 10),
  ('diaspora_matchmaker', 'mentor_capacity', 'both', 'match', 'Ayda kaç kişiye destek verebilirsin?', 'Mentor/yerleşik için', 'number', '[]'::jsonb, false, 11),
  ('diaspora_matchmaker', 'intro_text', 'both', 'profile', 'Karşı tarafa gösterilecek kısa tanıtım', 'Max 280 karakter', 'text', '[]'::jsonb, false, 12),
  ('diaspora_matchmaker', 'sensitive_hide', 'both', 'consent', 'Gizlemek istediğin alanlar', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','city','label','Şehir'),
     jsonb_build_object('value','profession','label','Meslek'),
     jsonb_build_object('value','real_name','label','Gerçek ad'),
     jsonb_build_object('value','employer','label','İşveren')
   ), false, 13),
  ('diaspora_matchmaker', 'trust_signals', 'both', 'profile', 'Profil doğrulama sinyalleri', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','completed_profile','label','Tamamlanmış profil'),
     jsonb_build_object('value','catalog_claim','label','Katalog talebi'),
     jsonb_build_object('value','phone_verified','label','Telefon doğrulanmış')
   ), false, 14),
  ('diaspora_matchmaker', 'blocking_topics', 'both', 'consent', 'Eşleşmek istemediğin konu/tipler', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','sales','label','Satış'),
     jsonb_build_object('value','legal_advice','label','Hukuki tavsiye'),
     jsonb_build_object('value','recruiting','label','İşe alım'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 15),
  ('diaspora_matchmaker', 'timezone', 'both', 'match', 'Saat dilimi / uygun saat', 'Opsiyonel', 'text', '[]'::jsonb, false, 16),
  -- YENİ (+4)
  ('diaspora_matchmaker', 'experience_years_in_target', 'both', 'profile',
   'Hedef ülke/şehirde kaç yıldır bulunuyorsun?', 'Yeni planlıyorsan 0 yazabilirsin', 'number', '[]'::jsonb, false, 17),
  ('diaspora_matchmaker', 'preferred_group_size', 'both', 'match',
   'Bire bir mi grup buluşması mı tercih edersin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','one_on_one','label','Bire bir'),
     jsonb_build_object('value','small_group','label','Küçük grup'),
     jsonb_build_object('value','either','label','Fark etmez')
   ), false, 18),
  ('diaspora_matchmaker', 'topic_interests', 'both', 'field',
   'Hangi konularda sohbet/etkileşim ilgini çeker?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','career','label','Kariyer'),
     jsonb_build_object('value','entrepreneurship','label','Girişimcilik'),
     jsonb_build_object('value','family_life','label','Aile yaşamı'),
     jsonb_build_object('value','culture_social','label','Kültür/sosyal'),
     jsonb_build_object('value','education','label','Eğitim')
   ), false, 19),
  ('diaspora_matchmaker', 'response_time_expectation', 'both', 'match',
   'Mesajlara ne kadar sürede dönüş bekliyorsun/yapabiliyorsun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','same_day','label','Aynı gün'),
     jsonb_build_object('value','few_days','label','Birkaç gün içinde'),
     jsonb_build_object('value','flexible','label','Esnek')
   ), false, 20);

create or replace function public.relocation_score_diaspora_matchmaker_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_uid uuid := v_session.user_id;
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_weights jsonb;
  v_consent boolean := (v_ans ->> 'consent_match_visibility')::boolean is true;
  v_needs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'needs','[]'::jsonb))), '{}'::text[]);
  v_offers text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'offers','[]'::jsonb))), '{}'::text[]);
  v_langs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'languages','[]'::jsonb))), '{}'::text[]);
  v_target text := upper(coalesce(v_ans ->> 'target_location',''));
  v_profession text := lower(coalesce(v_ans ->> 'profession_field',''));
  -- YENİ: konu ilgi alanları (field_overlap ek sinyali) + tecrübe yılı (trust proxy) +
  -- tercih edilen görüşme grup boyutu ve yanıt hızı bekletisi (reciprocity ek sinyali).
  v_topics text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'topic_interests','[]'::jsonb))), '{}'::text[]);
  v_exp_years integer := coalesce((v_ans ->> 'experience_years_in_target')::integer, 0);
  v_group_pref text := v_ans ->> 'preferred_group_size';
  v_response_pref text := v_ans ->> 'response_time_expectation';
  v_matches jsonb;
  v_count integer;
begin
  select weights into v_weights from public.relocation_tools where key = 'diaspora_matchmaker';

  if not v_consent then
    return public.rl_tool_write_result(
      p_session_id, 'match_list', null, null,
      jsonb_build_object('matches', '[]'::jsonb, 'match_count', 0, 'consent', false),
      '{}'::jsonb, '[]'::jsonb,
      jsonb_build_array('Eşleşme üretmek için görünürlük onayı gerekir. Onay vermeden hiçbir veri kaydedilmez.'),
      jsonb_build_array(jsonb_build_object('key','complete_profile','label','Profilini Tamamla')),
      '{}'::jsonb, 'rule-v1');
  end if;

  insert into public.diaspora_match_preferences as p
    (user_id, visibility_status, profile_status, current_country, target_country_codes,
     needs, offers, profession_tags, languages, availability, contact_style,
     hidden_fields, trust_signals, blocking_topics, intro_text, max_monthly_intros,
     experience_years_in_target, preferred_group_size, topic_interests, response_time_expectation)
  values (
    v_uid,
    case when v_ans ->> 'contact_style' = 'anonymous_intro' then 'anonymous' else 'profile_summary' end,
    nullif(v_ans ->> 'profile_status',''),
    nullif(upper(v_ans ->> 'current_location'),''),
    case when v_target <> '' then array[v_target] else '{}'::text[] end,
    v_needs, v_offers,
    case when v_profession <> '' then array[v_profession] else '{}'::text[] end,
    v_langs,
    nullif(v_ans ->> 'availability',''),
    nullif(v_ans ->> 'contact_style',''),
    coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'sensitive_hide','[]'::jsonb))), '{}'::text[]),
    coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'trust_signals','[]'::jsonb))), '{}'::text[]),
    coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'blocking_topics','[]'::jsonb))), '{}'::text[]),
    left(coalesce(v_ans ->> 'intro_text',''), 280),
    coalesce((v_ans ->> 'mentor_capacity')::integer, 3),
    v_exp_years, nullif(v_group_pref,''), v_topics, nullif(v_response_pref,'')
  )
  on conflict (user_id) do update set
    visibility_status = excluded.visibility_status, profile_status = excluded.profile_status,
    current_country = excluded.current_country, target_country_codes = excluded.target_country_codes,
    needs = excluded.needs, offers = excluded.offers, profession_tags = excluded.profession_tags,
    languages = excluded.languages, availability = excluded.availability,
    contact_style = excluded.contact_style, hidden_fields = excluded.hidden_fields,
    trust_signals = excluded.trust_signals, blocking_topics = excluded.blocking_topics,
    intro_text = excluded.intro_text, max_monthly_intros = excluded.max_monthly_intros,
    experience_years_in_target = excluded.experience_years_in_target,
    preferred_group_size = excluded.preferred_group_size,
    topic_interests = excluded.topic_interests,
    response_time_expectation = excluded.response_time_expectation,
    updated_at = now();

  with cand as (
    select c.*,
      jsonb_build_object(
        'need_offer_complementarity', public.rl_tool_clamp_neutral(
          (cardinality(array(select unnest(v_needs) intersect select unnest(c.offers)))::numeric
           / nullif(greatest(cardinality(v_needs), 1), 0)) * 0.6
          + (cardinality(array(select unnest(v_offers) intersect select unnest(c.needs)))::numeric
             / nullif(greatest(cardinality(v_offers), 1), 0)) * 0.4),
        'geo_proximity', case
          when v_target <> '' and (v_target = any(c.target_country_codes) or v_target = c.current_country) then 1.0
          when array_length(c.target_country_codes,1) is null then 0.5 else 0.3 end,
        -- field_overlap: meslek etiketi + konu ilgi alanları kesişimi.
        'field_overlap', public.rl_tool_clamp_neutral(
          (case
            when v_profession <> '' and v_profession = any(c.profession_tags) then 1.0
            when array_length(c.profession_tags,1) is null then 0.5 else 0.4 end) * 0.7
          + (case when cardinality(v_topics) = 0 or cardinality(c.topic_interests) = 0 then 0.5
             else least(cardinality(array(select unnest(v_topics) intersect select unnest(c.topic_interests)))::numeric
                        / greatest(least(cardinality(v_topics), cardinality(c.topic_interests)), 1), 1.0) end) * 0.3),
        'language_timezone_fit', case
          when cardinality(array(select unnest(v_langs) intersect select unnest(c.languages))) > 0 then 1.0
          else 0.3 end
          * (case when v_response_pref is not null and c.response_time_expectation = v_response_pref then 1.0 else 0.9 end),
        'trust_profile_completeness', public.rl_tool_clamp_neutral(
          least(cardinality(c.trust_signals)::numeric / 3.0, 1.0) * 0.7
          + least(coalesce(c.experience_years_in_target, 0)::numeric / 5.0, 1.0) * 0.3),
        'reciprocity_recent_activity', public.rl_tool_clamp_neutral(
          0.4 + least(c.max_monthly_intros::numeric / 5.0, 0.6))
          * (case when v_group_pref is not null and v_group_pref <> 'either'
                       and c.preferred_group_size is not null and c.preferred_group_size <> 'either'
                       and c.preferred_group_size <> v_group_pref then 0.85 else 1.0 end)
      ) as breakdown
    from public.diaspora_match_preferences c
    where c.visibility_status <> 'off' and c.user_id <> v_uid
  ),
  scored as (
    select user_id, visibility_status, profile_status, current_country, profession_tags,
           languages, intro_text, hidden_fields, breakdown,
           round(public.rl_tool_weighted_score(breakdown, v_weights) * 100, 2) as score
    from cand
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'key', user_id,
        'title', 'Diaspora üyesi · ' || coalesce(profile_status, 'üye'),
        'score', score,
        'role', profile_status,
        'location', case when 'city' = any(hidden_fields) then null else current_country end,
        'profession', case when 'profession' = any(hidden_fields) then null
                           else (profession_tags)[1] end,
        'languages', languages,
        'intro', intro_text,
        'sub_scores', breakdown,
        'detail', 'Uyum: ' || score::text || '/100 — iletişim için karşılıklı onay gerekir.'
      ) order by score desc
    ) filter (where rn <= 8), '[]'::jsonb),
    count(*)
  into v_matches, v_count
  from (select *, row_number() over (order by score desc) as rn from scored) s;

  return public.rl_tool_write_result(
    p_session_id,
    'match_list',
    (v_matches -> 0 ->> 'score')::numeric,
    null,
    jsonb_build_object('matches', v_matches, 'match_count', coalesce(v_count, 0), 'consent', true),
    coalesce(v_matches -> 0 -> 'sub_scores', '{}'::jsonb),
    v_matches,
    case when coalesce(v_count, 0) = 0
      then jsonb_build_array(
        'Şu an opt-in havuzunda uygun aday bulunamadı. Havuza katıldın; yeni üyeler geldikçe eşleşmeler oluşacak.',
        'İsim ve iletişim asla otomatik paylaşılmaz; yalnızca karşılıklı onayla açılır.')
      else jsonb_build_array(
        coalesce(v_count, 0)::text || ' güvenli eşleşme bulundu. Kartlarda isim/iletişim gizli; tanışma isteği gönderip karşı taraf kabul edince açılır.') end,
    jsonb_build_array(
      jsonb_build_object('key','open_cadde','label','Cadde Cafe''de Grup Buluşması'),
      jsonb_build_object('key','complete_profile','label','Profilini Tamamla'),
      jsonb_build_object('key','view_directory','label','Directory''de Mentorları Filtrele')),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_diaspora_matchmaker_v1(uuid) to authenticated;

-- ===========================================================================
-- 6) career_path_abroad (+5: management_interest, hands_on_certification_openness,
--    client_facing_comfort, structured_vs_flexible, mission_driven_motivation)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'career_path_abroad';

delete from public.relocation_tool_questions where tool_key = 'career_path_abroad';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
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
  ('career_path_abroad', 'regulated_barrier', 'both', 'legal', 'Alanında lisans/denklik bariyeri var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 8),
  ('career_path_abroad', 'language_level', 'both', 'skills', 'İş dilinde seviyen?', '0 = hiç, 5 = ileri', 'scale', '[]'::jsonb, false, 9),
  ('career_path_abroad', 'portfolio_signal', 'both', 'skills', 'Portföy, yayın, proje veya referansların var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü'),
     jsonb_build_object('value','partial','label','Kısmen'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 10),
  ('career_path_abroad', 'entrepreneurship', 'both', 'interest', 'Girişimcilik/freelance çalışma ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 11),
  ('career_path_abroad', 'research_interest', 'both', 'interest', 'Araştırma/akademi ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 12),
  ('career_path_abroad', 'hands_on_interest', 'both', 'interest', 'Pratik/mesleki uygulama ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 13),
  ('career_path_abroad', 'people_helping', 'both', 'interest', 'İnsanlara doğrudan destek veren rollere ilgin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('career_path_abroad', 'timeline', 'both', 'plan', 'Kariyer dönüşümü için zaman ufkun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','0-3m','label','0-3 ay'),
     jsonb_build_object('value','3-12m','label','3-12 ay'),
     jsonb_build_object('value','1-2y','label','1-2 yıl'),
     jsonb_build_object('value','2y+','label','2 yıldan uzak')
   ), false, 15),
  -- YENİ (+5)
  ('career_path_abroad', 'management_interest', 'both', 'interest', 'Ekip/insan yönetimi ilgisi?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 16),
  ('career_path_abroad', 'hands_on_certification_openness', 'both', 'interest', 'Mesleki/uygulamalı sertifikasyon almaya açıklığın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 17),
  ('career_path_abroad', 'client_facing_comfort', 'both', 'interest', 'Müşteri/dış paydaşla birebir çalışma konforun?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 18),
  ('career_path_abroad', 'structured_vs_flexible', 'both', 'interest', 'Yapılandırılmış program mı esnek/bağımsız çalışma mı tercih edersin?', '1 = yapılandırılmış, 5 = esnek/bağımsız', 'scale', '[]'::jsonb, false, 19),
  ('career_path_abroad', 'mission_driven_motivation', 'both', 'interest', 'Toplumsal fayda/misyon odaklı iş motivasyonun?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 20);

create or replace function public.relocation_score_career_path_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_study numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'study_willingness')::numeric, 3) - 1) / 4));
  v_risk numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'risk_appetite')::numeric, 3) - 1) / 4));
  v_salary_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'salary_vs_stability')::numeric, 3) - 1) / 4));
  v_lang numeric := public.rl_tool_clamp_neutral((coalesce((v_ans ->> 'language_level')::numeric, 2.5) / 5));
  v_entre numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'entrepreneurship')::numeric, 3) - 1) / 4));
  v_research numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'research_interest')::numeric, 3) - 1) / 4));
  v_hands numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'hands_on_interest')::numeric, 3) - 1) / 4));
  v_people numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'people_helping')::numeric, 3) - 1) / 4));
  v_skills text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'core_skills', '[]'::jsonb))), '{}'::text[]);
  v_fav text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'favorite_work', '[]'::jsonb))), '{}'::text[]);
  v_tech numeric := case when 'technical' = any(v_skills) then 1 else 0 end;
  v_leadership numeric := case when 'leadership' = any(v_skills) then 1 else 0 end;
  v_healthcare numeric := case when 'healthcare' = any(v_skills) then 1 else 0 end;
  v_fav_research numeric := case when 'research' = any(v_fav) then 1 else 0 end;
  v_fav_people numeric := case when 'people' = any(v_fav) then 1 else 0 end;
  v_fav_building numeric := case when 'building' = any(v_fav) then 1 else 0 end;
  v_env text := v_ans ->> 'work_environment';
  v_portfolio text := v_ans ->> 'portfolio_signal';
  v_portfolio_score numeric := case v_portfolio when 'strong' then 1.0 when 'partial' then 0.5 else 0.0 end;
  -- YENİ sinyaller
  v_management numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'management_interest')::numeric, 3) - 1) / 4));
  v_cert_openness numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'hands_on_certification_openness')::numeric, 3) - 1) / 4));
  v_client_facing numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'client_facing_comfort')::numeric, 3) - 1) / 4));
  v_flexible numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'structured_vs_flexible')::numeric, 3) - 1) / 4));
  v_mission numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'mission_driven_motivation')::numeric, 3) - 1) / 4));
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
  v_intl := v_tech * 0.20 + v_lang * 0.20 + v_leadership * 0.15 + v_management * 0.10
            + (case when v_env = 'corporate' then 0.2 else 0 end) + (1 - v_risk) * 0.10 + v_client_facing * 0.05;
  v_acad := v_research * 0.35 + v_study * 0.25 + v_fav_research * 0.15
            + (case when v_env = 'academic' then 0.15 else 0 end) + v_cert_openness * 0.10;
  v_voc := v_hands * 0.35 + v_fav_building * 0.15 + v_study * 0.15
           + (case when v_env = 'field_work' then 0.15 else 0 end) + v_cert_openness * 0.20;
  v_startup := v_risk * 0.25 + v_entre * 0.30 + v_salary_pref * 0.10 + v_client_facing * 0.10
               + (case when v_env = 'startup' then 0.15 else 0 end) + v_flexible * 0.10;
  v_remote := v_tech * 0.25 + v_portfolio_score * 0.25 + v_entre * 0.15 + v_flexible * 0.20
              + (case when v_env = 'freelance' then 0.15 else 0 end);
  v_public := v_people * 0.25 + v_fav_people * 0.15 + v_healthcare * 0.10 + v_lang * 0.10 + v_mission * 0.25
              + (case when v_env = 'public' then 0.10 else 0 end) + v_client_facing * 0.05;

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

-- ===========================================================================
-- 7) expat_lifestyle_persona (+10: travel_frequency, remote_vs_office_pref,
--    cuisine_openness, outdoor_activity_level, financial_risk_comfort,
--    long_term_settle_intent, hobby_social_mix, pace_of_life_pref,
--    decision_making_style, cultural_curiosity)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'expat_lifestyle_persona';

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
  ('expat_lifestyle_persona', 'city_vs_nature', 'both', 'lifestyle',
   'Büyük şehir mi doğa/sakinlik mi?', '1 = doğa, 5 = şehir', 'scale', '[]'::jsonb, false, 9),
  ('expat_lifestyle_persona', 'sharing', 'both', 'lifestyle',
   'Sonucunu toplulukla paylaşmak ister misin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 10),
  -- YENİ (+10)
  ('expat_lifestyle_persona', 'travel_frequency', 'both', 'lifestyle',
   'Yeni yerleştiğin ülkede/bölgede sık seyahat eder misin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 11),
  ('expat_lifestyle_persona', 'remote_vs_office_pref', 'both', 'lifestyle',
   'Uzaktan mı ofis/saha mı çalışmayı tercih edersin?', '1 = ofis/saha, 5 = uzaktan', 'scale', '[]'::jsonb, false, 12),
  ('expat_lifestyle_persona', 'cuisine_openness', 'both', 'lifestyle',
   'Yerel mutfağı/yeni yemekleri denemeye açıklığın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 13),
  ('expat_lifestyle_persona', 'outdoor_activity_level', 'both', 'lifestyle',
   'Açık hava aktivitesi (doğa yürüyüşü, spor) yaşam tarzında ne kadar yer tutar?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 14),
  ('expat_lifestyle_persona', 'financial_risk_comfort', 'both', 'lifestyle',
   'Finansal belirsizliğe (düzensiz gelir, yeni pazar) rahatlığın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 15),
  ('expat_lifestyle_persona', 'long_term_settle_intent', 'both', 'lifestyle',
   'Uzun vadede kalıcı yerleşme niyetin ne kadar güçlü?', '1 = geçici, 5 = kalıcı', 'scale', '[]'::jsonb, false, 16),
  ('expat_lifestyle_persona', 'hobby_social_mix', 'both', 'lifestyle',
   'Hobiler/sosyal hayatı yalnız mı grup halinde mi yaşarsın?', '1 = yalnız, 5 = grupla', 'scale', '[]'::jsonb, false, 17),
  ('expat_lifestyle_persona', 'pace_of_life_pref', 'both', 'lifestyle',
   'Hayat temposun nasıl olsun istersin?', '1 = yavaş/sakin, 5 = hızlı/yoğun', 'scale', '[]'::jsonb, false, 18),
  ('expat_lifestyle_persona', 'decision_making_style', 'both', 'lifestyle',
   'Büyük kararları nasıl alırsın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','analytical','label','Analitik/veriye dayalı'),
     jsonb_build_object('value','intuitive','label','Sezgisel/hızlı'),
     jsonb_build_object('value','consultative','label','Başkalarına danışarak')
   ), false, 19),
  ('expat_lifestyle_persona', 'cultural_curiosity', 'both', 'lifestyle',
   'Farklı kültürleri/gelenekleri öğrenmeye merakın?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 20);

create or replace function public.relocation_score_expat_lifestyle_persona_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  v_social numeric   := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'social_energy')::numeric, 3) - 1) / 4));
  v_plan numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'planning_style')::numeric, 3) - 1) / 4));
  v_lang numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'local_language')::numeric, 3) - 1) / 4));
  v_comm numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'community_need')::numeric, 3) - 1) / 4));
  v_comfort numeric  := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'comfort_zone')::numeric, 3) - 1) / 4));
  v_career numeric   := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'career_focus')::numeric, 3) - 1) / 4));
  v_family numeric   := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'family_rhythm')::numeric, 3) - 1) / 4));
  v_city numeric     := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'city_vs_nature')::numeric, 3) - 1) / 4));
  v_weekend text := v_ans ->> 'weekend_style';
  -- YENİ sinyaller
  v_travel numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'travel_frequency')::numeric, 3) - 1) / 4));
  v_remote_pref numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'remote_vs_office_pref')::numeric, 3) - 1) / 4));
  v_cuisine numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'cuisine_openness')::numeric, 3) - 1) / 4));
  v_outdoor numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'outdoor_activity_level')::numeric, 3) - 1) / 4));
  v_fin_risk numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'financial_risk_comfort')::numeric, 3) - 1) / 4));
  v_settle numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'long_term_settle_intent')::numeric, 3) - 1) / 4));
  v_hobby_social numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'hobby_social_mix')::numeric, 3) - 1) / 4));
  v_pace numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'pace_of_life_pref')::numeric, 3) - 1) / 4));
  v_culture_curiosity numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'cultural_curiosity')::numeric, 3) - 1) / 4));
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
  v_global := v_social * 0.30 + v_career * 0.20 + v_city * 0.20 + v_pace * 0.15 + v_hobby_social * 0.10
              + case when v_weekend = 'network_event' then 0.10 else 0 end;
  v_quiet := (1 - v_social) * 0.25 + (1 - v_city) * 0.20 + (1 - v_plan) * 0.15 + (1 - v_comfort) * 0.10
              + (1 - v_pace) * 0.15 + (1 - v_hobby_social) * 0.10
              + case when v_weekend = 'quiet_cafe' then 0.10 else 0 end;
  v_adventure := v_plan * 0.25 + v_comfort * 0.25 + (1 - v_city) * 0.10 + v_lang * 0.10
              + v_travel * 0.10 + v_outdoor * 0.10 + v_cuisine * 0.05 + v_culture_curiosity * 0.05
              + case when v_weekend = 'hiking' then 0.10 else 0 end;
  v_family_p := v_family * 0.35 + (1 - v_comfort) * 0.15 + (1 - v_plan) * 0.15 + (1 - v_social) * 0.10
              + v_settle * 0.15 + (1 - v_fin_risk) * 0.10
              + case when v_weekend = 'family_market' then 0.10 else 0 end;
  v_career_p := v_career * 0.30 + v_city * 0.20 + v_social * 0.15 + v_fin_risk * 0.10 + v_remote_pref * 0.10
              + v_pace * 0.05
              + case when v_weekend = 'network_event' then 0.10 else 0 end;
  v_community := v_comm * 0.35 + v_lang * 0.20 + v_social * 0.15 + v_culture_curiosity * 0.15 + v_settle * 0.05
              + case when v_weekend = 'family_market' then 0.10 else 0 end;

  v_scores := jsonb_build_object(
    'global_networker', round(v_global, 4),
    'quiet_local', round(v_quiet, 4),
    'adventure_seeker', round(v_adventure, 4),
    'family_planner', round(v_family_p, 4),
    'career_builder', round(v_career_p, 4),
    'community_anchor', round(v_community, 4)
  );

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
    null,
    v_top_key,
    jsonb_build_object(
      'persona_key', v_top_key,
      'persona_label', v_persona_label,
      'is_hybrid', v_is_hybrid,
      'secondary_key', case when v_is_hybrid then v_second_key else null end
    ),
    v_scores,
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

-- ===========================================================================
-- 8) first_90_days_planner — ZATEN 20 soru; yeni soru YOK, sadece mode='both' dönüşümü.
--    RPC'ye dokunulmaz (soru sayısı/anahtarları değişmiyor).
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'first_90_days_planner';

delete from public.relocation_tool_questions where tool_key = 'first_90_days_planner';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  ('first_90_days_planner', 'destination', 'both', 'plan', 'Hedef ülke/şehir?', 'ISO ülke kodu veya şehir', 'country', '[]'::jsonb, true, 1),
  ('first_90_days_planner', 'arrival_date', 'both', 'plan', 'Tahmini varış tarihin?', null, 'date', '[]'::jsonb, true, 2),
  ('first_90_days_planner', 'visa_status', 'both', 'legal', 'Vize/oturum durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','approved','label','Onaylı'),
     jsonb_build_object('value','applied','label','Başvurdum'),
     jsonb_build_object('value','researching','label','Araştırıyorum'),
     jsonb_build_object('value','not_needed','label','Gerekmiyor'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 3),
  ('first_90_days_planner', 'housing_status', 'both', 'housing', 'İlk konaklama durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','secured','label','Hazır'),
     jsonb_build_object('value','temporary','label','Geçici'),
     jsonb_build_object('value','searching','label','Arıyorum'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 4),
  ('first_90_days_planner', 'health_insurance', 'both', 'health', 'Sağlık sigortası planın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','active','label','Aktif'),
     jsonb_build_object('value','employer','label','İşveren sağlıyor'),
     jsonb_build_object('value','will_buy','label','Alacağım'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 5),
  ('first_90_days_planner', 'banking', 'both', 'finance', 'Yerel banka/ödeme çözümü planın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazır'),
     jsonb_build_object('value','researching','label','Araştırıyorum'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 6),
  ('first_90_days_planner', 'phone_internet', 'both', 'logistics', 'Telefon/internet planın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazır'),
     jsonb_build_object('value','temporary','label','Geçici'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 7),
  ('first_90_days_planner', 'address_registration_known', 'both', 'legal', 'Adres/belediye kaydı gerekliliğini biliyor musun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_applicable','label','Geçerli değil')
   ), true, 8),
  ('first_90_days_planner', 'documents_ready', 'both', 'legal', 'Belgelerinin dijital/fiziksel kopyaları hazır mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','partial','label','Kısmen'),
     jsonb_build_object('value','no','label','Hayır')
   ), true, 9),
  ('first_90_days_planner', 'emergency_contacts', 'both', 'logistics', 'Acil iletişimleri kaydettin mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır')
   ), true, 10),
  ('first_90_days_planner', 'transport', 'both', 'logistics', 'İlk hafta ulaşım planın?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','public_transport','label','Toplu taşıma'),
     jsonb_build_object('value','car','label','Araç'),
     jsonb_build_object('value','taxi','label','Taksi'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 11),
  ('first_90_days_planner', 'job_start', 'both', 'work', 'İş/okul başlangıç tarihin belli mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_applicable','label','Geçerli değil')
   ), true, 12),
  ('first_90_days_planner', 'children_school', 'both', 'family', 'Çocuk okul/kayıt ihtiyacı var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 13),
  ('first_90_days_planner', 'pets', 'both', 'family', 'Evcil hayvan taşınması var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 14),
  ('first_90_days_planner', 'language_course', 'both', 'integration', 'Dil kursu/entegrasyon programı ihtiyacın var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır'), jsonb_build_object('value','not_sure','label','Emin değilim')), false, 15),
  ('first_90_days_planner', 'community_intro', 'both', 'integration', 'İlk ay topluluk/mentor desteği ister misin?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 16),
  ('first_90_days_planner', 'tax_social_security', 'both', 'legal', 'Vergi/sosyal güvenlik adımlarını biliyor musun?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır'), jsonb_build_object('value','not_applicable','label','Geçerli değil')), false, 17),
  ('first_90_days_planner', 'credential_recognition', 'both', 'work', 'Mesleki denklik/lisans adımı gerekiyor mu?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır'), jsonb_build_object('value','not_sure','label','Emin değilim')), false, 18),
  ('first_90_days_planner', 'driving_license', 'both', 'logistics', 'Ehliyet dönüşümü/araç ihtiyacı var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 19),
  ('first_90_days_planner', 'notification_consent', 'both', 'integration', 'Görev hatırlatmaları almak ister misin?', 'E-posta / uygulama içi', 'consent', '[]'::jsonb, false, 20);

-- ===========================================================================
-- 9) top_relocation_challenge (+11: housing_state, language_state, finance_state,
--    previous_relocation_experience, support_system_detail, biggest_fear,
--    timeline_flexibility, budget_buffer, information_confidence,
--    decision_paralysis, action_readiness)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'top_relocation_challenge';

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
  ('top_relocation_challenge', 'documents_state', 'both', 'challenge',
   'Evrak/vize tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','clear','label','Net/hazır'),
     jsonb_build_object('value','partial','label','Kısmen hazır'),
     jsonb_build_object('value','confused','label','Kafam karışık')
   ), false, 6),
  ('top_relocation_challenge', 'income_state', 'both', 'challenge',
   'Gelir/iş tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','secured','label','Garanti/işim var'),
     jsonb_build_object('value','searching','label','Arıyorum'),
     jsonb_build_object('value','not_started','label','Henüz başlamadım')
   ), false, 7),
  ('top_relocation_challenge', 'support_state', 'both', 'challenge',
   'Destek ağı durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü'),
     jsonb_build_object('value','weak','label','Zayıf'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 8),
  ('top_relocation_challenge', 'health_family_complexity', 'both', 'challenge',
   'Sağlık/aile/okul gibi ek karmaşıklık var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','children','label','Çocuk'),
     jsonb_build_object('value','chronic_access_need','label','Süreklilik gerektiren sağlık erişimi'),
     jsonb_build_object('value','pets','label','Evcil hayvan'),
     jsonb_build_object('value','elder_support','label','Yaşlı bakımı'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 9),
  -- YENİ (+11)
  ('top_relocation_challenge', 'housing_state', 'both', 'challenge',
   'Konut tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','secured','label','Hazır/garanti'),
     jsonb_build_object('value','searching','label','Arıyorum'),
     jsonb_build_object('value','not_started','label','Henüz başlamadım')
   ), false, 10),
  ('top_relocation_challenge', 'language_state', 'both', 'challenge',
   'Dil tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','confident','label','Yeterli/güvenim var'),
     jsonb_build_object('value','learning','label','Öğreniyorum'),
     jsonb_build_object('value','stuck','label','Zorlanıyorum')
   ), false, 11),
  ('top_relocation_challenge', 'finance_state', 'both', 'challenge',
   'Finans/bütçe tarafında durum?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','comfortable','label','Rahat'),
     jsonb_build_object('value','tight','label','Dar ama yönetilebilir'),
     jsonb_build_object('value','critical','label','Kritik/yetersiz')
   ), false, 12),
  ('top_relocation_challenge', 'previous_relocation_experience', 'both', 'challenge',
   'Daha önce yurt dışına taşınma deneyimin oldu mu?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes_multiple','label','Evet, birden fazla kez'),
     jsonb_build_object('value','yes_once','label','Evet, bir kez'),
     jsonb_build_object('value','no','label','Hayır, ilk kez')
   ), false, 13),
  ('top_relocation_challenge', 'support_system_detail', 'both', 'challenge',
   'Destek ağın kimlerden oluşuyor?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','family','label','Aile'),
     jsonb_build_object('value','friends','label','Arkadaşlar'),
     jsonb_build_object('value','community_groups','label','Topluluk grupları'),
     jsonb_build_object('value','professional_advisors','label','Profesyonel danışmanlar'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 14),
  ('top_relocation_challenge', 'biggest_fear', 'both', 'challenge',
   'Bu süreçte en büyük korkun ne?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','financial_failure','label','Finansal başarısızlık'),
     jsonb_build_object('value','social_isolation','label','Sosyal izolasyon'),
     jsonb_build_object('value','career_setback','label','Kariyer gerilemesi'),
     jsonb_build_object('value','legal_rejection','label','Vize/yasal ret'),
     jsonb_build_object('value','none','label','Belirgin bir korkum yok')
   ), false, 15),
  ('top_relocation_challenge', 'timeline_flexibility', 'both', 'challenge',
   'Taşınma takvimin esnek mi (gerekirse ertelenebilir mi)?', '1 = esnek değil, 5 = çok esnek', 'scale',
   '[]'::jsonb, false, 16),
  ('top_relocation_challenge', 'budget_buffer', 'both', 'challenge',
   'Beklenmedik masraflar için ayrılmış bir bütçe tamponun var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','partial','label','Kısmen'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 17),
  ('top_relocation_challenge', 'information_confidence', 'both', 'challenge',
   'Süreçle ilgili doğru bilgiye ulaştığından ne kadar eminsin?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 18),
  ('top_relocation_challenge', 'decision_paralysis', 'both', 'challenge',
   'Çok fazla seçenek/bilgi karar almanı zorlaştırıyor mu?', '1 = hiç zorlaştırmıyor, 5 = çok zorlaştırıyor', 'scale',
   '[]'::jsonb, false, 19),
  ('top_relocation_challenge', 'action_readiness', 'both', 'challenge',
   'Bugün somut bir adım atmaya ne kadar hazırsın?', '1 = düşük, 5 = yüksek', 'scale',
   '[]'::jsonb, false, 20);

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
  v_risk numeric;
  v_docs text := v_ans ->> 'documents_state';
  v_income text := v_ans ->> 'income_state';
  v_support text := v_ans ->> 'support_state';
  -- YENİ kategori-derinlik sinyalleri
  v_housing_state text := v_ans ->> 'housing_state';
  v_language_state text := v_ans ->> 'language_state';
  v_finance_state text := v_ans ->> 'finance_state';
  -- YENİ genel bağlam sinyalleri: karar felci/eylem hazırlığı urgency çarpanını hafifçe ayarlar,
  -- bütçe tamponu finance kategorisi bağımlılığını güçlendirir.
  v_action_ready numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'action_readiness')::numeric, 3) - 1) / 4));
  v_decision_paralysis numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'decision_paralysis')::numeric, 3) - 1) / 4));
  v_budget_buffer text := v_ans ->> 'budget_buffer';
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
  -- Karar felci arttıkça ve eylem hazırlığı azaldıkça risk hafifçe artar.
  v_risk := least((1 - v_conf) * 0.85 + v_decision_paralysis * 0.10 + (1 - v_action_ready) * 0.05, 1.0);

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
      (case when exists (select 1 from unnest(c.stress_keys) sk where sk = any ((select keys from stress)))
            then 1.0 else 0.0 end) as user_stress,
      (case when exists (select 1 from unnest(c.stress_keys) sk where sk = any ((select keys from blocked)))
            then 1.0 else 0.0 end) as progress_blocker,
      -- dependency_factor: kategoriye özel derinlik sinyalleri (0..1); YENİ housing/language/finance
      -- state soruları + bütçe tamponu finance için ek ağırlık sağlar.
      (case c.cat_key
        when 'visa_docs' then case v_docs when 'confused' then 1.0 when 'partial' then 0.5 else 0.0 end
        when 'job_income' then case v_income when 'not_started' then 1.0 when 'searching' then 0.6 else 0.0 end
        when 'housing' then case v_housing_state when 'not_started' then 1.0 when 'searching' then 0.6 else 0.0 end
        when 'language' then case v_language_state when 'stuck' then 1.0 when 'learning' then 0.5 else 0.0 end
        when 'finance' then
          (case v_finance_state when 'critical' then 1.0 when 'tight' then 0.5 else 0.0 end) * 0.7
          + (case v_budget_buffer when 'no' then 1.0 when 'partial' then 0.5 else 0.0 end) * 0.3
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
  v_ctas := v_ctas || jsonb_build_array(jsonb_build_object('key','find_mentor','label','Mentor Bul'));

  return public.rl_tool_write_result(
    p_session_id,
    'score',
    round(v_top_val * 100, 2),
    v_top_key,
    jsonb_build_object(
      'primary_challenge', v_top_key,
      'primary_label', v_labels ->> v_top_key,
      'top3', v_recs
    ),
    v_scores,
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

-- ===========================================================================
-- 10) job_finding_probability (+4: linkedin_profile_quality,
--     industry_specific_certifications, salary_research_done, local_recruiter_contact)
-- ===========================================================================
update public.relocation_tools
  set quick_question_count = 20, detailed_question_count = 20, updated_at = now()
  where key = 'job_finding_probability';

delete from public.relocation_tool_questions where tool_key = 'job_finding_probability';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  ('job_finding_probability', 'profession_title', 'both', 'career', 'Hedeflediğin iş/rol nedir?', 'Anahtar: software_engineer, civil_engineer, registered_nurse, accountant, teacher', 'single',
   jsonb_build_array(
     jsonb_build_object('value','software_engineer','label','Yazılım Mühendisi'),
     jsonb_build_object('value','civil_engineer','label','İnşaat Mühendisi'),
     jsonb_build_object('value','registered_nurse','label','Hemşire'),
     jsonb_build_object('value','accountant','label','Muhasebeci'),
     jsonb_build_object('value','teacher','label','Öğretmen')
   ), true, 1),
  ('job_finding_probability', 'target_country', 'both', 'plan', 'Hangi ülkede iş arıyorsun?', 'Tek ISO ülke kodu (ör. DE)', 'country', '[]'::jsonb, true, 2),
  ('job_finding_probability', 'years_experience', 'both', 'career', 'İlgili deneyim yılın?', '0-40', 'number', '[]'::jsonb, true, 3),
  ('job_finding_probability', 'seniority', 'both', 'career', 'Kıdem seviyen?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','junior','label','Junior'),
     jsonb_build_object('value','mid','label','Orta'),
     jsonb_build_object('value','senior','label','Senior'),
     jsonb_build_object('value','lead','label','Lead'),
     jsonb_build_object('value','manager','label','Yönetici')
   ), true, 4),
  ('job_finding_probability', 'language_level', 'both', 'skills', 'İş dilindeki seviyen?', '0 = hiç, 5 = ileri', 'scale', '[]'::jsonb, true, 5),
  ('job_finding_probability', 'work_authorization', 'both', 'legal', 'Çalışma izni/vize açısından durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','authorized','label','Çalışma iznim var'),
     jsonb_build_object('value','eligible','label','Uygunum (kolay)'),
     jsonb_build_object('value','needs_sponsor','label','Sponsor gerek'),
     jsonb_build_object('value','unknown','label','Bilmiyorum')
   ), true, 6),
  ('job_finding_probability', 'network', 'both', 'network', 'Hedef ülkede profesyonel bağlantın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','strong','label','Güçlü'),
     jsonb_build_object('value','weak','label','Zayıf'),
     jsonb_build_object('value','none','label','Yok')
   ), true, 7),
  ('job_finding_probability', 'education_level', 'both', 'career', 'Eğitim seviyen?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','vocational','label','Meslek okulu'),
     jsonb_build_object('value','bachelor','label','Lisans'),
     jsonb_build_object('value','master','label','Yüksek lisans'),
     jsonb_build_object('value','phd','label','Doktora'),
     jsonb_build_object('value','other','label','Diğer')
   ), false, 8),
  ('job_finding_probability', 'english_level', 'both', 'skills', 'İngilizce seviyen?', '0 = hiç, 5 = ileri', 'scale', '[]'::jsonb, false, 9),
  ('job_finding_probability', 'regulated_profession', 'both', 'legal', 'Mesleğin denklik/lisans gerektiriyor mu?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 10),
  ('job_finding_probability', 'credential_status', 'both', 'legal', 'Denklik/sertifika durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','recognized','label','Tanınmış'),
     jsonb_build_object('value','in_progress','label','Sürüyor'),
     jsonb_build_object('value','not_needed','label','Gerekmiyor'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 11),
  ('job_finding_probability', 'portfolio_cv', 'both', 'skills', 'CV/LinkedIn/portföyün hedef ülkeye uygun mu?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazır'),
     jsonb_build_object('value','partial','label','Kısmen'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 12),
  ('job_finding_probability', 'applications', 'both', 'network', 'Son 30 günde kaç başvuru yaptın?', '0-200', 'number', '[]'::jsonb, false, 13),
  ('job_finding_probability', 'interviews', 'both', 'network', 'Son 90 günde mülakat aldın mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','multiple','label','Birden fazla'),
     jsonb_build_object('value','one','label','Bir'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 14),
  ('job_finding_probability', 'salary_flexibility', 'both', 'plan', 'Maaş/rol esnekliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 15),
  ('job_finding_probability', 'remote_option', 'both', 'plan', 'Remote/hybrid/sponsor seçeneklerine açıksın?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','remote','label','Remote'),
     jsonb_build_object('value','hybrid','label','Hybrid'),
     jsonb_build_object('value','sponsor','label','Sponsor relocation'),
     jsonb_build_object('value','local_only','label','Sadece yerel')
   ), false, 16),
  -- YENİ (+4)
  ('job_finding_probability', 'linkedin_profile_quality', 'both', 'network',
   'LinkedIn/profesyonel profilin hedef ülke standartlarına ne kadar uygun?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 17),
  ('job_finding_probability', 'industry_specific_certifications', 'both', 'legal',
   'Sektöre özel ek sertifikaların var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','technical_cert','label','Teknik sertifika'),
     jsonb_build_object('value','language_cert','label','Dil sertifikası'),
     jsonb_build_object('value','professional_license','label','Mesleki lisans'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 18),
  ('job_finding_probability', 'salary_research_done', 'both', 'career',
   'Hedef ülke için piyasa maaş araştırması yaptın mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','thorough','label','Detaylı yaptım'),
     jsonb_build_object('value','basic','label','Temel düzeyde'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 19),
  ('job_finding_probability', 'local_recruiter_contact', 'both', 'network',
   'Hedef ülkede yerel bir recruiter/işe alım uzmanıyla temasın var mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','in_progress','label','Görüşme sürecinde'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 20);

create or replace function public.relocation_score_job_probability_v1(p_session_id uuid)
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
    jsonb_build_object('key','high','min',75),
    jsonb_build_object('key','medium_high','min',55),
    jsonb_build_object('key','challenging','min',40),
    jsonb_build_object('key','low','min',0));
  v_profession_key text := v_ans ->> 'profession_title';
  v_profession_id uuid;
  v_country text := upper(coalesce(v_ans ->> 'target_country', ''));
  v_signal public.relocation_job_market_signals%rowtype;
  v_demand numeric;
  v_lang_work numeric := public.rl_tool_clamp_neutral((coalesce((v_ans ->> 'language_level')::numeric, 2.5) / 5));
  v_lang_en numeric := public.rl_tool_clamp_neutral((coalesce((v_ans ->> 'english_level')::numeric, 2.5) / 5));
  v_language numeric;
  v_years numeric := coalesce((v_ans ->> 'years_experience')::numeric, 0);
  v_seniority text := v_ans ->> 'seniority';
  v_seniority_score numeric;
  v_portfolio text := v_ans ->> 'portfolio_cv';
  v_portfolio_score numeric;
  v_interviews text := v_ans ->> 'interviews';
  v_experience numeric;
  v_credential numeric;
  v_regulated text := v_ans ->> 'regulated_profession';
  v_cred_status text := v_ans ->> 'credential_status';
  v_work_auth text := v_ans ->> 'work_authorization';
  v_work_auth_score numeric;
  v_network text := v_ans ->> 'network';
  v_apps numeric := coalesce((v_ans ->> 'applications')::numeric, 0);
  v_network_activity numeric;
  v_breakdown jsonb;
  v_score100 numeric;
  v_bucket text;
  v_labels jsonb;
  v_weak jsonb;
  v_confidence numeric := 0.4;
  -- YENİ sinyaller
  v_linkedin_quality numeric := public.rl_tool_clamp_neutral(((coalesce((v_ans ->> 'linkedin_profile_quality')::numeric, 3) - 1) / 4));
  v_industry_certs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'industry_specific_certifications', '[]'::jsonb))), '{}'::text[]);
  v_industry_cert_score numeric := case when cardinality(v_industry_certs) = 0 or v_industry_certs = array['none'] then 0.5
    else least(cardinality(v_industry_certs)::numeric / 2.0, 1.0) end;
  v_salary_research text := v_ans ->> 'salary_research_done';
  v_salary_research_score numeric := case v_salary_research when 'thorough' then 1.0 when 'basic' then 0.5 else 0.2 end;
  v_recruiter_contact text := v_ans ->> 'local_recruiter_contact';
  v_recruiter_score numeric := case v_recruiter_contact when 'yes' then 1.0 when 'in_progress' then 0.5 else 0.0 end;
begin
  select weights into v_weights from public.relocation_tools where key = 'job_finding_probability';
  select id into v_profession_id from public.relocation_professions where profession_key = v_profession_key and is_active;

  if v_profession_id is not null and v_country <> '' then
    select * into v_signal from public.relocation_job_market_signals
    where profession_id = v_profession_id and country_code = v_country and is_active;
  end if;
  if found then
    v_demand := public.rl_tool_clamp_neutral(
      coalesce(v_signal.vacancy_index, 0.5) * 0.4
      + coalesce(v_signal.shortage_index, 0.5) * 0.4
      + coalesce(v_signal.unemployment_inverse_index, 0.5) * 0.2);
    v_confidence := v_signal.confidence;
  else
    v_demand := 0.5;
  end if;

  v_language := public.rl_tool_clamp_neutral(v_lang_work * 0.65 + v_lang_en * 0.35);

  v_seniority_score := case v_seniority
    when 'junior' then 0.3 when 'mid' then 0.55 when 'senior' then 0.8
    when 'lead' then 0.9 when 'manager' then 0.95 else 0.5 end;
  v_portfolio_score := case v_portfolio when 'ready' then 1.0 when 'partial' then 0.5 else 0.3 end;
  v_experience := public.rl_tool_clamp_neutral(
    least(v_years / 10.0, 1.0) * 0.35 + v_seniority_score * 0.25 + v_portfolio_score * 0.15
    + (case v_interviews when 'multiple' then 1.0 when 'one' then 0.6 else 0.2 end) * 0.15
    + v_salary_research_score * 0.10);

  v_credential := (case
    when v_regulated = 'no' then 0.9
    when v_cred_status = 'recognized' then 0.95
    when v_cred_status = 'not_needed' then 0.9
    when v_cred_status = 'in_progress' then 0.55
    when v_regulated = 'yes' and v_cred_status in ('none', '') then 0.25
    else 0.5 end) * 0.85 + v_industry_cert_score * 0.15;

  v_work_auth_score := case v_work_auth
    when 'authorized' then 1.0 when 'eligible' then 0.75
    when 'needs_sponsor' then 0.4 else 0.4 end;

  v_network_activity := public.rl_tool_clamp_neutral(
    (case v_network when 'strong' then 1.0 when 'weak' then 0.5 else 0.2 end) * 0.35
    + least(v_apps / 20.0, 1.0) * 0.20
    + (case v_interviews when 'multiple' then 1.0 when 'one' then 0.6 else 0.2 end) * 0.15
    + v_linkedin_quality * 0.15
    + v_recruiter_score * 0.15);

  v_breakdown := jsonb_build_object(
    'demand_fit', round(v_demand, 4),
    'language_fit', round(v_language, 4),
    'experience_signal', round(v_experience, 4),
    'credential_fit', round(v_credential, 4),
    'work_authorization_fit', round(v_work_auth_score, 4),
    'network_activity_fit', round(v_network_activity, 4)
  );

  v_score100 := round(public.rl_tool_weighted_score(v_breakdown, v_weights) * 100, 2);
  v_bucket := public.rl_tool_resolve_bucket(v_score100, v_bands);

  v_labels := jsonb_build_object(
    'demand_fit', 'Talep Uyumu',
    'language_fit', 'Dil',
    'experience_signal', 'Deneyim Sinyali',
    'credential_fit', 'Denklik',
    'work_authorization_fit', 'Çalışma İzni',
    'network_activity_fit', 'Network & Aktivite');

  select coalesce(jsonb_agg(
    jsonb_build_object('key', dim, 'title', v_labels ->> dim, 'score', val,
      'detail', 'Hızlı kazanım: ' || (v_labels ->> dim) || ' alanını güçlendir.')
    order by val asc), '[]'::jsonb)
  into v_weak
  from (select key as dim, value::numeric as val,
               row_number() over (order by value::numeric asc, key) as rn
        from jsonb_each_text(v_breakdown)) r
  where rn <= 3;

  return public.rl_tool_write_result(
    p_session_id,
    'score',
    v_score100,
    v_bucket,
    jsonb_build_object('weakest3', v_weak, 'score', v_score100),
    v_breakdown,
    v_weak,
    jsonb_build_array(
      'İş bulma skorun: ' || v_score100::text || '/100 (karar destek skoru, garanti değildir).',
      'En zayıf alanlarınla başla; talep ve dil sinyalin skoru en çok etkiler.'),
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Maaş Karşılaştırması','href','/relocation/tools/meslek-maas-karsilastirma'),
      jsonb_build_object('key','find_mentor','label','Diaspora Mentor Eşleşmesi','href','/relocation/tools/diaspora-ag-eslestirme'),
      jsonb_build_object('key','start_related_tool','label','Kariyer Yolu Roadmap','href','/relocation/tools/yurtdisi-kariyer-yolu')),
    jsonb_build_object('confidence', v_confidence),
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_job_probability_v1(uuid) to authenticated;
