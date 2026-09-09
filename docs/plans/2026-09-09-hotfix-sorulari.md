# Acil işler listesi — durum ve sorular

**Tarih:** 9 Eylül 2026
**Kime:** Burak
**Neden:** 5 Eylül'de acil listesine dört madde yazdın. Her birinin şu anda ne durumda
olduğuna tek tek baktım ve **dördünde de yazılandan farklı bir tablo çıktı.** Yanlış işe
girişmemek için önce birkaç şey netleşmeli.

> Sorular günlük dille yazıldı, teknik bilgi gerektirmiyor. Çoğu şıklı — sadece harfi
> söylemen yeter. Cevapları maddelerin altındaki yorum kutusuna yapıştırabilirsin.

---

## 1. ETKİNLİK

> **Yazdığın:** "Bence kolayca ekleyebileceğimiz ve kullanıcı çekecek bir başka fonksiyon
> 'Etkinlikler'. Bunu direkt insta'da yayabilir, cadde ve toollar ile beraber gerçek katma
> değer verecek bir işlevimiz daha olmuş olur."

**Durum:** Etkinlik için altyapının bir kısmı geçmişte yapılmış ama **yarım kalmış ve
içi tamamen boş** — tek bir etkinlik bile yok. Ayrıca Cadde'de bir "Etkinlikler" süzgeci
vardı, **4 Ağustos'ta senin kararınla kaldırıldı**. Gerekçe şuydu: kullanıcı etkinlik
paylaşımı yapamıyordu, dolayısıyla var olmayan bir şeyi süzen bir düğme duruyordu.

Yani "sıfırdan yapılacak" da değil, "açıp kullanacağız" da değil — arada bir yerde.

### Sorular

**1.** Etkinlik dediğinde aklında ne var?
- **(A)** Cadde'de normal paylaşım gibi, ama tarihi ve yeri olan bir paylaşım
- **(B)** Ayrı bir sayfa — etkinliklerin takvim ya da liste hâlinde göründüğü yer
- **(C)** Zaten olan Cafe'nin "şu gün şu saatte" hâli
- **(D)** Başka bir şey — anlat

**2.** Etkinliği kim oluşturabilsin?
- **(A)** Sadece biz (CorteQS) — yani bir duyuru panosu gibi
- **(B)** Onaylı kişiler (şehir elçileri, katkıcılar)
- **(C)** Herkes

**3.** Kullanıcı etkinliği görünce ne yapabilsin?
Sadece okusun mu, "geleceğim" diyebilsin mi, kayıt olsun mu, yoksa dış bir bağlantıya mı
gitsin (Zoom, Instagram canlı yayın vb.)?

**4.** İlk sürümde **olmamasına razı olduğun** şeyler neler?
Örnek: kimlerin geleceğinin listesi, hatırlatma maili, takvime ekleme, her hafta tekrar
eden etkinlik. Bunların hepsi ayrı iş. Hangileri olmadan da yayına çıkabiliriz?

---

## 2. PROFİL MENÜ TAŞIMA

> **Yazdığın:** "Sola ekran kaysa da kaymayan menü ki bu bana daha mantıklı geliyor. Zira
> menü içeriğinin tam görüntüsüne sahip olsun ki kullanıcı bütün ekranı yukardan aşağı
> dolaşmak durumunda kalmasın."

**Durum:** Profil sayfasında **zaten sayfa kaydıkça yerinde kalan bir yan kolon var** —
ama **sağda**. Küçük ekranda (telefon) bu özellik kapanıyor, kolon en alta düşüyor.

Yani istediğin şeyin bir kısmı var; muhtemelen sorun yeri ya da içeriği.

### Sorular

**5.** Bu sorunu hangi sayfada yaşadın?
- **(A)** Kendi profilini düzenlediğin sayfa
- **(B)** Başkasının profilini gördüğün sayfa
- **(C)** Yönetici paneli
- **(D)** Cadde

**6.** Telefondan mı bakıyordun, bilgisayardan mı?
(Telefonda o kolon zaten sabit değil — bu, sorunun ne olduğunu değiştirir.)

**7.** Ne istiyorsun?
- **(A)** Aynı kolon dursun, sadece **sola** geçsin
- **(B)** Kolonun içine **bölüm listesi** gelsin (Kişisel Bilgiler, İletişim, İlgi
  Alanları… gibi; tıklayınca o bölüme atlasın)
- **(C)** İkisi de

**8.** Asıl rahatsız eden şey **sayfanın çok uzun olması** mı?
Öyleyse çözüm menü olmayabilir — sayfayı sekmelere bölmek de mümkün. Hangisi sana daha
doğru geliyor: **soldaki menü** mi, **sekmeler** mi?

---

## 3. RADAR + GRUP YÜKLEME

> **Yazdığın:** "Yapıp kapattıklarımızı açabiliriz artık."

Bu maddede iki ayrı iş var ve **ikisinin durumu birbirinden çok farklı.** Ayrı ayrı baktım.

### 3-A) RADAR — kapatılmamış, **bozulmuş**

Bu, bugün bulduğum en önemli şey:

Radar'ın günlük otomatik görevi **kapalı değil, her sabah 05:00'te çalışıyor** ve
"başarılı" diyor. Bugün de çalışmış. **Ama 20 Temmuz'dan beri tek bir haber taraması
yapmamış.** Elde 135 haber adayı var, hepsi 20 Temmuz ve öncesinden.

Yani sistem "her şey yolunda" diye rapor veriyor ama yaklaşık **7 haftadır** hiçbir şey
üretmiyor. Hata vermediği için de kimse fark etmemiş.

**Bu bir "aç" işi değil, "tamir" işi.** Düğmeye basmak yetmez, önce neden durduğunu
bulmak gerekiyor.

**9.** 20 Temmuz civarında Radar'la ilgili bir şey değişti mi — haber kaynağı, bir servis
aboneliği, bir şifre/anahtar, ödeme? (Benim tahminim dışarıdan kullandığımız bir servisin
kotası doldu ya da erişimi kesildi.)

**10.** Radar çalışır hâle gelince **haberler nerede görünsün?**
Şu an sadece yönetici panelinde bir inceleme ekranı var, üyeler hiçbir yerde görmüyor.
- **(A)** Şimdilik sadece bizde kalsın, iç araç olsun
- **(B)** Üyelere de gösterelim (bu ayrı bir iş, sayfa tasarımı gerekir)

### 3-B) GRUP YÜKLEME — sayfalar **silinmiş**

WhatsApp gruplarının **verisi duruyor** (10 grup kayıtlı). Ama grupları listeleyen ve
tanıtan **iki sayfa 4 Ağustos'ta silindi**. Sebep: o sayfalara site içinden hiçbir yerden
bağlantı verilmemişti, yani kimse ulaşamıyordu; temizlik sırasında "kullanılmıyor" diye
kaldırıldılar.

Bugün ayakta olan: **grup ekleme formu** ve yönetici düzenleme ekranı.

Bir de şu var: "gruba katılmak istiyorum" taleplerinin tutulduğu yer **tamamen boş** —
yani bu akış canlıda hiç kullanılmamış.

**11.** "Grup yükleme" derken hangisini kastediyorsun?
- **(A)** Üyelerin grup eklemesi (bu **zaten çalışıyor**)
- **(B)** Grupların listelendiği sayfa (silinen sayfa, geri getirilecek)
- **(C)** Her grubun kendi tanıtım sayfası (silinen ikinci sayfa)
- **(D)** Hepsi

**12.** Silinen sayfalar geri gelecekse **eskisi gibi mi olsun, yeniden mi tasarlansın?**
(Not: silinme sebepleri kötü olmaları değildi, kimsenin ulaşamamasıydı. Geri getirirsek
menüye de bağlantı koymamız gerekir, yoksa aynı şey tekrar olur.)

**13.** Kullanıcı gruba nasıl katılsın?
- **(A)** Doğrudan WhatsApp bağlantısına gitsin
- **(B)** Önce "katılmak istiyorum" desin, biz onaylayalım

---

## 4. GOOGLE AUTH (Google ile giriş ekranı)

> **Yazdığın:** "GOOGLE dan CORTEQS LOGOLU AUTH"

**Durum:** Şikâyetin doğru. Google ile giriş yapan üye şu an
**"injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın"** yazan bir ekran görüyor.
Bu, güven vermiyor.

İyi haber: **bunun için hazırlanmış bir plan zaten var** (2 Ağustos'ta yazılmış, adım
adım). **Hiçbir adımı başlamamış.** Bu iş büyük ölçüde kod değil, hesap ve ayar işi.

### Sorular

**14.** Yeni giriş adresi ne olsun? Planda öneri **`auth.corteqs.net`** ama karar
verilmemiş. Uygun mu, başka bir şey mi istersin?

**15.** Bu iş için Supabase'de **ücretli bir ek özellik** açmak gerekiyor (aylık ek ücret).
Bunu açma kararı sende mi? Açılmadan bu iş ilerlemiyor.

**16.** Giriş ekranındaki **logo ve "CorteQS" adı** Google tarafındaki bir panelden
ayarlanıyor. O panele erişimi olan kim — sen mi, ben mi?

**17.** Değişiklik sırasında **kısa bir kesinti** olabilir (dakikalar), bu sırada girişler
etkilenebilir. Gece yapalım mı, fark etmez mi?

---

## Hepsi için ortak sorular

**18.** **Sıra ne olsun?** Dördü de "acil" işaretli ama aynı anda yapılamaz. Benim
önerim şöyle — katılıyor musun?

1. **Google giriş ekranı** — en net tanımlı, çoğu ayar işi, güveni doğrudan etkiliyor
2. **Radar tamiri** — zaten bozuk; tamir etmek yeni özellik yapmaktan ucuz
3. **Profil menü** — küçük iş, ama ne istendiği netleşmeli
4. **Etkinlik** — en büyük iş, en çok belirsizlik

**19.** Şunu da sormam lazım: **Cadde şu an neredeyse boş.** Canlıda toplam **21 paylaşım**
var ve **58 şehrimizin sadece 10'unda** paylaşım bulunuyor — yani bir üye şehrini seçtiğinde
büyük ihtimalle boş ekran görüyor.

Dışarıdan gelen değerlendirme de aynı şeyi söylemişti: *"Header'ı düzeltmek 1 saatlik iş;
boş akış ürünü öldürür."*

Sence hangisi önce gelmeli?
- **(A)** Yeni özellik (Etkinlik) ekleyelim
- **(B)** Önce Cadde'yi gerçek içerikle dolduralım
- **(C)** İkisi paralel gitsin

**20.** Bu dört madde dışında **seni rahatsız eden ama listeye yazmadığın** bir şey var mı?
Acil listesinde 6 boş yer daha var.

---

## Son bir not

Dört maddenin dördünde de **ölçünce durum yazılandan farklı çıktı**:

| Yazılan | Gerçek durum |
|---|---|
| Radar'ı "açalım" | Kapalı değil — 7 haftadır sessizce bozuk |
| Grupları "açalım" | Sayfalar silinmiş, veri duruyor |
| Etkinlik "kolayca eklenir" | Altyapı yarım ve bilinçli olarak kapatılmış |
| Google Auth | Planı zaten yazılmış, hiç başlanmamış |

Bunları bilmeden başlasaydım dördünde de yanlış işe girişecektim. Cevapları alınca her
madde için adım adım uygulama planı çıkaracağım.
