# Cadde 3.0 — Faz 0 Envanter Raporu

**Tarih:** 2026-06-10
**Kaynak:** Repo taraması (`main` branch) + canlı Supabase DB read-only sorguları (proje `injprdrsklkxgnaiixzh`, IPv4 pooler, 2026-06-10)
**Spec:** `CORTEQS_CADDE_3_0_E2E_REBUILD_SPEC.md`
**Durum:** Kod değişikliği yapılmadı; bu rapor salt envanterdir.

---

## 1. Rotalar

### 1.1 Aktif rotalar

| Rota | Kanıt | Guard | Sayfa |
|---|---|---|---|
| `/cadde` | `src/App.tsx:173-177` | `RequireAuth` + `RequireFeature(GENERIC_FEATURE_KEYS.caddeAccess)`, fallback `Navigate to="/"` | `src/pages/CaddePage.tsx` (lazy, App.tsx:55) |
| `/admin/cadde` | `src/App.tsx:233` | AdminLayout (`RequireAuth` + `userIsAdmin()` → `is_admin()` RPC) | `src/pages/admin/AdminCaddePage.tsx` (lazy, App.tsx:96) |

### 1.2 Var OLMAYAN rotalar

- `/feed` rotası **yok** — `src/pages/Feed.tsx` App.tsx'ten hiç import edilmiyor (grep: App.tsx'te `Feed` eşleşmesi yok).
- `/cadde/cafe/:id`, `/cadde/carsi`, `/cadde/carsi/:id` yok (Cadde 3.0'da eklenecek).
- `src/pages/DiasporaPeople.tsx` de route edilmiyor (dead).

---

## 2. Aktif (canonical) frontend hattı

### 2.1 `src/pages/CaddePage.tsx` — 599 satır

- **Auth:** canonical `@/components/auth/useAuth` (satır 6) — shim DEĞİL. ✅
- **Veri:** React Query (`useInfiniteQuery`/`useQuery`/`useMutation`, satır 2) → tüm çağrılar `src/lib/cadde.ts` üzerinden.
- **Demo/real:** URL `?mode=` parametresi; **default `demo`** (`cadde.ts:463` `parseCaddeFilters`). UI'da "Gerçek / Demo" switch (CaddePage.tsx:278). Post atınca real moda zorlanıyor (satır 158).
- **Filtre:** tek ülke + tek şehir (CKS'in çoklu filtresi yok).
- **Köprü:** basit `filters.bridge` switch (CaddePage.tsx:321) — sadece feed filtresi; paylaşım entitlement'ı YOK.
- **Billboard / sponsor:** sağ kolon billboard kartları + `injectSponsoredPlacement` ile feed içi sponsor kartı (CaddePage.tsx:224).
- **Profil kapısı YOK:** profil eksik / telefon doğrulanmamış kullanıcı için hiçbir gate yok.

### 2.2 `src/lib/cadde.ts` — 877 satır, 25 export

Public okuma: `listCaddeCountries`, `listCaddeCities`, `listCaddeFeed`, `listCaddeCafes`, `listCaddeBillboardCards`, `getCaddeSponsoredPlacement`.
Mutation: `createCaddePost`, `toggleCaddeReaction`, `createCaddeComment`, `joinCaddeCafe`.
Admin CRUD (aynı dosyada!): `listAdminCaddePosts/saveAdminCaddePost/deleteAdminCaddePost` + cafes + billboard + sponsored eşdeğerleri (satır 864-960).
Yardımcı: `parseCaddeFilters`, `serializeCaddeFilters`, `injectSponsoredPlacement`.

- **RPC kullanımı: SIFIR.** Tüm erişim doğrudan `db.from("cadde_*")` (insert dahil — `createCaddePost` → `cadde_posts` insert, satır 828).
- Yazar adı/avatar için `user_profile_attributes` + `afs_attributes` join okunuyor (satır 608). ✅ canonical.
- **Demo fallback:** Supabase yoksa veya `mode==='demo'` ise hardcoded demo sabitleri dönüyor (satır 300-450).
- **Sessiz catch blokları (6 adet):** satır 498, 517, 589, 705, 773, 809 — hata yutulup demo/boş veri dönüyor. Telemetry yok, kullanıcı hatayı görmüyor.
- **Sıralama:** `pinned desc, created_at desc` — CKS-7 band/skor sistemi yok.

### 2.3 `src/pages/admin/AdminCaddePage.tsx` — 736 satır

Tek dosyada posts/cafes/billboards/sponsored CRUD; `cadde.ts` içindeki admin fonksiyonlarını çağırıyor (RLS `is_admin_user()`'a dayanıyor). Spec'in `/admin/cadde/*` alt rota modülerleştirmesi yok.

### 2.4 Feature / AFS durumu

- Tanımlı tek anahtar: `cadde.access` (`src/lib/features.ts:25`, `GENERIC_FEATURE_KEYS.caddeAccess`).
- Çözümleme: `useFeatureFlags` → `supabase.rpc("get_current_user_features")` (`src/hooks/useFeatureFlags.ts:44`). ✅ canonical.
- **DB doğrulaması:** `afs_features`'ta `cadde%` ile başlayan tek satır `cadde.access` (canlı sorgu). Spec §5.1'deki 18 ek anahtar yok.
- ⚠️ Seed (`20260603170000_add_cadde_access_feature.sql`): `cadde.access` **tüm aktif rollere `true`** verilmiş → fiilen "rol ataması olan her login kullanıcı Cadde'ye girer". (Seed eski tablo adlarıyla yazılmış — `feature_catalog`/`role_feature_flags`/`role_feature_defaults` — rebuild rename'i ile veri `afs_features`/`role_features`'a taşındı; `role_feature_defaults` drop edildi.)

### 2.5 DiasporaContext

`src/contexts/DiasporaContext.tsx`: anahtarlar `tr/in/cn/ph` (`diasporaOptions`, satır 12; default `tr`, satır 53). Yalnız landing çevirileri ve ülke seçimi için; **hiçbir Cadde sorgusu `diaspora_key` kullanmıyor** (tablolarda kolon da yok).

---

## 3. Legacy hat — tamamı route'suz dead code

### 3.1 Dosyalar ve durumları

| Dosya | Satır | Durum |
|---|---|---|
| `src/pages/Feed.tsx` | 1143 | **Route edilmiyor → dead.** `feed_posts`/`feed_likes`/`cafe_memberships` doğrudan sorguluyor (satır 180, 240, 280, 314-316, 959-967) |
| `src/components/feed/CreatePostForm.tsx` | — | Dead (yalnız Feed.tsx import ediyor); `feed_posts` insert (satır 61) |
| `src/components/feed/CreateCafeForm.tsx` | 303 | Dead; ⚠️ **bozuk import**: satır 22 `@/lib/cafeNameModeration` — **dosya repoda YOK** (dead chain olduğu için build patlamıyor; latent risk) |
| `src/components/feed/MultiCountryCityFilter.tsx` | — | Dead; çoklu ülke/şehir seçimi + `FREE_COUNTRY_LIMIT=3` premium kapısı |
| `src/components/feed/DiasporaPeopleSearch.tsx` | — | Dead (Feed.tsx + route'suz DiasporaPeople.tsx); `cafe_memberships` okuyor (satır 94) |
| `src/components/CaddeProfileGate.tsx` | 38 | Dead; blur overlay + "profili tamamla" CTA deseni — **taşınacak değerli UX** |
| `src/hooks/useCafes.ts` | 112 | Dead; `cafes`/`cafe_memberships` (satır 76, 98) |
| `src/hooks/useFeedSocial.ts` | 132 | Dead; `user_follows` (satır 52, 119, 135) |
| `src/hooks/useConnections.ts` | 184 | Dead (yalnız route'suz `components/connections/*` kullanıyor) |
| `src/hooks/useIsPremium.ts` | 19 | Dead; ⚠️ `accountType === "admin"` → premium **demo mantığı** (üretime taşınmayacak, D-07) |
| `src/components/connections/*` (NotificationsPanel, ConnectionsFollowersStats, ConnectionRequestsInline, BlockUserDialog) | — | Hiçbiri route'lu bir sayfadan import edilmiyor → dead |
| `src/components/profiles/ProfileIndividual.tsx`, `ProfileAmbassador.tsx` | — | Import eden yok → dead (NotificationsList, IndividualPublicCard zincirleri de ölü) |
| `src/components/profile/IndividualPublicView.tsx` | — | Yalnız kendi testi import ediyor; `cafe_memberships`/`user_follows` okuyor |
| `src/components/NotificationsList.tsx`, `src/components/connections/NotificationsPanel.tsx` | — | `notifications` tablosunu okuyan mevcut bileşenler; dead zincirde |
| `src/components/PhoneVerification.tsx` | 141 | Dead + bozuk (bkz. §6) |

Auth: legacy hat `@/contexts/AuthContext` **shim**'ini kullanıyor (örn. PhoneVerification.tsx:9, useIsPremium.ts:1) — shim canonical'a delege ettiği için dropped tabloya değmiyor; runtime crash riski yok ama alan eksikleri var (§6).

### 3.2 Legacy'den taşınacak değerli UX parçaları

1. `CaddeProfileGate` blur + zorunlu modal deseni → yeni `components/cadde/CaddeProfileGate.tsx`
2. `MultiCountryCityFilter` çoklu seçim UX'i → yeni `components/cadde/MultiCountryCityFilter.tsx`
3. `CreateCafeForm` alanları: tema, davet kodu, giriş sorusu, kapasite, süre → yeni tek `CreateCafeForm`
4. Feed.tsx native share / clipboard fallback
5. Sağ kolon ticari kart görsel yaklaşımı (legacy "ÇIFIT" kolonu)

---

## 4. Veritabanı — `cadde_*` şema gerçekliği

Kaynak migration: `20260529213000_create_cadde_mvp.sql`. FK düzeltmesi: `20260609002000_update_rpc_remove_rfd.sql` (satır 111-144) — tüm `user_profiles` FK'leri `auth.users`'a taşındı; `is_admin_user()` artık `is_admin()`'e (= `user_role_assignments` + `roles.key ilike 'Admin_%'`) delege ediyor (satır 165-173). FK indexleri: `20260609033000`.

| Tablo | Önemli kolonlar | Canlı satır (2026-06-10) |
|---|---|---|
| `cadde_countries` | code, name, sort_order, is_active | 5 (DE/NL/GB/US/TR) |
| `cadde_cities` | country_id→cadde_countries, name, timezone | 6 |
| `cadde_posts` | author_user_id→auth.users, content_mode(demo/real), status(draft/published/hidden), post_type(text/question/offer/event), title, body, country_id, city_id, **is_bridge**, **pinned** | **3 — hepsi demo** |
| `cadde_post_reactions` | post_id, user_id, reaction_type(like/support/idea) | 0 |
| `cadde_post_comments` | post_id, user_id, body | 0 |
| `cadde_cafes` | host_user_id, title, summary, country_id, city_id, is_bridge, is_free, starts_at, ends_at, is_active | **2 — hepsi demo** |
| `cadde_cafe_members` | cafe_id, user_id | 0 |
| `cadde_billboard_cards` | card_type(consultant/business/event), cta_url, is_featured, sort_order | 2 |
| `cadde_sponsored_placements` | placement_key(default 'feed-inline'), cta_url | 1 |

> **Sonuç:** Cadde tablolarında gerçek kullanıcı içeriği **SIFIR**. Tüm içerik 20260529 seed'inden gelen demo. Şema değişikliği/genişletme serbestliği çok yüksek; veri taşıma derdi yok.

Spec §9.2'nin istediği kolonlar (diaspora_key, cafe_id, image_urls, need_category, visibility, moderation_status, engagement_score, published_at, deleted_at) **hiçbirinde yok**.

---

## 5. RLS ve trigger envanteri

### 5.1 `cadde_*` RLS (20260529213000, satır 156-283)

| Tablo | SELECT | INSERT | UPDATE/DELETE |
|---|---|---|---|
| countries/cities | `is_active` veya admin | admin | admin |
| posts | `status='published'` veya admin | **doğrudan açık:** `auth.uid() not null AND content_mode='real' AND author=auth.uid()` | sahibi veya admin |
| reactions/comments | `using (true)` — herkese | **doğrudan açık:** login + self | sahibi veya admin |
| cafes | published veya admin | **doğrudan açık:** login + self host | sahibi veya admin |
| cafe_members | `using (true)` | login + self | self veya admin |
| billboard/sponsored | published veya admin | admin | admin |

**CKS çelişkileri:**
1. INSERT'ler doğrudan tabloya açık → **telefon doğrulanmamış / profili eksik kullanıcı RLS düzeyinde post/yorum/reaksiyon atabilir.** Spec §10.1 "mutation yalnız RPC üzerinden" ister.
2. Köprü (`is_bridge=true`) paylaşımı için hiçbir entitlement kontrolü yok.
3. `cadde_cafe_members` ve reactions/comments SELECT `using (true)` — üyelik/etkileşim verisi anonim dahil herkese açık.
4. Rate-limit, ban, moderasyon kontrolü hiçbir katmanda yok.

### 5.2 Trigger'lar (canlı DB sorgusu)

`cadde_*` tablolarında trigger **YOK**. Legacy tablolarda hâlâ canlı:

| Trigger | Tablo | CKS ilişkisi |
|---|---|---|
| `trg_enforce_cafe_capacity` | cafe_memberships | Eski kapasite policy denemesi — otomatik taşınMAyacak (D-06) |
| `trg_enforce_daily_cafe_join` | cafe_memberships | Eski günlük katılım limiti — ürün kararı (D-06) |
| `trg_update_cafe_member_count_ins/del` | cafe_memberships | Member count denormalizasyonu |
| `trg_notify_followers_on_cafe` | cafes | Takipçilere notification üretiyor — legacy notification producer |
| `feed_likes_count_trigger` | feed_likes | Like count |
| `update_feed_posts_updated_at` | feed_posts | updated_at |

Bunlar legacy tablolarla birlikte soft-decommission kapsamında; **hiçbiri canonical hatta otomatik taşınmayacak**, kurallar yeni RPC policy'lerinde yeniden yazılacak.

---

## 6. Telefon doğrulama — truth source YOK (kurulacak)

Canlı DB doğrulaması (2026-06-10):

| Kaynak | Durum |
|---|---|
| `afs_attributes` key `phone` | 116 kullanıcıda dolu (raw, E.164 garantisi yok) |
| `afs_attributes` key `phone_verified` (boolean, eski `profiles.phone_verified`'dan backfill — `20260609001000`) | 14 satır var, **`true` olan 0** |
| `auth.users.phone_confirmed_at` | **0 kullanıcı** |
| `user_verifications` tablosu | Yok |
| OTP tablosu / Edge Function | Yok — repodaki 4 function: `find-matches`, `lansman-admin`, `send-submission-email`, `submit-survey-response` |

`src/components/PhoneVerification.tsx` (141 satır) üç açıdan bozuk:
1. Hiçbir yerden import edilmiyor (dead).
2. `profile?.phone_verified` okuyor ama canonical `Profile` tipi (`auth-context.ts` / `AuthProvider.tsx:32-38`) yalnız `full_name/avatar_url/phone/account_type/onboarding_completed` içeriyor → her zaman "Doğrulanmadı".
3. `supabase.functions.invoke("send-phone-otp" / "verify-phone-otp")` çağırıyor — bu function'lar repoda yok (eski lovable repodan kalma; canlı projede deploy durumu Faz 2'de `supabase functions list` ile teyit edilmeli).

**Karar girdisi:** Cadde 3.0 için doğrulama altyapısı (spec §6.3 `user_verifications` + OTP) sıfırdan kurulmalı. SMS sağlayıcı seçimi ürün kararı (bkz. `01-decisions.md` D-03 — **Faz 2 blokeri**).

Ayrıca: canonical auth'un onboarding kriteri yalnız `full_name` (AuthProvider.tsx:30) — spec'in dediği gibi Cadde kapısı için yetersiz; `useCaddeActorContext` ayrı hesaplanacak.

---

## 7. Notifications

- Tablo **var**: `20260326112832_*.sql` satır 37-46 → `notifications(user_id→auth.users, type, title, message, related_id, is_read)`. Realtime publication'a ekli (satır 87). Canlı satır sayısı: **0**.
- RLS: kendi satırını SELECT/UPDATE; ⚠️ `"System can insert" ... WITH CHECK (true)` → **herhangi bir authenticated kullanıcı herkese notification insert edebilir** (gevşek, sıkılaştırılmalı).
- Tüketiciler: `useUnreadNotifications`, `NotificationsList`, `NotificationsPanel`, `ConsultantServiceRequests` — hepsi dead/yarı-dead zincirlerde.
- Üretici: yalnız legacy `trg_notify_followers_on_cafe` + `ConsultantServiceRequests` manuel insert.
- Spec §9.9 şeması (recipient/actor/event_type/entity_type/entity_id/payload) mevcut şemadan farklı → karar R-03: **mevcut tabloyu genişlet, ikinci tablo açma** (öneri).

---

## 8. Geo tabloları

| Dünya | Tablolar | Canlı satır | Kullanan |
|---|---|---|---|
| Global referans | `geo_countries` / `geo_cities` (`20260606133000_global_geo_reference.sql`, seed `20260607000000`) | **251 / 76.990** | Üye profilleri / katalog tarafı |
| Cadde mini-dünyası | `cadde_countries` / `cadde_cities` | 5 / 6 | Tüm `cadde_*` FK'leri |

İki dünya arasında **FK/sync yok**. Tüm cadde tabloları `cadde_countries/cities`'e bağlı. CKS'in çoklu ülke/şehir vizyonu 5 ülke/6 şehirlik mini-dünyayla ölçeklenmez → D-04: P0'da FK bozulmaz, P1'de geo_* ile senkron/konsolidasyon planı.

---

## 9. CKS exact-path denetimi

| CKS referansı | Repo durumu |
|---|---|
| `src/lib/caddeRules.ts` | Yok → canonical `src/lib/cadde-rules.ts` olarak yazılacak |
| `src/components/feed/CarsiGrid.tsx`, `CarsiGlobalTicker.tsx`, `CarsiItemsManager.tsx` | Yok (repo genelinde `carsi`/`çıfıt` geçen kaynak dosya yok) → `components/cadde/` altında yeni |
| `src/lib/interestTargeting.ts` | Yok → `cadde-targeting.ts` |
| `src/components/NotificationsBell.tsx` | Yok; en yakın mevcutlar `NotificationsList.tsx` / `NotificationsPanel.tsx` (dead) → yeni `components/cadde/NotificationsBell.tsx` |
| `src/lib/cafeNameModeration.ts` | **Yok ama `CreateCafeForm.tsx:22` import ediyor** (bozuk) → canonical moderasyon helper'ı yeni yazılacak |
| `src/components/AIConsultationCTA.tsx` | Yok |
| CKS v2 dokümanının kendisi | Repoda yok (yalnız spec içi referans) → R-04 |

Mevcut Cadde dokümanları: `docs/modules/cadde/cadde.md` (eski MVP spec'i), `docs/history/completed-plans/caddePLAN.md`, `docs/architecture/AI_TECHNICAL_REFERENCE.md` (cadde yalnız SEO-route + terminoloji satırlarında), `docs/AGENT_CONTEXT.md`.

---

## 10. Legacy tablolar — canlı veri raporu

Oluşturulma: `20260513000003` (feed_posts+feed_likes), `20260513000004` (user_follows), `20260513000005` (cafes+cafe_memberships). **Hiçbiri için DROP migration yazılmamış; tablolar canlıda duruyor.**

| Tablo | Canlı satır (2026-06-10) |
|---|---|
| `feed_posts` | **0** |
| `feed_likes` | **0** |
| `cafes` | **0** |
| `cafe_memberships` | **0** |
| `user_follows` | **1** |
| `notifications` | 0 |
| `connections` | tablo yok |

> **Sonuç:** Backfill **GEREKMİYOR**. Spec §20.2 "veri yok" dalı geçerli: yazmayı kapat → COMMENT → canary → ayrı drop kararı.

`src/pages/admin/AdminDatabaseTablesPage.tsx:118,139-140` bu tabloları statik dokümantasyon listesinde gösteriyor (kozmetik; decommission'da güncellenecek). `src/integrations/supabase/types.ts` bu tabloları hâlâ içeriyor (types zaten güncel değil — refactor backlog B1).

---

## 11. Sekiz sorunun açık cevabı

1. **Hangi tablolar gerçekten kullanılıyor?**
   Route'lu kod yalnız şunlara değiyor: 9 `cadde_*` tablosu (CaddePage/AdminCaddePage → cadde.ts), `user_profile_attributes`+`afs_attributes` (yazar bilgisi + auth profili), `user_role_assignments`/`roles` (auth/admin), `role_features`+`user_feature_overrides` (`get_current_user_features` üzerinden). Legacy `feed_posts`/`feed_likes`/`cafes`/`cafe_memberships`/`user_follows`/`notifications` yalnız **dead code**'dan referanslı.

2. **Legacy tablolarda gerçek veri var mı?**
   **Yok.** feed_posts/feed_likes/cafes/cafe_memberships = 0 satır; user_follows = 1 satır; notifications = 0. Backfill adımı tamamen iptal; Faz 9 yalnız write-revoke + temizlik + drop kararıdır.

3. **Telefon doğrulamasının güvenilir kaynağı nedir?**
   **Bugün yok.** `phone_verified` attribute'u var ama `true` değerli tek kullanıcı yok; `auth.users.phone_confirmed_at` 0; OTP fonksiyonları repoda yok; PhoneVerification.tsx dead+bozuk. Truth source olarak spec §6.3 `user_verifications` tablosu + OTP Edge Function'ları kurulacak; `is_phone_verified` yalnız buradan okunacak.

4. **CKS kurallarıyla çelişen trigger veya policy var mı?**
   Var: (a) `cadde_*` INSERT policy'leri doğrudan tabloya açık — profil/telefon/Köprü/ban/rate-limit kontrolü yok; (b) reactions/comments/cafe_members SELECT `using(true)`; (c) `notifications` "System can insert WITH CHECK(true)"; (d) legacy `cafe_memberships` trigger'ları (günlük limit, kapasite) eski policy denemeleri — CKS ürün kararı olmadan taşınmayacak; (e) `trg_notify_followers_on_cafe` legacy notification producer.

5. **Çarşı ve Çıfıt hangi ayrı modüller olarak uygulanmalı?**
   **Çarşı** = U2U marketplace: yeni `carsi_items` + `carsi_categories` tabloları, `/cadde/carsi` + `/cadde/carsi/:itemId` rotaları, `CarsiGlobalTicker`, profil ilan yönetimi, `/admin/cadde/carsi` (Faz 5). **Çıfıt/Tanıtım** = sponsorlu görünürlük: mevcut `cadde_billboard_cards` + `cadde_sponsored_placements` korunur, üstüne `cadde_promotion_campaigns/placements/events` kampanya katmanı (Faz 6). Ayrı tablolar, ayrı admin sayfaları, ayrı feature anahtarları (`cadde.carsi.*` vs `cadde.promotion.*`); UI metni kararı D-01.

6. **Hangi dosyalar freeze edilmeli?**
   `src/pages/Feed.tsx`, `src/components/feed/*` (4 dosya), `src/components/CaddeProfileGate.tsx`, `src/hooks/useCafes.ts`, `src/hooks/useFeedSocial.ts`, `src/hooks/useConnections.ts`, `src/hooks/useIsPremium.ts`, `src/components/connections/*`, `src/components/profiles/ProfileIndividual.tsx` + `ProfileAmbassador.tsx`, `src/components/profile/IndividualPublicView.tsx`, `src/components/profiles/IndividualPublicCard.tsx`, `src/components/NotificationsList.tsx`, `src/components/PhoneVerification.tsx`, `src/pages/DiasporaPeople.tsx`. Bu dosyalara yalnız kaldırma/güvenlik düzeltmesi için dokunulur; yeni feature eklenmez.

7. **İlk PR hangi minimum değişiklikleri içermeli?**
   **PR-0 (bu):** yalnız `docs/cadde-300/` 4 doküman — kod yok. **PR-1 (Faz 1):** `cadde.ts`'i davranış değişikliği OLMADAN `cadde-types/cadde-schemas/cadde-api/cadde-admin-api/cadde-query-keys`'e bölmek + sessiz catch'leri telemetri/toast'lu hata yönetimine çevirmek + demo default'unu production'da real'e almak. Kabul: `/cadde` aynı görünür, `npm run build` geçer. Migration İÇERMEZ.

8. **Hangi riskler uygulama öncesinde ürün kararı gerektiriyor?**
   `01-decisions.md`'de tam liste: D-01 Çıfıt adı, D-02 anonim erişim, **D-03 SMS/OTP sağlayıcısı (Faz 2 blokeri)**, D-04 cadde-geo konsolidasyonu, D-06 cafe limitleri, D-07 premium entitlement, D-10 public profile toggle + repo-spesifik R-01 (demo default/seed kaderi), R-02 (`cadde.access`'in tüm rollere açık olması), R-03 (notifications şeması), R-04 (CKS dokümanının repoya alınması).
