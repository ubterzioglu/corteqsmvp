# Cadde 3.0 — Faz Bazlı Uygulama Planı

**Tarih:** 2026-06-10 · **Dayanak:** `00-inventory.md`, `01-decisions.md`, `02-current-gap-matrix.md`, spec §21-25
**İlke:** Her faz kendi PR'ı(ları) ile gelir; sıra her fazda: plan → migration → RPC/RLS → api katmanı → React Query hook → UI → unit test → integration test → E2E → lint/test/build → değişen dosyalar + CKS etkisi raporu.

## Faz bağımlılık haritası

```text
Faz 0 (bu dokümanlar) ✅
  → Faz 1 (modülerleştirme — bağımsız, hemen başlanabilir)
      → Faz 2 (actor context + gate + Köprü policy)   [🔴 D-03 SMS kararı gerekli]
          → Faz 3 (filtre + interests + ranking)       [D-04 geo sync burada]
          → Faz 4 (Cafe)
          → Faz 5 (Çarşı)            [Faz 2'ye bağlı; 3-4'ten bağımsız]
          → Faz 6 (Tanıtım/Çıfıt)    [D-01 ad kararı; Faz 2'ye bağlı]
              → Faz 7 (bildirim + realtime + moderasyon)
                  → Faz 8 (çoklu diaspora)
                      → Faz 9 (legacy decommission — her an öne alınabilir, veri riski yok)
```

---

## Faz 1 — Canonical domain modülerleştirme (İLK KOD PR'ı)

**Migration: YOK. Davranış değişikliği: yalnız R-01 (real default + hata görünürlüğü).**

Todo:
- [ ] `src/lib/cadde.ts` → böl: `cadde-types.ts`, `cadde-schemas.ts` (Zod: post/comment/cafe-join/filter), `cadde-api.ts` (public read + mutation), `cadde-admin-api.ts` (admin CRUD), `cadde-query-keys.ts`, `cadde-format.ts`. Eski `cadde.ts` geçici re-export barrel olarak kalır (import kırılmasın), Faz 2 sonunda silinir.
- [ ] 6 sessiz catch (eski cadde.ts:498,517,589,705,773,809) → telemetri (`cadde_api_error` console.error + Sonner toast) + **etiketli** fallback; hata sessizce demo veriye düşmez.
- [ ] `parseCaddeFilters` default'u `real` (R-01); demo yalnız `?mode=demo`.
- [ ] `CaddePage.tsx` → `src/pages/cadde/CaddePage.tsx` taşı; App.tsx lazy import güncelle (route path `/cadde` DEĞİŞMEZ).
- [ ] Yeni modüllerde `as any` yok; public export'lar explicit tipli.
- [ ] Unit testler: `cadde-schemas.test.ts`, `cadde-format.test.ts`.

Kabul:
- [ ] `/cadde` aynı görünümle açılır (real default farkı hariç); mevcut demo switch çalışır.
- [ ] `npm run lint` + `npm run test` + `npm run build` geçer.
- [ ] Hiçbir legacy dosyaya dokunulmadı; migration yok.

## Faz 2 — Actor context, profil kapısı, Köprü policy 🔴 (D-03 kararı şart)

Migration grubu (gerçek timestamp ile):
- `*_cadde300_user_verifications.sql` — `user_verifications` tablosu (spec §6.3), RLS: dışa kapalı.
- `*_cadde300_feature_seed.sql` — 19 `cadde.*` anahtarı `afs_features`'a + 76 flat rol için açık `role_features` mapping (R-02; mapping matrisi PR açıklamasında).
- `*_cadde300_actor_context_rpc.sql` — `get_cadde_actor_context()` + helper'lar: `is_cadde_profile_complete`, `is_tr_resident`, `is_diaspora_resident`, `can_post_cadde`, `can_post_kopru` (security definer, `set search_path=public`, recursion-free).
- `*_cadde300_post_rpc_and_rls.sql` — `create_cadde_post_v1` (telefon doğrulama + ülke/şehir + Köprü kuralları + `indiv_relocating`/`digital_community_enabled` attribute kontrolleri); `cadde_posts` direct INSERT policy'si kaldırılır; reactions/comments/cafe_members SELECT'leri authenticated'e daraltılır (D-02).

Backend dışı:
- [ ] OTP Edge Function'ları: `send-phone-otp`, `verify-phone-otp` (sağlayıcı D-03 kararına göre; demo mode'suz, rate-limit'li). Canlıda eski function deploy'u var mı kontrol et (`supabase functions list`).
- [ ] `src/hooks/cadde/useCaddeActorContext.ts` (tek RPC çağrısı, spec §6.2 dönüş tipi).
- [ ] `src/components/cadde/CaddeEntryGuard.tsx` + `CaddeProfileGate.tsx` (legacy blur deseninden port) → aktif `/cadde`'ye entegre: anonim→login, profil eksik→blur+modal+eksik alan listesi, access kapalı→kilit ekranı.
- [ ] Yeni `PhoneVerificationCard` (profil ayarlarında; eski `PhoneVerification.tsx` freeze'de kalır).
- [ ] `cadde-rules.ts`: Köprü/Cadde truth-table'ının TS aynası (UI guard için) + `cadde-rules.test.ts` (spec §22.1'deki 10 truth-table senaryosu).
- [ ] Integration test (lokal Supabase): RLS insert rejection, RPC Köprü senaryoları.
- [ ] Playwright: anonim / profil eksik / doğrulanmamış / TR bireysel ±relocating / TR işletme ±community / diaspora personaları.

Kabul: spec §21 Faz 2 kabul listesinin tamamı.

## Faz 3 — Filtre, ilgi alanları, ranking

- Migration: `cadde_interest_catalog` + `user_cadde_interests` + `cadde_post_interests` + seed (13 ilgi alanı); `cadde_posts`'a `need_category`, `engagement_score`, `published_at`; `list_cadde_feed_v1(filters, cursor)` RPC (band A-F + skor + `hash(post_id+date+scope)` deterministik random + stabil cursor).
- D-04: `cadde_countries/cities`'e `geo_country_id/geo_city_id` kolonu + geo_*'dan kontrollü şehir/ülke genişletme sync'i.
- UI: `MultiCountryCityFilter` (legacy'den port, çoklu seçim + URL state + alfabetik), profil "Bireysel İlgi Alanlarım", post composer 1-3 etiket.
- `cadde-ranking.ts` + `cadde-targeting.ts` + unit testleri; pagination tekrar/kayıp testi.

## Faz 4 — Cafe

- Migration: `cadde_cafes` genişletme (slug, theme_key, entry_mode open/approval/referral, referral_code_hash, entry_question, capacity, archived_at + check'ler); `cadde_cafe_members` genişletme (status, answer, approved_at/by); `create_cadde_cafe_v1`, `join_cadde_cafe_v1`, `approve_cadde_cafe_member_v1`, `archive_cadde_cafe_v1`, `can_join_cadde_cafe`.
- Cafe ülke policy: Köprü cafe=doğrulanmış herkes; TR cafe=TR yerleşik+TR telefon; diğer=doğrulanmış (RPC'de). Günlük limit D-06 ürün kararına göre RPC rate-limit'i.
- UI: tek `CreateCafeForm` (legacy alanlar port; davet kodu hash'li), `/cadde/cafe/:cafeId` rotası (App.tsx'e ek — SEO rotalarına dokunmaz), cafe feed (`cadde_posts.cafe_id` + `visibility='cafe'`), owner onay paneli, read-only arşiv, public profilde "Açık Cafe" listesi.
- Cafe adı moderasyonu: `cadde-rules.ts` içinde (R-05).

## Faz 5 — Çarşı

- Migration: `carsi_categories` (7 seed) + `carsi_items` + RLS + `create/update/delete_carsi_item_v1`; ilan limiti feature-bazlı (D-07).
- UI: `CarsiGlobalTicker` (desktop sol kolon üstü + mobil header altı yatay — spec §4.1 mobil kuralı), `/cadde/carsi`, `/cadde/carsi/:itemId`, `/profile?tab=carsi`, `/admin/cadde/carsi`.
- `cadde.carsi.*` feature'larıyla yetki; Tanıtım'dan tablo/panel düzeyinde ayrı (D-01 sözleşmesi).

## Faz 6 — Tanıtım / Çıfıt

- Migration: `cadde_promotion_campaigns/placements/events` + 6 placement seed; mevcut billboard/sponsored tabloları korunur (geçiş: admin billboard'ları kampanyaya bağlama opsiyonel P2).
- UI: `/profile?tab=tanitim` kampanya paneli, admin onay akışı (`/admin/cadde/promotions`), `PromotionRail` + `SponsoredFeedCard` (3-5 organik postta bir, frequency cap, zorunlu "Sponsorlu" badge), target URL validasyonu (`rel="noopener noreferrer"`), impression/click `record_cadde_promotion_event_v1` (abuse limitli).
- Görünürlük yalnız `cadde.promotion.create` feature'ı ile (persona string'i değil); Şehir Elçisi `city-ambassador-highlight` ücretsiz.

## Faz 7 — Bildirim, realtime, moderasyon

- Migration: `notifications` genişletme (R-03: actor_user_id, entity_type, payload; gevşek insert policy kaldırılır); `cadde_post_reports`, `cadde_moderation_queue`, `cadde_user_bans`; `report_cadde_entity_v1`, `admin_moderate_cadde_entity_v1`, `is_cadde_moderator`; producer'lar (comment/reaction/cafe eventleri) RPC içinden.
- UI: `NotificationsBell` (unread badge + dropdown + deep link + mark read), Realtime yalnız `recipient=auth.uid()` kanalı; feed'de "yeni post" chip + invalidate (stream yok).
- `/admin/cadde/moderation` (filtre + aksiyonlar + audit notu); rate-limit'ler RPC'lerde (sayılar ürün kararıyla).
- `AdminCaddePage` → `pages/admin/cadde/routes.tsx` modülerleştirmesi (muhasebe deseni) bu fazda tamamlanır.

## Faz 8 — Çoklu diaspora

- Migration: `cadde_posts/cadde_cafes/carsi_items/cadde_promotion_placements`'a `diaspora_key text not null default 'tr'`.
- `DiasporaContext` → feed/cafe/carsi/promotion filtreleri + post create payload; UI stringleri context'ten; TR/IN/CN/PH ayrım testleri.

## Faz 9 — Legacy soft-decommission (veri riski YOK)

Envanter sonucu backfill iptal; sıra:
1. [ ] Legacy tablolara write-revoke + açıklayıcı `COMMENT` migration'ı (`feed_posts`, `feed_likes`, `cafes`, `cafe_memberships`, `user_follows`); legacy trigger'lar drop (`trg_enforce_*`, `trg_update_cafe_member_count_*`, `trg_notify_followers_on_cafe`, `feed_likes_count_trigger`, `update_feed_posts_updated_at`).
2. [ ] Dead dosyaları sil: `Feed.tsx`, `components/feed/*`, `CaddeProfileGate.tsx`(eski), `useCafes/useFeedSocial/useConnections/useIsPremium`, `components/connections/*`, `ProfileIndividual/Ambassador`, `IndividualPublicView/Card`, `NotificationsList/Panel`(eski), `PhoneVerification.tsx`(eski), `DiasporaPeople.tsx` (bozuk `cafeNameModeration` importu da gider).
3. [ ] `AdminDatabaseTablesPage` statik listesinden legacy satırları çıkar.
4. [ ] En az 1 canary sürüm gözle; sonra ayrı karar dokümanı + migration ile DROP (user_follows 1 satırı not düşülerek — R-06).
5. [ ] `supabase gen types` regenerate; CKS/teknik referans güncelle; `docs/cadde-300/change-report.md`.

---

## Freeze listesi (Faz 1'den itibaren geçerli)

`00-inventory.md` §11/6'daki 15 dosya/dizin. Bu dosyalara yalnız kaldırma veya kritik güvenlik düzeltmesi için dokunulur.

## Her fazın CI kapısı

```bash
npm run lint
npm run test
npm run build
supabase db reset            # lokal migration bütünlüğü (Docker olan ortamda; yoksa canlıya psql ile uygulama + schema_migrations insert — bkz. DB erişim notu)
supabase gen types typescript --project-id injprdrsklkxgnaiixzh > src/integrations/supabase/types.ts
npx playwright test          # ilgili persona senaryoları
```

> **DB erişim notu:** Bu makinede Docker yok; `supabase db push/reset` çalışmaz. Migration'lar canlıya `psql` (IPv4 pooler) ile uygulanır ve `supabase_migrations.schema_migrations`'a manuel kayıt atılır. Types üretimi Management API ile Docker'sız çalışır.

## P2 backlog (scope dışı — D-08/D-09)

Juke Box, Post-it, AI tema eşleştirme önerisi, AI Görüşme CTA'sı, billboard→kampanya migrasyonu, tam cadde↔geo konsolidasyonu, gerçek abonelik (Stripe/Paddle) entegrasyonu.

## Definition of Done

Spec §25 listesi aynen geçerlidir (mimari: tek hat, RPC-only mutation, canonical auth, eski tablo adlarına 0 referans; ürün: gate/Köprü/cafe/Çarşı/Tanıtım/ranking/bildirim/moderasyon/diaspora; kalite: lint+test+build+RLS integration+Playwright+release verify+CKS güncellemesi+change-report).
