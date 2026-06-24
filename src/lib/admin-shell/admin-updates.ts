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
    id: "20260625-agent-altyapisi-faz-2-6",
    date: "25 Haziran 2026",
    title: "Yapay zekâ ajan altyapısı tamamlandı: sözleşmeler, telemetri, yönlendirme ve güvenlik",
    items: [
      "Araç kataloğunun üstüne beş katman daha eklendi. Birincisi, e-posta/eşleştirme gibi servisler için otomatik bir 'kullanım sözleşmesi' (OpenAPI) üretiliyor — bir ajan artık bir servisi nasıl çağıracağını, hangi bilgiyi göndereceğini kaynak kodu açmadan görebiliyor.",
      "İkincisi, ajanların ne yaptığını güvenle takip edebilmek için gizlilik-korumalı bir kayıt sistemi kuruldu (canlı veritabanına uygulandı). Kayıtlara yazılmadan önce e-posta, telefon, TC kimlik gibi kişisel bilgiler otomatik temizleniyor; kimlikler geri döndürülemez şekilde maskeleniyor; eski kayıtlar 90 gün sonra siliniyor. Bu kayıtlara sadece yöneticiler erişebiliyor.",
      "Üçüncüsü, bir ajan birden çok aracı arasından hangisini kullanacağına karar verirken puanlama yapan bir 'yönlendirici' eklendi (niyet uyumu, sözleşme tamlığı, gizlilik, hız gibi ölçütlerle). Kullanımdan kalkmış araçlar asla seçilmiyor.",
      "Dördüncüsü, panoya yeni bir 'Agent Analitik' sayfası eklendi (Sistem menüsü): araç sağlığını, yönlendirme puanlarını ve gizlilik/saklama özetini gösteriyor.",
      "Beşincisi, güvenlik sertleştirmesi: geçici hatalarda akıllı yeniden deneme (yan etki riski olan işlemlerde tekrar yok), arıza durumunda devre kesici, ve kullanıcı metnine gizlenmiş 'komut enjeksiyonu' saldırılarını yakalayıp etkisizleştiren bir koruma. Ayrıca her yeni kod değişikliğinde doküman çelişkilerini uyaran otomatik denetim derleme akışına bağlandı.",
      "Tüm bu işler test edildi (toplam ~75 yeni test geçti). Sayfaların ve menülerin panoda görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260624-arac-katalogu-ve-drift-denetimi",
    date: "24 Haziran 2026",
    title: "Yeni 'Araç Kataloğu' sayfası + kodla dokümanın çeliştiği yerleri otomatik yakalayan denetim",
    items: [
      "Admin paneline yeni bir sayfa eklendi: Sistem → 'Araç Kataloğu'. Platformun çalışan tüm parçalarını (e-posta gönderen ve eşleştirme yapan edge fonksiyonları, arka planda çalışan worker'lar, Cadde/Muhasebe/Katalog gibi modüllerin veri katmanları ve komut satırı script'leri) tek listede topluyor. Şu an 26 araç görünüyor: 6 edge fonksiyon, 2 worker, 17 modül ve script seti. Her kart aracın ne iş yaptığını, hangi tabloları kullandığını ve aktif mi yoksa kullanımdan kalkmış mı olduğunu gösteriyor. Üstteki arama kutusuyla araç adı, dosya ya da tablo adından filtreleyebilirsiniz.",
      "Bu liste elle yazılmıyor — doğrudan koddan otomatik üretiliyor. Yani yeni bir edge fonksiyon ya da modül eklendiğinde, tek komutla (npm run ingest:tools) liste güncelleniyor. Böylece 'kod değişti ama doküman eski kaldı' sorunu ortadan kalkıyor.",
      "İkinci bir araç da eklendi: dokümanlarla gerçek kodun çeliştiği yerleri otomatik yakalayan bir 'drift denetimi'. İlk taramada 6 çelişki bulundu ve 4'ü düzeltildi — örneğin README hâlâ silinmiş bir tabloyu (admin_users) anlatıyordu, kullanımdan kalkmış lansman-admin fonksiyonunu deploy etmeyi öneriyordu ve yönlendirme kütüphanesinin sürümü dokümanda eski yazıyordu. Bunlar güncellendi.",
      "Araç kataloğu ayrıca veritabanına da yazıldı (sadece yöneticilerin görebileceği güvenli bir bölümde); ileride kullanım istatistikleri ve sağlık takibi buraya bağlanabilir. Bu, yapay zekâ ajanlarının platformu kaynak kod okumadan tanıyıp güvenle kullanabilmesi için atılan ilk adım.",
      "Tüm bunlar arka uç ve geliştirici altyapısı; sayfanın panoda görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260623-stripe-yasal-sayfalar",
    date: "23 Haziran 2026",
    title: "Stripe ödeme altyapısı için yasal sayfalar hazırlandı (Şirket Bilgileri, İade & İptal, Hizmet Teslim)",
    items: [
      "Kartlı ödeme almaya geçebilmek için Stripe'ın istediği yasal sayfalar siteye eklendi. Üç yeni sayfa hazır: 'Şirket Bilgileri' (/legal/business-information — kimiz, hangi şirket, nasıl ulaşılır), 'İade ve İptal Politikası' (/legal/refund-cancellation — abonelik iptali, yenileme, iade koşulları) ve 'Hizmet Teslim Politikası' (/legal/service-delivery — dijital hizmetin nasıl ve ne zaman teslim edildiği). Hepsi sayfa altı (footer) menüsündeki 'Yasal' bölümünden ulaşılıyor.",
      "Kullanım Şartları sayfasına ödeme maddeleri eklendi: ödemelerin Stripe ile güvenli işlendiği ve kart bilgilerinin bizim sunucularımızda saklanmadığı, aylık/yıllık aboneliklerin otomatik yenilenebileceği, iptal ve teslim koşullarının yeni politika sayfalarına bağlandığı açıkça yazıldı.",
      "Tüm yasal sayfalar artık tek düzen altında (sol tarafta birbirine geçişli menü) ve girişsiz, herkese açık görüntülenebiliyor — Stripe doğrulama ekibi linklere takılmadan ulaşabilsin diye.",
      "Stripe başvurusu için bir hazırlık dökümanı (readiness paketi) da hazırlandı: panoda kullanılacak işletme tanımı, destek e-postası/telefonu, iade/teslim/gizlilik link listesi ve gizli tutulması gereken şirket/vergi/banka bilgilerinin nereye girileceği tek yerde toplandı. Hassas belgeler repoya konmadı, doğrudan Stripe panosuna girilecek.",
      "Yeni sayfalar arama motoru haritasına (sitemap) da eklendi. Sayfaların arayüzde görünmesi için bir sonraki yayın (deploy) gerekiyor; deploy sonrası Stripe'a başvuru yapılabilir.",
    ],
  },
  {
    id: "20260623-public-mobil-guven-ve-seo-denetimi",
    date: "23 Haziran 2026",
    title: "Halka açık sayfalarda mobil güven + Google görünürlüğü (SEO) denetimi ve onarımı",
    items: [
      "Sitenin halka açık sayfaları (ana sayfa, Kurucular, Fiyatlandırma, İletişim, Kariyer, Radar, yasal sayfalar) baştan sona gözden geçirildi; her birine kendi başlığı, açıklaması ve sosyal medya önizleme kartı tek bir merkezden verildi. Önceden her sayfa kendi yöntemiyle başlık ayarlıyordu, bazıları eksikti — artık tutarlı.",
      "Yasal sayfalar derlenip toparlandı: Gizlilik, Kullanım Şartları, KVKK ve Çerez sayfaları artık ortak bir düzen altında, soldan birbirine geçişli menüyle. Eski /privacy-policy adresi otomatik olarak /legal/privacy'ye yönleniyor (eski linkler kırılmadı). Gizlilik sayfası dağınık İngilizce kalıntılarından temizlenip sadeleştirildi.",
      "Üye profili ve dizin sayfaları (/directory/catalog/... ve /directory/profile/...) artık giriş yapmadan da görüntülenebiliyor. Önceden ziyaretçi bir profil linkine tıklayınca giriş duvarına çarpıyordu; bu hem kullanıcıyı kaçırıyor hem de Google'ın sayfayı görmesini engelliyordu. Artık herkese açık.",
      "İletişim sayfası elden geçirildi ve WhatsApp topluluk linki tek bir kaynağa taşındı (footer ve iletişim aynı linki paylaşıyor; ileride değişirse tek yerden güncellenir).",
      "Arama motoru haritasındaki (sitemap) tarihler güncellendi. Mobil görünümün doğruluğunu sürekli denetlemek için otomatik testler (Playwright) eklendi.",
      "Arka uç tarafı yok; bunlar arayüz ve yönlendirme düzenlemeleri — bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260623-cadde-mobil-akis-bos-durumlar",
    date: "23 Haziran 2026",
    title: "Cadde mobilde sıkılaştırıldı — boş ekranlar artık yol gösteriyor",
    items: [
      "Cadde'de içerik henüz azken görünen boş ekranlar düzgün hale getirildi. Aktif cafe yokken 'Henüz aktif bir cafe açılmadı… ilk cafe'yi sen aç' diyen davetkâr bir kart çıkıyor; tanıtım kartı yokken 'ilk tanıtım kartı burada yayınlanacak' mesajı görünüyor. Eskiden bu alanlar boş/kırık duruyordu.",
      "Bölge filtresi seçince içerik azsa kullanıcı bilgilendiriliyor: 'Bu bölgede içerik azsa ülke geneli ve global akış da devreye girer' gibi bir ipucu gösteriliyor — kullanıcı boş ekran sanıp ayrılmıyor.",
      "Cafe oluşturma formuna kontenjan (kaç kişi) seçimi eklendi; sınırsız da bırakılabiliyor. Cadde akış kartları ve cafe kartları mobil için yeniden tasarlandı (daha okunaklı, dokunmaya uygun).",
      "Mobil görünümü güvence altına almak için otomatik testler eklendi. Bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260623-ana-sayfa-diaspora-hikayeleri-bloga-baglandi",
    date: "23 Haziran 2026",
    title: "Ana sayfadaki 'Diaspora Hikâyeleri' bölümü artık gerçek blog yazılarını gösteriyor",
    items: [
      "Ana sayfanın (deneme/karşılama akışındaki) 'Diaspora Hikâyeleri' bölümü şimdiye kadar koda gömülü örnek (placeholder) metinler gösteriyordu — gerçek içerik değildi. Artık canlı Blog modülünden en güncel 3 yayınlanmış yazıyı otomatik çekiyor ve her kart ilgili /blog/<yazı> sayfasına gidiyor.",
      "Yayınlanmış blog yazısı yoksa bu bölüm tamamen gizleniyor — ziyaretçiye sahte/uydurma sosyal kanıt gösterilmiyor. Blog'a yeni yazı ekleyip yayınladığında ana sayfada otomatik görünür.",
      "Bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260622-admin-linkler-sekmesi-site-trafik",
    date: "22 Haziran 2026",
    title: "Admin paneline 'Linkler' sekmesi eklendi — ilk kart: Site Trafik Durumu",
    items: [
      "Admin panelinin sol menüsüne yeni bir 'Linkler' bölümü eklendi. Buraya admin'in sık kullandığı dış araç ve panolar kart olarak konacak; her kart tıklanınca ilgili araç yeni sekmede açılır.",
      "İlk kart 'Site Trafik Durumu': sitenin ziyaretçi trafiğini, ısı haritalarını ve oturum kayıtlarını gösteren Microsoft Clarity panosuna gider. Böylece trafiğe bakmak için ayrı yer aramaya gerek kalmıyor — panelin içinden tek tıkla ulaşılıyor.",
      "Site Trafik Durumu kısayolu ayrıca üst bardaki 'Dış Bağlantılar' menüsünde ve komut paletinde de aranabilir (ör. 'trafik', 'clarity', 'istatistik' yazarak bulunur).",
      "Teknik tarafta yeni araç eklemek tek bir liste girişiyle yapılacak şekilde kuruldu; navigasyon tutarlılığı testlerle kilitli. Tüm kontroller temiz. Bir sonraki yayınla (deploy) /admin/links adresinden görünür olacak.",
    ],
  },
  {
    id: "20260619-relocation-engine-veri-tabanli-yeniden-yazildi",
    date: "19 Haziran 2026",
    title: "Taşınma Planlayıcı (/relocation) gerçek veriyle çalışacak şekilde sıfırdan yazıldı",
    items: [
      "Eski Taşınma ekranı sabit (kodun içine gömülü) örnek verilerle ve yapay zekâ sohbetiyle çalışıyordu — gösterdiği şehir/maliyet/belge bilgileri gerçek değildi. Yeni ekran tamamen veritabanından besleniyor: hedef ülkeye göre şehir önerileri (bütçe, bürokrasi, sağlık, GSM, topluluk, uçuş skorlarıyla), servis önerileri (konut/uçuş/GSM/doktor/topluluk), bürokrasi adımları (gitmeden önce / vardıktan sonra) ve acil numaralar.",
      "Şehir önerileri artık 'neden' açıklamalı geliyor (ör. 'Türk topluluğu yoğun', 'konut bütçesi sınırda') ve her skorun dökümü görünüyor — şeffaf ve denetlenebilir. Henüz Berlin ve Amsterdam örnek veriyle yüklü; gerçek kaynak verisi (resmi portallar, lisanslı API'ler) ayrı bir veri toplama hattıyla dolacak.",
      "Teknik tarafta: kullanıcı taşınma dosyaları ve etkileşimleri RLS ile korunuyor (herkes yalnız kendi verisini görür), öneri hesabı güvenli RPC'lerde yapılıyor, skor ağırlıkları SQL ve arayüzde birebir aynalanıp testle kilitlendi. Eski sayfa ve localStorage'a yazan kısım kaldırıldı. Bir sonraki yayınla (deploy) /relocation adresinden görünür olacak.",
    ],
  },
  {
    id: "20260618-deneme-landing-ana-sayfa-oldu",
    date: "18 Haziran 2026",
    title: "Deneme karşılama sayfası artık asıl ana sayfa oldu — eski ana sayfa /landingtrial'a taşındı",
    items: [
      "Vodafone tarzı anlatıyla ilerleyen deneme karşılama sayfası (gece dönen dünya videosu, manifesto, küresel atlas, ekosistem rayı, sosyal kanıt bandı, diaspora hikâyeleri ve kapanış çağrısı) beğenildiği için artık sitenin ana sayfası (corteqs.net) oldu.",
      "Eski ana sayfa (arama çubuğu + sosyal kanıt + ağ vitrini + SSS) kaybolmadı; corteqs.net/landingtrial adresine taşındı. İki sayfanın yalnızca adresleri yer değiştirdi, içeriklere dokunulmadı.",
      "Teknik tarafta yalnızca yönlendirme (route) eşleşmesi takas edildi; tüm kontroller temiz (lint, derleme, Türkçe karakter denetimi). Bir sonraki yayınla (deploy) corteqs.net açıldığında yeni tasarım görünür olacak.",
    ],
  },
  {
    id: "20260618-landing-deneme-logo-renkleri",
    date: "18 Haziran 2026",
    title: "Deneme landing sayfası (/landingtrial) logonun 6 rengiyle canlandırıldı",
    items: [
      "Deneme karşılama sayfası şimdiye kadar logonun yalnızca 2 rengini (teal-yeşil ve turuncu) kullanıyordu. Logo aslında 6 renkli bir fırıldak: teal, mavi, indigo/mor, magenta/pembe, turuncu ve sarı. Sayfanın her bölümüne bu renklerden biri verildi — sayfa boydan boya logonun renklerini taşıyor.",
      "Bölüm renkleri: hero başlığı altı tonu birden geçen çok renkli gradyan (en güçlü vurgu); Manifesto indigo/mor; Sistemin Katmanları kartlarının her biri ayrı bir logo renginde (6 kart = 6 renk); Kanıt bandı sarı/turuncu; Hikâyeler pembe; kapanış çağrısının üstünde ince çok renkli logo şeridi. Haritadaki akan bağlantı noktaları da artık tek renk yerine logonun renklerinde akıyor (canlı ağ hissi).",
      "Teknik tarafta renkler tek bir merkezden (marka renk değişkenleri) tanımlandı; ileride logonun resmi renk kodları netleşirse tek bir yerden güncellenir, sayfa otomatik uyum sağlar. Mevcut ana sayfa (corteqs.net) ve diğer sayfalar bu değişiklikten etkilenmedi — yalnızca deneme sayfası.",
      "Tüm kontroller temiz (lint, derleme, Türkçe karakter denetimi). Bir sonraki yayınla (deploy) /landingtrial adresinden görünür olacak.",
    ],
  },
  {
    id: "20260618-header-beta-bandi-krem-ton",
    date: "18 Haziran 2026",
    title: "Sitenin üstündeki beta duyuru bandı yumuşatıldı — koyu lacivertten açık kreme",
    items: [
      "Her sayfanın en üstündeki 'Açık Beta yayında' duyuru bandı koyu lacivert (neredeyse siyah) bir şeritti; altındaki krem renkli başlık ve dönen dünya animasyonuyla yan yana durunca sert, 'kirli' bir kontrast oluşturuyordu. Bant artık header'la aynı dilde, açık krem tonuna çekildi; yazılar koyulaştırılıp okunaklı tutuldu, turuncu (amber) 'Açık Beta' vurgusu korundu. Görsel bütünlük arttı, içerik aynı kaldı.",
      "Bu görsel bir düzenleme; bir sonraki yayınla (deploy) görünür olacak.",
    ],
  },
  {
    id: "20260617-deneme-landing-sayfasi",
    date: "17 Haziran 2026",
    title: "Yeni bir deneme ana sayfa tasarımı hazırlandı — /landingtrial (mevcut sayfaya dokunmadan)",
    items: [
      "Vodafone tarzı, anlatıyla ilerleyen yepyeni bir karşılama (landing) sayfası tasarlandı ve corteqs.net/landingtrial adresine kondu. Bu tamamen ayrı bir DENEME sayfası: mevcut ana sayfaya (corteqs.net) hiç dokunulmadı, ziyaretçiler kazara buraya düşmez — sadece linki bilen görür. Beğenilirse içeriği sonradan asıl ana sayfaya taşıyabiliriz.",
      "Sayfa kayan, kademeli açılan bölümlerden oluşuyor: tepede yazısız bir 'gece dönen dünya' video arka planı (hero), ardından manifesto, küresel atlas haritası, ekosistem rayı, sosyal kanıt bandı, diaspora hikâyeleri ve kapanış çağrısı. Amaç markayı tek akışta hissettirmek.",
      "Yayın sırasında küçük bir teknik sorun çıkıp çözüldü: hero videosunun klasör adı sayfa adresiyle çakışıp 403 (erişim engellendi) hatası veriyordu; video çakışmayan bir klasöre taşınıp sorun giderildi.",
      "Bir sonraki yayınla (deploy) /landingtrial adresinden bakıp görüş verebilirsin.",
    ],
  },
  {
    id: "20260617-radar-cors-onarimi",
    date: "17 Haziran 2026",
    title: "Radar haber taraması için arka uç onarımı (CORS)",
    items: [
      "Radar haber tarayıcısının (otomatik haber keşfi yapan arka plan servisi) tarayıcıdan tetiklenmesini engelleyen teknik bir izin (CORS) sorunu giderildi. Artık 'Şimdi Tara' türü işlemler sorunsuz çalışabiliyor.",
      "Tamamen perde arkası bir düzeltme; günlük kullanımı doğrudan etkilemez ama haber tarama akışını sağlamlaştırır.",
    ],
  },
  {
    id: "20260617-toplu-ice-aktarma-ve-onay",
    date: "17 Haziran 2026",
    title: "Toplu profil içe aktarma + onay kuyruğu eklendi — ilk 122 kayıt beklemede",
    items: [
      "Yeni bir 'Toplu İçe Aktarma' ekranı eklendi (sol menüde Üyeler ve Dizin grubunda, /admin/bulk-import). Elindeki hazır profesyonel/influencer listelerini (CSV veya JSON) buraya yapıştırıp ya da dosya olarak yükleyip topluca sisteme alabiliyorsun. İsim, firma, şehir, meslek, telefon, e-posta, web ve adres alanlarını anlıyor; Türkçe ve İngilizce başlıkları tanıyor.",
      "EN ÖNEMLİ kural: içe aktarılan hiçbir profil kendiliğinden yayına çıkmaz. Hepsi önce 'İncelemede' (beklemede) olarak girer ve kimse göremez. Yayına almak tamamen senin onayına bağlı — Radar haberlerindeki mantığın aynısı.",
      "Onaylama mevcut Kayıt Veritabanı ekranından yapılıyor (/admin/data): durum filtresinden 'İncelemede'yi seç, bir kayda tıkla, açılan panelde 'Onayla ve Yayınla' (herkese açık olur) veya 'Reddet' de. Onaylanınca profil dizinde görünür, reddedilince gizli kalır.",
      "Sistem akıllı eşleme yapıyor: mesleğe bakıp uygun rolü kendi atıyor (avukat/muhasebeci → Hukuk & Vergi Danışmanı, doktor → Doktor, emlakçı → Gayrimenkul Danışmanı, vizeci → Vize & Göçmenlik, influencer → Blogger/Vlogger gibi). Emin olamadığı kayda genel üye rolü verir; onay sırasında rolü panelden değiştirebilirsin.",
      "Aynı listeyi yanlışlıkla iki kez yüklersen panik yok: sistem daha önce eklenen kayıtları tanıyıp atlıyor (mükerrer profil oluşmuyor). Telefon ve e-posta gizli, web/sosyal medya bağlantısı herkese açık olarak giriyor.",
      "İlk veri yüklendi: üç Deep Research listesinden toplam 122 profil 'İncelemede' olarak sisteme alındı — Vancouver-Toronto profesyonelleri (60), Melbourne danışmanları (31) ve 30K+ Türk influencer'lar (31). Hepsi senin onayını bekliyor; /admin/data → 'İncelemede' filtresinden inceleyebilirsin. (Bazı kayıtlarda isim boştu, firma adı isim yapıldı; bir influencer yanlış role düşmüş olabilir — onayda düzeltilir.)",
      "Arka uç (veritabanı) tarafı canlıda hazır ve uçtan uca test edildi (testler yeşil, Türkçe karakter denetimi temiz). 'Toplu İçe Aktarma' ekranının ve onay düğmelerinin arayüzde görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
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
