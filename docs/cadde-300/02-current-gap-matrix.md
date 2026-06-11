# Cadde 3.0 — Mevcut Durum / Hedef Gap Matrisi

**Tarih:** 2026-06-10 · Spec §2.5 matrisinin envanterle doğrulanmış hali.
Her satırda "Kanıt" kolonu repo dosya:satır veya canlı DB sorgusuna (2026-06-10) işaret eder.

| Konu | Mevcut durum (doğrulanmış) | Kanıt | Hedef durum | Öncelik |
|---|---|---|---|---|
| Canonical frontend | `CaddePage.tsx` aktif, 599 satır, canonical auth + React Query | `App.tsx:173-177`, `CaddePage.tsx:6` | Aynı hat modülerize: `pages/cadde/` + `components/cadde/` + `hooks/cadde/` | P0 |
| Canonical API | Tek dosya `cadde.ts` 877 satır; 25 export; public+mutation+admin karışık; **0 RPC** | `cadde.ts` (from() çağrıları satır 495-960) | `cadde-api` / `cadde-admin-api` / `cadde-rules` / `cadde-ranking` / `cadde-schemas` / `cadde-types` / `cadde-query-keys` | P0 |
| Legacy hat | Feed.tsx (1143 satır) + 10+ bağımlı dosya **tamamı route'suz dead code**; bozuk import (`cafeNameModeration`) | `00-inventory.md` §3 | Freeze → (backfill GEREKMİYOR) → soft-decommission | P0 |
| Legacy veri | feed_posts/feed_likes/cafes/cafe_memberships **0 satır**; user_follows 1 | Canlı DB sorgusu | Write-revoke + COMMENT + drop kararı | P0 (basitleşti) |
| Profil kapısı | ✅ Faz 2'de eklendi: `components/cadde/CaddeProfileGate` + `useCaddeActorContext` aktif `/cadde`'de (blur + eksik alan listesi + CTA) | `src/components/cadde/CaddeProfileGate.tsx` | — | TAMAM |
| Profil tamamlanma kriteri | Canonical auth yalnız `full_name` ile onboarding tamam sayıyor | `AuthProvider.tsx:30` | `useCaddeActorContext`: ülke + şehir + telefon doğrulama ayrı hesap | P0 |
| Telefon doğrulama | 🟡 Altyapı kuruldu (Faz 2): `user_verifications` truth source + `is_phone_verified()` canlıda; zorunluluk flag'i KAPALI (D-03 stub). OTP Edge Function'ları sağlayıcı kararını bekliyor | mig `20260610180000/182000` | OTP Edge Functions + flag açma | P1 (sağlayıcı kararı) |
| Köprü paylaşım yetkisi | ✅ Faz 2'de enforce edildi: `can_post_kopru()` (indiv_relocating / digital_community_enabled attribute'ları) + `create_cadde_post_v1` + TS truth-table testleri | mig `20260610182000/183000`, `cadde-rules.test.ts` | — | TAMAM |
| Mutation güvenliği | 🟡 Post INSERT yalnız RPC (direct insert policy kaldırıldı, admin insert policy eklendi — eski admin insert bug'ı da düzeldi). Yorum/reaksiyon/cafe-join hâlâ direct insert | mig `20260610183000` | Kalan mutation'lar Faz 3-4'te RPC'ye | P1 |
| Ülke/şehir filtresi | ✅ Faz 3'te eklendi: `CaddeGeoFilter` (çoklu seçim + arama + chip + alfabetik tr sıralama), URL state virgülle çoklu değer (eski tekil URL'ler geriye uyumlu) | `src/components/cadde/CaddeGeoFilter.tsx`, `cadde-format.ts` | — | TAMAM |
| Geo veri tabanı | 🟡 Faz 3 (D-04): `cadde_countries.geo_country_id` / `cadde_cities.geo_city_id` link kolonları + backfill + `admin_import_cadde_geo_v1` kontrollü genişletme RPC'si; tam konsolidasyon bilinçli P2 | mig `20260610185000` | Admin genişletme UI'ı (P2) | TAMAM (P0/P1 kapsamı) |
| Çarşı | Hiçbir carsi dosyası/tablosu yok | grep `carsi` = 0 kaynak dosya | `carsi_items`+`carsi_categories`, ticker, rotalar, admin | P0/P1 |
| Cafe | ✅ Faz 4'te eklendi: tek `CreateCafeForm` (tema/davet kodu hash/soru/kapasite/süre), entry policy `can_join_cadde_cafe` (§7.3) + `create/join/approve/archive_cadde_cafe_v1` RPC'leri, `/cadde/cafe/:cafeId` detay (composer + cafe feed + owner onay paneli + read-only arşiv), `cadde_posts.cafe_id/visibility` | mig `20260611100000`, `CaddeCafePage.tsx`, `components/cadde/CreateCafeForm.tsx` | Profil parity ("Açık Cafe" public profilde, §13.5) + D-06 limit sayılarının ürün onayı | TAMAM (çekirdek) |
| Reklam | Statik billboard + tek inline sponsor; kampanya/onay/telemetri yok | `cadde.ts:743-810`, tablolar | `cadde_promotion_*` kampanya katmanı + placement + impression/click | P1 |
| Çıfıt adı | Kodda hiç geçmiyor (yalnız legacy UI metniydi) | grep | UI "Tanıtım" önerisi (D-01) | P0 karar |
| İlgi alanları | ✅ Faz 3'te eklendi: `cadde_interest_catalog` (13 seed) + `user_cadde_interests` + `cadde_post_interests`; profil "Bireysel İlgi Alanlarım" kartı; composer 1-3 etiket (ilki need_category); `create_cadde_post_v1` etiket validasyonlu | mig `20260610184000`, `CaddeInterestsCard.tsx`, `cadde-targeting.ts` | P1 kelime-eşleme önerisi (spec §12.2 P1) | TAMAM (P0 kapsamı) |
| Ranking | ✅ Faz 3'te eklendi: `list_cadde_feed_v1` RPC — band A-F + skor (§11.2 ağırlıkları) + `hashtext(post_id||date||scope)` deterministik random + keyset cursor; engagement_score reaksiyon/yorum trigger'larıyla ölçülüyor; TS aynası `cadde-ranking.ts` + pagination tekrar/kayıp testleri | mig `20260610186000`, `cadde-ranking.test.ts` | — | TAMAM |
| Bildirim | `notifications` tablosu var (0 satır, realtime açık) ama producer yalnız legacy trigger; bell UI dead; gevşek insert policy | mig `20260326112832:37-46,80`, `NotificationsList.tsx` | Tabloyu genişlet (R-03), producer RPC'ler, `NotificationsBell`, Realtime | P1 |
| Çoklu diaspora | `DiasporaContext` var (tr/in/cn/ph) ama Cadde sorgularına bağlı değil; tablolarda `diaspora_key` yok | `DiasporaContext.tsx:12,53` | `diaspora_key` kolonları + context bağlantısı + filtreler | P1/P2 |
| Premium | `useIsPremium`: admin=premium demo mantığı (dead) | `useIsPremium.ts:16` | Feature-bazlı entitlement (D-07) | P1 |
| Moderasyon | Admin CRUD var (hide=status); queue/report/ban/audit/rate-limit yok | `AdminCaddePage.tsx` | `cadde_post_reports` + `cadde_moderation_queue` + `cadde_user_bans` + panel | P0/P1 |
| Hata görünürlüğü | 6 sessiz catch demo/boş veriye düşüyor; telemetri yok | `cadde.ts:498,517,589,705,773,809` | Telemetri + kullanıcı dostu hata + etiketli fallback | P0 |
| Demo default | `?mode` yokken **demo** açılıyor; feed %100 demo seed | `cadde.ts:463`; canlı DB (3 demo post) | Production default `real` (R-01) | P0 |
| Feature anahtarları | ✅ Faz 2'de 19 granular `cadde.*` anahtarı seed edildi; mapping: 14 temel → tüm roller, promotion → Business/Consultant/Organization/Admin+Blogger, highlight → CityAmbassador, moderate/admin → Admin rolleri | mig `20260610181000` | — | TAMAM |
| Admin alanı | Tek `AdminCaddePage` 736 satır | dosya | `/admin/cadde/*` alt rotalar + dashboard + moderation + settings | P1 |
| Test | İnce kapsam: 3 dosya vardı (`cadde.test.ts` format helper'ları, `CaddePage.test.tsx` 2 senaryo, `App.cadde-routes.test.tsx` route smoke); Faz 1'de modül bazlı yeniden düzenlendi (`cadde-format.test.ts`, `cadde-schemas.test.ts`, `pages/cadde/CaddePage.test.tsx`) | dosyalar | + RLS integration + Playwright persona matrisi | P0/P1 |

## Hedefe göre eksik DB nesneleri (özet)

- **Tablolar:** `user_verifications`, `carsi_items`, `carsi_categories`, `cadde_interest_catalog`, `user_cadde_interests`, `cadde_post_interests`, `cadde_promotion_campaigns/placements/events`, `cadde_post_reports`, `cadde_moderation_queue`, `cadde_user_bans`.
- **Kolonlar:** `cadde_posts` → diaspora_key, cafe_id, image_urls, need_category, visibility, moderation_status, engagement_score, published_at, updated_at(touch), deleted_at; `cadde_cafes` → diaspora_key, slug, theme_key, entry_mode, referral_code_hash, entry_question, capacity, archived_at; `cadde_cafe_members` → status, answer, approved_at, approved_by; `notifications` → actor_user_id, entity_type, payload.
- **RPC'ler:** spec §10.1 listesinin tamamı (`get_cadde_actor_context` … `admin_moderate_cadde_entity_v1`) — bugün 0'ı mevcut.
- **Helper'lar:** spec §10.2 listesinin tamamı — bugün yalnız `is_admin`/`is_admin_user`/`is_moderator` mevcut.
