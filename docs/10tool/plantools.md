# plantools — 10 Aracı Tek Tek Gözden Geçir & Düzelt (iteratif çalışma planı)

> **Bu doküman bir SONRAKİ session'ın açılış planıdır.** 10 relocation aracını **tek tek** gözden geçirip
> kullanıcının söylediği düzeltmeleri uygularız. Açılışta bunu + `docs/10tool/HANDOVER.md`'yi oku.

## Context (neden bu iş?)

10 click-through taşınma değerlendirme aracı + ortak motor KOD TAMAM, **DB canlıda**, **main'e merge'li**
(PR #9+#10 merge edildi, tüm feature branch'leri temizlendi, sadece `main` kaldı). Araçlar şu an
**seed'li statik referans veriyle** ve ilk-tur skor modelleriyle çalışıyor. Kullanıcı şimdi her aracı
**tek tek elden geçirip** kalite düzeltmeleri eklemek istiyor. Bu, ürünü "çalışıyor" durumundan
"doğru/cilalı" durumuna taşıma turu.

**Beklenen sonuç:** Her araç, kullanıcının onayıyla düzeltilmiş haliyle canlıda + main'de; her düzeltme
SQL↔TS ayna sözleşmesini korur, testlerle kilitlenir.

## Çalışma akışı (kullanıcı kararları — KESİN)

1. **Sıra:** docs/10tool/README önerilen sırası — 07 persona → 09 challenge → 03 readiness → 04 city →
   08 planner → 01 country → 02 salary → 06 career → 10 jobprob → 05 diaspora. (Kullanıcı sırayı değiştirebilir.)
2. **Her araç için:** ÖNCE asistan mevcut durumu **özetler** (sorular / skor formülü+ağırlıklar / sonuç
   ekranı / CTA'lar), SONRA `AskUserQuestion` ile **"bu araçta ne düzeltilecek?"** diye sorar → kullanıcı
   söyler → uygulanır → doğrulanır → **hemen canlıya alınır** → sonraki araca geçilir.
3. **Düzeltme tipleri (4'ü de geçerli):** (a) soru metni/seçenek, (b) skor mantığı/ağırlık, (c) sonuç
   ekranı/metin/CTA, (d) seed referans verisi.
4. **Canlıya alma ritmi:** HER ARAÇ bitince **hemen** — yeni migration canlıya + commit + deploy doğrulama.

## Mimari — bir aracın "düzeltme dokunuş noktaları"

| Ne değişiyor | Dokunulacak yer |
|---|---|
| **Soru metni / seçenek / sıra / yardım** | Yeni migration: `relocation_tool_questions` için DELETE+INSERT (idempotent), `tool_key=<araç>`. UI otomatik yansır (QuestionRenderer answer_type'ları). |
| **Skor formülü / ağırlık / bucket eşiği** | ÜÇÜ BİRDEN: (1) yeni migration `create or replace function relocation_score_<tool>_v1`, (2) TS ayna `src/lib/relocation-tools-<x>.ts`, (3) `…-<x>.test.ts` fixture. **SQL↔TS BİREBİR** — test drift'i yakalar. |
| **Sonuç ekranı / açıklama / etiket** | `src/lib/relocation-tools-copy.ts` (CTA_TARGETS, BUCKET_LABELS, dimensionLabelsForResult, X_LABELS) + gerekiyorsa `src/components/relocation/tools/ToolResultView.tsx` (6 result_kind dalı). |
| **CTA hedefi** | `relocation-tools-copy.ts → CTA_TARGETS` (key→href+label) + skor RPC'sinin yazdığı `ctas` jsonb. |
| **Seed referans verisi** | Yeni migration: ilgili tabloya idempotent UPSERT (`relocation_country_metrics` / `relocation_professions` / `relocation_salary_benchmarks` / `relocation_job_market_signals`). |

**Değişmez kurallar:**
- Migration'lar prod'da **değişmez** — düzeltme = HER ZAMAN yeni migration (sonraki timestamp: `20260626240000`'dan ileri).
- Skor RPC adı dispatcher haritasıyla uyumlu olmalı (mig `230000` `tool_key→fn` CASE; yeni araç → oraya da ekle).
- Türkçe metin: `src/lib/text-normalization.ts` (`trUpper/trLower/trIncludes`); bare case dönüşümü yok.
  SQL Türkçe içerik UTF-8 dosya olarak `psql -f` veya **Management API curl** (PowerShell ı→i + python urllib 1010 tuzağı).
- RPC-only mutasyon, security-definer, sahip-bazlı RLS korunur.

## Araç ↔ dosya envanteri (referans)

| # | tool_key / slug | result_kind | skor RPC | TS ayna | docs |
|---|---|---|---|---|---|
| 7 | expat_lifestyle_persona / expat-yasam-tarzi-persona | persona | relocation_score_expat_lifestyle_persona_v1 | persona.ts | 07 |
| 9 | top_relocation_challenge / oncelikli-tasinma-sorunu | score | relocation_score_top_challenge_v1 | challenge.ts | 09 |
| 3 | relocation_readiness / tasinma-hazirlik-skoru | score | relocation_score_readiness_v1 | readiness.ts | 03 |
| 4 | city_match / sehir-eslestirme | ranked_list | relocation_score_city_match_v1 | city.ts | 04 |
| 8 | first_90_days_planner / ilk-90-gun-planlayici | checklist | relocation_score_first_90_days_v1 | planner.ts | 08 |
| 1 | country_match / ulke-secimi | ranked_list | relocation_score_country_match_v1 | country.ts | 01 |
| 2 | profession_salary / meslek-maas-karsilastirma | comparison | relocation_score_profession_salary_v1 | salary.ts | 02 |
| 6 | career_path_abroad / yurtdisi-kariyer-yolu | persona | relocation_score_career_path_v1 | career.ts | 06 |
| 10 | job_finding_probability / is-bulma-olasiligi | score | relocation_score_job_probability_v1 | jobprob.ts | 10 |
| 5 | diaspora_matchmaker / diaspora-ag-eslestirme | match_list | relocation_score_diaspora_matchmaker_v1 | diaspora.ts | 05 |

**Ortak motor dosyaları (her araçta paylaşılır):**
- TS: `relocation-tools-{api,types,schemas,query-keys,ranking,copy,config}.ts`
- UI: `src/components/relocation/tools/*` (QuestionStepper, QuestionRenderer, ScoreMeter, ScoreBreakdownCard,
  RankedListCard, ChecklistTimeline, ComparisonTable, MatchList, ResultCtaPanel, ToolResultView, hub kartları)
- Sayfa: `src/pages/relocation/tools/{RelocationToolsHubPage,RelocationToolPage,RelocationToolResultPage}.tsx`
- Hook: `src/hooks/useRelocationToolSession.ts`
- DB ortak: `20260626120000` (6 tablo) · `…121000` (generic RPC+helper) · `…230000` (dispatcher haritası)

## Her araç için adım şablonu (session içinde tekrarlanır)

1. **Özetle:** `docs/10tool/NN-*.md` + seed migration + skor RPC + TS ayna oku → kullanıcıya kısa özet
   (kaç soru, skor formülü/ağırlık, bucket'lar, sonuç ekranı, CTA'lar).
2. **Sor:** `AskUserQuestion` — "bu araçta ne düzeltilecek?" (soru / skor / sonuç / seed).
3. **Uygula:**
   - Soru/seed → yeni migration (idempotent DELETE+INSERT / UPSERT).
   - Skor → yeni migration (RPC) + TS ayna + test (SQL↔TS birebir).
   - Sonuç/CTA → copy.ts (+ gerekiyorsa ToolResultView).
4. **Doğrula (lokal):** `npm run verify:text && npm run test && npx tsc --noEmit` yeşil.
5. **Canlıya al:** migration Management API **curl** ile uygula; read-only doğrula (araç aktif, soru sayısı,
   skor RPC bağlı). Commit (conventional + trailer'lar) → push → main.
6. **Deploy:** gerekiyorsa Coolify; `admin-updates.ts`'e günlük dille duyuru satırı.
7. **Sonraki araca geç.**

## Verification (uçtan uca)

- **Lokal:** `npm run verify:text && npm run test && npx tsc --noEmit` (hepsi yeşil; SQL↔TS ayna testi drift'i yakalar).
- **Canlı DB (read-only):**
  `select t.key, t.is_active, (select count(*) from relocation_tool_questions q where q.tool_key=t.key) as n from relocation_tools t order by t.key;`
- **Görsel QA:** `corteqs.net/relocation/tools/<slug>` — login ile 1 oturum çöz, sonuç ekranını gözle.
- **Bağlantı:** Management API `POST /v1/projects/<ref>/database/query` (curl + `dangerouslyDisableSandbox`),
  token=`.env.local SUPABASE_ACCESS_TOKEN`. (psql alternatifi: session pooler `aws-1-eu-west-2.pooler.supabase.com`.)

## Açık konular / düzeltme dışı sonraki faz

- Seed verisi MVP/küratörlü (#1/#2/#10) — canlı API ingestion ayrı faz.
- #5 diaspora opt-in havuzu başta boş → "aday yok" döner; intro accept sonrası mesajlaşma UI ayrı iş.
- #4 city_match `relocation_locations` verisine bağlı.
- Opsiyonel `relocation_user_tasks` (kişisel checklist kaydı) + profile-write CTA'ları ertelendi (consent gerekir).

## Referanslar

- Tek doğru kaynak: `docs/10tool/` (00 ortak mimari + 01–10 E2E + README + HANDOVER).
- Hafıza: `project_assessment_tools_2026_06_26.md`.
- Plan kopyası: `~/.claude/plans/tek-tek-ara-lar-kontrol-cryptic-whisper.md`.
