# CorteQS Dijital Gruplar Politikası

**Sürüm:** 1.1 · **Tarih:** 27 Eylül 2026 · **Kapsam:** WhatsApp, Telegram ve Discord grup dizini (corteqs.net/addcom)
**v1.0'dan farkı:** Form kararları, rozet adları, kategori listesi ve link görünürlüğü eklendi.

> **Ana fikir:** Linkini saklama, kapını paylaş.
> Admin ham davet linki yerine CorteQS grup sayfasını paylaşır. Katılmak isteyen telefonunu doğrular, admin onaylar, spam kapıda kalır.

---

## 1. Grubu kim ekleyebilir?

| Ekleyen | Akış | Yayın |
|---|---|---|
| **Grup admini** | Formda "Evet, adminiyim" → gönderimden sonra sahiplik doğrulaması | İlk 100 grup moderasyondan geçer. Sonrasında anında yayın, 72 saat "Yeni" etiketi ve örneklem denetimi |
| **Admin olmayan üye** | Formda "Hayır, öneriyorum" | **Her zaman moderasyona düşer.** Onaylanırsa "Üye önerisi" etiketiyle çıkar |
| **CorteQS ekibi / elçi** | İç ekleme | Moderasyondan geçer, "Üye önerisi" etiketi alır |

**Sahiplik kanıtı:** Admin, grup adının sonuna 10 dakikalığına sistemin verdiği kodu ekler (ör. `· CQ4821`). Sistem davet sayfasından kodu okur, admin kodu sonra siler. Otomatik okuma mümkün değilse yedek yöntem ekran görüntüsü ve manuel onaydır.

**İtiraz hakkı:** Gerçek admin istemezse grup **24 saat içinde, gerekçe sorulmadan** kaldırılır.

---

## 2. Ekleme formu

Kullanıcı fiilen üç şey yazar: link, açıklama, şehir. Geri kalanı otomatik dolar ya da tek tıkla seçilir.

| Sıra | Alan | Kural |
|---|---|---|
| 1 | Davet linki | Zorunlu. Platform, grup adı ve görsel linkten otomatik gelir |
| 2 | Grup adı | Otomatik dolar, düzeltilebilir |
| 3 | Kategori | Zorunlu, tek seçim (bkz. Bölüm 5) |
| 4 | Ülke / Şehir | Otomatik tamamlamalı seçim. "Global" seçilirse bir hedef ülke de seçilir |
| 5 | Kısa açıklama | Zorunlu, en fazla 160 karakter |
| 6 | Bu grubun admini misin? | Evet / Hayır |
| 7 | Grup Sözü onayı | Onay kutusu |

**Formda olmayanlar:** Platform seçimi, üye sayısı, telefon numarası.
**Gönderimden önce yapılan kontroller:** Link formatı doğru mu, grup zaten listede mi, davet sayfası açılıyor mu.
**Kullanıcı başına sınır:** Günde en fazla 5 grup gönderimi.

---

## 3. Grup sayfasındaki gönderiler

1. Adminin gönderisi doğrudan yayına çıkar.
2. Admin olmayanın gönderisi **önce grup adminin onay kuyruğuna** düşer.
3. Admin 48 saatte işlem yapmazsa gönderi CorteQS moderasyonuna geçer.
4. Sahiplenilmemiş gruplarda gönderiler doğrudan CorteQS moderasyonuna gider.
5. Onaylanmış 5 gönderisi olan ve şikayet almamış üye o grupta **güvenilir üye** olur: gönderisi önce yayına çıkar, sonra denetlenir.

---

## 4. Kırmızı çizgiler

Aşağıdakilerden biri varsa grup yayınlanmaz, yayındaysa kaldırılır:

1. Link çalışmıyor, grup dolu veya kapalı.
2. Vize, oturum, çalışma izni, denklik veya randevu slotu satışı ya da "garantili" aracılık.
3. Kripto sinyal, yatırım kulübü, MLM, garantili getiri, borç/kredi aracılığı.
4. Katılım için kimlik, pasaport, adres gibi kişisel veri isteme.
5. Nefret, şiddet, taciz veya yetişkin içerik.
6. Reşit olmayanlara yönelik grup, Seviye 2 doğrulanmış bir kuruluş (okul, dernek, veli birliği) tarafından eklenmemişse.
7. Parti veya seçim kampanyası aracı olan grup. Genel tartışma içeren topluluk grupları bu kapsamda değildir.

**2, 4 ve 6. maddelerin ihlali doğrudan kalıcı kaldırma sebebidir.**

---

## 5. Kategoriler

Filtreler ve kartlar aynı listeyi kullanır. "Diğer" kategorisi yoktur.

| Kategori | Kapsam |
|---|---|
| Şehir & Yaşam | Şehir, mahalle, yeni gelenler grupları |
| Meslek & Kariyer | Meslek ağları, iş arama, İK |
| İş & Girişim | Girişimcilik, yatırım, ticaret |
| Alumni & Akademik | Mezun ağları, öğrenci ve akademisyen grupları |
| Dayanışma & Yardım | Karşılıklı destek, bilgi paylaşımı |
| Aile & Çocuk | Ebeveyn, çocuk ve gençlik grupları (Bölüm 4, madde 6 geçerli) |
| Hobi & Kültür | Spor, sanat, dil pratiği, kültür etkinlikleri |

---

## 6. Etiketler ve rozetler

| Etiket | Anlamı |
|---|---|
| **Sahibi doğruladı** | Grubu gerçek admini ekledi ve sahipliğini kanıtladı |
| **Üye önerisi** | Grubu admin olmayan biri önerdi, admin henüz sahiplenmedi |
| **Yeni** | İlk 72 saat |
| **Onaylı Grup** | Grup Sağlık Skoru 70 ve üzeri |

Skor hesaplanana kadar kartta skor alanı gösterilmez.

---

## 7. Grup Sağlık Skoru (0–100)

Skor sıralamayı belirler ve admine iyileştirme rehberi olarak gösterilir.

| Kriter | Puan |
|---|---|
| Açıklama, şehir ve kategori dolu | 15 |
| Yazılı grup kuralları var | 15 |
| Admin doğrulanmış ve kuyruğu 48 saatte işliyor | 15 |
| Link haftalık kontrollerde çalışıyor | 15 |
| Doğrulanmış üyelerden tavsiye | 20 |
| Son 90 günde onaylanmış şikayet yok | 20 |

70 ve üzeri gruplar "Onaylı Grup" rozeti ve Instagram'da paylaşılabilir rozet görseli alır.

---

## 8. Güvenlik kuralları

- **Link görünürlüğü:** Davet linki sayfa kaynağında yer almaz. "Katıl" butonuna basan ziyaretçi giriş yapmamışsa kısa kayıt penceresi açılır, giriş yapmış kullanıcı linke yönlendirilir. İkinci aşamada katılım isteği akışı (telefon doğrulama ve admin onayı) açılır.
- **Link kontrolü:** Haftalık. İki kez üst üste çalışmazsa grup gizlenir, admine bildirim gider.
- **Şikayet eşiği:** En az 7 günlük, farklı ve doğrulanmış **3 hesaptan** gelen şikayet grubu inceleme bitene kadar gizler.
- **Uyarı sistemi:** 1. ihlal uyarı · 2. ihlal 30 gün askı · 3. ihlal kalıcı kaldırma ve yeni grup ekleme yasağı.
- **Gizlilik:** Üye numaraları gösterilmez ve toplanmaz. Admin numarası gizlidir, iletişim platform mesajıyla kurulur.
- **Yenileme:** Admin rolü yılda bir kısa onayla yenilenir.

---

## 9. Roller ve ücret

- **Community_WhatsAppAdmin (ücretsiz):** Tek grup yöneten kişi.
- **Organization_DigitalCommunity (ücretli):** Birden fazla grubu olan ve üye yönetimi (UYE) isteyen ağlar.

---

## 10. Grup Sözü (sitede ve formda gösterilir)

> CorteQS'te listelenen her grubun çalışan bir linki ve belirli bir amacı vardır. Grup sahibi istemezse grubu 24 saat içinde kaldırırız. Vize, oturum veya belge satan, yatırım vaat eden ya da kişisel veri isteyen grupları yayınlamayız. Grup sayfasındaki gönderiler önce grup yöneticisinin, sonra ekibimizin onayından geçer. Telefon numaranızı hiçbir grup sahibiyle veya üçüncü kişiyle paylaşmayız.
