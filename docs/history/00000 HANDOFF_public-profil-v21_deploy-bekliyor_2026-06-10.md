# HANDOFF — Public Profil v2.1 (Durum Devri, 2026-06-10)

> Yeni chat'e yapıştırılacak devir notu. Konu: `/directory/catalog/:slug` public profil
> sayfasının uçtan uca yeniden yapımı (peronevera.md planı + IndividualPublicView
> görsel dili + tam dolu demo member). **Kod/DB/test tarafı %100 bitti; tek açık iş
> corteqs.net deploy'u.**

---

## 1. NE YAPILDI (hepsi origin/main'de, hepsi doğrulandı)

### Faz 1 — peronevera.md planı (sabah)
- **v2 RPC:** `get_catalog_item_public_page_v2(p_slug)` — `supabase/migrations/20260610150000_public_catalog_profile_page_v2.sql`. Whitelist-only, camelCase jsonb, anon+authenticated grant. **Canlı DB'ye uygulandı.** (Eski RPC sadece authenticated'a açıktı — anon public profil göremiyordu; v2 bunu çözdü.)
- **Veri katmanı:** `src/lib/public-catalog-profile-schemas.ts` (Zod), `-api.ts`, `-view-model.ts`, `src/hooks/usePublicCatalogProfile.ts`, claim için `public-catalog-claim-api.ts` + `useSubmitCatalogClaim.ts`.
- **Composer UI:** `src/components/directory/public-profile/` — Shell/Hero/Breadcrumb/QuickActions/SectionList/SectionFrame/Skeleton/EmptyState/NotFound + `section-renderers/` (registry: `componentKey → renderer`, bilinmeyen key → `GenericPublicSection`, rol bazlı JSX dallanması YOK).
- `DirectoryCatalogItemPage` ince container oldu; `/directory/profile/:userId` redirect korunarak API katmanına taşındı; hardcoded ülke sözlüğü kalktı (geo_countries); Türkçe metinler düzeltildi ("Dizine Dön", "Sahiplenilebilir Profil", "Talep Gönderildi"...).
- Orphan temizliği: `ProfileHeroCard`, `CatalogProfileLayout` silindi.
- **Playwright lovable bağımlılığı kaldırıldı:** root `playwright.config.ts` artık self-contained; `npm run test:e2e` çalışıyor.

### Faz 2 — v2.1: IndividualPublicView görsel dili + tam dolu demo (öğleden sonra)
Plan dosyası: `C:\Users\baris-terzioglu\.claude\plans\burada-yap-lanlar-peronevera-md-dosyas-y-merry-galaxy.md`
- **Tasarım kaynağı (kullanıcı onaylı):** `src/components/profile/IndividualPublicView.tsx` — kullanıcının Lovable mockup'ının kökeni.
- **Hero:** accent renkli radial gradient header, `rounded-[24px]` avatar, ikonlu rozetler (**İş Arıyorum** `job_seeking_opt_in` / **Gönüllü Mentör** `volunteer_mentorship_opt_in` / **Yakında Taşınacak** `moving_soon_opt_in` + Doğrulanmış/Sahiplenilebilir/Yönetilen), isim yanında **tagline pili** (= `headline`), konum satırı, **sosyal link pilleri** (links + sosyal contact'lar + sosyal URL attribute'ları birleşik, `toSafeExternalUrl` süzgeçli, tekrarsız).
- **Layout:** sticky sidebar kalktı → `rounded-[22px]` tek kart ızgarası (`md:grid-cols-2`; main section'lar `md:col-span-2`). `PublicProfileSidebar.tsx` silindi.
- **Kurallar:** sosyal attribute'lar grid'de tekrarlanmaz; hero pilleri varken `links` section'ları bastırılır (pill yoksa geri gelir); registry/fallback mimarisi değişmedi.
- **Demo profil (canlıda):** `demo-uye-ayse-yilmaz` ("Ayşe Yılmaz") — mig `supabase/migrations/20260610170000_seed_demo_member_full_profile.sql`, **canlıya uygulandı + schema_migrations'a kaydedildi**. Rol: `User_Standard`. İçerik: 20 public attribute (tüm sosyal linkler + 3 rozet opt-in'i), 7 section, 4 contact, 4 link, 3 hizmet, 3 dil, 2 medya (avatar+kapak). `private_storage` alanları (CV/telefon/referral) bilinçli boş = sızıntı negatif testi (payload'da sızıntı YOK, doğrulandı).

### Doğrulama sonuçları
- Unit/component: **396/396** (pre-existing AdminLayout faili dahil geçti), E2E: **11/11** (`npm run test:e2e`), lint: değişen dosyalarda 0 hata (pre-existing 452 admin `no-explicit-any` duruyor), build: yeşil, `verify:release` (local): OK.
- **Canlı veriyle gerçek tarayıcı doğrulaması yapıldı:** dev server + Playwright screenshot → `c:\tmp\demo-profile-live.png` — sayfa tam istenen görünümde (mock yok, gerçek RPC).
- Önemli commit'ler: `4015dca` (seed), `1cfba9d` (composer görsel dili), `bea4011` (testler); öncesinde `4992f17` merge (peronevera işi), `a93589e` (playwright fix).

---

## 2. TEK AÇIK İŞ: corteqs.net DEPLOY'U ⚠️

**Kanıt (defalarca ölçüldü):** canlı `Last-Modified: Mon, 08 Jun 2026 21:48:26 GMT`, asset `assets/main-0r4KkAVF.js`, ETag `6a2738aa` — **bugünkü 4+ main push'una rağmen hiç değişmedi**. `Cache-Control: no-store` → cache değil, sunucu gerçekten 2 günlük build çalıştırıyor.

**Teşhis:** Repo tarafında tetikleyici yok (tek remote `corteqssocial-web/corfin-mvp`, GitHub Actions yok). Deploy tamamen Coolify paneline bağlı; webhook büyük ihtimalle kopuk veya eski repoyu (`ubterzioglu/corteqslanding`) izliyor (repo taşınmıştı). **Panele erişimim yok.**

**Yapılacak:** Coolify → uygulama → *Deployments*:
- Bugünkü push'lara deployment kaydı yoksa → *Source/Webhook*'ta repo `corteqssocial-web/corfin-mvp` + branch `main` olduğunu doğrula, **manuel Deploy** tetikle, "Auto Deploy on Push"ı aç / GitHub webhook'u yeniden kur.
- Kayıt var ama failed ise → log'u paylaş.

**Deploy düştükten sonra son kontrol:**
```powershell
curl -sI https://corteqs.net/ | findstr Last-Modified   # 10 Jun+ olmalı
$env:BASE_URL = "https://corteqs.net"; npm run verify:release
# Tarayıcıda: https://corteqs.net/directory/catalog/demo-uye-ayse-yilmaz
```

---

## 3. ORTAM NOTLARI (yeni oturum için kritik)

- **Canlı DB erişimi:** psql + IPv4 pooler — host `aws-1-eu-west-2.pooler.supabase.com:5432`, user `postgres.injprdrsklkxgnaiixzh`, şifre `.env.local → SUPABASE_DB_PASSWORD` (PGPASSWORD'a koy). Docker yok → `supabase db push` ÇALIŞMAZ; migration'lar `psql -f` + `supabase_migrations.schema_migrations`'a manuel INSERT ile uygulanır. **Prod yazımları izin sınıflandırıcısına takılır → kullanıcıdan hedefi adlandıran açık onay iste.**
- **E2E:** `npm run test:e2e` (root config self-contained; vite dev 8080'i kendi açar).
- **Rol backfill kapandı:** canlıda **130/130 member item'ın primary rolü var** (paralel oturumun member import çalışması) — eski "127 rolsüz item" backlog'u bitti.
- **Paralel oturum uyarısı:** çalışma ağacında admin panel v2 oturumunun commit'lenmemiş değişiklikleri olabilir (`App.tsx`, `AdminLayout.test.tsx`, `admin-navigation.ts` silinmesi vb.) — **dokunma**, o oturum yönetiyor. Shell'e owner inline edit (`usePublicProfileOwnership` + `PublicProfileInlineEditor`) da o oturumda eklendi.
- **Migration version çakışması riski:** paralel oturumlar aynı gün timestamp'i kullanıyor — yeni migration eklerken mevcut en son version'ı kontrol et.

## 4. BACKLOG (bu görevin parçası değil, istenirse)
- E2E süitini CI'a bağlama (GitHub Actions yok).
- Pre-existing lint borcu: admin sayfalarında 452 `no-explicit-any` (refactor backlog B7).
- `IndividualPublicView`/`usePublicIndividualProfile` test-only orphan audit'i.
- Gerçek üye profillerinin attribute/iletişim verilerinin zenginleştirilmesi (roller tamam; veri girildikçe sayfalar dolacak).

**Dokümantasyon:** `docs/modules/directory/public-profile-layout.md` (mimari + yeni section ekleme rehberi).
