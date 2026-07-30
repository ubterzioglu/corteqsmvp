# Hoş Geldin Maili — Yapılacaklar

**Durum (2026-07-29):** Kod tamam, testler geçti. **Canlıda hiçbir şey yok.**
Migration uygulanmadı, Edge Function deploy edilmedi, commit atılmadı.

Detaylı teknik anlatım: [2026-07-29-bildirim-e-postalari-devir.md](./2026-07-29-bildirim-e-postalari-devir.md)
(hoş geldin eki bölümü).

---

## Ne yapıldı (özet)

Üye e-postasını doğruladığı anda **kendisine** markalı Türkçe karşılama maili giden
`member_welcome` olay tipi eklendi. Mevcut `new_member` bildirimi adminlere gitmeye devam ediyor —
bu ondan ayrı bir mail.

Yeni boru hattı kurulmadı: mevcut `notification_email_outbox` altyapısı (dedupe, retry, panel
logu, aç/kapa anahtarı) olduğu gibi kullanıldı. Tek fark alıcının payload'dan gelmesi.

| Dosya | Durum |
|---|---|
| `supabase/migrations/20260729140000_member_welcome_email.sql` | YENİ — uygulanmadı |
| `supabase/functions/_shared/emails/member-welcome.ts` | YENİ — şablonun tek kaynağı |
| `supabase/functions/_shared/emails/html.ts` | YENİ — ortak `escapeHtml` |
| `supabase/functions/send-notification-emails/index.ts` | değişti — deploy edilmedi |
| `scripts/preview-emails.mjs` + `npm run preview:emails` | YENİ |
| `notification-settings-api.ts` · `useNotificationSettings.ts` · `AdminNotificationSettingsPage.tsx` | 3. anahtar + örnek mail butonu |
| `vitest.config.ts` · `scripts/verify-text-encoding.mjs` | `supabase/` test + encoding denetimine dahil edildi |
| `docs/operations/2026-07-29-bildirim-e-postalari-devir.md` | hoş geldin eki eklendi |

---

## YAPILACAKLAR (sırayla)

### 1. Migration'ı canlıya uygula

```bash
supabase db push
# veya pooler üzerinden:
# psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260729140000_member_welcome_email.sql
```

Doğrula:

```sql
-- 3 anahtar olmalı, member_welcome false
select key, value from public.notification_settings;

-- CHECK içinde 'member_welcome' görünmeli
select pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.notification_email_outbox'::regclass and contype = 'c';

-- trigger yerinde mi (ikisi de listede olmalı)
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
```

> Migration `enqueue_new_member_notification` ve `get_admin_notification_state` fonksiyonlarını
> `create or replace` ile günceller. Mevcut `new_member` davranışı değişmez.

### 2. Edge Function deploy

```bash
supabase functions deploy send-notification-emails
```

Secret'ları **doğrula** (varsaymak yasak — bir kez eksik çıkıp mailler sessizce atlanmıştı):

```bash
supabase secrets list
# ZOHO_SMTP_HOST, ZOHO_SMTP_PORT, ZOHO_SMTP_USER, ZOHO_SMTP_PASSWORD,
# MAIL_FROM, MAIL_REPLY_TO, NOTIFY_DISPATCH_SECRET görünmeli
# (2026-07-30: Resend bırakıldı, gönderim Zoho SMTP — MAIL_FROM = ZOHO_SMTP_USER olmalı)
```

Opsiyonel: `PUBLIC_SITE_URL` tanımlı değilse mail bağlantıları `https://corteqs.net`'e düşer
(canlı için doğru; ayrıca ayarlamaya gerek yok).

### 3. Frontend deploy

Coolify üzerinden deploy. Panelde yeni anahtar ve örnek mail butonu bu adımdan sonra görünür.

### 4. Örnek mail ile GÖZ KONTROLÜ (anahtarı açmadan önce)

`/admin/notifications` → **"Bana örnek hoş geldin maili gönder"**

Kendi adresine `[ÖRNEK]` konu ön ekiyle gelir. Kuyruğa dokunmaz, genel anahtar kapalıyken de
çalışır. Kontrol listesi:

- [ ] Gmail'de düzgün görünüyor (masaüstü + mobil)
- [ ] Outlook'ta düzgün görünüyor — **Word render motoru kullandığı için asıl risk burada**
- [ ] Logo yükleniyor; görselleri engellersen `alt` metni anlamlı
- [ ] "Profilini tamamla" butonu `/profile`'a gidiyor
- [ ] Türkçe karakterler bozuk değil
- [ ] **Spam klasörüne düşmedi.** Gmail → "Show original" → SPF/DKIM `pass` mi?
      Bu, platformun üyeye gönderdiği ilk mail; teslimat kalitesi burada belli olur.

Metin/tasarım değişikliği gerekirse: `supabase/functions/_shared/emails/member-welcome.ts`
düzenle → `npm run preview:emails` (tarayıcı) → `npm run test -- supabase/functions/_shared`
→ `supabase functions deploy send-notification-emails` → tekrar örnek mail.

### 5. Anahtarı aç

`/admin/notifications` → **"Hoş geldin maili açık"**

> ⚠️ Anahtar açılmadan önce kaydolan üyeler bu maili **hiç almaz** — kuyruk satırları
> `skipped` olur ve bir daha denenmez. Bu kasıtlı: geçmişe dönük toplu mail riski yok.

### 6. Gerçek kayıt testi

Tek kullanımlık bir adresle `/login` üzerinden kaydol → doğrulama mailindeki linke tıkla.

Beklenen:

```sql
select event_type, status, recipient_count, last_error
  from public.notification_email_outbox
 where dedupe_key like 'member_welcome:%'
 order by created_at desc limit 5;
-- status = 'sent', recipient_count = 1
```

Mail birkaç saniye içinde gelmeli (pg_net poke anlık; gelmezse pg_cron 15 dk içinde alır).

### 7. Commit

Tek commit yeterli — dosyalar birbirine bağlı.

---

## Bilinmesi gerekenler

- **`types.ts` bayat** — API katmanı `as never` cast'i kullanıyor (mevcut desen, CLAUDE.md B1).
  Migration sonrası `supabase gen types` ile yenilenebilir, zorunlu değil.
- **Doğrulanmamış kayıtlar mail üretmez** — trigger yalnız `email_confirmed_at` NULL→NOT NULL
  geçişinde çalışır. Google ile girenlerde bu alan dolu gelir, onlar anında mail alır.
- **Trigger asla kaydı bloklamaz** — gövde `exception when others then return new` ile sarılı.
  Bu sarmalı kaldırma: bildirim hatası kullanıcının hiç kayıt olamamasına yol açar.
- **Şablon `src/` altından import edilemez** — Edge Function deploy'u yalnız
  `supabase/functions/` klasörünü yükler. Sosyal linkler bu yüzden şablonda tekrarlanır;
  Footer.tsx ile senkronu bir mirror testi korur (`member-welcome.test.ts`).
- **Kişisel abonelik yok** — bu mail üyeye gider, admin abone olmaz. Yalnız genel anahtarı var.

## Test durumu (2026-07-29)

- 43 ilgili test geçti (11 şablon + 19 API + 13 sayfa)
- Tam paket 1175/1178 — kırık 3 test `src/App.aiform-routes.test.tsx`, **önceden kırık**
  (aradığı "CorteQS Hesabı" metni hiçbir kaynak dosyada yok), bu işle ilgisiz
- Değiştirilen dosyalarda 0 lint hatası
- `npm run verify:text` 1222 dosya geçti
