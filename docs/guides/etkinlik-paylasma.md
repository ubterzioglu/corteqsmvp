# Etkinliği Nasıl Paylaşırım?

Bu rehber, etkinlik oluşturmayı, yönetmeyi ve paylaşmayı açıklar.

## Etkinlik Oluşturma

### Adım Adım

1. Profil sayfanıza gidin
2. Sol menüden **"Etkinliklerim"** sekmesini seçin
3. **"Yeni Etkinlik"** butonuna tıklayın
4. Formu doldurun:
   - **Başlık**: Etkinlik adı (zorunlu)
   - **Açıklama**: Etkinlik detayları (zorunlu)
   - **Kategori**: Etkinlik türü (zorunlu)
   - **Tür**: Online, yüz yüze, hibrit (zorunlu)
   - **Tarih**: Etkinlik tarihi (zorunlu)
   - **Saat**: Başlangıç ve bitiş saati (opsiyonel)
   - **Ülke/Şehir**: Etkinlik konumu (opsiyonel)
   - **Konum**: Açık adres (opsiyonel)
   - **Online URL**: Etkinlik bağlantısı (online etkinlikler için)
   - **Fiyat**: Ücret bilgisi (opsiyonel)
   - **Maksimum katılımcı**: Kontenjan (opsiyonel)
   - **Kapak görseli**: Etkinlik görseli (opsiyonel, JPG/PNG, max 5 MB)
   - **Etiketler**: Anahtar kelimeler (opsiyonel)
   - **Düzenleyici adı**: Etkinliği düzenleyen kişi/kurum (opsiyonel)
   - **Kayıt URL'si**: Dış kayıt bağlantısı (opsiyonel)
5. **"Etkinlik Oluştur"** butonuna tıklayın

### Etkinlik Onayı

**Tüm etkinlikler otomatik olarak yayınlanır.** İlk onay kuralı kaldırıldı. Etkinliğiniz oluşturulduğu anda Cadde ve etkinlik sayfasında görünür.

### Aktif Etkinlik Sınırı

- Aynı anda **maksimum 2 aktif etkinliğiniz** olabilir
- "Aktif" = yayınlanmış + tarihi geçmemiş
- 2 aktif etkinliğiniz varsa, birinin tarihi geçene kadar yeni etkinlik oluşturamazsınız
- Bu sınır tüm üyelere uygulanır (bireysel dahil)

## Etkinlik Yönetimi

### Etkinlikleri Görüntüleme

1. **"Etkinliklerim"** sekmesine gidin
2. Burada tüm etkinliklerinizi görebilirsiniz:
   - **Yayınlanmış**: Aktif ve geçmiş etkinlikler
   - **Taslak**: Henüz yayınlanmamış etkinlikler (varsa)

### Etkinlik Düzenleme

1. Etkinlik kartındaki **"Düzenle"** butonuna tıklayın
2. Alanları güncelleyin
3. **"Kaydet"** butonuna tıklayın

**Not**: Geçmiş etkinlikler düzenlenemez.

### Etkinlik Silme

1. Etkinlik kartındaki **"Sil"** butonuna tıklayın
2. Onay penceresinde **"Sil"** butonuna tıklayın

**Not**: Silinen etkinlikler geri getirilemez. Katılımcılar bilgilendirilmez.

## Etkinlik Paylaşımı

### Paylaşım Bağlantısı

Her etkinliğin kendine özel bir paylaşım bağlantısı vardır:

```
https://corteqs.net/events/<event-id>?share=1
```

Bu bağlantıyı:
- WhatsApp, Telegram, e-posta ile paylaşabilirsiniz
- Sosyal medyada paylaşabilirsiniz
- QR kod olarak yazdırabilirsiniz

### Paylaşım Butonları

Etkinlik detay sayfasında şu paylaşım butonları bulunur:
- **WhatsApp**: WhatsApp'ta paylaş
- **Telegram**: Telegram'da paylaş
- **E-posta**: E-posta ile gönder
- **Bağlantı kopyala**: URL'yi panoya kopyala

### Etkinliği Cadde'de Paylaşma

Etkinliğinizi Cadde akışında da paylaşabilirsiniz:

1. Etkinlik detay sayfasına gidin
2. **"Cadde'de Paylaş"** butonuna tıklayın
3. Gönderi metnini düzenleyin (opsiyonel)
4. **"Paylaş"** butonuna tıklayın

Bu, etkinliğinizin Cadde akışında bir gönderi olarak görünmesini sağlar.

## Etkinlik Bildirimleri

### E-posta Bildirimi

Etkinliğiniz yayınlandığında **otomatik olarak e-posta alırsınız**. Bu e-posta:
- Etkinlik detaylarını içerir
- Paylaşım bağlantısı içerir
- Ayarlarınızda `email.event_published.enabled` anahtarı açık olmalıdır (varsayılan açık)

### Katılımcı Bildirimleri

Etkinliğinize katılan kullanıcılar:
- Etkinlik yaklaştığında hatırlatma e-postası alabilir
- Etkinlik değişirse bilgilendirilir
- Etkinlik silinirse bilgilendirilir

## Sık Sorulan Sorular

### Etkinliğim neden görünmüyor?

- **Aktif sınır**: 2 aktif etkinliğiniz var mı? Önce birinin tarihi geçmeli
- **Tarih geçmemiş mi?**: Geçmiş tarihli etkinlik oluşturamazsınız
- **Yayınlanmış mı?**: Etkinlik otomatik yayınlanır, onay beklenmez

### Etkinliği iptal edebilir miyim?

Evet, etkinlik detay sayfasından **"Sil"** butonuna tıklayarak iptal edebilirsiniz. Ancak katılımcılar bilgilendirilmez — manuel olarak duyurmanız gerekir.

### Etkinlik tarihini değiştirebilir miyim?

Evet, etkinlik detay sayfasından **"Düzenle"** butonuna tıklayarak tarihi güncelleyebilirsiniz. Katılımcılar değişiklikten haberdar edilir.

### Kapak görseli yüklenemiyor

- Dosya boyutu 5 MB altında mı?
- Format JPG veya PNG mi?
- İnternet bağlantınızı kontrol edin

### Etkinlik e-postası almadım

- **Ayarlar**: Bildirim tercihlerinizde `email.event_published.enabled` açık mı?
- **Spam klasörü**: E-posta spam klasörüne düşmüş olabilir
- **E-posta adresi**: Profilinizdeki e-posta adresi doğru mu?

## Etkinlik İstatistikleri

Etkinlik detay sayfasında şu istatistikleri görebilirsiniz:
- **Katılımcı sayısı**: Kaç kişi katılacağını işaretledi
- **Görüntüleme sayısı**: Etkinlik sayfası kaç kez görüntülendi
- **Paylaşım sayısı**: Kaç kez paylaşıldı

## Sorun mu yaşıyorsunuz?

Etkinlik oluşturma veya yönetimi ile ilgili sorun yaşıyorsanız:
- Tarayıcınızı güncelleyin
- Önbelleği temizleyin (Ctrl+Shift+Delete)
- Farklı bir tarayıcı deneyin

Sorun devam ederse **info@corteqs.net** adresine e-posta gönderin.
