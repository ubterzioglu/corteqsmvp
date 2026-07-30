# DEVİR — 30 Temmuz 2026

> Yeni oturuma devir dökümanı. **Bu dosya tek kaynaktır**; 29 Temmuz kapanış notu, referral planı
> ve revizyon panosu planı burada birleştirildi.
> Detaylı tasarımlar için: [referral planı](docs/plans/2026-07-29-profil-referral-dogrulama-admin-kullanim.md) ·
> [revizyon panosu planı](docs/plans/2026-07-30-revizyon-istekleri-pano-mutabakati.md)
> Toplantı sunumu: [docs/plans/2026-07-30-devir-25-batch-rapor.html](docs/plans/2026-07-30-devir-25-batch-rapor.html)
>
> Not: `CLAUDE.md` kökte 4 doküman kuralı koyuyor. Bu dosya bilinçli 5. dosyadır (geçici devir notu);
> 25 batch bitince `docs/history/` altına taşınır.

## 0. Repo fotoğrafı (30 Temmuz, ölçüldü)

| | Durum |
|---|---|
| Branch | `main` = `origin/main`, son commit `cbc64f7` üzerine bugünün admin-shell commit'i |
| Testler | ✅ **178 dosya / 1236 test geçti** (`npx vitest run`, exit 0) |
| Tipler | ✅ `npx tsc --noEmit` → 0 hata |
| Lint / metin | ✅ `eslint` exit 0 · `verify:text` 1242 dosya temiz |
| Çalışma ağacı | ✅ temiz — 4 dosyalık admin-shell işi (+125/−317) devir öncesinde commit'lendi ve `main`'e push'landı (B01) |
| Bekleyen migration | ✅ 3 → **1 dosya** kaldı (`20260729140000_member_welcome_email.sql`) → **B05** |
| Deploy | ⛔ Coolify'a **hiçbir şey** çıkmadı: bildirim altyapısı + Cadde V1 + hoş geldin maili + bugünün işleri |
| Mail altyapısı | 🔴 `RESEND_API_KEY` **geçersiz (401)** — 8 kayıt kuyrukta `pending`, her commit bir deneme yakıyor → **B06 acil** |

**Ortam notu (29 Temmuz'daki bilgi yanlıştı):** canlı DB'ye psql ile **yazma da çalışıyor** —
pooler + `dangerouslyDisableSandbox: true` şart. Engelli olan yalnız Node HTTPS.

```bash
set -a && source <(grep -E "^SUPABASE_DB_PASSWORD=" .env.local) && set +a
PGPASSWORD="$SUPABASE_DB_PASSWORD" PGCLIENTENCODING=UTF8 psql \
  "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.injprdrsklkxgnaiixzh sslmode=require" \
  -v ON_ERROR_STOP=1 --single-transaction -f <dosya>.sql
```

## 1. 25 batch

Sıra bağımlılığa göre. Her batch tek oturumda bitmeli; ✅ bitti-kriteri karşılanmadan sonrakine geçilmez.

### Grup A — Temizlik + housekeeping (kilidi açar)

**B01 · Commit'lenmemiş 4 dosyayı commit'le + push** — ✅ bu devir öncesinde yapıldı
Dosyalar: `src/lib/admin-shell/admin-updates.ts` · `src/pages/admin/AdminDurumRaporuPage.tsx` ·
`src/lib/admin-shell/admin-navigation-registry.ts` · `src/lib/admin-shell/admin-route-meta.ts`
İçerik: 8 durum-raporu kaydı — 30 Temmuz kaydı (`20260730-butce-sekmesi-menude-durum-raporu-tek-kaynak`)
+ 7 yeni 29 Temmuz kaydı (`…-cadde-sehir-eslestirme-onarimi`, `…-cadde-carsi-gorsel-iletisim`,
`…-cadde-cafe-tema-marka-korumasi`, `…-cadde-hashtag-mention-kapsam`, `…-cadde-paylasim-medya-composer`,
`…-uyeye-hos-geldin-maili`, `…-cadde-arayuz-onarimlari`) + 2 eski kaydın durum düzeltmesi
("Yakında" CTA'ları · Muhasebe Bütçe) + Bütçe menü kaydı ve `/admin/muhasebe/butce` route pattern'i +
`AdminDurumRaporuPage`'in yerel `UPDATES` dizisini bırakıp `ADMIN_UPDATES`'i import etmesi (599→295 satır, −317).
✅ `npm run lint` · `npx tsc --noEmit` · `npm run test` · `npm run verify:text` temiz; `git status` temiz.
⚠️ Post-commit mail hook'u yalnız **en üstteki** kaydı yolluyor — 8 kayıt için birleşik maili elle gönder.

**B02 · Devir dökümanı + plan dosyaları + toplantı raporunu commit'le** — ✅ **YAPILDI**
`ddb0bd8` (devir planı + 2 yol haritası + HTML rapor) · `c15732e` (mail bulgusu) ·
`5813127` (bugünün eksik admin-updates kayıtları + panelde görünmeme nedeni).

**B03 · `20260728090000_create_muhasebe_butce_state.sql` → `applied/`** — ✅ **YAPILDI**
Ön koşul canlıdan doğrulandı: tablo `muhasebe_butce_state` var, `schema_migrations`'ta kayıtlı
(`name` null). Dosya `applied/`'a taşındı.

**B04 · `20260729100000_notification_emails.sql` history kaydı** — ✅ **YAPILDI**
Ön koşul doğrulandı: `notification_email_outbox` canlıda var ama `schema_migrations`'ta kaydı yoktu.
`insert … values ('20260729100000','notification_emails') on conflict (version) do nothing` →
`INSERT 0 1`, toplam 325 → 326. Dosya `applied/`'a taşındı.
📌 `name` konvansiyonu: zaman damgası olmadan slug (`cadde_v1_008_city_timezones` gibi); 313/326
kayıtta dolu, elle INSERT ederken boş bırakma.

### Grup B — `member_welcome` maili canlıya (kod hazır, canlı boş)

**B05 · `20260729140000_member_welcome_email.sql` uygula** — ✅ **YAPILDI (30 Tem 12:2x)**
Canlıya uygulandı ve doğrulandı: `event_type` CHECK'i `member_welcome`'ı içeriyor,
`email.member_welcome.enabled = false` (tasarım gereği kapalı başlar), trigger/fonksiyonlar
yenilendi. History kaydı `member_welcome_email` adıyla düştü, dosya `applied/`'a taşındı.
📌 Tam denetim de yapıldı (dosyalar ↔ `schema_migrations`, CR-temizlenmiş karşılaştırma):
uygulanmamış başka migration YOK. Yetim 2 kayıt var (DB'de kayıtlı, dosyası hiç olmamış):
`20260718120001`, `20260718130001` — 18 Temmuz'daki elle history onarımının izleri, eylem gerekmez.
📌 `20260730190000_workshop_items.sql` (Cadde workshop panosu, 48 madde) **paralel oturum
tarafından** uygulanmış ve kayıtlıymış — doğrulandı (48 satır, Türkçe karakterler sağlam).
Dosya o oturumun commit'ine ait, bu oturum taşımadı.

**B06 · Mail göndericiyi Resend'den ZOHO SMTP'ye çevir + deploy** — B05 sonrası · 🔴 **KARAR NETLEŞTİ**

Olayın tam seyri (30 Temmuz, hepsi ölçüldü):

1. Commit hook'u 8 durum-raporu mailini kuyruğa aldı, 8'i de `Resend request failed: 401
   "API key is invalid"` ile düştü.
2. İlk teşhis "Resend anahtarı çürük, yenilensin" idi. **Kullanıcı düzeltti: Resend
   kullanılmıyor — Zoho'ya geçilecek.** `.env.local`'de tam set hazır:
   `ZOHO_SMTP_HOST=smtp.zoho.eu` · `ZOHO_SMTP_PORT=465` · `ZOHO_SMTP_USER` ·
   `ZOHO_SMTP_PASSWORD` · `MAIL_FROM` (+ `SUPABASE_ACCESS_TOKEN` da var → deploy mümkün).
3. Deneme sayacını `notification-email-drain` **cron'u (15 dk'da bir, jobid=3)** ilerletiyor —
   commit'ler değil. Cron'u durdurma yetkisi bu ortamda yok (`permission denied for table job`).
   Sayaç 11:28'de sıfırlandıysa da cron 12:15'e kadar 4 deneme daha yaktı → **9 kayıt `failed`**.
4. **Kayıp yok:** `failed` satırlar tabloda, payload'ları sağlam. Zoho'ya geçilince
   `update notification_email_outbox set status='pending', attempts=0 where status='failed'`
   ile diriltilip gönderilirler.

✅ **YAPILDI (30 Tem 12:52) — kuyruk boşaldı: `{"processed":11,"sent":11,"failed":0}`.**
9 durum-raporu + 2 yeni-üye maili Zoho üzerinden gitti (22 teslimat). Süreç:

1. `_shared/emails/smtp.ts` yazıldı, iki fonksiyon `sendWithResend` → `sendMailViaZohoSmtp`'ye
   çevrildi; ZOHO_* + `MAIL_FROM=update@corteqs.net` secret'ları yazıldı; deploy edildi.
2. **İlk deploy ÇÖKTÜ — kritik ders:** denomailer@1.6.0, Supabase Edge'in istek başına 2 sn
   CPU tavanını TEK gönderimde aşıyor (canlı log: "CPU Time exceeded", boot 26ms;
   `WORKER_RESOURCE_LIMIT`). Kütüphane bu runtime'da KULLANILAMAZ.
3. Çözüm: `smtp.ts` içine el yazımı minimal SMTP istemcisi (ham EHLO→AUTH LOGIN→MAIL FROM→
   RCPT→DATA; TLS native `Deno.connectTls`; gövde base64 → dot-stuffing içgüdüsel çözülür;
   Türkçe konu RFC2047; komut başına 15 sn timeout). Dış API aynı kaldı, fonksiyon kodu değişmedi.
4. Deploy öncesi 3-mercekli adversarial inceleme koştu (0 blocker): geçersiz port sessiz-skip
   ayrışması, boş html guard'ı, 465-dışı port uyarısı (Supabase 25/587'yi ENGELLİYOR),
   dokümanlardaki bayat Resend talimatları (README/.env.example/2 ops runbook) düzeltildi.

📌 Kalıcı kurallar: **Supabase Edge'de yalnız port 465 çalışır** (25/587 platform engelli) ·
**MAIL_FROM = ZOHO_SMTP_USER olmalı** (Zoho 553) · ZOHO parolası app-specific password ·
`MAX_ATTEMPTS=5 × 15 dk cron` = arızada ~1 saatlik pencere, alarm yok — gözden geçirilmeli.

**B07 · Uçtan uca tek mail testi + genel anahtarı aç** — B06 sonrası
Bildirim Ayarları → "Bana örnek hoş geldin maili gönder" → gerçek gelen kutusunda gör (tarayıcı
önizlemesi Gmail/Outlook kırpmasını göstermez).
⚠️ Genel anahtar açılmadan kaydolan üyeler maili **hiç** almaz; o sırada kuyruğa düşen kayıtlar
"atlandı" işaretlenir ve yeniden denenmez.
✅ Gerçek bir mail geldi + `notification_email_outbox`'ta `member_welcome` satırı `sent`.

### Grup C — Profil referral doğrulama + admin kullanım görünürlüğü (SONDURUM'un 1. işi)

Plan: [docs/plans/2026-07-29-profil-referral-dogrulama-admin-kullanim.md](docs/plans/2026-07-29-profil-referral-dogrulama-admin-kullanim.md)
Kararlar onaylı: mevcut tablo genişletilir · geçersiz kod reddedilir · 35 geçmiş kayıt backfill ·
kod bir kez doğrulanınca kilitlenir.
Canlı ölçüm: 36 profilde referral değeri (35'i gerçek koda karşılık geliyor) · `referral_code_usages`
41 satır / 11 kod · `sum(usage_count)` = 41 (tutarlı).

**B08 · Migration 1 — şema + RLS/grant onarımı** — B02 sonrası
`supabase/migrations/20260729120000_referral_usage_profile_support.sql`:
`submission_id` DROP NOT NULL · `user_id uuid REFERENCES auth.users` · `source` CHECK
('submission'|'profile') · UNIQUE index'lerin partial'a çevrilmesi · XOR CHECK ·
`GRANT SELECT TO authenticated` + `_admin_select` / `_self_select` politikaları
(`20260615120000` desenini birebir izle).
✅ `pg_policy`'de 2 politika, `role_table_grants`'ta `authenticated → SELECT`, mevcut 41 satır bozulmadı.

**B09 · Migration 2 — `update_profile_attribute` içine doğrulama** — B08 sonrası
`20260729121000_…`. Gövdeyi **canlı `pg_get_functiondef` dökümünden** al (elle kopyalama drift üretir).
AFS rebuild'inde kaybolan mantığı geri getir: referral alanları için `visibility := 'private'` +
`user_can_hide` atlaması (**42501 blocker'ının çözümü**) · `validate_profile_onboarding_referral_source`
yeniden bağla · `referral_code` için `validate_and_bind_referral_code` + kilit kontrolü;
hata `DETAIL`'i statüyü taşısın (`not_found`/`inactive`/`expired`/`out_of_window`/`locked`).
⚠️ Yeni parametre eklenirse eski imzayı `drop function` ile kaldır (PGRST203).
✅ `begin; … rollback;` içinde: geçerli kod yazıyor, geçersiz kod `P0001` fırlatıyor, ikinci farklı kod `locked`.

**B10 · Migration 3 — backfill + sayaç yeniden hesabı** — B09 sonrası
`20260729122000_…`. 35 eşleşen kaydı `source='profile'` INSERT (`ON CONFLICT DO NOTHING`) ·
`usage_count`/`is_used`/`used_at`'i `referral_code_usages`'tan **yeniden hesapla** ·
ön koşul assert: recompute öncesi `sum(usage_count) = count(*)` (41=41), değilse `RAISE EXCEPTION` ·
eşleşmeyen 1 serbest metin kaydı **silinmez**, `RAISE NOTICE` ile raporlanır.
✅ `source='profile'` = 35 satır; `sum(usage_count) = count(*)`.

**B11 · TS/API katmanı** — B10 sonrası
`src/lib/member-profile-api.ts`: `updateProfileAttribute` içinde `referral_code` için RPC'den önce
mevcut `validateReferralCodeBeforeSubmit` çağrısı (`full_name` özel-durum bloğunun yanına, aynı desen) +
yeni `getMyReferralCodeUsage()` (`{ code, usedAt }`, kilit durumunun kaynağı).
`src/lib/submissions.ts`: `getReferralValidationMessage`'a `locked` mesajı + RPC hatasının `details`
alanından statü çözen yardımcı.
✅ Yeni doğrulama kodu yazılmadı, mevcut yardımcılar yeniden kullanıldı.

**B12 · Profil UI** — B11 sonrası
`src/pages/ProfilePage.tsx`: `ProfileAttributeEditor` içinde `referral_code` dalı (kilitliyse
`readOnly` + "✓ Doğrulandı · tarih") · kilit verisi React Query ile ·
**`handleSaveRoleSpecificAttributes` döngüsünü hata-toleranslı yap** — bugün ilk hata tüm kaydı
çökertiyor, sıradaki alanlar kaydedilmiyor.
✅ Bir alanın hatası diğerlerini engellemiyor, sonda tek özet toast.

**B13 · Admin panel kullanım listesi** — B11 sonrası (B12'den bağımsız)
`src/pages/admin/AdminReferralPage.tsx`: `ReferralUsageRow`'a `source` + `user_id` · **hata yutmayı
bitir** (`if (error) → toast`) · virgüllü tek satır yerine liste: Ad · E-posta · Kaynak rozeti
(Ön kayıt / Profil) · Tarih; başlık "Kullanımlar (N)".
✅ Ön kayıt satırları + profil satırları doğru rozetle görünüyor; 403 sessizce yutulmuyor.

**B14 · Tipler + testler** — B12 + B13 sonrası
`src/integrations/supabase/types.ts`'e `user_id` + `source` (tercihen regen: Management API +
geçerli `SUPABASE_ACCESS_TOKEN`) · `member-profile-api.test.ts`: geçerli kod → iki RPC sırayla /
geçersiz kod → `update_profile_attribute` **çağrılmıyor** / kilitli → reddediliyor ·
`submissions.test.ts`: `locked` mesaj eşlemesi.
✅ `npm run test` yeşil, `npx tsc --noEmit` 0 hata.

### Grup D — Revizyon panosu mutabakatı (Faz 1)

Plan: [docs/plans/2026-07-30-revizyon-istekleri-pano-mutabakati.md](docs/plans/2026-07-30-revizyon-istekleri-pano-mutabakati.md)
Canlı: **53 madde · 43 açık · 6 yapıldı · 4 iptal · 10 yorum · 4 ek.** 43 açığın 14'ü kodda bitmiş.

**B15 · 14 maddeyi kanıtla `inceleniyor`a çek** — ✅ **YAPILDI (30 Tem)** — kuru koşu + gerçek
uygulama birebir: `acik` 43→29, `inceleniyor` 0→14, her maddede kanıt yorumu.
Sonrasında B17-B21 düzeltmeleriyle 4 madde daha çekildi: **güncel durum `acik` 25 · `inceleniyor` 18.**
(Orijinal tanım aşağıda arşiv olarak durur:)
Tek SQL geçişi: her maddeye kanıt yorumu (`revision_request_comments`) + `status='inceleniyor'`.
Kanıt tablosu planın Faz 1 bölümünde (kapasite · temalar · marka koruması · Çarşı foto/video ·
composer · hashtag/mention · Cafe'ler başlığı · `/feedback` linki · saat çipleri · scroll · şehir
filtresi · billboard). **`yapildi` DEĞİL `inceleniyor`** — kod main'de, canlıya çıkmadı; pano yalan söylemesin.
12-13-14 kısmi: hangi kısmın bittiği açık yazılır.
Migration değil, veri güncellemesi — `schema_migrations` kaydı gerekmez. Önce `begin; … rollback;`.
✅ `acik` 43→29, `inceleniyor` 0→14; her maddede kanıt yorumu var.

**B16 · "Muhtemelen bitmiş" 3 maddeyi cihazda doğrula** — B15 sonrası
`FinalCtaSection.tsx:32` zaten "şekillendiren sisteme katıl" diyor · `CaddePage.tsx:805-824`
zaten `text-balance` + `clamp` ("'Ol' tek başına kalmış") · ABD şehir kapsamı (`cbc64f7` sonrası).
✅ Doğrulananlar Faz 1'e alınır, doğrulanmayanlar gerekçesiyle açık kalır. Tahminle dokunulmaz.

### Grup E — Faz 2A: veri/SQL düzeltmeleri

Beklentiden farklı nokta: **Araçlar modülünün soruları ve CTA'ları koda değil DB'ye gömülü.**

**B17 · Kırık CTA href'leri + slug regresyonu** — ✅ **YAPILDI (30 Tem, mig `20260730200000`)**
Sürpriz: CTA'lar tabloda değil 9 skorlama fonksiyonunun GÖVDESİNDE. Drift'siz onarım: canlı
`pg_get_functiondef` → replace → execute. 9 fonksiyon + 7 kalıcı sonuç kaydı düzeltildi;
son kontrol tüm `/tools/<slug>` hedeflerini canlı slug listesiyle doğruladı. (Orijinal tanım:)
`/relocation/tools/<slug>` → `/tools/<slug>` (route `/relocation/tools/*` **hiç yok**,
`App.tsx:169` `/tools/:toolSlug`) — `20260701120000_relocation_tools_20q_normalize.sql:723-727`.
**Bonus:** `yurtdisi-is-bulma-olasiligi` → `is-bulma-olasiligi` (aynı dosya `:479, :2015, :2313`) —
`20260626240000_relocation_tools_cta_fixes.sql` bunu düzeltmişti, `20q_normalize` geri getirmiş.
⚠️ Bu dosyaya dokunan her değişiklik aynı geri-alma riskini taşıyor; önceki CTA fix migration'ları
okunmadan değiştirilmemeli.
✅ `like '/relocation/tools/%'` → 0 satır; slug tek biçimde.

**B18-B19 · Meslek + şehir seed + ülke normalizasyonu** — ✅ **YAPILDI (30 Tem, mig `20260730210000`)**
Meslek 5→**35** (soru seçenekleri artık tablodan türetiliyor — ikinci kopya listesi kalktı);
şehir 2→**32** (GB=4, 12 ülke; endeksler küratörlü ilk tahmin). Üçüncü kök neden de bulundu:
ülke girişi SERBEST METİN (QuestionRenderer MVP fallback) — "UK" yazınca ISO "GB" eşleşmiyordu.
`city_match` artık yaygın yazımları ISO'ya çeviriyor (UK/İngiltere→GB, USA/ABD→US, Almanya→DE…)
ve hedef ülkede veri yoksa boş dönmek yerine diğer şehirlere fallback yapıp durumu açıklamada
söylüyor (B23'ün SQL yarısı da burada kapandı).

**B20 · `search_directory_catalog` admin/yönetici dışlaması** — ✅ **YAPILDI (30 Tem, mig `20260730220000`)**
Bireysel dala `Admin_%`/`Moderator_%` rol sahiplerini dışlayan NOT EXISTS eklendi (çapa-tabanlı
drift'siz yama, `is_admin` ile aynı desen). Not: ölçümde açık profilli yönetici 0'dı — koruma
önleyici; orijinal vaka muhtemelen sonradan kapanmış. Deploy sonrası aramayla teyit edilmeli.

### Grup F — Faz 2B: frontend düzeltmeleri

**B21 · `ResultCtaPanel` CTA'larını çalıştır** — ✅ **YAPILDI (30 Tem)** — "Yakında" kilidi
kaldırıldı, 3 CTA gerçek `Link` (kilit koşulu B17 ile sağlandı); test yeni davranışı kilitliyor
(link href'leri + rozet yokluğu + onCtaClick). (Orijinal tanım:)
`src/components/relocation/tools/ResultCtaPanel.tsx:36`: `disabled` **sabit kodlu**, `Link`/`navigate`
hiç yok, `onCtaClick` hiçbir çağırandan geçilmiyor → **3 CTA'nın tamamı tıklanamaz.** Pano "ikisi
kırık" diyor, gerçek durum daha kötü. `ResultCtaPanel.test.tsx:25-48` bu davranışı kilitliyor → test de güncellenir.
✅ 4 CTA tıklanabilir ve doğru route'a gidiyor; test yeni beklentiyle geçiyor.

**B22 · Sonuç sayfasına geri dönüş** — ✅ **YAPILDI (30 Tem)** — sonuç üretilince adres çubuğu
kalıcı `/tools/:slug/result/:resultId` rotasına `replaceState` ile çevriliyor (CTA ile gidip
GERİ dönünce ya da F5'te sonuç kaybolmuyor); kayıtlı sonuç sayfasına "Tekrar Çöz" eklendi.
(Orijinal tanım:)
Sonuç `relocation_tool_results`'ta kalıcı (`result_id`) ve `/tools/:toolSlug/result/:resultId` route'u
**zaten var** (`App.tsx:185`, `useRelocationToolSession.ts:40`) → şema değişikliği yok, düşük maliyet.
✅ Dizine gidip geri dönünce sonuç kaybolmuyor.

**B23 · `city_match` boş sonuç fallback'i** — ✅ **YAPILDI (B18-B19 içinde, SQL tarafında)**
Hedef ülkede veri yoksa fonksiyon tüm aktif şehirlere düşüyor, payload'a
`fallback_no_target_match=true` koyuyor ve açıklama satırı durumu söylüyor — açıklamaları
`ToolResultView` zaten render ettiği için ayrıca UI değişikliği gerekmedi. Boş ekran kalmadı.

**B24 · Cadde like/destek hover-card** — ⏭️ **BİLİNÇLİ YAPILMADI (workshop üst yazması)**
30 Tem Cadde workshop kararı (panosu m19-20): "Tepki ver" yazısı kalkacak, tepki emojileri
LinkedIn tarzı DOĞRUDAN açık duracak — popover/hover tamamen kalkıyor. Hover-card yazmak hemen
silinecek kod olurdu. Pano maddesine (55a55bdf) üst-yazma yorumu düşüldü, statü bilinçli açık —
çözüm cadde redesign kapsamında.

### Grup G — Yayına alma

**B25 · Coolify deploy + doğrulama + gerçek cihaz QA** — B07, B14, B24 sonrası
Kuyrukta biriken her şey: bildirim altyapısı · Cadde V1 · hoş geldin maili · bugünün tüm batch'leri.
`BASE_URL=https://corteqs.net npm run verify:release`.
Gerçek cihaz QA (Cadde V1'in doğrulanmamış kalemleri): dosya yükleme uçtan uca · mention bildiriminin
gerçekten gitmesi · F5 sonrası scroll konumu · saat çiplerinin dakika geçişi · marka sahipliğiyle cafe açma.
Deploy sonrası B15'te `inceleniyor` yapılan maddeler **`yapildi`**'ya çekilebilir.
✅ `verify:release` geçti + QA listesi işaretlendi.

## 1.5 Paralel workshop oturumu entegrasyonu (30 Tem öğleden sonra)

Aynı gün ikinci bir oturum Cadde workshop'unu işledi: `caddeworkshdp.md` (92 dk Zoom transkripti)
→ 48 maddelik `/admin/workshop/cadde` panosu. Migration `20260730190000` canlıda + kayıtlı,
kod `902cadc` ile main'de. O oturumun devir notlarındaki açık işler buraya alındı:

**Çözüldü (bu oturum cevapladı):**
- ~~"Sahipsiz staged rename / `20260729140000` history'de yok"~~ → **çelişki yok.** O sorgu bu
  oturumun 12:2x'teki B05 uygulamasından ÖNCEYDİ. Taze teyit: `20260729140000 | member_welcome_email`
  kayıtlı, dosya `applied/`'da, commit `aea4991`.
- ~~`20260728090000` name boşluğu~~ → `create_muhasebe_butce_state` yazıldı.

**Karar bekleyen (kullanıcıya):**
- **Freeze branch:** workshop'ta (1:01:10) "bu haline branch açacağım, bu hali donacak" denildi.
  Cadde redesign'ına başlanmadan `cadde-pre-workshop-freeze` gibi bir snapshot branch açılmalı mı?
  (Ucuz + güvenli; redesign başlamadan yapılırsa anlamlı.)
- **`caddeworkshdp.md` yeri:** kökte untracked; workshop oturumunun önerisi `docs/cadde-300/` altına
  taşıyıp commit'lemek. Kullanıcı bu oturumda "kalsın" dedi (silinmesin anlamında) — taşıma onayı ayrı.
- **Ürün kararları (panoda madde olarak var, cevabı yok):** m42 featured etkinlik manuel/otomatik ·
  m3 kafe ikonu tasarım önerisi · m20 tepki emoji seti (negatifler kalsın mı) · m13 tag rezervde.

**Teknik borçlar (workshop oturumundan):**
- `workshop_items` `types.ts`'te yok → `LooseQuery` cast (B14'teki types regen'e eklenecek).
- UBT/Burak checkbox'larında kimlik bağlaması yok — bilinçli sadelik; kısıt istenirse sonra.
- Migration versiyonu seçmeden önce canlı `schema_migrations`'a bak (çakışma dersi: workshop mig'i
  `…120000` → `…190000`'e taşınmak zorunda kaldı).

## 2. Bu 25 batch'in dışında — bilinçli park

**Ürün kararı bekleyen (~16 madde):** kullanıcı paneli tasarımı · RADAR ikinci el ilan fikri ·
RADAR item metinleri · CADDE mascot billboard · CADDE "excel gibi duruyor" estetiği · kategori kart
gösterimi · relokasyon "Yakında" bandı · haritada daha çok nod · haberler ülke/şehir filtresi ·
arama kutusunda diaspora vs diaspora+TR ayrımı.
Kullanıcı açıkça parketti: **tool sayfası tagline'ı** (istenen metin kod tabanında hiç geçmiyor,
3 aday var) · **"filtre ekranında ara butonu yok"** (Cadde'de metin arama barı hiç yok, filtreler
`onChange` ile anında uygulanıyor — kastedilen ekran belirsiz).
Yeri saptanamayan 2 madde (tahminle dokunulmaz): PROFİL yazım hataları · RADAR "Experimental kalmış".

**Ayrı spec gerektiren büyük iş (~7 madde):** billboard/sponsorlu talep formu · hizmet sağlayıcı teklif
havuzu · test sonucunu profile kaydetme · görselli renkli grafikler · ISO ülke-şehir drill-down ·
**MUHASEBE ▸ BÜTÇE Ö6** (panonun en yüksek öncelikli maddesi: geçmiş gider çekme + bütçeyi seçilen
kura çevirme + fiş/fatura görselinden OCR).

**Cadde Faz 2/3:** event · follow · moderasyon · bildirim genişletmesi · AI feed · presence · köprü ·
trust · Stripe. Plan var, kod yok.

**Referral kapsam dışı:** `/login?ref=KOD` link akışı ölü · üye-üye referral (`AmbassadorReferralCard`
hiçbir yere mount edilmemiş) · `/businesses`, `/consultants`, `/bloggers`, `/kariyer` sayfalarındaki
`InterestForm` referral alanı dekoratif (input'un `name`'i/state'i yok).

⚠️ **`cadde.carsi.paid_mode` açılmaz** — gerçek ödeme akışı hazır olmadan açılırsa ilanlar taslakta
kalır ve kullanıcı ilanını hiçbir şekilde yayınlayamaz (CLAUDE.md Cadde kuralı).

## 3. Taşınan teknik notlar (yeni oturumun bilmesi gerekenler)

- **Türkçe hashtag/lower:** hem JS hem PostgreSQL `lower()`'ı "İ"yi `i + U+0307` yapıyor. Çözüm iki
  tarafta da aksanı ÖNCE düşürmek: SQL `lower(unaccent(x))`, TS `trFold`. Ayna testleri
  `src/lib/cadde-text.test.ts` (beklenen değerler canlı DB'den ölçüldü).
- **RPC imza yönetimi:** yeni parametre eklerken eski imzayı `drop function` ile kaldır (PGRST203).
  Fonksiyon gövdesini elle kopyalama — canlı `pg_get_functiondef` dökümünü yamala.
- **Migration history ≠ canlı şema:** bir migration hata verdiğinde önce "zaten uygulanmış mı" diye
  canlı şemayı sorgula; doğrulamayı `begin; … rollback;` içinde yap. Tablonun var olması
  `schema_migrations` kaydı olduğu anlamına gelmez.
- **psql + Windows:** Türkçe içerikli SQL'i komut satırından geçirme (ı→i bozulur) — daima UTF-8
  dosya olarak `psql -f`, ya da `U&'…\0131…'` unicode escape.
- **Durum-raporu mail hook'u** yalnız en üstteki kaydı yolluyor; aynı güne çok kayıt girilirse
  birleşik maili elle gönder.
- **`admin-updates.ts` ↔ `AdminDurumRaporuPage.tsx`** artık iki ayrı dizi **değil**: B01'deki
  tekilleştirmeden sonra sayfa `ADMIN_UPDATES`'i import ediyor. Eski "senkron tutulmalı" notu geçersiz.
