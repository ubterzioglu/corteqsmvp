# CADDE 3.0 — DEVİR NOTU (Handoff)

**Tarih:** 2026-06-10 · **Repo:** `c:\temp_private\corteqs\corteqs_fin` (branch: `main`)
**Amaç:** Bu doküman, Cadde 3.0 E2E rebuild çalışmasını başka bir oturumda kaldığı yerden devam ettirmek için yazılmıştır. Tek başına yeterlidir; ek bağlam gerektirmez.

**Ana spec:** `CORTEQS_CADDE_3_0_E2E_REBUILD_SPEC.md` (repo kökünde, 2253 satır — Faz 3+ öncesi ilgili bölümleri oku)
**Faz 0 çıktıları:** `docs/cadde-300/00-inventory.md`, `01-decisions.md`, `02-current-gap-matrix.md`, `03-implementation-plan.md`

---

## 1. DURUM ÖZETİ — NE BİTTİ?

| Faz | Durum | Commit |
|---|---|---|
| **Faz 0** — Inventory + 4 doküman | ✅ TAMAM | `8c4c998` içine süpürüldü (bkz. §6 uyarı) |
| **Faz 1** — `cadde.ts` modülerleştirme, real default, telemetri | ✅ TAMAM | `8c4c998` (impl) + `fc27b26` (testler) |
| **Faz 2** — Actor context + profil kapısı + Köprü policy (RPC+RLS) | ✅ TAMAM | `60c5baf` |
| **Faz 3** — Çoklu geo filtre + interests + ranking | ⬜ **SIRADAKİ** | — |
| Faz 4 Cafe · Faz 5 Çarşı · Faz 6 Tanıtım · Faz 7 bildirim/moderasyon · Faz 8 diaspora · Faz 9 legacy temizlik | ⬜ | — |

Doğrulama durumu (son koşum): **446/446 test geçti**, `npm run build` OK, yeni dosyalar lint-temiz. (Repo genelinde ~451 ÖNCEDEN VAR OLAN lint hatası var — backlog B7, bizim dosyalarla ilgisiz; tam `npm run lint` exit 1 döner, bu NORMALDİR. Kendi dosyalarını hedefli `npx eslint <dosyalar>` ile doğrula.)

---

## 2. MEVCUT DOSYA HARİTASI (Faz 1-2 sonrası)

### Frontend — canonical Cadde katmanı
```text
src/lib/cadde-types.ts        → tüm domain + Row tipleri
src/lib/cadde-api.ts          → public read + kullanıcı mutation'ları (createCaddePost artık RPC çağırır)
src/lib/cadde-admin-api.ts    → admin CRUD (bilinçli ayrı)
src/lib/cadde-schemas.ts      → Zod sınır validasyonları (Türkçe mesajlı) + parseWithUserError
src/lib/cadde-rules.ts        → SQL truth table'ın TS AYNASI + RPC hata kodu→Türkçe mesaj haritası + mapActorContext
src/lib/cadde-format.ts       → parseCaddeFilters (DEFAULT=REAL!) / serializeCaddeFilters / injectSponsoredPlacement
src/lib/cadde-query-keys.ts   → caddeQueryKeys (actorContext, countries, cities, feed, cafes, billboards, sponsor)
src/lib/cadde-demo-data.ts    → demo sabitleri (yalnız mode=demo veya Supabase yapılandırılmamışken)
src/lib/cadde-internal.ts     → db cast (tek izole `as any`, B1 çözülünce kalkacak), resolveCountry/CityIdByName,
                                reportCaddeApiError (console.error + 10sn throttle'lı sonner toast)
src/lib/cadde.ts              → GEÇİCİ re-export barrel (yalnız AdminCaddePage kullanıyor; Faz 2 sonunda silinebilir
                                — AdminCaddePage importunu modüllere çevirip barrel'ı sil)
src/hooks/cadde/useCaddeActorContext.ts → get_cadde_actor_context RPC; hata → fail-open + telemetri
src/components/cadde/CaddeProfileGate.tsx → blur + eksik alan listesi + /profile?tab=settings CTA
src/pages/cadde/CaddePage.tsx → aktif sayfa (gate entegre); App.tsx:55 lazy import bu yola işaret eder
```

### Testler
```text
src/lib/cadde-format.test.ts   → real-default parse, demo round-trip, sponsor injection
src/lib/cadde-schemas.test.ts  → Zod şema sınırları
src/lib/cadde-rules.test.ts    → CKS §7.2 Köprü truth table (10 senaryo) + hata haritası + mapActorContext
src/pages/cadde/CaddePage.test.tsx → 5 test (gate eksik alan, fail-open, ziyaretçi, real default, mode switch)
src/App.cadde-routes.test.tsx  → /cadde route smoke (mock yolu: @/pages/cadde/CaddePage)
```

### Migrations — CANLIYA UYGULANDI + schema_migrations'a kayıtlı
```text
supabase/migrations/20260610180000_cadde300_001_user_verifications.sql
supabase/migrations/20260610181000_cadde300_002_feature_seed.sql
supabase/migrations/20260610182000_cadde300_003_actor_context.sql
supabase/migrations/20260610183000_cadde300_004_post_rpc_rls.sql
```

---

## 3. CANLI DB GERÇEKLİĞİ (proje `injprdrsklkxgnaiixzh`)

### Faz 2 ile eklenen nesneler
- **`user_verifications`** (user_id PK, phone_e164, phone_verified_at, phone_country_code) — telefon doğrulamanın TEK truth source'u. Private: RLS açık + policy YOK + anon/authenticated grant'leri kaldırıldı. Raw `phone` attribute'u ASLA doğrulama sayılmaz.
- **`cadde_settings`** — `'cadde.phone_verification_required' = false` (D-03 stub). SMS sağlayıcı seçilince true yapılacak.
- **19 `cadde.*` feature** `afs_features`'ta (+ mevcut `cadde.access` = 20). `role_features` mapping: 14 temel yetenek → 76 aktif rolün tamamı; `cadde.promotion.*` → Business_/Consultant_/Organization_/Admin_ + User_BloggerVlogger; `cadde.city.highlight_free` → User_CityAmbassador + Admin_; `cadde.moderate` → Admin_*; `cadde.admin` → yalnız Admin_PlatformAdmin + Admin_SuperAdmin. (Event_/Healthcare_/Job_/Marketplace_/Community_ promotion bilinçli KAPALI — ürün kararıyla açılır.)
- **Fonksiyonlar** (hepsi security definer, search_path=public): `cadde_attr_text(uid,key)`, `is_phone_verified(uid)`, `cadde_phone_required()`, `is_tr_resident(uid)`, `is_diaspora_resident(uid)`, `is_cadde_profile_complete(uid)`, `has_cadde_feature(uid,key)`, `can_post_cadde(uid)`, `can_post_kopru(uid)`, `get_cadde_actor_context()` (jsonb döner), `create_cadde_post_v1(p_post_type,p_title,p_body,p_country,p_city,p_is_bridge)` (uuid döner).
- **RLS değişiklikleri:** `cadde_posts` "self insert" policy'si KALDIRILDI (kullanıcı post'u yalnız RPC ile); "cadde posts admin insert" EKLENDİ (eski bug fix: admin panelden post ekleme bugüne kadar RLS'e takılıyordu); posts/cafes/comments/reactions/cafe_members SELECT'leri authenticated'a daraltıldı (D-02). countries/cities/billboard/sponsored public read KALDI.
- **Yeni attribute'lar:** `indiv_relocating`, `digital_community_enabled` (boolean, `afs_attributes`; değerler `user_profile_attributes.value_text` içinde 'true'/'false').

### Köprü truth table (SQL `can_post_kopru` ↔ `cadde-rules.ts` BİREBİR senkron tutulmalı!)
```text
admin/moderator                          → her zaman TRUE
profil eksik VEYA cadde.bridge.post yok  → FALSE
diaspora yerleşik                        → TRUE
TR bireysel (User_Standard/DiasporaMember/Contributor) → indiv_relocating='true' ise
TR diğer tüm roller (elçi+blogger dahil) → digital_community_enabled='true' ise
```
Ek kural (create_cadde_post_v1 içinde): TR yerleşik + bridge DEĞİL → hedef ülke code='TR' olmalı (`cadde_tr_scope_restricted`).

### Önemli mevcut durum bilgileri (Faz 0 envanterinden)
- Cadde içeriği canlıda hâlâ %100 demo seed (3 post, 2 cafe) — gerçek kullanıcı içeriği 0. Şema değişikliği serbestliği yüksek.
- Legacy `feed_posts/cafes/cafe_memberships` tabloları canlıda ama BOŞ; backfill GEREKMİYOR (Faz 9 sadece temizlik).
- `geo_countries`(251)/`geo_cities`(76.990) ↔ `cadde_countries`(5)/`cadde_cities`(6) — FK yok, ayrı dünyalar (D-04, Faz 3'te sync).
- `notifications` tablosu var (0 satır, realtime açık) — Faz 7'de genişletilecek, YENİ tablo açma (R-03).
- Legacy `Feed.tsx` hattı (1143 satır + ~14 bağlı dosya) tamamen route'suz dead code → FREEZE; listesi `00-inventory.md` §11/6.

---

## 4. DB ERİŞİMİ (bu makinede Docker YOK)

- `supabase db push/reset/dump` ÇALIŞMAZ. Migration'lar canlıya **psql** ile uygulanır + `supabase_migrations.schema_migrations`'a manuel INSERT (version, name).
- Bağlantı: host `aws-1-eu-west-2.pooler.supabase.com`, port 5432, user `postgres.injprdrsklkxgnaiixzh`, db `postgres`. Şifre: `.env.local` → `SUPABASE_DB_PASSWORD` (PGPASSWORD env'e koy, ekrana yazdırma). `$env:PGCLIENTENCODING='UTF8'` ayarla (Türkçe içerik için).
- Örnek uygulama komutu (PowerShell):
```powershell
$pw = ((Select-String -Path .env.local -Pattern '^SUPABASE_DB_PASSWORD=(.+)$').Matches[0].Groups[1].Value)
$env:PGPASSWORD = $pw; $env:PGCLIENTENCODING = 'UTF8'
psql -h aws-1-eu-west-2.pooler.supabase.com -p 5432 -U postgres.injprdrsklkxgnaiixzh -d postgres -X -v ON_ERROR_STOP=1 -f "supabase\migrations\<dosya>.sql"
```
- Canlıdaki son migration: `20260610183000`. Yeni migration'lar `20260610184000`+ veya sonraki gün timestamp'i ile (çakışma kontrolü yap: hem repo dosyaları hem `select max(version) from supabase_migrations.schema_migrations`).
- `supabase gen types --project-id injprdrsklkxgnaiixzh` Docker'sız çalışır (types.ts güncelleme — B1 backlog, bilerek henüz yapılmadı).

---

## 5. SIRADAKİ İŞ: FAZ 3 — Filtre, İlgi Alanları, Ranking

Plan: `docs/cadde-300/03-implementation-plan.md` "Faz 3" bölümü + spec §11 (CKS band/skor) ve §12.

1. **Migration'lar:**
   - `cadde_interest_catalog` (13 seed: networking, new_arrival, family_children, career, entrepreneurship, education, technology, arts_culture, sports, food, travel, volunteering, mentorship) + `user_cadde_interests` + `cadde_post_interests` (şemalar spec §9.6'da hazır).
   - `cadde_posts`'a: `need_category text`, `engagement_score numeric default 0`, `published_at timestamptz` (+ updated_at touch trigger değil, RPC'de set).
   - D-04: `cadde_countries/cities`'e `geo_country_id`/`geo_city_id` kolonu + geo_*'dan kontrollü genişletme sync'i (mevcut FK'leri BOZMA).
   - `list_cadde_feed_v1(filters jsonb, cursor)` RPC: band A-F (spec §11.1) + skor (§11.2 ağırlıkları) + deterministik random `hash(post_id || current_date || viewer_scope)` (ASLA `order by random()`) + stabil cursor pagination.
2. **Frontend:** `MultiCountryCityFilter` (legacy `src/components/feed/MultiCountryCityFilter.tsx`'ten UX port et — dosyaya DOKUNMA, kopyala/yeniden yaz; `useIsPremium` bağımlılığını TAŞIMA), çoklu seçim + URL state + alfabetik şehir; profil "Bireysel İlgi Alanlarım" bölümü; composer'da 1-3 etiket seçimi; `cadde-ranking.ts` + `cadde-targeting.ts` TS aynaları + testler.
3. **Kabul:** aynı şehir ihtiyacı üstte; pagination tekrar/kayıp üretmez; gün içi random stabil.

---

## 6. KRİTİK UYARILAR VE KURALLAR

1. ⚠️ **EŞZAMANLI OTURUMLAR:** Bu repoda aynı anda başka Claude oturumları çalışıyor ve "clean code" mesajıyla `git add -A` commit atıyorlar (örn. `8c4c998`, `9706932`). **Commit'lenmemiş iş bırakma; her mantıksal adımda KENDİ dosyalarını hedefli `git add <dosyalar>` ile commit'le.** Push'a karışma.
2. **Spec kısıtları (değişmez):** Legacy `Feed.tsx` hattına feature ekleme; yeni rol ailesi/ikinci permission sistemi yok (flat AFS + `role_features` + `user_feature_overrides`); yeni component'te direct Supabase mutation yok (lib/*-api + React Query + RPC); kalıcı dual-write yok; eski migration silme/sıralama yok; `/cadde` SEO rotası ve Türkçe domain terimleri (muhasebe, cadde, çarşı, köprü...) değişmez; `src/components/ui/*` ve `src/integrations/supabase/client.ts` elle düzenlenmez; yeni kodda auth importu `@/components/auth/useAuth` (shim `@/contexts/AuthContext` KULLANMA).
3. **Senkron sözleşmesi:** `public.can_post_kopru` (SQL) ↔ `canPostKopruRule` (`src/lib/cadde-rules.ts`) birebir aynı kalmalı — birini değiştiren diğerini de günceller.
4. **Hata politikası:** Sessiz catch YOK. Okumalarda `reportCaddeApiError(context, error)` + boş sonuç (real modda ASLA demo'ya düşme); RPC hatalarında `resolveCaddeRpcErrorMessage` ile Türkçe mesaj. Yeni RPC hata kodları eklersen `cadde-rules.ts` haritasına da ekle.
5. **Çarşı ≠ Çıfıt/Tanıtım:** marketplace (`carsi_*`) ile sponsorlu görünürlük (`cadde_promotion_*`) asla aynı tablo/panel altında birleşmez (D-01).
6. **Doğrulama komutları:** `npm run test` (446+ geçmeli), `npm run build`, `npx eslint <değişen dosyalar>` (tam lint'in 451 eski hatası bilinen durum). Tek test: `npm run test -- src/lib/cadde-rules.test.ts`.
7. **Her faz sonunda:** `docs/cadde-300/02-current-gap-matrix.md` ilgili satırlarını ve `01-decisions.md`'deki karar durumlarını güncelle; conventional commit + trailer'larla (Constraint/Rejected/Confidence/Scope-risk/Directive/Not-tested) commit at.

## 7. AÇIK KARARLAR (ürün sahibine sorulabilir)

- **D-03 devamı:** SMS sağlayıcı hâlâ seçilmedi (stub aktif, flag kapalı). Seçilince: `send-phone-otp`/`verify-phone-otp` Edge Function + profil ayarlarına yeni PhoneVerificationCard + `cadde_settings` flag=true. (Eski `src/components/PhoneVerification.tsx` dead+bozuk, KULLANMA.)
- D-01 Çıfıt marka adı (UI'da "Tanıtım" önerisi) — Faz 6 öncesi.
- D-06 cafe günlük katılım limiti sayıları — Faz 4'te RPC rate-limit olarak.
- R-01 demo seed'in prod'daki kaderi — Faz 9.
- R-04 CKS v2 dokümanı hâlâ repoda yok.
