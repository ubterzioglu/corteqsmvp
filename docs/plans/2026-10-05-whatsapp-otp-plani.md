# WhatsApp ile telefon OTP — durum ve kalan adımlar (5 Ekim 2026)

Amaç: telefon doğrulama kodunu SMS yerine **Meta WhatsApp Cloud API** ile göndermek (U06'nın Twilio
engelini aşar). Mimari: Supabase **Send SMS Auth Hook** → edge function `send-phone-otp-hook` →
Graph API (AUTHENTICATION şablonu, "Copy code"). G04 trigger'ı ve `verifyOtp` akışı DEĞİŞMEZ.

## Kodda hazır (commit EDİLMEDİ — yalnız çalışma dizininde)
| Parça | Dosya |
|---|---|
| Hook çekirdeği (imza, payload, hash, hata sınıflandırma) | `supabase/functions/_shared/phone-otp-hook.ts` |
| Edge function bağlantısı | `supabase/functions/send-phone-otp-hook/index.ts` |
| Kota RPC'leri (4 sınır) | `supabase/migrations/applied/20261005400000_phone_otp_send_claim.sql` |
| `verify_jwt=false` | `supabase/config.toml` |
| İstemci (biçim, `new_phone`, hata eşleme) | `src/lib/phone-verification-api.ts` |
| Kart + geri sayım, ProfilePage'e bağlandı | `src/components/profile/PhoneVerificationCard.tsx` |
| Testler | `*phone-otp-hook.test.ts` · `*phone-otp-claim-contract.test.ts` · `phone-verification-api.test.ts` · `PhoneVerificationCard.test.tsx` |

Kota sınırları (hepsi group_settings `otp_rate_limits` JSON'unda; satırda yoksa varsayılan):
kullanıcı başına bekleme 60 sn · 3/saat · 5/gün · **numara başına 3/gün** · **global 60/saat** ·
kullanıcı başına 10 başarısız/saat. ⚠️ Global tavan aynı zamanda DoS koludur — değeri ürün kararıdır.

## Meta tarafı (kullanıcıda)
- [x] WABA `1351448813698757` · numara +49 163 7084577 (Connected, kalite GREEN) · ödeme yöntemi tanımlı
- [x] Sistem kullanıcısı `corteqsotp` (Employee) + kalıcı token → `.env.local` `WHATSAPP_OTP_ACCESS_TOKEN`
- [ ] **Business Verification** (kullanıcı akşam başlatacak) — şablon oluşturma bu yüzden reddediliyor:
      hata 10 / alt kod 2388185, sağlık özeti `141010 The Business has not passed business verification`
- [ ] Şablon `corteqs_otp` (Authentication · tr · Copy code · 5 dk). Doğrulama sonrası API ile de açılabilir:
      `POST /{WABA}/message_templates` (gövde bu oturumda denendi, yalnız doğrulama engelledi)

## Yayına alma sırası
1. Migration'ı uygula (`psql -f`), sonra ledger kaydını kontrol et: `npm run check:migrations`
   (uygulanana dek `applied/` içinde olup ledger'da olmaması drift olarak görünür).
2. Secret'lar (`supabase secrets set --project-ref injprdrsklkxgnaiixzh …`):
   `WHATSAPP_OTP_ACCESS_TOKEN` · `WHATSAPP_PHONE_NUMBER_ID` · `WHATSAPP_OTP_TEMPLATE=corteqs_otp`
   · `WHATSAPP_OTP_TEMPLATE_LANG=tr` · (ops.) `WHATSAPP_OTP_PHONE_PEPPER` (rastgele uzun değer).
   Bot token'ı `WHATSAPP_ACCESS_TOKEN`'a DOKUNMA. Bu aşamada `SEND_SMS_HOOK_SECRET` henüz yok.
3. Deploy: `supabase functions deploy send-phone-otp-hook --no-verify-jwt` (Coolify edge function deploy ETMEZ).
   Secret eksikken fonksiyon açılışta bilerek patlar — 4. adımı bitirmeden hook'u bağlama.
4. Dashboard → Authentication → Hooks → **Send SMS** → HTTPS → function URL → "Generate secret" →
   çıkan `v1,whsec_…` değerini `SEND_SMS_HOOK_SECRET` olarak secret'a gir, fonksiyonu yeniden deploy et.
5. Dashboard → Authentication → Providers → Phone: **açık**, "Allow phone signups" **KAPALI**,
   **SMS OTP Expiry** 300 sn (varsayılan 60 sn; şablon "5 dakika" diyor).
6. Uçtan uca (gerçek numara): kod WhatsApp'a gelmeli → `verifyOtp` → `user_verifications` satırı →
   `is_phone_verified(uid)` true.

## Canlıda ÖLÇÜLMEDİ — ilk denemede kaydedilecek
1. GoTrue hook hatasını istemciye hangi `status/code/message` ile iletiyor? İstemci üç yolu arar
   (mesajda `phone_otp_rate_limited`, `code=over_sms_send_rate_limit`, `status=429`); hiçbiri tutmazsa
   kullanıcı "gönderilemedi" görür. Sınıra bilerek vurdurup gerçek değeri kaydet.
2. `verifyOtp({type:'phone_change'})` için `phone` = `user.new_phone` varsayımı (kod buna göre yazıldı).
3. `auth.users.phone` '+'sız mı geliyor? İstemci iki biçimi de tolere eder; `user_verifications.phone_e164`
   '+'sız yazılıyor olabilir (gösterimde '+' eklenir). Ledger'daki mevcut/yeni satırlarla uyumu doğrula.
4. Hook'un Auth zaman aşımı (≈5 sn); Meta çağrısı 4 sn'de kesilir.

## Bilinen kabuller / ertelenenler
- `webhook-id` tekrar-oynatma koruması YOK; claim bekleme süresi etkisini sınırlar (imza 5 dk geçerli).
- `otp_send_attempts` temizlik işi yok (kota penceresi 1 gün; 7 gün sonrası silinebilir, pg_cron ayrı karar).
- Kullanıcı OTP mesajına cevap yazarsa gelen mesaj `whatsapp-webhook` → bot otomatik cevabına düşer;
  OTP numarası bot numarasıyla AYNI olduğu için bu etkileşim ayrıca ele alınmalı.
- WhatsApp'ı olmayan numara doğrulama yapamaz (SMS yedeği yok).
- Bekleyen telefon değişikliği (`new_phone` dolu, doğrulanmamış) UI'de ayrıca gösterilmiyor.
