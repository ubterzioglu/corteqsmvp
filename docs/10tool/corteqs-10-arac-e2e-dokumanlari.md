# CorteQS — 10 Araç Ayrıntılı E2E Dokümanları


---

<!-- README.md -->

# CorteQS — 10 Araç İçin Claude Code'a Verilecek E2E Doküman Paketi

Bu klasör, ekteki 10 araç fikrini `ubterzioglu/corteqsmvp` reposunun mevcut mimarisine göre ayrı ayrı implementasyon dokümanlarına böler.

## Okuma sırası

1. `00-ortak-mimari-ve-agent-talimatlari.md`
2. Uygulamak istediğin aracın ilgili E2E dosyası.

## Dosyalar

- `00-ortak-mimari-ve-agent-talimatlari.md`
- `01-ulke-secimi-e2e.md`
- `02-meslek-maas-karsilastirma-e2e.md`
- `03-tasinma-hazirlik-skoru-e2e.md`
- `04-sehir-eslestirme-e2e.md`
- `05-diaspora-ag-eslestirme-e2e.md`
- `06-yurtdisi-kariyer-yolu-e2e.md`
- `07-expat-yasam-tarzi-persona-e2e.md`
- `08-ilk-90-gun-planlayici-e2e.md`
- `09-oncelikli-tasinma-sorunu-e2e.md`
- `10-is-bulma-olasiligi-e2e.md`
## Önerilen uygulama sırası

1. Ortak engine.
2. `07-expat-yasam-tarzi-persona-e2e.md`
3. `09-oncelikli-tasinma-sorunu-e2e.md`
4. `03-tasinma-hazirlik-skoru-e2e.md`
5. `04-sehir-eslestirme-e2e.md`
6. `08-ilk-90-gun-planlayici-e2e.md`
7. `01-ulke-secimi-e2e.md`
8. `02-meslek-maas-karsilastirma-e2e.md`
9. `06-yurtdisi-kariyer-yolu-e2e.md`
10. `10-is-bulma-olasiligi-e2e.md`
11. `05-diaspora-ag-eslestirme-e2e.md` — privacy ve mutual-consent daha hassas olduğu için en sona bırakıldı.

## Claude Code için kısa ana prompt

```text
Bu repo için önce AGENT_CONTEXT.md, ARCHITECTURE.md ve CLAUDE.md kurallarını oku. Sonra bu paketteki 00 ortak mimari dokümanını ve uygulayacağın araç E2E dokümanını uygula. Yeni kodda lib/*-api.ts + React Query + Zod + security-definer RPC desenini kullan. Legacy profiles/user_profiles/admin_users tablolarına referans verme. Mutasyonları RPC üzerinden yürüt. Test: npm run verify:text && npm run test && npm run build.
```


---

<!-- 00-ortak-mimari-ve-agent-talimatlari.md -->

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


---

<!-- 01-ulke-secimi-e2e.md -->

# Tool 01 — Hangi Ülke Sana Uygun? — Ülke Seçimi Aracı E2E Dokümanı

> **Tool key:** `country_match`  
> **Slug:** `ulke-secimi`  
> **Route:** `/relocation/tools/ulke-secimi`  
> **Result kind:** `ranked_list`  
> **Öncelik:** Yüksek  
> **Tahmini efor:** 5-7 gün ortak engine sonrası; veri adapter'larıyla 2-3 hafta

## 1. Ürün amacı

Kullanıcının bütçe, meslek, dil, vize, yaşam tarzı ve topluluk önceliklerine göre taşınabileceği ülkeleri sıralar.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı `/relocation/tools/ulke-secimi` sayfasına gelir.
2. Quick veya Detailed mod seçer.
3. Varsa son `relocation_moves` kaydı üzerinden hedef ülkeler, bütçe ve hane bilgisi prefill edilir.
4. Soru adımları tamamlanır; her cevap `relocation_tool_save_answer` ile kaydedilir.
5. `relocation_score_country_match_v1` ülke adaylarını skorlar.
6. Sonuç sayfasında top 5 ülke, skor kırılımı, nedenler, riskler ve CTA'lar gösterilir.
7. Kullanıcı sonucu profiline kaydedebilir veya şehir eşleştirme aracına geçebilir.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 18 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `motivation` | Tek taşınma motivasyonun ne? | `single` | career, education, family, safety, lifestyle, community, remote_work |
| `target_region` | Hangi bölgelere açıksın? | `multi` | EU/EEA, UK, North America, Gulf, APAC, any |
| `monthly_budget` | Aylık yaşam bütçen nedir? | `currency` | EUR veya seçilen para birimi |
| `setup_budget` | İlk kurulum için ayırabileceğin maksimum bütçe? | `currency` | depozito, uçuş, evrak, geçici konaklama |
| `profession_field` | Mesleğin veya ana uzmanlık alanın? | `profession` | ESCO mapping hedeflenir |
| `work_mode` | Yurt dışında çalışma planın nasıl? | `single` | local_job, remote, study_then_work, entrepreneur, undecided |
| `language_profile` | Hangi dillerde hangi seviyedesin? | `multi/scale` | TR/EN/DE/FR/NL/ES etc. CEFR |
| `visa_assets` | Vize/oturum açısından güçlü varlıkların var mı? | `multi` | EU passport, ancestry, student admission, job offer, none |
| `bureaucracy_tolerance` | Bürokrasi ve bekleme süresine toleransın? | `scale` | 1 düşük - 5 yüksek |
| `family_needs` | Aile, çocuk, okul veya evcil hayvan ihtiyaçların var mı? | `multi` | children, school, spouse_job, pets, none |
| `community_importance` | Türk/diaspora topluluğu senin için ne kadar önemli? | `scale` | 1-5 |
| `healthcare_priority` | Sağlık sistemine erişim önceliğin? | `scale` | 1-5 |
| `safety_priority` | Güvenlik ve siyasi istikrar önceliğin? | `scale` | 1-5 |
| `inclusion_priority` | Kapsayıcılık / haklar / sosyal özgürlükler ne kadar önemli? | `scale` | 1-5 |
| `climate_preference` | İklim tercihin? | `single` | mild, cold, warm, mediterranean, no_preference |
| `move_window` | Ne zaman taşınmak istiyorsun? | `date/range` | 0-3 ay, 3-6 ay, 6-12 ay, later |
| `risk_tolerance` | Belirsizlik ve yeniden başlama riskine toleransın? | `scale` | 1-5 |
| `deal_breakers` | Kesin istemediğin koşullar? | `multi` | high_cost, no_english, weak_healthcare, low_safety, no_community, hard_visa |

## 4. Skor / karar modeli

Toplam skor 0-100 aralığına normalize edilir. Her ülke için aday ülke metriği oluşturulur.

| Boyut | Ağırlık | Hesap |
|---|---:|---|
| `budget_fit` | 20 | Kullanıcı bütçesi ile ülke maliyet endeksi karşılaştırılır. Bütçe yoksa nötr 0.50. |
| `career_market_fit` | 20 | Meslek alanı + ülke istihdam/veri sinyali + EURES/OECD iş gücü göstergesi. |
| `visa_path_fit` | 15 | Kullanıcının vize varlıkları ve ülkenin vize/bürokrasi zorluğu. |
| `language_fit` | 15 | Kullanıcının dil profili ile ülkede çalışma/yaşam için gerekli dilin örtüşmesi. |
| `quality_of_life_fit` | 15 | Sağlık, güvenlik, eğitim/aile ve kapsayıcılık önceliklerinin ülke metrikleriyle uyumu. |
| `community_fit` | 10 | Türk/diaspora yoğunluğu ve kullanıcının community önem puanı. |
| `climate_fit` | 5 | İklim tercih vektörü ile ülke iklim kategorisi eşleşmesi. |

Bucket: `>=80 excellent`, `65-79 strong`, `50-64 moderate`, `<50 risky`. Deal-breaker seçilen alanlarda ilgili boyut maksimum 40/100 ile sınırlandırılır.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablo önerisi:

```sql
create table public.relocation_country_metrics (
  country_code text primary key,
  cost_index numeric(6,3),
  employment_index numeric(6,3),
  visa_complexity numeric(6,3),
  english_workability numeric(6,3),
  healthcare_index numeric(6,3),
  safety_index numeric(6,3),
  inclusion_index numeric(6,3),
  community_density numeric(6,3),
  climate_tags text[] not null default '{}',
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  is_active boolean not null default true
);
```

RPC: `relocation_score_country_match_v1(p_session_id uuid)`.

Mevcut `relocation_locations` ülke bazında aggregate edilerek de başlanabilir. MVP'de 10-15 ülke seed yeterlidir; sonradan ingestion worker günceller.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "country_match",
  "slug": "ulke-secimi",
  "title_tr": "Hangi Ülke Sana Uygun? — Ülke Seçimi Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 18,
  "result_kind": "ranked_list",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> İlk 3 ülken: Almanya 84/100, Hollanda 79/100, Kanada 73/100. Almanya kariyer ve topluluk açısından güçlü; Hollanda dil/iş dengesi iyi; Kanada vize ve mesafe nedeniyle orta riskli.

Detay result JSON:

```json
{
  "ranked_countries": [
    {
      "country_code": "DE",
      "score": 84.2,
      "bucket": "excellent",
      "sub_scores": {"budget_fit": 0.72, "career_market_fit": 0.91},
      "why": ["Meslek alanın Almanya'daki talep sinyalleriyle uyumlu", "Türk topluluğu yoğunluğu yüksek"],
      "risks": ["Almanca seviyesi B1 altındaysa iş arama süresi uzayabilir"],
      "next_actions": ["Şehir eşleştirme aracını çalıştır", "Almanya mentorlarını görüntüle"]
    }
  ]
}
```

CTA'lar:

- Şehir eşleştirme aracını başlat
- Sonucu profiline kaydet
- Bu ülkedeki CorteQS üyelerini/dizin kayıtlarını gör
- İlk 90 Gün Planlayıcı'ya geç

## 8. Veri kaynakları ve ingestion notu

- World Bank Indicators API
- OECD employment/labour datasets
- WHO Global Health Observatory
- EURES labour market information
- ESCO occupation/skills API
- Resmi göçmenlik ve konsolosluk siteleri
- Numbeo sadece fallback/crowd-sourced uyarısıyla

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/ulke-secimi -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 02-meslek-maas-karsilastirma-e2e.md -->

# Tool 02 — Mesleğiniz Dünyada Ne Kazandırıyor? — Maaş Karşılaştırma Aracı E2E Dokümanı

> **Tool key:** `profession_salary`  
> **Slug:** `meslek-maas-karsilastirma`  
> **Route:** `/relocation/tools/meslek-maas-karsilastirma`  
> **Result kind:** `comparison`  
> **Öncelik:** Yüksek  
> **Tahmini efor:** 4-6 gün UI/RPC; güvenilir veri entegrasyonu ile 2-4 hafta

## 1. Ürün amacı

Kullanıcının meslek, deneyim ve hedef ülkesine göre brüt/net maaş bandı, maliyet ayarlı alım gücü ve pazar talebini gösterir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı mesleğini autocomplete ile seçer; arka planda ESCO koduna map edilir.
2. Deneyim, eğitim, hedef ülke/şehir ve çalışma tipi alınır.
3. Sistem maaş benchmark tablolarını ve ülke/city cost index değerlerini okur.
4. Sonuçta ülke bazlı brüt band, tahmini net band, maliyet ayarlı gelir ve talep sinyali listelenir.
5. Kullanıcı sonucu profile “kariyer hedefi” olarak kaydedebilir veya Job-Finding Probability aracına geçebilir.

## 3. Soru kapsamı

- Quick mode: 5 soru.
- Detailed mode: 12 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `profession_title` | Mesleğin / rolün nedir? | `profession` | autocomplete + ESCO mapping |
| `seniority` | Kıdem seviyen? | `single` | junior, mid, senior, lead, manager |
| `years_experience` | Kaç yıl ilgili deneyimin var? | `number` | 0-40 |
| `education_level` | En yüksek eğitim seviyen? | `single` | high_school, bachelor, master, phd, vocational |
| `specialization` | Uzmanlık/teknoloji/branş alanların? | `multi` | serbest etiket + öneriler |
| `certifications` | Uluslararası geçerli sertifikan var mı? | `multi` | AWS, PMP, medical_license, none |
| `regulated_profession` | Mesleğin hedef ülkede lisans/denkliğe tabi mi? | `single` | yes, no, not_sure |
| `target_countries` | Hangi ülkeleri karşılaştırmak istiyorsun? | `country/multi` | en fazla 8 |
| `target_cities` | Belirli şehirleri dahil edelim mi? | `city/multi` | opsiyonel |
| `salary_preference` | Maaşı nasıl görmek istersin? | `single` | gross_yearly, net_monthly, both |
| `current_salary_optional` | Mevcut net maaşını karşılaştırmaya dahil edelim mi? | `currency` | opsiyonel |
| `household_cost_context` | Alım gücü hesabı için hane tipin? | `single` | single, couple, family_with_children |

## 4. Skor / karar modeli

Bu araç tek bir “başarı skoru” yerine karşılaştırmalı çıktı üretir. Ancak sıralama için `salary_power_index` hesaplanır.

| Boyut | Ağırlık | Hesap |
|---|---:|---|
| `salary_level` | 25 | Meslek + kıdem benchmark maaş bandının global/target içindeki konumu. |
| `cost_adjusted_income` | 30 | Tahmini net gelir / yaşam maliyeti endeksi. |
| `demand_fit` | 20 | Meslek için iş ilanı, shortage veya istihdam sinyali. |
| `tax_social_fit` | 15 | Net tahmin, sosyal haklar ve hane maliyeti etkisi. MVP'de basitleştirilmiş. |
| `credential_transferability` | 10 | Lisans/denklik bariyeri düşükse yüksek skor. |

Sonuç bucket'ı: `high_value`, `balanced`, `expensive_but_high_salary`, `low_salary_or_high_barrier`.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablolar:

```sql
create table public.relocation_professions (
  id uuid primary key default gen_random_uuid(),
  esco_code text unique,
  label_tr text not null,
  label_en text,
  normalized_family text,
  is_regulated_default boolean not null default false
);

create table public.relocation_salary_benchmarks (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid references public.relocation_professions(id),
  country_code text not null,
  city_code text,
  seniority text,
  salary_min numeric(14,2),
  salary_median numeric(14,2),
  salary_max numeric(14,2),
  salary_period text not null default 'yearly',
  salary_type text not null default 'gross',
  currency text not null,
  sample_size integer,
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  confidence numeric(4,3) not null default 0.50
);
```

RPC: `relocation_score_profession_salary_v1(p_session_id uuid)`.

MVP fallback: önce 20 meslek x 10 ülke seed. Sonradan `workers/relocation-ingestion` maaş adapter'ları eklenir.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "profession_salary",
  "slug": "meslek-maas-karsilastirma",
  "title_tr": "Mesleğiniz Dünyada Ne Kazandırıyor? — Maaş Karşılaştırma Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 5,
  "detailed_question_count": 12,
  "result_kind": "comparison",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Senior Software Engineer için Almanya ve Hollanda dengeli; İsviçre brüt maaşta yüksek ama maliyet ve rekabet riski var. Türkiye mevcut maaşına göre maliyet ayarlı fark Almanya'da yaklaşık +%X bandında görünüyor.

Tablo alanları: ülke, şehir, brüt yıllık band, net aylık tahmini band, cost-adjusted index, demand index, credential risk, source confidence.

CTA'lar:

- İş bulma olasılığını hesapla
- Bu meslekte mentor bul
- Kariyer yol haritası aracına geç
- Sonucu profilde kariyer hedefi olarak sakla

## 8. Veri kaynakları ve ingestion notu

- ESCO Occupation/Skill API
- OECD wages/labour datasets
- Eurostat/national statistics offices
- EURES job vacancies and labour market information
- Lisanslı maaş API'leri; crowd-sourced kaynaklar sadece confidence düşük

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/meslek-maas-karsilastirma -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 03-tasinma-hazirlik-skoru-e2e.md -->

# Tool 03 — Yurt Dışına Taşınmaya Hazır mısınız? — Hazırlık Skoru E2E Dokümanı

> **Tool key:** `relocation_readiness`  
> **Slug:** `tasinma-hazirlik-skoru`  
> **Route:** `/relocation/tools/tasinma-hazirlik-skoru`  
> **Result kind:** `score`  
> **Öncelik:** Yüksek  
> **Tahmini efor:** 2-4 gün ortak engine sonrası

## 1. Ürün amacı

Finans, evrak, dil, iş/gelir, konaklama ve destek ağına göre taşınma hazırlığını ölçer ve aksiyon listesi üretir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı taşınmayı düşündüğü ülke/şehir varsa seçer.
2. Finans, evrak, dil, iş, konaklama ve sosyal destek sorularını cevaplar.
3. `relocation_score_readiness_v1` alt skorları hesaplar.
4. Sonuçta readiness skoru, en zayıf 3 boyut ve 7 günlük aksiyon planı gösterilir.
5. Negatif cevaplar `First 90 Days Planner` veya mevcut checklist sekmesine task olarak aktarılabilir.

## 3. Soru kapsamı

- Quick mode: 6 soru.
- Detailed mode: 15 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `target_known` | Hedef ülke/şehir belli mi? | `single` | country_known, city_known, not_yet |
| `savings_months` | Kaç aylık yaşam gideri birikimin var? | `single` | 0, 1-2, 3-5, 6+ |
| `debt_pressure` | Kısa vadede taşınmayı zorlayacak borç/ödeme baskın var mı? | `scale` | 1-5 ters skor |
| `passport_validity` | Pasaport ve temel kimlik evrakların güncel mi? | `single` | yes, expiring, no |
| `visa_route` | Hedef ülke için net bir vize/oturum rotan var mı? | `single` | yes, researching, no |
| `diploma_docs` | Diploma, transkript, referans ve iş belgelerin hazır mı? | `single` | ready, partial, no |
| `language_level` | Hedef ülke iş/yaşam dili seviyen? | `scale` | 0-5 CEFR mapping |
| `housing_first_month` | İlk ay konaklama planın var mı? | `single` | secured, leads, no |
| `job_income_plan` | İlk 3 ay gelir/iş planın var mı? | `single` | job_offer, remote_income, savings_only, no |
| `health_insurance` | Sağlık sigortası / erişim planın var mı? | `single` | yes, researching, no |
| `support_network` | Hedef yerde tanıdık/topluluk desteğin var mı? | `single` | strong, weak, none |
| `family_alignment` | Eş/çocuk/aile kararları net mi? | `single` | not_applicable, aligned, partial, conflict |
| `emergency_plan` | Acil durumda iletişim ve dönüş planın var mı? | `single` | yes, partial, no |
| `adaptability` | Belirsizlik ve kültürel uyuma hazır hissediyor musun? | `scale` | 1-5 |
| `timeline_realism` | Taşınma takvimin gerçekçi mi? | `scale` | 1-5 |

## 4. Skor / karar modeli

| Boyut | Ağırlık | Alt sinyaller |
|---|---:|---|
| `financial_readiness` | 25 | Birikim ayı, borç baskısı, kurulum bütçesi. |
| `legal_document_readiness` | 20 | Pasaport, vize rotası, diploma/denklik belgeleri. |
| `language_readiness` | 15 | Dil seviyesi ve hedef ülke gerekliliği. |
| `housing_logistics` | 15 | İlk ay konaklama, taşınma takvimi, hane karmaşıklığı. |
| `job_income_readiness` | 15 | İş teklifi, remote gelir, iş arama planı. |
| `support_adaptability` | 10 | Destek ağı, acil plan, psikolojik uyum. |

Bucket: `80-100 hazır`, `60-79 kontrollü ilerle`, `40-59 önce hazırlık`, `<40 yüksek risk`.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Bu araç için ortak tablolar yeterli. İsteğe bağlı profile write:

- `user_profile_attributes`: `relocation_readiness_bucket`, `relocation_target_country`, `relocation_next_action_tags`.
- `relocation_tool_results.recommendations`: task list JSON.

RPC: `relocation_score_readiness_v1(p_session_id uuid)`.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "relocation_readiness",
  "slug": "tasinma-hazirlik-skoru",
  "title_tr": "Yurt Dışına Taşınmaya Hazır mısınız? — Hazırlık Skoru",
  "category": "relocation_assessment",
  "quick_question_count": 6,
  "detailed_question_count": 15,
  "result_kind": "score",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Hazırlık skorun 68/100. Finans ve evrak tarafın orta-iyi; dil ve ilk ay konaklama tarafında açık var. Önümüzdeki 7 gün için önerilen ilk 3 aksiyon: pasaport geçerliliğini kontrol et, hedef ülke vize rotasını netleştir, ilk ay konaklama bütçesini çıkar.

Detay: radar chart veya alt skor kartları + “eksikse ekle” görev listesi.

CTA'lar:

- İlk 90 Gün Planlayıcı'ya geç
- Ülke seçimi aracına dön
- Mentor/topluluk desteği bul
- Sonucu profiline kaydet

## 8. Veri kaynakları ve ingestion notu

- Resmi göçmenlik checklist'leri
- CorteQS relocation_bureaucratic_steps
- GDPR/KVKK minimizasyon prensipleri

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/tasinma-hazirlik-skoru -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 04-sehir-eslestirme-e2e.md -->

# Tool 04 — Hangi Şehir Sana Daha Uygun? — Şehir Eşleştirme Aracı E2E Dokümanı

> **Tool key:** `city_match`  
> **Slug:** `sehir-eslestirme`  
> **Route:** `/relocation/tools/sehir-eslestirme`  
> **Result kind:** `ranked_list`  
> **Öncelik:** Orta-Yüksek  
> **Tahmini efor:** 3-5 gün mevcut relocation_rank_locations genişletmesiyle; veri kalitesi için 2 hafta

## 1. Ürün amacı

Hedef ülke veya ülkeler içindeki şehirleri bütçe, iş alanı, yaşam tarzı, topluluk ve ulaşım kriterlerine göre sıralar.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı hedef ülke veya ülke listesi seçer; ülke seçimi sonucundan prefill edilebilir.
2. Şehir büyüklüğü, bütçe, sektör, topluluk ve yaşam tarzı tercihleri alınır.
3. Mevcut `relocation_locations` satırları skorlanır.
4. Sonuçta top şehirler tablo + kart + ileride harita görünümüyle listelenir.
5. CTA kullanıcıyı `/directory`, `/cadde` ve mevcut relocation checklist sekmesine taşır.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 16 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `target_countries` | Hangi ülkelerde şehir arıyorsun? | `country/multi` | max 5 |
| `city_size` | Şehir ölçeği tercihin? | `single` | metropolis, large_city, mid_size, small_city, no_preference |
| `rent_budget` | Aylık kira/konut bütçen? | `currency` | EUR |
| `industry_hub` | Meslek alanın için şehirde güçlü bir sektör ekosistemi ister misin? | `scale` | 1-5 |
| `commute_tolerance` | Günlük ulaşım toleransın? | `single` | 15m, 30m, 60m, flexible |
| `community_need` | Türk/diaspora topluluğu şehir seçiminde ne kadar önemli? | `scale` | 1-5 |
| `safety_family` | Güvenlik, okul ve aile dostu ortam önceliğin? | `scale` | 1-5 |
| `nightlife_culture` | Kültür, etkinlik, gece hayatı önceliğin? | `scale` | 1-5 |
| `quiet_preference` | Sessiz/sakin yaşam senin için önemli mi? | `scale` | 1-5 |
| `climate` | Şehir iklimi tercihin? | `single` | mild, cold, warm, coastal, no_preference |
| `airport_access` | Türkiye'ye uçuş erişimi önemli mi? | `scale` | 1-5 |
| `language_comfort` | Yerel dili bilmeden şehirde başlama konforu ne kadar önemli? | `scale` | 1-5 |
| `housing_priority` | Konut bulunabilirliği maliyetten daha önemli mi? | `scale` | 1-5 |
| `healthcare_priority` | Sağlık erişimi önceliğin? | `scale` | 1-5 |
| `deal_breakers` | Şehir için kırmızı çizgilerin? | `multi` | too_expensive, no_jobs, no_community, unsafe, poor_transport |
| `preferred_examples` | Sevdiğin şehir tiplerine örnek ver | `text` | opsiyonel |

## 4. Skor / karar modeli

Mevcut `relocation_rank_locations_v1` ağırlıkları şehir eşleştirme için genişletilir veya yeni RPC yazılır.

| Boyut | Ağırlık |
|---|---:|
| `budget_housing_fit` | 25 |
| `job_hub_fit` | 20 |
| `lifestyle_fit` | 15 |
| `community_fit` | 15 |
| `safety_healthcare_fit` | 15 |
| `mobility_flight_fit` | 10 |

İlk MVP'de `relocation_locations.cost_index`, `housing_availability`, `healthcare_access`, `community_density`, `flight_access`, `bureaucracy_complexity` alanları doğrudan kullanılabilir. Daha sonra `city_lifestyle_tags`, `industry_hub_tags`, `public_transport_index` eklenir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek kolonlar veya tablo:

```sql
alter table public.relocation_locations
  add column if not exists city_size text,
  add column if not exists lifestyle_tags text[] not null default '{}',
  add column if not exists industry_tags text[] not null default '{}',
  add column if not exists public_transport_index numeric(6,3);
```

RPC: `relocation_score_city_match_v1(p_session_id uuid)`; mevcut `relocation_rank_locations_v1` ile aynı source_quality formatını döndürmeli.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "city_match",
  "slug": "sehir-eslestirme",
  "title_tr": "Hangi Şehir Sana Daha Uygun? — Şehir Eşleştirme Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 16,
  "result_kind": "ranked_list",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Senin için ilk 3 şehir: Berlin 82/100, Hamburg 76/100, Köln 74/100. Berlin iş ve topluluk tarafında güçlü; Hamburg yaşam kalitesi ve ulaşımda dengeli; Köln topluluk ve aile dostu yapı açısından iyi.

Detay: şehir kartı, sub-score barları, “neden uydu”, “dikkat et”, source freshness.

CTA'lar:

- Bu şehirdeki üyeleri gör
- Cadde şehir akışını aç
- İlk 90 Gün Planlayıcı'yı şehirle başlat
- Servis önerilerini görüntüle

## 8. Veri kaynakları ve ingestion notu

- relocation_locations seed/ingestion
- Resmi şehir veri portalları
- OECD/Eurostat bölgesel istihdam
- EURES
- Numbeo şehir endeksleri fallback

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/sehir-eslestirme -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 05-diaspora-ag-eslestirme-e2e.md -->

# Tool 05 — CorteQS Diaspora Ağı Eşleştirme — Mentor ve Topluluk Matchmaker E2E Dokümanı

> **Tool key:** `diaspora_matchmaker`  
> **Slug:** `diaspora-ag-eslestirme`  
> **Route:** `/relocation/tools/diaspora-ag-eslestirme`  
> **Result kind:** `match_list`  
> **Öncelik:** Yüksek ama privacy-riskli  
> **Tahmini efor:** 1-2 hafta MVP; güvenli messaging ve moderasyonla 3-5 hafta

## 1. Ürün amacı

Yeni taşınan veya taşınmayı planlayan kullanıcıları ihtiyaç/teklif, şehir, meslek, dil ve uygunluk üzerinden diğer diaspora üyeleriyle eşleştirir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı açık rıza ekranını görür: eşleşmede hangi bilgilerin kullanılacağı ve karşı tarafa ne gösterileceği açıklanır.
2. Kullanıcı ihtiyaçlarını, sunabileceği desteği, mesleğini, hedef şehir/ülkeyi ve iletişim tercihini girer.
3. Sistem sadece opt-in kullanıcı havuzunda aday üretir.
4. Sonuçta isim yerine MVP'de güvenli özet kartlar gösterilir; doğrudan iletişim için karşılıklı kabul gerekir.
5. Kabul sonrası CorteQS iç mesajlaşma, Cadde Cafe veya directory profile CTA'sı açılır.

## 3. Soru kapsamı

- Quick mode: 8 soru.
- Detailed mode: 16 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `consent_match_visibility` | Eşleşme havuzunda görünmeyi kabul ediyor musun? | `consent` | zorunlu |
| `current_location` | Şu an neredesin? | `country/city` | opsiyonel city |
| `target_location` | Hedef ülke/şehir? | `country/city` | çoklu |
| `profile_status` | Durumun ne? | `single` | planning, newly_arrived, settled, mentor, organization |
| `profession_field` | Meslek/sektör alanın? | `profession` | ESCO/free tag |
| `needs` | Hangi konularda yardıma ihtiyacın var? | `multi` | job, housing, visa, language, school, community, healthcare |
| `offers` | Hangi konularda destek verebilirsin? | `multi` | mentoring, CV review, local tips, housing lead, language practice |
| `languages` | Hangi dillerde iletişim kurabilirsin? | `multi` | TR/EN/DE/... |
| `availability` | Görüşme uygunluğun? | `single` | weekdays, evenings, weekends, async_only |
| `contact_style` | İlk temas tercihin? | `single` | message, virtual_coffee, group_event, anonymous_intro |
| `mentor_capacity` | Ayda kaç kişiye destek verebilirsin? | `number` | mentor/settled için |
| `intro_text` | Karşı tarafa gösterilecek kısa tanıtım | `text` | max 280 chars |
| `sensitive_hide` | Gizlemek istediğin alanlar | `multi` | city, profession, real_name, employer |
| `timezone` | Saat dilimi / uygun saat | `single` | auto + manual |
| `trust_signals` | Profil doğrulama sinyalleri | `multi` | completed_profile, catalog_claim, phone_verified |
| `blocking_topics` | Eşleşmek istemediğin konu/tipler | `multi` | sales, legal_advice, recruiting, none |

## 4. Skor / karar modeli

Bu araç skor değil eşleşme üretir. Aday uyumluluk skoru 0-100.

| Boyut | Ağırlık | Açıklama |
|---|---:|---|
| `need_offer_complementarity` | 35 | Kullanıcı ihtiyacı karşı tarafın teklif ettiği destekle örtüşüyor mu? |
| `geo_proximity` | 20 | Aynı ülke/şehir veya hedef lokasyonda deneyim. |
| `field_overlap` | 15 | Meslek/sektör benzerliği. |
| `language_timezone_fit` | 10 | Ortak dil ve iletişim saatleri. |
| `trust_profile_completeness` | 10 | Profil doluluğu, claim/doğrulama, aktiflik. |
| `reciprocity_recent_activity` | 10 | Son aktivite ve mentor kapasitesi. |

Hard filters: consent yoksa aday yok; kullanıcı kendisiyle eşleşemez; block/ban/hidden profile adaydan çıkar; `sensitive_hide` alanları result payload'da maskelenir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablolar:

```sql
create table public.diaspora_match_preferences (
  user_id uuid primary key default auth.uid(),
  visibility_status text not null default 'off' check (visibility_status in ('off','anonymous','profile_summary')),
  target_country_codes text[] not null default '{}',
  target_city_codes text[] not null default '{}',
  needs text[] not null default '{}',
  offers text[] not null default '{}',
  profession_tags text[] not null default '{}',
  languages text[] not null default '{}',
  availability jsonb not null default '{}',
  hidden_fields text[] not null default '{}',
  max_monthly_intros integer not null default 3,
  updated_at timestamptz not null default now()
);

create table public.diaspora_matches (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null,
  candidate_id uuid not null,
  score numeric(6,2) not null,
  score_breakdown jsonb not null default '{}',
  status text not null default 'suggested' check (status in ('suggested','requested','accepted','declined','expired','blocked')),
  intro_context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(requester_id, candidate_id)
);
```

RPC'ler: `relocation_score_diaspora_matchmaker_v1`, `diaspora_request_intro_v1`, `diaspora_accept_intro_v1`, `diaspora_decline_intro_v1`.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "diaspora_matchmaker",
  "slug": "diaspora-ag-eslestirme",
  "title_tr": "CorteQS Diaspora Ağı Eşleştirme — Mentor ve Topluluk Matchmaker",
  "category": "relocation_assessment",
  "quick_question_count": 8,
  "detailed_question_count": 16,
  "result_kind": "match_list",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> 5 güvenli eşleşme bulundu. İlk aday Berlin'de settled software engineer; CV review ve ilk iş arama stratejisinde destek verebilir. Ortak dil: Türkçe/İngilizce. İletişim için karşılıklı onay gerekir.

MVP güvenli kart: ad, soyad ve direkt iletişim gizli; sadece onay sonrası açılır.

CTA'lar:

- Tanışma isteği gönder
- Cadde Cafe'de grup buluşması oluştur
- Profilini tamamla
- Directory'de mentorları filtrele

## 8. Veri kaynakları ve ingestion notu

- CorteQS user_profile_attributes
- catalog_items / public directory
- Cadde city/interests/activity
- Kullanıcı açık rızası

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/diaspora-ag-eslestirme -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 06-yurtdisi-kariyer-yolu-e2e.md -->

# Tool 06 — Yurt Dışında Hangi Kariyer Sana Uygun? — Kariyer Yolu Aracı E2E Dokümanı

> **Tool key:** `career_path_abroad`  
> **Slug:** `yurtdisi-kariyer-yolu`  
> **Route:** `/relocation/tools/yurtdisi-kariyer-yolu`  
> **Result kind:** `persona`  
> **Öncelik:** Orta  
> **Tahmini efor:** 4-6 gün içerik + skor; veri entegrasyonu ile 2 hafta

## 1. Ürün amacı

Kullanıcının beceri, ilgi, eğitim, risk ve hedeflerine göre yurt dışı kariyer patikaları önerir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı mevcut rolünü, becerilerini, çalışma tarzını ve eğitim isteğini girer.
2. Sistem 6 kariyer patikası için skor üretir.
3. Sonuçta birincil patika, ikincil alternatif ve 6-12 aylık hazırlık roadmap'i gösterilir.
4. Kullanıcı maaş karşılaştırma, iş bulma olasılığı veya diaspora mentor eşleşmesine yönlenir.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 15 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `current_field` | Şu anki alanın / bölümün / mesleğin? | `profession` | ESCO/free tag |
| `favorite_work` | En çok hangi iş tipinden enerji alırsın? | `multi` | analysis, building, people, research, operations, sales, teaching |
| `core_skills` | Güçlü becerilerin? | `multi` | technical, communication, language, leadership, craft, healthcare, finance |
| `study_willingness` | Yurt dışında yeniden eğitim/sertifika almaya açık mısın? | `scale` | 1-5 |
| `risk_appetite` | Kariyerde yeniden başlama riskine toleransın? | `scale` | 1-5 |
| `work_environment` | Çalışma ortamı tercihin? | `single` | startup, corporate, academic, public, freelance, field_work |
| `salary_vs_stability` | Maaş mı istikrar mı? | `scale` | 1=istikrar 5=maaş |
| `regulated_barrier` | Alanında lisans/denklik bariyeri var mı? | `single` | yes, no, not_sure |
| `language_level` | İş dilinde seviyen? | `scale` | 0-5 |
| `portfolio_signal` | Portföy, yayın, proje veya referansların var mı? | `single` | strong, partial, none |
| `entrepreneurship` | Girişimcilik/freelance çalışma ilgisi? | `scale` | 1-5 |
| `research_interest` | Araştırma/akademi ilgisi? | `scale` | 1-5 |
| `hands_on_interest` | Pratik/mesleki uygulama ilgisi? | `scale` | 1-5 |
| `people_helping` | İnsanlara doğrudan destek veren rollere ilgin? | `scale` | 1-5 |
| `timeline` | Kariyer dönüşümü için zaman ufkun? | `single` | 0-3m, 3-12m, 1-2y, 2y+ |

## 4. Skor / karar modeli

6 patika aynı anda skorlanır:

| Patika | Güçlü sinyaller |
|---|---|
| `international_professional` | mevcut uzmanlık + deneyim + dil + kurumsal uyum |
| `academic_research` | araştırma ilgisi + yüksek eğitim isteği + yayın/proje |
| `vocational_practical` | hands-on beceri + denklik/sertifika açıklığı |
| `startup_entrepreneur` | risk + girişimcilik + network/ürün ilgisi |
| `remote_global` | portföy + teknik/dijital beceri + çalışma bağımsızlığı |
| `public_ngo_community` | insan/impact motivasyonu + dil + saha deneyimi |

Her patika 0-100. Birincil patika ile ikinci patika farkı <8 ise “hibrit yol” öner.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek referans tabloları:

```sql
create table public.relocation_career_paths (
  key text primary key,
  title_tr text not null,
  description_tr text not null,
  required_signals jsonb not null default '{}',
  roadmap_template jsonb not null default '{}'
);

create table public.relocation_role_path_mappings (
  id uuid primary key default gen_random_uuid(),
  profession_code text,
  career_path_key text references public.relocation_career_paths(key),
  fit_prior numeric(4,3) not null default 0.5,
  source_id uuid references public.relocation_source_registry(id)
);
```

RPC: `relocation_score_career_path_v1(p_session_id uuid)`.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "career_path_abroad",
  "slug": "yurtdisi-kariyer-yolu",
  "title_tr": "Yurt Dışında Hangi Kariyer Sana Uygun? — Kariyer Yolu Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 15,
  "result_kind": "persona",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Birincil yolun: International Professional (78/100). İkinci güçlü alternatif: Remote Global (71/100). 6 aylık odak: dil seviyesini B2'ye taşımak, portföyünü İngilizceye çevirmek, hedef ülkelerde maaş ve iş bulma olasılığını karşılaştırmak.

CTA'lar:

- Maaş karşılaştırma aracını aç
- İş bulma olasılığını hesapla
- Bu patikada mentor bul
- Roadmap'i profiline kaydet

## 8. Veri kaynakları ve ingestion notu

- ESCO occupation/skills
- UNESCO UIS education data
- EURES labour market info
- CorteQS mentor/profile data

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/yurtdisi-kariyer-yolu -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 07-expat-yasam-tarzi-persona-e2e.md -->

# Tool 07 — Sizin Yurt Dışı Yaşam Tarzınız? — Expat Persona Quiz E2E Dokümanı

> **Tool key:** `expat_lifestyle_persona`  
> **Slug:** `expat-yasam-tarzi-persona`  
> **Route:** `/relocation/tools/expat-yasam-tarzi-persona`  
> **Result kind:** `persona`  
> **Öncelik:** Düşük ama hızlı engagement  
> **Tahmini efor:** 1-2 gün ortak engine sonrası

## 1. Ürün amacı

Eğlenceli, düşük riskli persona quizi; paylaşılabilir sonuç ve CorteQS topluluk CTA'sı üretir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı 8-10 hafif yaşam tarzı sorusunu cevaplar.
2. TS veya SQL rule mapping persona puanlarını hesaplar.
3. En yüksek persona sonucu, kısa açıklama, güçlü yönler ve önerilen CorteQS alanları gösterilir.
4. Kullanıcı sonucu paylaşabilir veya profil badge'i olarak kaydedebilir.

## 3. Soru kapsamı

- Quick mode: 8 soru.
- Detailed mode: 10 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `weekend_style` | Yeni bir şehirde ilk hafta sonu ne yaparsın? | `single` | network_event, museum_walk, hiking, family_market, quiet_cafe |
| `social_energy` | Yeni insanlarla tanışmak sana nasıl gelir? | `scale` | 1-5 |
| `planning_style` | Planlı mı spontane mi? | `scale` | 1=planlı 5=spontane |
| `local_language` | Yerel dili yanlış yaparak konuşmayı dener misin? | `scale` | 1-5 |
| `community_need` | Kendi kültüründen insanlarla bağ kurma ihtiyacın? | `scale` | 1-5 |
| `comfort_zone` | Konfor alanından çıkma isteğin? | `scale` | 1-5 |
| `career_focus` | Taşınmada kariyer/network odağın? | `scale` | 1-5 |
| `family_rhythm` | Aile ve rutin odaklı yaşam sana ne kadar uygun? | `scale` | 1-5 |
| `city_vs_nature` | Büyük şehir mi doğa/sakinlik mi? | `scale` | 1=doğa 5=şehir |
| `sharing` | Sonucunu toplulukla paylaşmak ister misin? | `single` | yes, no |

## 4. Skor / karar modeli

Persona skorları cevap başına +0/+1/+2 ağırlıklarla artar.

| Persona | Sinyaller |
|---|---|
| `global_networker` | sosyal enerji, kariyer/network, şehir hayatı |
| `quiet_local` | sakinlik, rutin, yerel kültüre yavaş uyum |
| `adventure_seeker` | spontane, konfor alanı dışı, doğa/keşif |
| `family_planner` | aile, güvenlik, planlı yaşam |
| `career_builder` | kariyer, yoğun şehir, networking |
| `community_anchor` | diaspora topluluğu, yardım etme, kültürel bağ |

Eşitlikte iki persona “hibrit” olarak gösterilir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ortak tablolar yeterli. İsteğe bağlı olarak `relocation_tool_results.primary_result.persona_key` profile badge olarak `user_profile_attributes` içine yazılabilir. Consent olmadan profile write yapılmaz.

RPC: `relocation_score_lifestyle_persona_v1(p_session_id uuid)` veya tamamı TS'de hesaplanıp RPC result write yapabilir. DB-first tutarlılık için RPC önerilir.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "expat_lifestyle_persona",
  "slug": "expat-yasam-tarzi-persona",
  "title_tr": "Sizin Yurt Dışı Yaşam Tarzınız? — Expat Persona Quiz",
  "category": "relocation_assessment",
  "quick_question_count": 8,
  "detailed_question_count": 10,
  "result_kind": "persona",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Persona'n: Global Networker. Yeni şehirlerde hızlı bağlantı kurar, etkinlik ve profesyonel ağlardan enerji alırsın. Sana uygun CorteQS adımları: Cadde akışını aç, şehir etkinliklerini takip et, mentor eşleşmesini dene.

CTA'lar:

- Sonucu paylaş
- Profil badge'i olarak kaydet
- Benzer personadaki üyeleri gör
- Cadde'ye git

## 8. Veri kaynakları ve ingestion notu

- Harici veri gerekmez; içerik ve UX odaklıdır

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/expat-yasam-tarzi-persona -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 08-ilk-90-gun-planlayici-e2e.md -->

# Tool 08 — İlk 90 Gün Planlayıcı — Taşınma Sonrası Görev Motoru E2E Dokümanı

> **Tool key:** `first_90_days_planner`  
> **Slug:** `ilk-90-gun-planlayici`  
> **Route:** `/relocation/tools/ilk-90-gun-planlayici`  
> **Result kind:** `checklist`  
> **Öncelik:** Orta-Yüksek  
> **Tahmini efor:** 4-7 gün mevcut checklist RPC genişletmesi; ülke seed'leriyle 2 hafta

## 1. Ürün amacı

Varış öncesi ve sonrası ilk 90 gün için ülke/şehir/hane durumuna göre yapılacakları timeline checklist olarak üretir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı hedef ülke/şehir, varış tarihi ve hane durumunu girer.
2. Sistem mevcut `relocation_bureaucratic_steps` ve kullanıcı cevaplarından görev üretir.
3. Sonuçta `before_departure`, `day_0_7`, `day_8_30`, `day_31_90`, `ongoing` timeline'ı gösterilir.
4. Kullanıcı task'leri kişisel checklist'e kaydedebilir; bildirimler `relocation-notifications` ile tetiklenebilir.

## 3. Soru kapsamı

- Quick mode: 12 soru.
- Detailed mode: 20 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `destination` | Hedef ülke/şehir? | `country/city` | zorunlu |
| `arrival_date` | Tahmini varış tarihin? | `date` | deadline hesapları |
| `visa_status` | Vize/oturum durumun? | `single` | approved, applied, researching, not_needed, none |
| `housing_status` | İlk konaklama durumun? | `single` | secured, temporary, searching, none |
| `address_registration_known` | Adres kaydı / belediye kaydı gerekliliğini biliyor musun? | `single` | yes, no, not_applicable |
| `health_insurance` | Sağlık sigortası planın? | `single` | active, will_buy, employer, none |
| `banking` | Yerel banka/ödeme çözümü planın? | `single` | ready, researching, none |
| `phone_internet` | Telefon/internet planın? | `single` | ready, temporary, none |
| `children_school` | Çocuk okul/kayıt ihtiyacı var mı? | `single` | yes, no |
| `pets` | Evcil hayvan taşınması var mı? | `single` | yes, no |
| `job_start` | İş/okul başlangıç tarihin belli mi? | `single` | yes, no, not_applicable |
| `documents_ready` | Belgelerin dijital/fiziksel kopyaları hazır mı? | `single` | yes, partial, no |
| `emergency_contacts` | Acil iletişimleri kaydettin mi? | `single` | yes, no |
| `transport` | İlk hafta ulaşım planın? | `single` | public_transport, car, taxi, none |
| `language_course` | Dil kursu/entegrasyon programı ihtiyacın var mı? | `single` | yes, no, not_sure |
| `community_intro` | İlk ay topluluk/mentor desteği ister misin? | `single` | yes, no |
| `tax_social_security` | Vergi/sosyal güvenlik adımlarını biliyor musun? | `single` | yes, no, not_applicable |
| `credential_recognition` | Mesleki denklik/lisans adımı gerekiyor mu? | `single` | yes, no, not_sure |
| `driving_license` | Ehliyet dönüşümü/araç ihtiyacı var mı? | `single` | yes, no |
| `notification_consent` | Görev hatırlatmaları almak ister misin? | `consent` | email/in-app |

## 4. Skor / karar modeli

Bu araç skor yerine görev önceliği üretir. Her task için `priority_score` hesaplanır.

`priority_score = deadline_urgency * 0.40 + legal_dependency * 0.25 + user_gap * 0.25 + source_trust * 0.10`

Timeline grupları:

- `before_departure`: vize, belge, sigorta, konaklama, evcil hayvan.
- `day_0_7`: adres kaydı, acil hatlar, telefon, ulaşım.
- `day_8_30`: banka, sağlık sistemi, vergi, okul, topluluk.
- `day_31_90`: denklik, kalıcı konut, dil kursu, iş arama optimizasyonu.
- `ongoing`: yenilemeler, entegrasyon, network.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Mevcut `relocation_bureaucratic_steps` kullanılmalı. Kişisel task takibi istenirse:

```sql
create table public.relocation_user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  source_result_id uuid references public.relocation_tool_results(id) on delete set null,
  country_code text,
  city_code text,
  title text not null,
  description text,
  due_date date,
  phase text not null,
  status text not null default 'open' check (status in ('open','done','dismissed')),
  source_step_id uuid references public.relocation_bureaucratic_steps(id),
  created_at timestamptz not null default now()
);
```

RPC: `relocation_score_first_90_days_v1(p_session_id uuid)`; mevcut `relocation_build_checklist_v1` mantığını answer gap'leriyle birleştirir.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "first_90_days_planner",
  "slug": "ilk-90-gun-planlayici",
  "title_tr": "İlk 90 Gün Planlayıcı — Taşınma Sonrası Görev Motoru",
  "category": "relocation_assessment",
  "quick_question_count": 12,
  "detailed_question_count": 20,
  "result_kind": "checklist",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> İlk 90 gün planında 18 görev var. Kritik ilk 3: varıştan önce sağlık sigortasını netleştir, ilk hafta adres kaydı için randevu kontrolü yap, yerel telefon hattı edin. 6 görev resmi kaynak linki içeriyor.

CTA'lar:

- Görevleri kişisel checklist'e kaydet
- Hatırlatmaları aç
- Acil iletişimleri göster
- Şehirdeki servis önerilerini gör

## 8. Veri kaynakları ve ingestion notu

- Resmi ülke/şehir taşınma ve kayıt kılavuzları
- Konsolosluklar
- relocation_bureaucratic_steps
- WHO/emergency contact kaynakları

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/ilk-90-gun-planlayici -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 09-oncelikli-tasinma-sorunu-e2e.md -->

# Tool 09 — Hangi Soruna Önce Odaklanmalısın? — Öncelikli Engel Aracı E2E Dokümanı

> **Tool key:** `top_relocation_challenge`  
> **Slug:** `oncelikli-tasinma-sorunu`  
> **Route:** `/relocation/tools/oncelikli-tasinma-sorunu`  
> **Result kind:** `score`  
> **Öncelik:** Düşük ama hızlı  
> **Tahmini efor:** 1-2 gün ortak engine sonrası

## 1. Ürün amacı

Kullanıcının taşınma sürecindeki ana darboğazını bulur: vize, iş, dil, konut, finans, evrak, topluluk veya sağlık.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı en stresli alanları ve mevcut ilerleme durumunu işaretler.
2. Sistem sorun kategorilerini blocker skoruna göre sıralar.
3. Sonuçta ilk odak alanı, neden kritik olduğu ve 7 günlük mini-plan gösterilir.
4. İlgili araca otomatik geçiş önerilir.

## 3. Soru kapsamı

- Quick mode: 5 soru.
- Detailed mode: 9 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `stressors` | Şu an en çok ne zorlayıcı geliyor? | `multi` | visa, job, language, housing, money, paperwork, loneliness, school, healthcare |
| `urgency` | Taşınma ne kadar yakın? | `single` | 0-1m, 1-3m, 3-6m, 6m+ |
| `blocked_progress` | Hangi alan ilerlemeyi gerçekten durduruyor? | `multi` | same categories |
| `confidence` | Genel güven seviyen? | `scale` | 1-5 ters risk |
| `help_needed` | Dış destek almak istediğin alanlar? | `multi` | mentor, legal, recruiter, housing, language |
| `documents_state` | Evrak/vize tarafında durum? | `single` | clear, partial, confused |
| `income_state` | Gelir/iş tarafında durum? | `single` | secured, searching, not_started |
| `support_state` | Destek ağı durumun? | `single` | strong, weak, none |
| `health_family_complexity` | Sağlık/aile/okul gibi ek karmaşıklık var mı? | `multi` | children, chronic_access_need, pets, elder_support, none |

## 4. Skor / karar modeli

Her kategori için:

`category_score = user_stress * 0.35 + progress_blocker * 0.35 + urgency_multiplier * 0.20 + dependency_factor * 0.10`

Kategoriler: `visa_docs`, `job_income`, `language`, `housing`, `finance`, `community_support`, `credential_recognition`, `healthcare_family`.

En yüksek kategori primary challenge olur. İlk 3 kategori result içinde gösterilir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ortak tablolar yeterli. RPC: `relocation_score_top_challenge_v1(p_session_id uuid)`.

Result `recommendations` içinde ilgili araç bağlantısı üretilir:

- `visa_docs` -> Readiness + First 90 Days.
- `job_income` -> Job Probability + Salary.
- `language` -> Career Path / 90 Days.
- `housing` -> City Match / 90 Days.
- `community_support` -> Diaspora Matchmaker.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "top_relocation_challenge",
  "slug": "oncelikli-tasinma-sorunu",
  "title_tr": "Hangi Soruna Önce Odaklanmalısın? — Öncelikli Engel Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 5,
  "detailed_question_count": 9,
  "result_kind": "score",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> Öncelikli engelin: İş/Gelir. Taşınma takvimin yakın olduğu için iş arama netleşmeden konut ve bütçe kararları da riskli hale geliyor. Bu hafta: hedef rol listesini çıkar, maaş karşılaştırmasını çalıştır, iş bulma olasılığını hesapla.

CTA'lar:

- İş bulma olasılığını hesapla
- Maaş karşılaştırmasını aç
- Mentor bul
- Hazırlık skorunu tekrar çalıştır

## 8. Veri kaynakları ve ingestion notu

- Kullanıcı cevapları
- CorteQS tool taxonomy

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/oncelikli-tasinma-sorunu -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.


---

<!-- 10-is-bulma-olasiligi-e2e.md -->

# Tool 10 — Yurt Dışında İş Bulma Şansınız? — Job-Finding Probability E2E Dokümanı

> **Tool key:** `job_finding_probability`  
> **Slug:** `is-bulma-olasiligi`  
> **Route:** `/relocation/tools/is-bulma-olasiligi`  
> **Result kind:** `score`  
> **Öncelik:** Orta-Yüksek  
> **Tahmini efor:** 4-6 gün skor/UI; iş piyasası adapter'larıyla 2-4 hafta

## 1. Ürün amacı

Meslek, hedef ülke, dil, deneyim, credential ve network sinyallerine göre iş bulma olasılığı için açıklanabilir bir skor üretir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı meslek/rol, hedef ülke, deneyim, dil, eğitim ve iş arama durumunu girer.
2. Meslek ESCO koduna ve ülke job market signal tablolarına map edilir.
3. RPC 0-100 arası olasılık skoru ve zayıf noktaları hesaplar.
4. Sonuç “garanti değil, karar destek skoru” uyarısıyla gösterilir.
5. Kullanıcı maaş karşılaştırma, kariyer yolu veya diaspora matchmaker'a yönlenir.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 16 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `profession_title` | Hedeflediğin iş/rol nedir? | `profession` | ESCO mapping |
| `target_country` | Hangi ülkede iş arıyorsun? | `country` | tek ülke MVP |
| `years_experience` | İlgili deneyim yılın? | `number` | 0-40 |
| `seniority` | Kıdem seviyen? | `single` | junior, mid, senior, lead, manager |
| `education_level` | Eğitim seviyen? | `single` | vocational, bachelor, master, phd, other |
| `language_level` | İş dilindeki seviyen? | `scale` | 0-5 |
| `english_level` | İngilizce seviyen? | `scale` | 0-5 |
| `regulated_profession` | Mesleğin denklik/lisans gerektiriyor mu? | `single` | yes, no, not_sure |
| `credential_status` | Denklik/sertifika durumun? | `single` | recognized, in_progress, none, not_needed |
| `portfolio_cv` | CV/LinkedIn/portföyün hedef ülkeye uygun mu? | `single` | ready, partial, no |
| `applications` | Son 30 günde kaç başvuru yaptın? | `number` | 0-200 |
| `interviews` | Son 90 günde mülakat aldın mı? | `single` | multiple, one, none |
| `network` | Hedef ülkede profesyonel bağlantın var mı? | `single` | strong, weak, none |
| `work_authorization` | Çalışma izni/vize açısından durumun? | `single` | authorized, eligible, needs_sponsor, unknown |
| `salary_flexibility` | Maaş/rol esnekliğin? | `scale` | 1-5 |
| `remote_option` | Remote/hybrid veya relocation sponsor seçeneklerine açıksın? | `multi` | remote, hybrid, sponsor, local_only |

## 4. Skor / karar modeli

| Boyut | Ağırlık | Açıklama |
|---|---:|---|
| `demand_fit` | 30 | Meslek + ülke shortage/vacancy/employment sinyali. |
| `language_fit` | 20 | İş dili + İngilizce seviyesi. |
| `experience_signal` | 15 | Deneyim, kıdem, portföy ve mülakat sinyali. |
| `credential_fit` | 15 | Denklik/lisans gerekliliği ve kullanıcının hazır oluşu. |
| `work_authorization_fit` | 10 | Çalışma hakkı, sponsor ihtiyacı, vize uygunluğu. |
| `network_activity_fit` | 10 | Profesyonel network, başvuru aktivitesi, mülakat geçmişi. |

Bucket: `>=75 high`, `55-74 medium_high`, `40-54 challenging`, `<40 low`. Result text kesin olasılık gibi değil, karar destek skoru olarak yazılmalı.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablolar:

```sql
create table public.relocation_job_market_signals (
  id uuid primary key default gen_random_uuid(),
  profession_code text not null,
  country_code text not null,
  vacancy_index numeric(6,3),
  shortage_index numeric(6,3),
  unemployment_inverse_index numeric(6,3),
  language_requirement jsonb not null default '{}',
  regulated_profession boolean,
  source_id uuid references public.relocation_source_registry(id),
  freshness_at timestamptz,
  confidence numeric(4,3) not null default 0.50,
  unique(profession_code, country_code, source_id)
);
```

RPC: `relocation_score_job_probability_v1(p_session_id uuid)`.

Bu araç #2 maaş benchmark ve #6 kariyer path tablolarıyla aynı `relocation_professions` temelini paylaşır.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "job_finding_probability",
  "slug": "is-bulma-olasiligi",
  "title_tr": "Yurt Dışında İş Bulma Şansınız? — Job-Finding Probability",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 16,
  "result_kind": "score",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> İş bulma skorun 72/100: orta-yüksek. Talep ve deneyim sinyalin güçlü; yerel dil ve çalışma izni netliği skoru sınırlıyor. En hızlı kazanım: CV/LinkedIn'i hedef ülke formatına çekmek ve diaspora network üzerinden 3 bilgi görüşmesi yapmak.

CTA'lar:

- Maaş karşılaştırmasını aç
- Diaspora mentor eşleşmesi başlat
- Kariyer yolu roadmap'i oluştur
- Profiline iş arama hedefi ekle

## 8. Veri kaynakları ve ingestion notu

- ESCO occupation/skills
- EURES labour market and vacancies
- OECD employment indicators
- Ulusal shortage occupation listeleri
- Resmi göçmenlik/çalışma izni sayfaları

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/is-bulma-olasiligi -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.
