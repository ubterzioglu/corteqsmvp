# Cadde 3.0 — Mevcut Durum / Hedef Gap Matrisi

**Tarih:** 2026-06-10 · Spec §2.5 matrisinin envanterle doğrulanmış hali.
Her satırda "Kanıt" kolonu repo dosya:satır veya canlı DB sorgusuna (2026-06-10) işaret eder.

| Konu | Mevcut durum (doğrulanmış) | Kanıt | Hedef durum | Öncelik |
|---|---|---|---|---|
| Canonical frontend | `CaddePage.tsx` aktif, 599 satır, canonical auth + React Query | `App.tsx:173-177`, `CaddePage.tsx:6` | Aynı hat modülerize: `pages/cadde/` + `components/cadde/` + `hooks/cadde/` | P0 |
| Canonical API | Tek dosya `cadde.ts` 877 satır; 25 export; public+mutation+admin karışık; **0 RPC** | `cadde.ts` (from() çağrıları satır 495-960) | `cadde-api` / `cadde-admin-api` / `cadde-rules` / `cadde-ranking` / `cadde-schemas` / `cadde-types` / `cadde-query-keys` | P0 |
| Legacy hat | Feed.tsx (1143 satır) + 10+ bağımlı dosya **tamamı route'suz dead code**; bozuk import (`cafeNameModeration`) | `00-inventory.md` §3 | Freeze → (backfill GEREKMİYOR) → soft-decommission | P0 |
| Legacy veri | feed_posts/feed_likes/cafes/cafe_memberships **0 satır**; user_follows 1 | Canlı DB sorgusu | Write-revoke + COMMENT + drop kararı | P0 (basitleşti) |
| Profil kapısı | Aktif sayfada YOK; legacy `CaddeProfileGate` (38 satır, blur deseni) dead | `CaddePage.tsx` (gate yok), `CaddeProfileGate.tsx` | `CaddeEntryGuard` + yeni `CaddeProfileGate` aktif `/cadde`'de | P0 |
| Profil tamamlanma kriteri | Canonical auth yalnız `full_name` ile onboarding tamam sayıyor | `AuthProvider.tsx:30` | `useCaddeActorContext`: ülke + şehir + telefon doğrulama ayrı hesap | P0 |
| Telefon doğrulama | **Truth source YOK**: phone_verified=true 0 kullanıcı; phone_confirmed_at 0; OTP function'ları repoda yok; PhoneVerification.tsx dead+bozuk | Canlı DB + `supabase/functions/` glob + `PhoneVerification.tsx:36,59` | `user_verifications` tablosu + OTP Edge Functions + RPC boolean | P0 🔴 D-03 |
| Köprü paylaşım yetkisi | `filters.bridge` sadece okuma filtresi; entitlement yok; RLS'de is_bridge kontrolü yok | `CaddePage.tsx:321`, mig `20260529213000:188-194` | `can_post_kopru()` + `create_cadde_post_v1` RPC enforce + truth-table testleri | P0 |
| Mutation güvenliği | INSERT'ler doğrudan tabloya açık (login+self yeter); rate-limit/ban yok | mig `20260529213000:188-265` | Mutation yalnız security-definer RPC; direct insert revoke | P0 |
| Ülke/şehir filtresi | Tek ülke + tek şehir; legacy çoklu filtre dead | `CaddePage.tsx`, `MultiCountryCityFilter.tsx` (dead) | Çoklu filtre + URL state + alfabetik şehir | P0/P1 |
| Geo veri tabanı | cadde mini-dünya 5 ülke/6 şehir; geo_* 251/76.990; FK yok | Canlı DB sorgusu | P0'da FK korunur; P1 geo_* sync/konsolidasyon (D-04) | P1 |
| Çarşı | Hiçbir carsi dosyası/tablosu yok | grep `carsi` = 0 kaynak dosya | `carsi_items`+`carsi_categories`, ticker, rotalar, admin | P0/P1 |
| Cafe | Temel liste + tek-tık join (`joinCaddeCafe` upsert); entry policy/detay/arşiv yok; legacy form (tema/davet/soru/kapasite) dead | `cadde.ts:856`, `CreateCafeForm.tsx` (dead) | Tek `CreateCafeForm`, open/approval/referral, `/cadde/cafe/:id`, arşiv read-only | P0/P1 |
| Reklam | Statik billboard + tek inline sponsor; kampanya/onay/telemetri yok | `cadde.ts:743-810`, tablolar | `cadde_promotion_*` kampanya katmanı + placement + impression/click | P1 |
| Çıfıt adı | Kodda hiç geçmiyor (yalnız legacy UI metniydi) | grep | UI "Tanıtım" önerisi (D-01) | P0 karar |
| İlgi alanları | Tablo/kod yok | grep `interest` | `cadde_interest_catalog` + user/post interests + skor katkısı | P1 |
| Ranking | `pinned desc, created_at desc` | `cadde.ts` listCaddeFeed | CKS-7 band + skor + deterministik random + cursor RPC | P1 |
| Bildirim | `notifications` tablosu var (0 satır, realtime açık) ama producer yalnız legacy trigger; bell UI dead; gevşek insert policy | mig `20260326112832:37-46,80`, `NotificationsList.tsx` | Tabloyu genişlet (R-03), producer RPC'ler, `NotificationsBell`, Realtime | P1 |
| Çoklu diaspora | `DiasporaContext` var (tr/in/cn/ph) ama Cadde sorgularına bağlı değil; tablolarda `diaspora_key` yok | `DiasporaContext.tsx:12,53` | `diaspora_key` kolonları + context bağlantısı + filtreler | P1/P2 |
| Premium | `useIsPremium`: admin=premium demo mantığı (dead) | `useIsPremium.ts:16` | Feature-bazlı entitlement (D-07) | P1 |
| Moderasyon | Admin CRUD var (hide=status); queue/report/ban/audit/rate-limit yok | `AdminCaddePage.tsx` | `cadde_post_reports` + `cadde_moderation_queue` + `cadde_user_bans` + panel | P0/P1 |
| Hata görünürlüğü | 6 sessiz catch demo/boş veriye düşüyor; telemetri yok | `cadde.ts:498,517,589,705,773,809` | Telemetri + kullanıcı dostu hata + etiketli fallback | P0 |
| Demo default | `?mode` yokken **demo** açılıyor; feed %100 demo seed | `cadde.ts:463`; canlı DB (3 demo post) | Production default `real` (R-01) | P0 |
| Feature anahtarları | Yalnız `cadde.access`, tüm 76 role açık | Canlı DB; mig `20260603170000` | 19 granular `cadde.*` anahtarı + açık role-mapping seed (R-02) | P0 |
| Admin alanı | Tek `AdminCaddePage` 736 satır | dosya | `/admin/cadde/*` alt rotalar + dashboard + moderation + settings | P1 |
| Test | İnce kapsam: 3 dosya vardı (`cadde.test.ts` format helper'ları, `CaddePage.test.tsx` 2 senaryo, `App.cadde-routes.test.tsx` route smoke); Faz 1'de modül bazlı yeniden düzenlendi (`cadde-format.test.ts`, `cadde-schemas.test.ts`, `pages/cadde/CaddePage.test.tsx`) | dosyalar | + RLS integration + Playwright persona matrisi | P0/P1 |

## Hedefe göre eksik DB nesneleri (özet)

- **Tablolar:** `user_verifications`, `carsi_items`, `carsi_categories`, `cadde_interest_catalog`, `user_cadde_interests`, `cadde_post_interests`, `cadde_promotion_campaigns/placements/events`, `cadde_post_reports`, `cadde_moderation_queue`, `cadde_user_bans`.
- **Kolonlar:** `cadde_posts` → diaspora_key, cafe_id, image_urls, need_category, visibility, moderation_status, engagement_score, published_at, updated_at(touch), deleted_at; `cadde_cafes` → diaspora_key, slug, theme_key, entry_mode, referral_code_hash, entry_question, capacity, archived_at; `cadde_cafe_members` → status, answer, approved_at, approved_by; `notifications` → actor_user_id, entity_type, payload.
- **RPC'ler:** spec §10.1 listesinin tamamı (`get_cadde_actor_context` … `admin_moderate_cadde_entity_v1`) — bugün 0'ı mevcut.
- **Helper'lar:** spec §10.2 listesinin tamamı — bugün yalnız `is_admin`/`is_admin_user`/`is_moderator` mevcut.
