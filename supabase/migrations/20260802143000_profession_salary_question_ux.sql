-- Meslek/Maaş Karşılaştırma — soru metinleri ve UI metadata netleştirme.
-- Frontend target_countries için searchable multi-select kullanır; RPC uyumu için
-- cevap hâlâ "DE,NL" gibi virgüllü ISO kod string'i olarak saklanır.

update public.relocation_tool_questions
set
  help_tr = 'Mesleğini listeden ara ve en yakın rolü seç. Veri olmayan mesleklerde sonuç çıkmayabilir.',
  validation = coalesce(validation, '{}'::jsonb) || jsonb_build_object(
    'ui', 'profession_combobox'
  )
where tool_key = 'profession_salary'
  and question_key = 'profession_title';

update public.relocation_tool_questions
set
  prompt_tr = 'Hangi ülkeleri karşılaştırmak istiyorsun?',
  help_tr = 'En az 1, en fazla 5 ülke seç. Çok geniş seçim sonucu yavaşlatabilir.',
  validation = coalesce(validation, '{}'::jsonb) || jsonb_build_object(
    'ui', 'country_multi_select',
    'minSelected', 1,
    'maxSelected', 5
  )
where tool_key = 'profession_salary'
  and question_key = 'target_countries';

update public.relocation_tool_questions
set
  prompt_tr = 'Belirli şehirleri dahil etmek ister misin?',
  help_tr = 'Şehir adlarını virgülle yazabilirsin. Belirli şehir yoksa "Şehir fark etmez" seç.',
  validation = coalesce(validation, '{}'::jsonb) || jsonb_build_object(
    'placeholder', 'Örn: Berlin, Amsterdam veya Şehir fark etmez',
    'quickFill', 'Şehir fark etmez'
  )
where tool_key = 'profession_salary'
  and question_key = 'target_cities';
