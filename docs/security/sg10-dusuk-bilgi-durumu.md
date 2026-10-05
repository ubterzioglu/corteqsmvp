# GV5 · SG10 Düşük/Bilgi Maddeleri Durumu

> Tarih: 5 Ekim 2026
> Kaynak: docs/security/SECURITY_AUDIT.md "DÜŞÜK / BİLGİ" bölümü

## Yapılanlar ✓

| # | Madde | Durum | Commit |
|---|---|---|---|
| 1 | LoginPage.tsx next doğrulaması (`//evil.com` geçirir) | ✓ DÜZELTİLDİ | SG10 (0bd2d105) |
| 2 | Kullanıcı URL'leri href'te şema kontrolsüz | ✓ safeHref() var + test eklendi | SG10 (GV3) |
| 3 | nginx.conf.template:137 gevşek `(.+)` yakalama | ✓ DÜZELTİLDİ | SG8 (0bd2d105) |
| 4 | nginx `server_tokens off` yok | ✓ EKLENDİ | SG8 (0bd2d105) |
| 5 | CI SHA sabitleme (`actions/checkout@v4`, `setup-node@v4`) | ✓ YAPILDI | SG10 (0bd2d105) |
| 6 | `src/lib/security.ts` `sanitizeHtml` (zayıf regex) çağıranı yok | ✓ KALDIRILDI | SG10 (0bd2d105) |
| 7 | `_shared/emails/event-published.ts` git'te takipsiz | ✓ EKLENDİ | A15 (a0ffd0e3) |

## §B4'e Düşenler (Karar Gerekli)

| # | Madde | Neden §B4? |
|---|---|---|
| 8 | Wildcard CORS (`_shared/whatsapp-reply.ts:61`, `submit-survey-response:30`, `whatsapp-autoreply:38`) | Origin kontrolü başlık yokken atlanıyor — tasarım kararı gerekli |
| 9 | `radar-news-scan/index.ts:88` sabit-zamanlı olmayan secret karşılaştırması | Düşük risk, değişiklik karar gerektirir |
| 10 | Hata detayı sızıntısı (`relocation-notifications:124-126`, providers.ts, `send-notification-emails:393`) | Hangi hatalar maskelenecek karar gerektirir |
| 11 | Gemini API anahtarı URL query'de (`site-assistant:110`, `directory-search:40`, `relocation-assistant/providers.ts:63`) | SDK değişikliği karar gerektirir |
| 12 | SMTP alıcı satırlarında CR/LF temizliği yok (`_shared/emails/smtp.ts:176-182,239`) | Şu an istismar edilemiyor — öncelik düşük |
| 13 | `send-phone-otp-hook`: replay cache yok, pepper hook secret'a düşüyor | Mevcut şifreli veriyi bozar — geçiş planı gerekli |
| 14 | `WHATSAPP_APP_SECRET` hem HMAC hem AES anahtarı kaynağı | Rotasyon şifreli veriyi bozar — karar gerekli |
| 15 | `group-preview` yayında olmayan grupların slug/ownership bilgisini döndürür | Tasarım kararı gerekli |
| 16 | radar digest `href` için `javascript:` engeli yok | Düşük risk, CSP engelliyor |
| 17 | `coupon_purchases` alıcı `status='paid'` yazabilir | Tasarım kararı gerekli |
| 18 | Anonim form tablolarında alan sahteciliği ve hız sınırı yok | Kolon grant'i karar gerektirir |
| 19 | `list_member_catalog_names` anon | İstemci kullanımına bağlı |
| 20 | `record_tool_run` log zehirleme | Düşük risk |
| 21 | Kariyer başvurusu global 100/saat tavanı flood ile doldurulabilir | Rate-limit kararı gerekli |

## Özet

- **7 madde yapıldı** (GV3, SG8, SG10, A15)
- **14 madde §B4'e düştü** (karar gerekli)
- **0 madde kaldı** (tamamı ya yapıldı ya da §B'ye düştü)
