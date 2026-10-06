# CorteQS — Kalan İşler (Sade Anlatım)

*6 Ekim 2026 · Teknik bilgi gerekmez. Bu dosya, "tek plan" dosyasının (`2026-10-06-tek-plan-kalan-isler.md`) herkesin anlayacağı dille yazılmış hâlidir.*

**Nasıl okunur?** Üç bölüm var:
1. **Sadece siz yapabilirsiniz** — şifre, hesap, karar gibi şeyler.
2. **Yazılımcı/yapay zekâ yapar** — sizden bir şey beklemez, sadece bilgi için.
3. **Sıra: önce ne, sonra ne?**

Sorulara "Evet / Hayır / Bilmiyorum" demeniz yeterli. Her sorunun yanında bizim önerimiz yazıyor.

---

## 1. Önce durum: Neredeyiz?

Şunu bir ev gibi düşünün: evin çoğu bitti, ama bazı odaların boyası yarım, bazı kapıların anahtarı henüz verilmedi.

- Site çalışıyor. Yeni özelliklerin çoğu yazıldı.
- **Ama** yazılanların bir kısmı henüz "kaydedilmedi" (bilgisayarda duruyor, ortak arşive girmedi). Bilgisayar bozulursa kaybolur.
- Bir kısım değişiklik **sitede yayında mı değil mi** — bunu kimse kanıtlamadı. "Yapıldı" deniyor ama emin değiliz.
- Eski raporlarda **"bitti"** yazan iki iş aslında bitmemiş (hesap silme özelliği boş bir iskelet; sebebi aşağıda).

Yani: **"Bitti" yazan her şeye hemen güvenmeyeceğiz, tek tek kontrol edeceğiz.** Planın ilk işi bu.

---

## 2. 🔴 EN ACİL: Güvenlik (sadece siz yapabilirsiniz)

### 2.1 Anahtarlar internette görünüyor olabilir

**Ne oldu?** Sitenin yazılım arşivi (GitHub) **herkese açık**. Geçmişte birisi, sitenin "ana anahtarını" ve veritabanı şifresini yanlışlıkla bu arşive koymuş. Bu, evin yedek anahtarını kapı paspasının altına bırakmak gibi — kimse almadıysa şanslıyız, ama emin olamayız.

**Neden önemli?** Bu anahtarları bulan biri üyelerin bilgilerine (isim, e-posta, telefon) ulaşabilir. Bu aynı zamanda **KVKK/GDPR** (kişisel veri koruma yasası) konusu.

**Ne yapılmalı? (sırayla, ajan yapamaz)**
1. Arşivi **gizli (private)** yapın.
2. Bütün anahtarları ve şifreleri **değiştirin** (eski olanlar çöp olsun): veritabanı ana anahtarı, veritabanı şifresi, iki erişim jetonu, WhatsApp jetonu, bot şifresi, yönetici şifresi.
3. Açık oturumları kapatın, ele geçirilmiş olabilecek 5 kullanıcıya "şifreni yenile" deyin.
4. Arşivin geçmişinden o gizli bilgileri **silin** (teknik bir temizlik; yazılımcıyla birlikte).
5. GitHub'a "eski kopyaları da temizleyin" diye başvurun.
6. Hukuk/KVKK açısından bildirim gerekip gerekmediğine karar verin.

> **Soru 1:** Bu güvenlik temizliğini **bu hafta** başlatabilir misiniz? Birisi sizinle oturup adım adım yapsa daha rahat olur mu?
> *Bizim önerimiz: Evet, bu hafta. Başka hiçbir şey bunun kadar acil değil.*

### 2.2 Garip bir gece ziyareti

**Ne oldu?** 26 Eylül akşamı yaklaşık 19:11'de (Berlin saati), birisi veritabanındaki tabloları **alfabetik sırayla** tek tek açıp bakmış — 301 kez. Sanki bir kişi bir binadaki tüm odaların kapısını sırayla açıp içeri bakmış gibi.

> **Soru 2:** 26 Eylül akşamı, Berlin saatiyle yaklaşık 19:00'da sitenin arka tarafında **siz ya da ekipten biri** gezinti/test yaptı mı?
> - *Evet, bizdik* → konu kapanır.
> - *Hayır / hatırlamıyorum* → "Kötüye kullanıldı mı?" sorusu açık kalır, daha derin bakmak gerekir.

### 2.3 CV dosyaları

**Ne oldu?** Üyelerin CV'leri dosya kutularından herkese açık görünüyordu; bu kutular kapatıldı. Ama internetin "hızlı hafızası" (önbellek) bir süre eski bağlantıları sunmaya devam edebilir.

> **Soru 3:** Daha önce **birisine bir CV bağlantısı gönderildi/paylaşıldı** mı?
> - *Evet* → CV'leri yeni adla yeniden yükleyeceğiz.
> - *Hayır* → bir şey yapmaya gerek yok, süre dolunca kendiliğinden düzelir.

---

## 3. Sizin vereceğiniz kararlar

Burada kod yok; sadece sizin "evet/hayır"ınız lazım. Her karar, bekleyen bir işi açıyor.

### A. Güvenlik kapıları (5 küçük soru)

Sitenin bazı yerlerinde "kapı çok açık" kalmış. Kapatmak istiyoruz ama kapatırsak bir şey bozulabilir diye soruyoruz.

| # | Ne diyor? | Basit anlatım | Önerimiz |
|---|---|---|---|
| 1 | Bildirimlerin doğrudan eklenmesi | Bildirimleri herkes doğrudan yazabiliyor olabilir. Sadece sistemin yazabilmesini istiyoruz. | **Evet, kapatalım** |
| 2 | WhatsApp grup formunun eski kapısı | Yeni, güvenli bir kapı yaptık. Eski kapı hâlâ açık. | **Evet, eskiyi kapatalım** |
| 3 | Telefon doğrulama "tuzu" | Telefon numaralarını gizleyen şifrenin ayarını ayırmak istiyoruz. **Dikkat: bunu yaparsak şu an kayıtlı şifreli veriler bozulur.** | **Şimdilik dokunmayalım** |
| 4 | Anonim formlarda sütun izni | Herkesin doldurduğu formlarda hangi alanların yazılabileceğini sınırlamak. | **Evet** |
| 5 | Eski iş ilanı kuralı | Eski, gereksiz bir kural var. | **Evet, kaldıralım** |

> **Soru 4:** Yukarıdaki 5 öneriye onay veriyor musunuz? (Hepsini onaylayın ya da hangisine "hayır" dediğinizi söyleyin.)

### B. Rol (meslek/görev) yapısı

Üyelerin seçtiği rollere (doktor, diş hekimi, insan kaynakları, güzellik…) yeni seçenekler eklenecek. Elinizdeki Excel'de bazı satırlar "açık nokta" olarak işaretli — yani siz henüz karar vermemişsiniz.

> **Soru 5:** Excel'deki "açık nokta" satırları için karar verdiniz mi? Verdiyseniz hangi satırlar için, vermediyseniz biz **sadece kararı belli satırlarla** ilerleyelim mi?
> *Önerimiz: Evet, sadece kararı belli olanlarla ilerleyelim; kalanını siz bitirince ekleriz.*

> **Soru 6:** Yeni bir alt rol (örneğin "Diş Hekimi") eklendiğinde, sisteme **yepyeni bir rol satırı** açılsın mı, yoksa mevcut rolün altına etiket olarak mı eklensin?
> *Önerimiz: Yeni satır, ama sadece siz "evet" derseniz. Cevap gelmeden bu iş başlamaz.*

### C. Etkinlikler (kimin etkinliği direkt yayınlanır?)

İki farklı kural yazılmış ve **birbiriyle çelişiyor**:
- Kural 1: Her etkinliği önce yönetici onaylasın.
- Kural 2: Herkesin etkinliği otomatik yayınlansın (limit: 2 etkinlik).

5 Ekim'de siz "otomatik yayın" demiştiniz.

> **Soru 7:** Hâlâ **"herkes etkinliğini otomatik yayınlasın"** kuralındayız, değil mi? (Bekleyen eski etkinlikler de, kimseye mail atmadan yayınlanacak.)
> *Evet ise: "onay bekleyen" kural silinir.*

### D. Veri kararları

> **Soru 8:** **241 konsolosluk kaydı** hazır ama hepsi "inceleme bekliyor" durumda. Sitede **herkese gösterilsin mi**?
> *Önerimiz: Önce 10–20 tanesini siz bir bakın, sonra hepsini açalım.*

> **Soru 9:** Sitedeki arama kutusu, **Cadde'deki gönderileri** de bulsun mu? Sadece herkese açık, silinmemiş, yasaklı olmayan ve kişisel bilgi içermeyen gönderiler görünür.
> *Önerimiz: Evet.*

> **Soru 10:** "AI Legion" için kategori **"Meslek & Kariyer"** ve **"Hobi & Kültür"** olarak, "TED InnoVenture" için konum **Global** olarak yazıldı. Doğru mu?

### E. Şikayet sistemi (WhatsApp/Telegram grupları)

Gruplar hakkında şikayet alınıyor. Birkaç kural belirsiz:

> **Soru 11:** Bir grup yöneticisi **kendi grubunu şikayet edebilir** mi?
> *Önerimiz: Hayır, yasak.*

> **Soru 12:** Bir şikayet **onaylanınca** o grup için "1 ihlal" mi sayılsın, yoksa birden fazla onay mı gereksin?
> *Önerimiz: Her onaylanan şikayet = 1 ihlal.*

> **Soru 13:** Onaylanan şikayetten sonra grup **görünmez** mi kalsın, yoksa yeniden görünsün mü?
> *Önerimiz: Görünmez kalsın, yönetici bir gün bakıp karar versin.*

> **Soru 14:** Şikayet geldiğinde **grup yöneticisine otomatik e-posta** gitsin mi?
> *Önerimiz: Evet.*

> **Soru 15:** "Şikayet almamış üye" ifadesi — şu an sadece **gruba** yapılan şikayetleri sayıyoruz, **kişiye** yapılanları değil. Kişiye yapılan şikayetler de sayılsın mı?

> **Soru 16:** Eski onay sütunları (`member_approved`, `admin_approved`) artık kullanılmıyor. **Tamamen silelim mi?** (Bu geri alınamaz.)
> *Önerimiz: Önce bir hafta bekleyelim, sorun çıkmazsa silelim.*

### F. Küçük sorular

> **Soru 17:** Haftalık "tavsiye isteyenler" sayımı (WAU) — kişiler **Tavsiye İste** özelliğini kullandıklarında "aktif kullanıcı" sayılsın mı?
> *Önerimiz: Evet.*

> **Soru 18:** Ana klasörde duran `maillogo.png` ve `skills-lock.json` dosyaları ne olsun? **Bir klasöre taşınsın** mı, yoksa **dikkate alınmasın** mı?
> *Önerimiz: Logoyu "images" klasörüne taşıyalım, diğerini yok sayalım.*

> **Soru 19:** SMS yerine telefon doğrulamasını **WhatsApp** üzerinden yapma yoluna girdik (Twilio yok). Eski metin hâlâ "Twilio" diyor — güncelleyelim mi?
> *Önerimiz: Evet.*

---

## 4. Dış dünyada bekleyen işler (başkalarına bağlı)

Bunlar bizim elimizde değil; ilgili şirketlerin/panellerin işlemesi gerek.

| İş | Kim? | Ne gerekli? |
|---|---|---|
| **Meta (Facebook) iş doğrulaması** | Siz | Şirket belgelerinizi yükleyip onay beklemek. Bu onaylanmadan **WhatsApp ile telefon doğrulama** ve **WhatsApp botu** çalışmaz. Bekleme süresi uzun olabilir; **bu yüzden ilk gün başlatın.** |
| **WhatsApp botu** | Siz + biz | Meta panelinde bağlantı adresini girmek, gerçek bir telefonla 9 senaryo denemek. |
| **Stripe (ödeme sistemi)** | Siz + muhasebeci | Hesap açmak, **vergi rejimi** hakkında mutlaka bir uzmana danışmak (bu hata kaldırmaz), iade koşullarını yazmak. Hedef tarih: 1 Ocak 2027. |
| **Sunucu (Coolify)** | Siz | `http://corteqs.net` 404 veriyor; `mvp.corteqs.net` eski sürümü gösteriyor. |
| **El ile testler** | Siz | İki gerçek e-posta denemesi (kayıt onayı, revizyon tamamlandı), WhatsApp grup linki ekleme denemesi. |
| **Takvim** | Siz | ~17 Ekim: Dijital Gruplar özelliğinin iki haftalık sonuçlarına birlikte bakmak. |

> **Soru 20:** Meta iş doğrulaması başvurusu **yapıldı mı**? Yapılmadıysa bu hafta başlatabilir misiniz?

> **Soru 21:** Stripe için **şu an bir muhasebeci/vergi danışmanı** var mı?

---

## 5. Yazılımcı / yapay zekânın yapacakları (bilgi için)

Sizden bir şey beklemez. Sadece "arkada ne dönüyor" diye bilin.

1. **Kayıt temizliği.** Yazılmış ama kaydedilmemiş dosyaları tek tek okuyup, canlı sistemle karşılaştırıp kaydetmek.
2. **Bekleyen değişiklikleri incelemek.** Bazı veritabanı değişiklikleri (etkinlik onayı vs.) birbirini çiğniyor olabilir; **uygulamadan önce** sadece kontrol edeceğiz.
3. **Hesap silme özelliği.** Bir üye "hesabımı sil" dediğinde adı/e-postası anonimleşecek ama topluluk içeriği bozulmayacak. Ekranda "SİL" yazma onayı çıkacak. **Gerçek silme, sizin ayrıca onayınızla, sadece test hesabıyla denenir.**
4. **Rol talepleri.** Üyeler 3 adımda rol seçebilecek.
5. **CV paylaşma anahtarı.** "CV'mi Premium üyeler görebilsin" düğmesi, **varsayılan olarak KAPALI** olacak.
6. **Rehberler.** 3 kullanım rehberi (belge yükleme, reklam verme, etkinlik paylaşma) ekrandaki yazılarla birebir uyuşuyor mu diye kontrol edilecek.
7. **Anahtar geçişi.** 3 arka plan fonksiyonu yeni anahtar sistemine taşınacak (eski anahtarı iptal etmeden önce hazırlık).
8. **⚠️ "Ödeme başarılı" yalanı.** Şu an iki ekran, gerçek ödeme olmadığı hâlde kullanıcıya **"ödeme başarılı"** diyor. Gerçek ödeme gelene kadar bu mesaj düzeltilecek.
9. **Dijital Gruplar son rötuşlar.** Eski forma son verilecek, eski ekran tek dile indirilecek.
10. **Veritabanı tip dosyasını** güncellemek, **WhatsApp bot kodunu** gözden geçirmek.
11. **Kayıt defteri (KALANLAR.md)** çok eski ve şişik (3.260 satır); bu yeni plana göre sadeleştirilecek.

---

## 6. Canlıya alma (deploy) — sıra önemli

Bir kutuyu paketlerken önce içindekileri koyup sonra kapağı kapattığınız gibi: sıra bozulursa bir şey düşer.

1. **Önce arka plan fonksiyonları** (e-posta gönderen, CV bağlantısı veren, hesap silen).
2. **Sonra veritabanı değişiklikleri**, tek tek, her birinden önce canlıda "bu zaten var mı?" diye ölçerek.
3. **En son ekran (frontend).**
4. **Sonra hemen kontrol:** güvenlik başlıkları, tarayıcıda hata var mı, ana sayfalar açılıyor mu.
5. **Yeni ekranlara tek tek bakmak:** menü, etkinlik maili, ilan kotası, CV anahtarı, ruhsat yükleme, "kimler beğendi".

> **Soru 22:** Canlıya alma işini **yapay zekâ mı yapsın, yoksa siz/bir yazılımcı mı yapsın?** (Yapay zekâya izin vermezseniz biz sadece "yapılacaklar listesi" hazırlarız.)
> *Önerimiz: Siz ya da bir yazılımcı yapsın; biz her adımda "şunu kontrol et" diye rehberlik edelim.*

---

## 7. Bilerek yapılmayacaklar

Bunlar "unutulmadı" — **bilerek** bekletiliyor:

- Sitenin arama motoru ayarları (JSON-LD, robots.txt) — dokunulmayacak.
- `/liderlik`, `/addcom`, `/tavsiye` sayfaları — yeterli kayıt birikince arama motoruna eklenecek.
- Eski 4 kariyer ilanı — silinmeyecek (en az bir başvuru tam bir tur dönmeden).
- "Kurucu 1000 üye = 99 €" kampanyası — ödeme sistemi gelince.
- Kurumsal "doğrulanmış" rozetinin dizine yayılması — ayrı plan.
- Taşınma Planlayıcı'daki 120 örnek servis — gerçek veri girilene kadar "DEMO" etiketi kalacak.

---

## 8. Önerilen sıra (tek bakışta)

| Sıra | Kim | Ne |
|---|---|---|
| **1. Bugün** | Siz | Soru 1 (güvenlik temizliği) + Soru 2 (26 Eylül gezintisi) cevabı |
| **2. Bu hafta** | Siz | **Meta iş doğrulaması başvurusu** (Soru 20) — uzun sürer, hemen başlasın |
| **3. Aynı anda** | Yapay zekâ | Kayıt temizliği → bekleyen değişiklik incelemesi → hesap silme → CV anahtarı → rol talepleri → rehberler |
| **4. Bu hafta içinde** | Siz | Soru 3–19 (evet/hayır kararları) |
| **5. Kararlar gelince** | Yapay zekâ | Şikayet sistemi, Dijital Gruplar, güvenlik kapıları |
| **6. Hazır olunca** | Siz/yazılımcı | Canlıya alma (Bölüm 6) |
| **7. Paralelde** | Siz | Stripe — muhasebeci bulma (Soru 21) |

---

## Cevap formu (kopyalayıp doldurabilirsiniz)

```
1. Güvenlik temizliği bu hafta başlasın mı?      : 
2. 26 Eylül ~19:00 gezintisi bizdik mi?          : 
3. Bir CV bağlantısı paylaşıldı mı?              : 
4. 5 güvenlik kapısı önerisine onay (hepsi/hangisi hayır)? : 
5. Excel açık noktaları — sadece kararı belli olanla ilerleyelim mi? : 
6. Yeni alt rol = yeni rol satırı mı?            : 
7. Etkinlik: herkese otomatik yayın doğru mu?    : 
8. 241 konsolosluk kaydı yayınlansın mı?         : 
9. Aramada Cadde gönderileri çıksın mı?          : 
10. AI Legion / TED InnoVenture bilgileri doğru mu? : 
11. Grup yöneticisi kendi grubunu şikayet edebilir mi? : 
12. Onaylanan şikayet = 1 ihlal mi?              : 
13. Şikayet sonrası grup görünmez mi kalsın?     : 
14. Şikayet gelince yöneticiye e-posta gitsin mi?: 
15. Kişiye yapılan şikayetler de sayılsın mı?    : 
16. Eski onay sütunları silinsin mi?              : 
17. Tavsiye kullananlar "aktif" sayılsın mı?      : 
18. maillogo.png / skills-lock.json ne olsun?     : 
19. Twilio metni güncellensin mi?                 : 
20. Meta iş doğrulaması başvurusu yapıldı mı?     : 
21. Muhasebeci/vergi danışmanı var mı?            : 
22. Canlıya almayı kim yapacak?                   : 
```
