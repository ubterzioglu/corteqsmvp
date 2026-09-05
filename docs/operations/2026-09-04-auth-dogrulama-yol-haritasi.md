# Doğrulama yol haritası — e-posta (WS1-7), telefon (WS1-8/11), eski üye e-postası (WS1-12)

**Tarih:** 4 Eylül 2026 · **Kaynak karar:** 3 Eylül 2026 Profiller toplantısı (T19):
*"Sisteme giren herkesten e-posta VE telefon doğrulaması alınacak."* Pano: `/admin/workshop/profil`.

Bu belge, kodla kapatılamayan üç maddenin **neden** kodla kapanmadığını ve **tam olarak
hangi adımın** kimde beklediğini kaydeder. Kod tarafında yapılanlar bölüm sonunda.

---

## 0) Canlı yapılandırma — ölçüm (4 Eylül 2026, Management API `GET /v1/projects/<ref>/config/auth`)

| Anahtar | Canlı değer | Anlamı |
|---|---|---|
| `mailer_autoconfirm` | **true** | E-posta doğrulaması KAPALI; kayıt olan anında oturum alır, e-posta gitmez |
| `smtp_host` / `smtp_user` | **null** | Özel SMTP yok → Supabase'in yerleşik SMTP'si (saatte **2** e-posta, `rate_limit_email_sent = 2`) |
| `external_phone_enabled` | **false** | Telefon girişi kapalı |
| `sms_provider` | twilio (varsayılan), `sms_twilio_account_sid` **null** | Hiçbir SMS sağlayıcısı bağlı değil |
| `hook_send_sms_enabled` | false | Özel SMS kancası yok |
| `external_google_enabled` | true | Google girişi açık |
| `site_url` | https://corteqs.net | doğru |
| `uri_allow_list` | `https://corteqs.net/**`, `/reset-password`, eski mvp.* ve netlify adresleri | corteqs.net için yeterli |
| Şablon | `Confirm Your Signup` (İngilizce, 137 karakter, Supabase varsayılanı) | Türkçe/markalı değil |

Kullanıcı tabanı (auth.users): **167 kullanıcı**, 167'si `email_confirmed_at` dolu (autoconfirm),
**0** telefon, **0** telefon doğrulaması; 27 Google, 140 e-posta+şifre; son 30 günde 12 aktif.
`public.user_verifications` (telefon doğrulama truth-source) mevcut ve **boş**;
`cadde_settings.cadde.phone_verification_required = false`.

---

## 1) WS1-7 — E-posta doğrulaması (Supabase)

### Neden anahtar bugün çevrilemez
Yerleşik SMTP saatte 2 e-posta gönderir ve Supabase bunu yalnız proje üyelerinin adreslerine
yönelik tutar. `mailer_autoconfirm=false` yapılırsa e-posta+şifre ile kayıt olan **hiçbir**
gerçek kullanıcı doğrulama e-postasını alamaz ve giriş yapamaz. **Önce özel SMTP**.

### Sıra (hepsi Management API `PATCH /v1/projects/injprdrsklkxgnaiixzh/config/auth`, `SUPABASE_ACCESS_TOKEN` ile)

1. **SMTP** — Edge function'ların kullandığı Zoho hesabıyla aynı bilgiler
   (`supabase secrets list` → `ZOHO_SMTP_HOST/PORT/USER/PASSWORD`, `MAIL_FROM`):
   ```json
   { "smtp_host": "<ZOHO_SMTP_HOST>", "smtp_port": <ZOHO_SMTP_PORT>, "smtp_user": "<ZOHO_SMTP_USER>",
     "smtp_pass": "<ZOHO_SMTP_PASSWORD>", "smtp_admin_email": "<MAIL_FROM>", "smtp_sender_name": "CorteQS",
     "rate_limit_email_sent": 30 }
   ```
   Zoho, `From` adresinin SMTP kullanıcısıyla aynı olmasını ZORUNLU tutar (aksi hâlde 553
   "relaying disallowed" — `supabase/functions/_shared/emails/smtp.ts` notu).
2. **Türkçe şablon** (`{{ .ConfirmationURL }}` zorunlu değişken):
   ```json
   { "mailer_subjects_confirmation": "CorteQS — e-posta adresini doğrula",
     "mailer_templates_confirmation_content": "<p>Merhaba,</p><p>CorteQS hesabını etkinleştirmek için e-posta adresini doğrula:</p><p><a href=\"{{ .ConfirmationURL }}\">E-postamı doğrula</a></p><p>Bu kaydı sen başlatmadıysan bu e-postayı yok sayabilirsin.</p>" }
   ```
3. **Prova:** kendi test adresinle kayıt ol → e-posta 1 dk içinde geldi mi, bağlantı
   `https://corteqs.net/login` üzerinden oturum açtı mı?
4. **Anahtar:** `{ "mailer_autoconfirm": false }` — EN SON.
5. **Geri alma:** `{ "mailer_autoconfirm": true }` (tek alan). Mevcut 167 kullanıcı etkilenmez
   (hepsi doğrulanmış); Google kullanıcıları hiç etkilenmez.

### Kod tarafında yapılan (bu tur)
- `src/lib/auth-messages.ts` — `describeSignInError` (`email_not_confirmed` → Türkçe yönlendirme,
  `invalid_credentials` → "E-posta veya şifre hatalı"), `describeSignUpResult` (session geldiyse
  "giriş yapıldı", boş `identities` → "zaten kayıtlı", aksi hâlde "doğrulama e-postası yolda").
- `/login`: doğrulanmamış hesapla girişte **"Doğrulama e-postasını yeniden gönder"** düğmesi
  (`supabase.auth.resend({ type: "signup" })`). Eski "Doğrulama bağlantısını gönderdik" metni
  autoconfirm açıkken yanlıştı; artık sonuçtan türetiliyor. Anahtar çevrildiğinde kod değişmez.

---

## 2) WS1-8 / WS1-11 — Telefon doğrulaması ve zorunluluk

### Mevcut altyapı
- DB truth-source hazır: `public.user_verifications(user_id, phone_e164, phone_verified_at, phone_country_code)`,
  `is_phone_verified(uid)`, `cadde_phone_required()`; Cadde yazma RPC'leri
  `phone_verification_required` hatasını zaten üretebiliyor (flag açıkken).
- Frontend'de OTP akışı YOK; `verifyOtp` hiçbir yerde çağrılmıyor; SMS sağlayıcısı yok.
- Profil formu artık telefon **topluyor** (WS1-1, private, E.164 normalize) — doğrulama değil.

### Karar bekleyen (kod öncesi)
| Karar | Seçenekler | Not |
|---|---|---|
| Sağlayıcı | Twilio (SMS/Verify), Vonage, MessageBird, **Twilio WhatsApp kanalı** | Diaspora için WhatsApp OTP en düşük sürtünme; Türkiye numaralarında SMS teslimatı için yerel sağlayıcı (Netgsm vb.) yalnız `hook_send_sms` ile |
| Maliyet tavanı | aylık bütçe + kullanıcı başına deneme sınırı | `rate_limit_sms_sent` canlıda 30 |
| Zorunluluk kapsamı | yalnız Cadde yazma (flag var) · tüm giriş (WS1-11) · profil tamamlama | WS1-11 "herkes" diyor; eski 167 üye için geçiş süresi gerekir |

### Önerilen uygulama (sağlayıcı seçilince ~1 gün)
1. Supabase Auth phone provider açılır (`external_phone_enabled=true`, sağlayıcı bilgileri).
2. Profil "Telefon" satırına **"Doğrula"** düğmesi: `auth.updateUser({ phone })` → OTP →
   `auth.verifyOtp({ phone, token, type: "phone_change" })`. Sağlayıcı yokken düğme gizli
   (`afs_features` bayrağı `profile.phone_verification`, rol bazında açılır).
3. Tetikleyici: `auth.users.phone_confirmed_at` NULL→dolu olduğunda `user_verifications`
   upsert (mevcut truth-source değişmez; Cadde RPC'leri otomatik uyar).
4. Zorunluluk: `cadde.phone_verification_required=true` (Cadde) ve/veya `RequireAuth`
   altında "doğrulama gerekli" kapısı (uygulama geneli) — flag ile, eski üyeler için
   14 gün geçiş mesajıyla.

---

## 3) WS1-12 — Eski üyeleri Gmail girişine ve profil tamamlamaya yönlendiren e-posta

- Transport hazır: `send-notification-emails` (Zoho SMTP), `notification_email_outbox`
  (`event_type` CHECK: new_member/admin_update/member_welcome/revision_request).
- Engel 1: `dedupe_key` UNIQUE — `member_welcome:<uuid>` zaten yazılmış üyeye aynı tip
  tekrar kuyruklanamaz → **yeni event tipi** gerekir (`member_reactivation`).
- Engel 2: "eski üye" için tek bir kolon yok. Kullanılabilir vekiller:
  `raw_app_meta_data->>'provider' = 'email'` (140 kişi; Gmail'e geçmesi istenenler),
  `last_sign_in_at < now() - 60 gün`, `%@wa.local` (WhatsApp-bot kaynaklı),
  `submissions.referral_source='whatsapp'`.
- Engel 3: içerik ve gönderim onayı — 140 kişiye giden bir kampanya; metni ve
  segmenti Burak/UBT onaylamalı.

**Öneri:** `member_reactivation` event tipi + şablon (`_shared/emails/`) + admin
sayfasında "seçili segmente gönder" düğmesi (önizleme + sayı + onay). Segment sorgusu
salt-okunur RPC olarak, gönderim `notification_email_outbox`'a `deliver_after` ile
(saatte 30 SMTP limiti → 140 kişi ~5 saatte).

---

## Bu turda kapatılan / açık kalan (pano işaretleme SQL'i ile birebir)

Kapatıldı (UBT ✓, kod kanıtıyla): 1, 2, 3, 4, 5, 6, 9, 10, 26.
Açık: **7** (SMTP + anahtar — bu belge §1), **8/11** (sağlayıcı kararı — §2), **12** (segment + içerik — §3),
13–25 (Batch C/D: rol-etiket mimarisi, referans, paketleme — ayrı tasarım turu).
