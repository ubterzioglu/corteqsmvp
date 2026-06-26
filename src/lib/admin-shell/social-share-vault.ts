// Admin Panel V2 — Sosyal Medya Paylaşım Deposu (statik tek kaynak).
// /admin/social-share-vault sayfası bu listeden beslenir. 10 platform aracı için
// hazır pazarlama içeriği: her araç için 3 metinsiz Canva görsel promptu (İngilizce)
// ve 1 kopyala-yapıştır Türkçe LinkedIn postu.
//
// İçerik düzenlemesi BU dosyadan yapılır (admin-updates.ts ile aynı felsefe).
// Metinler temiz UTF-8 Türkçe + gerçek tırnak + emoji olarak tutulur; HTML-entity
// veya mojibake KULLANILMAZ. Yeni araç eklerken `id` ve `order` benzersiz olmalı.

/** HTML'deki pill kategorileri — Keşfet / Bağlan / Kullan / Koru. */
export type SocialShareCategory = "kesfet" | "baglan" | "kullan" | "koru";

export type SocialShareTool = {
  /** Benzersiz kimlik (kebab-case, "tool-1" ... "tool-10"). */
  id: string;
  /** Görünüm sırası (1..10). */
  order: number;
  category: SocialShareCategory;
  /** Araç adı, ör. "Dizin / Katalog Arama". */
  name: string;
  /** Aracın kısa açıklaması (HTML .desc metni). */
  description: string;
  /** 3 metinsiz İngilizce Canva promptu (numarasız gövde). */
  canvaPrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
};

/** Kategori → Türkçe görünür etiket. */
export const SOCIAL_SHARE_CATEGORY_LABELS: Record<SocialShareCategory, string> = {
  kesfet: "Keşfet",
  baglan: "Bağlan",
  kullan: "Kullan",
  koru: "Koru",
};

export const SOCIAL_SHARE_TOOLS: SocialShareTool[] = [
  {
    id: "tool-1",
    order: 1,
    category: "kesfet",
    name: "Dizin / Katalog Arama",
    description:
      "Şehir, meslek ya da isim — 80+ kategoride dünyaya yayılmış diaspora ağında ara, bağlan, keşfet. 251 ülkeye dağılmış Türk profesyonelleri, işletmeleri ve kuruluşları tek aramada bulmanı sağlar.",
    canvaPrompts: [
      "A modern flat vector illustration of a glowing world map made of golden connection dots, a magnifier lens hovering over clustered city pins, deep navy background, gold (#aa8c42) and teal accents, Gen Z clean aesthetic — no text, no letters, no words.",
      "Isometric 3D illustration of diverse human silhouettes emerging from search-result cards floating in space, connected by thin glowing lines, gold-bronze and indigo palette, modern style — completely text-free, no typography.",
      "Minimalist illustration of a single hand holding a glowing compass that projects a network of tiny portrait bubbles, warm gold light, dark background — no text or letters anywhere.",
    ],
    linkedinPost: `🌍 Berlin'de avukat mı arıyorsun? Toronto'da yazılımcı mı?
Artık "tanıdık bir tanıdık" beklemek yok.

CorteQS Dizin'de 80+ kategoride, 251 ülkeye yayılmış Türk profesyonelleri tek aramayla bul. Şehir yaz, meslek yaz, isim yaz — gerisini ağ halletsin. 🔎

Senin insanın bir arama uzağında.
👉 corteqs.net'te aramaya başla.

#Diaspora #TürkDiasporası #Networking`,
  },
  {
    id: "tool-2",
    order: 2,
    category: "kesfet",
    name: "AI Eşleştirme",
    description:
      "Sunduğun ya da aradığın şeyi yazarsın; yapay zeka alan, şehir, ülke ve kategoriye göre sana en uygun eşleşmeleri skor ve kısa gerekçeyle getirir. Saatlerce profil karıştırmak yok, akıllı eşleşme var.",
    canvaPrompts: [
      "Abstract illustration of two glowing puzzle pieces magnetically attracting across a dark map, trailing gold sparks, faint AI neural-network lines in the background, teal and gold palette — no text, no numbers, no letters.",
      "Flat vector of a friendly AI orb scanning floating profile cards and highlighting one with a golden glow ring, Gen Z gradient background of indigo to pink — totally text-free, no typography.",
      "Isometric illustration of two roads from different cities converging into a single glowing handshake node, soft bokeh lights, gold and navy — no words or labels anywhere.",
    ],
    linkedinPost: `🤖✨ Aradığını yazmak yeterli.
"Amsterdam'da mentor arıyorum" yaz — CorteQS'in yapay zekası şehir, meslek ve hedefe göre sana EN uygun kişileri eşleştirsin.

Saatlerce profil karıştırma yok. Sadece akıllı eşleşme, sana özel gerekçeyle. 🎯

Gurbet büyük; doğru kişi yakın.
👉 corteqs.net

#YapayZeka #Diaspora #Eşleşme`,
  },
  {
    id: "tool-3",
    order: 3,
    category: "kesfet",
    name: "Profil / İlgi Alanı Editörü",
    description:
      "Profilini, rolünü ve ilgi alanlarını düzenlersin; bu bilgiler hem akışındaki eşleşmeleri hem de görünürlüğünü besler. Ne kadar 'sen' olursan, ağ seni o kadar iyi bulur.",
    canvaPrompts: [
      "Flat vector illustration of a customizable digital identity card blooming like a flower with interest-tag petals in the 6 brand colors (teal, blue, indigo, pink, orange, yellow), dark navy background — no text, no letters.",
      "Isometric illustration of a person arranging glowing interest icons (coffee, code, music, airplane) onto a profile board, warm gold lighting, Gen Z clean style — completely text-free.",
      "Minimalist illustration of a mirror reflecting a stylized avatar surrounded by orbiting colorful interest orbs, gradient teal-to-pink — no words or typography.",
    ],
    linkedinPost: `🪞 Seni sen yapan detaylar, doğru bağlantıları da getirir.
CorteQS'te profilini ve ilgi alanlarını seç — kahveden koda, girişimcilikten anne-baba topluluğuna.

Ne kadar "sen" olursan, akışın da o kadar sana benzer. 🌟

Profilini 2 dakikada güncelle, ağ seni bulsun.
👉 corteqs.net

#KişiselMarka #Diaspora #Topluluk`,
  },
  {
    id: "tool-4",
    order: 4,
    category: "baglan",
    name: "Cadde Feed",
    description:
      "Şehir bazlı diaspora sosyal akışını, ilgi alanlarına ve yakınlığına göre kişiselleştirilmiş şekilde gösterir. Alakasız içerik değil, işine yarayan bağlantı.",
    canvaPrompts: [
      "Flat illustration of a vibrant city street viewed from above, morphing into a social feed of floating cards, golden-hour light, navy and gold, Gen Z maximalist — no text anywhere.",
      "Isometric illustration of a glowing personalized feed column rising out of a stylized city skyline, colorful interest particles flowing into it, brand pinwheel colors — text-free, no typography.",
      "Abstract illustration of layered translucent content cards ranked by glowing intensity, smooth gradient background indigo to teal — no letters, no numbers, no words.",
    ],
    linkedinPost: `📲 Akışın artık herkesin değil, SENİN şehrinin.
Cadde, bulunduğun şehirdeki Türk diasporasının nabzını tutuyor: etkinlikler, sorular, fırsatlar, gündem.

İlgi alanlarına göre kişileşen bir akış — alakasız içerik değil, işine yarayan bağlantı. 🔥

Şehrinde neler oluyor, gör.
👉 corteqs.net/cadde

#Cadde #Diaspora #Topluluk`,
  },
  {
    id: "tool-5",
    order: 5,
    category: "baglan",
    name: "Cadde Profil Kapısı",
    description:
      "Cadde'ye girişte ülke/şehir bilgini doğrular; eksikse içerik bulanık görünür ve tamamlaman için yönlendirir. Akışın gerçekten yerel ve güvenilir kalmasını sağlar.",
    canvaPrompts: [
      "Illustration of a frosted-glass door glowing gold at the edges, behind it a blurry vibrant community scene becoming sharp, dark background — no text, no letters.",
      "Isometric illustration of a stylized key made of a location pin unlocking a luminous community sphere, teal and gold, Gen Z aesthetic — completely text-free.",
      "Minimalist illustration of a blurred crowd sharpening into focus as a golden location marker drops in, gradient navy to indigo — no words or typography.",
    ],
    linkedinPost: `📍 Güvenli topluluk, doğrulanmış komşularla başlar.
Cadde'ye girerken şehrini doğruluyoruz — çünkü senin akışın gerçekten senin şehrinden insanlarla dolsun istiyoruz.

Bot yok, troll yok, "nereden çıktı bu" yok. Sadece gerçek diaspora. ✅

Şehrini ekle, kapı açılsın.
👉 corteqs.net/cadde

#Güven #Diaspora #Topluluk`,
  },
  {
    id: "tool-6",
    order: 6,
    category: "baglan",
    name: "Cadde Köprü",
    description:
      "Türkiye ile diaspora arasında ortak bir akış kurar; yurda dönenler ya da Türkiye'deki topluluklar diaspora ile köprü üzerinden paylaşım yapar. İki dünya, tek topluluk.",
    canvaPrompts: [
      "Flat vector illustration of a glowing golden bridge connecting two stylized landmasses — one warm-toned (homeland), one cool-toned (diaspora cities), small birds crossing — no text, no letters.",
      "Isometric illustration of two glowing hands reaching across a starry gap to form a bridge of light, gold and teal, Gen Z modern — completely text-free.",
      "Abstract illustration of two pulsing circles linked by a luminous arc carrying small floating message bubbles, indigo-to-gold gradient — no words anywhere.",
    ],
    linkedinPost: `🌉 Memleket ile gurbet aynı akışta.
Cadde Köprü, Türkiye'deki ve dünyadaki Türkleri tek bir hatta bağlıyor.

Dönüş planı mı yapıyorsun? Oradan birine mi ulaşman lazım? Köprü tam da bunun için. 🇹🇷🤝🌍

İki dünya, tek topluluk.
👉 corteqs.net/cadde

#Köprü #Diaspora #Memleket`,
  },
  {
    id: "tool-7",
    order: 7,
    category: "baglan",
    name: "Cadde Cafe",
    description:
      "1–6 saatlik süreli sohbet odaları kurarsın ya da katılırsın (açık, onaylı veya davet kodlu); oda kapanmadan uyarı alırsın, sonra salt-okunur arşive döner. Baskı yok, anın sohbeti var.",
    canvaPrompts: [
      "Cozy illustration of a glowing floating café table with steaming cups and speech-bubble lights around it, a soft countdown ring of gold gently dissolving, dark warm background — no text, no numbers.",
      "Isometric illustration of a translucent timed room bubble with diverse avatars chatting inside, an hourglass of golden light beside it, brand colors — completely text-free.",
      "Minimalist illustration of several chat-bubble orbs gathering in a warm circle then gently fading like embers, navy-to-orange gradient — no words or letters.",
    ],
    linkedinPost: `☕⏳ Bir kahve süresi kadar sohbet.
Cadde Cafe'de 1-6 saatlik geçici odalar açılıyor: "Münih'te yeni gelenler", "bu akşam maç", "freelance vergi sohbeti"...

Süre dolunca oda arşive geçiyor — baskı yok, spam yok, sadece anın sohbeti. 🔥

Bir oda aç, şehrini çağır.
👉 corteqs.net/cadde

#CaddeCafe #Diaspora #Topluluk`,
  },
  {
    id: "tool-8",
    order: 8,
    category: "kullan",
    name: "Cadde Çarşı",
    description:
      "Kullanıcıdan kullanıcıya pazar; 7 kategoride ilan yayınlar, güncellersin, pasife alırsın. İlanlar 30 gün yaşar ve biri ilgilendiğinde bildirim alırsın. Güvenilir, yerel, senin dilinde.",
    canvaPrompts: [
      "Vibrant flat illustration of a digital bazaar — floating market stalls as glowing cards with abstract goods, golden lanterns, navy sky, Gen Z maximalist — no text, no letters, no price tags.",
      "Isometric illustration of a hand passing a glowing parcel to another hand across two phone screens, gold and teal, modern marketplace vibe — completely text-free.",
      "Minimalist illustration of a stylized Turkish bazaar arch reimagined as a neon digital portal with floating item icons, brand pinwheel colors — no words or typography.",
    ],
    linkedinPost: `🏷️ Gurbette ihtiyacın olan şey, bir komşunda olabilir.
Cadde Çarşı, Türkten Türke pazar yeri: ikinci el eşya, hizmet, "taşınıyorum satıyorum" ilanları...

İlan ver, biri ilgilenince haber al. Güvenilir, yerel, senin dilinde. 🛍

Çarşıya çık, ilanını as.
👉 corteqs.net/cadde/carsi

#Çarşı #Diaspora #İkinciEl`,
  },
  {
    id: "tool-9",
    order: 9,
    category: "kullan",
    name: "Cadde Tanıtım",
    description:
      "İşletmen ya da etkinliğin için sponsorlu görünürlük kampanyası oluşturursun; admin onayından sonra belirlediğin tarih aralığında 'Sponsorlu' rozetiyle akışta öne çıkarsın. Küçük işletmeysen sahnen hazır.",
    canvaPrompts: [
      "Flat illustration of a glowing spotlight beam lifting one card above a crowd of cards, golden sparkle ring, dark navy stage background — no text, no letters, no logos.",
      "Isometric illustration of a small business storefront card floating on a rising golden rocket of light above a city feed, brand colors, Gen Z clean — completely text-free.",
      "Minimalist illustration of a megaphone made of light radiating colorful waves over tiny city rooftops, teal-gold-pink palette — no words or typography anywhere.",
    ],
    linkedinPost: `📣 İşini doğru şehirdeki doğru insanlara duyur.
Cadde Tanıtım ile etkinliğini ya da işletmeni, hedeflediğin şehirdeki diaspora akışında öne çıkar.

Şeffaf "Sponsorlu" rozeti, net tarih aralığı, gerçek yerel görünürlük. 🚀

Küçük işletmeysen, sahnen hazır.
👉 corteqs.net/cadde

#Küçükİşletme #Diaspora #Tanıtım`,
  },
  {
    id: "tool-10",
    order: 10,
    category: "koru",
    name: "Cadde Şikâyet / Moderasyon",
    description:
      "Uygunsuz içeriği şikâyet edersin; rapor moderasyon kuyruğuna düşer ve ekip içeriği gizleme, yayınlama ya da engelleme kararı verir. Topluluğu temiz ve güvenli tutar.",
    canvaPrompts: [
      "Illustration of a glowing protective shield hovering over a community of small avatars, gentle gold light filtering out dark shards, navy background — no text, no letters.",
      "Isometric illustration of a friendly flag-raise gesture sending a report card into a sorting funnel that glows green when cleared, brand colors — completely text-free.",
      "Minimalist illustration of a balance scale made of light keeping a community circle calm and bright, teal and gold — no words or typography.",
    ],
    linkedinPost: `🛡️ Topluluğu birlikte temiz tutuyoruz.
Cadde'de bir şey ters mi gitti? Tek dokunuşla şikâyet et — ekibimiz inceleyip gerekeni yapsın.

Güvenli alan, herkesin hakkı. Senin paylaşımın da, huzurun da korunsun. ✨

Gördüğünü bildir, topluluğun bekçisi ol.
👉 corteqs.net/cadde

#GüvenliTopluluk #Diaspora #Moderasyon`,
  },
];
