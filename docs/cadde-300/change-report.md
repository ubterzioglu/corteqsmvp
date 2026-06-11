# Cadde 3.0 E2E Rebuild — Değişiklik Raporu

**Dönem:** 2026-06-10 → 2026-06-11 · **Durum:** Faz 0-9 TAMAMLANDI
**Spec:** `CORTEQS_CADDE_3_0_E2E_REBUILD_SPEC.md` · **Devir notu:** `00000 CADDE_3_0_HANDOFF_DEVIR_NOTU.md`

## Faz / commit haritası

| Faz | İçerik | Ana commit | Migration |
|---|---|---|---|
| 0 | Envanter + 4 karar dokümanı | `8c4c998` (süpürüldü) | — |
| 1 | `cadde.ts` → 8 modül; real default; telemetri | `8c4c998` + `fc27b26` | — |
| 2 | Actor context, profil kapısı, Köprü policy, post RPC | `60c5baf` | 001-004 |
| 3 | Çoklu geo filtre, ilgi alanları, CKS band/skor ranking | `64fbdb1` | 005-007 |
| 4 | Cafe modülü (entry policy, detay sayfası, onay paneli) | `48c3377` | 008 |
| 5 | Çarşı (U2U marketplace; D-01: Tanıtım'dan ayrı) | `cb116c1` | 009 |
| 6 | Tanıtım kampanya katmanı (D-01 KARAR: UI "Tanıtım") | `2f92754` | 010 |
| 7 | Bildirim + realtime + moderasyon + ban kill-switch | `2a69250` | 011 |
| 8 | Çoklu diaspora (tr/in/cn/ph ayrımı) | `6d5f1e8` | 012 |
| 9 | Legacy soft-decommission (bu rapor) | (bu commit) | 013 |

Tüm migration'lar (`20260610180000` … `20260611150000`) canlıya psql ile uygulandı ve
`supabase_migrations.schema_migrations`'a kayıtlı; her biri duman testinden geçti.

## Mimari sözleşmeler (Definition of Done — spec §25 "Mimari")

- **Tek hat:** `/cadde` tek aktif frontend; legacy `Feed.tsx` hattı silindi (aşağıda).
- **RPC-only mutation:** post / yorum / reaksiyon / cafe create-join-approve-archive / çarşı
  ilanı / kampanya / şikayet / moderasyon — tamamı security-definer RPC; kullanıcı için direct
  INSERT policy'si kalmadı (kendi yorumunu düzenleme/silme ve ilgi alanı tercihi self-scoped direct).
- **Canonical auth:** her yeni dosya `@/components/auth/useAuth`; shim kullanılmadı.
- **Eski tablo adlarına 0 referans:** legacy tablolara runtime referansı yok (admin tablo
  listesinden de çıkarıldı).
- **SQL ↔ TS ayna sözleşmeleri** (birini değiştiren diğerini günceller):
  `can_post_kopru` ↔ `cadde-rules.ts` · `list_cadde_feed_v1` ↔ `cadde-ranking.ts` ·
  `can_join_cadde_cafe` ↔ `canJoinCafeRule`.
- **Ban kill-switch:** `is_cadde_banned` → `has_cadde_feature` içinde; banlı kullanıcının tüm
  cadde yazma RPC'leri tek noktadan kapanır.
- **Ayarlanabilir limitler:** tüm rate limit / kapasite / süre sayıları `cadde_settings`'te
  (telefon flag'i D-03 dahil) — ürün kararı SQL'siz uygulanır.

## Faz 9 — yapılanlar

1. **Migration 013** (`20260611150000`): canlıdan doğrulanmış 7 legacy trigger drop edildi
   (`trg_enforce_cafe_capacity`, `trg_enforce_daily_cafe_join`, `trg_update_cafe_member_count_ins/del`,
   `trg_notify_followers_on_cafe`, `feed_likes_count_trigger`, `update_feed_posts_updated_at`);
   `feed_posts` / `feed_likes` / `cafes` / `cafe_memberships` / `user_follows` tablolarına
   write-revoke (anon+authenticated tüm yetkiler) + tüm RLS policy'leri düşürüldü + açıklayıcı
   COMMENT. **Tablolar DROP EDİLMEDİ** — spec §20.4: en az 1 canary sürüm sonrası ayrı karar
   dokümanı + migration ile. `user_follows` 1 satır taşıyor (R-06 — DROP kararında not düşülecek).
2. **22 dead dosya silindi** (tamamının canlı import'u olmadığı grep ile doğrulandı):
   `pages/Feed.tsx` (1143 satır), `pages/DiasporaPeople.tsx`, `components/feed/*` (4),
   `components/connections/*` (4), `components/CaddeProfileGate.tsx` (eski),
   `components/PhoneVerification.tsx` (eski), `components/NotificationsList.tsx` (eski),
   `components/profiles/ProfileIndividual|ProfileAmbassador|IndividualPublicCard.tsx`,
   `components/profile/IndividualPublicView.tsx` (+testi), `hooks/useCafes|useFeedSocial|
   useConnections|useIsPremium.ts`. (Bozuk `cafeNameModeration` importu — B2 — dosyayla birlikte gitti.)
3. **AdminDatabaseTablesPage:** 5 legacy tablo satırı statik listeden çıkarıldı.

## Kuyruk kapanışı (2026-06-11, migration 014 — `20260611160000`)

Rebuild sonrası kuyruğun bitirilebilir kalemleri kapatıldı:

- ✅ **Otomatik kelime/spam taraması (§18.1):** `cadde_risky_signal` + `cadde_auto_moderation_scan`
  AFTER INSERT trigger'ları (post/yorum/cafe/çarşı ilanı). Yayın ENGELLENMEZ; riskli sinyal
  moderasyon kuyruğuna `auto:` önekiyle düşer (insan kararı esastır). TS blocklist'in
  (`moderateCaddeCafeName`) SQL karşılığıdır — birini güncelleyen diğerini de günceller.
- ✅ **`cadde.carsi.item_contacted`:** ilan detayındaki "profilini ziyaret et" tıklaması
  `record_carsi_contact_v1` ile sahibine bildirim üretir (görüntüleyen+ilan başına 24 saatte 1).
- ✅ **`cadde.cafe.expiring`:** `cadde_notify_expiring_cafes()` hazır — 30 dk içinde bitecek canlı
  cafe'lerin host + onaylı üyelerine tek seferlik bildirim; pg_cron varsa 10 dk'da bir zamanlanır
  (migration pg_cron'suz ortamda hata vermez, notice düşer — zamanlanma durumu canlı çıktıda).
- ✅ **Composer paylaşım hedefi seçici:** post composer'ında açık hedef ülke/şehir seçimi
  (boş = aktif filtredeki ilk seçim).
- ✅ **Panel parity:** ProfilePage'e `CaddeMyContentCard` ("Açık Cafelerim" §13.5 + "Çarşı İlanlarım")
  — public profil YÜZEYİ (directory catalog composer) ayrı iş kaleminde kaldı.
- ✅ **`/admin/cadde/carsi`:** ilan yönetim sayfası (durum filtresi + gizle/yayınla,
  `admin_moderate_cadde_entity_v1` ile audit'li) admin cadde rotalarına eklendi.

## Kalan işler (gerçekten açık)

- **DROP kararı:** legacy 5 tablo için canary gözlemi sonrası ayrı karar dokümanı + migration (R-06 notuyla).
- **B1 types regen:** DENENDİ (2026-06-11) — `.env.local`'daki `SUPABASE_ACCESS_TOKEN` (+backup)
  Management API'de "Unauthorized"; geçerli token gerektiriyor. Token yenilenince:
  `npx supabase gen types typescript --project-id injprdrsklkxgnaiixzh > src/integrations/supabase/types.ts`
  → build doğrula → `cadde-internal.ts`'teki tek izole `db as any` cast'ini kaldır.
- **D-03:** SMS sağlayıcı seçimi (ürün kararı) → OTP Edge Function'ları + flag=true.
- **Public profil yüzeyi:** "Açık Cafe / Etkinlik" alanının directory catalog composer'ına
  bölüm olarak eklenmesi (ayrı subsystem; panel parity tamam).
- **homepage-ai-bar / category-first-screen yüzeyleri:** kodda "AI bar" bileşeni yok —
  placement'lar katalogda hazır, yüzey entegrasyonu o sayfalar yapılınca.
- Playwright persona matrisi (spec §22.4); D-07 premium kademesi; billboard→kampanya migrasyonu (P2);
  pg_cron yoksa cafe.expiring için scheduler kararı.
