# Cadde & Cafe — UX ve İçerik Değerlendirmesi

**Tarih:** 27 Ağustos 2026
**Kapsam:** `corteqs.net/cadde` ve Cafe oda görünümü — açık beta, masaüstü
**Not:** Sayfa giriş duvarının arkasında; değerlendirme ekran görüntüleri üzerinden yapıldı.

---

## Özet

Mekanik olarak çalışıyor. Sorun tasarımda değil, **doluluk ve hiyerarşide**. Üç başlık:

1. Dikey alan israfı — ilk gönderi fold'un altında kalıyor
2. Etkileşim gürültüsü — yedi ikon, hepsi sıfır
3. Soğuk başlangıç — akışta gerçek içerik yok

Üçüncüsü diğer ikisinden daha kritik. Header'ı düzeltmek 1 saatlik iş; boş akış ürünü öldürür.

---

## 1. Dikey alan israfı

### Sorun

İçerik başlamadan önce dört ayrı katman var:

| Katman | Yaklaşık yükseklik |
|---|---|
| Beta bandı | ~40px |
| Üst nav (Araçlar / Feedback / Profilim / Çıkış) | ~40px |
| Logo bandı (CorteQS + slogan) | ~90px |
| Sayfa başlığı (Diaspora Cadde) | ~70px |

Toplam ~300px. Sosyal akışta ilk gönderi fold'un üstünde olmalı; burada composer bile zar zor giriyor.

### Öneriler

- **Beta bandını kapatılabilir yap.** Kullanıcı bir kez kapatınca localStorage'da tutulsun.
- **Logo bandı ile sayfa başlığını birleştir.** Sol logo + sağ sayfa adı tek satırda.
- **Sloganı kaldır veya ana sayfaya bırak.** "Dünyadaki Türkleri Bir Araya Getiren Platform" ikinci ekranda zaten kesiliyor, dar viewport'ta kırılıyor. Giriş yapmış kullanıcıya pazarlama sloganı göstermeye gerek yok.
- **Scroll'da header'ı daralt.** Sticky kalsın ama yüksekliği yarıya insin.

---

## 2. "Caddeye Çık" butonu

### Sorun

Kullanıcı zaten Cadde'de. Sağ kolonda "Caddeye Çık" yazan siyah, yüksek kontrastlı bir CTA görünce ne yapacağını bilemez.

### Öneriler

Butonun gerçek işlevine göre yeniden adlandır:

- Paylaşım yapmaksa → composer zaten yukarıda duruyor, butonu kaldır
- Şehir/global geçişse → "Global Akışa Geç" veya "Şehir Değiştir"
- Görünürlük artırmaksa → "Paylaşımını Öne Çıkar"

---

## 3. Reaksiyon sistemi

### Sorun

Her gönderide yedi ikon: beğeni, kalp, emoji, yıldız, soru, yorum, paylaş. Hepsinin yanında `0`. Boş bir ağda bu sayılar boşluğu bağırıyor.

### Öneriler

- **Sıfır olan sayıları gizle.** Sadece ikon kalsın; sayı 1'e ulaşınca görünür olsun.
- **Reaksiyon sayısını üçe indir:** beğeni, soru, yorum.
  - "Soru" işareti diaspora akışında gerçekten değerli — içeriğin çoğu soru olacak, ve "ben de merak ediyorum" sinyali bu ağda beğeniden daha anlamlı.
  - Kalp / yıldız / emoji ayrımı bu aşamada erken. Kullanıcı hangi ikonu ne için kullanacağını bilmiyor.
- **Reaksiyonların altındaki boş gri şeridi düzelt.** Şu haliyle kırık render gibi görünüyor.
- **Yorum inputuna placeholder ekle.** Örn. "Yorum yaz…"

---

## 4. Soğuk başlangıç — en kritik madde

### Mevcut durum

Akıştaki içerik:

- "Tekrar bir deneme yapıyorum" — test gönderisi
- "Hello 2- Foto eklendiğinde refresh olmuyor sanki ya da ben göremedim" — bug raporu
- "Cadde açıldı" — CorteQS resmî duyurusu

Doha'dan giriş yapan bir beta kullanıcısı bunu görüyor. Bu bir ürün sorunu değil, içerik sorunu — ama ürünü öldüren şey bu.

### 4.1 Test içeriğini temizle

Bug raporun canlı akışta duruyor. Feedback kanalına taşı, akıştan sil. Test gönderileri için ayrı bir staging ortamı ya da sadece admin'e görünen bir görünürlük seviyesi kur.

### 4.2 Akışı tohumla

Cadde'nin ilk 50 gönderisi organik gelmez. Plan:

- Hedef şehirlerin her biri için **8–10 gerçek soru/not** hazırla: Berlin, Londra, Sydney, Dubai
- CorteQS resmî hesabı veya şehir elçisi hesaplarından yayınla
- Tarihleri geriye yay — hepsi aynı gün görünmesin

**İçerik zaten elinde.** Blog ve Reel serilerinde işlediğin konular doğrudan Cadde gönderisine dönüşür:

- Oturum izni süreçleri
- Çalışma vizesi ve iş arama
- Vatandaşlık başvuruları
- Okul kaydı ve denklik
- Kira, ev bulma, kefil
- Yaşam maliyeti karşılaştırmaları

Blogdan Cadde'ye, Cadde'den bloga döngü kurulabilir: blog yazısı Cadde'de soru olarak açılır, gelen yanıtlar bir sonraki blog içeriğini besler.

### 4.3 Boş şehir durumunu düzelt

Sağ kolondaki "Şehrini göremiyorsan ülke geneli akışı keşfedebilir veya ilk paylaşımı sen yapabilirsin" metni doğru ama yetersiz. **Kullanıcı ilk paylaşımı yapmaz.**

- Şehir boşsa en yakın dolu şehri veya ülke akışını **otomatik** göster
- Varsayılan filtre "Tümü"de kalsın
- Boş durumda "bu şehirde henüz kimse yok" demek yerine "Berlin'deki 12 paylaşımı gör" gibi dolu bir alternatif sun

---

## 5. Cafe — oda görünümü

### 5.1 Format sorusu: zaman kutulu oda + boş platform

Mevcut model: 2 saatlik canlı pencere (örn. 13:17 → 15:17, "49 dk kaldı"), 2/100 üye.

Boş bir akış kötüdür; boş bir **canlı** oda çok daha kötüdür. Kullanıcı girer, kimse yoktur, süre akmaktadır, çıkar ve bir daha denemez. Zaman baskısı dolu odada aciliyet yaratır, boş odada başarısızlığı hızlandırır.

Bu aşama için iki seçenek:

- **Async-first Cafe:** Odalar 24 saat – 7 gün yaşasın; "Canlı" ayrı bir etkinlik modu olsun. Küçük kullanıcı tabanında insanların aynı 2 saate denk gelme ihtimali düşük; asenkron oda en azından içerik biriktirir.
- **Programlı canlı Cafeler:** Ad-hoc "Cafe Aç" yerine platformun duyurduğu sabit slotlar — örn. "Berlin Oturum İzni Saati — her perşembe 20:00". Cadde'de ve Instagram'da önceden duyurulur, kritik kitle tek saate toplanır. Reel takvimiyle senkronize edilebilir.

İkisi birlikte de kurulabilir: async varsayılan, canlı slotlar haftalık ritüel.

### 5.2 Arayüz maddeleri

- **"2/100 üye":** Payda boşluğu vurguluyor. Kapasiteyi gizle, sadece "2 üye" göster; ya da doluluk %20'yi geçince göster.
- **"Cafe'yi Arşivle" konumu:** Oda canlıyken en görünür aksiyon odayı kapatmak. Host'a özelse bile kebab menüye (⋯) taşınmalı; ana pozisyonda "Davet Et" / "Paylaş" durmalı.
- **Süre bitince ne oluyor?** Arayüzde belirtilmiyor — içerik arşivleniyor mu, siliniyor mu, okunabilir mi? Kullanıcı bunu bilmeden yazmaz. Oda kartına tek satır: "Süre dolunca oda arşivlenir, içerik okunabilir kalır" (ya da gerçek davranış neyse).
- **Test verisi canlıda:** "agwdhjsajkkjsddfgsegdsfsdg" açıklamalı oda, sağ kolonda "Onaylı" rozetiyle listeleniyor. Onaylı rozetin ilk göründüğü yer test odası olmamalı.
- **Header:** Cadde'deki ~260–300px yığın burada da içerikten önce geliyor; tek düzeltme iki sayfayı da kurtarır.

### 5.3 İyi çalışanlar

- "Bu odadaki paylaşımlar yalnız cafe akışında görünür" notu net.
- Oda kartındaki bilgi hiyerarşisi (konum, süre, üye, host) doğru kurulmuş.

---

## 6. Doğrulanmış bug

**Fotoğraf eklendiğinde akış yenilenmiyor.**

Kendi test gönderinde de not edilmiş. Lovable'a **tek başına bir prompt** olarak verilmeli — akış componentine dokunan başka bir işle birleştirilmemeli.

---

## Öncelik sırası

| # | İş | Etki | Efor |
|---|---|---|---|
| 1 | Test içeriğini akıştan ve Cafe listesinden temizle | Yüksek | Dakikalar |
| 2 | Cafe format kararı: async-first mi, programlı canlı mı | Yüksek | Karar + günler |
| 3 | Şehir tohumlama içeriği (4 şehir × 8–10 gönderi) | Yüksek | Günler |
| 4 | Sıfır reaksiyon sayılarını gizle | Orta | Saatler |
| 5 | Header konsolidasyonu (Cadde + Cafe ortak) | Orta | Saatler |
| 6 | Boş şehir → otomatik fallback | Orta | Saatler |
| 7 | Foto refresh bug'ı | Orta | Saatler |
| 8 | Cafe: süre sonu davranışını arayüzde belirt | Orta | Saatler |
| 9 | Cafe: "2/100" paydasını gizle, Arşivle'yi menüye taşı | Düşük | Saatler |
| 10 | "Caddeye Çık" etiketi | Düşük | Dakikalar |
| 11 | Reaksiyon sayısını 3'e indir | Düşük | Saatler |
