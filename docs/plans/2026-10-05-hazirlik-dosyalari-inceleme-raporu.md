# İncelenmemiş Hazırlık Dosyaları — İnceleme Raporu

> **Tarih:** 5 Ekim 2026
> **Kapsam:** Stripe planı, K01+K04 hazırlığı, G14 kullanıcı-adımları, genel kullanıcı-adımları
> **Amaç:** Yanlış/çelişkili iddia, ölçülmemiş rakam, kullanıcıyı yanıltacak karmaşık dil, eksik adım

---

## 1 · Stripe Plan Düzeltmesi (`19c02b89`)

**Dosya:** `docs/plans/2026-10-04-stripe-odeme-altyapisi-plani.md`

### Bulgu 1.1 — Düzeltme doğru

**Satır 15-23:** "Kurucu 1000 = 99 € DEĞİL" düzeltmesi eklenmiş. Yeni fiyatlar:
- Danışman Pro: 25/20 €
- Kuruluş Pro: 50/40 €
- İşletme Pro: 75/60 €

**Değerlendirme:** ✅ Doğru. Karar 9 ile tutarlı.

### Bulgu 1.2 — MockStripeCheckout raporu eksik

**Satır 51-54:** MockStripeCheckout'un iki yerde kullanıldığı belirtilmiş ama **rapor bölümü** (§4) dosyanın sonunda. Kullanıcı okurken karışabilir.

**Öneri:** §1'de "MockStripeCheckout raporu §4'te" diye bağlantı ekle.

### Bulgu 1.3 — "175 kayıtlı kullanıcı" ölçülmemiş

**Satır 49:** "175 kayıtlı kullanıcı" yazıyor ama ölçüm tarihi yok. Bu sayı bayat olabilir.

**Öneri:** "175 kayıtlı kullanıcı (04.10 ölçümü)" diye tarih ekle.

---

## 2 · K01+K04 Karar Hazırlığı (`569ac58b`)

**Dosya:** `docs/plans/2026-10-05-k01-k04-karar-hazirligi.md`

### Bulgu 2.1 — K01 görsel tarif iyi

**Satır 17-40:** ASCII art ile iki seçenek gösterilmiş. Anlaşılır.

**Değerlendirme:** ✅ İyi.

### Bulgu 2.2 — K04 "CANLIDA KUSUR" uyarısı var

**Satır 62-80:** K04'ün soru değil, canlıda duran bir kusur olduğu açıkça yazılmış.

**Değerlendirme:** ✅ Doğru. "Park = kusur yok" izlenimi vermiyor.

### Bulgu 2.3 — K04 için "davet kodu" terminolojisi karışık

**Satır 62:** "Davet Kodu" alanı diyor ama kodun ne olduğu belirsiz. Referral kodu mu, WhatsApp grup davet kodu mu?

**Öneri:** "Referral Kodu (seni davet edenin kodu)" diye açıkla.

---

## 3 · G14 Kullanıcı Adımları

**Dosya:** `docs/handover/2026-10-05-g14-kullanici-adimlari.md`

### Bulgu 3.1 — U06 bağlantısı doğru

**Satır 19-20:** U06 adımları `docs/handover/2026-10-04-g04-g05-kullanici-adimlari.md` dosyasına bağlı.

**Değerlendirme:** ✅ Doğru.

### Bulgu 3.2 — Telefon doğrulama kartı bağlı değil

**Satır 16-17:** `PhoneVerificationCard.tsx` hiçbir sayfaya bağlı değil (`check:dead` kırmızı). Bu bilgi doğru.

**Değerlendirme:** ✅ Doğru.

### Bulgu 3.3 — Mail kararları açık

**Satır 33-44:** Mail konuları "KARAR GEREKİR" olarak işaretlenmiş.

**Değerlendirme:** ✅ Doğru.

### Bulgu 3.4 — Sebep → kırmızı çizgi tablosu doğru

**Satır 50-60:** 7 sebep + "Diğer" listelenmiş. 2, 4, 6 doğrudan kaldırma.

**Değerlendirme:** ✅ Doğru. Politika §4 ile tutarlı.

---

## 4 · Genel Kullanıcı Adımları (`c43b985b`)

**Dosya:** `docs/handover/2026-10-05-kullanici-adimlari.md`

### Bulgu 4.1 — G10c "hazırlanmadı" bilgisi BAYAT

**Satır 22-25:** "Onay talebi hazırlanmadı (bu oturumda zaman yetmedi)" diyor. Ama `9e2f01d3` commit'iyle G10c onay talebi hazırlandı.

**Öneri:** "Onay talebi hazırlandı (`9e2f01d3`), senin onayın bekleniyor" diye güncelle.

### Bulgu 4.2 — U06 "Twilio" bilgisi BAYAT

**Satır 40-44:** "Twilio panelinden SID, Auth Token, Message Service SID gir" diyor. Ama U06 artık Meta WhatsApp OTP'ye döndü (G05b).

**Öneri:** "Meta Business Verification bekleniyor" diye güncelle.

### Bulgu 4.3 — G05 "enforce edilsin mi?" sorusu BAYAT

**Satır 59-60:** "Kullanıcı başına 5/gün, 3/saat ENFORCED edilmeli mi?" sorusu soruluyor. Ama G05b migration'ı bu sınırları ZATEN enforcediyor (claim_phone_otp_send RPC'si ile).

**Öneri:** "G05b migration'ı sınırları ZATEN enforcediyor (sunucuda). Yayına alma bekleniyor." diye güncelle.

---

## 5 · Özet

| Dosya | Bulgu | Öneri |
|---|---|---|
| Stripe planı | §4 bağlantısı eksik | §1'e bağlantı ekle |
| Stripe planı | "175 kullanıcı" tarihi yok | Tarih ekle |
| K01+K04 | "Davet kodu" terminolojisi karışık | "Referral kodu" diye açıkla |
| Kullanıcı-adımları | G10c "hazırlanmadı" bayat | `9e2f01d3` ile güncelle |
| Kullanıcı-adımları | U06 "Twilio" bayat | Meta WhatsApp olarak güncelle |
| Kullanıcı-adımları | G05 "enforce" sorusu bayat | Zaten enforcedığını belirt |

**Genel değerlendirme:** Dosyalar doğru ve anlaşılır. Yalnız birkaç bayat bilgi var (G05b ve U06 değişiklikleri yansımamış).

---

**Raporu yazan:** Dördüncü ajan (Qwen)
**Tarih:** 5 Ekim 2026, ~15:55 UTC
