# Bildirim E-postaları — Devir Notu (2026-07-29)

Yeni üye kaydı ve admin güncellemeleri için abonelik tabanlı e-posta bildirimi
**+ üyeye giden hoş geldin maili** (aynı gün eklendi, aşağıda ayrı bölüm).

| Olay tipi | Ne zaman | Alıcı | Genel anahtar |
|---|---|---|---|
| `new_member` | üye e-postasını doğrulayınca | abone admin/moderator'lar | `email.new_member.enabled` |
| `admin_update` | `admin-updates.ts`'e kayıt girilince | abone admin/moderator'lar | `email.admin_update.enabled` |
| `member_welcome` | üye e-postasını doğrulayınca | **üyenin kendisi** | `email.member_welcome.enabled` |

Üçü de aynı outbox kuyruğunu, aynı dedupe/retry/claim garantilerini paylaşır. Tek fark
`member_welcome`'ın alıcısının payload'dan gelmesidir — abone listesine hiç bakılmaz.

## DURUM (2026-07-29 son güncelleme)

| Adım | Durum |
|---|---|
| 1. Migration canlıya uygulandı | ✅ **YAPILDI** — 3 tablo, 8 fonksiyon, trigger, pg_cron job aktif |
| 2. Seed (`--seed-only`) | ✅ **YAPILDI** — 94 satır, hepsi `skipped` (doğrulandı) |
| 3. Edge Function deploy | ✅ **YAPILDI** |
| 4. `NOTIFY_DISPATCH_SECRET` secret'ı | ✅ **YAPILDI** |
| 5. `dispatch.url` / `dispatch.secret` satırları | ✅ **YAPILDI** — uçtan uca doğrulandı (aşağıda) |
| 6. Commit + Coolify deploy | ❌ **SIRADAKİ** |
| 7. Panelden anahtarları açma | ❌ YAPILMADI |

### Doğrulanan boru hattı (2026-07-29)

- Doğru secret ile → `HTTP 200 {"processed":0,"sent":0,"skipped":0,"failed":0}` (5 ardışık çağrı)
- Yanlış secret ile → `HTTP 401 {"error":"unauthorized"}`
- Yani Edge Function secret'ı ↔ `.env.local` ↔ DB `dispatch.secret` üçü de eşleşiyor.

**İlk çağrıda 502 alınırsa panik yok:** Edge Function soğuk başlangıcında geçici olarak
502 dönebiliyor; ikinci çağrıda düzeliyor.

**Şu an mail gönderimi FİİLEN İMKÂNSIZ** (güvenli durum): genel anahtarların ikisi de `false`
ve bekleyen kayıt yok (94'ünün hepsi `skipped`).

pg_net ve pg_cron **ikisi de kurulu çıktı**, `net.http_post` erişilebilir → 5. adımdan sonra
anlık gönderim çalışacak.

## Ne değişti

Eski akış: `.git/hooks/post-commit` → `scripts/notify-admin-updates.mjs` → Zoho SMTP →
kodda gömülü 3 adres. Üç sorunu vardı: yalnız geliştirici makinesinde çalışıyordu, alıcı
listesi koddaydı, ve regex parse ettiği için **yalnızca en üstteki kaydı** yolluyordu.

Yeni akış (outbox deseni — `notification_email_outbox` tek gerçek kaynak):

```
auth.users trigger'ı ─────────────►  notification_email_outbox  ─────► send-notification-emails
npm run sync:admin-updates ───────►  (dedupe_key UNIQUE)                (Edge Function + Resend)
                                             ▲
             tetikleyiciler: pg_net poke (anlık) · admin panel butonu · pg_cron (15 dk emniyet)
```

`dedupe_key` UNIQUE kısıtı hem "aynı üyeye iki mail" hem "aynı güncellemeyi iki kez yollama"
durumunu imkânsız kılar. `claim_notification_emails` RPC'si `for update skip locked` ile
çalışır, üç tetikleyici aynı anda gelse bile çift gönderim olmaz.

## Dosyalar

| Dosya | Durum |
|---|---|
| `supabase/migrations/20260729100000_notification_emails.sql` | YENİ — 3 tablo, 7 fonksiyon, auth.users trigger'ı |
| `supabase/functions/send-notification-emails/index.ts` | YENİ — kuyruk drenajı + Resend |
| `supabase/config.toml` | `verify_jwt = false` (fonksiyon kendi yetkisini yapar) |
| `scripts/sync-admin-updates.mjs` + `scripts/admin-update-outbox.mjs` | YENİ — regex parse yerine doğrudan TS import |
| `scripts/notify-admin-updates.mjs` | **SİLİNDİ** (nodemailer bağımlılığı da kaldırıldı) |
| `.git/hooks/post-commit` | Artık `sync-admin-updates.mjs` çağırıyor |
| `src/lib/admin-shell/notification-settings-api.ts` | YENİ — RPC sarmalayıcıları |
| `src/pages/admin/AdminNotificationSettingsPage.tsx` | YENİ — `/admin/notifications` |
| `routes.tsx` · `admin-route-meta.ts` · `admin-navigation-registry.ts` | Route üç yere de kaydedildi |

## Canlıya alma adımları (SIRAYLA)

### 1. Migration
```bash
supabase db push   # veya pooler üzerinden: psql -f supabase/migrations/20260729100000_notification_emails.sql
```
Doğrula:
```sql
select key, value from public.notification_settings;              -- 2 satır, ikisi de false
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
-- on_auth_user_created_assign_role VE on_auth_user_created_notify_email görünmeli
select extname from pg_extension where extname in ('pg_net','pg_cron');
```

### 2. Edge Function + secrets
```bash
supabase functions deploy send-notification-emails
supabase secrets set NOTIFY_DISPATCH_SECRET="<uzun rastgele değer>"
supabase secrets set RESEND_API_KEY="..." MAIL_FROM="..." MAIL_TO_ADMIN="..." MAIL_REPLY_TO="..."
```

> ⚠️ **RESEND_API_KEY / MAIL_FROM Edge Function ortamında TANIMLI DEĞİLDİ** (2026-07-29'da
> `supabase secrets list` ile tespit edildi, aynı gün eklendi). Bunlar `.env.local`'de olmak
> gönderim için YETMEZ — Edge Function'lar yalnız kendi secret'larını görür. Eksikken fonksiyon
> `{"skipped":true,"reason":"mail_config_missing"}` dönüp **sessizce hiç mail göndermiyordu**.
>
> **Yan bulgu:** aynı üç secret `send-submission-email` için de gerekli ve onlar da eksikti →
> form başvuru bildirim mailleri de sessizce atlanıyormuş. Artık tanımlı; bir test başvurusuyla
> doğrulanmalı.

### 3. Dispatcher config (DB tarafı — pg_net poke için)

Önce `.env.local`'e `NOTIFY_DISPATCH_SECRET=<adım 2'deki değer>` satırını ekle, sonra **tek komut**:

```powershell
.\scripts\setup-notification-dispatch.ps1
```

Script `.env.local`'i yükler, sırrı doğrular (boş / 16 karakterden kısa / yer tutucu ise durur),
`dispatch.url` + `dispatch.secret` satırlarını yazar ve Edge Function'ı çağırıp **fonksiyon
secret'ı ile DB'dekinin eşleştiğini kanıtlar** (200 = tamam, 401 = uyuşmuyor). Sır hiçbir
aşamada ekrana basılmaz.

> **Neden script:** çok satırlı PowerShell komutlarını konsola yapıştırmak `PS>` prompt'ları ve
> `` ` `` devam karakterleriyle birlikte kopyalanınca bozuluyor. Tek satır bu sınıf hatayı bitiriyor.

`.env.local`'deki satır ayrıca post-commit hook'un dispatcher'ı tetikleyebilmesi için gerekli
(yoksa kayıt kuyrukta bekler, pg_cron 15 dk içinde alır).

### 4. ⚠️ Seed (ZORUNLU — atlanırsa 94 tarihsel kayıt maillenir)
```bash
npm run sync:admin-updates -- --seed-only
```
Ağ üzerinden çalışmazsa aynı sonucu veren hazır SQL:
```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/manual/2026-07-29_seed_notification_outbox_backfill.sql
```
Doğrula: `select status, count(*) from notification_email_outbox group by status;`
→ 94 satır, hepsi `skipped`, **hiç mail gitmemiş olmalı**.

**Not:** Script'te yapısal koruma var — kuyrukta hiç `admin_update` kaydı yokken normal modda
çalıştırılırsa DURUR ve `--seed-only` çalıştırmanı söyler. Yani bu adımı unutmak artık toplu
mail göndermez, sadece hata verir.

### 5. Frontend deploy + anahtarları aç
Coolify deploy sonrası `/admin/notifications` → genel anahtarları ve kendi aboneliğini aç.

## Kabul testi (deploy sonrası)

1. Tek kullanımlık adresle `/login`'den kayıt ol → **doğrulama mailini onayla** → bildirim maili gelmeli; outbox satırı `sent`, `recipient_count = 1`
2. `admin-updates.ts`'e **aynı commit'te iki kayıt** ekle → ikisi de mail olmalı (eski kusurun regresyon testi)
3. Genel anahtarı kapat → yeni kayıt at → outbox `skipped`, mail gitmemeli
4. pg_net yoksa: kayıt `pending` kalır → panelde "Şimdi gönder" → `sent` olmalı

---

# Hoş geldin maili (`member_welcome`) — 2026-07-29 eki

Üye e-postasını doğruladığı anda **kendisine** markalı, Türkçe bir karşılama maili gider.
Supabase Auth'un standart doğrulama maili değişmedi; bu ondan SONRA gelen ayrı bir maildir.

## Dosyalar

| Dosya | Durum |
|---|---|
| `supabase/migrations/20260729140000_member_welcome_email.sql` | YENİ — CHECK genişletme, anahtar, trigger + 2 RPC güncellemesi |
| `supabase/functions/_shared/emails/member-welcome.ts` | YENİ — şablonun TEK kaynağı (subject + html + text) |
| `supabase/functions/_shared/emails/html.ts` | YENİ — ortak `escapeHtml` |
| `supabase/functions/send-notification-emails/index.ts` | `member_welcome` dallanması, `reply_to`, `text`, örnek mail uçları |
| `scripts/preview-emails.mjs` + `npm run preview:emails` | YENİ — tarayıcı önizlemesi |
| `notification-settings-api.ts` · `useNotificationSettings.ts` · `AdminNotificationSettingsPage.tsx` | 3. anahtar + "Bana örnek hoş geldin maili gönder" |
| `vitest.config.ts` · `scripts/verify-text-encoding.mjs` | `supabase/` artık test ve encoding denetimine dahil |

## Canlıya alma (SIRAYLA)

```bash
supabase db push        # ya da: psql -f supabase/migrations/20260729140000_member_welcome_email.sql
supabase functions deploy send-notification-emails
# ardından Coolify deploy (frontend)
```

Doğrula:
```sql
select key, value from public.notification_settings;   -- 3 anahtar, member_welcome false
select pg_get_constraintdef(oid) from pg_constraint
  where conrelid = 'public.notification_email_outbox'::regclass and contype = 'c';
  -- 'member_welcome' listede görünmeli
```

Sonra `/admin/notifications` → **"Bana örnek hoş geldin maili gönder"** → Gmail + Outlook'ta
gözle kontrol → onaylayınca **"Hoş geldin maili açık"** anahtarını aç.

> Anahtar açılana kadar kuyruğa düşen `member_welcome` satırları `skipped` olur ve **bir daha
> denenmez**. Yani anahtarı açmadan önce kaydolan üyeler bu maili hiç almaz — beklenen davranış.

## Şablonu değiştirmek

Metin/tasarım `supabase/functions/_shared/emails/member-welcome.ts` içindedir (DB'de değil).
Değiştirdikten sonra:

```bash
npm run preview:emails   # .preview-emails/index.html → tarayıcıda aç
npm run test -- supabase/functions/_shared
supabase functions deploy send-notification-emails
```

**E-posta HTML'i web HTML'i değildir.** Outlook (Windows) Word render motoru kullanır, Gmail
`<style>` bloğunun çoğunu siler. Şablonun başındaki kural listesini okumadan yapıyı değiştirme:
table tabanlı 600px yerleşim, inline CSS, hex renkler, her `<img>` için `alt`, düz metin sürümü.
Tarayıcı önizlemesi bu kırpmaları GÖSTERMEZ — yayına almadan önce mutlaka örnek mail gönder.

## Bilinen sınırlar

- **`types.ts` bayat** — yeni tablolar tiplenmedi, API katmanı `as never` cast kullanıyor
  (revision-requests.ts ile aynı yaklaşım). Migration sonrası `supabase gen types` ile yenile.
- **Doğrulanmamış kayıtlar mail üretmez** — trigger yalnız `email_confirmed_at` NULL→NOT NULL
  geçişinde çalışır. Sahte kayıt gürültüsünü keser; "kaydoldu ama mail gelmedi" şikayetinin
  cevabı büyük ihtimalle doğrulanmamış e-postadır.
- **Trigger asla kaydı bloklamaz** — gövde `exception when others then return new` ile sarılı.
  Bildirim yazımı hata verirse kullanıcı yine de kaydolur, bildirim sessizce düşer.
- Deneme hakkı 5; sonrasında kayıt `failed` olur ve otomatik denenmez.
