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

**B05 · `20260729140000_member_welcome_email.sql` uygula** — B04 sonrası
Canlıda **hiçbir şey yok**: `notification_email_outbox`'ta yalnız `admin_update` (97 kayıt).
`--single-transaction` ile uygula → history INSERT → `applied/`'a taşı.
✅ Welcome fonksiyonu/trigger'ı canlıda; `supabase/migrations/` kökü boş.

**B06 · Edge Function deploy + `RESEND_API_KEY`'i YENİLE** — B05 sonrası · 🔴 **ACİL, SÜRE SINIRLI**

30 Temmuz'da canlı kuyruktan ölçüldü — sorun tahmin değil, teşhis edildi:

```
notification_email_outbox: 97 skipped · 8 pending
last_error: Resend request failed: 401 {"statusCode":401,
            "name":"validation_error","message":"API key is invalid"}
```

`RESEND_API_KEY` fonksiyon ortamında **var ama GEÇERSİZ** (401). Yani "secret eksik" değil,
"secret çürük" — anahtarın Resend panelinden yenilenip `supabase secrets set` ile yazılması gerekiyor.

⏳ **Süre sınırı:** `send-notification-emails/index.ts:36` `MAX_ATTEMPTS = 5`. Bugünkü 8 kayıt
`attempts = 1`. Deneme sayacı **yalnızca `admin-updates.ts`'e yeni kayıt ekleyen commit'lerde**
ilerliyor — post-commit hook yeni kayıt bulmazsa dispatcher'ı hiç tetiklemiyor (ölçüldü:
`c15732e` commit'i `0 yeni kayıt` deyip sayacı ilerletmedi). Sıradan kod commit'leri güvenli.
5'e ulaşan kayıt `failed` olur ve bir daha denenmez → o mailler kalıcı olarak kaybolur.

✅ Anahtar yenilendikten sonra dispatcher elle tetiklenir → 8 kayıt `sent` olur
(`pending` oldukları için hâlâ kurtarılabilir durumda) + `supabase secrets list` `MAIL_FROM` ve
Zoho SMTP anahtarlarını da gösteriyor.
📌 Ayrıca `MAX_ATTEMPTS` mantığı gözden geçirilmeli: bir commit'in mail denemesi yakması, "kod
yazma hızı" ile "mail altyapısının sağlığı"nı birbirine bağlıyor — istenen davranış bu değil.

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

**B15 · 14 maddeyi kanıtla `inceleniyor`a çek** — B02 sonrası (Grup C'den bağımsız)
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

**B17 · Kırık CTA href'leri + slug regresyonu** — B15 sonrası
`/relocation/tools/<slug>` → `/tools/<slug>` (route `/relocation/tools/*` **hiç yok**,
`App.tsx:169` `/tools/:toolSlug`) — `20260701120000_relocation_tools_20q_normalize.sql:723-727`.
**Bonus:** `yurtdisi-is-bulma-olasiligi` → `is-bulma-olasiligi` (aynı dosya `:479, :2015, :2313`) —
`20260626240000_relocation_tools_cta_fixes.sql` bunu düzeltmişti, `20q_normalize` geri getirmiş.
⚠️ Bu dosyaya dokunan her değişiklik aynı geri-alma riskini taşıyor; önceki CTA fix migration'ları
okunmadan değiştirilmemeli.
✅ `like '/relocation/tools/%'` → 0 satır; slug tek biçimde.

**B18 · `relocation_professions` seed genişletme** — B17 sonrası
Canlı tablo **5 kayıt** → "Meslek seçeneği az" maddesi literal doğru.
✅ Yeni sayı raporlandı, araç formunda görünüyor.

**B19 · `relocation_locations` seed genişletme** — B17 sonrası
Canlı tablo **2 kayıt** (1×DE, 1×NL) → "UK'de şehir bulunamadı" maddesinin **gerçek kök nedeni**.
Fallback tek başına çözmez (bkz. B23).
✅ UK dahil çoklu ülke şehir dönüyor.

**B20 · `search_directory_catalog` admin/yönetici dışlaması** — B17 sonrası
Canlı fonksiyonda **admin filtresi yok**; dizin listesi TS'ten değil bu RPC'den geliyor
(`catalog-directory.ts:191`) → düzeltme SQL tarafında.
✅ `/directory` aramasında yönetici hesapları görünmüyor.

### Grup F — Faz 2B: frontend düzeltmeleri

**B21 · `ResultCtaPanel` CTA'larını çalıştır** — B17 sonrası
`src/components/relocation/tools/ResultCtaPanel.tsx:36`: `disabled` **sabit kodlu**, `Link`/`navigate`
hiç yok, `onCtaClick` hiçbir çağırandan geçilmiyor → **3 CTA'nın tamamı tıklanamaz.** Pano "ikisi
kırık" diyor, gerçek durum daha kötü. `ResultCtaPanel.test.tsx:25-48` bu davranışı kilitliyor → test de güncellenir.
✅ 4 CTA tıklanabilir ve doğru route'a gidiyor; test yeni beklentiyle geçiyor.

**B22 · Sonuç sayfasına geri dönüş** — B21 sonrası
Sonuç `relocation_tool_results`'ta kalıcı (`result_id`) ve `/tools/:toolSlug/result/:resultId` route'u
**zaten var** (`App.tsx:185`, `useRelocationToolSession.ts:40`) → şema değişikliği yok, düşük maliyet.
✅ Dizine gidip geri dönünce sonuç kaybolmuyor.

**B23 · `city_match` boş sonuç fallback'i** — **B19 + B21 sonrası**
`ToolResultView.tsx:91-96` + SQL `relocation_score_city_match_v1` boşaltan filtre (`20q_normalize:891-893`).
B19'daki şehir seed'iyle **birlikte** anlam kazanır.
✅ Eşleşme yoksa en yakın N şehir gösteriliyor, boş ekran yok.

**B24 · Cadde like/destek hover-card** — B15 sonrası (bağımsız)
`CaddePage.tsx:582-632` — popover var, hover yok; hazır `components/ui/hover-card.tsx` kullanılır,
yeni bağımlılık gerekmiyor.
✅ Hover'da destekleyenler görünüyor.

### Grup G — Yayına alma

**B25 · Coolify deploy + doğrulama + gerçek cihaz QA** — B07, B14, B24 sonrası
Kuyrukta biriken her şey: bildirim altyapısı · Cadde V1 · hoş geldin maili · bugünün tüm batch'leri.
`BASE_URL=https://corteqs.net npm run verify:release`.
Gerçek cihaz QA (Cadde V1'in doğrulanmamış kalemleri): dosya yükleme uçtan uca · mention bildiriminin
gerçekten gitmesi · F5 sonrası scroll konumu · saat çiplerinin dakika geçişi · marka sahipliğiyle cafe açma.
Deploy sonrası B15'te `inceleniyor` yapılan maddeler **`yapildi`**'ya çekilebilir.
✅ `verify:release` geçti + QA listesi işaretlendi.

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
