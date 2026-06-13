// Admin Kullanım Kılavuzu (/admin/guide) — tüm admin modüllerinin nasıl
// kullanıldığını anlatan kapsamlı rehber. Topbar'daki ? butonu ve sidebar
// altındaki Yardım linki buraya gelir. Bölüm yapısı navigasyon registry
// gruplarını izler; derin AFS referansı için /admin/new-member/guide ayrıdır.

import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/page";
import { Button } from "@/components/ui/button";

type GuideSection = {
  title: string;
  items: string[];
};

type GuideBlock = {
  id: string;
  heading: string;
  sections: GuideSection[];
  /** Bölüm sonunda gösterilecek ilgili ekran linkleri. */
  links?: { label: string; to: string }[];
};

const guideBlocks: GuideBlock[] = [
  {
    id: "giris-yetki",
    heading: "1. Giriş ve Yetki",
    sections: [
      {
        title: "Panele giriş",
        items: [
          "Adres: /admin. E-posta ve şifrenle giriş yaparsın; hesabın admin yetkisine sahip değilse 'erişim reddi' ekranı görürsün — bu durumda bir yöneticiden yetki istemen gerekir.",
          "Şifreni unuttuysan giriş ekranındaki şifre sıfırlama bağlantısını kullan; sıfırlama e-postası hesabına gönderilir.",
          "Çıkış: sağ üstteki kullanıcı menüsünden (avatar ikonu) 'Çıkış' seçilir.",
        ],
      },
      {
        title: "Yetki modeli",
        items: [
          "Admin yetkisi tek kaynaktan doğrulanır (is_admin kontrolü). Sayfa bazında ayrıca feature bayrakları geçerlidir; bir ekranı görmüyorsan rolün veya feature'ların eksik olabilir.",
          "Kritik işlemler (onay, rol değişikliği, override) Audit Logs ekranına işlenir — kim, ne zaman, neyi değiştirdi sorusunun cevabı oradadır.",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    heading: "2. Genel Bakış (Dashboard)",
    sections: [
      {
        title: "Ekran ne gösterir?",
        items: [
          "KPI kartları: toplam katalog kaydı, aktif rol sayısı, bekleyen onay, aktif feature override ve son 24 saatteki admin işlemi.",
          "Dikkat kuyruğu: aksiyon bekleyen işler (ör. bekleyen onaylar) doğrudan ilgili ekrana götürür.",
          "Hızlı işlemler: en sık kullanılan 8 ekranın kısayolu.",
          "Modül kartları: tüm admin bölümlerinin özet kartları; Favoriler ve Son Kullanılanlar widget'ları kişiseldir.",
          "Bir metrik yüklenemezse '—' gösterilir; sayfayı yenilemek genellikle yeterlidir.",
        ],
      },
    ],
    links: [{ label: "Dashboard'ı aç", to: "/admin" }],
  },
  {
    id: "gezinme",
    heading: "3. Gezinme ve Kişiselleştirme",
    sections: [
      {
        title: "Sol menü (sidebar)",
        items: [
          "Ekranlar gruplar halindedir; grup başlığına tıklayınca açılır/kapanır, aktif ekranın grubu otomatik açıktır.",
          "Bir ekranın üzerine gelince çıkan yıldız ile favorilere eklersin; favoriler menünün en üstünde listelenir.",
          "Alt kısımdaki 'Daralt' menüyü ikon moduna küçültür; 'Yardım' bu kılavuzu açar. Tercihlerin tarayıcında saklanır.",
          "Mobilde sol üstteki menü (hamburger) butonu aynı navigasyonu çekmece olarak açar.",
        ],
      },
      {
        title: "Arama (Ctrl+K)",
        items: [
          "Üst bardaki 'Ara' butonu veya Ctrl+K (Mac'te ⌘K) komut paletini açar.",
          "Ekran adı, takma ad (ör. 'onay', 'rol', 'anket') veya grup adıyla ara; Enter ile ekrana git. Son kullanılanlar ve favoriler paletin en üstünde hazırdır.",
        ],
      },
      {
        title: "Üst bar (sağdan sola)",
        items: [
          "Kullanıcı menüsü: hesap bilgisi ve çıkış.",
          "Dış bağlantılar (küre ikonu): Engine, Globe ve Founders gibi harici araçlar yeni sekmede açılır.",
          "Tema (ay/güneş): admin'e özel açık/koyu mod — public site etkilenmez.",
          "Kılavuz (?): bu sayfa.",
          "Güncellemeler (zil): yeni sürüm notları; okunmamış güncelleme sayısı kırmızı rozetle görünür, menüyü açınca okundu sayılır.",
        ],
      },
    ],
  },
  {
    id: "uyeler",
    heading: "4. Üyeler ve Dizin",
    sections: [
      {
        title: "Kayıt Veritabanı (/admin/data)",
        items: [
          "Tüm katalog ve üye kayıtlarının birleşik listesi. Tür, rol, durum, şehir/ülke ve serbest metin filtreleriyle daraltırsın; bir satıra tıklayınca detay açılır.",
          "Kullanıcıya rol atama buradan yapılır: kaydın detayında platform rolünü seç ve kaydet — profildeki alanlar ve özellikler role göre otomatik şekillenir (AFS).",
          "Kayıt sahipliği (claim) ve yönetici atamaları da kayıt detayından yönetilir.",
        ],
      },
      {
        title: "Approval Queue (/admin/approvals)",
        items: [
          "Üyelerden gelen bekleyen talepleri (ör. profil sahiplenme) listeler. Talebi incele, Onayla veya Reddet — karar anında işlenir ve Audit Logs'a yazılır.",
          "Durum, tür ve kullanıcı filtreleri ile kuyruk daraltılır; dashboard'daki 'bekleyen onay' KPI'ı bu kuyruğu sayar.",
        ],
      },
      {
        title: "Feature Override (/admin/new-member/overrides)",
        items: [
          "Belirli bir kullanıcıya, rolünden bağımsız olarak bir özelliği açma/kapatma istisnası tanımlar.",
          "Kullanıcıyı seç → feature'ı aç/kapat → kaydet. 'Temizle' istisnayı kaldırır ve kullanıcı rolünün varsayılanına döner. Override'lar geçici çözümdür; kalıcı ihtiyaçta rol kuralını (AFS Matrisi) güncelle.",
        ],
      },
      {
        title: "Audit Logs (/admin/audit-logs)",
        items: [
          "Kritik admin işlemlerinin geçmişi (son 200 kayıt). Action, işlemi yapan (actor) ve hedef kullanıcı filtreleri + serbest arama vardır.",
          "Her kayıtta işlemin öncesi/sonrası JSON olarak görünür — bir değişikliğin tam olarak neyi etkilediğini buradan doğrularsın.",
        ],
      },
      {
        title: "Referans Kodları (/admin/referral)",
        items: [
          "Davet/referans kodlarını üretir ve yönetirsin; üretilen kodlar accordion listede görünür.",
          "Alt sayfalar: Kaynaklar, Gruplar ve Tipler — kodların nereden geldiğini ve nasıl sınıflandığını tanımlar.",
        ],
      },
    ],
    links: [
      { label: "Kayıt Veritabanı", to: "/admin/data" },
      { label: "Approval Queue", to: "/admin/approvals" },
    ],
  },
  {
    id: "roller-afs",
    heading: "5. Roller ve AFS",
    sections: [
      {
        title: "Kavram: Rol → Attribute / Feature / Section",
        items: [
          "Her üye veya katalog kaydına bir platform rolü atanır. Rol; profilde hangi alanların görüneceğini (Attribute), hangi özelliklerin açık olacağını (Feature) ve profil kartında hangi bölümlerin yer alacağını (Section) belirler.",
          "Sistemde 76 düz rol, 53 attribute, 42 feature ve 7 section vardır; kurallar rol başına tanımlanır.",
        ],
      },
      {
        title: "AFS Genel Bakış (/admin/new-member/roles-overview)",
        items: [
          "Tüm item, rol ve AFS entity'lerini tek ekranda gösterir. Soldan bir kayıt, ortadan bir rol seç — alttaki 'Örnek Case' panelleri o kombinasyonda profilin giriş yapmış ve dış ziyaretçi gözünden nasıl görüneceğini özetler.",
        ],
      },
      {
        title: "Roller AFS Matrisi (/admin/new-member/role-matrix)",
        items: [
          "Rol kurallarının düzenlendiği ana ekran. Üstten rolü seç (URL ?role= ile paylaşılabilir); attribute satırlarında Aktif/Zorunlu/Public, feature satırlarında Açık/Kapalı, section satırlarında Görünür anahtarlarını değiştir ve kaydet.",
          "Buradaki değişiklik o roldeki TÜM kullanıcıları etkiler; tek kullanıcı istisnası için Feature Override kullan.",
        ],
      },
      {
        title: "Durum Raporu ve Veritabanı Tabloları",
        items: [
          "Durum Raporu (/admin/new-member/durum-raporu): canlı sistem sağlığı ve metrikler; 'Yenile' ile anlık değer alınır.",
          "Veritabanı Tabloları (/admin/veritabani-tablolari): teknik/salt-okunur tablo görünümü — kayıt düzeltme ekranı değildir.",
        ],
      },
    ],
    links: [
      { label: "Derin referans: Sistem Kullanım Kılavuzu (AFS)", to: "/admin/new-member/guide" },
      { label: "Roller AFS Matrisi", to: "/admin/new-member/role-matrix" },
    ],
  },
  {
    id: "topluluklar",
    heading: "6. Topluluklar",
    sections: [
      {
        title: "Topluluk Landingleri (/admin/whatsapp-landings)",
        items: [
          "Şehir/konu bazlı topluluk (WhatsApp grubu) kayıtları ve public landing sayfalarının yönetimi: başlık, açıklama, davet linki ve görünürlük buradan düzenlenir.",
          "Topluluk Editörleri alt ekranı bir landing'in içeriğini yönetebilecek üyeleri atar.",
          "Topluluk Kılavuzu (/admin/whatsapp-landings/guide) topluluk akışının ayrıntılı rehberidir.",
        ],
      },
      {
        title: "Diplomatik Profiller (/admin/consulates)",
        items: [
          "Konsolosluk ve diplomatik temsilcilik profillerinin listesi ve düzenlemesi; kayıtlar dizinde ayrı profil tipi olarak görünür.",
        ],
      },
    ],
  },
  {
    id: "icerik",
    heading: "7. İçerik ve Kampanyalar",
    sections: [
      {
        title: "Cadde (/admin/cadde)",
        items: [
          "Cadde içerik yönetimi: demo/gerçek paylaşımlar, cafe'ler, billboard ve sponsor kartları buradan eklenir/düzenlenir.",
          "Moderasyon (/admin/cadde/moderation): üye şikayetleri ve sistemin otomatik yakaladığı şüpheli içerikler tek kuyrukta toplanır. Her kayıt için Kapat (sorun yok), Gizle, Geri Yayınla veya Sahibini Banla (7 gün) seçebilirsin; yazdığın not karar kaydına işlenir ve içerik sahibine bildirimle gider.",
          "Tanıtım (/admin/cadde/promotions): üyelerin açtığı sponsorlu kampanyalar burada onay bekler. Onaylarsan kampanya tarih aralığında Cadde'de kendiliğinden yayınlanır; reddedersen notun üyenin panelinde görünür. İki durumda da üyeye bildirim gider.",
          "Çarşı (/admin/cadde/carsi): üyeler arası tüm ilanların listesi (yayında/pasif/reddedilmiş filtreleriyle). Uygunsuz ilanı Gizle ile kaldırır, düzeltilmişi Yayınla ile geri açarsın — işlemler kayıt altına alınır.",
          "Cadde Kural Kitabı (/admin/cadde/rehber): Cadde'nin üye tarafında nasıl çalıştığını ve admin tarafında nasıl yönetildiğini günlük dille adım adım anlatan ayrıntılı rehber.",
          "İpucu: Cadde limitleri (günlük cafe açma, ilan sayısı, yorum hızı vb.) ayar tablosunda tutulur; bir limiti değiştirmek için kod gerekmez.",
        ],
      },
      {
        title: "Anketler (/admin/surveys)",
        items: [
          "Anket oluştur, düzenle ve yayınla; 'Cevaplar' ekranından gönderimleri incele. Public taraf /anket altında yayınlanır.",
        ],
      },
      {
        title: "Haber Bandı (/admin/marquee)",
        items: [
          "Ana sayfa hero altındaki dönen haber/istatistik/duyuru kartlarını yönetir. Yeni kayıt formunda tip, başlık, kısa bilgi, görsel ve sıralama girilir; görsel yükleme URL alanını otomatik doldurur.",
          "'OpenClaw Haber Havuzu' tablosundan hazır haberleri tek tıkla banda aktarabilirsin; aynı haber ikinci kez eklenmez.",
          "Pasif kayıtlar public tarafta görünmez — silmeden gizlemek için 'Aktif' anahtarını kapat.",
        ],
      },
      {
        title: "Blog (/admin/blog)",
        items: [
          "Ülke rehberi blog yazılarını yönetir: yeni yazı oluştur, mevcutları düzenle veya sil. İçerik markdown (zengin metin) olarak yazılır — başlık, liste, kalın/italik ve link kullanabilirsin.",
          "Yayınla/Gizle anahtarı yazının public tarafta (/blog) görünüp görünmeyeceğini belirler; taslak (gizli) yazılar ziyaretçilere görünmez.",
          "Public taraf: /blog ülkeye göre gruplu liste (kategori filtreli), /blog/<adres> tek yazı sayfasıdır. Yalnızca admin yazabilir; ziyaretçiler yalnızca yayınlanmış yazıları okur.",
        ],
      },
      {
        title: "Radar Haber Pipeline (/admin/radar)",
        items: [
          "Haber bandına aday haberleri otomatik bulup getiren keşif katmanı. Dış kaynaklardan (RSS/Atom haber akışları ve GDELT küresel haber veritabanı) diasporayı ilgilendiren haberleri tarayıp aday olarak toplar. EN ÖNEMLİ kural: hiçbir haber kendiliğinden yayınlanmaz — her aday senin onayından sonra banda düşer.",
          "Moderasyon Kuyruğu (/admin/radar/queue): bekleyen aday haberleri tek tek incele, Onayla (haber bandına aktarılır) veya Reddet.",
          "Haber Kaynakları (/admin/radar/sources): hangi RSS/Atom/GDELT kaynaklarının taranacağını ekler/düzenlersin.",
          "Tarama Geçmişi (/admin/radar/runs): hangi tarama ne zaman koştu ve kaç aday buldu — günlük cron ve manuel taramaların kaydı.",
          "Not: Otomatik taramayı çalıştıran arka plan servisi ve günlük zamanlanmış tetikleme henüz devreye alınmadı; ekranlar ve veritabanı hazır.",
        ],
      },
      {
        title: "Sosyal Medya ve Sosyal Link Profilleri",
        items: [
          "Sosyal Medya (/admin/social-media): sitenin sosyal medya bağlantıları.",
          "Sosyal Link Profilleri: danışman/profil bazlı link sayfalarının içerik yönetimi (profil başına ayrı ekran).",
          "19 Mayıs ekranları kampanya dönemine aittir ve şu an inaktiftir (sidebar'da İnaktif bölümünde).",
        ],
      },
    ],
    links: [
      { label: "Cadde Kural Kitabı", to: "/admin/cadde/rehber" },
      { label: "Blog", to: "/admin/blog" },
      { label: "Radar Moderasyon Kuyruğu", to: "/admin/radar/queue" },
    ],
  },
  {
    id: "workspace",
    heading: "8. Operasyon Workspace",
    sections: [
      {
        title: "Ekipler için çalışma alanı",
        items: [
          "Workspace (/admin/workspace): operasyon ana sayfası ve alt sayfalara giriş.",
          "Command Center: ekip todo'ları ve koordinasyon merkezi — görev ekle, durum güncelle.",
          "Dosyalar ve Linkler: ortak kaynak merkezi (dokümanlar, bağlantılar).",
          "MVP Listesi: ürün MVP takip listesi.",
          "Dokümanlar: workspace doküman sayfaları (toplantı notları dahil).",
        ],
      },
    ],
    links: [{ label: "Workspace'i aç", to: "/admin/workspace" }],
  },
  {
    id: "muhasebe",
    heading: "9. Muhasebe",
    sections: [
      {
        title: "Finansal kayıtlar",
        items: [
          "Muhasebe Dashboard (/admin/muhasebe): gelir/gider KPI özetleri ve dönem görünümü.",
          "Gelirler ve Giderler: kayıt ekle/düzenle/sil (tutar, kategori, tarih, durum). Tutarlar ve durum rozetleri listede görünür.",
          "Nakit Akışı: dönemsel giriş-çıkış akış görünümü; dashboard ile aynı kayıtlardan beslenir.",
        ],
      },
    ],
    links: [{ label: "Muhasebe Dashboard", to: "/admin/muhasebe" }],
  },
  {
    id: "sistem",
    heading: "10. Sistem",
    sections: [
      {
        title: "Güncellemeler ve dış araçlar",
        items: [
          "Ürün Güncellemeleri (/admin/about): sürüm notlarının tam listesi — üst bardaki zil menüsü aynı içeriğin son kayıtlarını gösterir.",
          "Dış bağlantılar: Engine (eng.corteqs.net), Globe (globe.corteqs.net) ve Founders sayfası üst bardaki küre menüsünden yeni sekmede açılır.",
        ],
      },
    ],
    links: [{ label: "Ürün Güncellemeleri", to: "/admin/about" }],
  },
  {
    id: "sss",
    heading: "11. İpuçları ve Sorun Giderme",
    sections: [
      {
        title: "Sık karşılaşılan durumlar",
        items: [
          "Bir ekranı bulamıyorum → Ctrl+K ile adını veya takma adını yaz; bu kılavuzdaki bölüm başlıkları da ekran adlarıyla eşleşir.",
          "Veri yüklenemedi hatası → ekrandaki 'Tekrar Dene' butonunu kullan; sürerse sayfayı yenile, yine sürerse çıkış yapıp tekrar gir.",
          "'Erişim reddi' görüyorum → hesabında admin yetkisi yok; mevcut bir yöneticinin Kayıt Veritabanı'ndan rolünü/yetkini güncellemesi gerekir.",
          "Yanlışlıkla bir şey mi değişti? → Audit Logs'ta işlemin öncesi/sonrası kayıtlıdır.",
          "Favori/tema/okundu bilgileri tarayıcıya kaydedilir — farklı bir cihazda varsayılanlara dönmesi normaldir.",
        ],
      },
    ],
  },
];

const AdminGuidePage = () => (
  <AdminPageShell
    title="Admin Kullanım Kılavuzu"
    description="Tüm admin modüllerinin ne işe yaradığı ve nasıl kullanıldığı — bölümler sol menü gruplarını izler."
    icon={BookOpen}
    accent="red"
  >
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden self-start lg:sticky lg:top-20 lg:block">
        <nav aria-label="Kılavuz içindekiler" className="rounded-2xl border border-border bg-card p-3">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            İçindekiler
          </p>
          <div className="space-y-0.5">
            {guideBlocks.map((block) => (
              <a
                key={block.id}
                href={`#${block.id}`}
                className="block truncate rounded-lg px-2 py-1 text-xs font-medium leading-5 text-foreground/75 transition-colors hover:bg-muted/60 hover:text-foreground"
                title={block.heading}
              >
                {block.heading}
              </a>
            ))}
          </div>
        </nav>
      </aside>

      <div className="min-w-0 space-y-10">
        {guideBlocks.map((block) => (
          <section key={block.id} id={block.id} className="scroll-mt-24 space-y-5">
            <h2 className="border-b border-border/60 pb-2 text-lg font-semibold tracking-tight text-foreground">
              {block.heading}
            </h2>
            {block.sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground/85">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {block.links && block.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {block.links.map((link) => (
                  <Button key={link.to} variant="outline" size="sm" asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  </AdminPageShell>
);

export default AdminGuidePage;
