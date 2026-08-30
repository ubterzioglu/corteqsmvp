# 31 Ağustos Codex limit sprinti — final handoff

**Tarih:** 30 Ağustos 2026  
**Dal:** `codex/limit-sprint-2026-08-30`  
**Production:** `main` fast-forward edildi; Coolify 30 Ağustos 16:29 UTC'de yeni frontend'i yayınladı.

## Sonuç

Sprint A0–D4 kapsamındaki uygulanabilir teknik işler ve sonraki kalan işler taraması küçük ve bağımsız commit'lerle
tamamlandı. Canlı veritabanı 374/374 migration ile yerel ledger'a eşit. VIP, müşteri
talepleri, platform moderasyonu, konumlu araç raporu ve terk edilmiş başvuru altyapıları
canlı veritabanında; yeni frontend route'ları da production'da. İnsan onayı, gerçek inbox,
Meta hesabı veya QA hesabı isteyen kabul kapıları yapılmış gibi kapatılmadı.

## Durum matrisi

| Kapsam | Durum | Kanıt / sonraki kesin adım |
|---|---|---|
| A0 baseline | **Hazır** | Baseline ve korunan kullanıcı dosyası `docs/status/2026-08-30-limit-sprint-baseline.md` içinde. |
| A1 Cadde kabulü | **Teknik bağımlılık bekliyor** | 49 ilgili test ve logo kontrolü geçti; iki gerçek kullanıcı için `CADDE_E2E_ENV`, `PLAYWRIGHT_BASE_URL` ve iki QA hesabı gerekir. `m76/m92/m134` işaretlenmedi; ayrıntı `docs/status/2026-08-30-cadde-acceptance.md`. |
| A2 Referral QR | **Hazır** | SVG/PNG indiriliyor, decode ediliyor ve `/founding-1000?ref=...` hedefi testle doğrulanıyor. |
| A3 hoş geldin e-postası | **İnsan onayı bekliyor** | Preview ve 48 test geçti; 16 eski `skipped` kayıt yeniden gönderilmeyecek. Admin'den gerçek inbox testi, yeni QA üyesi ve ardından global switch gerekir. Switch hâlâ kapalıdır. |
| A4 Komuta Merkezi hijyeni | **Hazır** | Duplicate/stale kayıtlar guarded SQL ile temizlendi; epic'ler küçük alt işlere ayrıldı. |
| A5 SDK drift | **Hazır** | Frontend, Edge ve worker `@supabase/supabase-js@2.108.2`; drift yok. |
| A6 test gürültüsü | **Hazır** | Tam pakette açıklanmamış stderr yok. |
| B1 WhatsApp listeleme paketi | **İnsan onayı bekliyor** | Listeleme ölçütleri ve kısa/uzun paylaşım metinleri hazır; dışarıya paylaşılmadı. |
| B2 Contributor paketi | **İnsan onayı bekliyor** | FAQ, kaynak sınıfları ve kabul SOP'si hazır; contributor'a ulaşılmadı. |
| B2+ Contributor Admin | **İlk batch hazır** | Admin-only kaynak kuyruğu, kabul/eksik bilgi/ret akışı, deny-by-default RLS, rate limit ve audit izi eklendi. Contributor self-service ayrı batch olarak açık. |
| B3 migration runner | **Hazır** | Tek transaction, ledger, dry-run, ad/transaction guard ve gizli parola koruması testli. |
| B4 lint | **Hazır** | Üretim kapsamında 0 error ve 0 warning; eski state okuyabilen chat callback'i regresyon testiyle düzeltildi. |
| B4+ bağımlılık güvenliği | **Hazır** | Vite 8, Vitest 4 ve güncel jsdom/React eklentisiyle derleme-test zinciri yenilendi; üretim + geliştirme bağımlılıklarının tam `npm audit` sonucu 0 açık. |
| B5 public gizlilik/assets | **Hazır** | Stripe rehberi private arşive alındı; production eski URL artık 404. Referanssız 49 MB video public dağıtımdan çıkarıldı. |
| B6 bundle/yükleme | **Hazır** | Görünür route fallback var; tüm JS chunk'ları 500 KB altında, en büyüğü 470,37 KB. |
| C1–C2 VIP | **Hazır** | Hash-only, tek kullanımlık, varsayılan 30 günlük ve iptal edilebilir davet; admin ve public route production'da. Canlı invalid-token smoke `noindex,nofollow` ve “Davet bulunamadı” verdi. |
| C3–C4 WhatsApp Cloud API | **Teknik bağımlılık bekliyor** | DB/RLS, HMAC, dedupe, rate limit, 24 saat/template kapısı ve admin kuyruğu hazır. `whatsapp-webhook` ile `whatsapp-reply`, dört Meta sırrı eksik olduğu için deploy edilmedi. |
| C5 davranış güvenliği | **Hazır** | Genel rapor/vaka/kısıtlama/audit çekirdeği ve deny-by-default admin RLS canlı. |
| C6 konumlu araç raporu | **Hazır** | Sonuçta ülke/şehir snapshot'ı; konumsuz gönderim RPC'de reddediliyor; mail outbox üzerinden. WS2 102/103 yalnız UBT tarafında kapatıldı. |
| C7 terk edilmiş başvuru | **İnsan onayı bekliyor** | Resume, opt-out, verified-email, tek gönderim ve hourly cron canlı; `email.relocation_tool_abandonment.enabled=false`. Hukuk/izin sonrası admin global switch açılmalı. WS2 112 yalnız teknik tarafta kapatıldı. |
| D1 pazarlama kiti | **İnsan onayı bekliyor** | 18 araç matrisi, kare brief/video prompt, LinkedIn ve kafe metinleri hazır; paylaşılmadı. |
| D2 Clarity paketi | **Teknik bağımlılık bekliyor** | CSV/import sözleşmesi, funnel ve haftalık rapor hazır; gerçek veri bağlantısı yok, analiz tamamlandı sayılmadı. |
| D3 karar epic'leri | **İnsan onayı bekliyor** | Jukebox, video, auto-refresh, OAuth branding ve board formatı ilk uygulanabilir batch'lere ayrıldı. |

## Production kanıtı

- `main` ve sprint dalı GitHub'a pushlandı.
- Coolify öncesi bundle `main-BMcCuPv0.js`; deploy sonrası `main-CYvw4EMz.js`.
- `BASE_URL=https://corteqs.net npm run verify:release` canlı ana JS/CSS ve beş muhasebe lazy chunk'ı için geçti.
- `https://corteqs.net/burak-stripe-rehberi.html` production'da `404` döndürüyor.
- `/vip/invalid-limit-sprint-token` Chromium smoke testinde doğru terminal durumu ve `noindex,nofollow` üretti.
- `send-notification-emails` Edge Function v11 aktiftir. WhatsApp Edge Function'ları sırlar gelene kadar deploy edilmemiştir.

## Nihai kalite kapısı

```text
npm test                         246 dosya, 1.687 test — geçti
npx tsc --noEmit                 geçti
npm run lint                     0 error, 0 warning
npm audit                        0 güvenlik açığı
npm run build                    geçti
npm run check:bundle             tüm JS chunk'ları < 500 KB
npm run check:migrations         374 dosya / 374 canlı kayıt, sapma yok
npm run check:drift              drift yok
npm run verify:release           yerel geçti
BASE_URL=https://corteqs.net npm run verify:release  canlı geçti
```

Release doğrulayıcısının optimize HTML'deki çoklu module entrypoint yapısını doğru
okuması da regresyon testiyle kilitlendi.

## Komuta Merkezi işaretleme

`supabase/manual/2026-08-30_mark_ws2_102_103_112_ubt_done.sql` canlıda guarded olarak
çalıştırıldı. WS2 102, 103 ve 112 için `ubt_done=true`, `burak_done=false` doğrulandı.
Cadde gerçek multi-user kabulü ve hoş geldin inbox kabulü sonuçlanmadan ilgili diğer
işaretleme SQL'leri çalıştırılmayacaktır.

## Sırlar ve sonraki kesin adımlar

1. Meta uygulamasında `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` tanımla; hiçbirini `VITE_` yapma.
2. `whatsapp-webhook` ve `whatsapp-reply` deploy et; challenge, yanlış imza, duplicate
   event, template yanıt ve rate limit canlı testlerini çalıştır.
3. İki Cadde QA hesabını sağla ve staging multi-user Playwright kabulünü çalıştır;
   yalnız yeşilden sonra m76/m92/m134 SQL'ini uygula.
4. Admin'den gerçek hoş geldin inbox testini yap, yeni QA üyesini doğrula ve yalnız
   ardından `email.member_welcome.enabled` anahtarını aç.
5. Hukuk/izin onayından sonra terk edilmiş başvuru anahtarını aç; ilk cron turunda
   outbox ve opt-out davranışını izle.
6. Clarity export/veri erişimi sağlandığında ilk gerçek haftalık raporu üret.

## Rollback

- C7: global e-posta anahtarını kapalı tut veya tekrar `false` yap.
- WhatsApp: Edge Function'ları deploy etme/devre dışı bırak; DB tablolarını silme.
- VIP: admin route erişimini kaldır veya davetleri revoke et; tabloları silme.
- Frontend: Coolify'da önceki başarılı image'a dön.
- Yeni tablolar rollback sırasında drop edilmez; audit ve idempotency kanıtı korunur.

Kullanıcıya ait izlenmeyen
`docs/status/mevcut-profil-yapisi-raporu-2026-08-20-sade-anlatim.html` dosyasına
dokunulmadı ve commit'lenmedi.
