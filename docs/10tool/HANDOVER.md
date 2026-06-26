# Relocation Tools (10 Araç) — Handover / Devir Dokümanı

> **Tarih:** 2026-06-26 (güncellendi) · **Branch:** `feat/relocation-tools-10` (push'lu) ·
> **Durum:** 🎉 **10/10 araç + ortak motor KOD TAMAM + DB CANLIYA UYGULANDI + dispatcher fix.**
> Kalan tek iş: **Coolify frontend deploy + görsel QA** (manuel).
> **Tek doğru kaynak:** `docs/10tool/` (00 ortak mimari + 01–10 araç E2E + README)
> **Plan dosyası:** `~/.claude/plans/executive-summary-we-zazzy-hamming.md`
> **Hafıza:** `project_assessment_tools_2026_06_26.md`
>
> **2026-06-26 deploy oturumu sonucu:**
> - 13 migration (12 + `20260626230000` dispatch fix) **canlı DB'ye uygulandı** (Management API curl;
>   python urllib Cloudflare 1010 verir → curl şart). 6 tablo + 10 araç kayıtlı/aktif + 10 skor RPC +
>   seed (country_metrics=12, professions=5, salary=40, job_signals=40). RLS 6/6 tabloda açık. Read-only doğrulandı.
> - **DISPATCHER BUG bulundu+düzeltildi:** `complete_session` skor fonksiyonunu `'relocation_score_'||tool_key||'_v1'`
>   diye türetiyordu; 5 araçta (readiness/top_challenge/career_path/first_90_days/job_probability) gerçek
>   kısaltılmış adla uyuşmuyordu → o araçlar nötr "skor yok" dönüyordu. `tool_key→fn` açık haritası eklendi
>   (mig `230000`). Canlıda 10/10 doğru fonksiyona bağlı doğrulandı.
> - Commit'ler `feat/relocation-tools-10`'a push'lu: `e3db79d` (ana iş) → `bfeba24` (fix) → `fafbdd2` (admin-updates).
> - types regen ATLANDI (api `supabase as any` + `as unknown as T` kullanıyor; tsc 0 hata; gerekmiyor).
> - **DİKKAT:** çalışan dizinde PARALEL IDE işi sürüyor (premium profile, social-share, ProfilePage,
>   kökte 2 `.html`) — bunlar BENİM DEĞİL, dokunulmadı. Oturum sırasında branch dışarıdan değişti
>   (`feat/social-share-vault`'a) — git checkout ile geri dönüldü; `stash@{0}` = social-share'in sitemap.xml'i.

---

## 1. Bu iş ne?

CorteQS'e diaspora/taşınma odaklı **10 click-through değerlendirme aracı** ekleniyor. Hepsi **tek ortak motoru**
(`relocation_tool_*` tabloları + generic session RPC'leri + paylaşımlı UI) paylaşır; her araç kendi soru
seti / skor modeli / sonuç ekranı / CTA'larına sahiptir.

**Kullanıcı kararları:**
- docs/10tool sözleşmesi = **tek doğru kaynak**. (İlk denemede `assessment_*` motoru kurulmuştu; SİLİNDİ,
  yerine docs'un `relocation_tool_*` sözleşmesi geldi.)
- Araçlar **tek tek**, docs/10tool/README uygulama sırasıyla geliştiriliyor.
- Veri = **seed'li statik referans tabloları** (canlı ingestion ayrı/sonraki faz).
- **Auth: login zorunlu** (araçlar `/relocation/tools` altında, hepsi `RequireAuth`).
- Mimari ayna referansı = mevcut **Relocation modülü** (`src/lib/relocation-*.ts`,
  `20260619100000_relocation_core.sql`): RPC-only mutasyon, security-definer, SQL↔TS ayna, sahip-bazlı RLS.

---

## 2. Tamamlananlar — Ortak Motor (Faz 0)

**Migration'lar (canlıya UYGULANMADI):**
- `supabase/migrations/20260626120000_relocation_tools_core.sql` — 6 ortak tablo + RLS:
  `relocation_tools` (key PK + slug), `relocation_tool_questions`, `relocation_tool_sessions`,
  `relocation_tool_answers` (ayrı/resumable), `relocation_tool_results`, `relocation_tool_events`.
  Araç/soru = authenticated read; session/answer/result/event = sahip-bazlı (auth.uid()); result yazma sadece RPC.
- `supabase/migrations/20260626121000_relocation_tools_scoring_rpcs.sql` — generic RPC'ler +
  ortak skorlama yardımcıları:
  - `relocation_tool_start_session(tool_key, mode, source_move_id)` → `relocation_tool_save_answer(session, qkey, answer)`
    → `relocation_tool_complete_session(session)` → `relocation_tool_record_event(...)`.
  - **`complete_session` dispatcher**: `relocation_score_<tool_key>_v1` fonksiyonunu `pg_proc`'ta arar,
    bulursa çağırır, yoksa nötr sonuç yazar. → Yeni araç eklemek = sadece seed + skor RPC yazmak.
  - Ortak yardımcılar: `rl_tool_require_user`, `rl_tool_owned_session`, `rl_tool_answers_json`,
    `rl_tool_clamp_neutral`, `rl_tool_weighted_score(breakdown, weights)`, `rl_tool_write_result(...)`.
  - (Not: `rl_tool_resolve_bucket` ve `rl_readiness_opt_score` #3 migration'ında eklendi — `create or replace`,
    idempotent; sonraki skor araçları `rl_tool_resolve_bucket`'ı kullanır.)

**TS / Lib (`src/lib/relocation-tools-*.ts`):**
- `types`, `schemas` (Zod: toolMode/answerValue/saveToolAnswer), `query-keys`, `api`
  (`listTools`/`getToolBySlug`/`startSession`/`saveAnswer`/`completeSession`/`recordEvent`/`getResult`),
  `ranking` (generic SQL↔TS ayna: `clamp01OrNeutral`/`computeWeightedScore`/`resolveBucket`/`toScore100`),
  `copy` (CTA haritası + UI metinleri + `dimensionLabelsForResult` + `bucketLabel`), `config` (typed registry, boş).
- Hook: `src/hooks/useRelocationToolSession.ts` (start→save→complete tek mutasyon).

**UI (`src/components/relocation/tools/`):** `RelocationToolsHub`, `ToolLandingCard`, `ToolModeSelector`,
`QuestionStepper`, `QuestionRenderer` (11 answer_type), `ScoreMeter`, `ScoreBreakdownCard`, `ResultCtaPanel`,
`RankedListCard` (#4'te), `ChecklistTimeline` (#8'de), `ComparisonTable` (#2'de), `MatchList` (#5'te),
**`ToolResultView`** (6 result_kind: score/ranked_list/persona/checklist/comparison/match_list).

**Sayfalar (`src/pages/relocation/tools/`):** `RelocationToolsHubPage`, `RelocationToolPage`, `RelocationToolResultPage`.

**Routing (`src/App.tsx`):** `/relocation/tools`, `/:toolSlug`, `/:toolSlug/session/:sessionId`,
`/:toolSlug/result/:resultId` — hepsi `RequireAuth` (lazy import).

---

## 3. Tamamlanan Araçlar (10/10 — TÜMÜ)

| # | tool_key / slug | result_kind | migration | TS ayna + test | Özet |
|---|---|---|---|---|---|
| 7 | `expat_lifestyle_persona` / expat-yasam-tarzi-persona | persona | `…130000` | `relocation-tools-persona.ts` (8) | 6 persona tally; ±0.001 hibrit |
| 9 | `top_relocation_challenge` / oncelikli-tasinma-sorunu | score | `…140000` | `relocation-tools-challenge.ts` (6) | 8 kategori; primary engel + CTA map |
| 3 | `relocation_readiness` / tasinma-hazirlik-skoru | score | `…150000` | `relocation-tools-readiness.ts` (8) | 6 ağırlıklı boyut; bucket + zayıf 3 |
| 4 | `city_match` / sehir-eslestirme | ranked_list | `…160000` | `relocation-tools-city.ts` (6) | **relocation_locations** skorlar (seed yok) |
| 8 | `first_90_days_planner` / ilk-90-gun-planlayici | checklist | `…170000` | `relocation-tools-planner.ts` (7) | 18 görev katalog; 5 faz; priority |
| 1 | `country_match` / ulke-secimi | ranked_list | `…180000` | `relocation-tools-country.ts` (9) | **relocation_country_metrics** (12 ülke seed); deal-breaker cap 0.40 |
| 2 | `profession_salary` / meslek-maas-karsilastirma | comparison | `…190000` | `relocation-tools-salary.ts` (10) | **relocation_professions + relocation_salary_benchmarks** (5 meslek×8 ülke seed); salary_power_index; cost_index relocation_country_metrics'ten |
| 6 | `career_path_abroad` / yurtdisi-kariyer-yolu | persona | `…200000` | `relocation-tools-career.ts` (8) | 6 kariyer patikası tally (seed yok); hibrit <0.08; roadmap inline |
| 10 | `job_finding_probability` / is-bulma-olasiligi | score | `…210000` | `relocation-tools-jobprob.ts` (9) | **relocation_job_market_signals** (5 meslek×8 ülke); tek ülke; 6 boyut; bucket high/medium_high/challenging/low |
| 5 | `diaspora_matchmaker` / diaspora-ag-eslestirme | match_list | `…220000` | `relocation-tools-diaspora.ts` (9) | **diaspora_match_preferences + diaspora_matches**; opt-in havuz; güvenli kart (isim/iletişim gizli); intro request/accept/decline RPC; consent hard-filter |

**Her aracın anatomisi (yeni araç eklerken kopyala):**
1. Seed migration: `relocation_tools` satırı (+`weights` jsonb skor araçlarında) + `relocation_tool_questions` satırları
   (idempotent: önce DELETE, sonra INSERT) + araca özel referans tablosu (gerekiyorsa).
2. `relocation_score_<tool_key>_v1(p_session_id uuid)` RPC (security definer) → `rl_tool_write_result(...)` çağırır.
3. TS ayna `src/lib/relocation-tools-<x>.ts` (ağırlık/formül SQL ile BİREBİR) + `.test.ts` (≥5 fixture).
4. `dimensionLabelsForResult` (copy) kaydı; gerekirse `ToolResultView`'a yeni result_kind dalı.

**Skor / ayna sözleşmesi (KRİTİK):** SQL skor RPC'sindeki ağırlık/formül ile TS ayna dosyası **birebir**
aynı olmalı; `*.test.ts` drift'i yakalar. Birini değiştiren diğerini de günceller.

---

## 4. Doğrulama Durumu

`npm run verify:text && npm run test && npm run build` → **YEŞİL**. Son: **855 test geçti** (136 dosya),
build başarılı, tsc temiz, eslint temiz (relocation-tools dosyaları). `verify:text` pretest hook'unda otomatik koşuyor.

---

## 5. KALAN İŞ

### A) Araç geliştirme — ✅ BİTTİ
10/10 araç + ortak motor kod tamam. Kalan tek iş: **canlıya alma** (aşağıda). Yeni araç yok.

### B) Canlıya alma — DURUM (2026-06-26 oturumu)
- ✅ **git commit/push** — relocation-tools `feat/relocation-tools-10`'da izole: `e3db79d`+`bfeba24`+`fafbdd2`, push'lu.
- ✅ **13 migration canlıya uygulandı** (12 + dispatch fix `230000`); read-only doğrulandı.
- ✅ **types regen** — gerekmedi (atlandı; `as any` deseni + tsc 0 hata).
- ✅ **admin-updates.ts** — 26 Haziran kaydı "DB canlıya alındı + fix" ile güncellendi (commit `fafbdd2`).
- ⏳ **KALAN (manuel):** Coolify frontend deploy → `corteqs.net/relocation/tools` görsel QA (her slug'da 1 oturum).

#### (Orijinal adımlar — referans)
1. **git commit/push** — **DİKKAT:** çalışan dizinde benim YAZMADIĞIM değişiklikler de var (paralel iş):
   `src/lib/admin-shell/*`, `src/pages/admin/AdminSocialShareVaultPage.tsx`, `social-share-vault.ts`,
   `public/sitemap.xml`, `src/pages/admin/routes.tsx`, `admin-navigation-registry/route-meta`, kökte 2 `.html`
   + `_files/` dizini. **`src/App.tsx` HEM benim (relocation/tools route) HEM onların (admin route) değişikliğini içeriyor.**
   Commit'i ayrıştır: relocation-tools işini ayrı commit/branch'te topla. Yeni branch öner (main'desin).
2. **12 migration'ı canlı DB'ye** `psql -f` ile UTF-8 dosya olarak (Türkçe karakter tuzağı). Sırayla:
   `120000 → 121000 → 130000 → 140000 → 150000 → 160000 → 170000 → 180000 → 190000 → 200000 → 210000 → 220000`.
   Bağlantı: session pooler `aws-1-eu-west-2.pooler.supabase.com`, user `postgres.<ref>`,
   `.env.local SUPABASE_DB_PASSWORD`; veya Management API curl POST `/database/query`.
   (Bash tool sandbox dış ağa erişemez → `dangerouslyDisableSandbox` gerekli.)
3. **types regen** (`relocation_tool_*` + `relocation_country_metrics`): Management API + GEÇERLİ
   `SUPABASE_ACCESS_TOKEN`. Regen edilmezse mevcut `as unknown as T` cast deseni zaten çalışıyor (api dosyalarında var).
4. **Coolify deploy** → `corteqs.net/relocation/tools` görsel QA (her aracın slug'ında 1 oturum).
5. **admin-updates.ts** → her araç canlıya alınınca günlük dille duyuru satırı (deploy şart — kayıt≠canlı).

### C) Bilinen sınırlamalar / kararlar
- **#4 city_match** `relocation_locations` verisine bağlı — canlıda aktif şehir satırı olmalı (relocation seed mevcut);
  boş ülke için araç güvenli uyarı dönüyor.
- **#1/#2/#10 seed verisi** küratörlü/kaba normalize (MVP); canlı API ingestion ayrı faz.
- **#7 persona** aşırı uçta global_networker≡career_builder (1.0) → hibrit; engagement aracı için kabul.
- **#8 planner** `arrivalProximity` `Date.now()` kullanır → testlerde göreceli tarih kullan, sabit tarih assert etme.
- **#10 job_probability** seed verisi küratörlü (MVP); slug `is-bulma-olasiligi` (bazı eski CTA'lar `yurtdisi-is-bulma-olasiligi`
  diye linkliyor — kozmetik, kritik değil).
- **#5 diaspora** opt-in havuz başlangıçta BOŞ — gerçek kullanıcı opt-in olana dek araç dürüstçe "aday yok" döner
  (kullanıcı havuza katılır). İsim/iletişim ASLA otomatik paylaşılmaz; intro accept/decline RPC'leri var ama
  accept sonrası mesajlaşma UI'ı (iç messaging/Cadde) ayrı iş. Standalone result sayfasında intro butonu yok
  (sadece canlı araç sayfasında).
- Opsiyonel `relocation_user_tasks` (kişisel checklist kaydı, docs/08 §5) ve profile-write CTA'ları
  ertelendi (consent gerektirir).

---

## 6. Yeni Session İçin Açılış Promptu (öneri)

```
docs/10tool/HANDOVER.md'yi oku. Relocation Tools işi: 10/10 araç + ortak motor KOD TAMAM,
855 test yeşil, commit/canlı YOK. Sıra CANLIYA ALMADA (HANDOVER §5-B): commit ayrıştır
(çalışan dizinde paralel admin işi var, App.tsx ikisini içeriyor) → 12 migration psql -f →
types regen → Coolify deploy → /relocation/tools görsel QA → admin-updates.ts duyuru.
```
