# Cadde 3.0 — Karar Kaydı (Decisions)

**Tarih:** 2026-06-10 · **Dayanak:** `00-inventory.md` (doğrulanmış envanter) + spec §26
**Statü etiketleri:** ✅ karar verildi · 🟡 öneri var, ürün onayı bekliyor · 🔴 bloklayıcı ürün kararı

---

## A. Mimari ana kararlar (spec ile sabitlendi — ✅)

| # | Karar |
|---|---|
| A-01 | **Canonical hat:** `src/pages/CaddePage.tsx` + yeni `src/lib/cadde-*` modülleri + `cadde_*` tabloları. Legacy `Feed.tsx` hattına yeni feature eklenmez. |
| A-02 | **Tek permission sistemi:** flat AFS rolleri + `afs_features` + `role_features` + `user_feature_overrides` + `get_current_user_features()`. Yeni rol ailesi / parent role / ikinci profil tablosu kurulmaz. Persona string'i (`accountType`) ile yetki verilmez. |
| A-03 | **Mutation'lar RPC üzerinden:** yeni component'te doğrudan `supabase.from()` mutation yazılmaz; `lib/*-api.ts` + React Query + security-definer RPC + RLS zinciri. |
| A-04 | **Migration disiplini:** eski migration silinmez/sıralanmaz; yalnız yeni eklenir; prod'da ilk fazda tablo drop yok; types `supabase gen types` ile yeniden üretilir, elle düzenlenmez. |
| A-05 | **Kalıcı dual-write yasak.** Envanter sonucu (legacy veri 0) geçici köprüye bile gerek bırakmadı. |
| A-06 | **SEO rotası `/cadde` ve Türkçe domain terimleri değişmez.** `src/components/ui/*` elle düzenlenmez. |
| A-07 | **Auth importu:** yeni kod `@/components/auth/useAuth` kullanır; `@/contexts/AuthContext` shim'inden yeni import açılmaz. |

---

## B. Spec §26 kararları (D-01 … D-10)

### D-01 — Çıfıt adı kullanılacak mı? 🟡
- **Durum:** Repoda `carsi`/`çıfıt` geçen hiçbir kaynak dosya yok; "ÇIFIT" yalnız legacy Feed.tsx sağ kolon metinlerindeydi.
- **Öneri:** Kod ve tablo adlarında nötr `promotion` (`cadde_promotion_*`), UI'da **"Tanıtım"**. "Çıfıt" istenirse sonradan salt görünür-metin (i18n) değişikliğiyle eklenir.
- **Sözleşme (kesin):** Çarşı (U2U marketplace) ile Tanıtım/Çıfıt (sponsorlu görünürlük) **asla aynı tablo/panel altında birleşmez**.

### D-02 — Anonim kullanıcı gerçek feed okuyabilir mi? 🟡
- **Durum:** Bugün `/cadde` zaten `RequireAuth` arkasında; anonim hiç giremiyor.
- **Öneri:** MVP'de login zorunlu kalsın (mevcut davranış). Landing/demo ihtiyacı ayrı bir public demo görünümle çözülür. RLS public-read'leri Faz 2'de "authenticated"e daraltılır.

### D-03 — Telefon doğrulama truth source 🔴 (Faz 2 blokeri)
- **Durum (kanıtlı):** Truth source YOK — `phone_verified=true` 0 kullanıcı, `auth.users.phone_confirmed_at` 0, OTP function'ları repoda yok, PhoneVerification.tsx dead+bozuk.
- **Karar gerekli:** SMS/OTP sağlayıcısı (Twilio / Vonage / Supabase Auth phone provider / e-posta-fallback'li demo). Maliyet + KVKK değerlendirmesi ürün sorumlusunda.
- **Teknik plan (sağlayıcıdan bağımsız):** `public.user_verifications(user_id pk, phone_e164, phone_verified_at, phone_country_code, updated_at)` — private tablo, RLS kapalı dışa, okuma yalnız `get_cadde_actor_context()` RPC'sinden boolean olarak. `send-phone-otp`/`verify-phone-otp` Edge Function'ları yeniden yazılır. Raw `phone` attribute'u asla doğrulama sayılmaz; `phone_verified` AFS attribute'u görüntü/uyumluluk amaçlı kalabilir ama karar mercii `user_verifications`'tır.
- **Faz 2 öncesi ek kontrol:** canlı projede eski `send-phone-otp` function'ı deploy'lu mu (`supabase functions list`) — varsa kaldırılma kararı.

### D-04 — `cadde_countries/cities` ↔ `geo_countries/cities` 🟡
- **Durum (kanıtlı):** geo_* = 251 ülke / 76.990 şehir; cadde_* = 5 ülke / 6 şehir; arada FK yok; tüm cadde tabloları cadde_* mini-dünyasına bağlı.
- **Öneri:** P0/Faz 1-2'de FK'lere dokunulmaz (mevcut feed bozulmaz). Faz 3 (filtre genişletme) ile birlikte: `cadde_countries/cities`'e `geo_country_id`/`geo_city_id` referans kolonu ekle + geo_*'dan kontrollü genişletme (sync script). Uzun vadede tek truth source geo_*; tam konsolidasyon ayrı karar dokümanıyla.

### D-05 — Eski `feed_posts`/`cafes` verisi var mı? ✅ ÇÖZÜLDÜ
- **Sonuç:** Veri yok (0/0/0/0; user_follows 1). **Backfill iptal.** Faz 9 = write-revoke → COMMENT → canary → ayrı drop kararı.

### D-06 — Cafe günlük katılım limiti / kapasite korunacak mı? 🟡
- **Durum:** Legacy `trg_enforce_daily_cafe_join` + `trg_enforce_cafe_capacity` trigger'ları hâlâ canlıda ama yalnız boş legacy tablolarda.
- **Öneri:** Trigger'lar otomatik taşınmaz. Kapasite: `cadde_cafes.capacity` kolonu + `join_cadde_cafe_v1` RPC içinde kontrol (CKS uyumlu). Günlük katılım limiti: ürün kararıyla sayı belirlenirse RPC içinde rate-limit olarak uygulanır; trigger yazılmaz.

### D-07 — Premium altyapısı 🟡
- **Durum:** `useIsPremium` = `accountType === "admin"` demo mantığı (dead code'da).
- **Öneri:** Bu mantık üretime taşınmaz. Faz 5 (Çarşı ilan limiti) basit entitlement çözümlemesiyle başlar: limitler `afs_features` üzerinden (`cadde.carsi.limit_high` benzeri feature veya role_features metadata). Gerçek abonelik (Stripe/Paddle) ayrı proje; Cadde 3.0 kapsamı dışı.

### D-08 — AI tema matching ✅
- P0: kullanıcı 1-3 manuel etiket; P1: kelime-eşleme önerisi; P2: AI önerisi (asla otomatik/geri-döndürülemez karar değil). Spec §12 ile aynı.

### D-09 — Juke Box / Post-it ✅
- CKS maddesi yazılmadan P0/P1 scope'una girmez → P2 backlog (`03-implementation-plan.md` sonunda).

### D-10 — Public profile toggle 🟡
- **Öneri:** Global AFS attribute olarak çözülür (`afs_attributes`'a `profile_public` benzeri anahtar; `upa.visibility` public/private mevcut altyapısıyla uyumlu). Cadde post attribution (yazar adının görünmesi) bu attribute'a uyar. Faz 2'de `get_cadde_actor_context()` dönüşüne `profilePublic` eklenir.

---

## C. Repo-spesifik kararlar (envanterin ortaya çıkardıkları)

### R-01 — Demo default ve demo seed'in kaderi 🟡
- **Durum:** `/cadde` default'u `demo` (`cadde.ts:463`); canlı feed %100 demo seed (3 post, 2 cafe); 6 sessiz catch hata durumunda sessizce demo/boş veriye düşüyor.
- **Öneri:** Faz 1'de default `real` olur, demo yalnız `?mode=demo` ile açılır; sessiz catch'ler telemetri + kullanıcı dostu hata + **açık etiketli** fallback'e çevrilir. Demo seed satırları kalabilir (content_mode='demo' filtreli olduğundan zararsız), ancak Faz 9'da prod'dan temizlenme kararı verilir.

### R-02 — `cadde.access` tüm rollere açık 🟡
- **Durum:** 2026-06-03 seed'i `cadde.access`'i tüm aktif rollere `true` vermiş → her login üye Cadde'ye girebiliyor; profil/telefon kapısı yok.
- **Öneri:** `cadde.access` herkese açık kalabilir (sayfaya giriş), ancak **mutation yetkileri** Faz 2'de eklenecek granular anahtarlara bağlanır (`cadde.post.create`, `cadde.bridge.post`, `cadde.cafe.create`, `cadde.carsi.create`, `cadde.promotion.create`, `cadde.moderate`, `cadde.admin` …). Spec §5.1'deki 19 anahtarın role-mapping matrisi Faz 2 migration'ında açıkça seed edilir (76 flat rol × feature tablosu PR'da gösterilir).

### R-03 — Notifications: mevcut tablo mu, yeni şema mı? 🟡
- **Durum:** `notifications` tablosu var (user_id/type/title/message/related_id/is_read), realtime'a ekli, 0 satır; spec şeması daha zengin (actor/event_type/entity/payload).
- **Öneri:** **Yeni tablo açılmaz.** Mevcut tablo Faz 7'de `alter table add column if not exists` ile genişletilir (actor_user_id, entity_type, payload jsonb), `"System can insert" WITH CHECK(true)` policy'si kaldırılıp insert yalnız security-definer producer fonksiyonlarına verilir. Veri 0 olduğu için migration risksiz.

### R-04 — CKS v2 dokümanı repoda yok 🟡
- **Öneri:** CKS v2, `docs/cadde-300/cks-v2.md` olarak repoya alınmalı (kaynak öncelik sırasında 5. sırada referans veriliyor ama denetlenebilir kopyası yok). Ürün sorumlusundan güncel metin istenir; spec ile çelişen eski teknik adlar (user_roles, has_role) çeviri notuyla işaretlenir.

### R-05 — Bozuk import temizliği ✅
- `CreateCafeForm.tsx:22 → @/lib/cafeNameModeration` (dosya yok). Dosya freeze listesinde olduğundan Faz 1'de dokunulmaz; Faz 4'te canonical `cadde-rules.ts` içine isim moderasyonu yazılır, Faz 9'da legacy dosya silinince bozuk import da gider. (Feed.tsx zinciri bundle'a girmediği için bugün build'i etkilemiyor.)

### R-06 — `user_follows` (1 satır) ✅
- Takip/connect özellikleri Cadde 3.0 P1 bildirim fazına girdiğinde canonical şemayla yeniden tasarlanır; 1 satırlık veri taşınmaz (sahibine not düşülerek drop kararına dahil edilir).

---

## D. Karar özet tablosu

| ID | Konu | Statü | Faz etkisi |
|---|---|---|---|
| D-01 | Çıfıt/Tanıtım adı | 🟡 öneri: UI "Tanıtım" | Faz 6 öncesi |
| D-02 | Anonim erişim | 🟡 öneri: login zorunlu | Faz 2 |
| D-03 | SMS/OTP sağlayıcı | 🔴 **bloklayıcı** | Faz 2 başlamadan |
| D-04 | cadde↔geo konsolidasyon | 🟡 P1 sync planı | Faz 3 |
| D-05 | Legacy backfill | ✅ gerekmez | Faz 9 basitleşti |
| D-06 | Cafe limitleri | 🟡 RPC'de, trigger'sız | Faz 4 |
| D-07 | Premium | 🟡 feature-bazlı limit | Faz 5 |
| D-08 | AI tema | ✅ P0 manuel → P2 AI | Faz 6 |
| D-09 | Juke Box/Post-it | ✅ P2 backlog | — |
| D-10 | Public profile toggle | 🟡 global AFS attr | Faz 2 |
| R-01 | Demo default/seed | 🟡 Faz 1'de real default | Faz 1 |
| R-02 | cadde.access genişliği | 🟡 granular anahtarlar | Faz 2 |
| R-03 | Notifications şeması | 🟡 mevcut tabloyu genişlet | Faz 7 |
| R-04 | CKS repoya alınması | 🟡 ürün sorumlusundan | Faz 1 öncesi ideal |
| R-05 | cafeNameModeration | ✅ Faz 4 yeni / Faz 9 temizlik | Faz 4/9 |
| R-06 | user_follows 1 satır | ✅ taşınmaz | Faz 9 |
