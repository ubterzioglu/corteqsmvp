# 04 — GÜVENLİK YAMALARI (batch batch) — 5 Ekim 2026

> **Kaynak:** `docs/security/SECURITY_AUDIT.md` (S1–S10, O1–O12, Düşük). Bulgunun ayrıntısı, kanıt satırı ve
> istismar adımı orada; bu dosya **yalnız ne yapılacağını ve sırasını** söyler. Başlamadan o dosyayı oku.
> Karar uydurma: burada olmayan bir kural için DUR ve sor. Rakamları ezberleme, komutla ölç.

## 0 · DEĞİŞMEZ KURALLAR (her batch için)

1. **Dal:** `security-fixes` (yoksa `main`'den aç). `main`'e dokunma. **PUSH YOK.**
2. **Migration UYGULAMA.** Yalnız dosyayı yaz ve `supabase/migrations/applied/` altına koy. Canlıya
   uygulamayı Burak yapar (bu repoda "dosya `applied/`'de" ≠ "canlıda"). Canlı DB'ye **yazma yok**;
   okuma gerekiyorsa yalnız katalog sorgusu (bkz. SG0). Edge function **deploy etme** (Coolify deploy etmez).
3. **Mevcut migration'ı DEĞİŞTİRME.** Yalnız yeni dosya ekle. Zaman damgası **14 hane**, mevcutlarla
   çakışmasın (`ls supabase/migrations/applied | tail`; son damgadan büyük, `20261006…` aralığı). 15 haneli yazma.
4. **Çalışma ağacında başkasının commit'siz işi var** (`git status`). **Kendi dosyalarını yol belirterek commit et:**
   `git commit -m "..." -- <dosyalar>`. Pathspec'siz `git commit -a` YASAK.
5. **Her batch = ayrı commit.** Mesaj Türkçe, `fix(güvenlik): ...` biçiminde, gövdede bulgu kodu (S2, O4 …).
6. **Secret değerini hiçbir dosyaya, commit mesajına, loga yazma.** Maskele.
7. **Kapı (her batch sonunda, sırayla, hepsi yeşil olmadan commit yok):**
   `npx tsc -p tsconfig.app.json --noEmit` · `npm run lint` · `npm run test` · `npm run verify:text` ·
   `npm run check:dead` · `npm run ingest:tools:check` (src/lib altına dosya eklediysen) ·
   `npm run check:migrations:warn` (yeni migration'da).
   ⚠️ `verify:text` eksik Türkçe harfi yakalamaz — arayüz metinlerini gözle kontrol et. DB'ye yazılan
   değerlerden Türkçe karakter silme.
8. **Önce KIRMIZI test:** her yama için önce başarısız olan bir sözleşme/birim testi yaz, sonra yamayı yap.
   SQL için test, migration **metnini** denetler (`src/lib/*-migration.test.ts` desenini örnek al; çıpa
   bulunamazsa testi düşüren `@/test/source-slice` yardımcılarını kullan — çıplak `indexOf+slice` YASAK).
   Mutasyon turu: yamayı geçici bozup testin düştüğünü gör.
9. **Edge function'lar:** `supabase/functions/**/*.test.ts` (Deno/vitest — mevcut test desenine bak).
   Yeni dış bağımlılık ekleme; mevcut `_shared/` yardımcılarını kullan.
10. **Bağımsız inceleme:** batch bitince **ayrı bir ajan/oturum** (sen değil) yamayı "çürütmeye çalışarak"
    inceler. Kendi işini kendin onaylama.
11. **Bu dosyada olmayan şeye dokunma.** Özellikle: `src/integrations/supabase/client.ts`, `components/ui/*`,
    eski migration'lar, Cadde SQL↔TS ayna sözleşmeleri.

## 1 · QWEN'İN YAPMAYACAĞI (insan işi — Burak) — sıra önemli, SG-batch'lerden BAĞIMSIZ ve ÖNCELİKLİ

Bunlar hesaplara/anahtarlara bağlı; ajan yapmaz, yalnız hatırlatır:

- **H1 (S1, KRİTİK):** repoyu **private** yap → DB parolasını döndür → `auth.refresh_tokens`/`auth.sessions`
  temizle, tüm oturumları kapat → dump'taki 5 kullanıcıya parola sıfırlat → `git filter-repo --path
  docs/archive/backups --invert-paths` + force-push (tüm dal/etiket) → GitHub Support'a cache/PR-ref temizliği →
  KVKK/GDPR bildirim değerlendirmesi.
- **H2 (S4, YÜKSEK):** service_role (yeni `sb_secret_` anahtarlarına geç, eski JWT anahtarlarını kapat), DB parolası,
  iki Supabase PAT, WhatsApp `ACCESS_TOKEN`, `RAG_API_SECRET`, admin parolası döndür. Sonra yerel ref'leri temizle:
  `git update-ref -d refs/original/refs/heads/main; git update-ref -d refs/original/refs/stash;
  git reflog expire --expire=now --all; git gc --prune=now`.
- **H3:** her SQL migration'ı canlıya **sen** uygularsın; uygulamadan sonra `check:migrations`.
- **H4:** edge function deploy'ları (`supabase functions deploy <ad>`).

---

## SG0 · Hazırlık ve ölçüm (kod yazma YOK)

1. `git status --short --branch`, `git switch -c security-fixes` (yoksa). Başlangıç kapısını çalıştır, sonuçları
   `docs/security/ilerleme.md`'ye yaz (sayılar ölçüm, ezber değil).
2. **Kullanım envanteri** (SG2/SG3/SG5 için şart). Çok satırlı arama kullan (`supabase\s*\n?\s*\.rpc\(`):
   - Şu RPC adlarını `src/`, `scripts/`, `supabase/functions/` içinde ara; her biri için **çağıran dosya listesi** ve
     "anon/authenticated istemcisinden mi, service_role'den mi, tetikleyiciden mi" notu çıkar:
     `catalog_upsert_owner_membership`, `catalog_upsert_source_item`, `catalog_delete_item_for_source`,
     `catalog_reset_item_projection`, `catalog_create_duplicate_candidates_for_item`, `catalog_sync_*`,
     `catalog_rebuild_search_document*`, `catalog_refresh_all_search_documents`, `sync_member_catalog_role_for_user`,
     `notify_followers`, `list_member_catalog_names`, `worker_*_relocation_*`.
   - `catalog_items` tablosuna **doğrudan** `.update(`/`.insert(` yapan istemci kodunu bul (SG3 kolon grant'i bunları
     kırabilir). `job_listings`, `notifications`, `todos`, `advisor_social_media_links`,
     `command_center_hot_fixes` için de aynısı.
   - Çıktı: `docs/security/kullanim-envanteri.md`. **İstemciden çağrılan bir revoke adayı bulursan DUR ve sor.**
3. **Canlı doğrulama (yalnız OKUMA, ağır sorgu YASAK — canlı DB <1 GB RAM, bkz. CLAUDE.md):** yalnız
   `has_function_privilege`/`pg_policies`/`information_schema.column_privileges` gibi küçük katalog sorguları;
   dosyadan `psql -f` ile (PowerShell'den Türkçe/uzun SQL bozulur). Sonuçları envantere ekle:
   "baseline'da anon EXECUTE vardı → canlıda hâlâ var mı?" Canlıda zaten kapalı çıkan madde varsa SG'sini
   "gerekmiyor" diye işaretle. DB bağlantısı yoksa bu adımı atla ve işaretle (Burak yapar).
4. Kabul: iki dosya yazıldı, kapı başlangıç değerleri kayıtlı, **kod değişmedi**.

## SG1 · Dump'ları depodan çıkar + ignore (S1 — kod tarafı)

Commit-geçmişi temizliği H1'de insanındır; bu batch yalnız HEAD'i temizler.
1. `git rm -r --cached docs/archive/backups` (**dosyaları diskten SİLME**, yalnız izlemeyi bırak).
2. `.gitignore`'a ekle: `docs/archive/backups/`, `*.dump`, `database.sql`, `roles.sql` (mevcut `*.dump` kuralı zaten
   izlenen dosyayı bırakmaz; yorum satırına nedenini yaz).
3. `CLAUDE.md`'deki "docs/archive içeriği donmuş; DB yedeği silinmez" tarzı ifade varsa **dokunma**, yalnız
   `docs/security/SECURITY_AUDIT.md`'e "HEAD temizlendi, geçmiş H1 bekliyor" notu ekle.
4. Test: `.gitignore` sözleşme testi (yedek dizini ve `*.dump` kuralının varlığı, `git ls-files docs/archive/backups`
   boş).
5. Kabul: `git ls-files docs/archive/backups | wc -l` = 0; kapı yeşil. Commit: `fix(güvenlik): üretim DB yedekleri izlemeden çıkarıldı (S1)`.

## SG2 · Anon EXECUTE kapatma — ortak migration (S2, S3, S9, O2, O3-notify_followers, Düşük-list_member_catalog_names)

1. Yeni migration: `supabase/migrations/applied/20261006100000_security_revoke_internal_rpc.sql`.
   İçerik: `docs/security/SECURITY_AUDIT.md` "Ortak SQL yaması" bloğu **aynen**, ama:
   - SG0 envanterinde **istemciden çağrıldığı çıkan** fonksiyonu listeden ÇIKAR (örn. `list_member_catalog_names`
     UI'da kullanılıyorsa) ve yerine fonksiyonun içine `auth.uid()`/`is_admin()` kapısı koyan ayrı `create or
     replace` yaz; sorarak ilerle.
   - Fonksiyon imzalarını `regprocedure` ile bul (aşırı yükleme varsa hepsi). Eksik/yeni bir ad çıkarsa
     migration'ı **çökertmesin**: `execute format` döngüsü zaten bulduğunu işler; bulunamayan ad sessiz geçer —
     bunu yorumla belirt.
   - `alter default privileges ... revoke execute on functions from public, anon;` ekle **ve** yorumda "bundan
     sonra yeni RPC'ye anon için açık `grant execute` yazılmalı" uyarısını koy (anon'a açık olması gereken
     arama RPC'leri — `search_directory_catalog`, `get_*_public` — **bozulmamalı**: etkilenen mevcut fonksiyonlar
     default privilege'dan değil, mevcut grant'ten gelir; yine de envanterde doğrula).
2. Geri alma bölümü (yorum): her fonksiyon için `grant execute ... to anon, authenticated` satırları.
3. Test (KIRMIZI önce): migration metninde (a) 22 fonksiyon adının hepsi, (b) `to service_role`, (c) `from public,
   anon, authenticated`, (d) anon'a açık kalması gereken en az 3 bilinen RPC'nin listede OLMADIĞI denetlenir.
4. Kabul: kapı yeşil; `check:migrations:warn` yeni dosyayı "uygulanmamış" listeler (beklenen).
   Commit: `fix(güvenlik): iç SECURITY DEFINER RPC'lerden anon/authenticated EXECUTE kaldırıldı (S2,S3,S9,O2)`.

## SG3 · catalog_items kolon yetkisi (S7)

1. SG0 envanterinde istemcinin `catalog_items`'a yazdığı **kolonları** çıkar; izinli kolon listesi **gerçek
   kullanıma** göre belirlenir (audit önerisi başlangıç noktasıdır, ezber değil).
2. Migration `20261006110000_security_catalog_items_column_grants.sql`:
   `revoke insert, update on public.catalog_items from anon, authenticated;` +
   `grant update (<izinli kolonlar>) on public.catalog_items to authenticated;`.
   `attributes` jsonb ise ve `attributes->>'platform_role_key'` yetki için okunuyorsa `BEFORE UPDATE` tetikleyicisi
   ekle: değiştirilmeye çalışılırsa `is_admin(auth.uid())` değilse `raise exception 'catalog_privileged_attribute'`
   (42501). `verification_status`, `platform_role_key`, `status`, `visibility` **kolon grant listesinde olmayacak**.
3. SECURITY DEFINER RPC'ler (sahip akışları) etkilenmez — envanterde doğrula.
4. Yeni hata kodu TS tarafına yansıyorsa Türkçe mesaj haritasına ekle (çift yönlü sözleşme testi).
5. Test: migration metni (kolon listesinde 4 ayrıcalıklı kolon YOK) + varsa istemci yazma kodunun yalnız izinli
   kolonları gönderdiğini denetleyen test. Kabul: kapı yeşil.
   Commit: `fix(güvenlik): catalog_items ayrıcalıklı kolonları üyeye kapatıldı (S7)`.

## SG4 · whatsapp_landings guard'ları (S8, S6-DB tarafı, O8)

1. Migration `20261006120000_security_whatsapp_landings_insert_guard.sql`:
   - `whatsapp_landings_guard_insert()` BEFORE INSERT: `group_status.via_rpc='on'` veya `is_admin` DEĞİLSE
     `listing_status/status='pending'`; `ownership, owner_user_id, group_score, group_score_breakdown,
     published_at, review_flags` null; `has_approved_badge=false`; `strike_count=0`; `submitted_as_admin=false`.
     SQL için `docs/security/SECURITY_AUDIT.md` S8 + denetim raporundaki taslağı başlangıç al ve gerçek kolon
     adlarını **baseline/`applied/` içinden doğrula** (olmayan kolona yazma `42703` verir).
   - Mevcut UPDATE guard'ına (`whatsapp_landings_guard_listing_status`, nihai gövde
     `20261002070000_group_health_score.sql:406`) `whatsapp_link` ve `invite_url` değişimini engelle:
     `is_admin` değilse `raise exception 'group_link_change_requires_review'`. (Yeni fonksiyonu `create or replace`
     ile yeniden tanımlayacaksan **önce nihai gövdeyi oku**, hiçbir mevcut kontrolü düşürme.)
   - Host `CHECK` (`NOT VALID`): `whatsapp_link is null or whatsapp_link ~* '^https://(chat\.whatsapp\.com|
     t\.me|telegram\.me|discord\.gg|discord\.com/invite)/'` — **mevcut satırlar bozulmasın diye NOT VALID**; kaç
     satırın uymadığını yorumda ölçüm olarak yaz (ölçemiyorsan "Burak ölçecek" diye işaretle).
2. Test: migration metninde tetikleyici, guard kolonları, `NOT VALID` ve regex; mevcut `group-*` sözleşme
   testlerini **bozma** (çalıştır).
3. `"Users can create own landings"` politikasını **KALDIRMA** (eski frontend paketi için duruyor; kaldırma kararı
   Burak'ta). Yorumla "politika kaldırılabilir: yeni bundle yayında olunca" notu bırak.
   Commit: `fix(güvenlik): grup INSERT/UPDATE guard + bağlantı hostu kısıtı (S8,S6,O8)`.

## SG5 · Açık politika ve tablo sıkılaştırma (S10, O9, O11, O3-notifications)

1. Migration `20261006130000_security_close_open_policies.sql`:
   - `advisor_social_media_links`: `all_authenticated` politikasını kaldır → `is_admin(auth.uid())` politikası;
     `revoke all ... from anon`.
   - `command_center_hot_fixes`: select + write politikaları `is_admin`.
   - `todos`: 4 "Public ..." politikası kaldır, `revoke all from anon, authenticated`, admin politikası.
   - `notifications`: `"Authenticated users can insert notifications"` kaldır. **Önce** envanterde istemcinin
     doğrudan `notifications` INSERT'i yapıp yapmadığına bak; yapıyorsa dur ve sor (tetikleyici/RPC'ye taşıma
     gerekir).
2. Her tablo için **kullanan istemci kodu** (admin sayfaları) `is_admin` olarak çalışıyor mu doğrula; üye
   ekranı bu tablolardan okuyorsa dur ve sor.
3. Test: migration metni (kaldırılan politika adları, yeni admin politikaları, anon revoke). Kabul: kapı yeşil.
   Commit: `fix(güvenlik): açık RLS politikaları kapatıldı (S10,O9,O11,O3)`.

## SG6 · find-matches (S5)

`supabase/functions/find-matches/index.ts`:
1. İstek başında kullanıcı client'ı (anon key + `Authorization` başlığı) ile `auth.getUser()`; geçersizse 401.
   Service-role client'ı **yalnız gerekli sorgu için** ve çağıran kimliği doğrulandıktan sonra kullan.
2. `persist:true` + `sourceSubmissionId` → o `submissions` satırının `user_id`'si çağıranla eşleşmiyorsa 403.
3. Modelin serbest `reason` metnini **başkasının satırından türetilmiş haliyle döndürme**: yanıtta yalnız
   `id`, `score` ve **sabit şablonlu** sebep; ya da sebebi dönmeden önce aday metinleriyle örtüşenleri süz.
4. Hız sınırı anahtarı `user.id` (SG9/O1 gelmeden de en az bu).
5. Fonksiyon **hiç kullanılmıyorsa** (SG0 envanteri) kaldırma önerisini yaz, kendin silme.
6. Test: yetkisiz → 401; başkasının `sourceSubmissionId`'si → 403; yanıt gövdesinde aday ham metni YOK.
   Commit: `fix(güvenlik): find-matches kimlik zorunlu, başvuru metni sızıntısı kapatıldı (S5)`.

## SG7 · SSRF korumaları (S6 — edge tarafı, Düşük-radar)

1. `_shared/` altında tek yardımcı `safe-invite-fetch.ts`: izinli host regex'i (WhatsApp/Telegram/Discord davet
   kalıpları), `redirect:"manual"`, 15 sn zaman aşımı, gövde en çok ~256 KB (akış okuyup kes), `res.text()` YOK.
2. Üç noktada kullan: `group-claim-verify/index.ts:92-109`, `group-link-health/index.ts:92`,
   `_shared/group-invite-read.ts:155-161`. Eşleşmeyen URL → `invalid` sonucu, fetch YOK.
3. `group-claim-verify` yanıtındaki `name_read` yalnız izinli host için dönsün.
4. `group-preview`: yayında olmayan grup için `exists:true` dışında alan döndürme.
5. Test: izinli host geçer; `http://169.254.169.254/`, `https://evil.tld/`, `https://chat.whatsapp.com.evil.tld/`,
   `@` userinfo, yönlendirme → hepsi reddedilir.
   Commit: `fix(güvenlik): grup bağlantı fetch'lerine host allowlist ve gövde sınırı (S6)`.

## SG8 · Frontend ve sunucu sertleştirme (O12 + Düşük)

1. `server.mjs`: `requestPath` içinde `\` varsa 400; çözümlemeyi `path.resolve(distDir, "." + requestPath)` +
   `startsWith(distDir + path.sep)` ile yap; varsayılan dinleme `127.0.0.1` (`HOST` ile değişir). Test: `%5c..%5c`
   ve `..%2f` denemeleri 400/404.
2. `LoginPage.tsx:42-45`: `next` için `/^\/(?![/\\])/`. Test: `//evil.com`, `/\evil.com`, `https://x`, `/profile`.
3. Kullanıcı URL'lerini `href`'e veren yerlerde (`EventDetailPage.tsx:190,216`, `BusinessDetailPage.tsx:144`,
   `AssociationDetail.tsx:152,519`, `IndependentProfilePage.tsx:189,250`) `safeHref()` kullan
   (`src/lib/security.ts:31`). **Not:** `security.ts`, `EventDetailPage.tsx` başkasının commit'siz değişikliğini
   içeriyor olabilir — `git diff` ile gör, o satırların dışına dokunma, pathspec'le commit et.
   Etkinlik URL'si için SQL `CHECK (… ~* '^https?://')` ayrı küçük migration (`20261006140000_…`), `NOT VALID`.
4. `nginx.conf.template:137`: `(.+)` → `([A-Za-z0-9_-]+)`; `server_tokens off;`. **Dokunmadan önce
   CLAUDE.md "Değişmez sözleşmeler" md.1–6'yı oku**; `src/lib/redirects.test.ts` yeşil kalmalı;
   `add_header` içeren location'a güvenlik başlıklarını kopyalama kuralını bozma.
5. `src/lib/security.ts`: çağıranı olmayan zayıf `sanitizeHtml`'i sil (önce `grep` ile çağıran yok doğrula).
6. `.github/workflows/quality.yml`: `actions/checkout`, `actions/setup-node`'u commit SHA'sına sabitle (SHA'yı
   resmi repo release sayfasından doğrula; uydurma).
   Her alt madde ayrı commit olabilir. Kabul: kapı yeşil.

## SG9 · Orta seviye edge/sunucu (O1, O4, O5, O6, O7)

1. **O1** `_shared/rate-limit.ts`: IP türetmeyi platformun yazdığı başlığa bağla (en soldaki `X-Forwarded-For`
   DEĞİL); doğrulanmış kullanıcıda anahtar `user.id`; sayaç artışı **atomik** SQL (`INSERT … ON CONFLICT DO UPDATE …
   RETURNING`) — RPC olarak yeni migration (`20261006150000_…`). Yerel kopyaları (`find-matches`,
   `send-submission-email`, `submit-survey-response`, `_shared/whatsapp-*`) ortak yardımcıya taşı.
   ⚠️ Supabase gateway'in istemci `X-Forwarded-For`'unu geçirip geçirmediği **doğrulanmadı** — kodda ayrıca not düş,
   non-prod'da Burak doğrulasın.
2. **O4** `send-submission-email`: `x-dispatch-secret` veya DB outbox; doğrulanmamış adrese onay maili YOK.
3. **O5** `submit-survey-response`: yinelenen `questionId` → 400; ekleme yalnız doğrulanmış `answerMap`'ten;
   `"default-salt"` yedeğini kaldır (salt yoksa fail-closed). `src/lib/surveys.ts` filtresiyle uyumu bozma.
4. **O6** `whatsapp-autoreply`: kurallar `systemInstruction`'a, kullanıcı metni ayrı "veri" parçası (`site-assistant`'taki
   desen); çıktıda corteqs.net dışı URL ve uzunluk sınırı; alıcıyı `waIdCiphertext` yerine thread kaydından oku;
   yanıtta ham `prepareError.message` yok, sabit kod.
5. **O7** `supabase/functions` için `deno.json` (import map) + `deno.lock`; `supabase-js` sürümünü tekle.
   Deno yoksa dur ve sor.
6. Her madde için önce KIRMIZI test. Commit'ler ayrı.

## SG10 · Düşük / Bilgi maddeleri (toplu, sırayla)

`SECURITY_AUDIT.md` "DÜŞÜK / BİLGİ" listesindeki her madde için küçük, ayrı commit:
CORS joker → paylaşılan allowlist · sabit-zamanlı `radar-news-scan` secret karşılaştırması (`secretsMatch`) ·
radar SSRF'i `redirect:"manual"` + çözümlenmiş özel aralık engeli · hata iletisi sızıntıları (sabit mesaj) ·
Gemini anahtarını URL yerine `x-goog-api-key` başlığına · SMTP alıcı satırlarında `[\r\n<>]` temizliği ·
`send-phone-otp-hook` için ayrı `WHATSAPP_OTP_PHONE_PEPPER` ve `WHATSAPP_PII_KEY` (⚠️ anahtar ayırmak mevcut
şifreli veriyi bozar — **dur ve sor**, geçiş planı ister) · radar digest `href` yalnız http/https ·
`coupon_purchases` `with check (status='pending')` · anonim form tablolarında kolon grant'i (ayrı plan gerekebilir,
**dur ve sor**) · `_shared/emails/event-published.ts`'in git'e eklenmesi (başka oturumun dosyası — **ekleme, Burak'a
bildir**). `job_listings` (O10) politika kaldırma **ayrı batch**: önce `/ilanlar` ve detay RPC'lerinin tüm
okumaları RPC üzerinden yaptığını doğrula, sonra migration.

## SG11 · Kapanış

1. Tüm kapı + `npm run build`.
2. `docs/security/SECURITY_AUDIT.md`'de her bulgunun durumunu güncelle (Kod yazıldı / Burak uygular / Doğrulandı).
3. Burak'a **uygulama sırası listesi** ver: hangi migration, hangi edge function deploy'u, hangi canlı doğrulama sorgusu.
4. Bağımsız inceleme raporu (§0.10) ekle. **Push yok**; Burak onayı sonrası.

## KAPSAM DIŞI / sorulmadan yapılmayacak
`whatsapp_landings` INSERT politikasının kaldırılması · anonim form tablolarının yeniden tasarımı ·
`WHATSAPP_APP_SECRET` türevli anahtarın ayrılması · Stripe/Premium · herhangi bir canlı DB yazma işlemi ·
secret rotasyonu · git geçmişi yeniden yazma.
