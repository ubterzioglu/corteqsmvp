-- CorteQS Blog Modülü — Faz 2: Göç Rehberleri Serisi
-- 20 yeni makale: 4 ülke (Almanya, İngiltere, ABD/Amerika, BAE/Dubai) × 5 konu
--   (oturum izni, çalışma vizesi, vatandaşlık, iş bulma, yaşam şartları).
-- Kaynak: Corteqs_Blog_20_Makale.md (Haziran 2025 güncellemeli).
-- 5 yeni kategori (oturum-izni, calisma-vizesi, vatandaslik, is-bulma, yasam-sartlari)
--   CHECK kısıtına eklenir; frontend etiketleri src/lib/blog.ts içinde tanımlı.
-- Almanya ve abd ülke anahtarları mevcut modülle ortak — yeni makaleler aynı ülke
--   grubuna (sort_order 100+) eklenir, böylece blog sayfasında aynı başlık altında listelenir.
-- İçerik markdown; react-markdown ile render edilir.

BEGIN;

-- 1) Kategori CHECK kısıtını 5 yeni konuyla genişlet.
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_category_check;
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_category_check
  CHECK (category IN (
    $$giris-ulasim$$, $$gundelik-butce$$, $$kultur-sosyal$$,
    $$oturum-izni$$, $$calisma-vizesi$$, $$vatandaslik$$, $$is-bulma$$, $$yasam-sartlari$$,
    $$genel$$
  ));

-- 2) 20 makaleyi yeniden çalıştırılabilir biçimde ekle (slug çakışırsa içeriği güncelle).
INSERT INTO public.blog_posts
  (slug, title, excerpt, content_markdown, country, country_label, category, category_label, sort_order, published, published_at)
VALUES
-- ── ALMANYA ─────────────────────────────────────────────────────────────
($b$almanya-oturum-izni$b$, $b$Almanya'da Oturum İzni: Türkler İçin Kapsamlı Rehber (2025)$b$,
 $b$Almanya'da 90 günü aşan her kalış için bir oturum iznine (Aufenthaltserlaubnis) ihtiyaç duyulur. Çalışma izninden AB Mavi Kartı'na, Chancenkarte'den ARB 1/80 ayrıcalıklarına kadar tüm yollar bu rehberde.$b$,
 $b$Berlin'deki Türk topluluğunun kökleri 1960'lı yıllara dayanıyor. Bugün Almanya'da 3,2 milyondan fazla Türk kökenli insan yaşıyor; bu durum Almanya'yı Türkiye dışında en büyük Türk diasporasına ev sahipliği yapan ülke konumuna taşıyor. Peki bu ülkede yasal olarak yaşamak için hangi oturum izni türleri mevcut, başvuru süreci nasıl işliyor?

### Temel Kavram: Aufenthaltserlaubnis

Almanya'da 90 günü aşan her kalış için bir oturum iznine (Aufenthaltserlaubnis) ihtiyaç duyulur. Bu izin, kalış amacına göre farklı kategorilere ayrılır: çalışma, eğitim, aile birleşimi veya iş arama. İzni çıkarttığınız yerel yabancılar dairesi (Ausländerbehörde), oturduğunuz şehre göre değişir.

### Oturum İzni Türleri

**Çalışma amaçlı oturum izni:** Almanya'da iş sözleşmeniz varsa işvereniniz aracılığıyla Nitelikli İstihdam İzni (Fachkräftevisa) başvurusunda bulunabilirsiniz. 2023–2024 yıllarında kapsamlı biçimde revize edilen Nitelikli İşgücü Göç Yasası (Fachkräfteeinwanderungsgesetz) artık üniversite diploması olmaksızın yalnızca mesleki deneyim yoluyla da başvurmayı mümkün kılıyor.

**AB Mavi Kartı (EU Blue Card):** Yüksek nitelikli profesyoneller için tasarlanmış bu izin, 2026 yılı itibarıyla yıllık brüt maaş eşiği standart meslekler için yaklaşık 50.700 Euro, yetersiz eleman bulunan meslekler içinse 45.934 Euro olarak belirlenmiştir. AB Mavi Kartı sahipleri, 21 ay içinde (Almanca dil belgesiyle) kalıcı oturuma geçiş hakkı elde ediyor.

**Chancenkarte (Fırsat Kartı):** Almanya'ya henüz iş bulmadan gelmek isteyenler için 2024'te hayata geçirilen yeni bir puan sistemi. Yabancı dil bilgisi, Almanya'da eğitim veya çalışma geçmişi, yaş ve meslek alanı puanlamada belirleyici. Türk profesyoneller için son derece cazip bir seçenek.

**Aile birleşimi izni:** Almanya'da oturan bir aile üyenizin yanına gelmek istiyorsanız bu izni başvurabilirsiniz. Eşinizin veya ebeveynlerinizin geçerli bir oturum iznine sahip olması gerekir.

### Türkler İçin Özel Avantaj: ARB 1/80

1980 tarihli AB-Türkiye Ortaklık Konseyi Kararı (ARB 1/80), Almanya'da yasal olarak çalışan Türk işçilerine ve onların aile üyelerine çeşitli ayrıcalıklar tanımaktadır. En az 4 yıl yasal çalışma geçmişi olan Türk vatandaşları, işveren veya meslek değiştirme hakkını kazanabilmektedir. Bu karar, Türklerin Almanya'daki hukuki statüsünü diğer üçüncü ülke vatandaşlarından farklı kılmaktadır.

### Başvuru Süreci

Almanya'ya geldikten sonra 90 gün içinde bulunduğunuz şehrin Ausländerbehörde'sine başvurmanız gerekir. Gerekli belgeler şunları kapsar: geçerli pasaport, sağlık sigortası belgesi, gelir kanıtı (banka hesap özeti veya iş sözleşmesi), kira sözleşmesi ile fotoğraf.

Standart bir oturum izninin ücreti yetişkinler için genellikle 100 Euro civarındadır; Türk vatandaşları AB-Türkiye anlaşması çerçevesinde indirimli ücret ödemektedir (24 yaş altı için 22,80 Euro, 24 yaş ve üzeri için 37 Euro). İşlem süresi ortalama 5–6 haftadır; yoğun şehirlerde bu süre uzayabilir.

### Dikkat Edilmesi Gerekenler

Randevuları Ausländerbehörde web sitesinden mümkün olan en erken tarihte alın; büyük şehirlerde (Berlin, Münih, Hamburg) randevu bulmanın aylar sürebildiği bilinmektedir. 1 Mayıs 2025'ten itibaren biyometrik pasaport fotoğrafları yalnızca dijital yollarla alınabilmekte, kağıt fotoğraf kabul edilmemektedir.$b$,
 $b$almanya$b$, $b$Almanya$b$, $b$oturum-izni$b$, $b$Oturum İzni$b$, 100, true, now()),

($b$almanya-calisma-vizesi$b$, $b$Almanya'da Çalışma Vizesi: Hangi Yolu Seçmelisiniz? (2025)$b$,
 $b$Almanya 2025 itibarıyla ~700.000 kayıtlı iş açığıyla dünyanın en büyük işgücü açığına sahip ekonomilerinden biri. Fachkräftevisa, AB Mavi Kart ve Chancenkarte arasında doğru yolu seçmenin rehberi.$b$,
 $b$Almanya, 2025 yılı itibarıyla yaklaşık 700.000 kayıtlı iş açığıyla dünyanın en büyük işgücü açığına sahip ekonomilerinden biri konumunda. Bu talep, Türk profesyoneller için Almanya kapısını her zamankinden daha geniş açık tutmaktadır.

### Fachkräftevisa: Nitelikli Çalışma Vizesi

Almanya'da çalışmak istiyorsanız ilk durağınız Fachkräftevisa (Nitelikli Çalışma Vizesi) olmalıdır. Bu vize, iki ayrı kişi grubunu kapsıyor:

**Üniversite mezunları:** Almanya tarafından tanınan bir lisans veya daha yüksek bir diplomaya sahip olan herkes başvurabilir. Diplomanın tanınması için Anabin veri tabanını kontrol edebilirsiniz. Tanınmayan diplomalar için denklik süreci (Anerkennung) gereklidir.

**Mesleki eğitim almış kişiler:** Almanya'da tanınan bir mesleki diplomaya sahip olanlar, ya da en az 2 yıl ilgili sektörde deneyimi olan ve yıllık brüt maaşı 43.470 Euro'nun üzerinde olan kişiler başvurabilir.

### EU Mavi Kart: Yüksek Nitelikli Profesyoneller İçin

Yıllık maaşınız 50.700 Euro'yu (eksik eleman bulunan mesleklerde 45.934 Euro'yu) aşıyorsa AB Mavi Kartı daha avantajlı olabilir. Avantajları şunlardır: 4 yıl geçerlilik, eşe kısıtlamasız çalışma hakkı, 33 ay içinde kalıcı oturuma geçiş (Almanca bilen adaylar 21 ayda geçiş yapabilir).

### Chancenkarte: İşsiz Gelebilirsiniz

2024'te yürürlüğe giren Fırsat Kartı, Almanya'ya iş bulmadan önce giriş yapıp yerinde iş aramanızı mümkün kılıyor. Puan hesabında şu faktörler değerlendiriliyor:

- Mesleki nitelik (diploma veya 2 yıl deneyim)
- Almanca dil bilgisi
- İngilizce dil bilgisi
- 35 yaş altı olmak
- Almanya'da eğitim veya önceden çalışma geçmişi

En az 6 puan toplayan adaylar başvurabilir. Kart 1 yıl için verilir ve bu süre içinde çalışma hakkı da tanınır (haftada 20 saate kadar part-time iş).

### Dikkat Edilmesi Gerekenler

Vizeyi Almanya'ya gelmeden önce, Türkiye'deki Alman Büyükelçiliği veya Konsolosluğu aracılığıyla almanız gerekiyor. Bekleme süresi İstanbul Konsolosluğu'nda hâlâ oldukça uzun olabiliyor; başvuruyu iş teklifinizi aldıktan hemen sonra yapmanız kritik önem taşıyor. 2025 yılında 200.000'den fazla nitelikli çalışma vizesi verildiği düşünüldüğünde, süreçlerin ne kadar yoğunlaştığı daha net ortaya çıkıyor.

### Diploma Denkliği

Türkiye'de alınan pek çok üniversite diploması Almanya tarafından doğrudan tanınmaktadır. Ancak bazı meslekler (özellikle sağlık, hukuk ve mühendislik) için ek değerlendirme gerekebilir. Anabin.kmk.org web sitesi üzerinden diplomanızın durumunu sorgulayabilirsiniz. Tanınmayan diplomalar için Anerkennungsberatung hizmetlerinden destek alabilirsiniz.$b$,
 $b$almanya$b$, $b$Almanya$b$, $b$calisma-vizesi$b$, $b$Çalışma Vizesi$b$, 101, true, now()),

($b$almanya-vatandaslik$b$, $b$Almanya'da Vatandaşlık: Türkler İçin 2025 Kılavuzu$b$,
 $b$2024'te yürürlüğe giren yeni yasa gereken oturma süresini 8 yıldan 5 yıla indirdi ve çifte vatandaşlığa kapı araladı. Ekim 2025 revizyonuyla güncel tablo bu rehberde.$b$,
 $b$Almanya'da vatandaşlık hukuku son yıllarda köklü değişimler geçirdi. 2024'te yürürlüğe giren yeni yasa gereken oturma süresini 8 yıldan 5 yıla indirdi ve çifte vatandaşlığa kapı araladı. Ancak Ekim 2025'te yapılan bir değişiklikle bazı düzenlemeler yeniden revize edildi.

### Güncel Tablo: 5 Yıl Zorunlu Oturum

Almanya Vatandaşlık Yasası'na (Staatsangehörigkeitsgesetz) göre 30 Ekim 2025 itibarıyla geçerli olan kurallar şu şekilde:

- Yasal oturma süresi: **en az 5 yıl**
- Ekonomik bağımsızlık (sosyal yardım almıyor olmak)
- **B1 seviyesi Almanca** dil belgesi
- Almanya Vatandaşlık Sınavı'nı geçmek
- Temiz adli sicil kaydı

2024'te getirilen "hızlandırılmış vatandaşlık" (3 yılda) seçeneği Ekim 2025'te kaldırıldı. Tek istisna: Alman vatandaşıyla evli olanlar 3 yıl sonra başvurabilmektedir.

### Çifte Vatandaşlık Artık Mümkün

Bu, Türkler için son derece önemli bir gelişme. 27 Haziran 2024'ten itibaren yürürlüğe giren yeni yasa, Almanya'da vatandaşlığa geçmek isteyenlerin mevcut vatandaşlıklarından vazgeçmesini zorunlu kılmıyor. Yani hem Türk hem de Alman pasaportu taşımak artık yasal olarak mümkün; ancak Türkiye'nin de çifte vatandaşlığa izin verdiğini hatırlatmak gerekir (Türkiye çifte vatandaşlığa izin vermektedir).

### Süreç Nasıl İşliyor?

1. İkamet ettiğiniz şehrin vatandaşlık ofisine (Staatsangehörigkeitsbehörde) başvurun
2. Gerekli belgeler: pasaport, oturum belgesi, dil sertifikası, sınav belgesi, gelir belgeleri
3. Başvuru işleme süresi: federal eyalete ve şehre göre **18 aya kadar** uzayabilir

### Hangi Oturma Süreleri Sayılmaz?

Almanca dil öğrencisi, iş arayışı vizesiyle veya turist olarak geçirdiğiniz süreler 5 yıllık eşiğe dahil edilmiyor. Sadece geçerli oturum iznine dayalı yasal ikamet süreleri sayılıyor.$b$,
 $b$almanya$b$, $b$Almanya$b$, $b$vatandaslik$b$, $b$Vatandaşlık$b$, 102, true, now()),

($b$almanya-is-bulma$b$, $b$Almanya'da İş Bulmak: Türk Profesyoneller İçin Gerçekçi Rehber (2025)$b$,
 $b$Almanya'da Şubat 2025 itibarıyla 639.000 açık pozisyon mevcuttu. Hangi sektörlerde talep var, Alman başvuru süreci Türkiye'den nasıl farklı, nerede aramalı?$b$,
 $b$Almanya'da Şubat 2025 itibarıyla 639.000 açık pozisyon mevcuttu. Mühendislik, bilişim, sağlık ve finans başta olmak üzere pek çok sektörde yetenek kıtlığı yaşanıyor. Peki Türkiye'den Almanya'ya geçiş yapacak bir profesyonel bu tablodan nasıl yararlanabilir?

### Hangi Sektörlerde Talep Var?

Almanya'nın en çok eleman aradığı meslekler arasında yazılım geliştirme, yapay zeka mühendisliği, hemşirelik ve doktorluk, elektrik ve makine mühendisliği, muhasebe ve finans ile ticaret ve lojistik sayılabilir.

### CV ve Başvuru Süreci Türkiye'den Farklı

Alman iş başvurularında bazı standartlar Türkiye'den ayrışmaktadır:

- **Fotoğraf:** Almanya'da CV'lere profesyonel fotoğraf eklenmesi geleneksel olarak beklenmektedir (ancak bu uygulamadan uzaklaşılmaktadır)
- **Motivasyon mektubu (Anschreiben):** Kısa, öz ve işe özgü olmalı
- **Diploma denkliği:** Başvurmadan önce diplomanızın Almanya'da tanınıp tanınmadığını kontrol edin
- **Dil:** Pek çok pozisyon Almanca bilgisi gerektiriyor; IT sektöründe İngilizce yeterli olabiliyor

### Nerede Arayalım?

İş arayanlar için önde gelen platformlar arasında LinkedIn, Xing (Almanya'ya özel profesyonel ağ), StepStone, Indeed Almanya ve Make-it-in-Germany (resmi Almanya hükümeti portalı) yer almaktadır. Birçok şirket aynı zamanda Türkiye'deki yetenek havuzundan doğrudan işe alım yapıyor; büyük Türk kökenli ağlar ve diaspora platformları bu konuda önemli bir köprü işlevi görüyor.

### Ücret Beklentileri

Ortalama brüt maaş 2025 yılında aylık yaklaşık 3.333–4.323 Euro (tam zamanlı çalışanlar için) aralığında. Net ele geçen tutar vergiler ve sosyal güvenlik kesintileri sonrasında önemli ölçüde azalıyor; ancak sağlık sigortası, emeklilik ve işsizlik sigortası otomatik olarak bu kesintilerle karşılanıyor.

### Almanca'yı Küçümsemeyin

IT gibi İngilizce ağırlıklı sektörlerde bile iş hayatının ve günlük yaşamın önemli bir kısmı Almanca yürütülüyor. En azından B1 seviyesine ulaşmak, hem kariyer fırsatlarını hem de günlük yaşam kalitesini önemli ölçüde artırıyor.$b$,
 $b$almanya$b$, $b$Almanya$b$, $b$is-bulma$b$, $b$İş Bulmak$b$, 103, true, now()),

($b$almanya-yasam-sartlari$b$, $b$Almanya'da Yaşam Şartları: Gerçekçi Bir Rehber (2025–2026)$b$,
 $b$Berlin, Münih, Hamburg gibi büyük şehirlere talep her yıl artıyor. Konuttan sağlık sigortasına, ulaşımdan sosyal güvenlik ağına Almanya'da yaşam masraflarına dair gerçekçi bir tablo.$b$,
 $b$Berlin, Münih ve Hamburg gibi büyük şehirlere olan talep her geçen yıl artmaktadır. Almanya'ya taşınmayı düşünen Türkler için yaşam masraflarına dair gerçekçi bir tablo sunmak bu rehberin amacı.

### Konut: En Büyük Harcama Kalemi

Kira fiyatları şehirden şehire ciddi biçimde değişmektedir:

- **Berlin:** Şehir merkezinde 1+1 daire için aylık ortalama 1.300 Euro (dış semtlerde 700–1.000 Euro)
- **Münih:** Şehrin en pahalı kenti; merkezi bir daire için 1.800–2.500 Euro
- **Köln / Düsseldorf:** Orta düzey, aylık 1.000–1.400 Euro
- **Leipzig / Dresden:** Doğu Almanya şehirleri; 600–900 Euro ile çok daha uygun

Kira sözleşmesi imzalamak için genellikle 2–3 aylık depozito, gelir belgesi (kira bedelinin en az 3 katı net maaş) ve Schufa kredi sicil belgesi istenmektedir.

### Günlük Yaşam Harcamaları

Alışveriş yaparken Aldi, Lidl gibi indirim marketleri veya Rewe, Edeka gibi daha kapsamlı zincirler tercih edilebilir. Aylık gıda gideri kişi başına ortalama 250–350 Euro olarak hesaplanabilir. Dışarıda öğle yemeği 8–12 Euro, orta düzey bir restoranda akşam yemeği ise kişi başı 25–50 Euro civarındadır. Türk mutfağı hem uygun fiyatlı hem de Almanya'nın her köşesinde yaygın olarak erişilebilir durumda.

### Sağlık Sigortası: Zorunlu

Almanya'da ikamet eden herkes sağlık sigortasına sahip olmak zorunda. Çalışanlar brüt maaşlarının yaklaşık %14,6'sını (artı ortalama %2,5 ek prim) sosyal güvenlik kapsamındaki bir sigortaya katkı olarak ödüyor. 2026 itibarıyla bu üst sınır yıllık 69.750 Euro olarak belirlenmiştir.

### Ulaşım

Almanya'nın toplu taşıma ağı son derece gelişmiş durumda. Aylık şehir içi ulaşım aboneliği büyük şehirlerde 50–100 Euro arasında değişmekte. Öğrenciler ve düşük gelirli kesimlere yönelik çeşitli indirimler mevcut. Almanya genelinde kullanılabilen Deutschlandticket aylık 58 Euro (2025 fiyatı) ile tüm bölgesel toplu taşıma araçlarına sınırsız erişim sağlıyor.

### Sosyal Güvenlik Ağı

Almanya'nın güçlü refah sistemi, sigortalı çalışanların işsiz kaldığında aylık maaşlarının %60 ile %67'si arasında bir işsizlik yardımı almasını güvence altına almaktadır. Bu durum, Almanya'yı uzun vadeli yaşam güvencesi açısından cazip kılan önemli unsurlardan biri.$b$,
 $b$almanya$b$, $b$Almanya$b$, $b$yasam-sartlari$b$, $b$Yaşam Şartları$b$, 104, true, now()),

-- ── İNGİLTERE ───────────────────────────────────────────────────────────
($b$ingiltere-oturum-izni$b$, $b$İngiltere'de Oturum İzni: Brexit Sonrası Türkler İçin Güncel Rehber (2025)$b$,
 $b$Brexit ile İngiltere noktaya dayalı bir göç sistemine geçti. Skilled Worker Visa, ILR, Graduate ve Global Talent yolları — 2025 maaş eşiği ve beceri değişiklikleriyle birlikte.$b$,
 $b$Brexit ile birlikte İngiltere'nin AB göç sistemi dışında kalması, oturma iznine başvurma süreçlerini köklü biçimde değiştirdi. 2021'den itibaren İngiltere'de yaşamak isteyen tüm yabancı uyruklu kişiler —AB vatandaşları dahil— noktaya dayalı bir göç sistemine (Points-Based Immigration System) tabi tutulmaktadır.

### Skilled Worker Visa: Temel Oturum Yolu

İngiltere'de çalışmak ve yaşamak isteyen Türkler için birincil seçenek, Nitelikli Çalışan Vizesi (Skilled Worker Visa). Bu vizede temel koşullar şöyle:

- İngiltere'de lisanslı bir işverenden iş teklifi
- Teklif edilen pozisyonun RQF Seviye 6 (lisans eşdeğeri) veya üzeri bir beceri düzeyine sahip olması — **22 Temmuz 2025'ten itibaren bu eşik yükseltildi**
- Minimum yıllık maaş **£41.700** (22 Temmuz 2025 itibarıyla; önceki eşik £38.700 idi)
- İngilizce dil yeterliliği belgesi

Bu son değişiklikle birlikte inşaat, konaklama ve idari roller gibi pek çok meslek kategorisi Skilled Worker kapsamından çıkarıldı.

### Indefinite Leave to Remain (ILR): Kalıcı Oturum

ILR, İngiltere'de süresiz yaşama, çalışma ve eğitim hakkı veren kalıcı oturma statüsü. Şu anda geçerli olan kural: Skilled Worker Visa ile en az **5 yıl** yasal ikamet. Ancak Mayıs 2025'te açıklanan Göç Beyaz Kitabı, bu süreyi **10 yıla** çıkarma niyetini ortaya koydu. Bu değişiklik henüz yürürlüğe girmemiş olup kamuoyu danışması aşamasından geçmektedir.

Önerilen yeni sistemde "kazanılmış oturma" (earned settlement) modeli ön plana çıkıyor: Belirli toplumsal katkı kriterlerini karşılayanlar 10 yılın altında oturma hakkı kazanabilecek. Detaylar hâlâ belirsizliğini korumaktadır.

### Diğer Oturum Yolları

**Graduate Visa:** İngiltere'de lisans veya yüksek lisans eğitimini tamamlayanlar için 2 yıl (doktora için 3 yıl) bağımsız çalışma vizesi.

**Global Talent Visa:** Akademi, araştırma, teknoloji veya sanat alanlarında ispatlanmış yetenekler için endorsement (onay) almış kişilere verilen vize.

**Family Visa:** İngiltere'de yaşayan bir yakınınızla birleşmek için başvurulabilir.

### Dikkat: Politika Değişiyor

İngiltere'nin göç politikası 2025–2026 döneminde oldukça hareketli. Maaş eşikleri temmuz 2025'te yükseltildi, beceri düzeyi gereklilikleri sıkılaştırıldı. Başvurmadan önce gov.uk üzerinden güncel koşulları kontrol etmeniz kritik önem taşıyor.$b$,
 $b$ingiltere$b$, $b$İngiltere$b$, $b$oturum-izni$b$, $b$Oturum İzni$b$, 110, true, now()),

($b$ingiltere-calisma-vizesi$b$, $b$İngiltere'de Çalışma Vizesi: Nitelikli Çalışan Vizesi 2025 Rehberi$b$,
 $b$22 Temmuz 2025 sonrası Skilled Worker Visa koşulları: £41.700 maaş eşiği, RQF Seviye 6 beceri şartı, istisna eşikleri ve adım adım başvuru süreci.$b$,
 $b$İngiltere iş pazarı Türk profesyoneller için cazip olmayı sürdürüyor. Ancak temmuz 2025'te yürürlüğe giren son maaş eşiği artışı ve beceri düzeyi kısıtlamaları oyunun kurallarını önemli ölçüde değiştirdi.

### Yeni Koşullar: 22 Temmuz 2025 Sonrası

22 Temmuz 2025'ten itibaren Skilled Worker Visa başvurularında aranan koşullar:

- Minimum yıllık maaş: **£41.700** (veya söz konusu meslek kodu için belirlenen "piyasa ücreti" —hangisi yüksekse)
- Minimum beceri düzeyi: **RQF Seviye 6** (lisans seviyesi)
- Lisanslı işverenden iş teklifi zorunluluğu

Bu değişiklikle birlikte 180'den fazla meslek kategorisi yeni başvurular için vize kapsamından çıkarıldı. Söz konusu kategoriler "Geçici Eksiklik Listesi" (Temporary Shortage List) altında sınırlı bir süre daha başvuruya açık kalacak ve 31 Aralık 2026'da tamamen kapatılacak.

### Maaş Eşiği İstisnalar

Bazı gruplar için farklı eşikler uygulanıyor:

- **Doktora derecesi sahibi adaylar:** £37.500
- **STEM alanında doktora:** £33.400
- **Sağlık ve eğitim sektörü:** Özel ulusal ücret skalalarına tabi, ayrı eşikler var

### ILR Başvurusunda Dikkat

Geçici düzenlemeler kapsamında vize almış olanlar bile ILR başvurusunda güncel eşiği (£41.700) karşılamak zorunda. Yani 2023'te £26.200 maaşla vize alıp 2028'de ILR başvuruyorsanız, o tarih itibarıyla £41.700 kazanıyor olmanız gerekiyor.

### Başvuru Nasıl Yapılır?

1. İşverenin sponsorluk lisansına sahip olduğundan emin olun
2. İşveren size bir CoS (Certificate of Sponsorship) kodu verecek
3. İngiltere İçişleri Bakanlığı'nın online portalından başvurun
4. Biyometrik veri ve belgeleri iletin
5. Vize kararı genellikle 3–8 hafta içinde açıklanıyor$b$,
 $b$ingiltere$b$, $b$İngiltere$b$, $b$calisma-vizesi$b$, $b$Çalışma Vizesi$b$, 111, true, now()),

($b$ingiltere-vatandaslik$b$, $b$İngiltere'de Vatandaşlık: Türkler İçin Adım Adım Süreç (2025)$b$,
 $b$İngiliz vatandaşlığı ILR ile başlayan uzun bir yolculuk. Yol haritası, vatandaşlık koşulları, çifte vatandaşlık ve maliyetler bu rehberde.$b$,
 $b$İngiltere vatandaşlığı (British Citizenship) uzun bir yolculuğun ürünü. Süreç ILR ile başlıyor, ardından İngiliz vatandaşlık başvurusuyla sonuçlanıyor.

### Yol Haritası

1. **Skilled Worker Visa ile gelmek:** 5 yıl boyunca yasal ikamet
2. **ILR başvurusu:** 5 yıl sonunda (maaş eşiği ve diğer koşulları karşıladıktan sonra)
3. **Vatandaşlık başvurusu:** ILR'yi aldıktan minimum **12 ay** sonra

Not: Mayıs 2025 Beyaz Kitabı ILR için gereken oturma süresini 10 yıla çıkarmayı teklif etti; bu değişiklik henüz yürürlüğe girmedi, danışma süreci devam ediyor.

### Vatandaşlık Koşulları

İngiliz vatandaşlığı için temel koşullar şunlardır:

- ILR'nin en az 12 ay önce alınmış olması
- Son 5 yılda 450 günden fazla İngiltere dışında bulunulmaması
- "Life in the UK" testini geçmek
- İngilizce dil yeterliliği
- Temiz adli sicil kaydı

### Çifte Vatandaşlık

İngiltere çifte vatandaşlığa izin vermektedir. Türkiye de çifte vatandaşlığa olanak tanıdığından, İngiliz vatandaşlığına geçerken Türk pasaportunuzdan vazgeçmeniz gerekmiyor.

### Maliyet ve Süre

2025 yılı itibarıyla vatandaşlık başvurusu ücreti 1.500 İngiliz Sterlini'nin üzerindedir. Başvurudan karara kadar geçen süre ortalama 6–12 ay.$b$,
 $b$ingiltere$b$, $b$İngiltere$b$, $b$vatandaslik$b$, $b$Vatandaşlık$b$, 112, true, now()),

($b$ingiltere-is-bulma$b$, $b$İngiltere'de İş Bulmak: Türk Profesyoneller İçin Pratik Rehber (2025)$b$,
 $b$Londra finans, teknoloji ve yaratıcı sektörlerin merkezi. Hangi sektörler kapıyı açık tutuyor, başvuru süreci nasıl, en etkili kanallar ve sponsorluk kolaylığı.$b$,
 $b$Londra, küresel ölçekte finans, teknoloji ve yaratıcı sektörlerin merkezi olmayı sürdürüyor. Temmuz 2025'teki vize değişikliklerine karşın İngiltere iş piyasası Türk profesyoneller için hâlâ güçlü fırsatlar barındırıyor.

### Hangi Sektörler Kapıyı Açık Tutuyor?

**Yüksek talep gören alanlar:** Yazılım geliştirme ve siber güvenlik, veri bilimi ve yapay zeka, finans ve yatırım bankacılığı, sağlık (özellikle NHS bünyesindeki açıklar), mühendislik ve mimarlık.

### Başvuru Süreci

İngiliz iş başvuruları Alman standartlarından farklı:

- CV'de fotoğraf eklenmez (ayrımcılığı önlemek için)
- Cover letter kısa ve pozisyona özgü olmalı
- LinkedIn profili son derece önemli; işverenler doğrudan bu platformdan arama yapıyor

### İş Bulmak İçin En Etkili Kanallar

LinkedIn, Reed.co.uk, Totaljobs, Glassdoor, Indeed İngiltere ve CityJobs (finans odaklı) öne çıkan platformlar. Network oluşturmak İngiltere iş hayatında belirleyici bir faktör; sektör etkinlikleri, diaspora ağları ve profesyonel topluluklar bu açıdan büyük değer taşıyor.

### Maaş Beklentileri

Londra'da ortalama yıllık maaş sektöre göre büyük ölçüde farklılaşıyor. Yazılım geliştirici olarak £50.000–80.000, finans analistiyseniz £45.000–70.000, sağlık profesyoneli olarak ise NHS ücret skalasına göre £28.000–55.000 aralığında bir gelir bekleyebilirsiniz.

### Sponsorluk Kolaylığı İçin

Skilled Worker Visa sponsorluğu olan işverenlere öncelik verin. İşvereni siteye gidin veya adayı kabul ettiğinizde "Do you provide Skilled Worker Visa sponsorship?" diye doğrudan sorabilirsiniz. GOV.UK'nin resmi web sitesinde lisanslı sponsor işverenlerin tam listesi kamuoyuna açık şekilde paylaşılmaktadır.$b$,
 $b$ingiltere$b$, $b$İngiltere$b$, $b$is-bulma$b$, $b$İş Bulmak$b$, 113, true, now()),

($b$ingiltere-yasam-sartlari$b$, $b$İngiltere'de Yaşam Şartları: Fırsatlar ve Gerçekler (2025)$b$,
 $b$Londra dünyanın en pahalı şehirlerinden, ama Birleşik Krallık genelinde maliyetler bölgeden bölgeye değişiyor. Konut, günlük harcama, NHS, ulaşım ve Türk topluluğu.$b$,
 $b$Londra, dünyanın en pahalı şehirleri arasında yer alıyor; ancak Birleşik Krallık genelinde yaşam masrafları bölgeden bölgeye önemli ölçüde farklılaşıyor.

### Konut Maliyetleri

Londra'da kira fiyatları son yıllarda hız kesmeden tırmanmaya devam ediyor:

- **Londra merkezi:** Stüdyo veya 1+1 daire için aylık £2.000–3.000
- **Londra dış semtleri:** £1.500–2.000
- **Manchester:** £900–1.400
- **Birmingham:** £800–1.200
- **Leeds / Edinburgh:** £900–1.300

Kira bedellerine ek olarak aylık council tax (belediye vergisi), elektrik, gaz ve internet fatura giderleri hesaba katılmalı.

### Günlük Yaşam Harcamaları

Londra'da kafe hayatı ve dışarıda yemek oldukça pahalı. Öğle yemeği £10–15, orta düzey bir restoranda akşam yemeği ise kişi başı £30–60. Bununla birlikte supermarketlerde (Tesco, Sainsbury's, Lidl) uygun fiyatlı alışveriş mümkün; Lidl ve Aldi gibi indirim marketleri son yıllarda büyük yaygınlık kazandı.

### Sağlık Sistemi: NHS

İngiltere'de NHS (National Health Service) kapsamında, halk sağlığı hizmetlerinden ücretsiz yararlanabilirsiniz. Skilled Worker Visa sahipleri "Göçmen Sağlık Ek Ücreti" (Immigration Health Surcharge) ödüyor; 2025 itibarıyla bu ücret yıllık £1.035 olarak belirlenmiş.

### Ulaşım

Londra'da Oyster kartı veya temassız kart kullanarak toplu taşıma ağına erişebilirsiniz. Aylık seyahat maliyeti bölgeye göre £180–250 arasında değişiyor. Tünel, Batı Londra gibi daha uzak semtlerde yaşayıp şehir merkezinde çalışmak aylık ulaşım masrafını artırıyor.

### Türk Topluluğu

İngiltere'de yaklaşık 500.000 Türk ve Kıbrıslı Türk kökenli insan yaşıyor. Özellikle Kuzey Londra (Haringey, Enfield) yoğun bir Türk topluluğuna ev sahipliği yapıyor. Türk marketler, restoranlar, camileri ve diaspora dernekleriyle bir topluluk hayatı Londra'da görece kolay kurulabiliyor.$b$,
 $b$ingiltere$b$, $b$İngiltere$b$, $b$yasam-sartlari$b$, $b$Yaşam Şartları$b$, 114, true, now()),

-- ── AMERİKA BİRLEŞİK DEVLETLERİ ──────────────────────────────────────────
($b$abd-oturum-izni$b$, $b$Amerika'da Oturum İzni: Türkler İçin Yeşil Kart ve Geçici Statüler (2025)$b$,
 $b$ABD'de "oturum izni" kavramı farklı işliyor: H-1B, L-1, O-1, E-2 geçici statüleri ve Green Card yolları (aile, EB kategorileri, DV Lottery) bu rehberde.$b$,
 $b$Amerika Birleşik Devletleri, Türk profesyoneller için hem en cazip hem de en karmaşık göç sistemlerinden birini barındırıyor. Geçici çalışma vizesinden kalıcı oturum iznine (Green Card) uzanan yol, sabır ve doğru planlama gerektiriyor.

### Geçici Oturum Statüleri

ABD'de "oturum izni" kavramı İngiltere veya Almanya'dan farklı işliyor. Türk vatandaşları için öne çıkan geçici statüler şunlar:

**H-1B Vizesi:** Özellikle teknoloji, mühendislik, finans ve sağlık sektöründe çalışan yüksek nitelikli profesyoneller için tasarlanmış bu vize, iş başvurularının en popüler rotası. H-1B başlangıçta 3 yıl için verilir ve toplamda 6 yıla kadar uzatılabilir. Her yıl düzenlenen kura (lottery) sistemiyle belirlenen kontenjan son derece sınırlı; bu nedenle kazanımcıların oranı her geçen yıl daha da düşüyor.

**L-1 Vizesi:** Çokuluslu şirketlerde yönetici veya uzman konumunda çalışanlar için şirket içi transfer vizesi. H-1B kurasına tabi değil; bu yüzden büyük şirketlerde çalışan profesyoneller için avantajlı bir alternatif.

**O-1 Vizesi:** Alanında "olağanüstü yetenek" sahibi olduğunu kanıtlayanlar için özel vize. Akademisyenler, araştırmacılar, sanatçılar ve üst düzey iş insanları için uygun.

**E-2 Yatırımcı Vizesi:** Türkiye ile ABD arasındaki yatırım antlaşması kapsamında; ABD'de işletme kuran veya satın alan Türk vatandaşları bu geçici vizeden yararlanabiliyor. Minimum yatırım miktarı yasal olarak belirlenmemiş olmakla birlikte pratikte 100.000 dolar ve üzeri ciddi başvurular değerlendirmeye alınıyor.

### Green Card: Kalıcı Oturum

ABD'de süresiz yaşama ve çalışma hakkı Green Card (Yeşil Kart) ile kazanılıyor. Türkler için başlıca yollar şunlar:

- **Aile birleşimi:** ABD vatandaşı veya Green Card sahibi bir yakınınız varsa
- **İstihdam esaslı kategoriler (EB-1 ila EB-5)**
- **Çeşitlilik Vizesi Çekilişi (DV Lottery):** Her yıl yaklaşık 55.000 kişiye verilen bu vize içeriği ile Türkiye tarihsel olarak yüksek göç oranından dolayı bazı yıllarda uygulanabilir ülkeler listesinin dışında kalmıştır; son durumu her yıl kontrol etmek gerekiyor.$b$,
 $b$abd$b$, $b$Amerika Birleşik Devletleri$b$, $b$oturum-izni$b$, $b$Oturum İzni$b$, 120, true, now()),

($b$abd-calisma-vizesi$b$, $b$Amerika'da Çalışma Vizesi: H-1B'den Ötesi (2025)$b$,
 $b$H-1B kura sistemi, Eylül 2025'teki 100.000 dolar ek ücret, EB-1/EB-2/EB-3/EB-5 Green Card kategorileri ve PERM süreci — ABD çalışma vizesinin tüm yolları.$b$,
 $b$H-1B vizesi her yıl Mart ayında başlayan kayıt dönemiyle bilinse de Türk profesyoneller için ABD çalışma vizesi seçenekleri bundan ibaret değil.

### H-1B: Sistem Nasıl İşliyor?

H-1B vizesi için süreç şöyle: İşverenin Mart başında (2026 için 4–19 Mart 2026 tarihleri arasında) USCIS'e kayıt yaptırması ve kurayı kazanması gerekiyor. Kura kazanılırsa I-129 petisyonu sunuluyor. Vize sonbaharda başlıyor.

Önemli not: Eylül 2025 itibarıyla H-1B petisyonları için 100.000 dolar ek ücret uygulaması başladı. Bu durum küçük ve orta ölçekli şirketlerin H-1B başvurusunu zorlaştırmaktadır.

### İstihdam Esaslı Green Card (EB) Kategorileri

**EB-1:** Olağanüstü yetenek sahipleri, önde gelen akademisyenler veya çok uluslu şirketlerin üst düzey yöneticileri. Kota bekleme süresi kısa.

**EB-2:** İleri derece sahibi profesyoneller. PERM iş piyasası testi (işveren sponsor olur). EB-2 NIW (National Interest Waiver) ise kişinin ABD ulusal çıkarına katkıda bulunduğunu kanıtlamasına dayalı kendi kendini sponsor etme imkânı sunuyor; bu seçenek araştırmacılar ve akademisyenler için son derece değerli.

**EB-3:** Nitelikli çalışanlar ve profesyoneller. PERM süreci genellikle 18–24 ay sürüyor. Ardından I-140 petisyonu ve aylık Visa Bülteni'ne göre sıra bekleniyor.

**EB-5 Yatırımcı:** 1.050.000 dolar (yüksek işsizlik bölgelerinde 800.000 dolar) yatırım ve 10 tam zamanlı iş yaratma koşulu.

### PERM Süreci: Hâlâ Uzun Bir Yol

EB-2 ve EB-3 için işveren, İş Piyasası Sertifikasyonu (PERM Labor Certification) almak zorunda. Bu süreç tek başına 18–24 ay alabilmekte ve işverenin önce ABD'de eleman aradığını belgelemesini gerektirmektedir. Bu nedenle ABD'de Green Card hedefliyorsanız süreci olabildiğince erken başlatmak büyük önem taşıyor.$b$,
 $b$abd$b$, $b$Amerika Birleşik Devletleri$b$, $b$calisma-vizesi$b$, $b$Çalışma Vizesi$b$, 121, true, now()),

($b$abd-vatandaslik$b$, $b$Amerika'da Vatandaşlık: Türkler İçin Gerçekçi Bir Zaman Çizelgesi (2025)$b$,
 $b$ABD vatandaşlığı (Naturalization) Green Card sahipleri için mümkün. Genel koşullar, çifte vatandaşlık ve Türkiye'den ABD vatandaşlığına gerçekçi 9–18 yıllık zaman çizelgesi.$b$,
 $b$ABD vatandaşlığı (Naturalization) Green Card sahipleri için mümkün; ancak bu da ayrı bir süreç gerektiriyor.

### Genel Koşullar

- En az **5 yıl** Green Card sahibi olmak (Amerikan vatandaşıyla evli olanlar için 3 yıl)
- Son 5 yılda ABD'de kesintisiz ikamet (yurt dışında uzun süreli bulunmak süreci sekteye uğratabilir)
- İyi ahlak belgesi
- İngilizce okuma, yazma ve konuşma yeterliliği
- ABD tarihi ve sivil bilgisi sınavı (Civics Test)

### Çifte Vatandaşlık

ABD hukuken çifte vatandaşlığı yasaklamamaktadır; ancak vatandaşlık yemininde önceki ülkeye "bağlılıktan vazgeçme" ifadesi yer alır. Pratikte pek çok ABD vatandaşı başka ülkelerin pasaportlarını korumaktadır. Türkiye de çifte vatandaşlığa izin verdiğinden bu yasal açıdan mümkün.

### Gerçekçi Zaman Çizelgesi

Türkiye'den ABD vatandaşlığına tipik süreç (H-1B yolundan gidildiğinde):

- H-1B kura kazanma ve vize: 1–3 yıl
- H-1B'den Green Card'a geçiş (EB kategorisi): 3–10+ yıl
- Green Card'ı 5 yıl tutmak: 5 yıl
- **Toplam minimum süre: 9–18 yıl**

Bu uzun zaman çizelgesi göz önüne alındığında, ABD planlarken mümkün olan en erken aşamada süreci başlatmak kritik önem taşıyor.$b$,
 $b$abd$b$, $b$Amerika Birleşik Devletleri$b$, $b$vatandaslik$b$, $b$Vatandaşlık$b$, 122, true, now()),

($b$abd-is-bulma$b$, $b$Amerika'da İş Bulmak: Türk Profesyoneller İçin Stratejik Rehber (2025)$b$,
 $b$ABD iş piyasası teknoloji ve finans merkezlerinde cazip fırsatlar sunuyor. En çok talep gören sektörler, Amerikan standardında CV, networking ve şehir seçiminin önemi.$b$,
 $b$ABD iş piyasası, özellikle teknoloji ve finans merkezleri olan San Francisco, New York ve Seattle, Türk profesyoneller için son derece cazip fırsatlar sunuyor.

### En Çok Talep Gören Sektörler

Teknoloji (yazılım, yapay zeka, bulut bilişim), finans ve yatırım bankacılığı, sağlık ve biyoteknoloji, akademi ve araştırma ile mühendislik (özellikle havacılık ve savunma).

### CV Amerikan Standardında Olmalı

ABD CV'lerinde temel farklılıklar:

- **Fotoğraf eklenmez** (ayrımcılığı önlemek amacıyla)
- **Doğum tarihi, medeni hal belirtilmez**
- **Resume (1 sayfa) veya CV (akademi için daha uzun)** formatı kullanılır
- Başarıları sayısal verilerle desteklemek ("ekip büyüklüğünü %30 artırdım" gibi) çok önemli

### Ağ Kurma (Networking) Her Şeyden Önce

ABD iş kültüründe "It's not what you know, it's who you know" (Ne bildiğinden çok kimi tanıdığın önemli) gerçeği iş bulma sürecinin tam merkezindedir. LinkedIn üzerinden şirket çalışanlarına doğrudan mesaj atmak, alumni ağlarını kullanmak ve diaspora topluluklarındaki profesyonellerle bağlantı kurmak sürecinizi önemli ölçüde hızlandırabilir.

### Şehir Seçimi Kritik

- **San Francisco / Bay Area:** Teknoloji ve girişimcilik merkezi; yüksek maaşlar ancak çok yüksek yaşam maliyeti
- **New York:** Finans, medya, moda; Türk topluluğu görece büyük
- **Seattle:** Amazon ve Microsoft odaklı teknoloji ekosistemi
- **Houston / Dallas:** Mühendislik, enerji sektörü; görece uygun yaşam maliyeti$b$,
 $b$abd$b$, $b$Amerika Birleşik Devletleri$b$, $b$is-bulma$b$, $b$İş Bulmak$b$, 123, true, now()),

($b$abd-yasam-sartlari$b$, $b$Amerika'da Yaşam Şartları: Türkler İçin Gerçekçi Bir Değerlendirme (2025)$b$,
 $b$ABD'de yaşam şartları şehirden şehire inanılmaz derecede farklılaşıyor. Konut, sağlık sigortası, vergi sistemi, Türk topluluğu ve eğitim üzerine gerçekçi bir değerlendirme.$b$,
 $b$ABD'de yaşam şartları şehirden şehire inanılmaz derecede farklılaşıyor. Aynı maaşla New York'ta zor geçinen biri, Houston'da rahat bir hayat sürebilir.

### Konut Maliyetleri

ABD'de kira fiyatları bölgeden bölgeye büyük uçurumlar yaratıyor:

- **San Francisco / Bay Area:** 1+1 daire için aylık $2.500–4.000
- **New York (Manhattan):** $3.000–5.000
- **Seattle:** $2.000–3.000
- **Austin:** $1.500–2.200
- **Houston / Dallas:** $1.200–1.800

### Sağlık Sigortası: En Büyük Gider Kalemlerinden Biri

Avrupa'nın aksine ABD'de evrensel sağlık sistemi yoktur. İşveren genellikle sağlık sigortasının bir kısmını karşılar; ancak çalışanın katkı payı, muafiyetler (deductible) ve cep harcamaları (out-of-pocket) önemli miktarlara ulaşabilmektedir. Aile sigortaları aylık $500–1.500 arasında maliyete neden olabilmektedir.

### Vergi Sistemi

ABD'de federal vergi (en yüksek dilim %37), eyalet vergisi (eyalete göre %0–13 arası) ve şehir/ilçe vergileri (bazı şehirlerde) ayrı ayrı uygulanmaktadır. Brüt maaşın %30–40'ı çeşitli vergiler olarak kesilmektedir.

### Türk Topluluğu

ABD'de yaklaşık 500.000 Türk kökenli vatandaş yaşıyor. New York, New Jersey, Washington D.C. ve California başlıca yoğunlaşma noktaları. Türk dernekleri, camileri ve kültür merkezleri özellikle büyük şehirlerde aktif biçimde faaliyet gösteriyor.

### Eğitim

Devlet okulları eyalete ve mahalleye göre kalite açısından büyük farklılık gösteriyor. Üniversite eğitimi ise dünyaca ünlü kurumlarıyla cazip olmakla birlikte son derece pahalı; yıllık $30.000–70.000 arasında değişen eğitim masrafları için özel burs ve mali yardım programları takip edilmelidir.$b$,
 $b$abd$b$, $b$Amerika Birleşik Devletleri$b$, $b$yasam-sartlari$b$, $b$Yaşam Şartları$b$, 124, true, now()),

-- ── BAE (DUBAI) ─────────────────────────────────────────────────────────
($b$bae-oturum-izni$b$, $b$Dubai'de Oturum İzni: 2025 Rehberi$b$,
 $b$BAE oturum sistemi Batılı ülkelerden farklı işliyor. İşveren destekli izinden yatırımcı vizesine, freelancer vizesinden 10 yıllık Altın Vize'ye (Golden Visa) tüm yollar.$b$,
 $b$Dubai ve BAE (Birleşik Arap Emirlikleri), özellikle vergi avantajları, lüks yaşam tarzı ve kolay iş kurma imkânları nedeniyle son yıllarda Türk diasporasının en fazla ilgi gösterdiği destinasyonlardan biri haline geldi. BAE'de oturum sistemi diğer Batılı ülkelerden farklı işliyor.

### Oturum İzni Türleri

**İşveren destekli oturum izni:** BAE'deki en yaygın oturum yolu. Bir şirket bünyesinde çalışıyor olmanız ve işvereninizin sizin adınıza başvurması gerekiyor. Geçerlilik süresi genellikle 2 yıl; yenileme mümkün.

**Yatırımcı vizesi:** Ticari yatırım veya mülk sahipliği yoluyla alınan 2 yıllık oturum izni. Nisan 2026'dan itibaren Dubai'de yalnızca mülkün toplam değerinin 750.000 AED'yi geçmesi yeterli; minimum depozito veya peşinat koşulu kaldırıldı.

**Serbest Çalışan / Freelancer Vizesi:** Çeşitli serbest bölge otoriteleri (DMCC, Dubai Media City vb.) aracılığıyla bağımsız çalışanlar için serbest çalışma vizesi alınabiliyor.

### Altın Vize (Golden Visa): 10 Yıllık Oturum

BAE Golden Visa, 2019'dan bu yana dünya genelinde büyük ilgi gören uzun dönem oturum modelinin merkezinde yer alıyor. İşte temel kategoriler ve eşikler (Ekim 2025 güncellemesiyle):

**Yatırımcı:** BAE'de en az 2 milyon AED (yaklaşık 550.000 USD) değerinde gayrimenkul yatırımı. Şubat 2026'dan itibaren ipotek veya taksitli satın alımlarda da tam mülk değeri esas alınıyor.

**Nitelikli çalışan:** Aylık brüt maaş en az 30.000 AED (yaklaşık 8.200 USD) ve lisans derecesi veya muadili eğitim.

**Girişimci:** Asgari 500.000 AED değerinde bir proje veya işletme.

**Olağanüstü yetenek:** Sanat, bilim, spor veya eğitimde tanınan başarılar.

Golden Visa; eş, çocuklar ve ebeveynleri sponsor yapma hakkı, 6 aydan uzun süre yurt dışında kalabilme (standart vizede bu kural sizi vizesiz bırakır) ve işveren bağımsızlığı gibi ayrıcalıklar sunuyor.$b$,
 $b$bae$b$, $b$Birleşik Arap Emirlikleri (Dubai)$b$, $b$oturum-izni$b$, $b$Oturum İzni$b$, 130, true, now()),

($b$bae-calisma-vizesi$b$, $b$Dubai'de Çalışma Vizesi: Türkler İçin Adım Adım (2025)$b$,
 $b$Dubai'de çalışmak çoğu Avrupa ülkesine kıyasla daha hızlı işliyor. Standart çalışma vizesi adımları, serbest bölgeler (Free Zones) ve mesleki belge onayları.$b$,
 $b$Dubai'de çalışmak, çoğu Avrupa ülkesine kıyasla bürokratik açıdan daha hızlı işleyen bir süreç. Ancak bunun nedeni çoğunlukla vizanın işveren tarafından yönetilmesi.

### Standart Çalışma Vizesi

1. İşverenden iş teklifi alın
2. İşveren MOHRE (Ministry of Human Resources and Emiratisation) üzerinden izin başvurusu yapar
3. Sağlık taraması (kan testi ve akciğer röntgeni)
4. Emirates ID ve oturum vizesi çıkar
5. Tüm süreç genellikle 2–4 haftada tamamlanır

**Gerekli belgeler:** Pasaport (en az 6 ay geçerli), eğitim belgelerinin noter tasdikli çevirisi, mesleğe göre ek belgeler (lisans vb.)

### Serbest Bölgeler (Free Zones)

Dubai'nin en cazip özelliklerinden biri, serbest bölgeler aracılığıyla yüzde 100 yabancı mülkiyetli şirket kurabilme imkânı. DMCC, DIFC, DIC, Dubai Media City gibi bölgeler sektöre göre özelleşmiş yapılar sunuyor. Serbest bölge vizesi, şirket sahipliği ve çalışmayı tek çatı altında birleştiriyor.

### Mesleki Belgeler: Dikkat!

Bazı meslekler (mühendislik, tıp, hukuk, muhasebe) için BAE'nin ilgili meslek kuruluşundan lisans onayı gerekiyor. Bu süreç birkaç ayı bulabilir; bu nedenle başvuruları erken başlatmanız önerilir.$b$,
 $b$bae$b$, $b$Birleşik Arap Emirlikleri (Dubai)$b$, $b$calisma-vizesi$b$, $b$Çalışma Vizesi$b$, 131, true, now()),

($b$bae-vatandaslik$b$, $b$Dubai / BAE'de Vatandaşlık: Gerçekler ve Beklentiler (2025)$b$,
 $b$BAE vatandaşlığı diğer ülkelerin sistemlerinden temelden farklı: mümkün ama son derece istisnai. Vatandaşlığın pratik alternatifi Altın Vize ve önemli notlar.$b$,
 $b$BAE vatandaşlığı konusunda net olmak gerekiyor: Bu, diğer ülkelerin vatandaşlık sistemlerinden temelden farklı.

### BAE'de Vatandaşlık Mümkün Mü?

Evet, teorik olarak mümkün; ancak son derece istisnai. BAE, 2021'den itibaren çok sınırlı sayıda yabancıya vatandaşlık vermeye başladı. Hedef kitleler şunlar:

- BAE'ye özel beceri veya bilgi sunan istisnai yetenekler (bilim insanları, sanatçılar, sporcular)
- BAE ekonomisine katkıda bulunan yatırımcılar
- Uzun süreli yasal ikamet sahipleri (belirli koşullarda)

Ancak bu süreç doğrudan bireysel başvuruyla değil, ilgili devlet kurumlarının veya devlet yetkililerinin tavsiyesiyle işliyor.

### Altın Vize: Vatandaşlığın Alternatifi

Çoğu yabancı için BAE vatandaşlığı yerine Altın Vize (10 yıllık oturum) pratikte en uzun vadeli seçenek. Altın Vize vatandaşlık sağlamıyor, ancak süresiz yenilenebilir olduğu için pratik açıdan uzun vadeli ikamet güvencesi sunuyor.

### Önemli Not

BAE'de standart oturum izni, ülke dışında 6 aylık kesintisiz kalış nedeniyle iptal olabiliyor. Altın Vize sahipleri bu kuraldan muaf.$b$,
 $b$bae$b$, $b$Birleşik Arap Emirlikleri (Dubai)$b$, $b$vatandaslik$b$, $b$Vatandaşlık$b$, 132, true, now()),

($b$bae-is-bulma$b$, $b$Dubai'de İş Bulmak: Türk Profesyoneller İçin Rehber (2025)$b$,
 $b$Dubai teknoloji, finans ve girişimcilik açısından küresel bir merkez. Öne çıkan sektörler, online platformlar, serbest bölge kariyer fuarları, Türk diaspora ağları ve ücret beklentileri.$b$,
 $b$Dubai'nin son yıllardaki büyüme hızı, şehri özellikle teknoloji, finans ve girişimcilik ekosistemi açısından küresel ölçekte cazip bir merkeze dönüştürdü. Türk profesyoneller için bu şehirde iş bulmak görece erişilebilir; üstelik mevcut Türk topluluğu ağı da süreci kolaylaştırıyor.

### Hangi Sektörler Öne Çıkıyor?

Finans ve bankacılık (özellikle DIFC bünyesindeki kuruluşlar), teknoloji (fintech, yapay zeka, e-ticaret), gayrimenkul ve inşaat, lojistik ve tedarik zinciri, otelcilik ve turizm ile sağlık Türklerin aktif olduğu başlıca alanlar.

### Nereden Başlamalı?

**Online platformlar:** LinkedIn Dubai/BAE filtresi, Bayt.com (bölgenin lider iş platformu), Naukrigulf.com, GulfTalent.com öne çıkan kanallar. Şirket web siteleri de doğrudan başvuru için aktif kullanılıyor.

**Serbest bölge kariyer fuarları:** DMCC, DIFC ve diğer serbest bölgeler düzenli olarak networking etkinlikleri ve kariyer fuarları düzenliyor.

**Türk diaspora ağları:** Dubai'deki Türk iş dünyası ağları, odası ve dernekleri son derece aktif. Bu ağlardan biri aracılığıyla doğru insanlara ulaşmak iş bulma sürecini önemli ölçüde hızlandırıyor.

### Ücret Beklentileri

BAE'de gelir vergisi yoktur; bu durum net maaşı doğrudan brüt maaşla eşitleyen önemli bir avantaj. Kıdemli yazılım geliştirici için aylık 25.000–40.000 AED, finans profesyoneli için 20.000–35.000 AED, orta düzey mühendis için 15.000–25.000 AED aralığında maaş beklentisi oluşturulabilir.$b$,
 $b$bae$b$, $b$Birleşik Arap Emirlikleri (Dubai)$b$, $b$is-bulma$b$, $b$İş Bulmak$b$, 133, true, now()),

($b$bae-yasam-sartlari$b$, $b$Dubai'de Yaşam Şartları: Gerçekler ve Rakamlar (2025)$b$,
 $b$Dubai lüks yaşam ve vergi avantajlarıyla çekici, ama yüksek maliyet ve kültürel farklar da var. Konut, vergi avantajı, günlük yaşam, sağlık, Türk topluluğu ve pratik notlar.$b$,
 $b$Dubai, lüks yaşam tarzı ve vergi avantajlarıyla dünyanın en çekici şehirlerinden biri olmayı sürdürüyor. Ancak yüksek yaşam maliyeti ve belirli kültürel farklılıklar bu tabloyu tamamlamalı.

### Konut Maliyetleri

Dubai'de kira fiyatları yıl geçtikçe yükseliyor:

- **Dubai merkezi (DIFC, Downtown, Marina):** 1+1 daire için aylık 8.000–15.000 AED (yaklaşık 2.200–4.100 USD)
- **Orta düzey semtler (JVC, Al Barsha, Discovery Gardens):** 5.000–8.000 AED
- **Daha uzak semtler (Dubai Silicon Oasis, International City):** 3.000–5.000 AED

Kira sözleşmeleri genellikle yıllık ve toplu çek (tek veya dört çek) sistemiyle yapılıyor; bu durum peşin nakit gereksinimi yaratıyor.

### Vergi Avantajı: Büyük Fark

BAE'de kişisel gelir vergisi yoktur. Bu, brüt maaşınızın tamamen size kalması anlamına geliyor. Katma Değer Vergisi (KDV) 2018'den itibaren %5 olarak uygulanıyor; bu oran Avrupa'nın büyük çoğunluğuna kıyasla son derece düşük.

### Günlük Yaşam

Gıda harcamaları: Büyük süpermarketlerde (Carrefour, Spinneys, Lulu) aylık 1.500–2.500 AED. Türk mutfağı Dubai'de son derece yaygın; hem Türk restoranlar hem de marketler kolaylıkla bulunabiliyor. Türk ürünleri çoğu büyük süpermarkette mevcut.

Ulaşım: Metro ve otobüs ağı var; ancak şehrin tasarımı araca bağımlılığı teşvik ediyor. Yakıt maliyeti düşük; araba kiralamak veya satın almak görece uygun.

### Sağlık

Dubai'de sağlık sigortası işverenler tarafından zorunlu olarak sağlanmaktadır. Özel hastane ve klinik altyapısı son derece gelişmiş. NHS gibi ücretsiz bir sistem bulunmuyor; bu nedenle sigorta kapsamınızı dikkatle inceleyin.

### Türk Topluluğu

Dubai ve BAE'de yaklaşık 60.000–80.000 Türk yaşadığı tahmin ediliyor. Türk restoran, kafe ve market yoğunluğu özellikle Deira ve Al Barsha bölgelerinde belirgin. Türk Büyükelçiliği ve diaspora dernekleri aktif etkinlikler düzenliyor. BAE'deki Türk toplumu, özellikle son yıllarda girişimci ve profesyonel profillerle güçlenen dinamik bir yapıya sahip.

### Kültürel ve Pratik Notlar

BAE bir İslam ülkesi; kamusal alanda giyim kuralları, alkol tüketimi (yalnızca lisanslı mekanlarda) ve sosyal davranış konusunda yerel kurallara uyum bekleniyor. Ramazan döneminde kamusal alanlarda yeme-içme yasaklanmış. Bununla birlikte Dubai özellikle modern ve kozmopolit yapısıyla yabancıların hayatına uyum sağlamak açısından diğer BAE şehirlerine kıyasla daha esnek bir ortam sunuyor.$b$,
 $b$bae$b$, $b$Birleşik Arap Emirlikleri (Dubai)$b$, $b$yasam-sartlari$b$, $b$Yaşam Şartları$b$, 134, true, now())

ON CONFLICT (slug) DO UPDATE SET
  title            = EXCLUDED.title,
  excerpt          = EXCLUDED.excerpt,
  content_markdown = EXCLUDED.content_markdown,
  country          = EXCLUDED.country,
  country_label    = EXCLUDED.country_label,
  category         = EXCLUDED.category,
  category_label   = EXCLUDED.category_label,
  sort_order       = EXCLUDED.sort_order,
  published        = EXCLUDED.published,
  published_at     = COALESCE(public.blog_posts.published_at, EXCLUDED.published_at),
  updated_at       = now();

COMMIT;
