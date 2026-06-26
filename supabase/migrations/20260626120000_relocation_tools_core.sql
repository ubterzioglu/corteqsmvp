-- Relocation Tools — ortak motor çekirdeği (6 tablo + RLS).
-- Sözleşme: docs/10tool/00-ortak-mimari-ve-agent-talimatlari.md §"Ortak veritabanı modeli" + §"RLS".
-- 10 click-through değerlendirme aracının paylaştığı engine. Mimari ayna: relocation_core/_rls.
--
-- Yazma yolu: kullanıcı-facing mutasyonlar yalnızca security-definer RPC üzerinden
-- (20260626121000_relocation_tools_scoring_rpcs.sql). Araç/soru tabloları authenticated read;
-- araca özel referans tabloları (ör. relocation_country_metrics) her araç fazında ayrı gelir.

-- ---------------------------------------------------------------------------
-- 1) Araç kayıt defteri (key = kanonik anahtar; slug = route)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_tools (
  key text primary key,
  slug text not null unique,
  title_tr text not null,
  title_en text,
  summary_tr text not null,
  category text not null,
  quick_question_count integer not null default 0,
  detailed_question_count integer not null default 0,
  is_active boolean not null default true,
  requires_auth boolean not null default true,
  result_kind text not null
    check (result_kind in ('score','ranked_list','persona','checklist','match_list','comparison')),
  sort_order integer not null default 100,
  -- Skor boyut ağırlıkları (araç bazlı; relocation-tools-ranking.ts AYNALAR).
  weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.relocation_tools is
  'Relocation değerlendirme araçları kayıt defteri. Sözleşme: docs/10tool/00-ortak-mimari-ve-agent-talimatlari.md';

-- ---------------------------------------------------------------------------
-- 2) Soru bankası
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_tool_questions (
  id uuid primary key default gen_random_uuid(),
  tool_key text not null references public.relocation_tools(key) on delete cascade,
  question_key text not null,
  mode text not null check (mode in ('quick','detailed','both')),
  section_key text not null default 'general',
  prompt_tr text not null,
  help_tr text,
  answer_type text not null
    check (answer_type in ('single','multi','scale','number','currency','text','date','country','city','profession','consent')),
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  scoring jsonb not null default '{}'::jsonb,
  sort_order integer not null,
  is_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tool_key, question_key)
);

create index if not exists relocation_tool_questions_tool_idx
  on public.relocation_tool_questions (tool_key, sort_order) where is_active;

-- ---------------------------------------------------------------------------
-- 3) Oturumlar (resumable; cevaplar ayrı tabloda)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_tool_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  tool_key text not null references public.relocation_tools(key),
  mode text not null check (mode in ('quick','detailed')),
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','abandoned')),
  source_move_id uuid references public.relocation_moves(id) on delete set null,
  consent_profile_write boolean not null default false,
  consent_partner_referral boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Ham cevap saklama: 30 gün (KVKK/GDPR min.).
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists relocation_tool_sessions_user_idx
  on public.relocation_tool_sessions (user_id, tool_key, started_at desc);

-- ---------------------------------------------------------------------------
-- 4) Cevaplar (soru başına; idempotent merge için unique)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_tool_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.relocation_tool_sessions(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  answered_at timestamptz not null default now(),
  unique (session_id, question_key)
);

-- ---------------------------------------------------------------------------
-- 5) Sonuçlar (skor + açıklanabilirlik + CTA)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_tool_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.relocation_tool_sessions(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  tool_key text not null references public.relocation_tools(key),
  result_kind text not null,
  total_score numeric(6,2),                         -- 0..100 (persona/checklist'te null olabilir)
  score_bucket text,
  primary_result jsonb not null default '{}'::jsonb,    -- ranked list / persona / checklist gövdesi
  sub_scores jsonb not null default '{}'::jsonb,        -- boyut → 0..1
  recommendations jsonb not null default '[]'::jsonb,
  explanations jsonb not null default '[]'::jsonb,      -- Türkçe "neden" cümleleri
  ctas jsonb not null default '[]'::jsonb,
  source_quality jsonb not null default '{}'::jsonb,
  model_version text not null default 'rule-v1',
  policy_version text not null default '2026-06-mvp',
  created_at timestamptz not null default now()
);

create index if not exists relocation_tool_results_session_idx
  on public.relocation_tool_results (session_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6) Olaylar (analitik; ürün iyileştirme)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_tool_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  session_id uuid references public.relocation_tool_sessions(id) on delete set null,
  tool_key text not null,
  event_type text not null
    check (event_type in ('start','answer','skip','complete','result_view','cta_click','save','share','abandon')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists relocation_tool_events_session_idx
  on public.relocation_tool_events (session_id, event_type, created_at desc);

-- ===========================================================================
-- RLS (docs/10tool/00 §"RLS ve RPC sözleşmesi")
-- ===========================================================================
alter table public.relocation_tools           enable row level security;
alter table public.relocation_tool_questions  enable row level security;
alter table public.relocation_tool_sessions   enable row level security;
alter table public.relocation_tool_answers    enable row level security;
alter table public.relocation_tool_results    enable row level security;
alter table public.relocation_tool_events     enable row level security;

-- Araç + soru: aktif satırlar authenticated read. Yazma policy YOK (seed/admin RPC).
drop policy if exists relocation_tools_read on public.relocation_tools;
create policy relocation_tools_read on public.relocation_tools
  for select to authenticated using (is_active);

drop policy if exists relocation_tool_questions_read on public.relocation_tool_questions;
create policy relocation_tool_questions_read on public.relocation_tool_questions
  for select to authenticated using (is_active);

-- Oturumlar: sahip okur/yazar (mutasyon pratikte RPC; doğrudan sahip de güvenli).
drop policy if exists relocation_tool_sessions_owner_sel on public.relocation_tool_sessions;
create policy relocation_tool_sessions_owner_sel on public.relocation_tool_sessions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists relocation_tool_sessions_owner_ins on public.relocation_tool_sessions;
create policy relocation_tool_sessions_owner_ins on public.relocation_tool_sessions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists relocation_tool_sessions_owner_upd on public.relocation_tool_sessions;
create policy relocation_tool_sessions_owner_upd on public.relocation_tool_sessions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists relocation_tool_sessions_owner_del on public.relocation_tool_sessions;
create policy relocation_tool_sessions_owner_del on public.relocation_tool_sessions
  for delete to authenticated using (user_id = auth.uid());

-- Cevaplar: sahibi (oturum üzerinden) okur/yazar.
drop policy if exists relocation_tool_answers_owner_sel on public.relocation_tool_answers;
create policy relocation_tool_answers_owner_sel on public.relocation_tool_answers
  for select to authenticated using (
    exists (select 1 from public.relocation_tool_sessions s
            where s.id = relocation_tool_answers.session_id and s.user_id = auth.uid())
  );
drop policy if exists relocation_tool_answers_owner_ins on public.relocation_tool_answers;
create policy relocation_tool_answers_owner_ins on public.relocation_tool_answers
  for insert to authenticated with check (
    exists (select 1 from public.relocation_tool_sessions s
            where s.id = relocation_tool_answers.session_id and s.user_id = auth.uid())
  );
drop policy if exists relocation_tool_answers_owner_upd on public.relocation_tool_answers;
create policy relocation_tool_answers_owner_upd on public.relocation_tool_answers
  for update to authenticated using (
    exists (select 1 from public.relocation_tool_sessions s
            where s.id = relocation_tool_answers.session_id and s.user_id = auth.uid())
  );

-- Sonuçlar: sahip okur. Yazma yalnızca RPC (security definer).
drop policy if exists relocation_tool_results_owner_sel on public.relocation_tool_results;
create policy relocation_tool_results_owner_sel on public.relocation_tool_results
  for select to authenticated using (user_id = auth.uid());

-- Olaylar: sahip yazar/okur.
drop policy if exists relocation_tool_events_owner_ins on public.relocation_tool_events;
create policy relocation_tool_events_owner_ins on public.relocation_tool_events
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists relocation_tool_events_owner_sel on public.relocation_tool_events;
create policy relocation_tool_events_owner_sel on public.relocation_tool_events
  for select to authenticated using (user_id = auth.uid());

-- Not: results'a INSERT/UPDATE policy YOK — yazma security-definer RPC üzerinden
-- (relocation_tool_complete_session → relocation_score_<tool>_v1). RLS açık + policy yok = doğrudan yazma reddedilir.
