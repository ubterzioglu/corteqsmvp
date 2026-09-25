# Workshop Kalan Maddeler — Karar Soruları

> **Tarih:** 25 Eylül 2026
> **Amaç:** Kalan 15 workshop maddesi için karar vermene yardımcı olacak sorular

---

## 1. Kafe Katılım Bildirimi (m91, m93)

**Mevcut durum:** Cafe açıldığında bildirim gidiyor (yeni yapıldı), ama katılım talebi/kabul-red bildirimi yok.

**Sorular:**
- m91: Cafe'ye biri katılma talebi bıraktığında **ev sahibine** bildirim gitsin mi?
  - Şu an: Talep var ama bildirim yok (admin panelinde görünüyor)
  - Seçenek A: Ev sahibine uygulama içi bildirim + "Yeni katılım talebi var"
  - Seçenek B: Yalnız e-posta bildirimi
  - Seçenek C: İkisi de

- m93: Talep kabul/red edildiğinde **talep sahibine** bildirim gitsin mi?
  - Şu an: Durum değişiyor ama bildirim yok
  - Seçenek A: "Talebin kabul edildi" / "Talebin reddedildi" bildirimi
  - Seçenek B: Yalnız kabul durumunda bildirim, red sessiz
  - Seçenek C: Hiç bildirim yok, kullanıcı cafe'ye girince görür

**Öneri:** m91 için A (uygulama içi), m93 için A (kabul/red ikisine de bildirim) — kullanıcı deneyimi için şeffaflık önemli.

---

## 2. Video Yükleme (m94)

**Mevcut durum:** Fotoğraf yükleme çalışıyor, video yok.

**Sorular:**
- Video yükleme şimdi mi yapılsın, sonraki faz mı?
- Eğer şimdi:
  - Maksimum süre? (30 sn / 1 dk / 5 dk)
  - Maksimum boyut? (10 MB / 50 MB / 100 MB)
  - Otomatik sıkıştırma yapılsın mı?
  - Video önizleme (thumbnail) oluşturulsun mu?
- Altyapı: Supabase Storage zaten var, video için ayrı bucket mı, aynı mı?

**Öneri:** Sonraki faz — video yükleme karmaşık (codec, boyut, streaming), fotoğraf çalışıyor, acele yok.

---

## 3. Telefon Doğrulama (m95)

**Mevcut durum:** Telefon numarası profil formunda var ama doğrulama yok.

**Sorular:**
- SMS sağlayıcı seçildi mi? (Twilio, Vonage, AWS SNS)
- Bütçe onayı var mı? (SMS başına ~0.05-0.10 EUR)
- Doğrulama zorunlu mu, opsiyonel mi?
  - Zorunlu: Tüm Cadde işlemleri için doğrulama gerekli
  - Opsiyonel: Yalnız premium özellikler için
- OTP kodu 6 hane mi, 4 hane mi?
- Kod geçerlilik süresi? (5 dk / 10 dk / 15 dk)

**Öneri:** SMS sağlayıcı seçimi + bütçe onayı gerekiyor. Zorunlu doğrulama kullanıcı deneyimini bozar — opsiyonel yap, premium özellikler için iste.

---

## 4. Şok/Pano Formatı (m101)

**Mevcut durum:** Başlık "Yeni Açılacak Görevler" bölümünde, açıklama yok.

**Sorular:**
- "Şok/pano formatı" ne demek?
  - Seçenek A: Acil duyuru panosu (örn. "Topluluk toplantısı yarın saat 20:00'de")
  - Seçenek B: Sabit paylaşım (pin) — zaten var ("Sabit" rozeti)
  - Seçenek C: Farklı bir şey?
- Eğer acil duyuru panosu:
  - Kim oluşturabilir? (Yalnız admin mi, tüm kullanıcılar mı)
  - Nerede görünsün? (Cadde üstünde banner mı, ayrı sayfa mı)
  - Otomatik kapanma süresi? (24 saat / 48 saat / manuel kapat)

**Öneri:** Netleştirme gerekli — madde başlığı yetersiz, kullanıcıdan açıklama iste.

---

## 5. Cadde Logosu (m135)

**Mevcut durum:** CaddeCafeIcon var (Çay Bardağı), ama genel Cadde logosu yok.

**Sorular:**
- Tasarım var mı? (Logo dosyası, mockup, referans görsel)
- Yoksa, kim tasarlayacak?
  - Seçenek A: Kullanıcı kendisi tasarlayıp yükleyecek
  - Seçenek B: AI ile oluştur (DALL-E, Midjourney)
  - Seçenek C: Tasarımcı bulunacak
- Logo nerede kullanılacak?
  - SiteHeader'da Cadde menüsü yanında mı?
  - Cadde sayfası başlığında mı?
  - Bildirim zilinde mi? (zaten Cafe simgesi var)

**Öneri:** Tasarım bekleniyor — kullanıcıya "tasarım hazır mı?" diye sor.

---

## 6. Blog↔Cadde Döngüsü (m167)

**Mevcut durum:** Blog ve Cadde ayrı, otomatik döngü yok.

**Sorular:**
- "Otomatik döngü" ne demek?
  - Seçenek A: Blog yazısı yayınlanınca otomatik Cadde'de paylaşım oluşsun
  - Seçenek B: Cadde'de popüler paylaşım otomatik blog yazısına dönüşsün
  - Seçenek C: İkisi de
- Eğer A:
  - Hangi blog yazıları? (Tümü, yalnız belirli kategori, yalnız "Cadde" etiketli)
  - Cadde'de nasıl görünsün? (Özel kart, "Blog'dan" rozeti)
- Eğer B:
  - Hangi ölçüt? (En çok tepki, en çok yorum, admin seçimi)
  - Blog yazısı otomatik mi oluşturulsun, taslak mı?

**Öneri:** Sonraki faz — otomatik içerik üretimi karmaşık, manuel paylaşım yeterli şimdilik.

---

## 7. Eski Üye Gmail Geçiş E-postası (m12)

**Mevcut durum:** Email altyapısı var (send-notification-emails), ama "eski üye" tanımı ve segment yok.

**Sorular:**
- "Eski üye" tanımı ne?
  - Seçenek A: Son 60 günde giriş yapmamış (140 kişi)
  - Seçenek B: Yalnız email/password ile kayıt olmuş (OAuth kullanmayan)
  - Seçenek C: Belirli bir tarihten önce kayıt olmuş
- E-posta içeriği ne olacak?
  - Konu: "Profilini tamamla, yeni özellikler var"
  - İçerik: Yeni özelliklerin listesi + profil tamamlama linki
- Kim onaylayacak? (Burak, UBT, ikisi birlikte)
- Gönderim zamanı? (Hemen, belirli bir tarih, haftalık batch)

**Öneri:** Segment: Son 60 günde giriş yapmamış + profil tamamlanmamış. İçerik: Yeni özellikler + profil linki. Onay: Burak.

---

## 8. Çoklu Rol Desteği (m14, m15)

**Mevcut durum:** Tek rol sistemi çalışıyor. Çoklu rol için şema değişikliği gerekli.

**Sorular:**
- Gerçekten gerekli mi? Kaç kullanıcı birden fazla rol istiyor?
- Eğer gerekli:
  - Maksimum kaç rol? (2, 3, sınırsız)
  - "Birincil rol" kavramı var mı? (Profil sayfasında öne çıkan)
  - Rol bazlı izinler nasıl çalışacak? (Tüm rollerin kesişimi mi, birleşimi mi)
- Şema değişikliği:
  - `user_role_assignments` PK'sı `(user_id, role_id)` olacak
  - Mevcut tek rol verisi nasıl migrate edilecek?
  - Geriye uyumluluk: Eski kodlar tek rol bekliyor, nasıl handle edilecek?

**Öneri:** Şimdilik ertele — çoklu rol karmaşık, mevcut sistem çalışıyor. Kullanıcı talebi gelirse değerlendir.

---

## 9. Referans Kural Kitapçığı (m19)

**Mevcut durum:** Dağınık kurallar var (contributor %15, influencer %20, strategic %20).

**Sorular:**
- Kontribütör oranı %15 mi, %20 mi? (İki farklı değer var)
- "Emlakçı getirene indirim veya kredi" kuralı ne?
  - İndirim: % kaç?
  - Kredi: Ne kadar?
  - Koşul: Ne zaman geçerli?
- Diğer rol bazlı kurallar var mı?
- Kitapçık formatı:
  - Seçenek A: Tek markdown dosyası (docs/operations/referral-kural-kitapcigi.md)
  - Seçenek B: HTML sayfası (src/content/commercial/referral-kural-kitapcigi.html)
  - Seçenek C: Admin panelinde görüntülenen sayfa

**Öneri:** Önce oranları netleştir (contributor %15 mi %20 mi?), sonra emlakçı kuralını tanımla, sonra dokümante et.

---

## 10. Paketleme/Abonelik Sistemi (m20, m21, m22, m23)

**Mevcut durum:** Hiç başlamadı, ürün kararı bekliyor.

**Sorular:**
- Paketler neler olacak?
  - Default (ücretsiz): Mevcut özellikler
  - Talep Edilebilir: Hangi özellikler? (Etkinlik oluşturma, teklif yayınlama, referral oluşturma)
  - Premium: Hangi özellikler? (Çoklu hedef şehir, öncelikli listeleme)
- Fiyatlandırma:
  - Aylık mı, yıllık mı?
  - Kaç EUR/USD?
- Ödeme altyapısı:
  - Stripe mı, Paddle mı, başka mı?
  - Fatura kesimi gerekli mi?
- Abonelik paketi:
  - Aylık otomatik yenileme mi?
  - İstendiğinde iptal edilebilir mi?

**Öneri:** Ürün kararı gerekli — önce paket içeriklerini tanımla, sonra fiyatlandırma, sonra altyapı. Bu büyük bir iş, sonraki faz.

---

## Özet: Öncelik Sırası

| Öncelik | Madde | Neden |
|---------|-------|-------|
| **1** | m91, m93 (kafe katılım bildirimi) | Basit, kullanıcı deneyimi için önemli |
| **2** | m12 (eski üye e-postası) | Altyapı hazır, segment + içerik gerekli |
| **3** | m19 (referans kitapçığı) | Dokümantasyon işi, oranları netleştir |
| **4** | m135 (Cadde logosu) | Tasarım bekleniyor |
| **5** | m101 (şok/pano) | Netleştirme gerekli |
| **6** | m167 (blog↔Cadde) | Karmaşık, sonraki faz |
| **7** | m94 (video yükleme) | Karmaşık, sonraki faz |
| **8** | m95 (telefon doğrulama) | SMS sağlayıcı + bütçe gerekli |
| **9** | m14, m15 (çoklu rol) | Şema değişikliği, ertele |
| **10** | m20-23 (paketleme) | Ürün kararı, büyük iş |

---

## Cevap Bekleyen Sorular

1. **m91/m93:** Kafe katılım bildirimi — A/B/C seçeneklerinden hangisi?
2. **m94:** Video yükleme — şimdi mi, sonraki faz mı?
3. **m95:** Telefon doğrulama — SMS sağlayıcı seçildi mi?
4. **m101:** Şok/pano formatı — ne demek?
5. **m135:** Cadde logosu — tasarım var mı?
6. **m167:** Blog↔Cadde döngüsü — otomatik mi, manuel mi?
7. **m12:** Eski üye e-postası — segment tanımı + içerik onayı
8. **m14/m15:** Çoklu rol — gerekli mi?
9. **m19:** Referans kitapçığı — contributor oranı %15 mi %20 mi?
10. **m20-23:** Paketleme — paket içerikleri + fiyatlandırma
