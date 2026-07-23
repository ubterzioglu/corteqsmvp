-- Relocation Tools — #5 Diaspora Ağı Eşleştirme (diaspora_matchmaker).
-- Sözleşme: docs/10tool/05-diaspora-ag-eslestirme-e2e.md. result_kind = match_list.
-- İKİ yeni tablo (diaspora_match_preferences + diaspora_matches) + araç/soru + matchmaker RPC + intro RPC'leri.
--
-- PRIVACY (docs §4 hard filters + §9): consent yoksa havuza girilmez; kullanıcı kendisiyle
-- eşleşemez; visibility_status='off' adaylar dışlanır; isim/iletişim ASLA payload'da yok —
-- yalnızca karşılıklı kabul (accept) sonrası açılır. sensitive_hide alanları kartlarda maskelenir.
--
-- AYNA SÖZLEŞMESİ: uyumluluk ağırlıkları (need_offer 0.35 / geo 0.20 / field 0.15 / lang_tz 0.10 /
-- trust 0.10 / reciprocity 0.10) + boyut türetme hem matchmaker RPC'de hem
-- src/lib/relocation-tools-diaspora.ts'te birebir (relocation-tools-diaspora.test.ts kilitler).

-- ---------------------------------------------------------------------------
-- 1) diaspora_match_preferences (opt-in profil; sahip-bazlı)
-- ---------------------------------------------------------------------------
create table if not exists public.diaspora_match_preferences (
  user_id uuid primary key default auth.uid(),
  visibility_status text not null default 'off'
    check (visibility_status in ('off','anonymous','profile_summary')),
  profile_status text,                               -- planning/newly_arrived/settled/mentor/organization
  current_country text,
  current_city text,
  target_country_codes text[] not null default '{}',
  target_city_codes text[] not null default '{}',
  needs text[] not null default '{}',
  offers text[] not null default '{}',
  profession_tags text[] not null default '{}',
  languages text[] not null default '{}',
  availability text,
  contact_style text,
  hidden_fields text[] not null default '{}',
  trust_signals text[] not null default '{}',
  blocking_topics text[] not null default '{}',
  intro_text text,
  max_monthly_intros integer not null default 3,
  updated_at timestamptz not null default now()
);

alter table public.diaspora_match_preferences enable row level security;
-- Sahip kendi tercihini okur/yazar. Aday havuzu okuması matchmaker RPC (security definer) üzerinden.
drop policy if exists diaspora_pref_owner on public.diaspora_match_preferences;
create policy diaspora_pref_owner on public.diaspora_match_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2) diaspora_matches (önerilen/istenen/kabul edilen eşleşmeler)
-- ---------------------------------------------------------------------------
create table if not exists public.diaspora_matches (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid(),
  candidate_id uuid not null,
  score numeric(6,2) not null,
  score_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'suggested'
    check (status in ('suggested','requested','accepted','declined','expired','blocked')),
  intro_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, candidate_id)
);

alter table public.diaspora_matches enable row level security;
-- Hem isteyen hem aday kendi tarafını görebilir; yazma yalnızca RPC.
drop policy if exists diaspora_matches_party_sel on public.diaspora_matches;
create policy diaspora_matches_party_sel on public.diaspora_matches
  for select to authenticated using (requester_id = auth.uid() or candidate_id = auth.uid());

create index if not exists diaspora_matches_requester_idx on public.diaspora_matches (requester_id, status);
create index if not exists diaspora_matches_candidate_idx on public.diaspora_matches (candidate_id, status);

-- ---------------------------------------------------------------------------
-- 3) Araç + soru seed
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'diaspora_matchmaker',
  'diaspora-ag-eslestirme',
  'CorteQS Diaspora Ağı Eşleştirme — Mentor ve Topluluk Matchmaker',
  'Diaspora Network Matchmaker',
  'İhtiyaç/teklif, şehir, meslek ve dil üzerinden seni opt-in diaspora üyeleriyle güvenli kartlarla eşleştirir. İletişim karşılıklı onayla açılır.',
  'relocation_assessment',
  8, 16, 'match_list', true, true, 110,
  jsonb_build_object(
    'need_offer_complementarity', 0.35,
    'geo_proximity', 0.20,
    'field_overlap', 0.15,
    'language_timezone_fit', 0.10,
    'trust_profile_completeness', 0.10,
    'reciprocity_recent_activity', 0.10
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

delete from public.relocation_tool_questions where tool_key = 'diaspora_matchmaker';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, is_required, sort_order)
values
  -- QUICK (8)
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
  -- DETAILED (+8)
  ('diaspora_matchmaker', 'current_location', 'detailed', 'geo', 'Şu an neredesin?', 'ISO ülke kodu', 'country', '[]'::jsonb, false, 9),
  ('diaspora_matchmaker', 'availability', 'detailed', 'match', 'Görüşme uygunluğun?', null, 'single',
   jsonb_build_array(
     jsonb_build_object('value','weekdays','label','Hafta içi'),
     jsonb_build_object('value','evenings','label','Akşamlar'),
     jsonb_build_object('value','weekends','label','Hafta sonu'),
     jsonb_build_object('value','async_only','label','Sadece asenkron')
   ), false, 10),
  ('diaspora_matchmaker', 'mentor_capacity', 'detailed', 'match', 'Ayda kaç kişiye destek verebilirsin?', 'Mentor/yerleşik için', 'number', '[]'::jsonb, false, 11),
  ('diaspora_matchmaker', 'intro_text', 'detailed', 'profile', 'Karşı tarafa gösterilecek kısa tanıtım', 'Max 280 karakter', 'text', '[]'::jsonb, false, 12),
  ('diaspora_matchmaker', 'sensitive_hide', 'detailed', 'consent', 'Gizlemek istediğin alanlar', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','city','label','Şehir'),
     jsonb_build_object('value','profession','label','Meslek'),
     jsonb_build_object('value','real_name','label','Gerçek ad'),
     jsonb_build_object('value','employer','label','İşveren')
   ), false, 13),
  ('diaspora_matchmaker', 'trust_signals', 'detailed', 'profile', 'Profil doğrulama sinyalleri', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','completed_profile','label','Tamamlanmış profil'),
     jsonb_build_object('value','catalog_claim','label','Katalog talebi'),
     jsonb_build_object('value','phone_verified','label','Telefon doğrulanmış')
   ), false, 14),
  ('diaspora_matchmaker', 'blocking_topics', 'detailed', 'consent', 'Eşleşmek istemediğin konu/tipler', 'Birden fazla seçebilirsin', 'multi',
   jsonb_build_array(
     jsonb_build_object('value','sales','label','Satış'),
     jsonb_build_object('value','legal_advice','label','Hukuki tavsiye'),
     jsonb_build_object('value','recruiting','label','İşe alım'),
     jsonb_build_object('value','none','label','Yok')
   ), false, 15),
  ('diaspora_matchmaker', 'timezone', 'detailed', 'match', 'Saat dilimi / uygun saat', 'Opsiyonel', 'text', '[]'::jsonb, false, 16);

-- ---------------------------------------------------------------------------
-- 4) relocation_score_diaspora_matchmaker_v1 — opt-in havuzdan güvenli kartlar üretir.
-- ---------------------------------------------------------------------------
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
  -- Kullanıcının kendi vektörleri
  v_needs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'needs','[]'::jsonb))), '{}'::text[]);
  v_offers text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'offers','[]'::jsonb))), '{}'::text[]);
  v_langs text[] := coalesce(array(select jsonb_array_elements_text(coalesce(v_ans -> 'languages','[]'::jsonb))), '{}'::text[]);
  v_target text := upper(coalesce(v_ans ->> 'target_location',''));
  v_profession text := lower(coalesce(v_ans ->> 'profession_field',''));
  v_matches jsonb;
  v_count integer;
begin
  select weights into v_weights from public.relocation_tools where key = 'diaspora_matchmaker';

  -- HARD FILTER: consent yoksa havuza girme + aday üretme.
  if not v_consent then
    return public.rl_tool_write_result(
      p_session_id, 'match_list', null, null,
      jsonb_build_object('matches', '[]'::jsonb, 'match_count', 0, 'consent', false),
      '{}'::jsonb, '[]'::jsonb,
      jsonb_build_array('Eşleşme üretmek için görünürlük onayı gerekir. Onay vermeden hiçbir veri kaydedilmez.'),
      jsonb_build_array(jsonb_build_object('key','complete_profile','label','Profilini Tamamla')),
      '{}'::jsonb, 'rule-v1');
  end if;

  -- Consent VAR: kullanıcının opt-in tercih satırını upsert et (havuza katılım).
  insert into public.diaspora_match_preferences as p
    (user_id, visibility_status, profile_status, current_country, target_country_codes,
     needs, offers, profession_tags, languages, availability, contact_style,
     hidden_fields, trust_signals, blocking_topics, intro_text, max_monthly_intros)
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
    coalesce((v_ans ->> 'mentor_capacity')::integer, 3)
  )
  on conflict (user_id) do update set
    visibility_status = excluded.visibility_status, profile_status = excluded.profile_status,
    current_country = excluded.current_country, target_country_codes = excluded.target_country_codes,
    needs = excluded.needs, offers = excluded.offers, profession_tags = excluded.profession_tags,
    languages = excluded.languages, availability = excluded.availability,
    contact_style = excluded.contact_style, hidden_fields = excluded.hidden_fields,
    trust_signals = excluded.trust_signals, blocking_topics = excluded.blocking_topics,
    intro_text = excluded.intro_text, max_monthly_intros = excluded.max_monthly_intros,
    updated_at = now();

  -- Aday havuzu: opt-in (off değil), kendisi değil. Uyumluluk skorla.
  with cand as (
    select c.*,
      jsonb_build_object(
        -- need_offer_complementarity: benim ihtiyacım ↔ adayın teklifi + tersi (Jaccard benzeri).
        'need_offer_complementarity', public.rl_tool_clamp_neutral(
          (cardinality(array(select unnest(v_needs) intersect select unnest(c.offers)))::numeric
           / nullif(greatest(cardinality(v_needs), 1), 0)) * 0.6
          + (cardinality(array(select unnest(v_offers) intersect select unnest(c.needs)))::numeric
             / nullif(greatest(cardinality(v_offers), 1), 0)) * 0.4),
        'geo_proximity', case
          when v_target <> '' and (v_target = any(c.target_country_codes) or v_target = c.current_country) then 1.0
          when array_length(c.target_country_codes,1) is null then 0.5 else 0.3 end,
        'field_overlap', case
          when v_profession <> '' and v_profession = any(c.profession_tags) then 1.0
          when array_length(c.profession_tags,1) is null then 0.5 else 0.4 end,
        'language_timezone_fit', case
          when cardinality(array(select unnest(v_langs) intersect select unnest(c.languages))) > 0 then 1.0
          else 0.3 end,
        'trust_profile_completeness', public.rl_tool_clamp_neutral(
          least(cardinality(c.trust_signals)::numeric / 3.0, 1.0)),
        'reciprocity_recent_activity', public.rl_tool_clamp_neutral(
          0.4 + least(c.max_monthly_intros::numeric / 5.0, 0.6))
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
        -- GÜVENLİ KART: isim/iletişim YOK. Maskeleme: hidden_fields.
        'key', user_id,                      -- yalnızca intro istemek için (RLS korur)
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

-- ---------------------------------------------------------------------------
-- 5) Intro request / accept / decline RPC'leri (karşılıklı onay akışı)
-- ---------------------------------------------------------------------------
create or replace function public.diaspora_request_intro_v1(p_candidate_id uuid, p_context jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.rl_tool_require_user();
  v_cand public.diaspora_match_preferences%rowtype;
  v_match_id uuid;
begin
  if p_candidate_id = v_uid then raise exception 'rl_self_match'; end if;
  select * into v_cand from public.diaspora_match_preferences where user_id = p_candidate_id;
  if not found or v_cand.visibility_status = 'off' then raise exception 'rl_candidate_unavailable'; end if;

  insert into public.diaspora_matches (requester_id, candidate_id, score, status, intro_context)
  values (v_uid, p_candidate_id, 0, 'requested', coalesce(p_context, '{}'::jsonb))
  on conflict (requester_id, candidate_id) do update set
    status = case when public.diaspora_matches.status in ('declined','blocked')
                  then public.diaspora_matches.status else 'requested' end,
    updated_at = now()
  returning id into v_match_id;

  return jsonb_build_object('match_id', v_match_id, 'status', 'requested');
end;
$$;

create or replace function public.diaspora_accept_intro_v1(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.rl_tool_require_user();
begin
  update public.diaspora_matches
    set status = 'accepted', updated_at = now()
    where id = p_match_id and candidate_id = v_uid and status = 'requested';
  if not found then raise exception 'rl_match_not_actionable'; end if;
end;
$$;

create or replace function public.diaspora_decline_intro_v1(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.rl_tool_require_user();
begin
  update public.diaspora_matches
    set status = 'declined', updated_at = now()
    where id = p_match_id and candidate_id = v_uid and status in ('requested','suggested');
  if not found then raise exception 'rl_match_not_actionable'; end if;
end;
$$;

grant execute on function public.relocation_score_diaspora_matchmaker_v1(uuid) to authenticated;
grant execute on function public.diaspora_request_intro_v1(uuid, jsonb) to authenticated;
grant execute on function public.diaspora_accept_intro_v1(uuid) to authenticated;
grant execute on function public.diaspora_decline_intro_v1(uuid) to authenticated;
