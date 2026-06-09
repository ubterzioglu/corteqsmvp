# CorteQS / corfin-mvp — Clean Code Refactor Başlangıç Ölçümü (Baseline)

**Tarih:** 2026-06-09
**Branch:** `main`
**HEAD:** `3003ed4`
**Node:** v24.13.1 · **npm:** 11.8.0
**Çalışma dizini:** `c:\temp_private\corteqs\corteqs_fin`

> Bu rapor `cleancode.md` Bölüm 1–2 gereği, **herhangi bir dosya değiştirilmeden önce** çıkarılan repo gerçekliği ve ölçüm tablosudur. Tüm sayılar mevcut shell araçlarıyla (`rg`, `find`, `wc`, `grep`, `git`) elde edilmiştir; yeni dependency kurulmamıştır.

---

## 0. Kritik Baseline Gerçekliği — `cleancode.md` ve `CLAUDE.md` ile Uyumsuzluklar

`cleancode.md` ve `CLAUDE.md`, repo bu hâle gelmeden önce yazılmış. Aşağıdaki maddeler refactor stratejisini doğrudan etkilediği için en başta belgelenmiştir:

| İddia (doküman) | Repo gerçekliği (2026-06-09) | Etki |
|---|---|---|
| `src/App.tsx` monolitik, lazy loading yok, route modülerleştirilecek (Faz 2) | App.tsx **299 satır**, **37 lazy import zaten var**, muhasebe route'ları ayrı modülde. Çoğu route tek satır. | Faz 2'nin büyük kısmı **zaten yapılmış**. |
| İki Supabase client var: `src/integrations/supabase/client.ts` + `src/lib/supabase.ts` (Faz 6 konsolidasyon) | `src/lib/supabase.ts` **mevcut değil**. `@/lib/supabase` import sayısı **0**. | Faz 6 konusu **yok** — konsolidasyon zaten tamamlanmış. |
| `src/contexts/AuthContext.tsx` orphan provider, 38 bileşen `user:null` görüyor | Dosya artık **gerçek backward-compat shim**: canonical `useAuth`'a delege ediyor, `loading` alias'ı doğru sağlıyor. AuthProvider export'u canonical'dan re-export. | Faz 5 düşük riskli import migrasyonuna indirgendi; davranış zaten doğru. |

**Sonuç:** Bu repo, `cleancode.md` yazıldığından beri kapsamlı refactor görmüş. Görev, "büyük modülerleştirme"den çok **kalan düşük riskli temizlik + mevcut durumun doğrulanması ve raporlanması**na kaymıştır.

---

## 1. Doğrulama Komutları Sonuçları (Baseline)

| Komut | Sonuç | Exit | Not |
|---|---|---|---|
| `npm run verify:text` | ✅ PASS | 0 | UTF-8 doğrulaması 655 dosyada başarılı |
| `npm run lint` | ❌ **FAIL** | 1 | 531 problem: **458 error + 73 warning**. Error'ların ezici çoğunluğu `@typescript-eslint/no-explicit-any`. 2 error `--fix` ile düzeltilebilir. |
| `npm run test` | ❌ **FAIL** | 1 | **10 failed / 286 passed** (296 test, 85 dosya). Tek kırık dosya: `src/pages/admin/AdminMembersPage.test.tsx` (10/10 fail). |
| `npm run build` | ✅ PASS | 0 | `vite build` type-check yapmaz (SWC transpile). svgo eksikliği nedeniyle favicon.svg/placeholder.svg optimize edilemedi (kozmetik, build başarılı). |
| `npx tsc -p tsconfig.app.json --noEmit` | ❌ **FAIL** | 2 | **286 error**. |

### 1.1 TypeScript Hata Türleri (tsc baseline, 286 error)

| TS kodu | Adet | Açıklama |
|---|---|---|
| TS2345 | 90 | Argument type uyumsuzluğu — çoğu `supabase.from("<tablo>")` çağrısı; generated `types.ts` birçok tabloyu içermiyor (feed_likes, job_listings, generated_posts, interest_registrations, …) |
| TS2769 | 74 | No overload matches — yine eksik DB tablo tipleri |
| TS2339 | 32 | Property does not exist |
| TS2352 | 29 | Geçersiz type conversion |
| TS2322 | 21 | Type not assignable — örn. Button `variant="hero"` shadcn tipinde yok |
| TS2307 | 18 | Eksik modüller: `@/lib/mapEntities`, `@/lib/radarNews`, `@/lib/whatsappLandings`, `html-to-image` paketi |
| TS2589 | 6 | Infinitely deep type instantiation |
| TS2300 | 6 | Duplicate identifier |
| TS2353 | 3 | Unknown object literal property |
| TS2724 / TS2367 / TS1355 / TS2304 | 2/2/2/1 | Çeşitli |

**Kök neden (büyük çoğunluk):** `src/integrations/supabase/types.ts` (generated) güncel şema ile senkron değil — birçok tablo eksik. Bu **generated dosya** olduğu için `cleancode.md` 0.2/5.x gereği elle düzenlenmez. Çözüm `supabase gen types typescript` (öneri; otomatik çalıştırılmaz).

> **Önemli:** lint, test ve tsc baseline'ı **refactor başlamadan önce zaten kırık**. `cleancode.md` Bölüm 1: "tsc başarısız olursa bunu saklama, baseline hata sayısını kaydet." Dolayısıyla refactor başarı kriteri **mutlak yeşil** değil, **baseline'a göre regresyon yokluğu**dur: her faz sonunda lint error / test fail / tsc error sayıları baseline'ı **aşmamalı** (tercihen azalmalı).

---

## 2. Ölçüm Tablosu (Baseline Metrikleri)

| Metrik | Değer | Nasıl elde edildi |
|---|---|---|
| Toplam `src` dosya sayısı | 570 | `find src -type f \| wc -l` |
| TS dosya (.ts, test/d.ts hariç) | 90 | `find src -name "*.ts" ! -name "*.test.ts" ! -name "*.d.ts"` |
| TSX dosya (.tsx, test hariç) | 371 | `find src -name "*.tsx" ! -name "*.test.tsx"` |
| Test dosyası (.test.ts/.test.tsx) | 84 | `find src \( -name "*.test.ts" -o -name "*.test.tsx" \)` |
| App.tsx satır sayısı | 299 | `wc -l src/App.tsx` |
| App.tsx import satırı (`^import`) | 19 | `grep -c "^import"` (37 lazy `const … = lazy()` ayrıca) |
| App.tsx `<Route` sayısı | 111 | `grep -c "<Route"` |
| App.tsx `Navigate` kullanımı | 28 | `grep -c "Navigate"` |
| AdminLayout.tsx satır sayısı | 721 | `wc -l src/components/admin/AdminLayout.tsx` |
| src/lib/admin.ts satır sayısı | 461 | `wc -l src/lib/admin.ts` |
| src/lib altındaki dosya sayısı | 74 | `find src/lib -type f \| wc -l` |
| Component+lib içinde `supabase.from(` (dosya) | 131 dosyada en az 1 (import) | `rg '@/integrations/supabase/client' -l` |
| `supabase.rpc(` kullanan dosya | 8 | `rg 'supabase\.rpc\(' -l` |
| `supabase.auth.` kullanan dosya | 18 | `rg 'supabase\.auth\.' -l` |
| `@/integrations/supabase/client` import (dosya) | 131 | `rg -l` |
| `@/lib/supabase` import (dosya) | **0** (dosya yok) | `rg '@/lib/supabase'` → no match |
| `@/contexts/AuthContext` import (dosya) | 32 (testler dahil) | `rg -l` |
| `@/components/auth/useAuth` import (dosya) | yaygın (canonical) | `rg -l` |
| `as any` | **109 occurrence / 37 dosya** | `rg 'as any' -l` + count |
| `: any` | **58 occurrence / 31 dosya** | `rg ': any\b'` count |
| `@ts-ignore` | 0 | `rg '@ts-ignore' -l` |
| `@ts-expect-error` | 0 | `rg '@ts-expect-error' -l` |
| ESLint disable yorumu | 6 dosya | `rg 'eslint-disable' -l` |
| TODO / FIXME / HACK | 4 dosya | `rg '\b(TODO\|FIXME\|HACK)\b' -l` |
| Lazy import (`lazy(`) | App.tsx'te 37 (ayrıca 2 başka yerde) | `rg 'lazy\(' -l` |
| Build sonucu | ✅ PASS (exit 0) | `npm run build` |
| Lint sonucu | ❌ FAIL (exit 1, 458 error/73 warn) | `npm run lint` |
| Test sonucu | ❌ FAIL (exit 1, 10 fail/286 pass) | `npm run test` |
| Typecheck sonucu | ❌ FAIL (exit 2, 286 error) | `npx tsc -p tsconfig.app.json --noEmit` |

---

## 3. Faz Planı — Repo Gerçekliğine Göre Revize

| Faz | cleancode.md amacı | Bu repodaki durum | Aksiyon |
|---|---|---|---|
| 1 | Güvenli kod hijyeni | Geçerli | **Uygula** — unused import/var, duplicate, dead comments (düşük riskli) |
| 2 | App.tsx route modülerleştirme | **Zaten yapılmış** (299 satır, lazy + muhasebe modülü) | **Doğrula + raporla**; ek bölme gerekirse değerlendir |
| 3 | AdminLayout.tsx ayrıştırma (721 satır) | Hâlâ büyük | **Değerlendir** — risk/fayda; davranış korunarak alt bileşenlere böl |
| 4 | admin.ts servis ayrıştırma (461 satır) | İki sorumluluk (RPC wrapper + referral CRUD) | **Uygula** — barrel export ile geriye uyumlu böl |
| 5 | Auth shim azaltma | Shim doğru çalışıyor, 32 import | **Düşük riskli import migrasyonu**; davranış zaten doğru |
| 6 | Supabase client konsolidasyon | **Konu yok** (`lib/supabase.ts` yok) | **Sadece raporla** (tamamlanmış) |
| 7 | Veri erişim standartlaştırma | Kısmen yapılmış (muhasebe, hooks) | Yüksek öncelikli 1–2 domain, güvenliyse |
| 8 | TS güvenliği kademeli | 286 tsc error + 458 lint any-error | **Envanter + plan**; generated types kök neden → öneri |
| 9 | Script hijyeni | package.json'da lokal Windows path var | İncele, geriye uyumlu öneri |
| 10 | Dead code / legacy | — | Analiz, yalnızca KESİN_ORPHAN sil |

---

## 4. Dokunulmayacak Alanlar (cleancode.md 0.2 / Bölüm 5 teyidi)

`server.mjs`, `vite.config.ts`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `src/components/ui/*`, `supabase/migrations/*`, `info-*.html`, `lansman/index.html`. Bu alanlarda tespit edilen sorunlar yalnızca rapora yazılacak.

**Commit / push / deploy / Supabase write YAPILMAYACAK.**
