// Admin Panel V2 — Sosyal Medya Paylaşım Deposu (statik tek kaynak).
// /admin/social-share-vault sayfası bu listeden beslenir. 10 platform aracı için
// hazır pazarlama içeriği: her araç için 2 metinsiz ChatGPT görsel promptu (İngilizce,
// square 1:1 / no-text kuralları promptun içine gömülü), 1 kopyala-yapıştır Türkçe
// LinkedIn postu, 1 Türkçe Instagram postu ve 1 Türkçe Reddit postu (daha az satış
// dili, soru/tartışma tonu — subreddit kurallarına göre editlenmesi gerekebilir).
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
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
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
    imagePrompts: [
      "A premium modern editorial 3D illustration of a warm cream-colored world globe rendered in soft rounded geometry, with a friendly oversized magnifying glass made of glossy teal glass hovering above it and gently highlighting a cluster of small rounded location-pin shapes in orange, blue, indigo, pink and yellow scattered across the globe's surface; the globe and magnifier are perfectly centered and sit safely inside a square 1:1 frame at a recommended 1024x1024 resolution, with generous padding so nothing touches or crosses the edges; soft cinematic studio lighting casts smooth gradients and gentle shadows across the warm cream background, giving the scene subtle depth and a polished, professional SaaS product-illustration feel; the composition reads clearly even at small thumbnail size thanks to a single bold visual hierarchy (globe plus magnifier) with no secondary clutter; the mood is optimistic, inclusive and welcoming; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, and no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a friendly rounded teal search-bar shape floating at the center of a warm cream square canvas, with several small glossy silhouette busts in orange, blue, indigo, pink and yellow gently emerging from behind it like a diverse crowd being discovered, arranged in a balanced circular composition around the search shape; every figure and the search bar itself sit comfortably inside the square 1:1 frame at 1024x1024 recommended size, well clear of all four edges; soft cinematic lighting produces smooth gradients and rounded, friendly forms with subtle depth, giving a polished and inclusive technology-brand aesthetic suitable for both a small website card and a large hero banner; the overall shape reads instantly at thumbnail scale; the tone is professional, optimistic and community-oriented; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `🌍 Berlin'de avukat mı arıyorsun? Toronto'da yazılımcı mı?
Artık "tanıdık bir tanıdık" beklemek yok.

CorteQS Dizin'de 80+ kategoride, 251 ülkeye yayılmış Türk profesyonelleri tek aramayla bul. Şehir yaz, meslek yaz, isim yaz — gerisini ağ halletsin. 🔎

Senin insanın bir arama uzağında.
👉 corteqs.net'te aramaya başla.

#Diaspora #TürkDiasporası #Networking`,
    instagramPost: `🔎 "Bu şehirde tanıdığım biri var mı?" diye düşünmeyi bırak.

CorteQS Dizin'de yaz: şehir, meslek, isim... 80+ kategori, 251 ülke, tek arama. Aradığın insan zaten burada, sadece bulman gerekiyor 🌍

👉 Ücretsiz kayıt ol, bio'daki linkten başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Networking #Gurbet #YurtDışı #TürkTopluluğu #Dizin #Keşfet #TürkProfesyoneller #DünyadaTürkler #CorteQS #Bağlantı`,
    redditPost: `Yurt dışında yaşayan Türkler için bir "dizin" fikri, işe yarar mı?

Uzun zamandır aklımda olan bir soru: Bulunduğunuz şehirde belirli bir meslekten (avukat, doktor, yazılımcı, esnaf ne olursa) bir Türk aramanız gerektiğinde ne yapıyorsunuz? Genelde ya Facebook gruplarında soruyorum ya da tanıdığın tanıdığını buluyorsun.

CorteQS diye bir platform 80+ kategoride, 251 ülkeye yayılmış profilleri arama üzerinden bulmayı deniyor — şehir, meslek ya da isimle arıyorsunuz. Kullanan var mı, deneyimi olan var mı merak ediyorum. Böyle bir ihtiyaç gerçekten var mı yoksa herkes zaten kendi çevresinden mi hallediyor?

Site: corteqs.net`,
  },
  {
    id: "tool-2",
    order: 2,
    category: "kesfet",
    name: "AI Eşleştirme",
    description:
      "Sunduğun ya da aradığın şeyi yazarsın; yapay zeka alan, şehir, ülke ve kategoriye göre sana en uygun eşleşmeleri skor ve kısa gerekçeyle getirir. Saatlerce profil karıştırmak yok, akıllı eşleşme var.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of two smooth rounded puzzle-piece forms, one in teal and one in warm orange, gently floating toward each other at the exact center of a warm cream square canvas, with a soft glowing indigo spark forming in the small gap between them to suggest an intelligent match; delicate blue, pink and yellow particle dots drift around the pieces like gentle data signals, all kept well within the square 1:1 frame at 1024x1024 recommended size so nothing touches the edges; soft cinematic lighting creates smooth gradients and rounded, friendly volumes with subtle depth, producing a polished, optimistic SaaS-technology look that reads clearly at thumbnail size and works equally well as a website card or hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a friendly rounded teal orb with a soft glowing indigo core, representing a helpful intelligence, centered on a warm cream square background, gently scanning a balanced circular arrangement of small rounded profile-card shapes in orange, blue, pink and yellow floating around it like petals, with one card lifted slightly and haloed in soft golden-orange light to show it is the best match; every element stays safely inside the square 1:1 frame at 1024x1024 recommended resolution with clear margin from all sides; smooth gradients, soft cinematic lighting and rounded forms give the scene gentle depth and a professional, inclusive, optimistic technology-brand mood that stays legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `🤖✨ Aradığını yazmak yeterli.
"Amsterdam'da mentor arıyorum" yaz — CorteQS'in yapay zekası şehir, meslek ve hedefe göre sana EN uygun kişileri eşleştirsin.

Saatlerce profil karıştırma yok. Sadece akıllı eşleşme, sana özel gerekçeyle. 🎯

Gurbet büyük; doğru kişi yakın.
👉 corteqs.net

#YapayZeka #Diaspora #Eşleşme`,
    instagramPost: `🤖 Ne aradığını yaz, gerisini yapay zeka halletsin.

Şehir, meslek, hedef — hepsini eşleştirip sana EN uygun kişileri saniyeler içinde getiriyoruz. Profil karıştırmak devri bitti ✨

👉 Ücretsiz kayıt ol, bio'daki linkten dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YapayZeka #AIEşleştirme #Diaspora #TürkDiasporası #Networking #Mentorluk #Gurbet #YurtDışı #TeknolojiyleBağlan #CorteQS #Eşleşme`,
    redditPost: `AI destekli "kimin ne aradığını" eşleştiren bir diaspora ağı denedim, düşünceleriniz ne olur bilmiyorum

Genelde bu tür networking siteleri profil listesi sunup "aramanı sana bırakıyor" ama CorteQS'te bir arama kutusuna direkt "Amsterdam'da mentor arıyorum" gibi yazınca şehir/meslek/hedefe göre bir sıralama + kısa gerekçe ile eşleşme öneriyor.

Amaç profil karıştırmayı azaltmak. Merak ettiğim: bu tür bir eşleştirme gerçekten işe yarıyor mu yoksa sonuçta yine manuel filtrelemeden farksız mı oluyor? Kullanmış olan varsa deneyimini duymak isterim.

corteqs.net`,
  },
  {
    id: "tool-3",
    order: 3,
    category: "kesfet",
    name: "Profil / İlgi Alanı Editörü",
    description:
      "Profilini, rolünü ve ilgi alanlarını düzenlersin; bu bilgiler hem akışındaki eşleşmeleri hem de görünürlüğünü besler. Ne kadar 'sen' olursan, ağ seni o kadar iyi bulur.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a rounded teal profile-card shape at the center of a warm cream square canvas, blooming outward like a flower into six soft glossy petal shapes colored orange, blue, indigo, pink, yellow and a lighter teal, each petal representing a different personal interest, arranged in a perfectly balanced circular composition; the whole bloom is centered and comfortably contained within the square 1:1 frame at 1024x1024 recommended size, with ample space before any edge; soft cinematic lighting produces smooth gradients, gentle shadows and subtle depth across the rounded forms, giving a polished, friendly, professional technology-brand aesthetic that stays instantly readable at small thumbnail scale; the mood is warm, personal and optimistic; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a smooth rounded oval mirror shape standing upright at the center of a warm cream square background, reflecting a simplified glossy teal avatar silhouette, surrounded by small orbiting rounded interest-icons in orange, blue, indigo, pink and yellow gently circling the mirror like satellites in a balanced radial layout; every shape sits safely within the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four borders; soft cinematic lighting creates smooth gradients and rounded, friendly volumes with subtle depth, producing an inclusive, optimistic and polished SaaS-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `🪞 Seni sen yapan detaylar, doğru bağlantıları da getirir.
CorteQS'te profilini ve ilgi alanlarını seç — kahveden koda, girişimcilikten anne-baba topluluğuna.

Ne kadar "sen" olursan, akışın da o kadar sana benzer. 🌟

Profilini 2 dakikada güncelle, ağ seni bulsun.
👉 corteqs.net

#KişiselMarka #Diaspora #Topluluk`,
    instagramPost: `🪞 Profilin ne kadar "sen"se, ağ seni o kadar iyi bulur.

Kahveden koda, girişimcilikten anne-baba topluluğuna — ilgi alanlarını seç, doğru bağlantılar akışına gelsin ✨

👉 2 dakikada profilini güncelle, bio'daki linkten kayıt ol!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KişiselMarka #Diaspora #TürkDiasporası #Profil #Topluluk #Gurbet #YurtDışı #KendiniTanıt #Networking #CorteQS`,
    redditPost: `Profilindeki ilgi alanları eşleşme kalitesini gerçekten değiştiriyor mu?

CorteQS'te profil/ilgi alanı düzenleme kısmı var — rol ve ilgi alanlarını ne kadar doldurursan akıştaki eşleşmelerin ve görünürlüğün o kadar iyi besleniyormuş diye açıklanıyor. Mantıklı geliyor ama gerçekten fark yaratıyor mu emin değilim.

Herhangi bir networking/topluluk platformunda profil detayını doldurmanın gerçekten sonuç getirdiğini gördünüz mü, yoksa çoğu insan zaten boş bırakıp geçiyor mu?

corteqs.net`,
  },
  {
    id: "tool-4",
    order: 4,
    category: "baglan",
    name: "Cadde Feed",
    description:
      "Şehir bazlı diaspora sosyal akışını, ilgi alanlarına ve yakınlığına göre kişiselleştirilmiş şekilde gösterir. Alakasız içerik değil, işine yarayan bağlantı.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a warm cream square canvas with a soft rounded teal city-skyline silhouette gently rising from the bottom, smoothly transforming above it into a vertical stack of three rounded feed-card shapes colored orange, indigo and pink, all centered along a single balanced vertical axis; the skyline and cards are scaled to sit entirely within the square 1:1 frame at 1024x1024 recommended size with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle highlights across the rounded forms, adding subtle depth and a polished, optimistic, community-oriented SaaS aesthetic that remains legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a glossy teal location-pin shape standing at the center of a warm cream square background, with soft rounded content-card shapes in orange, blue, pink and yellow flowing outward from it in a gentle balanced spiral, like a personalized stream of local updates; every card and the pin stay comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting give the rounded shapes subtle depth and a warm, polished, professional feel suited to both a small card and a large hero image; the mood is lively yet calm and inclusive; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `📲 Akışın artık herkesin değil, SENİN şehrinin.
Cadde, bulunduğun şehirdeki Türk diasporasının nabzını tutuyor: etkinlikler, sorular, fırsatlar, gündem.

İlgi alanlarına göre kişileşen bir akış — alakasız içerik değil, işine yarayan bağlantı. 🔥

Şehrinde neler oluyor, gör.
👉 corteqs.net/cadde

#Cadde #Diaspora #Topluluk`,
    instagramPost: `📲 Akışın artık herkesin değil, SENİN şehrinin!

Cadde'de şehrindeki Türklerin nabzı: etkinlik, soru, fırsat, gündem — hepsi ilgi alanlarına göre kişisel akışında 🔥

👉 Ücretsiz kayıt ol, şehrinde neler oluyor gör!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#Cadde #Diaspora #TürkDiasporası #Topluluk #ŞehirAğı #Gurbet #YurtDışı #SosyalAkış #TürkleriBul #CorteQS`,
    redditPost: `Şehir bazlı, sadece o şehirdeki insanlara özel bir sosyal akış — mantıklı mı?

CorteQS'in "Cadde" diye bir feed'i var; global bir akış değil, bulunduğun şehirdeki diaspora paylaşımlarını (etkinlik, soru, fırsat vb.) gösteriyor. Fikir olarak "alakasız içerik yerine işine yarayan bağlantı" mantığı hoşuma gitti ama böyle nişleşmiş bir feed'in kritik kütleye ulaşması genelde zor oluyor.

Şehir bazlı topluluk feed'i deneyimi olan var mı? Küçük şehirlerde bu tür şeyler genelde ölü kalıyor mu?

corteqs.net/cadde`,
  },
  {
    id: "tool-5",
    order: 5,
    category: "baglan",
    name: "Cadde Profil Kapısı",
    description:
      "Cadde'ye girişte ülke/şehir bilgini doğrular; eksikse içerik bulanık görünür ve tamamlaman için yönlendirir. Akışın gerçekten yerel ve güvenilir kalmasını sağlar.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a smooth rounded teal doorway shape standing centered on a warm cream square canvas, its frosted glass-like surface glowing softly at the edges in orange and pink, with a gentle rounded location-pin key shape floating just in front of it, about to unlock the door; behind the glass, softly blurred rounded community shapes in blue, indigo and yellow hint at a warm gathering waiting inside; the whole scene sits safely within the square 1:1 frame at 1024x1024 recommended size, well away from all edges; soft cinematic lighting produces smooth gradients and subtle depth across the rounded forms, giving a trustworthy, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded teal shield shape centered on a warm cream square background, gently overlapping with a small glossy location-pin shape in orange to symbolize a verified neighborhood, surrounded by a balanced circle of softly blurred rounded figure silhouettes in blue, indigo, pink and yellow that grow sharper and clearer toward the center; every shape is scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous margin from the border; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, professional, inclusive mood that stays legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `📍 Güvenli topluluk, doğrulanmış komşularla başlar.
Cadde'ye girerken şehrini doğruluyoruz — çünkü senin akışın gerçekten senin şehrinden insanlarla dolsun istiyoruz.

Bot yok, troll yok, "nereden çıktı bu" yok. Sadece gerçek diaspora. ✅

Şehrini ekle, kapı açılsın.
👉 corteqs.net/cadde

#Güven #Diaspora #Topluluk`,
    instagramPost: `📍 Güvenli topluluk, doğrulanmış komşularla başlar.

Cadde'ye girerken şehrini doğruluyoruz — bot yok, troll yok, sadece gerçek diaspora ✅ Şehrini ekle, kapı açılsın.

👉 Ücretsiz kayıt ol, bio'daki linkten katıl!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#Güven #Diaspora #TürkDiasporası #Topluluk #Cadde #Gurbet #YurtDışı #GüvenliTopluluk #ŞehirDoğrulama #CorteQS`,
    redditPost: `Şehir doğrulaması olmadan girilemeyen bir topluluk akışı — troll/bot sorununa çözüm olur mu?

CorteQS'in Cadde bölümünde şehir bilgini doğrulamadan içerik bulanık kalıyor, yani "gerçekten o şehirde misin" kontrolü yapılıyor. Amaç akışın gerçek yerel insanlarla dolu kalması.

Bu tür doğrulama mekanizmalarının bot/troll sorununu gerçekten azalttığını düşünenler var mı? Yoksa sonuçta yalan beyan etmek çok kolay, bu da göstermelik bir bariyer mi oluyor?

corteqs.net/cadde`,
  },
  {
    id: "tool-6",
    order: 6,
    category: "baglan",
    name: "Cadde Köprü",
    description:
      "Türkiye ile diaspora arasında ortak bir akış kurar; yurda dönenler ya da Türkiye'deki topluluklar diaspora ile köprü üzerinden paylaşım yapar. İki dünya, tek topluluk.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of two soft rounded landmass shapes on a warm cream square canvas, one tinted warm orange and the other cool teal, connected by a glossy rounded bridge arc in indigo stretching between them at the center of the frame, with a few small rounded bird shapes in pink and yellow gently crossing above the bridge; the entire composition is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a warm, hopeful, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, reaching toward each other across a gentle gap at the center of a warm cream square background, with a delicate arc of small glowing message-bubble shapes in indigo, pink and yellow floating along the space between them like a bridge of conversation; every element is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, optimistic, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `🌉 Memleket ile gurbet aynı akışta.
Cadde Köprü, Türkiye'deki ve dünyadaki Türkleri tek bir hatta bağlıyor.

Dönüş planı mı yapıyorsun? Oradan birine mi ulaşman lazım? Köprü tam da bunun için. 🇹🇷🤝🌍

İki dünya, tek topluluk.
👉 corteqs.net/cadde

#Köprü #Diaspora #Memleket`,
    instagramPost: `🌉 Memleket ile gurbet aynı akışta!

Cadde Köprü, Türkiye'deki ve dünyadaki Türkleri tek hatta bağlıyor. Dönüş mü planlıyorsun, oradan birine mi ulaşman lazım? Tam senlik 🇹🇷🤝🌍

👉 Ücretsiz kayıt ol, bio'daki linkten katıl!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#Köprü #Diaspora #TürkDiasporası #Memleket #Cadde #Gurbet #YurtDışı #İkiVatan #TürkiyeİleBağlan #CorteQS`,
    redditPost: `Türkiye'deki ve dışarıdaki Türkleri aynı akışta buluşturan bir "köprü" özelliği var, kullanışlı mı sizce

CorteQS'te "Cadde Köprü" diye bir bölüm, yurda dönenlerin ya da Türkiye'deki toplulukların diaspora ile ortak paylaşım yapabildiği bir yer olarak tanıtılıyor. Fikir hoş ama genelde bu tür "iki tarafı birleştirelim" özellikleri kullanım oranı düşük kalıyor çünkü ihtiyaç anlık oluyor (biri döneceği zaman, ya da oradan birine ulaşmak gerektiğinde).

Geri dönüş planlayan ya da Türkiye'den diasporaya ulaşmaya çalışan biri var mı burada, böyle bir şey işinize yarar mıydı?

corteqs.net/cadde`,
  },
  {
    id: "tool-7",
    order: 7,
    category: "baglan",
    name: "Cadde Cafe",
    description:
      "1–6 saatlik süreli sohbet odaları kurarsın ya da katılırsın (açık, onaylı veya davet kodlu); oda kapanmadan uyarı alırsın, sonra salt-okunur arşive döner. Baskı yok, anın sohbeti var.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a small rounded cafe-table shape at the center of a warm cream square canvas, with two glossy rounded cup shapes on top gently releasing soft curling steam rendered as smooth teal ribbons, surrounded by a balanced ring of small floating rounded speech-bubble shapes in orange, indigo, pink and yellow; a thin circular light ring, like a gentle countdown glow, softly frames the whole table; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin on all sides; soft cinematic lighting produces smooth gradients and subtle depth, giving a cozy, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a cluster of soft rounded speech-bubble shapes in teal, orange, indigo, pink and yellow gathered closely together like embers around a warm glow at the center of a cream square background, with one bubble slightly larger and centered to anchor the balanced circular composition; the cluster is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting create subtle depth and a warm, friendly, polished mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `☕⏳ Bir kahve süresi kadar sohbet.
Cadde Cafe'de 1-6 saatlik geçici odalar açılıyor: "Münih'te yeni gelenler", "bu akşam maç", "freelance vergi sohbeti"...

Süre dolunca oda arşive geçiyor — baskı yok, spam yok, sadece anın sohbeti. 🔥

Bir oda aç, şehrini çağır.
👉 corteqs.net/cadde

#CaddeCafe #Diaspora #Topluluk`,
    instagramPost: `☕ Bir kahve süresi kadar sohbet!

Cadde Cafe'de 1-6 saatlik geçici odalar açılıyor: yeni gelenler sohbeti, maç akşamı, vergi muhabbeti... Süre dolunca arşive geçiyor, baskı yok ⏳

👉 Bir oda aç, şehrini çağır! Ücretsiz kayıt ol.
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#CaddeCafe #Diaspora #TürkDiasporası #Topluluk #Sohbet #Gurbet #YurtDışı #AnınSohbeti #ŞehirOdaları #CorteQS`,
    redditPost: `1-6 saat açık kalıp sonra salt-okunur arşive dönen geçici sohbet odaları — bu format işe yarar mı?

CorteQS'te "Cadde Cafe" diye bir özellik, süreli (1-6 saat) sohbet odaları açmaya izin veriyor: açık, onaylı ya da davet kodlu olabiliyor. Süre dolunca oda arşive geçiyor. Fikir Discord/Clubhouse'daki geçici oda mantığına benziyor ama "sonra tamamen arşivlenip kapanma" kısmı ilginç, sürekli açık kalan gruplardan farklı bir dinamik yaratıyor.

Bu tür zaman-sınırlı, sonra kapanan oda formatını deneyen oldu mu, katılım gerçekten artıyor mu yoksa insanlar "zaten kapanacak" diye ciddiye almıyor mu?

corteqs.net/cadde`,
  },
  {
    id: "tool-8",
    order: 8,
    category: "kullan",
    name: "Cadde Çarşı",
    description:
      "Kullanıcıdan kullanıcıya pazar; 7 kategoride ilan yayınlar, güncellersin, pasife alırsın. İlanlar 30 gün yaşar ve biri ilgilendiğinde bildirim alırsın. Güvenilir, yerel, senin dilinde.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a balanced row of small rounded market-stall shapes on a warm cream square canvas, each stall a soft glossy card in a different accent color — orange, blue, indigo, pink and yellow — arranged symmetrically around a central teal stall that is slightly larger and highlighted; simple rounded abstract goods shapes rest on each stall without any readable detail; the whole marketplace scene is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a lively yet polished, trustworthy, professional feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, passing a small rounded gift-box parcel shape between them at the exact center of a warm cream square background, with faint rounded phone-screen outlines behind each hand suggesting a digital handoff, and a few small floating rounded sparkle accents in indigo, pink and yellow around the parcel; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, trustworthy, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `🏷️ Gurbette ihtiyacın olan şey, bir komşunda olabilir.
Cadde Çarşı, Türkten Türke pazar yeri: ikinci el eşya, hizmet, "taşınıyorum satıyorum" ilanları...

İlan ver, biri ilgilenince haber al. Güvenilir, yerel, senin dilinde. 🛍

Çarşıya çık, ilanını as.
👉 corteqs.net/cadde/carsi

#Çarşı #Diaspora #İkinciEl`,
    instagramPost: `🏷️ İhtiyacın olan şey, bir komşunda olabilir!

Cadde Çarşı, Türkten Türke pazar yeri: ikinci el eşya, hizmet, "taşınıyorum satıyorum" ilanları. İlan ver, biri ilgilenince haber al 🛍

👉 Ücretsiz kayıt ol, çarşıya çık!
🔗 corteqs.net/cadde/carsi
💬 WhatsApp topluluğu bio'da.

#Çarşı #Diaspora #TürkDiasporası #İkinciEl #Pazaryeri #Gurbet #YurtDışı #GüvenilirAlışveriş #TürktenTürke #CorteQS`,
    redditPost: `Türkten Türke ikinci el pazar yeri fikri — 30 günlük ilan ömrü mantıklı mı?

CorteQS'in "Çarşı" bölümü, 7 kategoride ilan verip biri ilgilenince bildirim aldığın bir kullanıcıdan-kullanıcıya pazar yeri. İlanlar 30 gün sonra otomatik düşüyor. Facebook Marketplace'e alternatif olarak "aynı topluluktan olma" güvenini öne çıkarıyorlar.

Yurt dışında yaşayanlar için: taşınma/eşya devretme gibi ihtiyaçlarda genel platformlar (Marketplace, eBay Kleinanzeigen vs.) yeterli mi, yoksa "sadece Türklerle" niş bir pazar yerine gerçekten ihtiyaç var mı?

corteqs.net/cadde/carsi`,
  },
  {
    id: "tool-9",
    order: 9,
    category: "kullan",
    name: "Cadde Tanıtım",
    description:
      "İşletmen ya da etkinliğin için sponsorlu görünürlük kampanyası oluşturursun; admin onayından sonra belirlediğin tarih aralığında 'Sponsorlu' rozetiyle akışta öne çıkarsın. Küçük işletmeysen sahnen hazır.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a single soft rounded storefront-card shape in warm orange lifted gently above a cluster of smaller rounded cream and teal cards, centered on a warm cream square canvas, with a soft glowing spotlight cone in golden-yellow light shining down on the lifted card from above; small sparkle accents in pink and indigo drift around it in a balanced radial pattern; the whole scene stays fully within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a confident, polished, optimistic small-business feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a smooth rounded megaphone shape in teal at the center of a warm cream square background, gently radiating soft rounded wave-arcs in orange, blue, pink and yellow outward in a balanced symmetrical pattern, with a few tiny rounded rooftop shapes below hinting at a city neighborhood being reached; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and an energetic yet professional, optimistic mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `📣 İşini doğru şehirdeki doğru insanlara duyur.
Cadde Tanıtım ile etkinliğini ya da işletmeni, hedeflediğin şehirdeki diaspora akışında öne çıkar.

Şeffaf "Sponsorlu" rozeti, net tarih aralığı, gerçek yerel görünürlük. 🚀

Küçük işletmeysen, sahnen hazır.
👉 corteqs.net/cadde

#Küçükİşletme #Diaspora #Tanıtım`,
    instagramPost: `📣 İşini doğru şehirdeki doğru insanlara duyur!

Cadde Tanıtım ile işletmeni veya etkinliğini hedef şehrindeki diaspora akışında öne çıkar. Şeffaf "Sponsorlu" rozeti, net tarih, gerçek görünürlük 🚀

👉 Küçük işletmeysen sahnen hazır, ücretsiz kayıt ol!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#Küçükİşletme #Diaspora #TürkDiasporası #Tanıtım #Cadde #Girişimcilik #Gurbet #YurtDışı #İşimiBüyüt #CorteQS`,
    redditPost: `Şeffaf "Sponsorlu" rozetiyle çalışan yerel bir tanıtım özelliği — küçük işletmeler için mantıklı fiyatlandırma nasıl olmalı?

CorteQS'te "Cadde Tanıtım" diye bir özellik var; işletme ya da etkinliğini admin onayından sonra belirlediğin tarih aralığında "Sponsorlu" rozetiyle hedef şehrindeki akışta öne çıkarabiliyorsun. Küçük/yerel işletmeler için Google/Meta reklamlarına göre daha ucuz ve niş bir alternatif olarak konumlanıyor gibi.

Küçük işletme sahibi olanlar: bu tür niş/yerel reklam alanlarına gerçekten bütçe ayırır mısınız, yoksa genel platformlardaki reklam daha mı mantıklı geliyor?

corteqs.net/cadde`,
  },
  {
    id: "tool-10",
    order: 10,
    category: "koru",
    name: "Cadde Şikâyet / Moderasyon",
    description:
      "Uygunsuz içeriği şikâyet edersin; rapor moderasyon kuyruğuna düşer ve ekip içeriği gizleme, yayınlama ya da engelleme kararı verir. Topluluğu temiz ve güvenli tutar.",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a soft rounded shield shape in teal hovering protectively above a balanced circular cluster of small rounded figure-silhouette shapes in orange, blue, indigo, pink and yellow, centered on a warm cream square canvas, with a few gentle golden-light rays filtering softly from behind the shield onto the community below; the whole composition is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and subtle depth across the rounded forms, giving a safe, reassuring, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded balance-scale shape rendered entirely in smooth glossy teal light at the center of a warm cream square background, perfectly level, with small rounded orb shapes in orange, indigo, pink and yellow resting gently on either side to suggest fairness and calm oversight; the scale is centered and comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, trustworthy, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
    ],
    linkedinPost: `🛡️ Topluluğu birlikte temiz tutuyoruz.
Cadde'de bir şey ters mi gitti? Tek dokunuşla şikâyet et — ekibimiz inceleyip gerekeni yapsın.

Güvenli alan, herkesin hakkı. Senin paylaşımın da, huzurun da korunsun. ✨

Gördüğünü bildir, topluluğun bekçisi ol.
👉 corteqs.net/cadde

#GüvenliTopluluk #Diaspora #Moderasyon`,
    instagramPost: `🛡️ Topluluğu birlikte temiz tutuyoruz!

Cadde'de bir şey ters mi gitti? Tek dokunuşla şikâyet et, ekibimiz inceleyip gerekeni yapsın. Güvenli alan herkesin hakkı ✨

👉 Gördüğünü bildir, ücretsiz kayıt ol!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#GüvenliTopluluk #Diaspora #TürkDiasporası #Moderasyon #Cadde #Gurbet #YurtDışı #TopluluğunBekçisi #GüvenliAlan #CorteQS`,
    redditPost: `Kullanıcı bazlı şikayet + moderasyon kuyruğu sistemi olan bir topluluk platformu — ne kadar etkili olur?

CorteQS'in Cadde bölümünde uygunsuz içeriği tek dokunuşla şikayet edebiliyorsun, rapor moderasyon kuyruğuna düşüyor ve ekip gizleme/yayınlama/engelleme kararı veriyor. Standart bir şikayet-inceleme akışı ama küçük/yeni bir topluluk için moderasyon ekibinin hızı ve tutarlılığı genelde zayıf nokta oluyor.

Küçük ölçekli topluluklarda moderasyon deneyimi olan var mı — kullanıcı şikayetine dayalı sistemler yeterli mi oluyor yoksa otomatik filtreleme + insan moderasyon kombinasyonu şart mı?

corteqs.net/cadde`,
  },
];
