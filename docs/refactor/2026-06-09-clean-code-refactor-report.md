# CorteQS Clean Code Refactor Raporu

**Tarih:** 2026-06-09 · **Branch:** `main` · **Başlangıç HEAD:** `3003ed4`
**Kapsam kararı:** Güvenli fazları uygula + riskli/büyük fazları analiz edip plana yaz; kırık baseline'da yalnızca güvenli düzeltmeleri dene.
**Baseline ölçümü:** [2026-06-09-clean-code-baseline.md](./2026-06-09-clean-code-baseline.md)

---

## 1. Yönetici Özeti

Bu refactor, `cleancode.md` master prompt'una göre **kontrollü ve kanıtlı** biçimde yürütüldü. İlk bulgu, dokümanların (cleancode.md + CLAUDE.md) repo gerçekliğinin **gerisinde** kaldığıdır: App.tsx zaten modülerleşmiş (299 satır + lazy loading), `src/lib/supabase.ts` artık yok, `AuthContext.tsx` ise gerçek bir backward-compat shim. Ayrıca lint/test/tsc baseline'ı refactor başlamadan **zaten kırıktı** (458 lint error, 10 test fail, 286 tsc error) — kök neden büyük ölçüde generated `supabase/types.ts`'in güncel şema ile senkron olmaması.

Bu nedenle başarı kriteri "mutlak yeşil" değil, **baseline'a göre sıfır regresyon** olarak belirlendi.

**Uygulanan (düşük riskli, doğrulanmış):**
- **Faz 4 — `src/lib/admin.ts` servis ayrıştırması**: 461 satırlık tek dosya, davranışı birebir koruyan 7 domain dosyasına (`src/lib/admin/`) bölündü; `admin.ts` geriye uyumlu barrel'e dönüştü. 19 tüketicinin hiçbiri değişmedi.
- **Faz 1 — Güvenli hijyen**: 6 dosyada `catch (err: any)` → `catch (err: unknown)` + `err instanceof Error` narrow. Lint error 458 → 452 (−6), davranış korundu.

**Sonuç metrikleri (sonra):** lint 452 error (−6), tsc 286 (=baseline, regresyon yok), build ✅ PASS, verify:text ✅ PASS.

**Ertelenenler (rapora plan olarak yazıldı):** AdminLayout.tsx ayrıştırma (721 satır), auth shim silme (38 dosya migrasyonu), veri erişim standartlaştırma (38 anti-pattern), generated-types kaynaklı tsc/lint hataları, kırık import'lar (eksik modül/paket).

**Commit/push/deploy/Supabase-write YAPILMADI.**

---

## 2. Başlangıç Metrikleri

Bkz. baseline raporu. Özet:

| Metrik | Değer |
|---|---|
| src dosya / TS / TSX / test | 570 / 90 / 371 / 84 |
| App.tsx satır / route / lazy import | 299 / 111 / 37 |
| AdminLayout.tsx satır | 721 |
| src/lib/admin.ts satır | 461 |
| `as any` / `: any` | 109 (37 dosya) / 58 (31 dosya) |
| lint | ❌ 458 error + 73 warn |
| test | ❌ 10 fail / 286 pass |
| tsc | ❌ 286 error |
| build / verify:text | ✅ / ✅ |

---

## 3. Uygulanan Değişiklikler

### 3.1 Faz 4 — admin.ts servis ayrıştırması (UYGULANDI)

`src/lib/admin.ts` (461 satır) → 7 domain dosyası + barrel:

```
src/lib/admin/
├── admin-types.ts          (AttributeRule, RoleManagement* tipleri)
├── admin-access-api.ts     (userIsAdmin)
├── admin-role-api.ts       (setUserRoleAsAdmin, getRoleManagementBundle)
├── admin-feature-api.ts    (5 feature/override RPC)
├── admin-profile-api.ts    (profil tipi, attribute, section, entity metadata)
├── admin-taxonomy-api.ts   (3 taxonomy RPC)
├── admin-approval-api.ts   (reviewApprovalRequestAsAdmin)
└── admin-referral-api.ts   (13 referral CRUD fonksiyonu)
src/lib/admin.ts            (geriye uyumlu barrel — sadece re-export)
```

**Kasıtlı tasarım kararı:** `admin/` klasörüne `index.ts` KONMADI. Aksi halde `@/lib/admin` çözümlemesi `admin.ts` ile `admin/index.ts` arasında belirsizleşirdi. Barrel olarak `admin.ts` dosyası korunarak çözümleme net tutuldu.

### 3.2 Faz 1 — Güvenli hijyen (UYGULANDI)

6 dosyada `catch (block: any)` → `catch (block: unknown)` + `block instanceof Error ? block.message : undefined`:
`ConsultantCategoryManager.tsx`, `ConsultantServiceRequests.tsx`, `CityAmbassadors.tsx`, `InterestForm.tsx`, `Onboarding.tsx`, `ServiceRequestForm.tsx`.

Supabase hataları daima `Error` instance'ı olduğundan toast davranışı birebir korundu; non-Error edge case'inde `undefined` (boş description) — eski `any` ile pratikte aynı.

### 3.3 İncelenip "temiz" bulunan, dokunulmayan dosyalar

`src/lib/features.ts`, `src/components/admin/admin-navigation.ts`, `src/hooks/useFeatureFlags.ts`, `src/components/auth/AuthProvider.tsx` — dead code/unused import/duplicate bulunmadı. (`admin-navigation.ts`'teki `ScrollText` + `ScrollText as ScrollTextIcon` ikisi de kullanımda; gerçek duplicate değil.)

---

## 4. Değiştirilen / Eklenen Dosyalar

| Dosya | Önceki Sorun | Uygulanan Değişiklik | Davranış Korundu mu? | Nasıl Doğrulandı? | Risk |
|---|---|---|---|---|---|
| `src/lib/admin.ts` | 461 satır, 2+ domain karışık | Pure barrel'e dönüştü (re-export) | Evet (aynı export imzaları) | tsc 286=286, build ✅, 19 tüketici dokunulmadı | Düşük |
| `src/lib/admin/*.ts` (7 yeni) | — | admin.ts fonksiyonları taşındı (birebir) | Evet | tsc'de aynı 5 hata sadece konum değişti | Düşük |
| 6 × `catch` dosyası | `catch (any)`, type-unsafe | `unknown` + Error narrow | Evet (Error path aynı) | lint −6 error, tsc regresyon yok | Düşük |
| `docs/refactor/*` (2 yeni) | — | Baseline + bu rapor | n/a | — | Yok |

**Toplam:** 7 dosya değişti, 9 yeni dosya (7 admin modülü + 2 rapor), 0 silindi. Diff: +69 / −473.

---

## 5. Route Davranışı Doğrulaması (Faz 2)

App.tsx **zaten modülerleşmiş** durumda (299 satır, 37 lazy import, muhasebe route'ları ayrı modülde). cleancode.md 3.1'deki tüm korunması gereken URL'ler ve redirect'ler birebir mevcut. Route'a **dokunulmadı**; doğrulama yapıldı.

| Kontrol | Durum |
|---|---|
| Public route path'leri (/, /founders, /lansman, /cadde, /anket, /directory, …) | Korundu (App.tsx 132-216) |
| Redirect'ler (/hakkimizda→/founders, /190519→/190519memory, /addwa→/addcom, /contributor→/commercial/contributor, …) | Korundu (App.tsx 134, 148, 218-225) |
| `/cadde` RequireAuth + RequireFeature(caddeAccess) gate | Korundu (App.tsx 172-181) |
| `/profile`, `/addcom/edit/:slug` RequireAuth | Korundu |
| `/admin/*` nesting + muhasebeRoutes + NotFound fallback | Korundu (App.tsx 226-288) |

**Sonuç:** Tüm satırlar `Korundu`.

---

## 6. Auth Compatibility Durumu (Faz 5)

`src/contexts/AuthContext.tsx` **gerçek bir backward-compat shim** (orphan değil): canonical `@/components/auth/useAuth`'a delege eder, `loading` alias'ını (`isLoading`) doğru sağlar, `AuthProvider`'ı canonical'dan re-export eder. Davranış zaten doğru.

**Kullanım envanteri:** 38 import noktası (kod), hepsi `useAuth` import ediyor; `AuthProvider`'ı contexts'ten import eden **yok**. Bunların **17'si `loading` alias'ına bağımlı**.

**Karar:** Shim'i silmek 38 dosyada import değişikliği + 17 dosyada `loading`→`isLoading` rename gerektirir → cleancode.md'nin 25 dosya / 1500 satır eşiğini tek başına aşar ve regresyon riski taşır. cleancode.md Faz 5: "shim hâlâ gerekliyse koru ve rapora yaz." **Shim korundu.** Migrasyon planı için bkz. Bölüm 12.

---

## 7. Supabase Client Konsolidasyon Durumu (Faz 6)

**Konu yok.** `src/lib/supabase.ts` **mevcut değil**; `@/lib/supabase` import sayısı **0**. Tüm kod tek canonical client'ı (`@/integrations/supabase/client`, 131 dosya) kullanıyor. Konsolidasyon bu repoda zaten tamamlanmış. (CLAUDE.md'nin "iki client" iddiası eskimiş.)

---

## 8. AdminLayout Ayrıştırma Durumu (Faz 3 — ERTELENDİ)

`src/components/admin/AdminLayout.tsx` **721 satır** ve hâlâ büyük (auth state, admin access kontrolü, login/logout/password reset, responsive menü, navigasyon, layout render iç içe). Ayrıştırılması yüksek değerli ama **yüksek riskli ve büyük diff**: login/password-reset handler'ları, redirect URL'leri, mobile/desktop menü link bütünlüğü ve admin outlet context'i davranış-kritik. "Güvenli fazlar" kapsamı gereği **ertelendi**, plan Bölüm 12'de.

---

## 9. admin.ts Servis Ayrıştırma Durumu (Faz 4 — TAMAMLANDI)

Bkz. Bölüm 3.1. Fonksiyon adları, parametre adları, RPC string'leri, dönüş tipleri, error throw davranışı birebir korundu. Barrel backward-compat sağlandı; circular dependency yok (alt dosyalar yalnızca client + paylaşılan referral/text helper'larına ve `admin-types`'a bağımlı).

---

## 10. TypeScript Teknik Borç Durumu (Faz 8 — ENVANTER + PLAN)

| Tür | Adet |
|---|---|
| tsc error (toplam) | 286 |
| → TS2345/TS2769 (eksik DB tipleri, `supabase.from("<tablo>")`) | 164 |
| → TS2307 (eksik modül/paket) | 18 |
| → diğer (TS2339/2352/2322/…) | 104 |
| `as any` / `: any` (occurrence) | ~103 / 58 |
| lint error (çoğu no-explicit-any) | 452 |

**Kök neden:** tsc hatalarının büyük çoğunluğu generated `src/integrations/supabase/types.ts`'in birçok tabloyu (feed_likes, job_listings, generated_posts, interest_registrations, …) içermemesinden kaynaklanıyor. Bu **generated dosya** (cleancode.md 0.2/5.x: elle düzenlenmez).

**Öneri (otomatik çalıştırılmadı):**
```bash
supabase gen types typescript --project-id injprdrsklkxgnaiixzh > src/integrations/supabase/types.ts
```
Bu tek adım, TS2345/TS2769 ailesinin (~164) ve buna bağlı `as any` cast'lerinin büyük kısmını çözer.

---

## 11. Dead Code ve Legacy Adayları (Faz 10)

**Dead code SİLİNMEDİ** (görev kuralı: yalnızca KESİN_ORPHAN + tam doğrulama; bu turda kesin orphan tespiti yapılmadı).

**Kırık import'lar (dead code değil, eksik bağımlılık) — tsc TS2307 kaynağı:**

| Dosya | Eksik | Sınıf |
|---|---|---|
| `src/pages/MapSearch.tsx` | `@/lib/mapEntities` (dosya yok) | MANUEL_DOĞRULAMA |
| `src/pages/RadarDetail.tsx`, `RadarNewsManager.tsx`, `RadarNewsMarquee.tsx` | `@/lib/radarNews` (dosya yok) | MANUEL_DOĞRULAMA |
| `src/pages/PostGenerator.tsx` | `html-to-image` (paket kurulu değil) | MANUEL_DOĞRULAMA |

Bu sayfalar `vite build`'de geçiyor (SWC type-check yapmaz) ama **runtime'da import hatası verme riski yüksek**. Dosya/paket eklemek = yeni davranış/bağımlılık → bu görevin kapsamı dışı. Manuel doğrulama gerekir (dosyalar başka branch'te mi, sayfa kullanımdan kalktı mı?).

---

## 12. Ertelenen Riskli Değişiklikler (Plan)

1. **AdminLayout.tsx ayrıştırma (721 satır)** → `useAdminAccess` hook + `AdminLoginCard`/`AdminUnauthorizedCard`/`AdminHeader`/`Admin{Desktop,Mobile}Navigation`/`AdminGlobalActions`. Ayrı PR, davranış testleriyle.
2. **Auth shim migrasyonu (38 dosya)** → küçük batch'ler hâlinde `@/contexts/AuthContext` → `@/components/auth/useAuth`; 17 `loading`→`isLoading` rename; her batch sonrası lint/test/build. Shim import sayısı 0 olunca + grep doğrulamasıyla shim silinir.
3. **Veri erişim standartlaştırma (Faz 7)** → 38 component-içi `supabase.from()` anti-pattern. Öncelik: admin → directory/profile → RolesGo → catalog → survey. Muhasebe + yeni `admin/*-api` pattern'i referans.
4. **Generated types yenileme (Faz 8)** → `supabase gen types` ile ~164 tsc hatasını çöz; ardından `as any` cast temizliği.
5. **Kırık import'lar (Bölüm 11)** → mapEntities/radarNews/html-to-image durumunu netleştir.
6. **Kırık testler** → `AdminMembersPage.test.tsx` 10 fail (baseline'dan beri); ayrı debug.
7. **package.json script hijyeni (Faz 9)** → `import:doctors:dortmund` scriptindeki hardcoded lokal Windows path (`c:\Users\baris-terzioglu\OneDrive...`) ENV/CLI parametresine taşınmalı (script zaten `--csv=` + `--write` opt-in destekliyor; sadece default path lokal). Düşük öncelik, davranış değiştirmez.
8. **Kalan `catch (any)` (6 dosya)** → fallback'li olanlar (`e?.message || X`) korunarak `unknown`+narrow'a taşınabilir.

---

## 13–16. Kontrol Sonuçları (Sonra)

| Kontrol | Baseline | Sonra | Değişim |
|---|---|---|---|
| verify:text | ✅ PASS | ✅ PASS | — |
| lint | ❌ 458 error / 73 warn | ❌ 452 error / 73 warn | **−6 error** |
| test | ❌ 10 fail / 286 pass | ❌ 10 fail / 286 pass | **regresyon yok** |
| build | ✅ PASS | ✅ PASS | — |
| tsc | ❌ 286 error | ❌ 286 error | **regresyon yok** |

---

## 17. Önce ve Sonra Metrikleri

| Metrik | Önce | Sonra |
|---|---|---|
| src/lib/admin.ts satır | 461 | ~60 (barrel) |
| admin servis dosyası sayısı | 1 | 8 (1 barrel + 7 domain) |
| App.tsx satır | 299 | 299 (değişmedi) |
| AdminLayout.tsx satır | 721 | 721 (ertelendi) |
| `@/contexts/AuthContext` import | 32 | 32 (shim korundu) |
| `@/lib/supabase` import | 0 | 0 (dosya yok) |
| lint error | 458 | 452 |
| `catch (any)` (hedeflenen 6) | 6 | 0 |

---

## 18. Sonraki 10 Önerilen Aksiyon

1. `supabase gen types typescript` ile generated types'ı yenile (~164 tsc hatası kapanır).
2. `AdminMembersPage.test.tsx` 10 fail'i debug et (baseline kırık).
3. Kırık import'ları çöz: mapEntities / radarNews / html-to-image.
4. AdminLayout.tsx'i hook + alt bileşenlere ayır (ayrı PR + test).
5. Auth shim migrasyonunu küçük batch'lerle başlat, sonra shim'i sil.
6. Faz 7 veri erişim: admin sayfalarındaki `supabase.from()`'u `admin/*-api`'ye taşı.
7. Kalan `catch (any)` + yüksek yoğunluklu `as any` dosyalarını tiplere bağla.
8. `eslint.config.js`: `no-unused-vars` warn seviyesinde aç (kademeli).
9. package.json `import:doctors:dortmund` lokal path'ini ENV'e taşı.
10. CLAUDE.md'yi repo gerçekliğiyle güncelle (App.tsx modüler, tek client, shim doğru).
