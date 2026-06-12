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
