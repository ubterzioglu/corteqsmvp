# CorteQS Güvenlik Denetimi — 2026-10-05

> ⚠️ **BU DOSYA İSTİSMAR TALİMATI İÇERİR. Depo PUBLIC olduğu için COMMIT/PUSH ETME**
> (önce C1 kapatılıp depo private yapılana kadar özellikle). Yalnız yerelde tut.

**Kapsam:** salt-okunur statik kod analizi. Canlı siteye/DB'ye bağlanılmadı; tüm DB bulguları
`supabase/baseline/2026-08-04-public-schema.sql` + `supabase/migrations/applied/*` nihai halinden
çıkarıldı. **Yamadan önce her grant'i canlıda doğrula:**
`select has_function_privilege('anon','public.<fn>(<args>)','execute');`
**Secret değerleri maskelidir.** Repo: `ubterzioglu/corteqsmvp` (talepteki `corteqsmvq` yazım hatası sayıldı).

**Stack:** React 18 + Vite SPA · Supabase (Postgres/RLS/Auth/Storage, 20 Edge Function) ·
nginx 1.27 (Docker/Coolify) · `server.mjs` yalnız yerel/nixpacks · tek CI: `.github/workflows/quality.yml`.

**Yöntem:** 3 bağımsız salt-okunur inceleme (edge functions · RLS/RPC/storage · frontend+deploy)
+ elle secret/git-geçmişi/`npm audit` taraması. Kritik bulgular ayrıca elle doğrulandı (işaretli).

## Özet

| Önem | Adet | Bulgular | Durum (5 Ekim 2026) |
|---|---|---|---|
| **Kritik** | 3 | S1 DB dump'ları public repoda · S2 `catalog_upsert_*` anon yazma/silme · S3 anon kendini sahip yapar | S1 → §B1 (insan işi) · S2, S3 → ✓ KAPANDI (SG2) |
| **Yüksek** | 7 | S4 `.env.local` anahtarları yerel ref'lerde · S5 find-matches · S6 SSRF/claim bypass · S7 catalog_items self-verify · S8 landing direct INSERT · S9 relocation worker RPC · S10 advisor_social_media_links | S4 → §B1 · S5 → ✓ KAPANDI (SG7) · S6 → ✓ KAPANDI (GV1) · S7 → ✓ KAPANDI (SG3) · S8 → ✓ KAPANDI (SG4) · S9 → ✓ KAPANDI (SG2) · S10 → ✓ KAPANDI (SG6) |
| **Orta** | 12 | O1–O12 | O1 → ✓ KAPANDI (SG9) · O2, O3 → ✓ KAPANDI (SG2, SG6) · O4, O5, O6 → ✓ KAPANDI (GV2) · O7 → §B4 (Deno yok) · O8 → ✓ KAPANDI (SG4) · O9 → ✓ KAPANDI (SG6) · O10 → ✓ KAPANDI (SG6) · O11 → ✓ KAPANDI (SG6) · O12 → ✓ KAPANDI (GV3) |
| **Düşük/Bilgi** | ~15 madde | bkz. aşağı | 7 yapıldı · 14 §B4'e düştü (bkz. sg10-dusuk-bilgi-durumu.md) |

**Öncelik sırası (öneri):** §B1 (insan işi, en acil) → §B4 kararları → deploy (§B9).

---

## KRİTİK

### S1 — Üretim DB dump'ları (PII + auth hash'leri) PUBLIC repoda ✅ elle doğrulandı
- **Kanıt:** `gh repo view` → `PUBLIC`. `docs/archive/backups/supabase/*/{database.sql,database.dump,roles.sql}` — **16 dosya**, hepsi `origin/main`'de.
  `20260520_085229/database.sql` içinde `COPY auth.users`, `auth.refresh_tokens`; `20260520_*` içinde `public.submissions` (ad/e-posta/telefon); `roles.sql` içinde `ALTER ROLE postgres/authenticator/...` parola verifier'ları.
- **İstismar:** repoyu klonlayan herkes üyelerin kişisel verisini alır (KVKK/GDPR ihlali); SCRAM verifier'ları çevrimdışı kırılabilir; iptal edilmemiş refresh token'lar oturum verir; bcrypt hash'ler kırılabilir.
- **Yama (sırayla):** (1) repoyu private yap → (2) DB parolasını döndür → (3) `auth.refresh_tokens`/`auth.sessions` temizle, tüm oturumları kapat → (4) dump'taki 5 kullanıcıya parola sıfırlat → (5) `git filter-repo --path docs/archive/backups --invert-paths` + force-push (tüm dallar/etiketler) → (6) GitHub Support'tan cache/PR-ref temizliği → (7) KVKK/GDPR bildirim yükümlülüğü değerlendir → (8) `.gitignore`'a `docs/archive/backups/`.

### S2 — Anonim: herhangi bir dizin kaydını ez/sil + sahte "verified"
- **Kanıt:** `catalog_upsert_source_item` — nihai gövde `migrations/applied/20260919130000_fix_catalog_upsert_source_item_created_by.sql:15-133`: **auth kontrolü yok** (✅ elle: `auth.uid|is_admin|service_role` = 0 eşleşme), `ON CONFLICT (slug) DO UPDATE`; `GRANT ... TO anon` baseline:36520. `catalog_delete_item_for_source` baseline:5375 / anon grant :36303, hiç yeniden tanımlanmadı.
  Aynı sınıf: `catalog_reset_item_projection`, `catalog_create_duplicate_candidates_for_item`, `catalog_sync_event`, `catalog_sync_job_listing`, `catalog_sync_independent_profile`, `catalog_sync_turkish_mission`, `catalog_sync_whatsapp_landing`, `catalog_rebuild_search_document(s_for_category)`, `catalog_refresh_all_search_documents`.
- **İstismar (anon):** `POST /rest/v1/rpc/catalog_upsert_source_item` ile mevcut slug'ın içeriği değiştirilir + `p_verification_status:'verified'`; `rpc/catalog_delete_item_for_source` kaydı siler; `catalog_refresh_all_search_documents` döngüsü <1 GB RAM'li instance'ı düşürür (bkz. CLAUDE.md RAM uyarısı).
- **Yama:** aşağıdaki "Ortak SQL yaması".

### S3 — Herkes herhangi bir katalog kaydının sahibi olabilir ✅ elle doğrulandı
- **Kanıt:** `catalog_upsert_owner_membership(p_item_id,p_user_id)` baseline:6638 — SECURITY DEFINER, auth kontrolü yok; anon+authenticated grant :36510-36511; `applied/` içinde hiç değişmedi.
- **İstismar:** yeni üye `rpc/catalog_upsert_owner_membership {p_item_id:<kurban>, p_user_id:<kendi uid>}` → `catalog_item_managers`'ta aktif owner → öğeyi/iletişimlerini düzenler, yöneticileri değiştirir, `verification_status='verified'` ile Seviye-2 kurum temsilcisi (`20261003100000_org_verification.sql:91`) olur.
- **Yama:** ortak SQL + `catalog_item_managers` içindeki beklenmeyen `role='owner'` satırlarını **elle denetle** (körü körüne silme).

**Ortak SQL yaması (S2, S3, S9, O2, O3 için):**
```sql
do $$ declare r record; begin
  for r in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f' and p.proname = any(array[
    'catalog_upsert_owner_membership','catalog_upsert_source_item','catalog_delete_item_for_source',
    'catalog_reset_item_projection','catalog_create_duplicate_candidates_for_item','catalog_sync_event',
    'catalog_sync_job_listing','catalog_sync_independent_profile','catalog_sync_turkish_mission',
    'catalog_sync_whatsapp_landing','catalog_rebuild_search_document',
    'catalog_rebuild_search_documents_for_category','catalog_refresh_all_search_documents',
    'sync_member_catalog_role_for_user','notify_followers','list_member_catalog_names',
    'worker_claim_relocation_jobs','worker_complete_relocation_job','worker_fail_relocation_job',
    'worker_heartbeat_relocation_job','worker_record_relocation_cost','worker_upsert_relocation_candidate'])
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop; end $$;
alter default privileges in schema public revoke execute on functions from public, anon;
```
Trigger'lar SECURITY DEFINER olduğundan etkilenmez; yine de **uygulamadan önce** bu fonksiyonları çağıran istemci kodunu (`rpc(` araması) ve `list_member_catalog_names`/`notify_followers` kullanımını doğrula. Yeni migration olarak ekle (mevcutları değiştirme).

---

## YÜKSEK

### S4 — `.env.local` (service_role, DB parolası, erişim token'ları) yerel git ref'lerinde
- **Kanıt:** commit `52e6faf4` ("first", 2026-05-30) `refs/original/refs/heads/main` ve `refs/original/refs/stash` altında. İçerik (maskeli): `SUPABASE_SERVICE_ROLE_KEY` (role=service_role, ref=injprdrsklkxgnaiixzh, exp 2090), `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN` (+_BACKUP), WhatsApp `ACCESS_TOKEN`, `RAG_API_SECRET`, `VITE_ADMIN_PASSWORD`. `origin/main` geçmişinde **yok**; GitHub'a daha önce itilip itilmediği **doğrulanamadı**.
- **Yama:** hepsini döndür (JWT/service_role → yeni `sb_secret_` anahtarları, DB parolası, iki PAT, WA token, RAG secret, admin parolası) — hafızada "service role rotasyonu bekliyor" kaydı var. Sonra: `git update-ref -d refs/original/refs/heads/main; git update-ref -d refs/original/refs/stash; git reflog expire --expire=now --all; git gc --prune=now`.

### S5 — `find-matches`: kimliksiz çağrıyla başkalarının başvuru metni sızar ✅ elle doğrulandı
- **Kanıt:** `supabase/functions/find-matches/index.ts:214-233` (çağıran doğrulaması yok, service-role client, son 200 `submissions`), `:285` prompt, `:314-331` model `reason` dönüşü, `:334-348` `matches` upsert.
- **İstismar:** anon key + Origin başlığı yok → `offers_needs` içine enjeksiyon → başkalarının serbest metni `reason` ile döner; `persist:true` ile `matches`'e keyfi satır yazılır. Hız sınırı sahte `X-Forwarded-For` ile aşılır (O1).
- **Yama:** `auth.getUser()` zorunlu, `persist` yalnız çağıranın kendi `submissions` satırı için, model serbest metni yerine id/skor döndür; kullanılmıyorsa fonksiyonu kaldır.

### S6 — SSRF + sahte grup sahipliği doğrulaması
- **Kanıt:** `group-claim-verify/index.ts:92-109`, `group-link-health/index.ts:92`, `_shared/group-invite-read.ts:155-161` — DB'deki URL'ye host yeniden doğrulaması yok, yönlendirme izleniyor, gövde sınırsız. Kök neden: baseline `"Users can create own landings"` (:31412) ve `"Users can update own landings"` (:31482) **hâlâ aktif** (`20261002080000_group_submit.sql:9`), `submit_group_v1` host kontrolü doğrudan INSERT ile atlanıyor.
- **İstismar:** PostgREST'ten kendi sunucuna işaret eden satır ekle → `group_claim_start_code` kodu al → sayfana kodu koy → `group-claim-verify` doğrular, `Community_WhatsAppAdmin` rolü verilir; `name_read` ile `og:title` okuma SSRF'i; cron'un hourly fetch'i ile bellek tüketimi.
- **Yama:** her fetch'te izinli-host regex'i + `redirect:"manual"` + ~256 KB gövde sınırı; DB'de INSERT/UPDATE politikalarını kaldır veya `whatsapp_link` host `CHECK` (NOT VALID) + insert guard (bkz. S8).

### S7 — Üye kendi dizin kaydını "verified" yapıp Seviye-2 kapısını geçer
- **Kanıt:** `catalog_items_self_update_linked_user` (baseline:33267, yalnız `linked_user_id=auth.uid()`), `catalog_items_owner_update` (:33246); `GRANT ALL ON catalog_items TO authenticated` (:38106); ayrıcalıklı kolonları koruyan tetikleyici yok.
- **İstismar:** `PATCH /rest/v1/catalog_items?id=eq.<kendi>` `{platform_role_key, verification_status:'verified', status, visibility}`.
- **Yama:** `revoke insert, update on public.catalog_items from anon, authenticated; grant update (title, headline, short_description, long_description, attributes, city, country_code, updated_at) on public.catalog_items to authenticated;` + `attributes->>'platform_role_key'` yetki için okunuyorsa BEFORE UPDATE tetikleyici.

### S8 — Grup satırı doğrudan INSERT ile yayın/skor/rozet/sahiplik sahteciliği
- **Kanıt:** baseline:31412; guard `whatsapp_landings_guard_listing_status` yalnız BEFORE UPDATE (`20261002070000_group_health_score.sql:406`); tek BEFORE INSERT tetikleyici yasak kontrolü (`20261002050000_group_strikes.sql:159`).
- **Yama:** BEFORE INSERT guard (listing_status/status/ownership/owner_user_id/group_score/has_approved_badge/… sıfırla; `group_status.via_rpc` veya `is_admin` hariç) — ayrıntılı SQL ilgili alt-rapor önerisindedir; uzun vadede politikayı kaldır.

### S9 — Relocation worker hattı herkese açık
- **Kanıt:** `20260619104000_relocation_ingestion.sql:114-265` (`worker_*_relocation_*`) auth kontrolü yok, yalnız `service_role`'e GRANT var, anon'dan REVOKE yok (baseline :38214–38307).
- **İstismar:** `rpc/worker_claim_relocation_jobs` ile iş kilitleme/tamamlama sahteciliği, `worker_upsert_relocation_candidate` ile inceleme kuyruğuna enjeksiyon.
- **Yama:** ortak SQL.

### S10 — `advisor_social_media_links`: her üye PII okur/yazar
- **Kanıt:** politika `advisor_social_media_links_all_authenticated` baseline:31884 (`USING(true) WITH CHECK(true)`); ad/e-posta/telefon/whatsapp/instagram; 15 tablo kilidine (`20261004190000/210000`) dahil değil.
- **Yama:** politikayı kaldır, `is_admin(auth.uid())` politikası ekle, anon'dan `revoke all`.

---

## ORTA

| # | Bulgu | Kanıt | Yama |
|---|---|---|---|
| O1 | Tüm hız sınırları istemci `X-Forwarded-For` başını güveniyor + atomik değil | `_shared/rate-limit.ts:3-27`, `find-matches:94-157`, `send-submission-email:70-133`, `submit-survey-response:37-189` | `user.id` ile anahtarla; platformun yazdığı IP; SQL'de atomik `INSERT … ON CONFLICT DO UPDATE` |
| O2 | `sync_member_catalog_role_for_user` anon: başkasının gizli profilini yayınlar | baseline:15720, anon :38014 | ortak SQL |
| O3 | Sahte uygulama içi bildirim (`notifications` INSERT politikası + `notify_followers` anon) | baseline:30905, :11136/:37163 | politikayı kaldır + ortak SQL |
| O4 | `send-submission-email` kimliksiz: CorteQS gönderenden keyfi adrese e-posta (kimlik avı) | `send-submission-email/index.ts:209-262`; anon `submissions` INSERT `WITH CHECK(true)` | DB outbox/`x-dispatch-secret`; doğrulanmamış adrese onay maili yok |
| O5 | `submit-survey-response`: doğrulama `answerMap`, ekleme dizi — doğrulama atlatılır; `"default-salt"` fallback | `:199-217` vs `:257-263`, `:157` | tekrar eden `questionId` reddet; salt yoksa fail-closed |
| O6 | `whatsapp-autoreply` prompt enjeksiyonu; alıcı body'den; ham hata dönüşü | `_shared/whatsapp-autoreply.ts:189-191,228-231,258` | `systemInstruction`, çıktı filtresi, alıcıyı thread'den oku |
| O7 | Edge function'larda Deno lockfile/integrity yok, esm.sh sürümleri karışık | `supabase/functions/**` | `deno.json` + `deno.lock`, sürümleri eşitle |
| O8 | Onaylı grup linki değiştirilebilir (guard `whatsapp_link`'i korumuyor) | `20261002070000:406-459`, baseline:31482 | guard'a `whatsapp_link` ekle |
| O9 | `command_center_hot_fixes` tüm üyelere yazılabilir | `20260903120000_command_center_hot_fixes.sql:116,126` | `is_admin` politikası |
| O10 | `job_listings`: `"Anyone can view published listings"` kota RPC'sini anlamsız kılar; sahibi `status/package/total_price` yazar | baseline:30877, 31083/31111 | politikayı kaldır + kolon grant'i |
| O11 | `todos` anon'a tamamen açık (SELECT/INSERT/UPDATE/DELETE) | baseline:31230-31258, :40178 | politikaları kaldır, anon revoke |
| O12 | `server.mjs` Windows path traversal: `GET /%5c..%5c.env.local`; `0.0.0.0`'da dinliyor (yalnız yerel `npm run start`) | `server.mjs:147-157,258,305` | `\` reddet, `path.resolve`+prefix kontrol, varsayılan `127.0.0.1` |

## DÜŞÜK / BİLGİ
- `LoginPage.tsx:42-45` `next` doğrulaması `//evil.com`'u geçirir (şu an react-router `replace` ile çöküyor; push/`location` ile açık yönlendirme olur) → `/^\/(?![/\\])/`.
- Kullanıcı URL'leri `href`'te şema kontrolsüz (`EventDetailPage.tsx:190,216`, `BusinessDetailPage.tsx:144`, `AssociationDetail.tsx:152,519`, `IndependentProfilePage.tsx:189,250`) → `safeHref()` + SQL `CHECK`. CSP bunu üretimde engelliyor.
- `nginx.conf.template:137` gevşek `(.+)` yakalama → `([A-Za-z0-9_-]+)`; `server_tokens off` yok.
- Wildcard CORS: `_shared/whatsapp-reply.ts:61`, `submit-survey-response:30`, `whatsapp-autoreply:38`. Origin kontrolü başlık yokken atlanıyor (`find-matches:206` vb.).
- `radar-news-scan/index.ts:88` sabit-zamanlı olmayan secret karşılaştırması; SSRF filtresi yalnız hostname regex (`lib/source-security.ts:8-44`), `redirect:"follow"`.
- Hata detayı sızıntısı (`relocation-notifications:124-126`, providers.ts `ModelProviderError`, `send-notification-emails:393`); Gemini API anahtarı URL query'de (`site-assistant:110`, `directory-search:40`, `relocation-assistant/providers.ts:63`).
- SMTP alıcı satırlarında CR/LF temizliği yok (`_shared/emails/smtp.ts:176-182,239`) — şu an istismar edilemiyor.
- `send-phone-otp-hook`: replay cache yok, pepper hook secret'a düşüyor; `WHATSAPP_APP_SECRET` hem HMAC hem AES anahtarı kaynağı (rotasyon şifreli veriyi bozar).
- `group-preview` yayında olmayan grupların slug/ownership bilgisini döndürür; radar digest `href` için `javascript:` engeli yok.
- `coupon_purchases` alıcı `status='paid'` yazabilir; anonim form tablolarında (`submissions`, `lansman_registrations`, …) alan sahteciliği ve hız sınırı yok; `list_member_catalog_names` anon; `record_tool_run` log zehirleme; kariyer başvurusu global 100/saat tavanı flood ile doldurulabilir.
- CI: `actions/checkout@v4`, `setup-node@v4` SHA'ya sabitlenmemiş (workflow `pull_request`, `permissions: contents: read`, secret yok — risk düşük).
- `src/lib/security.ts` `sanitizeHtml` (zayıf regex) çağıranı yok → sil.
- `_shared/emails/event-published.ts` git'te takipsiz ama `send-notification-emails/index.ts:47` import ediyor → temiz checkout'tan deploy kırılır.

## Bağımlılıklar (`npm audit`)
9 yüksek / 0 kritik. `xlsx` (düzeltme yok; yalnız `scripts/generate-role-structure.mjs`, tarayıcıya girmez) · `undici`, `brace-expansion` (düzeltme var) · `tailwindcss@3` zinciri (`braces`/`micromatch`/`chokidar`/`fast-glob`, build-time ReDoS) · `lovable-tagger`. `--omit=dev` ile 5 yüksek, hepsi tailwind zinciri.

## Doğrulanan sağlam alanlar (yeniden açma)
WhatsApp webhook HMAC (ham gövde, sabit-zamanlı) · `send-phone-otp-hook` imza+zaman tolerans · `is_admin` kapılı dispatch/admin fonksiyonları · `command_center_items` ve 15 legacy tablo kilitleri · `cv-files`/`cv`/`arge-files` bucket'ları private · events status self-publish kapatılmış · `admin_*` anon EXECUTE kaldırılmış · tüm SECURITY DEFINER fonksiyonlarda `SET search_path` · `dangerouslySetInnerHTML` yalnız build-time bundled içerik · CSP'de `'unsafe-inline'` yok, güvenlik başlıkları her `add_header` location'ında tekrarlı · `.dockerignore` `.env*` hariç.

## Sınırlar
Canlı DB/site taranmadı; grant'ler baseline+migration'lardan çıkarıldı (canlıda doğrula). RLS politikalarının tamamı satır satır değil, ayrıcalık yükselten desenlere göre tarandı. Edge function'larda Deno bağımlılık denetimi çalıştırılamadı.

## Uygulama Sırası (6 Ekim 2026)

**Tamamlanan (✓):**
1. SG1 — DB dump'ları izlenenden çıkarıldı
2. SG2 — İç RPC'lerden anon/authenticated EXECUTE kaldırıldı
3. SG3 — catalog_items kolon guard + tetikleyici
4. SG4 — whatsapp_landings INSERT/UPDATE guard + host CHECK
5. SG5 — Açık RLS politikaları kapatıldı (SG6 ile birlikte)
6. SG6 — advisor_social_media_links, notifications, command_center_hot_fixes, todos, job_listings
7. SG7 — SSRF koruması (safe-invite-fetch.ts + testler)
8. SG8 — server.mjs path traversal, LoginPage open redirect, safeHref, CI SHA, nginx
9. SG9 — Atomik rate-limit, submit-survey-response (fail-closed salt, duplicate questionId), whatsapp-autoreply (çıktı filtresi)
10. SG10 — 7 düşük/bilgi maddesi düzeltildi, 14 madde §B4'e düştü

**Açık (§B — karar/hesap/izin bekleyen):**
1. **§B1 (XL 🔴)** — Secret rotasyonu + git geçmişi temizliği (S1, S4)
2. **§B4 (L)** — 14 düşük/bilgi maddesi + O4 (send-submission-email) + O7 (Deno)
3. **§B9 (M)** — Canlı deploy + doğrulama

**Önerilen sıra:** §B1 → §B4 kararları → §B9 deploy
