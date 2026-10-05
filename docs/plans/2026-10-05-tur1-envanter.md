# TUR 1 ENVANTER — Her dosya → batch eşleştirmesi (5 Ekim 2026)

> `git status` + `git diff --stat HEAD` çıktısından üretildi. 28 değiştirilmiş + 48 izlenmeyen = **76 yol**.
> Her satır: dosya → batch → durum. "YAPILMAMIŞ" = planda var ama kod/taahhüt yok.

---

## Değiştirilmiş dosyalar (28)

| Dosya | Batch | Durum | Not |
|---|---|---|---|
| `package.json` | A1.6 | ✓ kod | `xlsx ^0.18.5` eklendi (devDependency) |
| `package-lock.json` | A1.6 | ✓ kod | xlsx + bağımları |
| `src/App.tsx` | A8 | ✓ kod | `/ilanlar` + `/ilanlar/:id` route'ları |
| `src/components/AssistantBubble.tsx` | A10 | ✓ kod | İpucu balonu + oturum ayırımı + `useAuth` |
| `src/components/AssistantBubble.test.tsx` | A10 | ✓ kod | fake-timer testleri |
| `src/components/Footer.tsx` | A9 | ✓ kod | CorteQS Global linki |
| `src/components/directory/DirectoryResultCard.tsx` | A7 | ✓ kod | `nextEvent` alanı (takvim + tarih + şehir) |
| `src/components/directory/PublicContentSearchResults.tsx` | A16 | ✓ kod | `event` tipi + hata gösterimi |
| `src/components/events/CreateEventFormSection.tsx` | A13 + A14 | ✓ kod | İlk-onay kaldırıldı (A13); `?share=1` yönlendirme (A14). **⚠️ "Etkinliğiz" yazım hatası** (doğrusu: "Etkinliğiniz") — A1.7'de düzeltilir |
| `src/components/events/MyEventsPanel.tsx` | A13 + A14 | ✓ kod | Otomatik onay metni (A13); yeni yayınlanmış şerit (A14) |
| `src/components/profile/profile-sidebar-menu.tsx` | A3 | ✓ kod | "Erişim & Talepler" → "Rol Talepleri" |
| `src/hooks/admin/useAdminAccess.ts` | A11 | ✓ kod | Aynı kullanıcı `checking`'e düşmez (ref guard) |
| `src/hooks/profile/useProfileDocuments.ts` | A5 + A12 | ✓ kod | Ruhsat yükleme (A12); CV paylaşım parametresi (A5) |
| `src/lib/admin-shell/admin-updates/2026-10.ts` | A1 | ✓ kod | 5 Ekim özet girişi |
| `src/lib/cadde-api.ts` | **B11** | ✓ kod | `listCaddePostReactors` (plansız Cadde işi) |
| `src/lib/cadde-types.ts` | **B11** | ✓ kod | `CaddePostReactor` tipi (plansız) |
| `src/lib/catalog-directory.ts` | A7 | ✓ kod | `UnifiedDirectoryRow.nextEvent` alanı |
| `src/lib/features.ts` | A4 + A12 | ✓ kod | `career.cv.view` + `career.listing.view_unlimited` (A4); `profile.license_upload` (A12) |
| `src/lib/profile-attribute-keys.ts` | A5 + A12 | ✓ kod | `cv_share_with_premium` (A5); `business_license_doc` + bucket (A12) |
| `src/lib/public-content-search.ts` | A16 | ✓ kod | `event` content_type desteği |
| `src/lib/security.ts` | A12 | ✓ kod | `validateLicenseFile` (pdf/jpg/png, 20MB) |
| `src/pages/DirectoryPage.tsx` | A16 | ✓ kod | Arama hatası gösterimi + `reportClientError` |
| `src/pages/EventDetailPage.tsx` | A14 | ✓ kod | `?share=1` vurgulu paylaşım bölümü |
| `src/pages/Pricing.tsx` | A2 | ✓ kod | CV/ilan satırları (Free: 5 ilan, Premium: sınırsız) |
| `src/pages/ProfilePage.tsx` | A5 + A12 | ✓ kod | CV paylaşım Switch (A5); ruhsat kartı (A12). **833 satır → A1.6'da ≤ 800 hedefi** |
| `src/pages/ProfilePage.test.tsx` | A1 | ✓ kod | Test güncellemesi |
| `src/pages/admin/AdminUserOverridesPage.tsx` | A1 | ✓ kod | `scope_role='*'` düzeltme |
| `supabase/functions/send-notification-emails/index.ts` | A15 | ✓ kod | `event_published` case + `buildEmail` async |

---

## İzlenmeyen dosyalar (48)

### Batch'e bağlı — kod/test

| Dosya | Batch | Durum | Not |
|---|---|---|---|
| `src/components/Footer.test.tsx` | A9 | ✓ kod | Footer testi |
| `src/components/cadde/CaddeReactionActorsPopover.tsx` | **B11** | ✓ kod | "Kimler beğendi?" popover (plansız Cadde işi) |
| `src/components/common/PremiumLockCard.tsx` | A3 | ✓ kod | Premium kilit kartı |
| `src/components/common/PremiumLockCard.test.tsx` | A3 | ✓ kod | PremiumLockCard testi |
| `src/hooks/admin/useAdminAccess.test.ts` | A11 | ✓ kod | useAdminAccess testi |
| `src/lib/job-listings-api.ts` | A7 | ✓ kod | İş ilanı API (liste + detay + kota) |
| `src/lib/job-listings-api.test.ts` | A7 | ✓ kod | İş ilanı API testi |
| `src/lib/plans.ts` | A2 | ✓ kod | Plan yapılandırması (LOCK_FROM, isLocked) |
| `src/lib/plans.test.ts` | A2 | ✓ kod | Plan testi |
| `src/lib/role-structure.ts` | A3 | ✓ kod | Rol yapısı (Excel'den üretildi, boş dizi) |
| `src/pages/JobListingDetailPage.tsx` | A8 | ✓ kod | İlan detay sayfası |
| `src/pages/JobListingsPage.tsx` | A8 | ✓ kod | İlan listesi sayfası |
| `src/pages/Pricing.test.tsx` | A2 | ✓ kod | Pricing testi |
| `supabase/functions/_shared/emails/event-published.ts` | A15 | ✓ kod | Etkinlik mail şablonu. **⚠️ "Etkinliğiz" yazım hatası** (satır 86, 90, 128) |
| `supabase/functions/delete-account/index.ts` | A4 | ✓ kod | Hesap silme edge function (commit'siz) |
| `supabase/functions/member-cv-link/index.ts` | A5 | ✓ kod | CV link edge function (hatalı migration nedeniyle bekliyor) |

### Batch'e bağlı — migration

| Dosya | Batch | Durum | Not |
|---|---|---|---|
| `supabase/migrations/applied/20261005100000_event_published_notification.sql` | A15 | ⚠️ | **Sürüm çakışması**: `…100000_whatsapp_bot_foundation.sql` ile aynı damga |
| `supabase/migrations/applied/20261005110000_public_content_search_events.sql` | A16 | ✓ | |
| `supabase/migrations/applied/20261005120000_cv_share_with_premium.sql` | A5 | ⚠️ **HATALI** | Yanlış şema (`user_profile_attributes.key` yok); `applied/`'den çıkarılmalı |
| `supabase/migrations/applied/20261005130000_seed_demo_job_listings.sql` | A9 | ✓ | 6 örnek ilan |
| `supabase/migrations/applied/20261005140000_public_member_next_event.sql` | A7 | ✓ | |
| `supabase/migrations/applied/20261005150000_cadde_post_reactors_list.sql` | **B11** | ✓ | Plansız Cadde işi |
| `supabase/migrations/applied/20261005160000_check_account_deletion_blocks.sql` | A4 | ✓ | |
| `supabase/migrations/applied/20261005170000_role_structure.sql` | A3 | ✓ | Plan öncesinde yazılmış; inceleme bekliyor |
| `supabase/migrations/applied/20261005180000_ai_legion_hobi_kultur.sql` | B12 | ✓ | AI Legion kategorisi |
| `supabase/migrations/applied/20261005190000_ted_innoventure_global.sql` | B12 | ✓ | TED InnoVenture |
| `supabase/migrations/applied/20261005200000_group_reports.sql` | B6 | ✓ | G14/G16 |
| `supabase/migrations/applied/20261005300000_g14_review_deadlock_and_ascii_fix.sql` | B6 | ✓ | G14 deadlock |
| `supabase/migrations/applied/20261005400000_phone_otp_send_claim.sql` | B5 | ✓ | G05 telefon OTP |
| `supabase/migrations/applied/20261005500000_g17_health_score_reports.sql` | A9 | ✓ | G17 sağlık skoru |
| `supabase/migrations/applied/20261005600000_career_premium_features.sql` | A4 | ✓ | |
| `supabase/migrations/applied/20261005700000_job_listing_quota.sql` | A7 | ✓ | |
| `supabase/migrations/applied/20261005800000_profile_license_upload.sql` | A12 | ✓ | |
| `supabase/migrations/applied/20261005900000_events_auto_approval.sql` | A13 | ✓ | |

### Batch'e bağlı — rehber / doküman

| Dosya | Batch | Durum | Not |
|---|---|---|---|
| `docs/guides/belge-yukleme.md` | A8 | ⚠️ | CV paylaşım özelliği anlatıyor → **canlıya çıkana kadar bilgi tabanına girmez** |
| `docs/guides/etkinlik-paylasma.md` | A8 | ✓ taslak | Koda karşı doğrulama bekliyor |
| `docs/guides/reklam-verme.md` | A8 | ✓ taslak | Koda karşı doğrulama bekliyor |
| `docs/security/SECURITY_AUDIT.md` | A2.1 | ✓ | Güvenlik denetimi |
| `docs/plans/2026-10-05-rol-talepleri-olcum.md` | A3.1 | ✓ | Rol ölçümü (A3.1 girdisi) |
| `docs/plans/2026-10-05-seo-geo-qwen-gorev.md` | A10 | ✓ | SEO/GEO görev tanımı |
| `scripts/generate-role-structure.mjs` | A3 | ✓ | Rol üretim betiği |
| `CorteQS_Rol_Tablosu_v2.xlsx` | A3 | ✓ | Excel kaynak (rol yapısı) |
| `maillogo.png` | A15 | ✓ | Mail logo varlığı |
| `public/mail/corteqs-logo.png` | A15 | ✓ | Mail logo |
| `public/mail/corteqs-logo-256.png` | A15 | ✓ | Mail logo 256px |

### Plansız / commit dışı

| Dosya | Durum | Not |
|---|---|---|
| `.agents/` | Araç yapılandırması | `.gitignore`'a eklenebilir |
| `skills-lock.json` | Araç kilidi | `.gitignore`'a eklenebilir |
| `sunuekleglobalSKILL.md` | Araç dosyası | `.gitignore`'a eklenebilir |
| `corteqs-ekstre-motoru/` | Ayrı modül | Bağımsız proje |
| `CORTEQS_LANSMAN_HAZIRLIK_PLANI_v2.md` | Doküman | Plansız — karar gerekli |
| `ROADMAP.md` | Doküman | Plansız — karar gerekli |
| `docs/handover/2026-10-05-ajan-prompt-kalanlar.md` | Devir notu | Plansız |
| `docs/handover/2026-10-05-devir-notu-koordinator.md` | Devir notu | Plansız |
| `docs/plans/2026-09-29-ekstre-motoru-muhasebe-entegrasyonu-plani.md` | Plan | Plansız |
| `docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md` | Plan | Plansız |
| `docs/plans/2026-10-05-birlesik-uygulama-plani.md` | Plan | Plansız (bu envanterin kaynağı) |
| `docs/plans/2026-10-05-demo-sizintisi-rapor.md` | Plan | Plansız |
| `docs/plans/2026-10-05-olcum-raporu.md` | Plan | Plansız |
| `docs/plans/2026-10-05-plan-8-urun-istegi.md` | Plan | Plansız |
| `docs/plans/publiccard-envanter.md` | Plan | Plansız |
| `docs/plans/qwen-sirali/` (4 dosya) | Plan kaynakları | Plansız |

---

## Batch → dosya özeti

| Batch | Değiştirilmiş | İzlenmeyen | Migration | Toplam |
|---|---|---|---|---|
| **A1** (ui/lib) | `admin-updates/2026-10.ts`, `ProfilePage.test.tsx`, `AdminUserOverridesPage.tsx` | — | — | 3 |
| **A2** (/pricing) | `Pricing.tsx` | `plans.ts`, `plans.test.ts`, `Pricing.test.tsx` | — | 4 |
| **A3** (PremiumLockCard + rol) | `profile-sidebar-menu.tsx` | `PremiumLockCard.tsx/.test.tsx`, `role-structure.ts`, `generate-role-structure.mjs`, `CorteQS_Rol_Tablosu_v2.xlsx`, `rol-talepleri-olcum.md` | `…170000` | 8 |
| **A4** (yetki) | `features.ts`, `profile-attribute-keys.ts` | — | `…600000`, `…160000` | 4 |
| **A5** (CV paylaşım) | `profile-attribute-keys.ts`, `useProfileDocuments.ts`, `ProfilePage.tsx` | `member-cv-link/` | `…120000` (HATALI) | 5 |
| **A6** (arama süzgeç) | — | — | — | **0 — YAPILMAMIŞ** (A16 ile örtüşüyor) |
| **A7** (ilan kotası) | `DirectoryResultCard.tsx`, `catalog-directory.ts` | `job-listings-api.ts/.test.ts` | `…700000`, `…140000` | 5 |
| **A8** (/ilanlar) | `App.tsx` | `JobListingsPage.tsx`, `JobListingDetailPage.tsx`, 3 rehber taslağı | — | 6 |
| **A9** (footer) | `Footer.tsx` | `Footer.test.tsx` | — | 2 |
| **A10** (balon) | `AssistantBubble.tsx` | `AssistantBubble.test.tsx` | — | 2 |
| **A11** (useAdminAccess) | `useAdminAccess.ts` | `useAdminAccess.test.ts` | — | 2 |
| **A12** (ruhsat) | `security.ts`, `features.ts`, `profile-attribute-keys.ts`, `useProfileDocuments.ts`, `ProfilePage.tsx` | — | `…800000` | 5 |
| **A13** (otomatik onay) | `CreateEventFormSection.tsx`, `MyEventsPanel.tsx` | — | `…900000` | 3 |
| **A14** (share vurgu) | `CreateEventFormSection.tsx`, `MyEventsPanel.tsx`, `EventDetailPage.tsx` | — | — | 3 |
| **A15** (etkinlik maili) | `send-notification-emails/index.ts` | `event-published.ts`, `maillogo.png`, `public/mail/` | `…100000` (⚠️ çakışma) | 5 |
| **A16** (etkinlik arama) | `public-content-search.ts`, `PublicContentSearchResults.tsx`, `DirectoryPage.tsx` | — | `…110000` | 4 |
| **A2** (güvenlik) | — | `SECURITY_AUDIT.md` | — | 1 |
| **B11** (plansız Cadde) | `cadde-api.ts`, `cadde-types.ts` | `CaddeReactionActorsPopover.tsx` | `…150000` | 4 |
| **B5** (telefon OTP) | — | — | `…400000` | 1 |
| **B6** (G14/G16) | — | — | `…200000`, `…300000` | 2 |
| **B12** (veri/dış) | — | — | `…180000`, `…190000` | 2 |
| **A9** (G17) | — | — | `…500000` | 1 |

---

## Bulgular

1. **A6 "YAPILMAMIŞ"**: Plan A6'yı "arama kapsamı" olarak tanımlıyor ama tüm arama işi A16'da yapılmış. A6'nın konsolosluk/Cadde kolları B7 kararına bağlı → **A6 = A16 ile örtüşüyor, bağımsız iş yok**.

2. **İki yazım hatası**: "Etkinliğiz" → "Etkinliğiniz" (CreateEventFormSection.tsx + event-published.ts). A1.7'de düzeltilir.

3. **B11 plansız Cadde işi**: 4 dosya (2 değiştirilmiş + 1 izlenmeyen + 1 migration) planda yok. A1.9 incelemesi + B11 kararı bekliyor.

4. **4. rehber eksik**: Plan A8'de "Rol Talepleri" rehberi isteniyor → dosya yok.

5. **`belge-yukleme.md` erken**: CV paylaşım özelliği canlıda değil → rehber bilgi tabanına girmemeli (A8 kuralı).

6. **Migration çakışması**: `20261005100000` iki dosya (event_published_notification + whatsapp_bot_foundation). A1.3'te çözülür.

7. **Hatalı migration `applied/`'da**: `20261005120000_cv_share_with_premium.sql` yanlış şemaya yazılmış, `applied/`'den çıkarılmalı.

8. **`ProfilePage.tsx` 833 satır**: A1.6 hedefi ≤ 800.

9. **`delete-account` ve `member-cv-link` commit'siz**: Edge function'lar izlenmiyor.

10. **Plansız dokümanlar**: 10+ plan/devir dosyası commit edilmemiş — `.gitignore` veya ayrı commit kararı gerekli.

---

## A1.3 · Migration kapısı — İnceleme raporu

### Yapılan düzeltmeler

| Düzeltme | Durum | Not |
|---|---|---|
| Sürüm çakışması `…100000` | ✓ DÜZELTİLDİ | `event_published_notification` → `…100500` olarak yeniden adlandırıldı |
| Hatalı `…120000` | ✓ KALDIRILDI | `applied/` → `_removed/` taşındı (silinmedi, A5.2'de doğru yazılır) |

### Migration inceleme tablosu (20261005* serisi)

| Migration | Batch | begin/commit | idempotent | sec definer + search_path | revoke/grant | role_features | Not |
|---|---|---|---|---|---|---|---|
| `…100000_whatsapp_bot_foundation` | plansız | ✓ | ✓ | ✓ | ✓ service_role | — | ✓ RLS enable |
| `…100500_event_published_notification` | A15 | ✓ | ✓ | ✓ | ✓ authenticated | — | ⚠️ "Etkinliğiz" yazım hatası (comment) |
| `…110000_public_content_search_events` | A16 | ✓ | ✓ | ✓ | ✓ anon+auth+sr | — | |
| `…130000_seed_demo_job_listings` | A9 | ✓ | ✓ | — | — | — | ⚠️ user_id placeholder |
| `…140000_public_member_next_event` | A7 | ✓ | ✓ | ✓ | ✓ anon+auth+sr | — | |
| `…150000_cadde_post_reactors_list` | B11 | ✓ | ✓ | ✓ | ✓ authenticated | — | Plansız |
| `…160000_check_account_deletion_blocks` | A4 | ✓ | ✓ | ✓ | ✓ authenticated | — | |
| `…170000_role_structure` | A3 | ✓ | ✓ | — | ⚠️ YOK | — | ⚠️ RLS enable YOK, yetki YOK, veri boş |
| `…180000_ai_legion_hobi_kultur` | B12 | ✓ | ✓ | — | — | — | Seed data |
| `…190000_ted_innoventure_global` | B12 | ✓ | ✓ | — | — | — | Data update |
| `…600000_career_premium_features` | A4 | ✓ | ✓ | — | — | ✓ | |
| `…700000_job_listing_quota` | A7 | ✓ | ✓ | ✓ | ✓ | — | ✓ RLS enable |
| `…800000_profile_license_upload` | A12 | ✓ | ✓ | — | — | ✓ | ✓ Storage politikaları |
| `…900000_events_auto_approval` | A13 | ✓ | ✓ | ✓ | ✓ authenticated | — | ⚠️ §3 backfill UPDATE → A1.5'te ayrılmalı |

### Sorunlar ve aksiyonlar

1. **`…170000_role_structure`**: Tablo RLS enable yok, yetki tanımlanmamış. Plan A3.1'de incelenir; `roles.key` ve prefix SQL'lerine dokunulmaz.
2. **`…900000` §3 backfill**: `update events set status='published' where status='pending'` migration içinde. A1.5'te bu kısım migration'dan çıkarılıp `docs/operations/` operasyon SQL'ine taşınır.
3. **`…100500` yazım hatası**: Comment'te "Etkinliğiz" → "Etkinliğiniz". Düzeltme A1.7'de yapılır.
4. **`…130000` placeholder user_id**: Canlıya uygulanmadan önce gerçek test kullanıcısı ID'si ile değiştirilmeli (§B9).
