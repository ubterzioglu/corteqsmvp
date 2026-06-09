# CorteQS / corfin-mvp — Konsolide Clean-Code Refactor Backlog'u

**Tarih:** 2026-06-09 · **Branch:** `main` · **Baseline HEAD:** `3003ed4`
**Kaynaklar:** [cleancode.md](../../cleancode.md) (master prompt) · [baseline](./2026-06-09-clean-code-baseline.md) · [uygulama raporu](./2026-06-09-clean-code-refactor-report.md)

> Bu dosya, üç kaynak dokümandaki **ertelenen tüm refactor işini** önceliklendirilmiş tek bir yol haritasına toplar. Uygulanmış işler (Faz 4 admin.ts ayrıştırma, Faz 1 kısmi `catch` temizliği) raporda; **burada yalnızca kalan iş** vardır. Her kalem ayrı bir tur/PR olarak yürütülür.

---

## 0. Yürütme Kuralları (her kalemde geçerli)

`cleancode.md` §0.5 ve §7'den türetilmiştir:

- **Commit / push / deploy / Supabase-write YAPILMAZ** (kullanıcı açıkça istemedikçe).
- Her faz sonunda doğrulama döngüsü:
  ```bash
  npm run verify:text && npm run lint && npm run test && npm run build
  npx tsc -p tsconfig.app.json --noEmit
  git diff --stat
  ```
- **Başarı kriteri = mutlak yeşil DEĞİL**, baseline'a göre **sıfır regresyon**:
  lint ≤ **452** error · test ≤ **10** fail · tsc ≤ **286** error (tercihen azalır).
- Eşik aşılırsa fazı böl: >25 dosya, >1500 satır diff, aynı batch'te 3+ domain, ya da route+auth+client'ın aynı batch'te değişmesi.

### Dokunulmayacak alanlar (`cleancode.md` §0.2 / §5)

`server.mjs`, `vite.config.ts`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts` (**B1 hariç**), `src/components/ui/*`, `supabase/migrations/*`, `info-*.html`, `lansman/index.html`. Ayrıca: SEO-kilitli route path'leri, RPC/feature/role key string'leri, Türkçe domain terimleri, RLS policy değerleri.

---

## 1. Backlog Özeti (öncelik sırasıyla)

| # | İş | Kaynak faz | Öncelik | Risk |
|---|---|---|---|---|
| B1 | Generated Supabase types yenileme | Faz 8 | **EN YÜKSEK** | Orta |
| B2 | Kırık import'ları çöz (mapEntities / radarNews / html-to-image) | Faz 10/11 | Yüksek | Orta |
| B3 | `AdminMembersPage.test.tsx` 10 fail debug | Test | Yüksek | Düşük |
| B4 | `AdminLayout.tsx` ayrıştırma (721 satır) | Faz 3 | Orta | **Yüksek** |
| B5 | Auth shim migrasyonu (39 import) + shim silme | Faz 5 | Orta | Orta |
| B6 | Veri erişim standartlaştırma (`supabase.from()` → `lib/*-api.ts`) | Faz 7 | Orta | Orta |
| B7 | `as any` / `: any` cast temizliği | Faz 8 | Düşük | Düşük |
| B8 | eslint `no-unused-vars` → warn | Faz 8 | Düşük | Düşük |
| B9 | Kalan `catch (any)` (fallback'li 6 dosya) | Faz 1 | Düşük | Düşük |
| B10 | package.json script hijyeni (hardcoded path) | Faz 9 | Düşük | Düşük |

---

## 2. Backlog Detayları

### B1 — Generated Supabase types yenileme  ⟶ EN YÜKSEK öncelik

**Amaç:** tsc'deki ~164 hatayı (TS2345 + TS2769 ailesi) kapatmak. Kök neden: `src/integrations/supabase/types.ts` güncel şema ile senkron değil — birçok tablo eksik (feed_likes, job_listings, generated_posts, interest_registrations, …).

**Aksiyon (öneri, manuel review gerektirir):**
```bash
supabase gen types typescript --project-id injprdrsklkxgnaiixzh > src/integrations/supabase/types.ts
```

**Notlar:**
- Bu generated dosya; elle düzenlenmez ama **gen komutuyla yenilenmesi** istisnadır (kök neden bu).
- Yenileme sonrası birçok `as any` cast gereksiz hâle gelir → B7'yi besler.
- Çalıştırmadan önce diff'i incele; beklenmedik kolon/tip değişikliği varsa dur.

**Doğrulama:** tsc error sayısı 286 → ~120'ye düşmeli; build/test regresyonu olmamalı.

---

### B2 — Kırık import'ları çöz

**Doğrulanmış durum (2026-06-09):**

| Dosya | Eksik bağımlılık | Durum |
|---|---|---|
| `src/pages/MapSearch.tsx` | `@/lib/mapEntities` | dosya **MISSING** |
| `src/pages/RadarDetail.tsx`, `RadarNewsManager.tsx`, `RadarNewsMarquee.tsx` | `@/lib/radarNews` | dosya **MISSING** |
| `src/pages/PostGenerator.tsx` | `html-to-image` | paket **package.json'da YOK** |

**Risk:** `vite build` (SWC) type-check yapmadığı için geçer; ama **runtime'da import hatası** verir.

**Aksiyon (MANUEL_DOĞRULAMA — `cleancode.md` §10):**
1. Bu sayfalar hâlâ route'a bağlı mı? (`src/App.tsx` içinde lazy import + `<Route>` var mı?)
2. İlgili lib dosyaları başka branch'te mi? Yoksa sayfa kullanımdan mı kalktı?
3. Kullanılıyorsa: eksik dosya/paketi geri getir (yeni bağımlılık = bu turun kapsamı dışı, ayrı karar). Kullanılmıyorsa: route + sayfa + import birlikte değerlendirilerek temizlenir (sadece import edilmiyor diye **silme**).

---

### B3 — `AdminMembersPage.test.tsx` 10 fail debug

**Durum:** Baseline'dan beri kırık tek test dosyası (10/10 fail). Diğer 286 test geçiyor.

**Aksiyon:** İzole debug. Test mi yanlış, implementasyon mu? (`cleancode.md` test stratejisi: implementasyonu düzelt, test yanlış değilse). RolesGo/catalog geçişi sonrası mock'ların eskimiş olma ihtimali yüksek (admin_users/profiles drop edildi).

---

### B4 — `AdminLayout.tsx` ayrıştırma (721 satır — doğrulandı)

**Amaç:** Büyük layout bileşenini orchestration + alt parçalara böl. **Davranış-kritik, yüksek riskli → ayrı PR + davranış testleri.**

**Önerilen yapı (`cleancode.md` §3.4 / Faz 3):**
```
src/components/admin/layout/
├── AdminLayout.tsx            (orchestration)
├── AdminLoginCard.tsx
├── AdminUnauthorizedCard.tsx
├── AdminHeader.tsx
├── AdminDesktopNavigation.tsx
├── AdminMobileNavigation.tsx
├── AdminGlobalActions.tsx
├── AdminLoadingScreen.tsx
└── admin-layout-types.ts
src/hooks/admin/
└── useAdminAccess.ts          (auth state + admin access side-effect)
```

**Koruma kuralları (12):** `userIsAdmin()` davranışı, Supabase session, login, password-reset, redirect URL, toast mesaj anlamı, menü sırası, mobile+desktop link bütünlüğü, external link değerleri, admin outlet context, gereksiz prop-drilling yok, anlamsız mikro-component yok. Navigation sabitleri `admin-navigation.ts`'de **kalır**.

---

### B5 — Auth shim migrasyonu (39 import — doğrulandı) + shim silme

**Durum:** `src/contexts/AuthContext.tsx` artık **backward-compat shim** (orphan değil): canonical `@/components/auth/useAuth`'a delege eder, `loading` alias'ını (`isLoading`) doğru sağlar. **39 import noktası**; rapora göre ~17'si `loading` alias'ına bağımlı.

**Aksiyon (`cleancode.md` Faz 5):**
1. 39 import noktasını listele; her birinde `useAuth` mı `AuthProvider` mı kullanılıyor belirle (envanter: `AuthProvider`'ı contexts'ten import eden **yok**).
2. Küçük batch'ler (<25 dosya): import'u `@/components/auth/useAuth`'a çevir; `loading` kullanan dosyalarda `loading`→`isLoading` rename.
3. Her batch sonrası lint/test/build.
4. Import sayısı **0 olunca** + grep doğrulaması → shim dosyasını sil.

---

### B6 — Veri erişim standartlaştırma (Faz 7)

**Amaç:** Component-içi dağınık `supabase.from()` sorgularını `lib/<domain>-api.ts` + (gerekirse) React Query'ye taşı. Referans pattern: **muhasebe** + yeni **`src/lib/admin/*-api.ts`**.

**Öncelik sırası:** admin → directory/profile → RolesGo → catalog → survey → workspace → diğer public.

**Kurallar (`cleancode.md` Faz 7):** Auth altyapısı sorgularını gereksiz taşıma, tek kullanımlık sorguya aşırı abstraction yok, iş kuralı UI'dan çıkar, mutation'lar tek yerde, tutarlı error handling, açık return type, gerekirse Zod, React Query cache invalidation kontrolü, **yeni dependency yok**.

**Kapsam yönetimi:** Çok geniş → her turda yalnızca 1–2 domain (en yüksek öncelikli admin'den başla).

---

### B7 — `as any` / `: any` cast temizliği

**Durum:** ~103 `as any` (37 dosya) / 58 `: any` (31 dosya). Büyük kısmı eksik DB tipleri kaynaklı → **B1'den sonra** çoğu gereksizleşir.

**Aksiyon:** B1 sonrası kalan cast'leri yüksek yoğunluklu dosyalardan başlayarak domain tiplerine bağla. Generated dosyaya dokunma.

---

### B8 — eslint `no-unused-vars` → warn

**Aksiyon:** `eslint.config.js`'te `@typescript-eslint/no-unused-vars`'ı **warn** seviyesinde aç (error değil — baseline'ı kırmamak için). Dead-code tespitini besler (B6 sonrası unused export'lar görünür hâle gelir).

---

### B9 — Kalan `catch (any)` (fallback'li 6 dosya)

**Durum:** Faz 1'de 6 dosya `unknown`+narrow'a taşındı. `e?.message || X` fallback'li kalanlar var.

**Aksiyon:** Fallback davranışını koruyarak `catch (e: unknown)` + `e instanceof Error ? e.message : <fallback>`. İzole, düşük risk.

---

### B10 — package.json script hijyeni (Faz 9)

**Doğrulanmış durum:** `import:doctors:dortmund` (package.json satır 21) hardcoded lokal path içeriyor:
```
--csv="c:\Users\baris-terzioglu\OneDrive - adesso Group\Desktop\dortmund_turkce_hizmet_veren_doktorlar.csv"
```
Script zaten `--csv=` + `--write` opt-in destekliyor; sadece default path lokal.

**Aksiyon (`cleancode.md` §9 — path'i silme, geriye uyumlu çöz):** Default path'i ENV (`DORTMUND_CSV`) ya da boş default'a çek; örnek komutu README/script yorumuna yaz. Davranış değişmez (opt-in zaten var). Düşük öncelik.

---

## 3. Tamamlanmış İşler (referans — burada tekrar yapılmaz)

- **Faz 4** — `src/lib/admin.ts` (461 → 57 satır barrel) + 7 domain dosyası (`src/lib/admin/`). Bkz. rapor §3.1.
- **Faz 1 (kısmi)** — 6 dosyada `catch (any)` → `unknown` + Error narrow. lint −6 error.
- **Faz 2** — App.tsx zaten modüler (299 satır, ~75 lazy, muhasebe `routes.tsx`). Doğrulandı, dokunulmadı.
- **Faz 6** — Supabase client konsolidasyonu zaten tamamlanmış (`src/lib/supabase.ts` yok, 0 import).
