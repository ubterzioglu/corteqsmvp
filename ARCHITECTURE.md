# CorteQS — Sistem Mimarisi (Tek Ana Doküman)

> **Bu, projenin TEK bakımlı mimari dokümanıdır.** Mimari bir karar değiştiğinde burası güncellenir.
> Eski mimari dokümanlar `docs/archive/architecture/` altında dondurulmuştur (AI_TECHNICAL_REFERENCE,
> SISTEM_MIMARI, PROJECT_TECHNICAL_OVERVIEW vb. — tarihsel referans, bakımı yapılmaz).
> **Güncelleme:** 2026-06-11 · Cadde 3.0 E2E rebuild (Faz 0–9 + kuyruk) ve kök temizliği sonrası.
>
> Hızlı bağlam için: `AGENT_CONTEXT.md` · Kurallar: `CLAUDE.md` · Durum panosu: `rapor.html` · Doc indeksi: `docs/README.md`

---

## 1. Genel Bakış

**CorteQS** — Türk diasporası topluluk platformu. Tek SPA içinde: kurumsal landing, üye dizini +
katalog, **Cadde** (sosyal akış + Cafe + Çarşı + Tanıtım), anketler, muhasebe, workspace ve admin paneli.

```
React 18 + Vite 5 (SWC)  ·  TypeScript (strict KAPALI — bilinçli)  ·  Tailwind + shadcn/ui
@tanstack/react-query 5  ·  react-router-dom 6  ·  zod + react-hook-form
Supabase: Postgres + RLS + security-definer RPC'ler + Auth + Realtime + 5 Edge Function
Deploy: Docker/Coolify → npm run build → node server.mjs (env injection + RAG proxy + SPA fallback)
Canlı: mvp.corteqs.net · Supabase proje: injprdrsklkxgnaiixzh
```

**Temel mimari ilke:** Kural DB'de yaşar. Yazma işlemleri security-definer RPC'lerden geçer,
RLS okumayı sınırlar; frontend yalnız yol gösterir (Zod ilk hat, Türkçe hata mesajları).

---

## 2. Frontend Mimarisi

### 2.1 Route ağacı

- `src/App.tsx` — tüm public + cadde rotaları (~75 `lazy()` ile code-split, ~300 satır).
- `src/pages/admin/routes.tsx` — `/admin` alt ağacının tamamı (AdminLayout + RequireAuth).
- Modül alt ağaçları **routes.tsx deseniyle** ayrışır: `pages/admin/muhasebe/routes.tsx` (referans),
  `pages/admin/cadde/routes.tsx` (cadde admin: index/promotions/moderation/carsi).
- **SEO kilitli path'ler değiştirilemez:** `/lansman`, `/cadde` (+alt rotaları), `/19051919`,
  `/anket`, `/commercial/<slug>`, `/founders`, `/directory`, `/iletisim`.
- `vite.config.ts` kökteki `info-*.html` dosyalarını `dist/commercial/<slug>/` altına emit eder;
  `lansman/index.html` ayrı build input'tur. **Bu mantığa ve kök info-*.html dosyalarına dokunma.**

### 2.2 Katmanlama (feature başına)

```
lib/<modul>-api.ts        → Supabase okuma + RPC mutation sarmalayıcıları
lib/<modul>-schemas.ts    → Zod sınır doğrulaması (Türkçe mesajlı)
lib/<modul>-types.ts      → Row + domain tipleri
lib/<modul>-query-keys.ts → React Query anahtar fabrikaları (prefix-invalidation kökleri)
components/<modul>/       → UI kapsülü     pages/<modul>/ → sayfalar (+routes.tsx)
```
Referans uygulamalar: `muhasebe-*` (ilk örnek) ve `cadde-*` (en kapsamlı/güncel örnek).
Yeni kodda component içi `supabase.from()` YOK — `*-api.ts` + React Query.

### 2.3 Auth

- Canonical: `src/components/auth/` (AuthProvider, `useAuth`, RequireAuth, RequireFeature).
  Yeni kod **yalnız** `@/components/auth/useAuth` import eder.
- `src/contexts/AuthContext.tsx` geriye-uyum shim'idir (canonical'a delege; ~39 eski import) — B5'te kalkacak.
- Yetki zinciri: Supabase Auth → session context → `RequireAuth` (route) → `RequireFeature`/
  `useFeatureFlags` (feature) → DB'de `is_admin()`/`is_moderator()`/`has_cadde_feature()`.

---

## 3. Kimlik, Rol ve AFS Modeli (canlı 2026-06-09)

Tek sistem; legacy `profiles`/`user_profiles`/`admin_users`/`role_feature_defaults` DROP edildi.

```
auth.users → user_role_assignments (user↔rol, TEK yer) → roles (76 FLAT rol; aile/parent YOK)
user_profile_attributes  → tüm profil verisi attribute olarak (afs_attributes sözlüğü, 53)
user_feature_overrides   → kullanıcı bazlı feature istisnası
AFS kuralları: role_attributes / role_features / role_sections  (afs_features 42, afs_sections 7)
Feature çözümleme: override > role_features default > false   (cadde tarafında + ban kill-switch)
```

**Katalog:** `catalog_items` (+roles/+attribute_values/+claims/+managers + ~15 uydu tablo) —
item-type/`*_details` sistemi kaldırıldı. Claim akışı: submit RPC → admin onay → manager kaydı.
Detay raporlar: `docs/catalog-role-afs-rebuild/`.

---

## 4. Cadde 3.0 (E2E rebuild — canlı 2026-06-11)

Şehir bazlı diaspora sosyal platformu. 6 alt modül, ~30 RPC, 14 migration (`cadde300_001–014`,
canlı son sürüm `20260611160000`). Kapanış raporu: `docs/cadde-300/change-report.md`.

### 4.1 Modüller

| Modül | Özet |
|---|---|
| **Profil kapısı** | `get_cadde_actor_context()` tek RPC; ülke+şehir (+flag açıksa telefon) eksikse blur + CTA. Fail-open UI, enforce DB'de. |
| **Feed + ranking** | `list_cadde_feed_v1`: CKS band A–F + skor + `hashtext` deterministik random + keyset cursor. Çoklu geo filtre URL'de (`?country=A,B`). İlgi alanları (13'lük katalog) band-A eşleşmesini besler. "Yeni post" chip'i (60 sn sayım; stream yok). |
| **Köprü** | TR↔diaspora ortak akışı. Truth table: diaspora=serbest; TR bireysel=`indiv_relocating`; TR kurumsal=`digital_community_enabled`; admin override. TR yerleşik normal Cadde'de yalnız @Türkiye'ye paylaşır. |
| **Cafe** | Süreli odalar (1–6 saat): entry_mode `open/approval/referral` (kod sha256 hash), kapasite, üye onay paneli, read-only arşiv, cafe-içi feed (`visibility='cafe'` — ana akışa sızmaz), kapanış-yaklaşıyor bildirimi (pg_cron `*/10`). |
| **Çarşı** | U2U pazar: 7 kategori, 30 gün ilan ömrü, aktif ilan limiti (ayarlardan), pasife al/yayına al/sil, "ilanınla ilgilenildi" bildirimi. **Tanıtım'dan tamamen ayrı (D-01).** |
| **Tanıtım** | Sponsorlu görünürlük: kampanya (pending→admin onayı→tarih aralığında yayın), 6 placement, zorunlu "Sponsorlu" rozeti, 4 organik postta 1 kart (feed'de kampanya başına max 2), impression/click (saatlik abuse limiti — aşımda sessiz false). Şehir Elçisi yalnız ücretsiz highlight. |
| **Bildirim + moderasyon** | Üretim yalnız `cadde_notify` definer'ından; realtime yalnız `user_id=eq.<uid>` kanalı. Şikayet→kuyruk→`admin_moderate_cadde_entity_v1` (dismiss/hide/publish/ban ±, audit'li). Otomatik içerik taraması trigger'la kuyruğa düşürür (yayını engellemez). |
| **Çoklu diaspora** | `diaspora_key (tr/in/cn/ph)` tüm içerik tablolarında; feed/promotion RPC'leri eşitlik filtresi uygular — diasporalar arası sızıntı yok. `useCaddeDiasporaKey()` (provider'sız 'tr' fallback). |

### 4.2 Değişmez sözleşmeler

1. **RPC-only mutation** — cadde içerik tablolarında kullanıcıya açık INSERT policy yok.
2. **SQL↔TS aynaları** (testli; birini değiştiren diğerini günceller):
   `can_post_kopru` ↔ `src/lib/cadde-rules.ts` · `list_cadde_feed_v1` ↔ `cadde-ranking.ts` ·
   `can_join_cadde_cafe` ↔ `canJoinCafeRule`. Otomatik tarama regex'i ↔ `CAFE_NAME_BLOCKLIST`.
3. **Ban kill-switch** `has_cadde_feature` içinde — yeni yazma RPC'leri otomatik kapsanır.
4. **`cadde_settings`** — tüm limit/flag'ler (telefon zorunluluğu D-03, cafe 3/gün–10/gün–6saat,
   çarşı 5 ilan–30 gün, yorum 5/dk, reaksiyon 30/dk, rapor 10/gün) SQL update'iyle değişir.
5. **Hata kodları** `cadde_*` sabitleri → `cadde-rules.ts` Türkçe haritası (yeni kod eklersen haritaya da ekle).
6. `user_verifications` dışa kapalı telefon truth source'udur; ham `phone` attribute'u doğrulama sayılmaz.

### 4.3 Legacy durumu (Faz 9)

`feed_posts / feed_likes / cafes / cafe_memberships / user_follows`: yazma kapalı, policy'siz,
COMMENT'li; 7 legacy trigger silindi; 22 dead frontend dosyası kaldırıldı.
**DROP süreci (karar 2026-06-11: bekle-gözle):** deploy → 1–2 hafta log gözlemi → karar dokümanı →
DROP migration (`user_follows` 1 satır R-06 notuyla). Bu tablolara yeniden policy/grant açılmaz.

---

## 5. Veritabanı Operasyonları

- **Migration kuralı:** silme/yeniden sıralama yok — yalnız yeni dosya, artan timestamp.
  Canlı son sürümü her zaman doğrula: `select max(version) from supabase_migrations.schema_migrations`.
- **Bu makinede Docker yok** → `supabase db push/reset` çalışmaz. Uygulama: psql (IPv4 pooler
  `aws-1-eu-west-2.pooler.supabase.com:5432`, user `postgres.injprdrsklkxgnaiixzh`, şifre
  `.env.local → SUPABASE_DB_PASSWORD`, `PGCLIENTENCODING=UTF8`) + `schema_migrations`'a manuel INSERT.
- **Types regen (B1):** `npx supabase gen types typescript --project-id injprdrsklkxgnaiixzh`
  — geçerli `SUPABASE_ACCESS_TOKEN` gerekir (2026-06-11: mevcut token'lar Unauthorized).
- pg_cron canlıda kurulu; `cadde-cafe-expiring` işi `*/10 * * * *`.

---

## 6. Deploy & Runtime

```
npm run build → dist/   ·   node server.mjs (prod)
server.mjs: /env-config.js (runtime env injection — Coolify) · /api/chat → rag.corteqs.net proxy · SPA fallback
Build-time env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PROJECT_ID
Runtime-only (frontend'e gitmez): SUPABASE_SERVICE_ROLE_KEY, RAG_API_SECRET
Doğrulama: BASE_URL=https://mvp.corteqs.net npm run verify:release
```

Pre-hook: `verify:text` (encoding bekçisi) `src/public/docs/scripts` tarar — `docs/archive`,
`docs/reference`, `docs/docu` arşiv klasörleri taramadan muaftır.

---

## 7. Test Stratejisi

- **Vitest** (unit + component, jsdom): 509+ test — SQL↔TS ayna truth table'ları, cursor
  tekrar/kayıp, Zod sınırları, sayfa smoke'ları. Tek dosya: `npm run test -- <path>`.
- **Playwright** yapılandırılmış; persona matrisi (spec §22.4) açık kalem.
- Tam `npm run lint` repodaki ~451 eski hatayla exit 1 döner (B7 backlog) — **kendi dosyalarını
  hedefli `npx eslint <dosyalar>` ile doğrula.**

---

## 8. Doküman Haritası

| Nerede | Ne |
|---|---|
| **Kök (yalnız 4 doküman)** | `CLAUDE.md` (agent kuralları) · `AGENT_CONTEXT.md` (hızlı bağlam) · `ARCHITECTURE.md` (bu dosya) · `rapor.html` (durum panosu + kullanım senaryoları) |
| `docs/cadde-300/` | Cadde 3.0 spec + envanter + devir notu + faz dokümanları + **change-report.md** |
| `docs/plans/` | Aktif planlar (admin-v2 masterplan + handoff dahil) |
| `docs/catalog-role-afs-rebuild/` | AFS rebuild raporları (00–14) |
| `docs/archive/` | Dondurulmuş içerik: eski mimari dokümanlar, kök temizliği arşivi (`root-2026-06-11/`), DB yedekleri (`backups/`), eski cleanup'lar, import araçları |
| `docs/reference/` | Referans repo kopyaları (global-network-bridge) |
| `docs/docu/`, `docs/assets/` | Eski docu klasörü + arşiv görselleri |
| `docs/README.md` | docs ağacının indeksi |
