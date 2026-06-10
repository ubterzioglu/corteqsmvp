# Admin Panel V2 — Faz 0 Baseline Raporu

**Tarih:** 2026-06-10
**Kaynak plan:** `docs/plans/2026-06-10-admin-panel-v2-masterplan.md`
**Amaç:** Yeniden yazım öncesi mevcut davranışı ve test/build durumunu sabitlemek.

---

## 1. Komut Sonuçları (yeniden yazım ÖNCESİ)

| Komut | Sonuç | Not |
|---|---|---|
| `npm run verify:text` | ✅ PASS | lint/test/build pre-hook'u olarak otomatik koşuyor |
| `npm run lint` | ❌ 452 error / 73 warning | Tamamı pre-existing; ağırlıklı `@typescript-eslint/no-explicit-any` ve `react-hooks/exhaustive-deps`. Admin V2 kapsamı dışı (refactor backlog B7). |
| `npm run test` | ⚠️ 345 pass / 1 fail (88 dosya) | Tek fail: `src/components/admin/AdminLayout.test.tsx` — `menuitem CC` beklentisi (pre-existing, Admin V2 öncesi de kırık). |
| `npm run build` | ✅ PASS (exit 0) | Production bundle üretildi. |

**Pre-existing kırık testler:**
- `src/components/admin/AdminLayout.test.tsx` → `expect(findByRole("menuitem", { name: /^CC$/ }))` — CC linki menuitem değil düz `NavLink` olarak render ediliyor. Faz 2/3 shell yazımında bu test yeni shell'e göre güncellenecek.
- `AdminMembersPage.test.tsx` — CLAUDE.md / refactor backlog B3'te kayıtlı, bu turda yeniden doğrulanmadı.

## 2. Mevcut Admin Route Envanteri (App.tsx snapshot)

Tam liste kod içinde tek kaynak olarak tutuluyor:
`src/lib/admin-shell/admin-route-meta.ts` → `ADMIN_ROUTE_PATTERNS` (55 pattern).

### Görünür ekranlar
```text
/admin                                      AdminHomePage
/admin/data                                 AdminCatalogPage
/admin/new-member/profile-role-assignment   AdminCatalogPage (alias URL)
/admin/veritabani-tablolari                 AdminDatabaseTablesPage
/admin/new-member/roles-overview            AdminRolesOverviewPage
/admin/new-member/role-matrix               AdminRoleManagementPage
/admin/new-member/durum-raporu              AdminDurumRaporuPage
/admin/new-member/guide                     AdminNewMemberGuidePage
/admin/new-member/overrides                 AdminUserOverridesPage
/admin/approvals                            AdminApprovalsPage
/admin/audit-logs                           AdminAuditLogsPage
/admin/referral (+sources/groups/types)     AdminReferral*Page
/admin/whatsapp-landings (+editors/guide)   AdminWhatsApp* / AdminCommunityGuidePage
/admin/consulates                           AdminConsulateProfilesPage
/admin/cadde                                AdminCaddePage
/admin/surveys (+new/:id/edit/:id/responses) AdminSurvey*Page
/admin/marquee                              AdminMarqueePage
/admin/social-media                         AdminSocialMediaLinksPage
/admin/advisors/:profile                    AdminAdvisorLinksPage
/admin/may19/kelime, /admin/may19/ani       AdminMay19*Page (inactive)
/admin/roller-taslak                        AdminRolesDraftPage (inactive)
/admin/about                                AdminAboutPage
/admin/workspace (+command-center/resources/todos/meeting-notes/mvp/docs/:slug)
/admin/muhasebe (+giderler/gelirler/nakit-akisi)  nested MuhasebeLayout
```

### Redirect-only route'lar (korunacak)
```text
/admin/advisors                       -> /admin/advisors/consultant
/admin/new-member/users-roles         -> /admin/new-member/profile-role-assignment
/admin/new-member/roles-list          -> /admin/new-member/guide#rol-listesi
/admin/new-member/roles-features      -> /admin/new-member/role-matrix?kind=feature
/admin/new-member/attributes          -> /admin/new-member/role-matrix?kind=attribute
/admin/new-member/profile-sections    -> /admin/new-member/role-matrix?kind=profile_section
/admin/new-member/taxonomy            -> /admin/new-member/guide?notice=taxonomy-retired
/admin/new-member/role-management     -> /admin/new-member/role-matrix
/admin/new-member/roles-preview       -> /admin/new-member/role-matrix
/admin/new-member/entity-preview      -> /admin/new-member/role-matrix
/admin/data/:category                 -> /admin/data
/admin/workspace/resources/arge       -> /admin/workspace/resources?section=arge
/admin/workspace/resources/insankaynaklari -> /admin/workspace/resources?section=insankaynaklari
```

## 3. Mevcut Shell Tespitleri (masterplan §3.3 doğrulaması)

- `src/components/admin/AdminLayout.tsx` (741 satır): session dinleme + login formu + parola reset + admin kontrolü + desktop dropdown nav + 26 elemanlı hardcoded `mobileMainLinks` + hardcoded 2 bildirim aynı dosyada.
- Erişim reddi ekranı **drop edilmiş `admin_users` tablosuna** referans veriyor (satır 283) → Faz 2'de kaldırılacak.
- Admin yetki kontrolü doğru: `userIsAdmin()` → `is_admin()` RPC (`src/lib/admin/admin-access-api.ts`).
- Navigasyon verisi 8 ayrı sabit listede (`admin-navigation.ts`) + `mobileMainLinks` + `inactiveNavItems` (AdminLayout içinde) dağılmış durumda.

## 4. Playwright Smoke Durumu

Playwright config mevcut ancak admin smoke senaryoları (E2E-ADMIN-001…014) henüz yazılmadı. Shell teslimiyle birlikte Faz 9'da eklenecek; masterplan §19.2 senaryo listesi referans alınacak.

## 5. Faz 1 Çıktıları (bu raporla aynı turda teslim edildi)

```text
src/lib/admin-shell/admin-shell-types.ts            tip tanımları
src/lib/admin-shell/admin-navigation-registry.ts    tek kaynaklı registry (8 grup)
src/lib/admin-shell/admin-navigation-utils.ts       route matching + breadcrumb + palette search
src/lib/admin-shell/admin-route-meta.ts             route snapshot + redirect/detay metadata
src/lib/admin-shell/admin-navigation-registry.test.ts  28 unit test — tümü geçti
```

Kabul kriteri sağlandı: registry'deki tüm internal URL'ler `ADMIN_ROUTE_PATTERNS` snapshot'ına karşı testle doğrulanıyor; desktop/mobile/command palette aynı registry'yi tüketebilir durumda. Mevcut `AdminLayout` görünümüne dokunulmadı.
