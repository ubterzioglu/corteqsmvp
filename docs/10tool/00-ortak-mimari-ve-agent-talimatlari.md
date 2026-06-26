# 00 — Ortak Relocation Tools Mimarisi ve Claude Code Uygulama Talimatı

> Bu dosya 10 ayrı araç dokümanının ortak teknik sözleşmesidir. Önce bunu, sonra ilgili aracın E2E dokümanını Claude Code'a ver.

## Amaç

CorteQS içinde diaspora ve taşınma odaklı 10 click-through değerlendirme aracını tek tek ama ortak bir altyapı üzerinden uygulamak. Hedef, her aracın kendi soruları, skor modeli, sonuç ekranı ve CTA'ları olması; fakat form, session, answer, result, event, privacy ve test iskeletinin tekrar etmemesidir.

## Önerilen route yapısı

Mevcut `/relocation` route'u authenticated olduğu için MVP'de araçlar şu path altında başlatılsın:

| Route | Amaç |
|---|---|
| `/relocation` | Mevcut taşınma planlayıcı ana ekranı; yeni araç kartlarını da gösterir. |
| `/relocation/tools` | 10 aracın hub ekranı. |
| `/relocation/tools/:toolSlug` | Araç landing + quick/detailed seçim ekranı. |
| `/relocation/tools/:toolSlug/session/:sessionId` | Soru adımları. |
| `/relocation/tools/:toolSlug/result/:resultId` | Sonuç + CTA ekranı. |

Lead-gen amacıyla ileride bazı araçlar anonymous açılabilir. MVP'de authenticated başlamak veri sahipliği, profil entegrasyonu ve RLS açısından daha güvenlidir.

## Ortak dosya planı

Claude Code aşağıdaki dosyaları eklemeli veya genişletmeli:

```text
src/lib/relocation-tools-types.ts
src/lib/relocation-tools-schemas.ts
src/lib/relocation-tools-api.ts
src/lib/relocation-tools-query-keys.ts
src/lib/relocation-tools-ranking.ts
src/lib/relocation-tools-copy.ts
src/lib/relocation-tools-config.ts
src/hooks/useRelocationToolSession.ts
src/components/relocation/tools/RelocationToolsHub.tsx
src/components/relocation/tools/ToolLandingCard.tsx
src/components/relocation/tools/ToolModeSelector.tsx
src/components/relocation/tools/QuestionStepper.tsx
src/components/relocation/tools/QuestionRenderer.tsx
src/components/relocation/tools/ScoreMeter.tsx
src/components/relocation/tools/ScoreBreakdownCard.tsx
src/components/relocation/tools/ResultCtaPanel.tsx
src/pages/relocation/tools/RelocationToolsHubPage.tsx
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
supabase/migrations/<timestamp>_relocation_tools_core.sql
supabase/migrations/<timestamp>_relocation_tools_seed.sql
supabase/migrations/<timestamp>_relocation_tools_scoring_rpcs.sql
```

Route kaydı için `src/App.tsx` veya relocation alt route düzeni güncellenmeli. Eğer `App.tsx` büyütülmek istenmezse `src/pages/relocation/routes.tsx` ile modülerleştirme yapılabilir; mevcut repo muhasebe ve cadde modüllerindeki `routes.tsx` desenini kabul ediyor.

## Ortak veritabanı modeli

Aşağıdaki şema tüm araçları kapsar. Bazı araçlar ek referans tabloları ister; onlar ilgili E2E dokümanda listelenir.

```sql
create table if not exists public.relocation_tools (
  key text primary key,
  slug text not null unique,
  title_tr text not null,
  title_en text,
  summary_tr text not null,
  category text not null,
  quick_question_count integer not null,
  detailed_question_count integer not null,
  is_active boolean not null default true,
  requires_auth boolean not null default true,
  result_kind text not null check (result_kind in ('score','ranked_list','persona','checklist','match_list','comparison')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.relocation_tool_questions (
  id uuid primary key default gen_random_uuid(),
  tool_key text not null references public.relocation_tools(key) on delete cascade,
  question_key text not null,
  mode text not null check (mode in ('quick','detailed','both')),
  section_key text not null,
  prompt_tr text not null,
  help_tr text,
  answer_type text not null check (answer_type in ('single','multi','scale','number','currency','text','date','country','city','profession','consent')),
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  scoring jsonb not null default '{}'::jsonb,
  sort_order integer not null,
  is_required boolean not null default true,
  is_active boolean not null default true,
  unique(tool_key, question_key)
);

create table if not exists public.relocation_tool_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  tool_key text not null references public.relocation_tools(key),
  mode text not null check (mode in ('quick','detailed')),
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  source_move_id uuid references public.relocation_moves(id) on delete set null,
  consent_profile_write boolean not null default false,
  consent_partner_referral boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.relocation_tool_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.relocation_tool_sessions(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  answered_at timestamptz not null default now(),
  unique(session_id, question_key)
);

create table if not exists public.relocation_tool_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.relocation_tool_sessions(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  tool_key text not null references public.relocation_tools(key),
  result_kind text not null,
  total_score numeric(6,2),
  score_bucket text,
  primary_result jsonb not null default '{}'::jsonb,
  sub_scores jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  explanations jsonb not null default '[]'::jsonb,
  ctas jsonb not null default '[]'::jsonb,
  source_quality jsonb not null default '{}'::jsonb,
  model_version text not null default 'rule-v1',
  policy_version text not null default '2026-06-mvp',
  created_at timestamptz not null default now()
);

create table if not exists public.relocation_tool_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  session_id uuid references public.relocation_tool_sessions(id) on delete set null,
  tool_key text not null,
  event_type text not null check (event_type in ('start','answer','skip','complete','result_view','cta_click','save','share','abandon')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## RLS ve RPC sözleşmesi

- `relocation_tools` ve `relocation_tool_questions`: aktif satırlar authenticated kullanıcılara okunabilir; admin write RPC ile yönetilir.
- `sessions`, `answers`, `results`, `events`: kullanıcı sadece kendi satırını okur/yazar.
- Araç tamamlama ve skor hesaplama RPC ile yapılmalı; skor üreten RPC sonucu `relocation_tool_results` içine yazar.
- Ham answer saklama süresi varsayılan 30 gün; kullanıcı result'ı profiline kaydederse sadece özet/etiketler profile yazılır.

Ortak RPC isimleri:

```sql
public.relocation_tool_start_session(p_tool_key text, p_mode text, p_source_move_id uuid default null) returns jsonb
public.relocation_tool_save_answer(p_session_id uuid, p_question_key text, p_answer jsonb) returns void
public.relocation_tool_complete_session(p_session_id uuid) returns jsonb
public.relocation_tool_record_event(p_session_id uuid, p_event_type text, p_context jsonb default '{}'::jsonb) returns void
```

`relocation_tool_complete_session` içinde `tool_key` değerine göre ilgili skor RPC'si çağrılır:

```sql
relocation_score_country_match_v1(p_session_id uuid)
relocation_score_profession_salary_v1(p_session_id uuid)
relocation_score_readiness_v1(p_session_id uuid)
relocation_score_city_match_v1(p_session_id uuid)
relocation_score_diaspora_matchmaker_v1(p_session_id uuid)
relocation_score_career_path_v1(p_session_id uuid)
relocation_score_lifestyle_persona_v1(p_session_id uuid)
relocation_score_first_90_days_v1(p_session_id uuid)
relocation_score_top_challenge_v1(p_session_id uuid)
relocation_score_job_probability_v1(p_session_id uuid)
```

## Zod ve TypeScript sınırları

`relocation-tools-schemas.ts` içinde şu sınırlar olsun:

```ts
export const toolModeSchema = z.enum(['quick', 'detailed']);
export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.record(z.unknown()),
]);
export const saveToolAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionKey: z.string().min(1),
  answer: answerValueSchema,
});
```

Her aracın soru config'i `relocation-tools-config.ts` içinde typed seed olarak dursun; DB seed üretimi için aynı config'ten SQL/JSON üretilecek şekilde düşün.

## Ortak UX akışı

```mermaid
flowchart LR
  A[/relocation/tools hub] --> B[Tool landing]
  B --> C{Quick or Detailed}
  C --> D[Start session RPC]
  D --> E[QuestionStepper]
  E --> F[Save answer RPC]
  F --> E
  E --> G[Complete session RPC]
  G --> H[Scoring RPC]
  H --> I[Result page]
  I --> J[Save to profile]
  I --> K[Directory / Cadde / Expert CTA]
  I --> L[Analytics event]
```

## Ortak CTA türleri

| CTA key | Hedef |
|---|---|
| `complete_profile` | `/profile` içine yönlendirir. |
| `view_directory` | `/directory` veya filtreli dizin. |
| `open_cadde` | `/cadde` veya şehir/cafe önerisi. |
| `view_relocation_plan` | `/relocation` mevcut planlayıcı. |
| `open_service_finder` | Admin/servis bulucu veya yayınlanmış katalog kaydı. |
| `find_mentor` | Diaspora matchmaker veya directory mentor filtresi. |
| `start_related_tool` | Araçlar arası geçiş. |

## Ortak test matrisi

- Unit: her skor fonksiyonu için en az 5 fixture: düşük, orta, yüksek, eksik veri, uç değer.
- SQL↔TS mirror: ağırlıklar TS ve SQL'de birebir aynıysa test geçmeli.
- Zod: invalid country/profession/budget/date/consent edge case'leri.
- Component: `QuestionStepper`, `ScoreMeter`, `ResultCtaPanel` render smoke.
- Playwright: hub -> tool -> quick mode -> answers -> result -> CTA click.
- Security: kullanıcı A, kullanıcı B'nin session/result kaydını okuyamamalı.
- Privacy: consent false ise profile write ve partner referral event'i oluşmamalı.

## Uygulama sırası

1. Ortak engine: tablolar, RLS, generic RPC, typed API, hub UI.
2. Düşük veri bağımlı araçlar: #7 Persona, #9 Top Challenge, #3 Readiness.
3. Mevcut relocation verisini kullanan araçlar: #4 City Match, #8 90 Days, #1 Country Match.
4. Meslek/veri entegrasyonu isteyen araçlar: #2 Salary, #6 Career Path, #10 Job Probability.
5. En hassas ve sosyal grafik isteyen araç: #5 Diaspora Matchmaker.

## Tanım gereği tamamlanma kriteri

Bir araç tamamlandı sayılması için:

- Tool hub'da kartı görünür.
- Quick ve detailed mod soru setleri DB'den gelir.
- Session kaldığı yerden devam eder.
- Skor/result RPC'si deterministic çalışır.
- Result sayfası kısa özet, detay kırılım, CTA ve privacy notu gösterir.
- En az bir Vitest skor testi ve bir Playwright happy-path testi vardır.
- `npm run verify:text`, `npm run test`, `npm run build` yeşildir.
