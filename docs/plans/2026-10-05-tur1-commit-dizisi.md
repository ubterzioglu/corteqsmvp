# A1.10 · Commit Dizisi — Hazır (5 Ekim 2026)

> **Kapılar:** tsc ✓ · eslint ✓ · 64 test ✓ (8 dosya)
> **Sıra:** Plan'daki bağımlılık sırasına göre. Her satır = 1 commit.
> **Komut:** `git commit -- <dosyalar>` (pathspec ile, push YOK)

---

## Hazır batch'ler (kapı yeşil)

### 1 · A9 — Footer + G17 QA
```
git commit -- \
  src/components/Footer.tsx \
  src/components/Footer.test.tsx \
  src/lib/admin-shell/admin-updates/2026-10.ts \
  supabase/qa/g17-health-score-reports-acceptance.sql
```
**Mesaj:** `A9: Footer CorteQS Global linki + admin update + G17 QA`

### 2 · A2 + A3 — /pricing + PremiumLockCard + rol yapısı
```
git commit -- \
  src/pages/Pricing.tsx \
  src/pages/Pricing.test.tsx \
  src/lib/plans.ts \
  src/lib/plans.test.ts \
  src/components/common/PremiumLockCard.tsx \
  src/components/common/PremiumLockCard.test.tsx \
  src/components/profile/profile-sidebar-menu.tsx \
  src/lib/role-structure.ts \
  scripts/generate-role-structure.mjs \
  CorteQS_Rol_Tablosu_v2.xlsx
```
**Mesaj:** `A2+A3: /pricing CV/ilan satırları + PremiumLockCard + rol yapısı veri modülü`

### 3 · A11 — useAdminAccess
```
git commit -- \
  src/hooks/admin/useAdminAccess.ts \
  src/hooks/admin/useAdminAccess.test.ts
```
**Mesaj:** `A11: useAdminAccess — aynı kullanıcı checking'e düşmez (ref guard)`

### 4 · A10 — Balon
```
git commit -- \
  src/components/AssistantBubble.tsx \
  src/components/AssistantBubble.test.tsx
```
**Mesaj:** `A10: Asistan ipucu balonu + oturum ayırımı + fake-timer testleri`

### 5 · A1 — UI/lib genel
```
git commit -- \
  src/pages/ProfilePage.test.tsx \
  src/pages/admin/AdminUserOverridesPage.tsx
```
**Mesaj:** `A1: ProfilePage test güncellemesi + AdminUserOverrides scope_role='*' düzeltme`

### 6 · A5 + A6 — CV paylaşım + arama
```
git commit -- \
  src/pages/ProfilePage.tsx \
  src/pages/ProfileDocumentsSection.tsx \
  src/hooks/profile/useProfileDocuments.ts \
  src/lib/profile-attribute-keys.ts \
  src/lib/public-content-search.ts \
  src/pages/DirectoryPage.tsx \
  src/components/directory/PublicContentSearchResults.tsx \
  supabase/functions/member-cv-link/index.ts \
  supabase/migrations/_removed/20261005120000_cv_share_with_premium.sql
```
**Mesaj:** `A5+A6: CV paylaşım Switch + ProfileDocumentsSection çıkarıldı + A16 arama event türü`

**⚠️ NOT:** `member-cv-link` edge function migration hatası nedeniyle bekliyor. A5.2 doğru migration yazılınca deploy (§B9).

### 7 · A4 — Yetkiler
```
git commit -- \
  src/lib/features.ts \
  supabase/migrations/applied/20261005600000_career_premium_features.sql \
  supabase/migrations/applied/20261005160000_check_account_deletion_blocks.sql \
  supabase/qa/career-premium-features-acceptance.sql
```
**Mesaj:** `A4: career.cv.view + career.listing.view_unlimited yetkileri + D1 engel kontrolü`

### 8 · A7 + A8 — İlan kotası + /ilanlar
```
git commit -- \
  src/components/directory/DirectoryResultCard.tsx \
  src/lib/catalog-directory.ts \
  src/lib/job-listings-api.ts \
  src/lib/job-listings-api.test.ts \
  src/pages/JobListingsPage.tsx \
  src/pages/JobListingDetailPage.tsx \
  src/App.tsx \
  supabase/migrations/applied/20261005700000_job_listing_quota.sql \
  supabase/migrations/applied/20261005140000_public_member_next_event.sql \
  supabase/migrations/applied/20261005130000_seed_demo_job_listings.sql
```
**Mesaj:** `A7+A8: /ilanlar sayfaları + kota RPC + dizin etkinlik bilgisi + seed`

### 9 · A12 — Ruhsat
```
git commit -- \
  src/lib/security.ts \
  supabase/migrations/applied/20261005800000_profile_license_upload.sql \
  supabase/qa/profile-license-acceptance.sql
```
**Mesaj:** `A12: İşletme ruhsatı/meslek lisansı yükleme (bucket + attribute + feature)`

### 10 · A13 + A14 — Otomatik onay + paylaşım vurgu
```
git commit -- \
  src/components/events/CreateEventFormSection.tsx \
  src/components/events/MyEventsPanel.tsx \
  src/pages/EventDetailPage.tsx \
  supabase/migrations/applied/20261005900000_events_auto_approval.sql \
  docs/operations/2026-10-05-etkinlik-bekleyenleri-yayinla.sql \
  supabase/qa/events-auto-approval-acceptance.sql
```
**Mesaj:** `A13+A14: Etkinlik otomatik onay (ilk-onay kaldırıldı) + ?share=1 vurgu`

### 11 · A15 — Etkinlik maili
```
git commit -- \
  supabase/functions/send-notification-emails/index.ts \
  supabase/functions/_shared/emails/event-published.ts \
  supabase/migrations/applied/20261005100500_event_published_notification.sql \
  supabase/qa/event-published-notification-acceptance.sql \
  maillogo.png \
  public/mail/
```
**Mesaj:** `A15: "Etkinliğiniz yayında" mail şablonu + outbox enqueue + trigger`

### 12 · A16 — Arama etkinlik türü
```
git commit -- \
  supabase/migrations/applied/20261005110000_public_content_search_events.sql \
  supabase/qa/public-content-search-events-acceptance.sql
```
**Mesaj:** `A16: search_public_content event türü + trgm index (published + gelecek)`

---

## Bekleyen batch'ler (karar/deploy gerekli)

| Batch | Sebep |
|---|---|
| **B11** (Cadde reactors) | §B11 kararı bekliyor (ayrı commit / geri al / plana al) |
| **A5 edge deploy** | `member-cv-link` migration hatası → A5.2 yeniden yazım → §B9 deploy |
| **A8 rehberler** | `belge-yukleme.md` CV paylaşım canlıya çıkana kadar bilgi tabanına girmez |
| **Plansız dokümanlar** | 10+ plan/devir dosyası — `.gitignore` veya ayrı commit kararı |

---

## Migration uygulama sırası (§B9)

Canlıda çalıştırılacak migration'lar (psql, §B8 onayı):
1. `…100500_event_published_notification` (çakışma düzeltildi)
2. `…110000_public_content_search_events`
3. `…130000_seed_demo_job_listings` (user_id placeholder → gerçek test kullanıcısı)
4. `…140000_public_member_next_event`
5. `…160000_check_account_deletion_blocks`
6. `…600000_career_premium_features`
7. `…700000_job_listing_quota`
8. `…800000_profile_license_upload`
9. `…900000_events_auto_approval` (backfill UPDATE YOK — operasyon SQL'i ayrı)

**⚠️ `…120000_cv_share_with_premium`** → `_removed/` taşındı, A5.2'de doğru yazılacak.
**⚠️ `…150000_cadde_post_reactors_list`** → §B11 kararı bekliyor.
**⚠️ `…170000_role_structure`** → A3.1 inceleme bekliyor (RLS enable yok).
