-- Relocation Tools — #2 Meslek/Maaş Karşılaştırma (profession_salary).
-- Sözleşme: docs/10tool/02-meslek-maas-karsilastirma-e2e.md. result_kind = comparison.
-- relocation_professions + relocation_salary_benchmarks seed tabloları + araç/soru + RPC.
--
-- AYNA SÖZLEŞMESİ: salary_power_index ağırlıkları (salary_level 0.25 / cost_adjusted 0.30 /
-- demand 0.20 / tax_social 0.15 / credential 0.10) + boyut türetme + bucket mantığı hem bu RPC'de
-- hem src/lib/relocation-tools-salary.ts'te birebir (relocation-tools-salary.test.ts kilitler).
-- Maliyet ayarı için relocation_country_metrics.cost_index yeniden kullanılır (tek kaynak).

-- ---------------------------------------------------------------------------
-- 1) relocation_professions (ESCO-map; MVP'de küratörlü)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_professions (
  id uuid primary key default gen_random_uuid(),
  esco_code text unique,
  profession_key text not null unique,               -- ör. software_engineer
  label_tr text not null,
  label_en text,
  normalized_family text,
  is_regulated_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.relocation_professions enable row level security;
drop policy if exists relocation_professions_read on public.relocation_professions;
create policy relocation_professions_read on public.relocation_professions
  for select to authenticated using (is_active);

insert into public.relocation_professions
  (profession_key, esco_code, label_tr, label_en, normalized_family, is_regulated_default)
values
  ('software_engineer', '2512.1', 'Yazılım Mühendisi', 'Software Engineer', 'tech', false),
  ('civil_engineer', '2142.1', 'İnşaat Mühendisi', 'Civil Engineer', 'engineering', true),
  ('registered_nurse', '2221.1', 'Hemşire', 'Registered Nurse', 'healthcare', true),
  ('accountant', '2411.1', 'Muhasebeci', 'Accountant', 'finance', false),
  ('teacher', '2330.1', 'Öğretmen', 'Teacher', 'education', true)
on conflict (profession_key) do nothing;

-- ---------------------------------------------------------------------------
-- 2) relocation_salary_benchmarks (meslek × ülke; brüt yıllık EUR)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid references public.relocation_professions(id) on delete cascade,
  country_code text not null,
  city_code text,
  seniority text,                                    -- null = geneli
  salary_min numeric(14,2),
  salary_median numeric(14,2),
  salary_max numeric(14,2),
  salary_period text not null default 'yearly',
  salary_type text not null default 'gross',
  currency text not null default 'EUR',
  demand_index numeric(4,3),                          -- 0..1 talep sinyali
  net_ratio numeric(4,3),                             -- brüt→net oran (basit ülke faktörü)
  sample_size integer,
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  freshness_at timestamptz,
  confidence numeric(4,3) not null default 0.50,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.relocation_salary_benchmarks enable row level security;
drop policy if exists relocation_salary_benchmarks_read on public.relocation_salary_benchmarks;
create policy relocation_salary_benchmarks_read on public.relocation_salary_benchmarks
  for select to authenticated using (is_active);

-- coalesce ifadeli unique → tablo kısıtı değil, unique index olmalı.
create unique index if not exists relocation_salary_benchmarks_uniq_idx
  on public.relocation_salary_benchmarks (profession_id, country_code, coalesce(seniority, 'all'));
create index if not exists relocation_salary_benchmarks_lookup_idx
  on public.relocation_salary_benchmarks (profession_id, country_code) where is_active;

-- Seed: 5 meslek × 8 ülke (brüt yıllık EUR median + band; demand + net_ratio küratörlü MVP).
insert into public.relocation_salary_benchmarks
  (profession_id, country_code, salary_min, salary_median, salary_max, demand_index, net_ratio, confidence)
select p.id, b.country_code, b.smin, b.smed, b.smax, b.demand, b.net_ratio, 0.50
from public.relocation_professions p
join (values
  -- software_engineer
  ('software_engineer','DE', 55000, 72000, 95000, 0.90, 0.62),
  ('software_engineer','NL', 50000, 68000, 90000, 0.88, 0.65),
  ('software_engineer','SE', 48000, 62000, 82000, 0.82, 0.66),
  ('software_engineer','CA', 52000, 70000, 95000, 0.85, 0.70),
  ('software_engineer','GB', 50000, 68000, 100000, 0.86, 0.68),
  ('software_engineer','US', 75000, 110000, 160000, 0.92, 0.72),
  ('software_engineer','PL', 28000, 40000, 60000, 0.78, 0.70),
  ('software_engineer','AE', 45000, 65000, 95000, 0.80, 1.00),
  -- civil_engineer
  ('civil_engineer','DE', 45000, 58000, 75000, 0.70, 0.62),
  ('civil_engineer','NL', 42000, 55000, 72000, 0.68, 0.65),
  ('civil_engineer','SE', 42000, 54000, 70000, 0.62, 0.66),
  ('civil_engineer','CA', 48000, 62000, 85000, 0.72, 0.70),
  ('civil_engineer','GB', 40000, 52000, 72000, 0.66, 0.68),
  ('civil_engineer','US', 55000, 75000, 105000, 0.74, 0.72),
  ('civil_engineer','PL', 22000, 32000, 48000, 0.60, 0.70),
  ('civil_engineer','AE', 40000, 58000, 85000, 0.78, 1.00),
  -- registered_nurse
  ('registered_nurse','DE', 36000, 45000, 58000, 0.85, 0.62),
  ('registered_nurse','NL', 38000, 48000, 60000, 0.80, 0.65),
  ('registered_nurse','SE', 36000, 44000, 55000, 0.78, 0.66),
  ('registered_nurse','CA', 48000, 65000, 85000, 0.88, 0.70),
  ('registered_nurse','GB', 34000, 42000, 55000, 0.86, 0.68),
  ('registered_nurse','US', 60000, 80000, 110000, 0.90, 0.72),
  ('registered_nurse','PL', 16000, 24000, 34000, 0.70, 0.70),
  ('registered_nurse','AE', 30000, 42000, 60000, 0.82, 1.00),
  -- accountant
  ('accountant','DE', 42000, 55000, 72000, 0.65, 0.62),
  ('accountant','NL', 40000, 52000, 70000, 0.62, 0.65),
  ('accountant','SE', 38000, 48000, 64000, 0.58, 0.66),
  ('accountant','CA', 45000, 60000, 82000, 0.66, 0.70),
  ('accountant','GB', 38000, 50000, 72000, 0.68, 0.68),
  ('accountant','US', 52000, 70000, 100000, 0.70, 0.72),
  ('accountant','PL', 18000, 28000, 42000, 0.55, 0.70),
  ('accountant','AE', 36000, 52000, 78000, 0.72, 1.00),
  -- teacher
  ('teacher','DE', 42000, 54000, 68000, 0.60, 0.62),
  ('teacher','NL', 40000, 50000, 64000, 0.58, 0.65),
  ('teacher','SE', 36000, 44000, 55000, 0.55, 0.66),
  ('teacher','CA', 45000, 58000, 78000, 0.62, 0.70),
  ('teacher','GB', 34000, 44000, 60000, 0.64, 0.68),
  ('teacher','US', 42000, 58000, 82000, 0.60, 0.72),
  ('teacher','PL', 14000, 22000, 32000, 0.50, 0.70),
  ('teacher','AE', 30000, 44000, 64000, 0.70, 1.00)
) as b(profession_key, country_code, smin, smed, smax, demand, net_ratio)
  on p.profession_key = b.profession_key
on conflict (profession_id, country_code, coalesce(seniority, 'all')) do nothing;

-- ---------------------------------------------------------------------------
-- 3) Araç + soru seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'profession_salary',
  'meslek-maas-karsilastirma',
  'Mesleğiniz Dünyada Ne Kazandırıyor? — Maaş Karşılaştırma Aracı',
  'Profession Salary Comparison',
  'Mesleğin ve hedef ülkelerine göre brüt/net maaş bandını, maliyet ayarlı alım gücünü ve talep sinyalini karşılaştırır.',
  'relocation_assessment',
  5, 12, 'comparison', true, true, 25,
  jsonb_build_object(
    'salary_level', 0.25,
    'cost_adjusted_income', 0.30,
    'demand_fit', 0.20,
    'tax_social_fit', 0.15,
    'credential_transferability', 0.10
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

delete from public.relocation_tool_questions where tool_key = 'profession_salary';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (5)
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
  -- DETAILED (+7)
  ('profession_salary', 'education_level', 'detailed', 'career', 'En yüksek eğitim seviyen?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','high_school','label','Lise'),
     jsonb_build_object('value','vocational','label','Meslek okulu'),
     jsonb_build_object('value','bachelor','label','Lisans'),
     jsonb_build_object('value','master','label','Yüksek lisans'),
     jsonb_build_object('value','phd','label','Doktora')
   ), false, 6),
  ('profession_salary', 'specialization', 'detailed', 'career', 'Uzmanlık/branş alanların?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','backend','label','Backend/Sistem'),
     jsonb_build_object('value','data_ai','label','Veri/Yapay Zeka'),
     jsonb_build_object('value','clinical','label','Klinik'),
     jsonb_build_object('value','management','label','Yönetim'),
     jsonb_build_object('value','other','label','Diğer')
   ), false, 7),
  ('profession_salary', 'certifications', 'detailed', 'career', 'Uluslararası geçerli sertifikan var mı?', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','aws','label','AWS/Cloud'),
     jsonb_build_object('value','pmp','label','PMP'),
     jsonb_build_object('value','medical_license','label','Tıbbi lisans'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 8),
  ('profession_salary', 'regulated_profession', 'detailed', 'legal', 'Mesleğin hedef ülkede lisans/denkliğe tabi mi?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet'),
     jsonb_build_object('value','no','label','Hayır'),
     jsonb_build_object('value','not_sure','label','Emin değilim')
   ), false, 9),
  ('profession_salary', 'salary_preference', 'detailed', 'budget', 'Maaşı nasıl görmek istersin?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','gross_yearly','label','Brüt yıllık'),
     jsonb_build_object('value','net_monthly','label','Net aylık'),
     jsonb_build_object('value','both','label','İkisi de')
   ), false, 10),
  ('profession_salary', 'current_salary_optional', 'detailed', 'budget', 'Mevcut net maaşını karşılaştırmaya dahil edelim mi?', 'Opsiyonel (EUR/ay)', 'currency', '[]'::jsonb, false, 11),
  ('profession_salary', 'target_cities', 'detailed', 'plan', 'Belirli şehirleri dahil edelim mi?', 'Opsiyonel', 'text', '[]'::jsonb, false, 12);

-- ---------------------------------------------------------------------------
-- 4) relocation_score_profession_salary_v1 — meslek × ülke karşılaştırma + salary_power_index.
-- ---------------------------------------------------------------------------
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
  -- Hedef ülkeler
  v_targets text[] := coalesce(
    (select array_agg(upper(trim(t)))
     from regexp_split_to_table(coalesce(v_ans ->> 'target_countries', ''), ',') t
     where trim(t) <> ''), '{}'::text[]);
  v_global_max numeric;
  v_rows jsonb;
  v_top jsonb;
  v_top_score numeric;
begin
  select weights into v_weights from public.relocation_tools where key = 'profession_salary';

  select id into v_profession_id from public.relocation_professions where profession_key = v_profession_key and is_active;
  if v_profession_id is null then
    -- Meslek tanınmadı → boş karşılaştırma + uyarı.
    return public.rl_tool_write_result(
      p_session_id, 'comparison', null, null,
      jsonb_build_object('rows', '[]'::jsonb),
      '{}'::jsonb, '[]'::jsonb,
      jsonb_build_array('Seçilen meslek için maaş verisi bulunamadı.'),
      jsonb_build_array(jsonb_build_object('key','view_relocation_plan','label','Taşınma Planın')),
      '{}'::jsonb, 'rule-v1');
  end if;

  -- Bu meslek için global median tavanı (salary_level normalizasyonu).
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
      -- Boyutlar (0..1)
      jsonb_build_object(
        'salary_level', public.rl_tool_clamp_neutral(b.salary_median / v_global_max),
        'cost_adjusted_income', public.rl_tool_clamp_neutral(
          (b.salary_median * b.net_ratio / v_global_max) / nullif(0.4 + coalesce(cm.cost_index, 0.5), 0)),
        'demand_fit', public.rl_tool_clamp_neutral(b.demand_index),
        'tax_social_fit', public.rl_tool_clamp_neutral(b.net_ratio),
        'credential_transferability', case
          when v_regulated = 'yes' then 0.3
          when v_regulated = 'not_sure' then 0.5
          else 0.85 end
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
