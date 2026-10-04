# G04/G05 — Kullanıcının Elini Bekleyen Adımlar

> **Tarih:** 4 Ekim 2026 · **Durum:** G04+G05 kod tarafı TAMAM · U06 (SMS sağlayıcı) bekleniyor

## Özet

Telefon doğrulama altyapısı hazır:
- **G04:** auth.users trigger'ı user_verifications'a aynalıyor, phone-only kayıt reddediliyor
- **G05:** Telefon doğrulama API + UI kartı (PhoneVerificationCard)

**Ancak gerçek SMS gönderilemiyor** çünkü Supabase Auth'ta SMS sağlayıcı kimlikleri yok.

---

## U06 — SMS Sağlayıcı Kurulumu (Twilio)

### Adım 1: Supabase Paneline Gir

1. https://supabase.com/dashboard/project/injprdrsklkxgnaiixzh
2. Sol menü: **Authentication** → **Providers**
3. **Phone** sağlayıcısını bul

### Adım 2: Phone Auth'u Aç

1. **Enable Phone provider** → **AÇIK** konuma getir
2. **Confirm Phone** → **AÇIK** olmalı

### Adım 3: Twilio Kimliklerini Gir

Twilio hesabından 3 değer gerekli:

| Alan | Twilio'da Nerede |
|---|---|
| **Account SID** | Console → Account Settings → General |
| **Auth Token** | Console → Account Settings → General (gizli, bir kez gösterilir) |
| **Message Service SID** | Console → Messaging → Services → [servis adın] → SID |

Supabase panelinde:
- **SMS Provider** → **Twilio** seç
- Yukarıdaki 3 değeri ilgili alanlara yapıştır
- **Save**

### Adım 4: Phone Sign-in KAPALI mı Doğrula

**ÖNEMLİ:** Telefonla giriş/kayıt yolu KAPALI kalmalı. Amaç YALNIZCA mevcut hesaba telefon eklemek.

Supabase panelinde:
1. **Authentication** → **URL Configuration**
2. **Site URL** ve **Redirect URLs** doğru olmalı
3. **Authentication** → **Providers** → **Phone**
4. **"Allow phone signups"** → **KAPALI** olmalı (varsa)

**Kontrol:**
- Phone sign-up KAPALI mı? → Yeni kullanıcı telefonla kayıt olamamalı
- Phone sign-in KAPALI mı? → Mevcut kullanıcı telefonla giriş yapamamalı

Eğer panelde "Allow phone signups" seçeneği yoksa, Auth Hooks ile kontrol edilmeli:
- **Authentication** → **Hooks** → **Before User Created**
- Hook fonksiyonu: `if (user.phone && !user.email) return { error: "phone_only_signup_not_allowed" }`

### Adım 5: Uçtan Uca Doğrulama

Sağlayıcı kurulduktan sonra:

1. **Uygulamaya giriş yap** (mevcut hesap)
2. **Profil sayfasına git** → Telefon Doğrulama kartı görünmeli
3. **Telefon numaranı gir** (örn. +491701234567)
4. **"Doğrulama Kodu Gönder"** butonuna bas
5. **Telefonuna SMS gelmeli** (6 haneli kod)
6. **Kodu gir** → **"Doğrula"** butonuna bas
7. **"Telefon doğrulandı"** mesajı görünmeli

**Veritabanında kontrol:**
```sql
SELECT user_id, phone_e164, phone_verified_at 
FROM user_verifications 
WHERE user_id = '<user-id>';
```

---

## KARAR GEREKİR — Hız Sınırı Enforcement

**Mevcut durum:**
- Auth'un yerleşik sınırları geçerli (30 SMS/gün proje geneli)
- DB'de `otp_send_attempts` tablosu ile gözlem yapılıyor
- Kullanıcı başına 5/gün, 3/saat politikası **ENFORCED DEĞİL**

**Seçenekler:**

### (a) Mevcut Durum (Önerilen — Şimdilik)
- Auth sınırları yeterli koruma sağlar
- SMS maliyeti düşük kalır (30/gün tavan)
- Edge function yazmaya gerek yok

### (b) Edge Function ile Enforcement
- `send-phone-otp` edge function: DB'de sınır kontrolü → Auth'a ilet
- `verify-phone-otp` edge function: DB'de deneme sayacı → Auth'a ilet
- Tam kontrol: kullanıcı başına 5/gün, 3/saat, 60 sn bekleme
- **Dezavantaj:** Şartname "edge function YAZMA" dedi, ekstra kod/bakım

**Karar:** Şu anki bütçe (20–25 €) ve Auth sınırı (30/gün) ile risk yönetilebilir.
Eğer kullanıcı başına 5/gün KESINLIKLE enforced edilmeliyse, ayrı bir batch planlanmalı.

---

## Kanıtlanamayanlar

1. **Gerçek SMS gönderimi** — Sağlayıcı kimlikleri olmadan doğrulanamaz
2. **Uçtan uca doğrulama akışı** — SMS gelmeden tam döngü test edilemez
3. **Telefonla giriş/kayıt engeli** — Auth panel ayarı olmadan kesin doğrulama yapılamaz

---

## Hatalar ve Dersler

1. **verifyOtp tipi:** `phone_change` için `phone` parametresi gerekli — TypeScript hatası verdi, düzeltildi
2. **Rate limit yakalama:** Auth hata fırlattığında catch bloğunda da rate limit kontrolü gerekti
3. **check:dead:** PhoneVerificationCard ve phone-verification-api "erişilemez" sayıldı — henüz ProfilePage'e entegre edilmediği için normal

---

## Commit'ler

```
f9244cf4 G04 · Telefon OTP aynalama + phone-only kayıt guard
f75014e0 G05 · Telefon doğrulama arayüzü + API (native Auth yolu)
```

---

## Sonraki Adımlar

1. **U06:** SMS sağlayıcı kimliklerini gir (yukarıdaki talimatlar)
2. **Uçtan uca doğrulama:** Gerçek SMS ile test et
3. **PhoneVerificationCard entegrasyonu:** ProfilePage'e ekle (şu an yazıldı ama entegre değil)
4. **KARAR:** Hız sınırı enforcement gerekli mi? → Edge function batch'i planla
