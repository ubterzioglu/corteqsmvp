-- Meslek/Maaş Karşılaştırma — hedef ülke seçim limiti 5'ten 3'e düşürüldü.
-- Frontend karşılığı: src/components/relocation/tools/QuestionRenderer.tsx
--   MAX_COUNTRY_SELECTION = 3 (yardım metni bu sabitten üretilir).

update public.relocation_tool_questions
set
  help_tr = 'En az 1, en fazla 3 ülke seç. Çok geniş seçim sonucu yavaşlatabilir.',
  validation = coalesce(validation, '{}'::jsonb) || jsonb_build_object(
    'ui', 'country_multi_select',
    'minSelected', 1,
    'maxSelected', 3
  )
where tool_key = 'profession_salary'
  and question_key = 'target_countries';
