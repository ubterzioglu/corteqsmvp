-- Relocation Tools — #10 İş Bulma Olasılığı (job_finding_probability).
-- Sözleşme: docs/10tool/10-is-bulma-olasiligi-e2e.md. result_kind = score (tek ülke).
-- relocation_job_market_signals seed tablosu + araç/soru + relocation_score_job_probability_v1.
--
-- AYNA SÖZLEŞMESİ: ağırlıklar (demand 0.30 / language 0.20 / experience 0.15 / credential 0.15 /
-- work_auth 0.10 / network 0.10) + boyut türetme + bucket hem bu RPC'de hem
-- src/lib/relocation-tools-jobprob.ts'te birebir (relocation-tools-jobprob.test.ts kilitler).
-- relocation_professions temelini #2/#6 ile paylaşır.

-- ---------------------------------------------------------------------------
-- 1) relocation_job_market_signals (meslek × ülke; public read)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_job_market_signals (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid references public.relocation_professions(id) on delete cascade,
  country_code text not null,
  vacancy_index numeric(6,3),                        -- 0..1
  shortage_index numeric(6,3),                        -- 0..1 (yüksek = açık çok)
  unemployment_inverse_index numeric(6,3),            -- 0..1 (yüksek = düşük işsizlik)
  regulated_profession boolean,
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  freshness_at timestamptz,
  confidence numeric(4,3) not null default 0.50,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.relocation_job_market_signals enable row level security;
drop policy if exists relocation_job_market_signals_read on public.relocation_job_market_signals;
create policy relocation_job_market_signals_read on public.relocation_job_market_signals
  for select to authenticated using (is_active);

create unique index if not exists relocation_job_market_signals_uniq_idx
  on public.relocation_job_market_signals (profession_id, country_code);

-- Seed: 5 meslek × 8 ülke talep sinyalleri (küratörlü MVP).
insert into public.relocation_job_market_signals
  (profession_id, country_code, vacancy_index, shortage_index, unemployment_inverse_index, regulated_profession, confidence)
select p.id, s.country_code, s.vacancy, s.shortage, s.unemp_inv, s.regulated, 0.50
from public.relocation_professions p
join (values
  ('software_engineer','DE',0.90,0.85,0.85,false),
  ('software_engineer','NL',0.88,0.82,0.88,false),
  ('software_engineer','SE',0.80,0.75,0.82,false),
  ('software_engineer','CA',0.85,0.78,0.80,false),
  ('software_engineer','GB',0.86,0.80,0.78,false),
  ('software_engineer','US',0.92,0.80,0.82,false),
  ('software_engineer','PL',0.78,0.72,0.80,false),
  ('software_engineer','AE',0.80,0.70,0.85,false),
  ('civil_engineer','DE',0.70,0.65,0.85,true),
  ('civil_engineer','NL',0.66,0.60,0.88,true),
  ('civil_engineer','SE',0.60,0.55,0.82,true),
  ('civil_engineer','CA',0.74,0.68,0.80,true),
  ('civil_engineer','GB',0.66,0.58,0.78,true),
  ('civil_engineer','US',0.72,0.62,0.82,true),
  ('civil_engineer','PL',0.58,0.52,0.80,true),
  ('civil_engineer','AE',0.80,0.72,0.85,true),
  ('registered_nurse','DE',0.92,0.90,0.88,true),
  ('registered_nurse','NL',0.85,0.82,0.88,true),
  ('registered_nurse','SE',0.82,0.80,0.84,true),
  ('registered_nurse','CA',0.90,0.85,0.82,true),
  ('registered_nurse','GB',0.90,0.88,0.80,true),
  ('registered_nurse','US',0.92,0.86,0.82,true),
  ('registered_nurse','PL',0.72,0.68,0.80,true),
  ('registered_nurse','AE',0.85,0.78,0.85,true),
  ('accountant','DE',0.60,0.50,0.85,false),
  ('accountant','NL',0.58,0.48,0.88,false),
  ('accountant','SE',0.55,0.45,0.82,false),
  ('accountant','CA',0.64,0.55,0.80,false),
  ('accountant','GB',0.66,0.56,0.78,false),
  ('accountant','US',0.68,0.55,0.82,false),
  ('accountant','PL',0.54,0.45,0.80,false),
  ('accountant','AE',0.70,0.60,0.85,false),
  ('teacher','DE',0.62,0.55,0.85,true),
  ('teacher','NL',0.58,0.50,0.88,true),
  ('teacher','SE',0.55,0.48,0.82,true),
  ('teacher','CA',0.62,0.54,0.80,true),
  ('teacher','GB',0.64,0.56,0.78,true),
  ('teacher','US',0.60,0.50,0.82,true),
  ('teacher','PL',0.50,0.42,0.80,true),
  ('teacher','AE',0.70,0.60,0.85,true)
) as s(profession_key, country_code, vacancy, shortage, unemp_inv, regulated)
  on p.profession_key = s.profession_key
on conflict (profession_id, country_code) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Araç + soru seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'job_finding_probability',
  'is-bulma-olasiligi',
  'Yurt Dışında İş Bulma Şansınız? — İş Bulma Olasılığı',
  'Job-Finding Probability',
  'Meslek, ülke, dil, deneyim, denklik ve network sinyallerine göre açıklanabilir bir iş bulma skoru üretir (garanti değil, karar destek skoru).',
  'relocation_assessment',
  7, 16, 'score', true, true, 100,
  jsonb_build_object(
    'demand_fit', 0.30,
    'language_fit', 0.20,
    'experience_signal', 0.15,
    'credential_fit', 0.15,
    'work_authorization_fit', 0.10,
    'network_activity_fit', 0.10
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

delete from public.relocation_tool_questions where tool_key = 'job_finding_probability';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (7)
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
  -- DETAILED (+9)
  ('job_finding_probability', 'education_level', 'detailed', 'career', 'Eğitim seviyen?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','vocational','label','Meslek okulu'),
     jsonb_build_object('value','bachelor','label','Lisans'),
     jsonb_build_object('value','master','label','Yüksek lisans'),
     jsonb_build_object('value','phd','label','Doktora'),
     jsonb_build_object('value','other','label','Diğer')
   ), false, 8),
  ('job_finding_probability', 'english_level', 'detailed', 'skills', 'İngilizce seviyen?', '0 = hiç, 5 = ileri', 'scale', '[]'::jsonb, false, 9),
  ('job_finding_probability', 'regulated_profession', 'detailed', 'legal', 'Mesleğin denklik/lisans gerektiriyor mu?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 10),
  ('job_finding_probability', 'credential_status', 'detailed', 'legal', 'Denklik/sertifika durumun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','recognized','label','Tanınmış'),
     jsonb_build_object('value','in_progress','label','Sürüyor'),
     jsonb_build_object('value','not_needed','label','Gerekmiyor'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 11),
  ('job_finding_probability', 'portfolio_cv', 'detailed', 'skills', 'CV/LinkedIn/portföyün hedef ülkeye uygun mu?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','ready','label','Hazır'),
     jsonb_build_object('value','partial','label','Kısmen'),
     jsonb_build_object('value','no','label','Hayır')
   ), false, 12),
  ('job_finding_probability', 'applications', 'detailed', 'network', 'Son 30 günde kaç başvuru yaptın?', '0-200', 'number', '[]'::jsonb, false, 13),
  ('job_finding_probability', 'interviews', 'detailed', 'network', 'Son 90 günde mülakat aldın mı?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','multiple','label','Birden fazla'),
     jsonb_build_object('value','one','label','Bir'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 14),
  ('job_finding_probability', 'salary_flexibility', 'detailed', 'plan', 'Maaş/rol esnekliğin?', '1 = düşük, 5 = yüksek', 'scale', '[]'::jsonb, false, 15),
  ('job_finding_probability', 'remote_option', 'detailed', 'plan', 'Remote/hybrid/sponsor seçeneklerine açıksın?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','remote','label','Remote'),
     jsonb_build_object('value','hybrid','label','Hybrid'),
     jsonb_build_object('value','sponsor','label','Sponsor relocation'),
     jsonb_build_object('value','local_only','label','Sadece yerel')
   ), false, 16);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_job_probability_v1 — tek ülke için 6 boyutlu olasılık skoru.
-- ---------------------------------------------------------------------------
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
  -- Boyut sinyalleri
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
begin
  select weights into v_weights from public.relocation_tools where key = 'job_finding_probability';
  select id into v_profession_id from public.relocation_professions where profession_key = v_profession_key and is_active;

  -- demand_fit: ülke+meslek sinyali (vacancy 0.4 + shortage 0.4 + düşük işsizlik 0.2). Yoksa nötr.
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

  -- language_fit: iş dili 0.65 + İngilizce 0.35.
  v_language := public.rl_tool_clamp_neutral(v_lang_work * 0.65 + v_lang_en * 0.35);

  -- experience_signal: yıl (0..10+ → 0..1) 0.4 + kıdem 0.3 + portföy 0.15 + mülakat 0.15.
  v_seniority_score := case v_seniority
    when 'junior' then 0.3 when 'mid' then 0.55 when 'senior' then 0.8
    when 'lead' then 0.9 when 'manager' then 0.95 else 0.5 end;
  v_portfolio_score := case v_portfolio when 'ready' then 1.0 when 'partial' then 0.5 else 0.3 end;
  v_experience := public.rl_tool_clamp_neutral(
    least(v_years / 10.0, 1.0) * 0.4 + v_seniority_score * 0.3 + v_portfolio_score * 0.15
    + (case v_interviews when 'multiple' then 1.0 when 'one' then 0.6 else 0.2 end) * 0.15);

  -- credential_fit: regulated değilse yüksek; regulated ise credential_status'a bağlı.
  v_credential := case
    when v_regulated = 'no' then 0.9
    when v_cred_status = 'recognized' then 0.95
    when v_cred_status = 'not_needed' then 0.9
    when v_cred_status = 'in_progress' then 0.55
    when v_regulated = 'yes' and v_cred_status in ('none', '') then 0.25
    else 0.5 end;

  -- work_authorization_fit.
  v_work_auth_score := case v_work_auth
    when 'authorized' then 1.0 when 'eligible' then 0.75
    when 'needs_sponsor' then 0.4 else 0.4 end;

  -- network_activity_fit: network 0.5 + başvuru aktivitesi 0.3 + mülakat 0.2.
  v_network_activity := public.rl_tool_clamp_neutral(
    (case v_network when 'strong' then 1.0 when 'weak' then 0.5 else 0.2 end) * 0.5
    + least(v_apps / 20.0, 1.0) * 0.3
    + (case v_interviews when 'multiple' then 1.0 when 'one' then 0.6 else 0.2 end) * 0.2);

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

  -- En zayıf 3 boyut → hızlı kazanım önerileri.
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
