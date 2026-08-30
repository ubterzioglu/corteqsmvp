# WhatsApp Cloud API Webhook Runbook

Durum: **Kod ve veritabanı hazır; Meta sırları sağlanana kadar Edge Function deploy edilmez.**

## Güvenlik sözleşmesi

- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` ve
  `WHATSAPP_APP_SECRET` yalnız Supabase Edge secrets içinde tutulur. Hiçbiri `VITE_`
  değişkeni değildir.
- GET doğrulaması `hub.mode=subscribe`, exact verify token ve challenge ile yapılır.
- POST gövdesi JSON parse edilmeden önce ham byte'lar üzerinden
  `X-Hub-Signature-256: sha256=...` HMAC-SHA256 ile doğrulanır.
- Ham telefon numarası, contact/profile, display phone ve tam provider payload'ı
  saklanmaz. Telefon kimlikleri app secret ile keyed hash'e çevrilir.
- Provider event anahtarı unique'tir; Meta retry'ları 200 alır fakat ikinci kez işlenmez.
- Mesaj metni en fazla 4.000 karakter ve varsayılan 90 gün tutulur. pg_cron bulunan
  ortamda `whatsapp-webhook-retention` işi her gece fiziksel silme yapar.
- Public tablolar deny-by-default RLS ile açılmıştır. Yalnız admin read policy'si,
  yalnız `service_role` için ingest/rate-limit/purge RPC yetkisi vardır.

## Aktivasyon

1. Meta app ve WhatsApp Business Account içinde telefon numarasını bağla.
2. Güçlü, rastgele bir verify token üret; dört server secret'ını tanımla:

   ```powershell
   npx supabase secrets set --project-ref injprdrsklkxgnaiixzh `
     WHATSAPP_ACCESS_TOKEN=... `
     WHATSAPP_PHONE_NUMBER_ID=... `
     WHATSAPP_VERIFY_TOKEN=... `
     WHATSAPP_APP_SECRET=...
   ```

3. Secret adlarını kontrol et; komut çıktısındaki değerlere veya hash'lere dokümana
   kopyalama:

   ```powershell
   npx supabase secrets list --project-ref injprdrsklkxgnaiixzh
   ```

4. Inbound fonksiyonunu Supabase JWT doğrulaması kapalı olarak, admin reply
   fonksiyonunu JWT doğrulaması açık olarak deploy et. Inbound uygulama içindeki
   verify-token ve HMAC kontrolleri zorunlu kalır:

   ```powershell
   npx supabase functions deploy whatsapp-webhook `
     --project-ref injprdrsklkxgnaiixzh --no-verify-jwt --use-api

   npx supabase functions deploy whatsapp-reply `
     --project-ref injprdrsklkxgnaiixzh --use-api
   ```

5. Meta webhook URL'sini
   `https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/whatsapp-webhook` yap;
   `messages` alanına subscribe ol. WABA subscription'ı ayrıca kontrol et.
6. GET challenge, yanlış HMAC, geçerli mesaj ve aynı provider event'in tekrarıyla
   smoke test yap. Secret veya gerçek telefon kimliğini loglama.
7. Meta WhatsApp Manager'da gerçekten onaylanmış template'leri
   `whatsapp_message_templates` tablosuna `meta_template_id`, `verified_at` ve gerçek
   approval status ile kaydet. Parametreli template'ler otomatik yanıtta kapalıdır;
   bu ilk sürüm yalnız `parameter_count = 0` template gönderir.

## Müşteri talebi kuyruğu

`/admin/customer-requests` yalnız allowlist'li admin RPC'lerini kullanır; thread
tablosundaki recipient ciphertext tarayıcıya dönmez. Yeni inbound mesaj thread'i
oluşturur veya var olanı yeniden açar. Admin talebi kendine atayabilir ve durumunu
`new`, `in_progress`, `waiting_customer`, `resolved`, `closed` arasında yönetebilir.

Son inbound mesajdan itibaren 24 saat içinde denetimli serbest metin gönderilebilir.
Bu pencere dışında DB kapısı yalnız doğrulanmış, Meta-onaylı, parametresiz template'e
izin verir. Her reply request UUID ile idempotent hazırlanır; aynı UUID Meta'ya ikinci
kez gönderilmez. Admin başına dakikada 30 hazırlama sınırı vardır ve sonuç audit
log'una yazılır.

## Kabul ve rollback

Kabul için canlı Edge Function'da doğru challenge 200; yanlış verify token 403;
yanlış HMAC 401; geçerli event 200; duplicate event 200 ve `inserted: 0`; limit aşımı
429 olmalıdır. Veritabanında yalnız hash'lenmiş kimlik ve allowlist alanları görünmelidir.

Rollback, Meta subscription'ını kaldırıp Edge Function'ı devre dışı bırakmaktır.
Tablolar silinmez; bekleyen veri 90 günlük retention ile temizlenir.

Resmî model ve endpoint sözleşmesi: [Meta WhatsApp Cloud API koleksiyonu](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api?entity=request-13382743-75e65a16-c157-4877-a02a-87315efaf48e).
