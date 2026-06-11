# Cadde 3.0 — Faz 0: Inventory + Karar + Gap + Uygulama Planı Dokümanları

## Context

`CORTEQS_CADDE_3_0_E2E_REBUILD_SPEC.md` (2253 satır) Cadde modülünün E2E yeniden yapılandırılmasını tanımlıyor. Kullanıcının talebi net: **bu turda kod yazılmayacak**; önce `docs/cadde-300/` altında 4 doküman üretilecek (inventory, decisions, gap matrix, implementation plan), 8 envanter sorusuna açık cevap verilecek, sonra faz bazlı plan sunulacak.

Envanter araştırması bu planlama oturumunda **tamamlandı** (repo taraması + canlı DB read-only psql sorguları, 2026-06-10). Dokümanlar aşağıdaki doğrulanmış bulgularla yazılacak.

## Doğrulanmış Envanter Bulguları (dokümanların hammaddesi)

### Aktif canonical hat
- `/cadde` rotası: [src/App.tsx:173-177](src/App.tsx#L173) — `RequireAuth` + `RequireFeature(GENERIC_FEATURE_KEYS.caddeAccess)` + lazy `CaddePage` (App.tsx:55).
- `/admin/cadde`: [src/App.tsx:233](src/App.tsx#L233) — AdminLayout altında `AdminCaddePage` (736 satır, CRUD).
- [src/pages/CaddePage.tsx](src/pages/CaddePage.tsx) (599 satır): **canonical auth kullanıyor** (`@/components/auth/useAuth`), React Query, `filters.bridge` toggle, tek ülke/şehir filtresi.
- [src/lib/cadde.ts](src/lib/cadde.ts) (877 satır): 25 export; **hepsi direkt tablo erişimi, hiç RPC yok**. Tablolar: 9 `cadde_*` + `user_profile_attributes` (yazar adı/avatar). Admin CRUD fonksiyonları da aynı dosyada (spec: `cadde-api` / `cadde-admin-api` ayrımı ister).
- Feature: yalnız `cadde.access` var ([src/lib/features.ts:25](src/lib/features.ts#L25)); `useFeatureFlags` → `get_current_user_features()` RPC. **`cadde.access` 2026-06-03 seed'inde TÜM aktif rollere `true` verilmiş** (`20260603170000`) — fiilen "rolü olan her login kullanıcı girer".

### DB durumu (canlı, 2026-06-10 psql sorguları)
- 9 `cadde_*` tablosu: `20260529213000_create_cadde_mvp.sql`. FK'ler `20260609002000` ile `user_profiles` → `auth.users`'a taşındı; `is_admin_user()` artık `is_admin()`'e delege (user_role_assignments).
- **Cadde içeriği %100 demo**: cadde_posts 3 (hepsi demo), cadde_cafes 2 (demo), billboard 2, sponsored 1, reactions/comments/members 0. **Gerçek kullanıcı içeriği SIFIR** → şema değişikliği serbestliği yüksek.
- **Legacy tablolar canlıda DURUYOR ama BOŞ**: feed_posts 0, feed_likes 0, cafes 0, cafe_memberships 0, user_follows 1, notifications 0. `connections` tablosu yok. DROP migration hiç yazılmamış. → **Backfill GEREKMİYOR.**
- Legacy trigger'lar canlıda yaşıyor (yalnız legacy tablolarda, `cadde_*`'da trigger yok): `trg_enforce_cafe_capacity`, `trg_enforce_daily_cafe_join`, member-count trigger'ları (cafe_memberships), `trg_notify_followers_on_cafe` (cafes), feed_likes count.
- RLS (cadde_*): INSERT'ler **doğrudan tabloya açık** (`auth.uid() is not null` + owner check yeter) — profil/telefon gate'i RLS'de YOK. Spec'in "INSERT yalnız RPC üzerinden" hedefiyle çelişiyor.
- Geo: `geo_countries` 251 / `geo_cities` **76.990** satır global referans; `cadde_countries` 5 / `cadde_cities` 6 ayrı mini-dünya, aralarında FK yok (D-04).
- `notifications` tablosu var (20260326, eski lovable): `user_id/type/title/message/related_id/is_read`, realtime publication açık; "System can insert ... WITH CHECK (true)" policy'si gevşek. Spec'in önerdiği şemadan (recipient/actor/event_type/entity/payload) farklı.

### Telefon doğrulama — truth source YOK
- `afs_attributes`'ta `phone` (116 kullanıcı) ve `phone_verified` (14 satır, **0 tanesi 'true'**) var. `auth.users.phone_confirmed_at` dolu kullanıcı: **0**.
- [src/components/PhoneVerification.tsx](src/components/PhoneVerification.tsx) üçlü bozuk: (a) hiçbir yerden import edilmiyor (dead), (b) `profile?.phone_verified` okuyor ama canonical `Profile` tipinde bu alan yok → hep "Doğrulanmadı", (c) `send-phone-otp` / `verify-phone-otp` Edge Function'ları repoda mevcut değil (repoda yalnız 4 function var).
- → Spec §6.3'teki `user_verifications` tablosu + OTP akışı sıfırdan kurulmalı; SMS sağlayıcısı ürün kararı (D-03).

### Legacy hat — tamamı route'suz dead code
- [src/pages/Feed.tsx](src/pages/Feed.tsx) (1143 satır) **App.tsx'te route edilmiyor**. Tüm zincir ölü: `components/feed/*` (4 dosya), `useCafes`, `useFeedSocial`, `useConnections`, `useIsPremium` (admin=premium demo mantığı), `CaddeProfileGate` (38 satır blur gate), `components/connections/*`, `ProfileIndividual`/`ProfileAmbassador` (import eden yok), `IndividualPublicView` (yalnız kendi testi), `NotificationsList`/`NotificationsPanel`, `DiasporaPeopleSearch` (`DiasporaPeople.tsx` de route'suz).
- **Bozuk import**: [CreateCafeForm.tsx:22](src/components/feed/CreateCafeForm.tsx#L22) → `@/lib/cafeNameModeration` **dosyası yok** (dead chain olduğu için build patlamıyor; latent risk).
- Taşınacak değerli UX: CaddeProfileGate blur deseni, MultiCountryCityFilter çoklu seçim, CreateCafeForm alanları (tema/davet kodu/giriş sorusu/kapasite), share/clipboard fallback.

### CKS exact-path denetimi
- Bulunamayanlar (canonical modülde yeniden yazılacak): `caddeRules.ts`, `CarsiGrid/CarsiGlobalTicker/CarsiItemsManager`, `interestTargeting.ts`, `NotificationsBell.tsx`, `cafeNameModeration.ts` (import ediliyor ama dosya yok!), `AIConsultationCTA.tsx`. `carsi`/`çıfıt` geçen hiçbir kaynak dosya yok.
- `DiasporaContext` var ([src/contexts/DiasporaContext.tsx](src/contexts/DiasporaContext.tsx)): tr/in/cn/ph; yalnız landing çevirilerinde kullanılıyor, Cadde sorgularına bağlı değil.
- CKS v2 dokümanı repoda YOK (yalnız spec içinden referanslı) — decisions dokümanında kayda geçecek.

## Yapılacak İş (tek faz — yalnız doküman, kod yok)

`docs/cadde-300/` klasörü oluşturulup 4 dosya yazılacak:

### 1. `docs/cadde-300/00-inventory.md`
Yukarıdaki bulguların tamamı, kanıt referanslı (dosya:satır, migration adı, canlı DB sayıları + sorgu tarihi). Bölümler: rotalar, canonical frontend, legacy hat + dead-chain analizi, DB şemaları, RLS/trigger envanteri, telefon doğrulama, notifications, geo ilişkisi, AFS/feature durumu, canlı veri sayıları, CKS exact-path denetimi, bozuk importlar. Sonunda **8 sorunun açık cevabı**:
1. **Gerçekten kullanılan tablolar:** 9 `cadde_*` + `user_profile_attributes`/`afs_attributes` + `user_role_assignments` (auth). Legacy feed/cafe tabloları yalnız dead-code'dan referanslı.
2. **Legacy gerçek veri:** YOK (hepsi 0; user_follows'ta 1 satır). Backfill gerekmez; doğrudan write-freeze + drop kararı.
3. **Telefon truth source:** YOK — kurulacak (`user_verifications` + OTP Edge Functions; SMS sağlayıcı ürün kararı).
4. **CKS ile çelişen trigger/policy:** legacy `cafe_memberships` trigger'ları (günlük limit, kapasite — D-06, otomatik taşınmayacak); `cadde_*` INSERT policy'lerinde gate yokluğu (doğrulanmamış kullanıcı RLS düzeyinde post atabilir); `notifications` gevşek insert policy'si.
5. **Çarşı vs Çıfıt:** Çarşı = yeni `carsi_items`/`carsi_categories` marketplace modülü (`/cadde/carsi`); Çıfıt/Tanıtım = mevcut billboard/sponsored + yeni `cadde_promotion_*` kampanya katmanı. Ayrı tablolar, ayrı admin sayfaları; asla birleştirilmez.
6. **Freeze listesi:** Feed.tsx, components/feed/* (4), useCafes, useFeedSocial, useConnections, useIsPremium, CaddeProfileGate, components/connections/*, ProfileIndividual/Ambassador, IndividualPublicView/Card, NotificationsList/Panel, PhoneVerification.tsx, DiasporaPeople.tsx.
7. **İlk PR:** bu 4 doküman (kod yok). İlk kod PR'ı = Faz 1 modülerleştirme (davranış değişikliği sıfır).
8. **Ürün kararı gereken riskler:** aşağıdaki decisions listesi.

### 2. `docs/cadde-300/01-decisions.md`
Spec D-01..D-10 + repo-spesifik kararlar, her biri öneri ve "ürün onayı gerekli mi?" etiketiyle:
- D-01 Çıfıt marka adı (öneri: UI'da "Tanıtım", Çıfıt opsiyonel marka).
- D-02 anonim erişim (öneri: MVP'de login zorunlu, demo landing ayrı).
- D-03 SMS/OTP sağlayıcısı — **bloklayıcı**: Faz 2 öncesi karar şart (doğrulanmış telefon 0 kullanıcı).
- D-04 `cadde_countries/cities` (5/6) vs `geo_countries/cities` (251/76.990): P0'da FK bozulmaz; öneri P1'de cadde geo'yu geo_* ile senkron/konsolide etme planı.
- D-05 legacy veri: ÇÖZÜLDÜ — veri yok, backfill yok.
- D-06 cafe günlük limit/kapasite trigger'ları: otomatik taşıma yok; CKS ile ürün kararı.
- D-07 premium: `useIsPremium` demo mantığı üretime taşınmaz; entitlement tasarımı.
- D-08 AI tema eşleştirme P2; D-09 Juke Box/Post-it P2 backlog; D-10 public profile toggle global AFS attribute.
- R-01 (repo): cadde feed'i %100 demo seed — production'da demo default'unun kaderi.
- R-02: `cadde.access` tüm 76 role açık seed'li — Cadde 3.0 feature seed'inde daraltma kararı.
- R-03: mevcut `notifications` tablosu yeniden mi kullanılacak (spec şemasından farklı) — öneri: mevcut tabloyu genişlet, yeni tablo açma.
- R-04: CKS v2 dokümanı repoda yok — repoya eklenmesi/eklenmemesi.

### 3. `docs/cadde-300/02-current-gap-matrix.md`
Spec §2.5 matrisi satır satır doğrulanmış kanıtla güncellenir (her satıra "Mevcut durum — kanıt: dosya:satır / DB sorgusu" kolonu eklenir; örn. "Telefon doğrulama: truth source yok, 0 doğrulanmış kullanıcı").

### 4. `docs/cadde-300/03-implementation-plan.md`
Spec §21 fazları repo gerçekliğine uyarlanmış halde:
- **Faz 1 (ilk kod PR'ı):** `cadde.ts` → `cadde-types/schemas/api/admin-api/query-keys` bölme; davranış değişikliği yok; kabul: `/cadde` aynı görünür, build/lint/test geçer.
- **Faz 2:** `user_verifications` + OTP Edge Functions + `get_cadde_actor_context()` RPC + `CaddeEntryGuard`/`CaddeProfileGate` + `can_post_cadde`/`can_post_kopru` + `create_cadde_post_v1` + cadde.* feature seed (truth-table testleriyle). D-03 kararına bağımlı.
- **Faz 3-8:** spec ile aynı (filtre/ranking, Cafe, Çarşı, Tanıtım, bildirim/moderasyon, çoklu diaspora) — her fazda migration → RPC/RLS → api → hook → UI → test sırası.
- **Faz 9 (basitleşti):** backfill YOK; legacy write-revoke + COMMENT + dead-code dosya silme + ayrı drop kararı. Bozuk `cafeNameModeration` importu da burada temizlenir (veya dosya freeze edildiği için Faz 1'de not düşülür).
- Her faz için kabul kriterleri, CI komutları (`npm run lint/test/build`, types regen), Definition of Done referansı.

## Kısıtlar (spec'ten, dokümanlara işlenecek)
- Legacy `Feed.tsx` hattına feature eklenmez; yeni rol ailesi/ikinci permission sistemi kurulmaz; flat AFS + `role_features` + `user_feature_overrides` + canonical auth + RPC/RLS kullanılır; kalıcı dual-write yok; migration silme/sıralama yok; `/cadde` SEO rotası ve Türkçe domain terimleri değişmez; `src/components/ui/*` ve generated types elle düzenlenmez.

## Doğrulama
- 4 dosyanın varlığı ve iç tutarlılığı (inventory'deki sayılar ↔ gap matrix ↔ plan bağımlılıkları).
- 8 sorunun her birinin 00-inventory.md'de açıkça cevaplanmış olması.
- `git status`: yalnız `docs/cadde-300/*` (+ mevcut untracked spec) — **hiçbir kod/migration dosyası değişmemiş olmalı**.
- Canlı DB sayıları doküman içinde sorgu tarihi (2026-06-10) ile etiketli.

## Bu turda YAPILMAYACAKLAR
- Kod, migration, seed, Edge Function değişikliği yok.
- Faz 1+ uygulaması ayrı onay turuna bırakılır (kullanıcı talebi: plan sunulup durulacak).
