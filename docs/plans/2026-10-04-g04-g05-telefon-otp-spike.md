# G04/G05 Spike: Telefon OTP hız sınırı — native yol mu edge function mı?

> **Tarih:** 4 Ekim 2026 · **Yazan:** ajan · **Karar:** (a) native yol + DB gözlem

## Soru

Şartname "SMS hız sınırı DB'de sayılsın, istemcide değil" diyor. Ama native yolda
(updateUser({phone}) → verifyOtp) SMS'i tarayıcı doğrudan Supabase Auth'a gönderir;
uygulamanın DB'si araya girmez. Auth'un kendi sınırı proje geneli ve bizim politikamızı
(kullanıcı başına 5/gün, 3/saat) ifade EDEMEZ.

## Seçenekler

### (a) Native yol + DB gözlem

- `updateUser({phone})` → Auth SMS gönderir → `verifyOtp` → `auth.users.phone_confirmed_at`
- Trigger `user_verifications`'a aynalar
- Auth'un yerleşik sınırları (30/gün, 5/saniye — proje geneli) geçerli
- DB'de `otp_send_attempts` tablosu ile gönderim/deneme sayacı TUTULUR ama ENGELLEMEZ
- Sınır aşımı Auth tarafından engellenirse kullanıcıya Türkçe mesaj gösterilir

**Artıları:** Şartnameyle uyumlu (edge function YAZMA) · Auth zaten rate limit yapıyor ·
DB'de gözlem izi var (analiz/audit için)

**Eksileri:** Kullanıcı başına 5/gün, 3/saat politikası ENFORCED değil, Auth'un 30/gün
sınırı geçerli · SMS ücretli (bütçe 20–25 €) — Auth'un sınırı daha gevşek

### (b) Edge function araya koy

- `send-phone-otp` edge function: DB'de sınır kontrolü → Auth'a ilet → SMS
- `verify-phone-otp` edge function: DB'de deneme sayacı → Auth'a ilet → doğrula
- Tam kontrol: kullanıcı başına 5/gün, 3/saat, 60 sn bekleme

**Artıları:** Tam kontrol · Politika enforced · SMS maliyeti öngörülebilir

**Eksileri:** Şartname "YAZMA" dedi · İki edge function · Auth native yolunu bypass ·
Daha fazla kod/bakım

## Karar: (a) Native yol + DB gözlem

**Gerekçe:**

1. **Şartname uyumu:** G04 "send-phone-otp/verify-phone-otp edge function'larını YAZMA —
   şema zaten ayna olarak tasarlanmış" diyor. (b) bu kuralı çiğner.

2. **Auth zaten sınır koyuyor:** Supabase Auth `rate_limit_sms_sent=30` (proje geneli/gün)
   ve `sms_max_frequency=5` (saniye). Bu, kullanıcı başına 5/gün politikamızdan DAHA
   KISITLAYICI değil ama SMS maliyetini sıfırdan kontrol eder.

3. **Gözlem izi:** `otp_send_attempts` tablosu ile her gönderim/deneme DB'ye yazılır.
   Auth sınırına takılan kullanıcılar `blocked_by_auth=true` ile işaretlenir. Bu veri
   analiz/audit için değerli.

4. **Politikayı enforced yapmak AYRI KARAR:** Eğer kullanıcı başına 5/gün, 3/saat
   KESINLIKLE enforced edilmeliyse, bu G05'te "KARAR gerekir" olarak raporlanır ve
   ayrı bir batch'te (b) seçeneği değerlendirilir. Şu anki bütçe (20–25 €) ve Auth
   sınırı (30/gün) ile risk yönetilebilir.

5. **Güvenlik:** Phone sign-up/sign-in kapalı kalır (G04 migration guard). Telefon ekleme
   YALNIZCA mevcut hesaba, Auth native yoluyla.

## Uygulama

### G04 (bu batch)

- Migration: `auth.users` AFTER UPDATE trigger → `user_verifications` aynalama
- Migration: `auth.users` BEFORE INSERT guard → phone-only kayıt reddet
- Migration: `otp_send_attempts` tablosu (gözlem, enforcement değil)
- Kabul: Geri alınan işlemde `phone_confirmed_at` yazdır → aynalama → `is_phone_verified()` true
- ❌ Gerçek SMS gönderilemez (U06 bekliyor) — "uçtan uca doğrulandı" YAZILMAZ

### G05 (sonraki batch)

- Telefon doğrulama UI kartı (ProfilePhoneField yanında)
- `send-phone-otp` client kodu: `supabase.auth.updateUser({phone})` → Auth SMS gönderir
- `verify-phone-otp` client kodu: `supabase.auth.verifyOtp({type:'phone_change'})` → aynalama
- DB gözlem: Her gönderim/deneme `otp_send_attempts`'a yazılır (RPC)
- Sınır aşımı: Auth engellediğinde Türkçe mesaj gösterilir
- ⚠️ **KARAR GEREKİR:** Kullanıcı başına 5/gün, 3/saat ENFORCED edilmeliyse edge function
  yazılmalı — bu batch'te YAZILMAZ, kullanıcı-adımları dosyasına not düşülür

## Kullanıcının elini bekleyenler

1. **U06:** SMS sağlayıcı kimlikleri (Twilio account_sid, auth_token, message_service_sid)
   Supabase panelinde girilmeli
2. **U06:** `external_phone_enabled=true` Supabase panelinde açılmalı
3. **KARAR:** Kullanıcı başına 5/gün, 3/saat ENFORCED edilmeliyse → edge function batch'i
   planlanmalı (bu spike notu karar değil, seçenek analizi)
