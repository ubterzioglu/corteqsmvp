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
