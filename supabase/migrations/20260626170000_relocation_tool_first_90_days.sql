-- Relocation Tools — #8 İlk 90 Gün Planlayıcı (first_90_days_planner).
-- Sözleşme: docs/10tool/08-ilk-90-gun-planlayici-e2e.md. result_kind = checklist.
-- Skor yerine GÖREV üretir: cevap "gap"lerinden 5 fazlı timeline.
--
-- AYNA SÖZLEŞMESİ: görev kataloğu (tetikleyici cevap + faz + öncelik) + priority_score formülü
-- hem bu RPC'de hem src/lib/relocation-tools-planner.ts'te birebir (relocation-tools-planner.test.ts kilitler).
-- priority_score = deadline_urgency*0.40 + legal_dependency*0.25 + user_gap*0.25 + source_trust*0.10

-- ---------------------------------------------------------------------------
-- 1) Araç seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'first_90_days_planner',
  'ilk-90-gun-planlayici',
  'İlk 90 Gün Planlayıcı — Taşınma Sonrası Görev Motoru',
  'First 90 Days Planner',
  'Varış öncesi ve sonrası ilk 90 gün için sana özel, öncelikli bir görev takvimi üretir.',
  'relocation_assessment',
  12, 20, 'checklist', true, true, 50,
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
-- 2) Soru seed (idempotent). Çoğu single; gap tespiti için option değerleri.
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'first_90_days_planner';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (12)
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
  -- DETAILED (+8)
  ('first_90_days_planner', 'children_school', 'detailed', 'family', 'Çocuk okul/kayıt ihtiyacı var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 13),
  ('first_90_days_planner', 'pets', 'detailed', 'family', 'Evcil hayvan taşınması var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 14),
  ('first_90_days_planner', 'language_course', 'detailed', 'integration', 'Dil kursu/entegrasyon programı ihtiyacın var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır'), jsonb_build_object('value','not_sure','label','Emin değilim')), false, 15),
  ('first_90_days_planner', 'community_intro', 'detailed', 'integration', 'İlk ay topluluk/mentor desteği ister misin?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 16),
  ('first_90_days_planner', 'tax_social_security', 'detailed', 'legal', 'Vergi/sosyal güvenlik adımlarını biliyor musun?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır'), jsonb_build_object('value','not_applicable','label','Geçerli değil')), false, 17),
  ('first_90_days_planner', 'credential_recognition', 'detailed', 'work', 'Mesleki denklik/lisans adımı gerekiyor mu?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır'), jsonb_build_object('value','not_sure','label','Emin değilim')), false, 18),
  ('first_90_days_planner', 'driving_license', 'detailed', 'logistics', 'Ehliyet dönüşümü/araç ihtiyacı var mı?', null, 'single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')), false, 19),
  ('first_90_days_planner', 'notification_consent', 'detailed', 'integration', 'Görev hatırlatmaları almak ister misin?', 'E-posta / uygulama içi', 'consent', '[]'::jsonb, false, 20);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_first_90_days_v1 — cevap gap'lerinden görev timeline'ı üretir.
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_first_90_days_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  -- Varış yakınlığı → deadline aciliyeti çarpanı (tarih yoksa nötr 0.6).
  v_arrival text := v_ans ->> 'arrival_date';
  v_days_to numeric;
  v_proximity numeric;
  v_phase_order jsonb := jsonb_build_object(
    'before_departure', 1, 'day_0_7', 2, 'day_8_30', 3, 'day_31_90', 4, 'ongoing', 5);
  v_tasks jsonb;
  v_top3 jsonb;
  v_task_count integer;
  v_source_link_count integer;
begin
  begin
    v_days_to := case when v_arrival ~ '^\d{4}-\d{2}-\d{2}$'
      then (v_arrival::date - current_date) else null end;
  exception when others then v_days_to := null; end;

  -- Yakınlık 0..1: <=7g → 1.0, >=180g → 0.3, arası lineer; tarih yok → 0.6.
  v_proximity := case
    when v_days_to is null then 0.6
    when v_days_to <= 7 then 1.0
    when v_days_to >= 180 then 0.3
    else round(1.0 - (v_days_to - 7) / 173.0 * 0.7, 3)
  end;

  -- Görev kataloğu: (task_key, phase, legal_dependency, base_urgency, gap_test, title, source_has_link)
  -- gap_test true ise görev üretilir. before_departure görevleri deadline'da +0.15 ek aciliyet alır.
  with catalog as (
    select * from (values
      ('health_insurance_setup', 'before_departure', 0.7, 0.9,
        (v_ans ->> 'health_insurance') in ('will_buy','none') or v_ans ->> 'health_insurance' is null,
        'Sağlık sigortasını netleştir', true),
      ('visa_finalize', 'before_departure', 1.0, 1.0,
        (v_ans ->> 'visa_status') in ('applied','researching','none'),
        'Vize/oturum sürecini tamamla', true),
      ('housing_secure', 'before_departure', 0.4, 0.85,
        (v_ans ->> 'housing_status') in ('searching','none') or v_ans ->> 'housing_status' is null,
        'İlk ay konaklamayı garantiye al', false),
      ('documents_copies', 'before_departure', 0.6, 0.7,
        (v_ans ->> 'documents_ready') in ('partial','no') or v_ans ->> 'documents_ready' is null,
        'Belgelerinin dijital + fiziksel kopyalarını hazırla', false),
      ('pets_transfer', 'before_departure', 0.5, 0.6,
        (v_ans ->> 'pets') = 'yes', 'Evcil hayvan taşıma/sağlık evraklarını tamamla', true),
      ('emergency_save', 'day_0_7', 0.3, 0.8,
        (v_ans ->> 'emergency_contacts') = 'no' or v_ans ->> 'emergency_contacts' is null,
        'Acil iletişim numaralarını kaydet', true),
      ('phone_line', 'day_0_7', 0.2, 0.7,
        (v_ans ->> 'phone_internet') in ('temporary','none') or v_ans ->> 'phone_internet' is null,
        'Yerel telefon/internet hattı edin', false),
      ('address_registration', 'day_0_7', 0.9, 0.85,
        (v_ans ->> 'address_registration_known') = 'no'
          or (v_ans ->> 'address_registration_known') is null,
        'Adres/belediye kaydı için randevu kontrolü yap', true),
      ('transport_setup', 'day_0_7', 0.2, 0.5,
        (v_ans ->> 'transport') = 'none' or v_ans ->> 'transport' is null,
        'İlk hafta ulaşım planını kur', false),
      ('banking_open', 'day_8_30', 0.5, 0.7,
        (v_ans ->> 'banking') in ('researching','none') or v_ans ->> 'banking' is null,
        'Yerel banka hesabı / ödeme çözümü aç', false),
      ('tax_social', 'day_8_30', 0.8, 0.6,
        (v_ans ->> 'tax_social_security') = 'no',
        'Vergi/sosyal güvenlik kayıt adımlarını öğren', true),
      ('school_enroll', 'day_8_30', 0.6, 0.75,
        (v_ans ->> 'children_school') = 'yes', 'Çocuk okul kaydını başlat', true),
      ('community_connect', 'day_8_30', 0.1, 0.4,
        (v_ans ->> 'community_intro') = 'yes', 'Topluluk/mentor desteğiyle bağlan', false),
      ('credential_apply', 'day_31_90', 0.7, 0.55,
        (v_ans ->> 'credential_recognition') in ('yes','not_sure'),
        'Mesleki denklik/lisans başvurusunu başlat', true),
      ('language_course', 'day_31_90', 0.2, 0.4,
        (v_ans ->> 'language_course') in ('yes','not_sure'),
        'Dil kursu/entegrasyon programına kaydol', false),
      ('permanent_housing', 'day_31_90', 0.3, 0.5,
        (v_ans ->> 'housing_status') in ('temporary','searching','none'),
        'Kalıcı konut araştırmasını ilerlet', false),
      ('driving_convert', 'day_31_90', 0.5, 0.4,
        (v_ans ->> 'driving_license') = 'yes', 'Ehliyet dönüşümü işlemlerini yap', true),
      ('integration_routine', 'ongoing', 0.2, 0.3,
        true, 'Yenileme/entegrasyon rutinini takvimine al', false)
    ) as t(task_key, phase, legal_dependency, base_urgency, gap_test, title, source_has_link)
  ),
  emitted as (
    select
      task_key, phase, title, source_has_link,
      -- deadline_urgency: faz tabanlı (erken faz daha acil) × varış yakınlığı, base_urgency ile harman.
      round(
        (case phase
           when 'before_departure' then 1.0
           when 'day_0_7' then 0.85
           when 'day_8_30' then 0.6
           when 'day_31_90' then 0.4
           else 0.25 end) * 0.5 + base_urgency * 0.3 + v_proximity * 0.2,
        4) as deadline_urgency,
      legal_dependency,
      1.0 as user_gap,
      case when source_has_link then 0.8 else 0.4 end as source_trust
    from catalog
    where gap_test
  ),
  scored as (
    select
      task_key, phase, title,
      round(deadline_urgency * 0.40 + legal_dependency * 0.25 + user_gap * 0.25 + source_trust * 0.10, 4) as priority_score
    from emitted
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object('key', task_key, 'title', title, 'phase', phase, 'priority', priority_score)
      order by (v_phase_order ->> phase)::int, priority_score desc
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object('key', task_key, 'title', title, 'phase', phase, 'score', priority_score)
                       order by priority_score desc)
      from (select task_key, title, phase, priority_score from scored order by priority_score desc limit 3) t3
    ), '[]'::jsonb),
    count(*)
  into v_tasks, v_top3, v_task_count
  from scored;

  select count(*) into v_source_link_count
  from jsonb_array_elements(v_tasks) t
  where (t ->> 'key') in (
    select task_key from (values
      ('health_insurance_setup'),('visa_finalize'),('pets_transfer'),('emergency_save'),
      ('address_registration'),('tax_social'),('school_enroll'),('credential_apply'),('driving_convert')
    ) s(task_key)
  );

  return public.rl_tool_write_result(
    p_session_id,
    'checklist',
    null,
    null,
    jsonb_build_object('tasks', v_tasks, 'task_count', v_task_count, 'source_link_count', v_source_link_count),
    '{}'::jsonb,
    v_top3,
    jsonb_build_array(
      'İlk 90 gün planında ' || v_task_count::text || ' görev var.',
      v_source_link_count::text || ' görev resmi kaynak adımı içeriyor; en kritik 3''ten başla.'
    ),
    jsonb_build_array(
      jsonb_build_object('key','view_relocation_plan','label','Görevleri Taşınma Planında Gör'),
      jsonb_build_object('key','open_service_finder','label','Şehirdeki Servis Önerileri'),
      jsonb_build_object('key','find_mentor','label','Mentor/Topluluk Desteği')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_first_90_days_v1(uuid) to authenticated;
