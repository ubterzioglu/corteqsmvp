# C7 — Yarım Kalan Araç Hatırlatması Kabul Kanıtı

Durum: **teknik temel tamamlandı, gönderim insan hukuk/izin onayı bekliyor** (30 Ağustos 2026).

## Uygulanan sözleşme

- Araç oturumu artık ilk gerçek cevapta açılır; her cevap incremental olarak kaydedilir.
- `/tools/:toolSlug/session/:sessionId` mevcut route'u sahiplik kontrollü kayıtlı cevapları yükler ve ilk eksik sorudan devam eder.
- Session üzerinde `last_activity_at` ve tek hatırlatma yaşam döngüsü (`not_due/queued/sent/failed/skipped`) tutulur.
- Saatlik cron yalnız 24 saattir hareketsiz, en az bir cevabı bulunan, süresi dolmamış, doğrulanmış e-postalı ve opt-out olmayan oturumları seçer.
- Outbox dedupe anahtarı session başına tek hatırlatma sağlar. Kullanıcı gönderimden önce devam ederse pending satır otomatik iptal edilir.
- `/settings/notifications` sayfası kullanıcıya kalıcı opt-out verir; opt-out mevcut pending hatırlatmaları da iptal eder.
- Global `email.relocation_tool_abandonment.enabled` anahtarı varsayılan ve canlı durumda `false` kalır.

## Kabul kanıtı

- Migration dry-run ve `BEGIN … ROLLBACK` şema testi geçti.
- Canlı rollback senaryosu:
  - global anahtar kapalı: 0 queued;
  - anahtar geçici açık: yalnız doğrulanmış ve opt-out olmayan aday için 1 queued;
  - ikinci scan: 0 duplicate;
  - opt-out kullanıcı: 0; doğrulanmamış kullanıcı: 0;
  - kullanıcı cevapla devam edince session ve outbox `skipped/session_resumed_before_send` oldu;
  - anon preference RPC kapalı, authenticated preference açık, enqueue yalnız service role'a açık.
- Saatlik cron canlı ve aktif; anahtar kapalı olduğu için no-op çalışır.
- 4 dosyada 19 hedef test, TypeScript ve değişen kapsam sıfır-uyarı ESLint geçti.
- Üretim build'i geçti; yeni tercih route'u 2.47 KB, 500 KB üzeri JS chunk yok.
- Migration canlı ledger'a `20260830142000` olarak işlendi; 373/373 ve drift temiz.
- `send-notification-emails` Edge Function sürüm 11 olarak `ACTIVE` deploy edildi.

## Açma kapısı

Hukuk/izin onayı, gerçek inbox kabulü ve metin onayı olmadan global anahtar açılmayacak. Açılışta önce tek kontrollü test hesabı, ardından düşük limitli batch kullanılmalı.
