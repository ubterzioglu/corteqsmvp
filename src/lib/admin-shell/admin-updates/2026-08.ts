// Ürün güncellemeleri — Ağustos 2026 kayıtları (en yeniden eskiye).
// Tek kaynak barrel: ../admin-updates.ts — ekranlar oradan okur, buradan DEĞİL.

import type { AdminUpdateEntry } from "./types.ts";

export const ADMIN_UPDATES_2026_08: AdminUpdateEntry[] = [
  {
    id: "20260831-30-agustos-eksik-teknik-isler",
    date: "31 Ağustos 2026",
    title:
      "30 Ağustos'un eksik kalan teknik işleri eklendi — veri işlemleri ve yayın kontrolleri güçlendi",
    items: [
      "GÜVENLİ MIGRATION ÇALIŞTIRICISI: Yeni veritabanı değişikliği ile uygulandığını gösteren ledger kaydı artık tek işlemde yazılıyor. İşlem yarıda kalırsa ikisi birlikte geri alınıyor. Çalıştırmadan önce dosya adı, konumu ve güvenlik kuralları denetlenebiliyor; geçmiş bir migration'ın yanlışlıkla yeniden çalıştırılması engelleniyor.",
      "SUPABASE SDK SÜRÜMLERİ HİZALANDI: Site, sunucu fonksiyonları ve arka plan işçileri aynı güncel SDK sürümüne çekildi. Böylece farklı parçaların farklı istemci davranışı göstermesine yol açabilecek sürüm sapması kaldırıldı.",
      "VERİ SINIRLARI DAHA SIKI TİPLENDİ: Admin, oturum, profil ve WhatsApp akışlarında veritabanından gelen değerler açık türlerle sınırlandı. Beklenmeyen veya eksik verinin ekrana sessizce taşınması yerine daha erken yakalanmasını sağlayan ortak kontroller güçlendirildi.",
      "TEST GÜRÜLTÜSÜ TEMİZLENDİ: Otomatik testlerde gerçek hata olmadığı hâlde konsola düşen açıklamasız uyarılar kaldırıldı. Böylece yeni bir hata veya uyarı çıktığında yüzlerce satır arasında kaybolmadan görülebiliyor.",
      "YAYIN DOĞRULAMASI GÜNCELLENDİ: Üretim sayfasında birden fazla JavaScript giriş dosyası olduğunda doğrulama artık doğru ana dosyayı seçiyor; muhasebe sayfalarının sonradan yüklenen parçalarını da denetliyor. Çoklu giriş düzeni tekrar bozulmasın diye otomatik testle kilitlendi.",
      "KAPSAM NOTU: Bunlar yeni bir kullanıcı ekranı açmayan teknik bakım işleri. Amaç; veritabanı uygulamalarını, veri okuma sınırlarını, test sinyallerini ve canlı yayın kontrolünü daha güvenilir hâle getirmek.",
    ],
  },
  {
    id: "20260830-kalan-isler-temizlendi",
    date: "30 Ağustos 2026",
    title: "Kalan işler yeniden tarandı — Contributor kuyruğu geldi, bayat kayıtlar temizlendi",
    items: [
      "KOMUTA MERKEZİ GERÇEĞE ÇEKİLDİ: Referral QR işi daha önce canlıda doğrulanmış olmasına rağmen açık görünüyordu; artık tamamlandı. Video komutları, LinkedIn metinleri, kafe tanıtım paketi, kontrollü topluluk mesajı ve Cadde logosu için yalnız UBT tarafındaki beş doğrulanmış kutu işaretlendi. Burak'ın onay kutularına dokunulmadı.",
      "CADDE KONUM MADDESİ ARTIK BAYAT DEĞİL: Canlı veritabanı yeniden ölçüldü. Ülke bağlantıları 22/22, şehir bağlantıları 57/57 dolu. Kalan eski 'Belirtilmedi', boş veya hatalı profil değerleri katalog eksiği değil; Cadde bunlarda boş ekran bırakmayan güvenli akışı kullanıyor. Bu yüzden eski ve yanıltıcı yapılacak maddesi panelden kaldırıldı.",
      "CONTRIBUTOR KAYNAK KUYRUĞU: Admin menüsüne yeni bir ekran eklendi. Yerel işletme, danışman, dernek, grup, etkinlik ve benzeri kaynaklar; ülke, şehir, birincil bağlantı, kontrol tarihi, paylaşım izni ve çıkar ilişkisiyle kaydedilebiliyor. Admin kaynağı kabul edebiliyor, eksik bilgi isteyebiliyor veya gerekçesiyle reddedebiliyor.",
      "CONTRIBUTOR KENDİ HESABINDAN KAYNAK GÖNDEREBİLİYOR: Aktif Contributor rolündeki üye profilindeki kısayoldan yeni kaynak önerebiliyor ve yalnız kendi gönderilerinin durumunu, varsa admin notunu görebiliyor. Özel yazışma ve kişisel veri eklememesi ekranda açıkça anlatılıyor.",
      "CONTRIBUTOR GÜVENLİĞİ: Tarayıcı tabloya doğrudan yazamıyor; gönderim kontrollü bir fonksiyondan geçiyor. Aktif Contributor rolü veri tabanında yeniden kontrol ediliyor, saatlik gönderim sınırı uygulanıyor, kullanıcı adı veya parola içeren bağlantılar reddediliyor ve her işlem denetim geçmişine yazılıyor.",
      "KOD KALİTESİ: Üretim kodundaki 34 ESLint uyarısının tamamı temizlendi; sonuç 0 hata ve 0 uyarı. Bu sırada sohbet kayıt akışında güncel adım yerine eski adımı okuyabilen bir durum da düzeltildi ve tekrarını yakalayan test eklendi.",
      "BAĞIMLILIK GÜVENLİĞİ: Siteyi derleyen ve test eden temel paketler güncel güvenli sürümlere taşındı. Paket taraması artık üretim ve geliştirme araçlarının tamamında 0 güvenlik açığı gösteriyor. Test ayarları da yeni sürümlere uyarlandı; eski ayar ve Node uyarıları temizlendi.",
      "BİLEREK AÇIK KALANLAR: Meta WhatsApp anahtarları, iki gerçek Cadde deneme hesabı, hoş geldin e-postasının gerçek gelen kutusu kontrolü ve hukuk/izin kararları yine dış erişim veya insan onayı bekliyor; tamamlanmış gösterilmedi.",
    ],
  },
  {
    id: "20260830-limit-sprinti-canliya-alindi",
    date: "30 Ağustos 2026",
    title:
      "Büyük bakım paketi yayında — VIP davetleri, daha güvenli araç raporları ve daha hızlı açılan sayfalar",
    items: [
      "SON SÜRÜM CANLIDA: Uzun süredir bekleyen teknik işler küçük parçalar halinde tamamlandı ve site yeniden yayınlandı. Veritabanındaki 373 güncellemenin tamamı canlıyla eşleşiyor; eksik veya yarım kalmış bir adım görünmüyor.",
      "KİŞİYE ÖZEL VIP DAVETLERİ: Admin panelinde VIP davet oluşturma ve iptal etme ekranı hazır. Her bağlantı tek kişilik, varsayılan olarak 30 gün geçerli ve yalnızca bir kez kullanılabiliyor. Davet bağlantısının kendisi sistemde açık biçimde saklanmıyor; yalnız oluşturulduğu anda kopyalanabiliyor.",
      "ARAÇ RAPORLARI DAHA GÜVENLİ: Üye artık ülke veya şehir bilgisi olmadan araç sonucunu e-postayla isteyemiyor. Raporda, sonucun alındığı andaki ülke ve şehir ayrıca saklanıyor; profil daha sonra değişse bile eski raporun hangi konuma göre hazırlandığı kaybolmuyor.",
      "YARIM KALAN ARAÇLARA GERİ DÖNÜŞ: Üye bir aracı yarıda bırakırsa kaldığı yer kaydediliyor ve aynı bağlantıdan devam edebiliyor. Hatırlatma sistemi, e-postası doğrulanmış ve izin veren üyeye yalnızca bir kez gönderecek şekilde hazırlandı. Hukuk ve izin kontrolü bitene kadar genel gönderim anahtarı kapalı tutuluyor.",
      "WHATSAPP MÜŞTERİ TALEPLERİ İÇİN YENİ KUYRUK: Admin paneline gelen WhatsApp taleplerini sorumluya verme, durumunu değiştirme ve yanıt hazırlama ekranı eklendi. Aynı mesaj ikinci kez kaydolmuyor, telefon bilgisi açık biçimde tutulmuyor ve 24 saat dışındaki yanıtlar onaylı şablon gerektiriyor. Meta hesap bilgileri henüz verilmediği için WhatsApp bağlantısı şimdilik kapalı; ekran ve güvenlik altyapısı hazır.",
      "ŞİKÂYET VE MODERASYON İÇİN ORTAK TEMEL: Cadde'ye özel kalmayacak biçimde şikâyet, inceleme, geçici kısıtlama ve işlem geçmişi yapısı hazırlandı. Böylece yeni bölümler açıldığında aynı güvenlik düzeni tekrar tekrar kurulmayacak.",
      "SAYFALAR DAHA HIZLI VE DAHA ANLAŞILIR AÇILIYOR: Boş beyaz ekran yerine görünür bir “Sayfa yükleniyor” durumu geldi. Büyük admin ve grafik dosyaları yalnız ihtiyaç olduğunda yükleniyor. Yayındaki hiçbir JavaScript dosyası belirlenen 500 KB sınırını aşmıyor.",
      "KAMUYA AÇIK OLMAMASI GEREKEN DOSYALAR KALDIRILDI: İç kullanım için hazırlanmış Stripe rehberi artık eski adresinden açılamıyor ve 404 dönüyor. Kullanılmayan 49 MB'lık video da sitenin herkese açık dosyalarından çıkarıldı.",
      "KOMUTA MERKEZİ TEMİZLENDİ: Aynı işi anlatan tekrar kayıtlar geçmişleri kaybolmadan birleştirildi, görev olmayan notlar ayrıldı ve büyük başlıklar daha küçük işlere bölündü. Araç raporu ve yarım kalan araç hatırlatması maddelerinde yalnız teknik onay işaretlendi; Burak'ın onay kutusuna dokunulmadı.",
      "PAYLAŞIMA HAZIR İÇERİKLER: 18 araç için tanıtım metinleri, görsel fikirleri, video komutları, LinkedIn ve kafe kampanyası metinleri hazırlandı. WhatsApp topluluk listeleme kuralları ile contributor soru-cevap paketi de hazır; hiçbiri insan onayı olmadan dışarıya paylaşılmadı.",
      "BİLEREK AÇIK BIRAKILANLAR: Cadde'nin iki gerçek deneme hesabıyla son kabulü, hoş geldin e-postasının gerçek gelen kutusu kontrolü, WhatsApp için Meta anahtarları, hatırlatma e-postasının hukuk onayı ve Clarity'den gerçek veri alınması hâlâ bekliyor. Bunlar yapılmış gibi kapatılmadı.",
      "KALİTE KONTROLÜ: 1.676 otomatik test geçti; tip kontrolü, üretim derlemesi, veri tabanı karşılaştırması ve canlı site kontrolü temiz sonuç verdi. Admin panelindeki yeni ekranlar ve VIP bağlantısı canlı sürümde ayrıca kontrol edildi.",
    ],
  },
  {
    id: "20260830-komuta-merkezi-teknik-isler-canliya-alindi",
    date: "30 Ağustos 2026",
    title:
      "Komuta Merkezi'ndeki teknik işler topluca ele alındı — üye takibi, ortak sorumlu ve referral QR canlıda",
    items: [
      "KOMUTA MERKEZİ TOPARLANDI: Açık teknik maddeler tek tek incelendi. Gerçekten tamamlanan dört görev kapatıldı, deneme amaçlı açılmış anlamsız kayıt kaldırıldı. Kod işi olmayan veya son karar bekleyen maddeler ise yapılmış gibi gösterilmedi; açık bırakıldı.",
      "YENİ ÜYE TAKİBİ EKRANI: Admin paneline, topluluk başvurularını tek yerde görmeyi sağlayan yeni bir ekran eklendi. Şu anda 138 başvuru ve 27 ekli dosya; başvuru türü, durum, tarih, kategori ve dosya durumuna göre süzülebiliyor. Üyenin açıklaması, ihtiyacı, davet kodu ve ilk adımlardaki ilerlemesi de aynı ekranda görülebiliyor.",
      "EK DOSYALAR DAHA GÜVENLİ: Üyelerin yüklediği dosyalar artık herkese açık bir bağlantıyla sunulmuyor. Admin indirme istediğinde yalnızca beş dakika çalışan özel bir bağlantı oluşturuluyor; eski kayıtların bağlantıları da bu yeni düzene uyumlu biçimde ele alınıyor.",
      "B+B GÖREVLERİNE İKİ SORUMLU: Komuta Merkezi'nde B+B etiketli görevlerde artık ikinci sorumlu seçmek zorunlu. Bu kontrol yalnızca ekranda değil, veri tarafında da uygulanıyor; böylece eksik sorumlu bilgisiyle kayıt oluşamıyor.",
      "REFERRAL QR KODU HAZIR: Her referral kodunun yanında SVG ve PNG indirme düğmeleri var. QR kodu doğrudan gerçek kayıt formuna yönlendiriyor ve geçerli davet kodunu forma hazır getiriyor. Geçersiz kodlar sessizce yok sayılıyor; QR üretimi için dışarıya veri gönderilmiyor.",
      "CADDE'DEKİ EKSİK PARÇALAR TAMAMLANDI: Kafe katılım istekleri ile görsel ve yorum akışındaki yarım kalan teknik parçalar ana koda alındı. Otomatik kontroller geçti. İki gerçek deneme kullanıcısıyla yapılması gereken son kabul kontrolü için ayrı görevler açık bırakıldı.",
      "SOSYAL MEDYA TALEBİ MEVCUT KATEGORİYLE EŞLEŞTİRİLDİ: Yeni ve aynı işi yapan ikinci bir kategori açmak yerine mevcut “İçerik, SEO & Sosyal Medya” kategorisinin bu talebi zaten karşıladığı doğrulandı. Böylece listede gereksiz tekrar oluşmadı.",
      "VERİ TABANI GÜNCEL: Projedeki 364 veri tabanı güncellemesinin tamamının canlı ortamda uygulandığı doğrulandı. Eksik veya fazladan kalmış bir güncelleme bulunmadı; bugün eklenen üye takibi, güvenlik ve B+B kuralları da canlıda kontrol edildi.",
      "HOŞ GELDİN E-POSTASI BİLEREK AÇILMADI: Yeni e-posta tasarımı ve kısa yönlendirme listesi kodda hazır. Ancak ön izleme ve gerçek test posta kutusu kontrolü tamamlanmadan canlı gönderim açılmadı; daha önce gönderilmemiş 16 eski kayıt için de geriye dönük gönderim yapılmadı.",
      "AÇIK KALAN SON KONTROLLER: Cadde'de iki gerçek kullanıcıyla uçtan uca deneme, admin oturumunda QR indirme düğmesine gerçek tıklama ve VIP QR kodlarının tek mi kişiye özel mi olacağı kararı hâlâ açık. Bunlar doğrulanmadan ilgili görevler kapatılmayacak.",
      "KALİTE KONTROLLERİ: 1.608 otomatik test, tip kontrolü, üretim derlemesi, yayın öncesi denetimler ve güvenlik başlıkları kontrolü başarıyla geçti. Değişiklikler canlı ortama gönderildi.",
    ],
  },
  {
    id: "20260829-cadde-panosu-gercege-cekildi",
    date: "29 Ağustos 2026",
    title:
      "Cadde workshop panosu gerçeğe çekildi — açık görünen 5 madde aslında bitmişti ya da konusu kalmamıştı",
    items: [
      "Panodaki açık madde sayısı yanıltıyordu. Sayıldı: 136 madde, 53'ü açık görünüyor. Ama tek tek bakılınca bunların 53 iş OLMADIĞI çıktı — yaklaşık 11'i bu projede kod işi, 12'si Burak'ın pazarlama içeriği, 10'u tarihi çoktan geçmiş toplantı maddesi, 7'si iş/altyapı konusu (WordPress, gizlilik sözleşmesi), 8'i zaten bilerek park edilmiş.",
      "Beş madde ise açık duruyordu ama işi çoktan bitmişti veya sorusu ortadan kalkmıştı. Beşi de koda ve canlı veritabanına bakılarak DOĞRULANDI, tahminle işaretlenmedi.",
      "Bitmiş çıkanlar: (1) 'şehir/ülke göstergesinin yanında dijital saat' — saat zaten yapılmış ve akışın üstünde çiziliyor. (2) 'yeni yorumlar sayfa yenilenmeden görünsün' — ana akışta zaten çalışıyor, yorum paneli açıkken kendi kendine tazeleniyor.",
      "Konusu kalmayanlar: 'paylaşımların etkileşim oranına göre global akışa taşınması' maddesi iki ayrı yerde duruyordu. 10 Ağustos'ta eşikler sıfırlandığı için artık taşınacak bir kapı yok — her paylaşım zaten global katmanda. Canlıdan teyit edildi (üç eşik de 0, global katman açık). Eşikler bir gün geri alınırsa bu iki madde YENİDEN AÇILMALI, dosyaya bu not düşüldü.",
      "Beşincisi 26 Ağustos toplantısı için durum raporu hazırlama maddesiydi; toplantı yapıldı, notları komuta merkezine işlendi, madde kendiliğinden kapandı.",
      "Bilerek AÇIK BIRAKILAN bir madde var: 'yeni paylaşım gelince akışın kendi kendine yenilenmesi'. Bu bitmemiş bir iş değil, verilmiş bir karar — akışın altından kayması yerine 'N yeni paylaşım' düğmesi tercih edilmişti. Panoda durması doğru.",
      "Sonuç ölçüldü: senin onayladığın madde sayısı 83'ten 88'e çıktı, açık madde 53'ten 48'e indi. Beş maddeye yalnız senin onayın atıldı — Burak'ın onay kutusuna dokunulmadı, o kendisinin.",
      "Durum: değişiklik ZATEN CANLIDA (panodaki kutular sunucu tarafında işaretlendi, yayın gerektirmedi). Panoyu açtığında görüyorsun.",
    ],
  },
  {
    id: "20260828-27-agustos-toplantisi-komuta-merkezine",
    date: "28 Ağustos 2026",
    title:
      "27 Ağustos toplantısı komuta merkezine işlendi — 12 madde, kararlar dahil",
    items: [
      "27 Ağustos toplantısında konuşulan her şey tek tek komuta merkezine yazıldı: 12 madde. 7'si sende, 5'i Burak'ta. Toplantı listesinde 'Toplantı 18' olarak görünüyor.",
      "Bunların 9'u doğrudan toplantının yapılacaklar listesinden geldi. Sende olanlar: Cadde ana sayfasında 'İnsanları Keşfet' ve 'Aktif Kafeler' bloklarının yukarı taşınması, kafeye parolalı/onaylı girişte sayfanın kendini yenileme sorunu, Jukebox'ın ayrı bir modül olarak kurulması, kafenin içinden akışa dönüş butonu ve workshop panosunda açık kalan maddelerin hafta sonu kapatılması. Burak'ta olanlar: ikonların SVG olarak hazırlanması, kafeler için 3 arka plan teması, Jukebox'ın kullanıcı senaryoları ve profiller toplantısının ön hazırlığı.",
      "Kalan 3 madde toplantıda alınan ama kimseye iş olarak düşmeyen KARARLARDAN üretildi ve 'Beklemede' işaretlendi: Çarşı'nın lansman kapsamından çıkarılması, reklamların kolon banner'ı değil akış içi sponsorlu içerik olması, Cadde ve profiller oturana kadar dış pazarlamanın durdurulması. Bunlar listeye alınmasaydı hiçbir yere yazılmamış olacaktı — komuta merkezinde 'karar' diye ayrı bir tür yok, o yüzden bekleyen iş olarak duruyorlar.",
      "Geri kalan kararlar ilgili maddenin açıklamasına 'Karar:' diye işlendi: kafelerde anlık sohbet olmayacak (moderasyon yükü nedeniyle forum düzeni kalıyor), arka plan temaları her girişte veritabanından çekilmeyecek (sunucu maliyeti için sisteme gömülü 3-4 sabit seçenek), Jukebox ayrı modül olarak sonradan eklenecek.",
      "Bu iş sırasında eski bir eksik ortaya çıktı ve kapatıldı: 24 Ağustos toplantısının maddeleri canlıda duruyordu ama veritabanının 'hangi değişiklik uygulandı' defterine hiç yazılmamıştı. İki kayıt da eklendi. Defter artık 361 dosya / 361 kayıt — boşluk yok.",
      "Durum: 12 maddenin hepsi ZATEN CANLIDA, komuta merkezini açtığında görüyorsun. Yayın sadece toplantı seçme listesindeki 'Toplantı 18 — 27 Ağustos 2026' etiketi için gerekli.",
    ],
  },
  {
    id: "20260826-24-agustos-toplantisi-komuta-merkezine",
    date: "26 Ağustos 2026",
    title: "24 Ağustos toplantısı komuta merkezine işlendi — 12 madde",
    items: [
      "24 Ağustos toplantısının yapılacaklar listesi komuta merkezine yazıldı: 12 madde, 6'sı sende 6'sı Burak'ta. Toplantı listesinde 'Toplantı 17' olarak görünüyor.",
      "Sende olanlar: PFA sitesinin test için Şahin'e yönlendirilmesi, Payal BI'ın kendi sunucusuna taşınmasının Halil'e devredilmesi, 26 ve 28 Ağustos toplantılarının hazırlıkları, Zoom davetlerinin gönderilmesi ve Burak'ın depoya bağlanması.",
      "Burak'ta olanlar: PFA giriş bilgilerinin iletilmesi, Payal BI hostinginin 1 ay uzatılması, ortak ChatGPT hesabında yarı yarıya kullanım kuralına uyulması, profil geri bildirimlerinin yazılı iletilmesi, teknoloji giderleri tablosunun hazırlanması ve WhatsApp gruplarına içerik hatırlatması.",
      "Durum: maddeler canlıda, panelde görünüyor.",
    ],
  },
  {
    id: "20260810-cadde-akisinda-ulke-siniri-kalkti",
    date: "10 Ağustos 2026",
    title:
      "Cadde'de 'paylaşımlar birbirine yansımıyor' şikâyeti çözüldü — ülke sınırı kaldırıldı, artık herkes herkesin paylaşımını görüyor",
    items: [
      "Şikâyet şuydu: paylaşımlar akışa yansımıyor. Veritabanı baştan aşağı kontrol edildi ve ORTADA BOZUK VERİ YOKTU — 20 paylaşımın hepsi yayında, hepsinin hedefi tanımlı, eksik kayıt yok. Akışı kapatan şey bir arıza değil, sistemin kendi kuralıydı.",
      "Kural şöyle çalışıyordu: bir paylaşımı ancak (a) aynı şehirdekiler, (b) aynı ülkedekiler, ya da (c) paylaşım çok etkileşim aldıysa herkes görebiliyordu. Üçüncü şartın eşiği 10 beğeni / 5 yorum / 10 paylaşımdı. Aktif kullanıcı sayısı bir elin parmakları kadarken bu eşiğe ulaşmak imkânsız. Sonuç: Türkiye'deki üye ile Katar'daki üye birbirinin paylaşımını HİÇ göremiyordu.",
      "Ölçüldü: iki test hesabından biri 20 paylaşımın 12'sini, diğeri 7'sini görüyordu ve ikisi de birbirinin o günkü paylaşımlarını göremiyordu. Kaçış yolları da kapalıydı — ikinci bir ülkeyi hedeflemek ücretli özelliğe bağlı, Köprü paylaşımı arayüzden hiç açılmıyor, Türkiye'de yaşayan üye zaten yurt dışını hedefleyemiyor.",
      "YAPILAN: üç eşik de sıfıra çekildi ve canlıya uygulandı. Sonuç aynı iki hesapla tekrar ölçüldü — 12/20 ve 7/20 iken artık İKİSİ DE 20/20. Türkiye'deki üye Katar'daki üyenin paylaşımını görüyor.",
      "SIRALAMA BOZULMADI, sadece filtre kalktı: akış hâlâ önce kendi şehrini, sonra kendi ülkeni, sonra diğerlerini gösteriyor. Yani yerellik duruyor; değişen tek şey, yerelde içerik bittiğinde akışın boş kalmaması.",
      "Bu değişiklik bir yan hasara yol açtı ve aynı gün düzeltildi: Cadde'nin sağındaki 'Akışın nasıl şekilleniyor?' kartı eşikleri canlıdan okuduğu için 'Yerelin dışına çıkmak için: 0 beğeni · 0 yorum · 0 paylaşım' gibi anlamsız bir cümle yazmaya başlamıştı. Ayrıca kartın 'paylaşımın kaç kişiye ulaşır' sayısı da eksik kalıyordu — kart 90 kişi derken paylaşım aslında 158 üyenin hepsine ulaşıyordu. İkisi de düzeltildi; kart artık iki durumu da doğru anlatıyor ve konum satırlarının artık görünürlüğü değil sıralamayı etkilediğini söylüyor.",
      "Geri alınabilir: eski eşikler (10/5/10) uygulanan dosyanın içinde yorum olarak duruyor, tek komutla dönülür. Dosya: docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql",
      "Durum: eşik değişikliği ZATEN CANLIDA (sunucu tarafında bir ayar, yayın gerektirmedi). Kartın düzeltmesi yayın bekliyor. Yayın sonrası bakılacak: Cadde'yi aç, başka ülkedeki paylaşımların akışta göründüğünü ama kendi şehrindekilerin üstte kaldığını gözle doğrula.",
    ],
  },
  {
    id: "20260810-araclar-sayfasi-ust-bandi-acik-renk",
    date: "10 Ağustos 2026",
    title: "Araçlar sayfasının üst bandı açık renge çevrildi",
    items: [
      "/tools sayfasının en üstündeki koyu lacivert 'uzay' bandı açık renge çevrildi: açık lila, soluk turkuaz ve hafif şeftali tonlarında yumuşak bir geçiş, koyu başlık, beyaz arama kutusu.",
      "Marka renkleri DEĞİŞMEDİ — koyu bantta kullanılan üç renk ailesinin aynısı kullanıldı, sadece açık tonda. Yani sayfa aydınlandı ama kimliği aynı kaldı.",
      "Araçların kendi sayfaları (18 aracın giriş bandı) BİLİNÇLİ OLARAK KOYU BIRAKILDI — senin kararın. Bu ikisi eskiden aynı yüzeyi paylaşıyordu; artık ayrılar. Yayın sonrası araçlar sayfasından bir araca girerken bu açık→koyu geçişine bir bakmakta fayda var, rahatsız edici gelirse araç sayfaları da açığa çevrilebilir.",
      "Değişiklik tarayıcıda gerçekten çizdirilip kontrol edildi: hem geniş ekranda hem telefon boyutunda görüntü alındı, yazı okunaklığı ve arama kutusunun yerleşimi doğrulandı.",
      "Durum: yayın bekliyor.",
    ],
  },
  {
    id: "20260807-cadde-akis-kurali-uyeye-anlatiliyor",
    date: "7 Ağustos 2026",
    title:
      "Cadde'ye 'Akışın nasıl şekilleniyor?' kartı eklendi — üye, paylaşımının kaç kişiye ulaştığını ilk kez görüyor",
    items: [
      "Cadde'nin akış kuralı üyeye HİÇBİR YERDE anlatılmıyordu. Üye, başka ülkedeki bir paylaşımı neden görmediğini ya da kendi paylaşımının neden yayılmadığını bilmiyordu; 'sistem bozuk' algısı buradan doğuyordu.",
      "Ölçüldü (158 hesap üzerinden): Antalya/Türkiye hedefli, henüz etkileşim almamış bir paylaşımı aynı şehirden 3, aynı ülkeden 41, konumu tanımsız olduğu için her şeyi gören 46 kişi görebiliyordu — yani 68 üye GÖREMİYORDU. Üyelerin %43'ü. Bu bir arıza değil, kuralın kendisiydi; sadece görünmezdi.",
      "Sağ kolona bir kart geldi: kendi konumun, paylaşımının kaç üyeye ulaşabileceği, bunun toplam üyeye oranı ve bu sayının nereden geldiği (aynı şehir / aynı ülke / konumu tanımsız üyeler) tek tek yazılı.",
      "Kart POTANSİYEL erişimi gösterir — 'kaç kişinin akışına girebilir' demektir, kaç kişinin okuduğu DEĞİL. Etiketler bunu açıkça söylüyor, aksi halde okunma sayısı sanılırdı.",
      "Konumu Cadde kataloğunda tanımlı olmayan üyeye ayrı bir uyarı çıkıyor: profilinde ne yazdığını gösteriyor ve profil sayfasına bağlantı veriyor.",
      "Durum: yayın bekliyor. NOT: 10 Ağustos'ta akıştaki ülke sınırı kaldırıldığı için kartın anlattığı kısıt artık geçerli değil — kart o gün güncellendi ve şimdi iki durumu da doğru anlatıyor.",
    ],
  },
  {
    id: "20260807-arac-sonuclarina-aciklama-ve-donus-butonu",
    date: "7 Ağustos 2026",
    title:
      "Araç sonuç ekranları açıklandı: hesaplanıp hiç gösterilmeyen 'en zayıf 3 alan' ortaya çıkarıldı, 18 araca dönüş butonu eklendi",
    items: [
      "Taşınma Hazırlık Skoru'nun sonuç ekranı çıplak sayıdan ibaretti: bir puan, altında altı çubuk ve iki genel cümle. Hangi başlığın ne ölçtüğü, iyi mi kötü mü olduğu, hangisini düzeltmenin puanı en çok oynatacağı hiçbir yerde yazmıyordu.",
      "EN BÜYÜK BULGU BEDAVA ÇIKTI: sistem, üyenin en zayıf 3 alanını Haziran'dan beri zaten hesaplıyor ve kaydediyordu — ama ekranda HİÇ GÖSTERİLMİYORDU. Veri üretiliyor, kaydediliyor ve çöpe atılıyordu. Artık 'Önce Buraya Odaklan' kartı olarak görünüyor. Aynı durum İş Bulma Olasılığı aracında da vardı, o da kendiliğinden kazandı.",
      "Veritabanının bu üç alan için ürettiği cümle şablondu ve bilgi taşımıyordu ('Bu alanı bu hafta güçlendir: Finansal Hazırlık'). Her başlık için gerçek bir ilk adım yazıldı — örneğin finans için 'en az 3 aylık yaşam gideri kadar ayrı bir tampon hesap aç ve taşınma tarihine kadar ona dokunma'.",
      "Puan dağılımındaki her çubuğun altına üç bilgi geldi: o başlığın ne ölçtüğü, toplam puandaki ağırlığı ('skorun %25'i' — hangisini düzeltmenin en çok işe yarayacağını gösterir) ve durumu (Güçlü / İyi / Orta / Zayıf). Ayrıca sonuç bandının ne anlama geldiği tek cümleyle yazılıyor.",
      "AYRI BİR KUSUR: sonuç ekranından araç listesine dönmenin hiçbir yolu yoktu. Tüm araçlara tam genişlikte 'Araçlar Sayfasına Dön' butonu eklendi. İlk denemede bu buton 18 aracın yalnız 12'sine ulaşmıştı — 6 araç (5 Almanya aracı + Nesil Bulucu) farklı bir şekilde çizildiği için kapsam dışı kalmıştı; ölçülüp düzeltildi ve artık hepsinde var.",
      "Açıklama altyapısı 18 aracı destekliyor ama metinler şimdilik yalnız Taşınma Hazırlık Skoru için yazıldı. Metni olmayan araçta ilgili bölüm hiç çizilmiyor, ekran bozulmuyor.",
      "Durum: yayın bekliyor.",
    ],
  },
  {
    id: "20260807-araclar-sayfasi-dizin-kurgusu",
    date: "7 Ağustos 2026",
    title: "Araçlar sayfası dizine dönüştü: arama kutusu ve kategori filtreleri geldi",
    items: [
      "18 araç olunca sayfada birincil ihtiyaç gezinmek değil ARAMAK oldu. Üst banda arama kutusu kondu; ülke, maaş, vize, şehir gibi kelimelerle arama yapılıyor.",
      "Arama kutusunun altına kategori filtreleri geldi: Tümü (18) · Taşınma (10) · Almanya (7) · Nesil (1). Bu sekmeler elle yazılmıyor, gelen araç listesinden üretiliyor — yeni bir kategori eklenirse sekme kendiliğinden çıkar, araç kaybolmaz.",
      "Mobildeki akordeon kart düzeni kaldırıldı, yerine her ekranda aynı çalışan kart ızgarası geldi.",
      "Sayfa yüklenirken artık boşluk yerine kart iskeletleri görünüyor; iskeletlerin ölçüsü gerçek kartla birebir aynı olduğu için veri gelince sayfa zıplamıyor.",
      "'Tamamen ücretsiz' bilgisi kart başına tekrarlanmaktan çıkarılıp üst banda tek bir rozete indirildi.",
      "Durum: yayın bekliyor.",
    ],
  },
  {
    id: "20260806-komuta-merkezi-veri-yazilmamis",
    date: "6 Ağustos 2026",
    title:
      "'Komuta merkezine son 5 günün işi yansımamış' şikâyeti araştırıldı — sorun gösterimde değil, veri hiç yazılmamış",
    items: [
      "Şikâyet: /admin/workspace/command-center tablolarında son günlerin eklemeleri görünmüyor; uygulanmamış veritabanı güncellemeleri olabilir mi?",
      "Dört olası sebep tek tek ölçülerek elendi — bunlar bir daha araştırılmasın: (1) uygulanmamış veritabanı güncellemesi YOK, (2) yayın bekleyen kod YOK (canlı dosyanın yayın saati kontrol edildi), (3) yazma izni engellemiyor, (4) sayfa veriyi eksik çekmiyor.",
      "KÖK NEDEN: tabloya 4 Ağustos 08:00'den beri TEK SATIR yazılmamış. Ne yeni madde eklenmiş ne bir durum değiştirilmiş. Yani menülerde ya da ekranda bir kusur yok, eksik olan verinin kendisi.",
      "Panoda gözle görünen en yeni başlığın '2 Ağustos' olmasının ayrı bir sebebi var: 4 Ağustos'ta eklenen 11 satır eski bir tarih etiketi taşıyor, pano bu etikete göre grupladığı için yeni bir başlık oluşturmuyorlar. 'Yansımamış' hissi buradan geliyor.",
      "İKİNCİ KUSUR: toplantı notu ekleme listesi 19 Haziran'da (Toplantı 16) donmuş. Sebep, listenin koda elle yazılmış sabit bir dizi olması — yeni toplantı ancak kod değişikliğiyle eklenebiliyor. Bu, girişi engelliyor; gizlemiyor.",
      "GÜVENLİK NOTU: komuta merkezi tablosunun yazma izni sonuna kadar açık — giriş yapmamış ziyaretçi rolü de dahil herkes yazabiliyor durumda. Ayrıca ele alınmalı.",
      "Durum: bu bir teşhis çalışmasıydı, kod değişikliği yapılmadı. SENDE olan: panoya madde girilecekse elle girilmesi, toplantı listesinin açılması ise ayrı bir iş olarak planlanması.",
    ],
  },
  {
    id: "20260806-uye-konumlari-katalog-yazimina-cekildi",
    date: "6 Ağustos 2026",
    title: "Üye profillerindeki eski serbest metin konumlar katalog yazımına çekildi (13 üye)",
    items: [
      "Profil formu artık seçim listesi ama serbest metin döneminden kalan değerler katalogla uyuşmuyordu: 'türkiye', 'istanbul', 'DOha', 'new york' gibi. Bu kayıtlar dropdown'da seçili görünmüyordu.",
      "13 üyenin 25 kaydı düzeltildi. Asıl kırılan alanın şehir değil ÜLKE olduğu ölçüldü: ülke doğru yazıldığında şehir zaten kendiliğinden eşleşiyor, ülke bozuk olduğunda şehir de çözülemiyor. İkisi birlikte düzeltildi.",
      "Sonuç: dropdown ile birebir eşleşen üye sayısı ülkede 98'den 111'e, şehirde 98'den 110'a çıktı.",
      "DÜRÜST OLMAK GEREKİRSE Cadde erişiminde bir değişiklik OLMADI — bu ayrıca ölçüldü. Bu 13 üye Cadde tarafında zaten görülebiliyordu, çünkü Cadde eşleştirmesi büyük/küçük harf ve aksan farkına duyarsız. Kazanç veri tutarlılığında ve formun doğru görünmesinde, erişimde değil.",
      "Ayrıca Cadde şehir kataloğundaki iki eksik şehir eklendi ve katalog köprüsü 55/55 tamamlandı.",
      "Bilinçli olarak dokunulmayanlar: 'Belirtilmedi' gibi eski kayıt sistemi kalıntıları ve tek bir 'Kişinev' kaydı — sonuncusu düzeltilseydi profil formu düzelirdi ama Cadde eşleşmesi kırılırdı.",
      "Durum: canlıya uygulandı, yayın gerektirmedi.",
    ],
  },
  {
    id: "20260805-bes-oturumun-kalani-tek-listede",
    date: "5 Ağustos 2026",
    title:
      "Beş oturumun 'kalan işler' listeleri tek listede toplandı — en büyük madde zaten yapılmış çıktı",
    items: [
      "Son iki günün beş ayrı çalışma oturumu, her biri kendi sonunda bir 'kalan işler' listesi bırakmıştı. Listeler birbirini tekrar ediyor ve bir kısmı artık geçersizdi, çünkü oturumlar kısmen paralel çalıştı ve birbirinin işini devraldı. Hepsi tek listeye indirildi ve her madde canlı sisteme sorularak açık mı kapalı mı diye kontrol edildi.",
      "EN ÖNEMLİ BULGU: beş oturumun BEŞİ DE 'Coolify deploy bekliyor' diyordu — deploy aslında yapılmış. Canlı siteden ölçüldü: Cadde sayfasının canlıdaki dosyasında dünkü yeni kart düzeni var, eskisi yok; sayfanın yayın saati 13:12, son kod değişikliği 13:11. Yani günlerin işi canlıda. Bu madde bütün listelerden düşüyor; boşuna deploy beklenmesin.",
      "HÂLÂ AÇIK OLAN: iki veritabanı komutu çalıştırılmayı bekliyor. Birincisi 6 üyenin akışının boş kalmasını gideriyor (4 ülke hiçbir tanıtım paylaşımı tarafından hedeflenmiyor) ve bir migration'ın sürüm kaydını yazıyor. İkincisi şehir kataloğundaki yazım/eşleşme bozukluklarını temizliyor. İkisi de Yapılacaklar listesine ayrı ayrı eklendi.",
      "Şehir temizliği komutu 4 Ağustos'ta yazılmıştı ve BAYATLAMIŞTI: dün yapılan veri onarımı katalogda eksik ülkeleri eklerken İtalya'yı ve ona bağlı doğru bir 'Roma' kaydını da eklemiş, yani şu an iki 'Roma' var. Eski komut çalıştırılsaydı ikinci bir kopya üretecek ve şehir eşleştirmesini belirsiz hâle getirecekti. Komut, taşıma yerine mükerrer kaydı silecek şekilde yeniden yazıldı; silmeden önce o kayda bağlı veri olup olmadığını sayıyor ve varsa duruyor.",
      "Panelde yanlış bilgi gösteren bir kayıt düzeltildi: Yapılacaklar listesindeki 'Cadde hedef eşleşmesi: düzeltme yazıldı, canlıya UYGULANMADI' maddesi artık doğru değildi — düzeltme dün uygulandı ve paylaşabilen üye sayısı 42'den 104'e çıktı. Madde, kalan gerçek işe göre yeniden yazıldı: profil formu hâlâ serbest metin olduğu için bozuk konum değerleri birikmeye devam ediyor.",
      "Workshop panosu için iki madde daha işaretlenmeye hazır (paylaşımın profildeki ülkenin akışında görünmesi ve 'Paylaşım gönderilemedi' hatası) — ikisinin de kanıtı canlıda doğrulandı. Üç madde daha var ama onlar yukarıdaki iki komut çalıştıktan sonra işaretlenecek; şimdi işaretlemek yapılmamış işi yapılmış göstermek olurdu.",
      "Durum: kod tarafı hazır ve ana koda alındı. SENDE olan: iki komutu çalıştırmak ve panoyu işaretlemek. Ayrıca deploy edilmiş olan yeni Cadde yerleşimi hiç göz kontrolünden geçmedi — masaüstünde bir bakmakta fayda var.",
    ],
  },
  {
    id: "20260805-workshop-panosu-isaretleme-bekliyor",
    date: "5 Ağustos 2026",
    title:
      "Cadde workshop panosunda 28 madde 'yapıldı' işareti bekliyor — işaretleme bu oturumda YAPILAMADI",
    items: [
      "Pano canlıda sayıldı: 4 Ağustos'ta bitirilip ana koda alınan işlerin hiçbiri panoda işaretli değil. WS2 bölümünün tamamı boş görünüyor — panoda son işaretleme 4 Ağustos'ta 4 madde (dünya saatleri) ile kalmış. Sebebi basit: hem dün hem bugün canlı veritabanına yazma izni bu ortamda engellendi, o yüzden kutular kod bitmiş olmasına rağmen hiç işaretlenemedi.",
      "İşaretlenmeyi bekleyen 28 madde tek tek eşleştirildi ve tek komutluk bir dosyaya yazıldı: docs/operations/2026-08-05-workshop-ubt-isaretleme.sql. Aynı işi panelden elle de yapabilirsin (/admin/workshop/cadde), dosya yalnızca 28 kutuyu tek seferde işaretlemek için.",
      "Kapsam: kafe içi yorum/görsel/bağlantı/emoji, emoji ve yükleme kusurları, gömülü görsel, kafe kartlarının kompakt hâli ve akordeon, kontrast artışı, akış öncelikli yerleşim, konum açıklaması, tek 'Yakında gelecek özellikler' alanı, Enter'ın satır atlaması, reklam alanı metinleri, CorteQS Çarşı adlandırması, kafe ikonu.",
      "İşaretlenmeyen maddeler bilinçli olarak dışarıda bırakıldı: 'paylaşım profildeki ülkenin akışında görünecek' maddesi bugünkü ölçümle ÇALIŞMADIĞI kanıtlandığı için (aşağıdaki kayda bak), şehir/ülke temizliği canlıya uygulanamadığı için, 'Paylaşım gönderilemedi' ise yalnız yarısı çözüldüğü için.",
      "BUGÜN YAPILAN İŞLERİN KENDİSİ HİÇBİR PANO MADDESİNİ KAPATMADI — bu dürüst tablo: bugünkü işlerin bir kısmı kök neden araştırması, bir kısmı da yazılıp canlıya uygulanamayan düzeltme. Panodaki eksiklik dünün işinden geliyor.",
      "Durum: SENDE — dosyayı çalıştırman ya da panelden 28 kutuyu işaretlemen gerekiyor. Hiçbir şey yapılmazsa 6 Ağustos toplantısına pano gerçekte olduğundan çok daha geride görünen bir tabloyla girilir.",
    ],
  },
  {
    id: "20260805-cadde-kor-izleyici-ulke-koprusu",
    date: "5 Ağustos 2026",
    title:
      "Akışın bazı üyelerde sessizce boş kalmasının sebebi bulundu: sitede iki ayrı ülke listesi var ve birbirini tanımıyor",
    items: [
      "Profil sayfasındaki ülke listesi ile Cadde'nin kendi ülke listesi iki ayrı kaynak: profil 251 ülkelik büyük listeden besleniyor, Cadde ise kendi 18 ülkelik listesine bakıyor. İki liste iki yerde ayrışıyor — 'İngiltere' ↔ 'Birleşik Krallık' ve 'ABD' ↔ 'Amerika Birleşik Devletleri'. Cadde eşleştirmeyi düpedüz metin karşılaştırarak yaptığı için, profilinde bu iki değerden birini seçmiş HERKES ülke düzeyinde kör kalıyordu: akış boş, hata mesajı yok.",
      "Bu bir veri hatası değil, yapı hatası — bugün bu değerleri seçen üyeler kadar gelecekte seçecek olanlar da aynı duruma düşecekti.",
      "Çözüm için yeni bir eşleştirme yazılmadı: iki liste arasındaki köprü zaten kuruluymuş ama hiç kullanılmıyormuş (18 ülkenin 18'i, 51 şehrin 50'si karşılıklı bağlı). Artık önce bugünkü isim eşleşmesi deneniyor, tutmazsa köprüden gidiliyor. Salt okunur denemede ülke çözümlemesi 88'den 95'e çıktı.",
      "Ayrıca bir emniyet supabı kondu: bir üyenin ne şehri ne ülkesi çözülemiyorsa artık boş ekran yerine içerik gösteriliyor. Akışın sıralama matematiğine dokunulmadı.",
      "ÖLÇÜM DÜZELTMESİ: bu turun başında 'çalışmayan 68 üye var' demiştim, fazla güçlüydü. Akış şehir eşleşmesini ülkeden bağımsız yaptığı için 19 üye şehri üzerinden zaten kurtuluyordu. Doğru sayı 49; bunların 30'u giriş yapmış ve zaten içeriği görüyor, sessiz boşluk yaşayan 19 hesabın hiçbiri bugüne kadar hiç giriş yapmamış.",
      "Durum: düzeltme yazıldı ve ana koda alındı ama CANLIYA UYGULANMADI — veritabanı değişikliği bu oturumda çalıştırılamadı. Uygulanana kadar kör kalma durumu devam ediyor.",
    ],
  },
  {
    id: "20260805-cadde-paylasim-gonderilemedi-kok-neden",
    date: "5 Ağustos 2026",
    title:
      "'Paylaşım gönderilemedi' hatasının gerçek sebebi bulundu: en kalabalık grup olan 38 üye Türkçe 'ü' harfi yüzünden hiç paylaşım yapamıyor",
    items: [
      "Önce hatanın neden hiç anlaşılamadığı çözüldü: sistemin 51 Türkçe hata mesajından oluşan haritası ÜRETİMDE HİÇ ÇALIŞMAMIŞ. Tek satırlık bir tip kontrolü yüzünden gelen hata metni her seferinde boş kabul ediliyordu, dolayısıyla kullanıcı hangi hata olursa olsun hep aynı genel cümleyi görüyordu: 'İşlem tamamlanamadı, lütfen tekrar dene.' Sunucu doğru sebebi söylüyordu, ekran onu yutuyordu.",
      "Testler bunu neden kaçırmış: hepsi hatayı gerçekte geldiğinden farklı biçimde kuruyordu. Önce düşen 3 test yazıldı, sonra düzeltildi. Artık kullanıcı 'Paylaşım hedefi geçersiz. Ülke ve şehir seçimini kontrol et.' gibi gerçek sebebi görüyor.",
      "Doğru mesaj görünür olunca asıl sebep ortaya çıktı: paylaşımın hangi ülkeye gideceği BİREBİR isim karşılaştırmasıyla bulunuyor. Profilinde 'Türkiye' yazan üye, tabloda kayıt 'Turkiye' (Türkçe karakterler olmadan) olduğu için eşleşmiyor ve paylaşımı reddediliyor.",
      "Canlıdan ölçüldü: en kalabalık grup olan 38 üyenin HİÇBİRİ paylaşım yapamıyor. İlk 25 değerde eşleşen 41 üyeye karşılık eşleşmeyen 72 üye var (Belirtilmedi, Qatar, küçük harfli 'turkiye', Deutschland, Abd, Tr, İngiltere...).",
      "Okuma tarafı 29 Temmuz'da büyük/küçük harf ve aksan farkına duyarsız hale getirilmiş, yazma tarafı atlanmış. Yani hata tek taraflı bir eksiklikten geliyor.",
      "SENİN KARARINLA DÜZELTME ERTELENDİ. Kaybolmaması için iki yere yazıldı: yönetici panelindeki açık işler listesine kritik madde olarak ve projenin kural dosyasına 'bunu keşfedip sessizce yeniden yazma' uyarısıyla. Düzeltilince ikisi birden kapatılacak.",
      "Durum: teşhis yarısı ana koda alındı (deploy sonrası geçerli), düzeltme yarısı açık iş olarak bekliyor. Not: veri temizliği tek başına yetmez — Qatar, Deutschland, Abd gibi değerler hiçbir listede yok.",
    ],
  },
  {
    id: "20260805-cadde-acilis-icerigi-hazir",
    date: "5 Ağustos 2026",
    title: "Cadde'nin açılış içeriği hazırlandı: uydurma kişiler yerine ekip hesabından soru soran içerik",
    items: [
      "'Seed'leri sil, gerçek kullanıcı gibi içerik ekleyemez misin' sorusuna teknik cevap 'evet' ama uydurma kişi kimliği üretmek denetimin zaten işaret ettiği güvenilirlik riskini büyütürdü: gerçek bir üye 'Ayşe K., Berlin'e cevap yazıp karşılık alamazsa zarar gören platformun kendisi olur.",
      "Seçilen yol: içerik gerçek bir ekip hesabından yayınlanıyor ve 'CorteQS Ekibi' rozetiyle işaretleniyor. Kimlik uydurulmuyor — cevap gelirse cevaplayacak gerçek biri var.",
      "İçeriğin ağırlığı bilinçli olarak SORU: akışın işi bilgi vermek değil konuşma başlatmak. 12 tane 'nasıl yapılır' yazısı sayfayı yardım merkezi gibi okutur, 9 iyi şehir sorusu topluluk gibi. Sorular ayrıca sıfır sorumluluk taşıyor — bürokrasi cevabını bilen üye yazar, ekip bilmediği mevzuatı biliyormuş gibi yazmaz.",
      "Toplam 3 yönlendirme paylaşımı (Cadde nedir, Cafe nedir, Köprü nedir — ekibin gerçekten bildiği şeyler) + 9 şehir bazlı açık soru.",
      "Çöp verinin silinmesi, uydurma örnek içeriğin kaldırılması ve yeni içeriğin eklenmesi TEK bir komut dosyasında birleştirildi — ayrı ayrı çalıştırılsaydı sıra hatası yeni içeriği de sildirebilirdi. Dosya hatada kendini geri sarıyor.",
      "Durum: içerik ve komut dosyası hazır, HENÜZ ÇALIŞTIRILMADI — canlı veritabanına yazma bu oturumda engellendi. Çalıştırılmadan Cadde'nin 'yeni açıldı' yüzeyi de ekranda görünmeyecek, çünkü akışta hâlâ 9 eski paylaşım duruyor.",
    ],
  },
  {
    id: "20260805-cadde-soguk-baslangic-ve-kararlilik",
    date: "5 Ağustos 2026",
    title: "Cadde boşken 'bozuk' değil 'davet' gibi okunacak şekilde yeniden düzenlendi; testlerdeki hayalet hata da çözüldü",
    items: [
      "Sayfa içerik yokken sol kolonda üç ayar kutusu gösteriyordu — filtrelenecek bir şey yokken filtre. Artık içerik yokken ülke/şehir bölümü ve kafe listesi kapalı açılıyor; 'Caddeye Çık' ve '+ Cafe Aç' butonları görünür kalıyor. Kullanıcı bir kez açıp kapatırsa kararı kalıcı kazanıyor.",
      "Yan taraftaki tekrar temizlendi: sayfa boşken sağ kolon üst üste ÜÇ ayrı yokluk okutuyordu ('Çarşı yakında', 'yakında gelecek özellikler', 'bu tanıtım alanı boş'). Tanıtım şeridi içerik yokken hiç çizilmiyor artık — hemen altındaki koyu davet kartı aynı şeyi çalışan bir butonla söylüyor.",
      "Telefonda sağ kolonun tamamı tek bir başlığın arkasına katlanıyor, böylece akış daha yukarıda başlıyor.",
      "Sayfa açılırken yapılan 8 sorgunun tamamına tazelik penceresi kondu: sekmeler arası geçişte veriler gereksiz yere baştan çekilmiyor. Bir de sözleşme testi eklendi — bundan sonra penceresi olmayan yeni bir sorgu eklenirse test düşüyor.",
      "Üye rehberi sayfasında gerçek bir kusur bulundu: sayım cevabı gelmeden sayfadan çıkan kullanıcı için sistem artık var olmayan ekrana yazmaya çalışıyordu. Bu aynı zamanda test paketinde aylardır görünen açıklanamayan hatanın da kaynağıydı. 209 dosya / 1495 test yeşil, hayalet hata sıfır.",
      "DÜRÜST NOT: bu düzenlemeler canlıda HENÜZ GÖRÜNMEYECEK. 'Sayfa boş' durumu ancak akışta gerçekten hiç paylaşım kalmayınca devreye giriyor; şu an 9 eski paylaşım duruyor. Yukarıdaki açılış içeriği komutu çalıştırılınca görünür hale gelecek.",
      "Durum: kod ana koda alındı, deploy sonrası geçerli.",
    ],
  },
  {
    id: "20260804-cadde-canli-denetim-soguk-baslangic",
    date: "4 Ağustos 2026",
    title:
      "Cadde'nin canlı denetimi yapıldı: akış fiilen boş çıktı — sayfa 'içerik bolluğu' varsayımından çıkarıldı",
    items: [
      "Canlı veritabanı sayıldı: Cadde'de toplam 24 paylaşım var, bunların 10'u klavye zıbırtısı ve arkasında yalnızca 2 gerçek kişi duruyor; gerçek bir kafe içeriği yok. Yani sayfa 'akış canlı' varsayımıyla tasarlanmıştı ama gerçekte aylarca düşük içerikle yaşayacak. Bu ölçüm işin teşhisini değiştirdi — başlangıçta bir tasarım isteğiydi.",
      "Bu tabloda görünmez kalan gerçek bir kusur ortaya çıktı: akış yüklenirken bir hata olursa (yetki reddi, sunucu hatası, ağ sorunu) ekranda 'Bu akış henüz sessiz.' yazıyordu — yani gerçek arıza ile boş akış birbirinden ayırt edilemiyordu. Artık hata ayrı bir kart olarak görünüyor ve 'Tekrar dene' butonu var.",
      "Tek bir emoji tepkisi vermek yüklü tüm akışı baştan çektiriyordu. Artık sayaç anında dönüyor; hata olursa eski hâline geri alınıyor.",
      "Boş akış kartı üç paragraf metin anlatıyordu ama tıklanacak hiçbir şey yoktu — kullanıcıya ne yapabileceğini ANLATIP yapmasını zorlaştırıyordu. Artık birincil buton her zaman paylaşıma götürüyor; ikincil buton akışın neden boş olduğuna göre değişiyor (filtre daraltıyorsa filtreyi temizler, daraltmıyorsa köprü modunu açar).",
      "Sağ kolonda hiç tanıtım kaydı yokken üç ayrı boş kart aynı çağrıyı üç kez tekrarlıyordu; içerik sıfırken kolon 'reklam için reklam' yığınına dönüyordu. Tek davet kartına indi (kolon 7 karttan 5'e, aynı hedefe giden bağlantı 3'ten 1'e). Gerçek bir tanıtım kaydı olduğu anda ayrı kartlar geri geliyor.",
      "Kafe listesi sınırsız çekiliyordu — veritabanı bu tür sorguları 1000 satırda sessizce kestiği için açık bir tavan konuldu.",
      "Kalan iş 10 küçük parçaya bölünüp yazıldı. İki karar sende: Cadde'deki çöp verinin (klavye zıbırtısı paylaşımlar) silinip silinmeyeceği ve akışa örnek içerik konulup konulmayacağı — ikisi de birkaç parçayı bekletiyor.",
      "Durum: kod ana koda alındı, deploy sonrası görünür. Canlı veritabanında bu turda hiçbir şey silinmedi veya eklenmedi.",
    ],
  },
  {
    id: "20260804-cadde-yazma-hatasi-teshisi",
    date: "4 Ağustos 2026",
    title:
      "'Paylaşım gönderilemedi' hatası neden bir türlü çözülemiyordu: sistem kendi hatasını hiçbir yere yazmıyormuş",
    items: [
      "Workshop'ta bildirilen 'paylaşım gönderilemedi' maddesi araştırıldı ve yapısal bir boşluk bulundu: Cadde'nin veri OKUMA yollarının tamamı hata kaydı tutuyordu, YAZMA yollarının 17'si ise tamamen çıplaktı. Bir paylaşım gönderilirken hata olduğunda ham hata hiçbir yere yazılmadan yok oluyordu — yani bu arıza tasarım gereği teşhis edilemez durumdaydı.",
      "17 yazma yolunun hepsi (paylaşım, yorum, tepki, kafe kurma/katılma, Çarşı ilanı, şikâyet, tanıtım kampanyası…) ortak bir sarmalayıcıya geçti; ham hata artık tarayıcı konsoluna [cadde_write_error] etiketiyle düşüyor. Boşluk elle takip edildiği için açılmıştı, artık bir test kilitliyor.",
      "Ayrıca sunucudaki 51 Cadde hata kodundan ikisinin Türkçe karşılığı hiç yazılmamış çıktı — o iki durumda kullanıcı Türkçe mesaj yerine ham hata kodunu görüyordu. İkisi de eklendi; bundan sonra haritaya yazılmayan yeni bir kod testi düşürüyor.",
      "DÜRÜST NOT: bu madde KAPANMADI. Paylaşım gönderme yolundaki tüm hata kodları zaten yerindeydi, yani bildirilen hata o iki eksik koddan gelmiyor. Değişiklik hatayı çözmüyor, bir sonraki oluşumunu yakalanabilir kılıyor — deploy sonrası tekrar ederse tarayıcı konsolundaki [cadde_write_error] satırını iste.",
      "Durum: kod ana koda alındı, deploy sonrası geçerli.",
    ],
  },
  {
    id: "20260804-cadde-sehir-listesi-temizligi",
    date: "4 Ağustos 2026",
    title:
      "Cadde'nin şehir listesinde 9 küçük harfli şehir ve yanlış ülkeye bağlı 2 şehir bulundu — düzeltme yazıldı ama UYGULANAMADI",
    items: [
      "Cadde'nin kendi şehir/ülke listesi canlıda sayıldı: 51 şehir, 18 ülke. İçinde 9 şehir küçük harfle başlıyor, 1'i tamamen büyük harf yazılmış; ayrıca Roma ve Vancouver yanlışlıkla ABD'ye bağlanmış görünüyor.",
      "Düzeltmede toplu bir 'baş harfi büyüt' fonksiyonu KULLANILMADI — o fonksiyon Türkçe'de yanlış sonuç veriyor (noktalı/noktasız i sorunu, örneğin 'izmir' kaydını bozuyor). Her satır tek tek elle yazıldı.",
      "Ülke adlarına bilinçli olarak dokunulmadı: canlıda 'Turkiye', 'Birlesik Krallik' gibi Türkçe karakterleri eksik yazımlar duruyor, ama Cadde filtreleri ülkeyi adıyla taşıdığı için düzeltmek paylaşılmış bağlantıları kırabilir — ayrı bir karar gerektiriyor.",
      "Durum: dosya yazıldı ama CANLIYA UYGULANMADI — bu oturumda canlı veritabanına yazma izin katmanı tarafından engellendi. Bekleyen bir iş olarak duruyor; uygulanmadan 'uygulandı' klasörüne taşınmamalı.",
    ],
  },
  {
    id: "20260804-cadde-kafe-sosyal-katman",
    date: "4 Ağustos 2026",
    title: "Kafelerin içi gerçek bir sosyal alan oldu: yorum, fotoğraf, bağlantı ve emoji geldi",
    items: [
      "Kafe içindeki paylaşım kutusu düz bir metin kutusuydu. Artık ana akışla birebir aynı kutu: görsel/video yükleme, emoji seçici ve etiketleme kafede de çalışıyor — aynı gün yapılan yükleme düzeltmeleri de kafeye kendiliğinden taşındı. Konum çipi kafede çizilmiyor, çünkü kafe paylaşımı zaten o odaya gidiyor.",
      "Kafe paylaşımlarında yorum SAYISI gösteriliyordu ama yorumları okuyacak ya da yazacak bir yer yoktu. Artık panel açılıyor: sayfalı yorum listesi, 'Devamını yükle' ve emoji destekli yorum kutusu var. Panel kapalıyken veritabanına hiç gidilmiyor; üye olmayan yalnızca okuyabiliyor.",
      "Bağlantılar Cadde'nin HİÇBİR yüzeyinde tıklanabilir değildi — hem kafede hem ana akışta düz metin olarak duruyordu. Artık http/https adresleri otomatik bağlantıya dönüşüyor (yalnız bu ikisi eşleşiyor, zararlı adres biçimleri değil; dış bağlantılar yeni sekmede açılıyor).",
      "Bilinçli bırakılan iki şey koda açıkça not düşüldü ki ileride 'eksik kalmış' diye bozulmasın: kafedeki yorum paneli ile ana akıştaki panel ayrı duruyor (kafe içi ileride sohbet benzeri bir akışa dönecek, şimdi birleştirmek birkaç hafta sonra sökmek olurdu) ve kafede otomatik yorum yenileme yok (workshop'ta performans değerlendirmesine kadar park edildi).",
      "Durum: kod ana koda alındı, deploy sonrası görünür.",
    ],
  },
  {
    id: "20260804-cadde-medya-emoji-kusurlari",
    date: "4 Ağustos 2026",
    title: "Paylaşım kutusunda üç gerçek kusur bulundu — biri yazdığın metni sessizce siliyordu",
    items: [
      "VERİ KAYBI: fotoğraf/video yüklenirken yazmaya devam edersen, yükleme bitince sistem metni yüklemeye başladığın andaki hâline geri yazıyordu — arada yazdığın her şey uyarısız siliniyordu. Düzeltildi; düzeltme geri alınınca düşen bir test de yazıldı.",
      "'DONMA' şikâyeti: yükleme sırasında Fotoğraf/Video/emoji butonları ve Paylaş butonu pasifleşiyordu ama bunu açıklayan hiçbir gösterge yoktu — kullanıcı bunu donma olarak bildiriyordu. Artık 'Yükleniyor…' göstergesi var.",
      "EMOJİ BOZULMASI: emoji eklerken imlecin yeri hesaplanırken emojiler ortadan ikiye bölünebiliyor ve karakter geri dönüşü olmadan bozuluyordu. Hesaplama emoji sınırına çekildi.",
      "Tek fotoğraflı paylaşımlarda dikey fotoğraflar ince bir şeride kırpılıyordu — 'ek dosya gibi duruyor' şikâyetinin kaynağı buydu. Artık kendi oranında, yükseklik sınırıyla çiziliyor; birden fazla fotoğrafta hücreler eşit kalsın diye ızgara düzeni korundu.",
      "Durum: kod ana koda alındı, deploy sonrası geçerli. Üç kusur da kodda kanıtlandı, ikisi için önce düşen test yazıldı.",
    ],
  },
  {
    id: "20260804-cadde-ws2-yerlesim-ve-metinler",
    date: "4 Ağustos 2026",
    title:
      "Cadde'de 4 Ağustos workshop maddelerinin ilk turu: kafeler bölümü katlandı, çalışmayan butonlar tek yere toplandı, kontrast arttı, üst şerit sadeleşti",
    items: [
      "Kafeler bölümü artık açılıp kapanabiliyor ve her kafe kart yerine tek satırlık kompakt bir satır — satır yüksekliği yaklaşık üçte birine indi. Açıkken ilk 3 kafe çiziliyor, gerisi 'N cafe daha göster' ile geliyor. Varsayılan AÇIK: madde kapanabilirlik istedi, gizlenme değil.",
      "Çalışmayan özellikler kendi yüzeylerinde 'pasif buton' olarak durmayı bıraktı: filtre şeridindeki devre dışı 'Yakınımda' çipi kalktı, yerine sağ kolonda tek bir 'Yakında gelecek özellikler' kartı geldi. Akış filtresindeki 'Etkinlikler' çipi de kaldırıldı — paylaşım kutusunda etkinlik tipi üretilemediği için süzülecek bir şey kalmamıştı. İkisinde de veri tarafına dokunulmadı, eski bağlantılar çökmüyor.",
      "Paylaşım kutusundaki konum panelinin ne işe yaradığı yazıldı: kullanıcılar bunu 'nerede yaşıyorum' sanıyordu, oysa paylaşımın hangi ülke ve şehir akışına düşeceğini belirliyor.",
      "Yerleşim düzeldi: orta kolon artık yalnız paylaşım kutusu + akış (oradaki başlık kartı üst şeridin birebir kopyasıydı, silindi), 'Aktif Cafeler' paneli sol kolona indi. 3 kolonlu düzen korundu — iki seçenek önizlemeyle sana soruldu, 3 kolon senin kararındı.",
      "Sayfanın genel kontrastı yaklaşık %10-15 arttı. Yeni renk EKLENMEDİ; zemin tonları koyulaştı, kart beyazı sabit kaldı, kartların üstündeki renkli şerit hafifçe geri çekildi ki sayfa daha kontrastlı olurken daha 'renkli' görünmesin.",
      "Üst şeritte bildirim zili sağ uca alındı ve büyütüldü; başlıktaki 'Global Akış' filtre rozeti kaldırıldı — aynı bilgi zaten sol kolondaki Konum kartında ve akış çip barında, başlıkta üçüncü kez tekrar ediyordu.",
      "Metin işleri: Çarşı her yüzeyde 'CorteQS Çarşı' oldu, boş kafe mesajı seçili şehri adıyla söylüyor ('Dortmund için henüz aktif bir cafe açılmadı'), 'Aktif Cafeler' başlığına kafenin ne olduğunu anlatan bir balon eklendi, tanıtım alanı metinleri canlı akışla aynı dile getirildi.",
      "Yorum kutusunda Enter artık satır atlıyor; yayınlamanın tek yolu Gönder butonu. Bu, daha önce yayına alınmış 'Enter gönderir' davranışının bilinçli olarak geri alınmasıdır — 4 Ağustos workshop kararı, koda da not düşüldü.",
      "Durum: kod ana koda alındı, deploy sonrası görünür.",
    ],
  },
  {
    id: "20260804-cadde-saat-seridi-kaldirildi",
    date: "4 Ağustos 2026",
    title:
      "Cadde'deki dünya saatleri şeridi gün içinde üç tur iyileştirildi, sonra senin kararınla tamamen kaldırıldı",
    items: [
      "Şerit önce 3 kadrandan 5'e çıktı ve kadranlar büyütülüp sadeleştirildi: asıl okunabilirlik kazancı büyüklükten değil silinen detaydan geldi — ara çizgiler kadranı gri bir halkaya çevirip ibreleri yutuyordu.",
      "Sonra gerçek bir hata bulundu: kadran her zaman tarayıcının saat dilimini çiziyordu ama etiket profildeki şehirden geliyordu. Yani profilinde Antalya yazan ve Almanya'dan giren biri, Berlin saatini 'Antalya' etiketiyle görüyordu — saat sessizce yanlış söylüyordu. Etiket artık çizilen dilimle aynı kaynaktan geliyor; şehir tanınmıyorsa etiket hiç iddia edilmiyor.",
      "Üçüncü tur tarayıcıda gerçekten görülerek yapıldı (bileşen render edilip ekran görüntüsü alındı): beyaz kart üzerinde beyaz kadran neredeyse kayboluyordu. Kadran büyütüldü, saat rakamla da yazıldı, ince koyu bir kasa halkası ve tek aksan olarak pirinç merkez pimi geldi.",
      "Ardından senin kararınla şerit Cadde başlığından tamamen kaldırıldı ve bileşen dosyası silindi — ölü kod bırakmamak için. Geri istenirse git geçmişindeki son hâlinden alınacak, sıfırdan yazılmayacak.",
      "İlgili workshop maddeleri canlı panoda kapatıldı: 'analog saate çevrilecek', 'saat kartı büyütülecek' ve 'beş şehir gösterilecek' maddeleri yapıldı; 'saat kartı sağa taşınacak' maddesi ise taşınacak bir şey kalmadığı için kapatıldı — yapıldı anlamında değil, konusuz kaldığı için.",
      "Durum: kod ana koda alındı, deploy sonrası görünür. Workshop panosundaki işaretlemeler canlı veritabanında — panelde şimdiden görünüyor.",
    ],
  },
  {
    id: "20260804-arac-kartlari-ve-footer",
    date: "4 Ağustos 2026",
    title: "Araç kartlarında okunmayan beyaz başlık düzeltildi, footer bağlantıları geniş ekranda tek satıra indi",
    items: [
      "/tools sayfasındaki araç kartlarında başlık görselin ÜZERİNDE beyaz yazıyordu. Araç görselleri açık/pastel çizimler olduğu için beyaz yazı zemine karışıyordu ve üstteki karartma bunu kurtarmaya yetmiyordu. Başlık görselden çıkıp kartın içine, özetin üstüne alındı — kontrast artık görselden değil kart yüzeyinden geliyor.",
      "Altında yazı kalmayınca görselin alt kenarını lekeleyen ağır karartma katmanı da kaldırıldı (mobildeki açılır liste görünümünde de aynı gereksiz katman vardı, orada da kalktı). Kartların altındaki '6 soru · birkaç dakika' satırı kartın dibine sabitlendi; başlıklar farklı uzunlukta olduğu için yan yana kartlarda farklı hizada bitiyordu.",
      "Footer'daki 13 yasal/kurumsal bağlantı geniş ekranda alt satıra sarıyor ve 'Çerez Politikası' tek başına ikinci satıra düşüyordu. Geniş ekranda artık tek satır; dar ekranda 13 bağlantı yatay sığmadığı için sarma bilinçli olarak korundu — yoksa sayfa yana taşardı.",
      "Cadde üst kartındaki bildirim zili de bu turda yeri değişenlerden biriydi (gün sonunda sağ uca sabitlendi).",
      "Durum: kod ana koda alındı, deploy sonrası görünür. Araç kartı değişikliği gerçek görsellerle tarayıcıda ekran görüntüsü alınarak doğrulandı; footer değişikliği bu ortamda gerçek tarayıcıda görülmedi — deploy sonrası göz kontrolü öneriliyor.",
    ],
  },
  {
    id: "20260804-depo-duzeni-ve-migration-taban-cizgisi",
    date: "4 Ağustos 2026",
    title:
      "Depo düzeni: kök dizin temizlendi, veritabanı güncellemeleri taban çizgisine ayrıldı — 'uygulanmamış güncelleme var mı' artık elle kontrol edilmiyor",
    items: [
      "Depo kökünde duran dokümanlar docs/ altına taşındı; kökte artık yalnız iki dosya kalıyor (biri Claude Code'un okuduğu kural dosyası, biri GitHub giriş sayfası). Taşınmayanlar ve nedenleri de yazıldı — örneğin bir dosya taşınırsa sitenin derlemesi kırılıyor.",
      "Veritabanı güncelleme dosyaları ikiye ayrıldı: taban çizgisi öncesi 252 dosya arşive, sonrası 100 dosya çalışma klasörüne. Hiçbiri SİLİNMEDİ — bunlar veritabanını sıfırdan kurabilmenin (yeni ortam, yerel geliştirme, felaket kurtarma) ve yetki geçmişinin tek kaydı. Yanlarına canlı şemanın tam bir fotoğrafı kondu (237 tablo, 481 yetki kuralı, 342 indeks).",
      "Canlı veritabanı doğrulandı: UYGULANMAMIŞ GÜNCELLEME YOK — 350 sürümün hepsinin kaydı var. İlk karşılaştırma 4 sahte fark verdi; sebebi iki zaman damgasının ikişer dosya taşıması. Kontrol aracı bunu artık biliyor, her seferinde yanlış alarm üretmiyor.",
      "Bundan sonra bu kontrol tek komutla yapılıyor ve veritabanına bağlanamazsa bunu açıkça söylüyor — başarısız bir kontrol asla 'temiz' diye raporlanmıyor.",
      "Durum: yalnız depo düzeni ve kontrol aracı değişti; canlı veritabanına bu turda hiçbir şey uygulanmadı.",
    ],
  },
  {
    id: "20260804-nginx-guvenlik-seo-ve-kesinti",
    date: "4 Ağustos 2026",
    title:
      "Sitenin sunucu ayarları elden geçti: güvenlik başlıkları, yönlendirmeler ve SEO düzeltmeleri — arada kısa bir kesinti yaşandı",
    items: [
      "Yıllardır süren bir yanlış anlaşılma ortaya çıktı: proje dokümanları canlıdaki sunucuyu `server.mjs` diye tarif ediyordu, oysa canlıda nginx çalışıyor. Yani o dosyaya yazılmış eski adres yönlendirmeleri, www→ana adres kuralı ve sohbet servisinin hız sınırı canlıda hiç çalışmamış. Somut kanıt: /hakkimizda adresinin /founders'a yönlenmesi gerekirken doğrudan açılması.",
      "Güvenlik başlıkları (tarayıcıya 'bu sayfayı başka bir sitenin çerçevesine alma, sadece izin verilen kaynaklardan script çalıştır' diyen kurallar) /robots.txt gibi bazı adreslerde geliyordu ama sitenin ana adresinde hiç gelmiyordu — giriş ve yönetim sayfaları dahil tüm site bu korumasız haldeydi. Sebebi nginx'in bu başlıkları alt bloklara miras bırakmaması; artık gereken beş yerde de tekrarlanıyor.",
      "Eski adres yönlendirmeleri tek bir listeye toplandı. Bundan sonra bir yönlendirme eklenirken sunucu ayarı ile uygulama tarafı birbirinden ayrı düşerse, bunu yakalayan otomatik testler var — sessizce bozulmuyor.",
      "SEO tarafında: site haritası gerçek durumu yansıtacak şekilde düzeltildi (108 adres), bulunamayan sayfa artık arama motorlarına açıkça 'bunu dizine ekleme' diyor, ve hiçbir yerden bağlantı verilmeyen 5 ölü sayfa silindi (harita arama, şehir haberleri, post üretici ve 2 WhatsApp grup sayfası).",
      "⚠️ Kesinti: bu değişiklikler canlıya çıkınca corteqs.net tamamen açılmaz oldu, tarayıcı 'çok fazla yönlendirme' hatası verdi. Sebep şuydu: yeni eklenen www→ana adres yönlendirme bloğu nginx'te farkında olmadan 'varsayılan' blok konumuna geçti, ana adres de kendi kendine yönlenip sonsuz döngüye girdi. Tek satırlık bir düzeltmeyle çözüldü; aynı hatanın tekrarını yakalayan bir test de eklendi.",
      "Durum: hem asıl çalışma hem düzeltme ana koda alındı. Bu ortamda gerçek sunucu davranışı test edilemedi (test yalnız ayar dosyasının metnini denetliyor) — deploy sonrası ana adresin açıldığı, /hakkimizda gibi eski adreslerin doğru yere yönlendiği ve tarayıcı konsolunda hata çıkmadığı mutlaka gözle kontrol edilmeli.",
    ],
  },
  {
    id: "20260804-revizyon-istegi-anlik-mail",
    date: "4 Ağustos 2026",
    title: "Yeni bir revizyon isteği açıldığında ilgili yöneticilere anında e-posta gidiyor",
    items: [
      "Şimdiye kadar revizyon listesine yeni bir madde eklendiğinde kimsenin haberi olmuyordu; görmek için panele girip bakmak gerekiyordu. Artık istek açılır açılmaz e-posta gidiyor: kimin açtığı, hangi sayfa/alanla ilgili olduğu, önceliği ve açıklaması mailin içinde.",
      "Bildirim Ayarları sayfasına dördüncü bir anahtar eklendi — her yönetici bu bildirime kendi aboneliğini açıp kapatabiliyor. Üstteki zil menüsünde de görünüyor.",
      "Yeni bir altyapı kurulmadı: üye kaydı, başvuru ve anket bildirimlerinin kullandığı mevcut e-posta kuyruğuna dördüncü olay tipi olarak eklendi.",
      "Durum: canlıda ve anahtarı AÇIK. Gerçek bir kayıtla uçtan uca denendi (deneme kaydı sonradan geri alındı). Şu an abone olan iki yönetici hesabı var. Ayar sayfasının yeni hâli deploy sonrası görünür.",
    ],
  },
  {
    id: "20260804-komuta-merkezi-eksik-parti-ve-hiz",
    date: "4 Ağustos 2026",
    title:
      "Komuta Merkezi: görünmeyen 329 kayıtlık WhatsApp partisi ortaya çıktı, pano artık 10 kayıtla hızlı açılıyor",
    items: [
      "Panodaki WhatsApp kaynaklarının en yenisi 'WA 6 Temmuz' görünüyordu — sanki temmuz ortasından 2 Ağustos'a kadarki yazışmalar hiç işlenmemiş gibi. Veri aslında yerli yerindeydi: 2 Ağustos'ta aktarılan 329 kayıtlık parti panonun listelerine hiç girmiyordu.",
      "Sebebi şuymuş: pano, filtre listelerini ve kaynak kartını hazırlarken tüm tabloyu baştan okuyordu; veritabanı ise bu tür yanıtları 1000 satırda kesiyor. Sıralamada 1000. satırdan sonrasına düşen ne varsa (en yeni WhatsApp partisi dahil) sessizce kayboluyordu.",
      "Artık o üç ağır okuma yerine veritabanı tarafında hazırlanan tek bir özet okunuyor. Kaynak kartında 'WA 3 Ağustos (329)' göründü, 'WA 6 Temmuz' da kesik 371 yerine gerçek 411 kaydıyla listeleniyor; kategori ve tarih filtreleri arasında geçiş de artık ağ isteği beklemiyor.",
      "Kayıt listesi varsayılan olarak 10 kayıtla açılıyor — ilk açılış belirgin biçimde hafifledi. Daha uzun liste istersen sayfalama çubuğundaki 'Sayfa boyutu' seçicisinden 50 veya 100'e geçebilirsin; seçimin tarayıcında hatırlanıyor.",
      "Durum: veritabanı tarafı canlıda ve gerçek veriyle doğrulandı (özet 320 satır, 1477 kayıt). Panonun kendisindeki değişiklikler deploy sonrası görünür.",
    ],
  },
  {
    id: "20260804-komuta-merkezi-sisman-todo-bolme",
    date: "4 Ağustos 2026",
    title: "Komuta Merkezi'ndeki 3 'şişman' todo 11 ayrı işe bölündü",
    items: [
      "Listede tek satır gibi duran ama detayında 8-13 ayrı iş barındıran 3 kayıt vardı. Bu kayıtlar pratikte hiç 'tamamlandı' olamıyordu, çünkü içlerinden biri hep açık kalıyordu — ilerleme de görünmüyordu.",
      "Bu 3 kayıt 11 ayrı todoya bölündü. Eski kayıtlar silinmedi, arşive alındı; geçmişe bakmak isteyen bulabilir.",
      "Hedef bilinçli olarak 'her satırda tek madde' değil, 'her satırda tek İŞ' oldu. Yeni todoların 4'ü hâlâ birkaç alt madde taşıyor — örneğin 'FAQ dokümanını yaz' tek bir iştir, maddeleri o işin adımlarıdır. Bunlar tekrar bölünmeyecek.",
      "Küçük bir not: WhatsApp kaydından çıkan 5 todo, bölündüğü ana kaydın eski tarihini (19 Mayıs) devraldığı için gecikmiş görünüyor. Rahatsız ederse tarihleri tek hamlede boşaltılabilir.",
      "Durum: veritabanı tarafı canlıda ve doğrulandı — panelde şimdiden görünüyor, deploy beklemiyor.",
    ],
  },
  {
    id: "20260804-araclar-olcek-cevabi-ve-ulke-limiti",
    date: "4 Ağustos 2026",
    title: "Araçlarda sessizce boş kaydedilen cevap düzeltildi, ülke seçimi en fazla 3'e indi",
    items: [
      "1-5 arası ölçek sorularında ekranda ortadaki şık seçili görünüyordu, ama kullanıcı ona hiç dokunmadan 'İleri'ye basarsa cevap boş kaydediliyordu — yani ekranda gördüğü ile kaydedilen şey farklıydı, üstelik hiçbir uyarı çıkmıyordu. Artık ekranda görünen varsayılan gerçek cevap olarak kaydediliyor.",
      "Meslek/Maaş karşılaştırmasında hedef ülke seçimi en fazla 5 iken 3'e indirildi; çok geniş seçim hem sonucu yavaşlatıyor hem de karşılaştırmayı okunmaz hale getiriyordu. Yardım metinlerindeki sayı da artık elle yazılmıyor, tek bir yerden üretiliyor.",
      "Durum: ölçek düzeltmesi kod tarafında, deploy sonrası geçerli olur. Ülke limitini indiren veritabanı güncellemesi yazıldı ancak canlı veritabanına uygulandığı bu turda doğrulanmadı — deploy öncesi kontrol edilmeli.",
    ],
  },
  {
    id: "20260804-workshop-ikinci-toplanti",
    date: "4 Ağustos 2026",
    title:
      "Cadde workshop panosu artık iki toplantıyı birden taşıyor: 4 Ağustos'un 79 maddesi eklendi, tamamlananlar aşağı taşındı",
    items: [
      "Pano şimdiye kadar tek bir toplantının maddelerini tutuyordu. 4 Ağustos 2026'daki ikinci Cadde workshop toplantısının 79 maddesi 6 bölüm halinde eklendi; ilk toplantının 53 maddesi ve onayları olduğu gibi duruyor.",
      "Filtre çubuğunun başına 'Tüm workshoplar / WS1 / WS2' seçicisi geldi. Üstteki sayaçlar ve ilerleme çubuğu seçtiğin toplantıyı yansıtıyor; her maddede ve bölüm kartında hangi toplantıdan geldiğini gösteren küçük bir rozet var — aynı adı taşıyan bölümler artık iki toplantıdan karışıp tek kartta birleşmiyor.",
      "Madde numaraları toplantılar arasında devam ediyor (2. toplantı 54'ten 132'ye kadar), böylece 'madde 57' demek tek bir maddeyi işaret etmeye devam ediyor. Yeni madde eklerken form varsayılan olarak en son toplantıya yazıyor.",
      "İki onayı da almış maddeler artık üst kartları şişirmiyor: en altta, varsayılan olarak kapalı duran 'Tamamlananlar (N)' akordeonuna taşındılar — içinde onay kutuları, düzenleme ve silme aynen çalışıyor. Bölüm başlığındaki tamamlanan/toplam sayacı yine tüm maddeleri sayıyor.",
      "Üçüncü bir workshop için artık veritabanı değişikliği gerekmiyor; doğrudan panelden eklenebilir.",
      "Durum: maddeler canlı veritabanında, sayıları doğrulandı (79). Panonun yeni hâli deploy sonrası görünür.",
    ],
  },
  {
    id: "20260804-zgen-turkce",
    date: "4 Ağustos 2026",
    title: "Nesil Bulucu aracının içeriği tamamen Türkçeleşti",
    items: [
      "Araç Türkçe bir arayüzün içinde İngilizce içerik gösteriyordu. 7 kuşak adı, 70 tipik özellik, 35 'vibe' rozeti ve 42 uyum bloğu (210 'Yap', 210 'Yapma' ve 42 espri) Türkçeye çevrildi — birebir değil, esprili ton korunarak anlamı üzerinden.",
      "Kuşak adları artık 'X Kuşağı' gibi ekini içerdiği için profil kartındaki başlık tekrar üretmesin diye 'Sen ... kuşağındansın' yerine 'Senin kuşağın: ...' oldu.",
      "Durum: kod ana koda alındı, deploy sonrası görünür.",
    ],
  },
  {
    id: "20260803-zgen-nesil-bulucu-eklendi",
    date: "3 Ağustos 2026",
    title: "ZGEN Nesil Bulucu 18. araç olarak /tools'a katıldı",
    items: [
      "ZGEN Nesil Bulucu şimdiye kadar ayrı, kendi başına duran bir statik HTML/CSS/JS mini-uygulamaydı — sitenin diğer 17 aracıyla aynı görünüme sahip değildi. Artık React'e taşındı ve diğer araçlarla aynı bileşenleri (kart, akordiyon, rozet) ve marka renklerini kullanıyor — /tools hub'ında 18. kart olarak diğerleriyle birebir aynı görünüyor.",
      "Bir davranış değişti: eski standalone sayfa 'kayıt gerekmez' diye tanıtılıyordu, artık diğer 17 araçla aynı kurala uyup giriş yapılmasını istiyor. Bilinçli bir tutarlılık kararı.",
      "Durum: kod ana koda alındı. Giriş gerektiren bir sayfa olduğu için bu ortamda gerçek oturumla gözle doğrulanamadı; deploy sonrası kısa bir QA öneriliyor. Deploy'a kadar canlıda görünmez.",
    ],
  },
  {
    id: "20260803-araclar-uzay-banner",
    date: "3 Ağustos 2026",
    title: "Araç sayfalarının giriş bandı 'uzay havası'na büründü",
    items: [
      "İstek şuydu: 'araçlara girince uzay havası yaşat.' Bir aracı açtığında üstte gördüğün başlık bandı artık koyu bir uzay kabuğu: nebula tonlu gradyan zemin, yumuşak titreşen yıldız noktaları ve üç yüzen ikon (✨🪐⭐).",
      "Kapsam bilinçli dar tutuldu: yalnız aracı açtığında görünen üst tanıtım bandı değişti — soru adımları ve sonuç ekranı dokunulmadı, Almanya araçları (banka/sigorta/vize) bu bandı hiç kullanmıyor.",
      "Durum: kod ana koda alındı. Sayfa giriş gerektirdiği için bu ortamda gerçek tarayıcıda görsel doğrulama yapılamadı (izole bir HTML kopyasında görsel olarak kontrol edildi) — deploy sonrası kısa bir göz kontrolü öneriliyor.",
    ],
  },
  {
    id: "20260803-cadde-gorsel-ince-ayar",
    date: "3 Ağustos 2026",
    title: "Cadde'de 4 küçük görsel düzeltme: koyu bant açıldı, üst çubuk sadeleşti, kafe listesi tek kolon oldu",
    items: [
      "Cadde sayfasının üst kısmı ekran görüntüsünde koyu, hatta siyaha yakın bir bant gibi görünüyordu — bu ton açık/atmosferik bir tona çevrildi (gün doğumu hissi korunarak, hiçbir yerde koyu/siyah kalmadı).",
      "Rozet + açıklama + bildirim zilini taşıyan üst çubuk artık ayrı koyu bir bar değil, sayfadaki diğer kartlarla aynı beyaz kart yüzeyi ve tek satır — küçük ekranda ikinci satıra taşmıyor.",
      "Aktif Cafeler listesi çoklu sütun yerine tek kolon akıyor — dar sütunlarda kafe başlıkları yarıda kesiliyordu, artık tam genişlikte kesilmeden görünüyor.",
      "Konum, Diaspora Cadde ve Şehrinden Öne Çıkanlar başlıkları sayfadaki diğer kartlara göre oransız büyük kalmıştı, boyutları küçültüldü ve sitenin marka başlık fontu (Space Grotesk) Cadde'ye de eklendi. Kartlara logodan alınan renklerle ince bir üst şerit ve hafif derinlik/gölge efekti geldi.",
      "Durum: kod ana koda alındı. Bu oturumda tarayıcı/ekran görüntüsü aracı yoktu — değişiklikler dev sunucusunda HTTP/derleme/ESLint kontrolünden geçirildi ama gerçek görsel doğrulama yapılmadı; deploy sonrası göz kontrolü öneriliyor.",
    ],
  },
  {
    id: "20260802-meslek-maas-havuz-68",
    date: "2 Ağustos 2026",
    title: "Meslek/Maaş karşılaştırma havuzu 5 meslekten 68'e çıktı, liste artık veritabanından besleniyor",
    items: [
      "Canlı veritabanı bir süredir kod dışında 35 mesleğe çıkmıştı ama bunların yalnız orijinal 5'inin maaş karşılaştırma verisi vardı — listeden diğer 30 mesleği seçen kullanıcı sessizce 'veri bulunamadı' sonucu alıyordu.",
      "33 yeni meslek eklendi ve verisi eksik olan 63 mesleğin hepsine (8 ülke için) maaş karşılaştırma verisi işlendi. Meslek seçim listesi artık kod içine gömülü sabit bir dizi değil, doğrudan veritabanından geliyor — yeni meslek eklemek bundan sonra deploy gerektirmiyor.",
      "Ayrıca iki eski veritabanı güncellemesi (Çarşı görünürlük ayarı ve meslek/maaş soru metni güncellemesi) canlıya uygulanmış ama 'uygulandı' klasörüne taşınmamış çıktı — bu turda taşındı, yani önceki oturumda 'canlıya uygulanmamış olabilir' diye işaretlediğimiz kayıt artık kapandı.",
      "Dürüst not: yeni mesleklerin maaş rakamları küratörlü tahmin (orijinal 5 meslekle aynı yöntem, gerçek zamanlı bir maaş API'sinden değil) — veri kaynağı bağlandıkça rafine edilecek.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI, kod ana koda alındı, deploy bekliyor.",
    ],
  },
  {
    id: "20260802-araclar-hub-gorsel-yenileme",
    date: "2 Ağustos 2026",
    title:
      "/tools (Araçlar) sayfası görsel olarak yenilendi — 17 araç kartı artık birbirinden ayırt ediliyor",
    items: [
      "Sorun: /tools sayfasındaki 17 araç kartının hepsi birbirinin aynısıydı — tek fark eden şey her kartta tekrar eden aynı yeşil 'ÜCRETSİZ' rozetiydi. Sayfa ayrıca anasayfada zaten kullanılan marka görsel diline (aurora arka plan, gradyanlı başlıklar, glow efektleri) hiç sahip değildi, jenerik/sönük duruyordu.",
      "Üst başlık bölümüne anasayfadaki aurora/grid arka plan efekti ve teal→turuncu gradyanlı başlık eklendi. Her kart artık verdiği sonuç türüne göre (Skor, Sıralama, Persona, Görev Planı, Eşleşme, Karşılaştırma) logonun 6 renginden birini alan ikonlu bir rozet, kart çevresinde aynı renkte ince bir halka ve üstte renkli bir şerit taşıyor — kartlar artık tek bakışta birbirinden ayrılıyor. Kart görselinin üstüne karartma gradyanı ve başlık bindirildi; üzerine gelince kart hafifçe yükseliyor, görsel yakınlaşıyor ve ince bir parlama geçişi oluyor. Her kartın altına kaç soru sorduğu da eklendi ('6 soru · birkaç dakika').",
      "Mobildeki açılır-kapanır liste görünümü de aynı renk/ikon sistemine getirildi (sol kenarda renkli çizgi + aynı rozet).",
      "Durum: kod ana koda alındı ve push'landı (main, commit 8b186b1 + 5e5710d). Coolify'a HENÜZ deploy edilmedi — corteqs.net/tools'ta görünmesi için deploy tetiklenmesi gerekiyor.",
    ],
  },
  {
    id: "20260802-relocation-slider-radyo-butonlari",
    date: "2 Ağustos 2026",
    title:
      "Taşınma araçlarındaki 1-5 kaydırma çubuğu kalktı — artık her seçenek tek tek tıklanan bir kutucuk",
    items: [
      "10 taşınma aracının tamamı aynı soru bileşenini (QuestionRenderer) kullanıyor. '1'den 5'e kadar değerlendir' tipi sorular bu bileşende bir kaydırma çubuğuyla (slider) cevaplanıyordu — özellikle mobilde parmakla tam istenen sayıya denk getirmek zordu ve o an hangi değerde olduğun küçük bir rakamdan başka bir şeyle görünmüyordu.",
      "Artık bu sorular 5 satırlık, her biri kendi başına tıklanabilir tek seçimli kutucuklar (radyo buton) olarak geliyor; en alttaki ve en üstteki seçeneğin yanında ne anlama geldiğini açıklayan kısa etiket de var. Bileşen paylaşımlı olduğu için tek yerde yapılan bu değişiklik otomatik olarak 10 aracın hepsini kapsıyor.",
      "Durum: kod ana koda alındı, veritabanı değişikliği yok. Deploy sonrası canlıda görünür.",
    ],
  },
  {
    id: "20260802-meslek-maas-araci-secici-iyilestirme",
    date: "2 Ağustos 2026",
    title:
      "Meslek/Maaş Karşılaştırma aracında meslek artık aranarak seçiliyor, hedef ülke seçimi 5'e kadar çoklu hale geldi",
    items: [
      "Meslek alanı eskiden serbest metin girişiydi — kullanıcı ne yazdığını bilmeden yazıyor, veritabanındaki gerçek meslek etiketiyle tutup tutmadığını göremiyordu. Artık aranabilir bir liste (combobox): yazmaya başlayınca eşleşen meslekler süzülüyor, listede olmayan bir meslek seçilirse 'bu meslek için veri yoksa sonuç çıkmayabilir' uyarısı görünüyor.",
      "Hedef ülke sorusu tek ülkeden çoklu seçime geçti: en az 1, en fazla 5 ülke aynı aranabilir listeden işaretlenebiliyor. Hedef şehir sorusuna da yardımcı metin ve 'Şehir fark etmez' hızlı doldurma seçeneği eklendi — şehir belirtmek istemeyen kullanıcı artık ne yazacağını düşünmek zorunda değil.",
      "DİKKAT — aynı commit'te ayrıca fark edilen bir değişiklik: sonuç ekranındaki yönlendirme butonları ('Tekrar Çöz' hariç) yeniden 'Yakında' rozetiyle tıklanamaz hale getirildi. Bu buton bileşeni (ResultCtaPanel) 10 aracın TAMAMI tarafından paylaşılıyor — yani değişiklik yalnız meslek/maaş aracını değil, hepsini kapsıyor. 30 Temmuz'da bu butonlar tam tersine 'artık gerçek link' diye canlıya alınmıştı; bu geri alınış commit mesajında açıklanmıyor. Bilinçli bir karar mı yoksa istemeden mi oldu netleşmedi — Yapılacaklar kartına kontrol maddesi eklendi.",
      "Durum: kod ana koda alındı. Soru metinlerindeki veritabanı güncellemesi (yardımcı metin/placeholder) applied klasöründe görünmüyor — canlıya henüz UYGULANMAMIŞ olabilir, deploy öncesi kontrol edilmesi gerekiyor.",
    ],
  },
  {
    id: "20260802-komuta-merkezi-tamamlanan-akordiyon",
    date: "2 Ağustos 2026",
    title:
      "Komuta Merkezi'nde tamamlanan görevler artık ana listeyi doldurmuyor, alttaki katlanır bölüme taşındı",
    items: [
      "Aktif iş tablosu 'Tamamlandı' statüsündeki kayıtlarla birlikte kalabalıklaşıyordu — devam eden işi bulmak için tamamlanmış onlarca satırı geçmek gerekiyordu.",
      "Artık tamamlanan kayıtlar ana tablodan çıkıp, sayfanın altındaki Arşivlenmiş/Silinmiş bölümlerinin yanına 'Tamamlanan Görevler' başlıklı katlanır (accordion) bir bölüme taşınıyor. Düzenleme/arşivleme/silme aksiyonları tamamlanan kayıtlarda da aktif kalıyor — yanlışlıkla 'Tamamlandı' yapılan bir kayıt gerekirse geri alınabiliyor.",
      "Durum: kod ana koda alındı, veritabanı değişikliği yok. Gerçek admin girişiyle tarayıcı testi bu ortamda yapılamadı (giriş bilgisi yok) — deploy sonrası kısa bir göz kontrolü öneriliyor.",
    ],
  },
  {
    id: "20260802-cadde-redesign-kapandi",
    date: "2 Ağustos 2026",
    title:
      "Cadde revizyon turu kapandı: akış, paylaşım, hedefleme ve görünüm baştan toparlandı",
    items: [
      "Cadde için son büyük revizyon paketi tamamlandı. Bu turda akışın davranışı, paylaşım kutusu, yorumlar, tepkiler, paylaşma butonu, emoji seçici, hedefleme, reklam alanları ve genel görünüm tek tek elden geçirildi.",
      "Paylaşım tarafı daha sade oldu: paylaşım kutusu WhatsApp gibi tek ana alana indi, konu/etiket kalabalığı temizlendi, emoji seçici eklendi ve tepki sistemi 5 açık emojiye döndü. Yorumlarda Enter ile gönderme, devamını yükleme ve açık panelde sessiz yenileme var.",
      "Konum ve hedefleme tarafı toparlandı: yeni paylaşım artık aktif filtreye göre değil, üyenin kendi kayıtlı konumuna göre başlıyor. İsteyen kullanıcı ana hedefe ek olarak bir ülke/şehir daha seçebiliyor; bu ek hedef premium ayarına bağlandı. Global akış da artık her şeyi serbestçe almıyor, içerik yeterli etkileşim alınca globale çıkıyor.",
      "Paylaşma ve tanıtım akışı düzeldi: post linki Web Share veya kopyalama ile paylaşılabiliyor ve paylaşım sayacı tutuluyor. Sponsorlu/tanıtım kartları, öne çıkan pano alanı ve boş reklam alanları daha anlaşılır hale getirildi; giriş yapan kullanıcılar doğru şekilde profilindeki tanıtım paneline yönleniyor.",
      "Görsel taraf da kapandı: Cadde koyu, daha kontrastlı bir zemin aldı; kartlar, boş durumlar, sponsorlu alanlar ve Çarşı teaser'ı aynı tasarım diline bağlandı. Küçük buton ve dar boşluklar sıkılaştırıldı; dokunma alanları mobilde de rahat kalacak şekilde kontrol edildi.",
      "Son durum: F1-F23 Cadde redesign batch'lerinin tamamı bitti ve kod ana dala commitlendi. Sende kalan işler ayrı: Coolify deploy, giriş yaparak kısa QA turu, revizyon panosunda ilgili kutuları 'yapıldı'ya çekmek ve Footer işi; Footer bilinçli olarak bu pakete dokunulmadı.",
    ],
  },
  {
    id: "20260802-komuta-merkezi-summary9",
    date: "2 Ağustos 2026",
    title:
      "Komuta Merkezi güncellendi: WhatsApp Summary 7-9 aktarıldı, kanıtlı tamamlanan kayıtlar kapatıldı",
    items: [
      "WhatsApp dökümünde 9 Haziran-2 Ağustos aralığındaki todo, karar ve kalıcı notlar Komuta Merkezi'ne işlendi. İki yeni parti oluştu: 7 Temmuz 2026 için 411 kayıt, 2 Ağustos 2026 için 329 kayıt.",
      "Yeni 740 WA kaydının 604'ü açık takip maddesi olarak geldi; sohbette veya projede açıkça bittiği görülen 136 kayıt doğrudan Tamamlandı statüsüyle eklendi.",
      "Eski açık pano da ayrıca tarandı. Kod/DB kanıtı veya sohbette net 'canlıda/bitti' teyidi bulunan 103 eski kayıt Tamamlandı'ya çekildi.",
      "Kanıtı dolaylı kalan 259 madde bilinçli olarak açık bırakıldı. Bunlar özellikle partnerlik, pazarlama ritmi, hukuki/kurumsal kararlar ve net artefaktı görünmeyen eski strateji notları.",
      "Canlı pano fotoğrafı: 772 Başlanmadı, 450 Beklemede, 3 Devam ediyor, 256 Tamamlandı. DB verisi hemen panelde görünür; bu duyuru ise deploy sonrası zilde ve Durum Raporu'nda görünür.",
    ],
  },
];
