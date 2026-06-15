// Admin Panel V2 — ürün güncellemeleri (statik tek kaynak).
// Topbar'daki Güncellemeler (bell) menüsü ve /admin/about sayfası bu listeden
// beslenir. Yeni bir sürüm/özellik yayınlandığında EN ÜSTE yeni bir kayıt ekle;
// id benzersiz olmalı (okundu takibi id üzerinden yapılır, format: YYYYMMDD-slug).

export type AdminUpdateEntry = {
  /** Benzersiz kimlik — okundu takibi bu id ile yapılır. Format: YYYYMMDD-slug. */
  id: string;
  /** Görünen tarih (tr-TR, ör. "11 Haziran 2026"). */
  date: string;
  title: string;
  items: string[];
};

export const ADMIN_UPDATES: AdminUpdateEntry[] = [
  {
    id: "20260615-seo-geo-ve-arka-uc-onarimlari",
    date: "15 Haziran 2026",
    title: "Google görünürlüğü (SEO) güçlendirildi + iki admin ekranındaki kırık liste onarıldı",
    items: [
      "Site Google ve yapay zekâ aramalarına çok daha hazır hale getirildi: her sayfanın artık kendi başlığı, açıklaması ve sosyal medyada paylaşılınca çıkan önizleme kartı var. Önceden bunlar dağınık ve çoğu sayfada eksikti; şimdi tek bir merkezden yönetiliyor.",
      "Arama motorlarına sitenin haritası (sitemap) genişletildi: önceden Google'a sadece 1 adres bildiriliyordu, artık 73 adres (ana sayfa, tüm blog yazıları, rol tanıtım sayfaları vb.) bildiriliyor — yani daha fazla sayfa aramalarda çıkabilir.",
      "Sayfalara arama motorlarının ve yapay zekâların daha iyi anladığı 'yapılandırılmış veri' (JSON-LD) eklendi; ayrıca robots.txt ve yapay zekâlara yönelik llms.txt dosyaları düzenlendi. Alan adı ve sosyal medya bağlantıları her yerde tutarlı hale getirildi (corteqs.net).",
      "Ana sayfa ve birkaç bölüm (hero, sosyal kanıt bandı, küresel ağ vitrini) tazelendi; sayılar artık akıcı bir 'sayma' animasyonuyla görünüyor. İçerik aynı, görünüm daha canlı.",
      "ADMIN ONARIMI — Referans ekranı düzeldi: /admin/referral sayfasındaki açılır menüler ve kod listesi boş geliyordu. Sebebi bir veritabanı izin (RLS) düzenlemesinde admin'in görme yetkisinin yanlışlıkla kapanmasıydı; geri açıldı, ekran yeniden dolu geliyor. (Canlı veritabanında uygulandı.)",
      "ADMIN ONARIMI — Veri ekranındaki Claim (sahiplenme) Talepleri düzeldi: /admin/data sayfasında 'Claim Talepleri' açılınca 400 hatası alınıyordu. E-posta alanının teknik bir tür uyuşmazlığından kaynaklanıyordu; üç ilgili sorgu düzeltildi, liste yeniden açılıyor. (Canlı veritabanında uygulandı.)",
      "Not: Google görünürlüğü iyileştirmelerinin tam etkin olması için sunucu tarafında bir ön-render katmanının açılması gerekiyor; arka uç onarımları zaten canlıda, arayüz yenilikleri bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260615-mvp-beta-cila",
    date: "15 Haziran 2026",
    title: "MVP beta cilası — arama temizliği, Cadde'ye sosyal hava ve kırık butonların onarımı",
    items: [
      "Public aramada artık yönetici/admin rolleri görünmüyor: 'Süper Admin', 'Yönetici', deneme rolleri (Experimental 1/2) gibi iç roller hem arama filtresindeki seçeneklerden hem de sonuç kartlarından kaldırıldı. Beta kullanıcısı dışarıda sadece gerçek üyeleri (danışman, doktor, işletme, şehir elçisi vb.) görür. Veritabanı tarafında 9 iç rol gizlendi, canlıda hazır.",
      "Ana sayfadaki '🏅 Şehir Elçine Ulaş' butonu düzeldi: önceden tıklayınca alakasız tüm dizin geliyordu, artık doğrudan şehir elçisi profillerini getiriyor; o kategoride henüz kimse yoksa 'ilk başvurular yakında burada' diyen düzgün bir mesaj çıkıyor — boş, kafa karıştıran liste yok.",
      "Dizin (arama) ekranına net bir 'Sonuçları Göster' butonu eklendi. Önceden kullanıcı filtreleri seçiyor ama 'şimdi ne yapacağım?' diye takılıyordu. Artık ülke/şehir/kategori seçip butona basıyor, sonuçlara kaydırıyor; yanında bir de 'Filtreleri Temizle' var. Telefonda da tam genişlikte çalışıyor.",
      "'Taşınma Motoru' butonu doğru yere gidiyor: önceden yanlışlıkla Cadde'ye düşürüyordu, şimdi gerçek Taşınma/Relokasyon ekranını açıyor (taşınma planı, belge listesi, yaşam masrafları ve yapay zekâ sohbeti). Bu ekran zaten hazırdı ama hiçbir yere bağlı değildi — artık /relocation adresinden, giriş yaparak ulaşılıyor.",
      "Cadde'ye sosyal medya havası verildi: 'Cadde MVP', 'People Discovery', 'Paylaşım Oluştur' gibi teknik/Excel kokan ifadeler günlük Türkçeyle değiştirildi ('Caddede Paylaş', 'İnsanları Keşfet' vb.). Paylaşım tipleri Türkçeleşti ve bireysel kullanıcının ilan/teklif (ikinci el, yardım, hizmet) paylaşabileceği netleşti. 'Gerçek/Demo' anahtarı kullanıcıdan tamamen gizlendi — herkes sadece gerçek akışı görüyor.",
      "Cadde'de paylaşımların altındaki üç ayrı tepki butonu (Beğendim/Destek/Fikir) tek bir 'Tepki Ver' düğmesinde toplandı; tıklayınca açılıyor, sayılar görünür kalıyor, kalabalık azaldı. Sağ taraftaki pano 'CorteQS Panosu' adıyla maskotlu, daha canlı bir topluluk köşesine dönüştü.",
      "Radar (haber bandı) sayfasındaki kart yazıları kısacık 'taslak' havasından çıkarıldı; kartlar biraz büyüdü ve daha dolu, gerçek bir ürün gibi görünüyor. Uydurma istatistik eklenmedi.",
      "Ufak ama can sıkan şeyler: ana sayfadaki tanıtım cümlesi düzeltildi ('ekonomik ve sosyal fırsatlarla...'), profil ekranlarındaki İngilizce kaçaklar Türkçeleştirildi ('Directory'→'Rehber', 'Feature'→'Özellik') ve bir yazım hatası ('Profil Acik'→'Profil Açık') giderildi. Cadde'deki ülke/şehir filtresini temizleyen butonlardaki bir hata da onarıldı (tıklayınca takılıyordu).",
      "Hiçbir şey bozulmadı: tüm testler yeşil (646/646), site derlemesi sorunsuz, Türkçe karakter denetimi temiz. Veritabanı değişikliği canlıda; arayüzdeki yenilikler bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260614-profil-gorunurluk-tutarlilik",
    date: "14 Haziran 2026",
    title: "Profil görünürlük anahtarları düzeltildi — gizlediğin alan gerçekten gizleniyor",
    items: [
      "Profil düzenleme ekranındaki görünürlük (göz ikonu) anahtarlarıyla, profilin dışarıdan göründüğü hâli artık birebir uyuşuyor. Önceden bir alanı 'gizli' yapsan da public profilde görünmeye devam edebiliyordu.",
      "Asıl bug şuydu: bir bölümün tüm alanlarını kapatan grup anahtarı, açılışta her zaman 'açık' varsayılıyor ve gerçek duruma göre güncellenmiyordu — bu yüzden gizleme tutmuyordu. Düzeltildi; anahtarlar artık kaydedilmiş gerçek durumu yansıtıyor.",
      "İki ek tutarsızlık daha giderildi: 'Ad Soyad' alanının görünürlüğünde yanlış öncelik sırası ve 'İlgi Alanları' bölümünün görünürlük kontrolünün hiç uygulanmaması.",
      "Hiçbir şey bozulmadı: tüm testler yeşil (645/645).",
    ],
  },
  {
    id: "20260613-blog-ulke-rehberi",
    date: "13 Haziran 2026",
    title: "Blog yayında — 10 ülke için hazır rehber yazıları (30 makale)",
    items: [
      "Siteye bir Blog bölümü eklendi: corteqs.net/blog. Türkiye'den çıkış yapacak okur için on ülke (Almanya, Hollanda, Avusturya, Belçika, İsviçre, İngiltere, Kanada, ABD, İsveç, Fransa) hakkında üçer rehber yazısı hazır — toplam 30 makale. Her ülke için: 'giriş/ulaşım', 'gündelik hayat ve bütçe' ve 'kültür/sosyal akış' başlıkları var.",
      "Public taraf iki sayfadan oluşuyor: /blog ülkeye göre gruplu yazı listesi (üstte kategori filtresiyle), /blog/<yazı-adresi> ise tek yazının okuma sayfası. Yazılar zengin metin (markdown) olarak güzelce biçimlenip gösteriliyor. Footer'a (sayfa altı menü) da Blog linki eklendi.",
      "Yönetim sende: sol menüde İçerik ve Kampanyalar grubunda yeni 'Blog' ekranı var (/admin/blog). Buradan yeni yazı oluşturur, mevcutları düzenler, siler ve yayınla/gizle anahtarıyla görünürlüğü kontrol edersin. Gizli (taslak) yazılar public tarafta görünmez.",
      "Yazı içeriği markdown ile yazılır (başlık, liste, kalın/italik, link) — kod bilmeden, Word'e benzer şekilde düzenlersin. Yalnızca admin yazabilir; ziyaretçiler sadece yayınlanmış yazıları okur.",
      "30 yazının tamamı veritabanında canlıda hazır. Site arayüzündeki Blog bölümü bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260613-radar-haber-pipeline",
    date: "13 Haziran 2026",
    title: "Radar Haber Pipeline — haberler artık otomatik bulunuyor, ama yayını hep sen onaylıyorsun",
    items: [
      "Ana sayfadaki haber bandını (marquee) besleyecek yeni bir haber keşif sistemi kuruldu. Sistem dış kaynaklardan (RSS/Atom haber akışları ve GDELT küresel haber veritabanı) diasporayı ilgilendiren haberleri kendiliğinden tarayıp aday olarak topluyor.",
      "EN ÖNEMLİ kural: hiçbir haber kendiliğinden yayınlanmaz. Sistem sadece aday önerir; her aday senin onayından geçtikten sonra haber bandına düşer. Manipülatif veya alakasız içerik riski böylece sende kalır.",
      "Sol menüye yeni bir 'Radar Haber Pipeline' grubu eklendi, üç ekrandan oluşuyor: Moderasyon Kuyruğu (/admin/radar/queue) — bekleyen aday haberleri tek tek incele, Onayla (banda aktar) veya Reddet; Haber Kaynakları (/admin/radar/sources) — hangi RSS/Atom/GDELT kaynaklarının taranacağını sen belirle; Tarama Geçmişi (/admin/radar/runs) — hangi tarama ne zaman koştu, kaç aday buldu.",
      "Güvenlik önlemleri yerinde: sistem dış sitelerin görsellerini doğrudan çekip göstermiyor (sadece önizleme), aynı haberi adres ve içerik parmak iziyle tekilleştiriyor (mükerrer aday gelmez) ve zararlı adreslere istek atmasını engelleyen koruma var.",
      "Mevcut haber bandı düzenin aynen duruyor — bu sistem onun önüne kontrollü bir keşif katmanı ekliyor, eski 'OpenClaw Haber Havuzu' akışını bozmuyor.",
      "Not: Otomatik taramayı çalıştıran arka plan servisi (Edge Function) ve günlük zamanlanmış tetikleme henüz devreye alınmadı; kod ve veritabanı hazır, canlıya alma sırada.",
    ],
  },
  {
    id: "20260612-cadde-kural-kitabi",
    date: "12 Haziran 2026",
    title: "Cadde Kural Kitabı yayında — Cadde'nin tüm işleyişi tek sayfada",
    items: [
      "Sidebar'da İçerik ve Kampanyalar grubuna yeni bir menü eklendi: Cadde Kural Kitabı (/admin/cadde/rehber). Cadde'yle ilgili 'bu nasıl çalışıyordu?' sorularının tek adresi artık burası.",
      "Rehber iki bölümden oluşuyor: önce üyenin gözünden Cadde (kim girebilir, akış neye göre sıralanır, Köprü kuralları, Cafe/Çarşı/Tanıtım nasıl işler, şikayet ne olur), sonra admin tarafı (dört yönetim ekranı, ban mantığı, limitlerin nereden değiştiği ve önerilen günlük moderasyon rutini).",
      "Tamamı günlük dille yazıldı — teknik terim yok; yeni bir moderatöre Cadde'yi öğretmek için bu sayfayı okutman yeterli.",
      "Genel Admin Kılavuzu'ndaki Cadde bölümüne de bu rehbere işaret eden bir satır eklendi.",
    ],
  },
  {
    id: "20260612-dunya-kupasi-kart-yenilendi",
    date: "12 Haziran 2026",
    title: "Dünya Kupası vitrini yenilendi — telefon, harita, görsel ve yeni mekân kategorileri",
    items: [
      "Kampanya sayfasındaki işletme kartları baştan tasarlandı: artık her kartın üstünde işletmenin fotoğrafı, altında da tek tıkla telefonu açan 'Ara' ve Google Maps'te adresi açan 'Haritada Aç' butonları var. 'Profili Gör' linkini kaldırdık — maç izlemeye gelen kişi için aramak ve yol tarifi almak yeterli.",
      "Görsel yüklemeyen işletmeler boş kalmıyor: onlar için özel hazırlattığımız milli takım temalı bir görsel (bayraklar, meşaleler, stadyum) kartın üstüne otomatik geliyor.",
      "Başvuru formu da buna göre değişti: telefon ve adres artık zorunlu (karttaki butonları besliyorlar), işletme fotoğrafı isteğe bağlı (en fazla 5MB). Onay ekranında telefon, adres ve fotoğrafın küçük önizlemesini görürsün — onaydan önce fotoğrafa mutlaka göz at.",
      "Formdaki kategori listesi derlendi toplandı: Eczane, Hukuk Bürosu, Muhasebe Ofisi gibi maç yayınıyla alakası olmayan seçenekler formdan çıkarıldı. Yerine maça uygun mekânlar kaldı: Restoran/Cafe, Bar/Pub, Çay Bahçesi/Kahvehane, Nargile Cafe/Lounge ve Otel/Konaklama.",
      "Bunlardan üçü (Bar/Pub, Çay Bahçesi/Kahvehane, Nargile Cafe/Lounge) platformda hiç yoktu — yeni rol olarak eklendi, rol matrisinde göreceksin. Eski kategoriler silinmedi; sadece bu formda görünmüyorlar, üye kataloğunda kullanılmaya devam ediyorlar.",
      "Kampanya sayfasının tepesine yeni hazırlanan kampanya görseli kondu, ana sayfada da sol üste (logonun üstüne) kampanyaya götüren dikkat çekici kırmızı bir buton eklendi — siteye giren herkes kampanyayı ilk bakışta görecek.",
      "Veritabanı tarafı canlıda hazır; site arayüzündeki yenilikler bir sonraki yayınla (deploy) görünür olacak. Mevcut başvurular etkilenmedi.",
    ],
  },
  {
    id: "20260612-turkce-karakter-ve-deneysel-roller",
    date: "12 Haziran 2026",
    title: "Türkçe karakter sorunlarına kalıcı çözüm + deneme rolleri",
    items: [
      "Sitedeki aramalarda yıllardır tekrarlayan Türkçe karakter derdi kökten çözüldü: artık 'istanbul' yazınca İstanbul'lu kayıtlar bulunuyor, 'munih' yazsan Münih çıkıyor, 'DİYARBAKIR' ile 'diyarbakır' aynı sonucu veriyor. Etkinlikler, iş ilanları, danışmanlar, hastaneler, işletmeler, harita, WhatsApp grupları, Cadde ülke/şehir filtresi ve tüm admin aramaları (muhasebe dahil) — toplam ~26 ekran elden geçti.",
      "Sorunun asıl kaynağını da bulduk: tarayıcının standart büyük/küçük harf çevirisi Türkçe'ye uygun değil (İ ve ı harflerini yanlış çeviriyor, bu yüzden aramalar tutmuyordu). Artık her yerde Türkçe kurallarıyla çalışan ortak bir yardımcı kullanılıyor ve bundan sonra yazılacak her kod için bu kural proje el kitabına (CLAUDE.md) yazıldı — sorun bir daha geri gelmesin diye.",
      "Excel düzeltmesi: admin panelinden indirilen CSV raporları (vlogger listesi, Stripe işlemleri) artık Excel'de Türkçe karakterleri bozmadan açılıyor.",
      "Rol listesinde iki yeni rol göreceksin: Experimental 1 ve Experimental 2. İkisi de Bireysel (Diaspora Üyesi) rolünün birebir kopyası ve sadece deneme için var — rol/profil ayarlarında denemek istediğimiz her şeyi canlı rollere dokunmadan önce bunlarda test edeceğiz.",
      "Bu rollere bağlı iki test hesabı da açıldı: experimental1@corteqs.net ('Experimental Kullanıcı 1') ve experimental2@corteqs.net ('Experimental Kullanıcı 2'). Premium profil pilotu da Experimental 2 hesabının üstünde koşuyor. Denemeler bitince roller ve hesaplar topluca temizlenecek.",
      "Hiçbir şey bozulmadı: tüm testler yeşil (541/541), site derlemesi sorunsuz, 823 kaynak dosyanın karakter denetimi temiz.",
    ],
  },
  {
    id: "20260612-premium-profil-pilotu",
    date: "12 Haziran 2026",
    title: "Premium profil tasarımı pilota çıktı (şimdilik sadece test rolünde)",
    items: [
      "Profil ekranları için yeni, daha şık ve mobil öncelikli bir tasarım hazırladık. Kimseyi etkilememesi için önce sadece Experimental_2 test rolünde açık: experimental2@corteqs.net ile girince yeni görünümü görürsün, diğer tüm üyeler (Experimental_1 dahil) eski görünümde kalır.",
      "Public profil sayfası artık iki kolonlu: solda asıl içerik, sağda iletişim/diller ve yeni 'Profil Güvencesi' kartı — profilin doğrulanmış mı, sahibi tarafından mı yönetiliyor, sahiplenilebilir mi, açıklamasıyla gösterir.",
      "Profilde WhatsApp numarası veya randevu linki varsa artık tek tıkla ulaşılan 'WhatsApp' ve 'Randevu Al' butonları çıkıyor; bilgi yoksa buton da yok. Pilot profilde telefonda ekranın altında sabit bir ara/yaz çubuğu var.",
      "Pilot kullanıcının kendi profil ekranı da yenilendi: üstte büyük tanıtım kartı, sağda profil tamamlanma kartı (hangi alanların eksik olduğunu tek tek söyler) ve 'Public Profili Görüntüle' butonu — profilinin dışarıdan nasıl göründüğüne anında bakarsın.",
      "Birden fazla profili olanların gördüğü profil seçim ekranındaki bozuk Türkçe metinler düzeltildi, kartlar yenilendi.",
      "Hiçbir özellik silinmedi, veritabanına dokunulmadı; tüm testler yeşil. Tasarım beğenilirse diğer rollere tek tek, küçük bir ayarla yayılacak — pilot QA'sı bekleniyor.",
    ],
  },
  {
    id: "20260611-commercial-rol-sayfalari",
    date: "11 Haziran 2026",
    title: "Rol tanıtım sayfaları artık sitenin içinde açılıyor",
    items: [
      "Contributor, Influencer Partner, Strategic Partner, Community Leader ve Ambassador tanıtım sayfaları önceden siteden bağımsız, ayrı HTML dosyaları olarak açılıyordu. Artık hepsi sitenin normal birer sayfası: corteqs.net/commercial/ambassador gibi temiz adreslerden ulaşılıyor ve üstte siteye dönüş linki var.",
      "Görünüm değişmedi — sayfaların tasarımı birebir korundu, sadece artık site çatısının altında yaşıyorlar.",
      "Eski linkler kırılmadı: daha önce paylaşılmış tüm adresler (sondaki / işaretli veya .html'li olanlar dahil) otomatik olarak yeni adrese yönlenir.",
      "Sayfalar ciddi hafifledi: dört sayfanın her birinin içine ayrı ayrı gömülü duran ~2 MB'lık arkaplan görseli tek ortak dosyaya çıkarıldı; ziyaretçi görseli bir kez indirir, sayfalar daha hızlı açılır.",
      "Doküman merkezi /commercial sayfası aynı kaldı; Ambassador sayfası bilinçli olarak bu listede gizli (sadece linki bilen ulaşır).",
    ],
  },
  {
    id: "20260611-ulke-sehir-tek-kaynak",
    date: "11 Haziran 2026",
    title: "Ülke/şehir menüleri düzeldi — artık hiçbir şehir eksik değil",
    items: [
      "Ülke seçince şehir listesinin yarım gelmesi sorunu çözüldü: teknik bir limit yüzünden büyük ülkelerde sadece ilk 1000 şehir geliyordu. Artık 223 ülkenin 77 bine yakın şehrinin tamamı listeleniyor (Almanya'da 7 binden fazla, küçük kasabalar dahil).",
      "Liste uzun diye kullanım zorlaşmadı: şehir menüsünde yazarak arama var, Türkçe karakter takılmaz ('munih' yazsan da Münih'i bulur). Ekranda ilk 200 sonuç gösterilir, gerisi için aramayı daraltman yeterli.",
      "Aynı şehrin iki kere görünmesi temizlendi: listede hem 'Münih' hem 'Munich', hem 'Düsseldorf' hem 'Dusseldorf' duruyordu. 112 İngilizce/aksansız kopya kapatıldı; Türkçe adlar kaldı. Silinmediler, gerekirse geri açılabilir.",
      "Sitedeki BÜTÜN ülke/şehir alanları artık aynı kaynaktan besleniyor: önceden serbest yazı kutusu olan 5 form (destekçi, ilgi kaydı, diaspora kaydı, WhatsApp grubu, şehir elçisi başvurusu) ve Taşınma Motoru'ndaki 13 ülkelik kısıtlı liste de aynı menülere geçti. Üyeler artık 'Koln', 'köln', 'Cologne' gibi farklı yazımlar giremez — veriler tutarlı birikir.",
      "Bağlantı koptuğunda devreye giren yedek ülke listesindeki bozuk adlar da onarıldı (İngiltere, İtalya gibi İ ile başlayan 9 ülke adı hatalı kayıtlıydı).",
    ],
  },
  {
    id: "20260611-cadde-30-tamamlandi",
    date: "11 Haziran 2026",
    title: "Cadde 3.0 tamamlandı — bildirimler, moderasyon ve fazlası",
    items: [
      "Üyelere bildirim zili geldi: paylaşımına yorum/beğeni gelince, cafe katılımı onaylanınca, kampanyası sonuçlanınca veya ilanıyla ilgilenen olunca üye anında haber alıyor.",
      "Şikayet ve moderasyon sistemi açıldı: üyeler uygunsuz içeriği bayrak ikonuyla şikayet ediyor; hepsi Moderasyon Kuyruğu'na (/admin/cadde/moderation) düşüyor. Oradan tek tıkla içeriği gizleyebilir, geri yayınlayabilir veya sahibini 7 gün banlayabilirsin — yazdığın not üyeye de iletilir.",
      "Sistem yeni içerikleri kendiliğinden de tarıyor (küfür, kumar/bahis reklamı, spam): şüpheli bulduğunu yayından kaldırmadan kuyruğa ekler, son karar her zaman moderatörde.",
      "Çarşı denetim ekranı eklendi (/admin/cadde/carsi): bütün ilanları görüp uygunsuz olanı gizleyebilirsin; işlem kayıt altına alınır ve ilan sahibine bildirim gider.",
      "Banlanan üye okumaya devam eder ama hiçbir yere yazamaz (paylaşım, yorum, cafe, ilan, kampanya). Süre dolunca her şey kendiliğinden açılır.",
      "Cadde artık çoklu diaspora destekli: Türk, Hint, Çin ve Filipinli toplulukların içerikleri birbirine karışmaz.",
      "Cafe'ler kapanmadan 30 dakika önce katılımcılara otomatik hatırlatma gidiyor.",
      "Tüm limitler (günlük cafe sayısı, ilan limiti, yorum hızı vb.) artık ayar tablosundan değiştirilebiliyor — kod değişikliği gerekmez, geliştiriciye söylemen yeterli.",
    ],
  },
  {
    id: "20260611-dokuman-duzeni",
    date: "11 Haziran 2026",
    title: "Proje dokümanları ve durum panosu derlenip toparlandı",
    items: [
      "Projenin güncel durumu tek yerden izlenebiliyor: repo kökündeki rapor.html dosyasını tarayıcıda açınca tüm iş hatlarının durumunu, açık konuları ve 18 kullanım senaryosunu görürsün.",
      "Teknik dokümanlar sadeleştirildi: artık kökte sadece 4 dosya var (kurallar, hızlı bağlam, mimari, rapor); eski her şey docs/ klasörü altında arşivlendi.",
    ],
  },
  {
    id: "20260611-admin-guide-bildirimler",
    date: "11 Haziran 2026",
    title: "Admin Kılavuzu ve Güncellemeler Bildirimi",
    items: [
      "Tüm admin fonksiyonlarını anlatan kapsamlı Admin Kullanım Kılavuzu yayında (/admin/guide); sağ üstteki ? butonundan ve sol menünün altındaki Yardım linkinden ulaşılır.",
      "Sağ üste Güncellemeler (zil) butonu eklendi: okunmamış güncellemeler sayı rozetiyle görünür, menü açılınca okundu sayılır.",
    ],
  },
  {
    id: "20260611-cadde-30-faz4-6",
    date: "11 Haziran 2026",
    title: "Cadde 3.0 — Cafe, Çarşı ve Tanıtım",
    items: [
      "Cafe modülü: şehir bazlı sohbet odaları, giriş politikası ve oda detay sayfası.",
      "Çarşı (U2U marketplace): üyeler arası ilan/ürün paylaşımı ve global ticker.",
      "Tanıtım katmanı: sponsorlu görünürlük kampanyaları; admin tarafında /admin/cadde/promotions ekranı.",
    ],
  },
  {
    id: "20260611-adminpagelayout-tasfiye",
    date: "11 Haziran 2026",
    title: "Admin sayfa altyapısı sadeleştirildi",
    items: [
      "Eski AdminPageLayout bileşeni tamamen kaldırıldı; sayfalar ortak AdminPageShell düzenine geçiyor.",
      "Kullanılmayan üç eski sayfa (Roller/Entity önizlemeleri) temizlendi; adresleri güncel ekranlara yönlenir.",
    ],
  },
  {
    id: "20260610-admin-panel-v2",
    date: "10 Haziran 2026",
    title: "Admin Panel V2 yayında",
    items: [
      "Yeni kalıcı sol menü: gruplu navigasyon, favori yıldızları, daraltılabilir görünüm ve mobil çekmece aynı kaynaktan beslenir.",
      "Ctrl+K (⌘K) komut paleti: ekran adı, takma ad ve grupla arama; son kullanılanlar ve favoriler en üstte.",
      "Yeni operasyonel dashboard (/admin): KPI kartları, dikkat kuyruğu, hızlı işlemler ve modül kartları.",
      "Admin'e özel açık/koyu tema anahtarı; tercih tarayıcıda saklanır, public site etkilenmez.",
      "Üyeler ekranları (Onaylar, Audit Log, Overrides, Rol Matrisi) React Query'ye taşındı: daha hızlı yükleme, hata ekranında Tekrar Dene.",
    ],
  },
  {
    id: "20260610-cadde-30-faz1-3",
    date: "10 Haziran 2026",
    title: "Cadde 3.0 — temel katman",
    items: [
      "Çoklu coğrafi filtre ve ilgi alanları: akış artık şehir/ülke + ilgi bazlı kişiselleşiyor.",
      "CKS band/skor ranking: akış sıralaması üye etkileşim skoruna göre.",
      "Aktör bağlamı ve profil kapısı: Cadde'ye katılım profil tamamlama şartına bağlandı.",
    ],
  },
  {
    id: "20260610-public-profil-v21",
    date: "10 Haziran 2026",
    title: "Public Profil v2.1 canlıda",
    items: [
      "Üye profilleri (/directory/catalog/...) dinamik bölüm düzeniyle yeniden yazıldı; rol bazlı AFS kuralları profile yansır.",
      "Anonim ziyaretçiler profil sayfalarını giriş yapmadan görüntüleyebilir (v2 RPC).",
      "Canlı doğrulama mvp.corteqs.net üzerinde tamamlandı.",
    ],
  },
  {
    id: "20260610-uye-import",
    date: "10 Haziran 2026",
    title: "Üye içe aktarma ve rol eşleme",
    items: [
      "110 public üye kaydı içe aktarıldı; kategoriler düz rol sistemine eşlendi.",
      "Profil sahipleri kendi kartlarını satır içi düzenleyebilir (owner inline edit).",
    ],
  },
  {
    id: "20260609-afs-rebuild",
    date: "9 Haziran 2026",
    title: "Katalog / Rol / AFS yeniden yapılandırması",
    items: [
      "Rol sistemi düz 76 rol + 53 attribute + 42 feature + 7 section olarak yeniden kuruldu (AFS).",
      "Eski profiles/admin_users tabloları kaldırıldı; admin yetkisi tek kaynaktan (is_admin) doğrulanır.",
      "Rol Yönetimi matrisi ve AFS Genel Bakış ekranları bu yapıyı yönetir.",
    ],
  },
  {
    id: "20260426-whatsapp-bot",
    date: "26 Nisan 2026",
    title: "WhatsApp bot kayıtları ve kaynak ayrımı",
    items: [
      "WhatsApp bot kaynaklı kayıtlar submissions ile birleştirildi; Form / Chatbot / WA Bot kaynakları admin üyeler ekranında ayrı etiket ve sayaçlarla görünür.",
      "Chat akışı kayıtları source_type=chatbot olarak netleştirildi; eski kayıtlar geriye dönük uyumlu.",
    ],
  },
  {
    id: "20260424-muhasebe",
    date: "24 Nisan 2026",
    title: "Muhasebe modülü ve içerik altyapısı",
    items: [
      "Muhasebe modülü eklendi: dashboard, gelirler, giderler ve nakit akışı sayfaları.",
      "Kaynak linkleri ve danışman linkleri yönetimi admin paneline eklendi.",
      "Diaspora içerik akışı için marquee (haber bandı) altyapısı ve yönetim ekranı kuruldu.",
    ],
  },
  {
    id: "20260423-referral-iletisim",
    date: "23 Nisan 2026",
    title: "Referans ve iletişim kanalı iyileştirmeleri",
    items: [
      "Referans kodu alanı normalize edildi; kaynak, grup ve tip bazlı referans yönetimi güçlendirildi.",
      "Form gönderimlerine iletişim kanal durumu alanları (telefon, WhatsApp, Instagram, mail) eklendi.",
    ],
  },
];
