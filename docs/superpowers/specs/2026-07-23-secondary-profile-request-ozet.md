# İkinci Profil Talebi — Yapılanlar Özeti (2026-07-23)

## Ne yapıldı, kısaca

Bir kullanıcı artık, mevcut (Bireysel) profiline hiç dokunmadan, admin onayı ile
**ikinci bir profil** açabiliyor (ör. "Danışman — Doktor" gibi başka bir rol için).
Onay verilene kadar hiçbir yeni kayıt oluşmuyor; onaylanınca yeni profil otomatik
açılıyor ve kullanıcı onun sahibi (owner) oluyor.

## Akış — kullanıcı tarafında

1. Kullanıcı "Diğer Profiller" menüsünden **"+ Yeni Profil"** seçeneğine tıklıyor.
2. Açılan formda: bir rol seçiyor (ör. Danışman — Doktor), yeni profile bir başlık
   yazıyor, kısa bir not ekliyor.
3. "Talebi Gönder"e basınca, talep admin onay kuyruğuna düşüyor. Kullanıcıya
   "Talep gönderildi" bildirimi çıkıyor.
4. Aynı kullanıcı, bir talebi beklerken ikinci bir talep gönderemiyor
   ("zaten bekleyen bir profil talebiniz var" uyarısı çıkıyor) — bu bilinçli bir
   kısıt, karmaşıklığı azaltmak için.

## Akış — admin tarafında

1. Admin, `/admin/approvals` (Onay Kuyruğu) sayfasında yeni bir filtre seçeneği
   görüyor: **"Yeni profil talebi"**.
2. Talebi seçtiğinde hangi rol istendiğini, başlığı ve notu görüyor.
3. **Onaylarsa:** yeni bir profil kaydı otomatik oluşuyor, seçilen role bağlanıyor,
   kullanıcı o profilin sahibi yapılıyor. Kullanıcı bunu "Diğer Profiller"
   menüsünde otomatik olarak görüyor.
4. **Reddederse:** hiçbir yeni kayıt oluşmuyor, sadece talep "reddedildi" olarak
   işaretleniyor.

## Neden bu kadar az değişiklikle yapılabildi

Sistemde zaten "onay bekleyen istekler" için genel bir mekanizma vardı (rol
değişikliği, özellik talebi gibi işler hep aynı kuyruktan geçiyordu). Biz sıfırdan
bir sistem kurmadık — bu genel kuyruğa sadece yeni bir talep türü ("yeni profil")
ekledik. Bu yüzden:
- Yeni bir veritabanı tablosu **gerekmedi**.
- Admin ekranına yeni bir sayfa **gerekmedi** — var olan onay ekranına sadece bir
  filtre seçeneği eklendi.
- Kullanıcının profil geçiş menüsüne de dokunmadık — o zaten "sahip olduğun tüm
  profiller"i gösteriyordu, yeni profil oraya otomatik düştü.

## Yapılan teknik parçalar (kısa liste)

1. Veritabanında: onay kuyruğuna yeni talep türü tanımı + "kullanıcı talep
   oluşturabilsin" fonksiyonu.
2. Veritabanında: "admin onayladığında yeni profili gerçekten oluştur" mantığı
   (mevcut onay fonksiyonuna eklenen bir ek dal — diğer tüm eski onay türleri
   (rol değişikliği, görünürlük talepleri vb.) hiç etkilenmedi).
3. Uygulama tarafında: talebi gönderen küçük bir fonksiyon.
4. Uygulama tarafında: "+ Yeni Profil" formu (rol seçimi + başlık + not).
5. Uygulama tarafında: bu formu profil geçiş menüsüne bağlayan küçük bir ekleme.
6. Admin ekranına: yeni talep türünü gösteren filtre seçeneği.
7. Her adımdan sonra: testler yazıldı, kod incelendi, uçtan uca kontrol edildi.

## Kontrol/güvenlik notları

- İşlemi sadece admin onaylayabiliyor/reddedebiliyor — kullanıcı kendi kendine
  profil açamıyor.
- Eski profil hiçbir zaman değişmiyor veya kaybolmuyor — sadece yeni bir profil
  **ekleniyor**.
- Yapım sürecinde 3 küçük hata bulunup düzeltildi (yanlış bir veritabanı sütun
  adı, bir test/ekran uyumsuzluğu, ve bir işlemin yanlışlıkla "tamamlandı"
  raporlanması) — hepsi son kontrolde yakalanıp giderildi.
- İş, canlı veritabanına da uygulandı ve orada çalıştığı doğrulandı.

## Şu an durum

Kod main dalına birleştirildi (merge edildi), canlıya da uygulandı. Kullanıma hazır.
