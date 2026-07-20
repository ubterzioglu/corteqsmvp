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
export const SOCIAL_SHARE_CATEGORY_LABELS: Record<SocialShareCategory, string> =
  {
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Dizin / Katalog Arama”. Show CorteQS Dizin as a searchable directory for discovering Turkish professionals, businesses and organizations by city, profession, name and category across the global diaspora. Scene: A Turkish woman in her early thirties sits at a bright neighborhood cafe in Berlin, searching on a slim laptop for a Turkish-speaking lawyer nearby. The screen shows a clean directory layout with profile portraits, category cards and map pins, but every interface label is intentionally unreadable. A notebook, transit card and coffee make the moment feel practical and lived-in; other professionals work softly out of focus behind her. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, camera, open book, and activity symbol. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Dizin / Katalog Arama”. Show CorteQS Dizin as a searchable directory for discovering Turkish professionals, businesses and organizations by city, profession, name and category across the global diaspora. Scene: Over the shoulder of a Turkish man newly arrived in Rotterdam as he uses a smartphone to find a local accountant through a people-and-business directory. The phone shows a grid of simplified profile portraits and location results without legible copy. In the background, he is standing near a contemporary community market where several small businesses and professionals are visible, making the discovery feel immediate and useful. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, camera, open book, and activity symbol. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “AI Eşleştirme”. Show CorteQS AI Eşleştirme turning a natural-language need into relevant people, opportunities or services using profession, location and category signals. Scene: A Turkish software professional at a contemporary coworking desk types a natural-language request into a laptop, looking for a mentor in Amsterdam. Several ranked profile cards are visible on screen as simple abstract interface shapes with no readable content, with one result clearly selected through layout and focus rather than text. Her expression shifts from concentration to recognition while soft daylight enters through large windows. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, profile badge, camera, and open book. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “AI Eşleştirme”. Show CorteQS AI Eşleştirme turning a natural-language need into relevant people, opportunities or services using profession, location and category signals. Scene: Two Turkish diaspora professionals meet for the first time at a quiet cafe after an intelligent platform match: one is an experienced product leader, the other an early-career designer. A phone on the table shows their matched profile photos with unreadable interface details. Their clear friendly handshake, open notebooks and engaged eye contact make the relevance of the match clear without futuristic effects. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, profile badge, camera, and open book. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Profil / İlgi Alanı Editörü”. Show how an authentic profile, role and interests improve visibility and personalize recommendations across the CorteQS network. Scene: A Turkish woman edits her CorteQS profile on a smartphone at a tidy home desk. Around her are recognizable objects that reveal her interests and role—a camera, running shoes, a design sketchbook, a small plant and a laptop—while the phone shows a portrait field and interest selections with no readable words. The scene communicates that a detailed, authentic profile improves visibility and recommendations. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, soft spotlight, megaphone silhouette, and audience dots. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Profil / İlgi Alanı Editörü”. Show how an authentic profile, role and interests improve visibility and personalize recommendations across the CorteQS network. Scene: A Turkish-origin architect in a shared studio reviews his professional profile on a laptop while colleagues work nearby. Architectural models, a bicycle helmet, books and a coffee cup naturally communicate his work and interests. The screen displays a polished profile page with photo, location and interest chips rendered as unreadable shapes; his relaxed expression suggests that the profile genuinely represents him. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, coffee cup, conversation bubbles, and round table symbol. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Feed”. Show Cadde as a living city-based community feed containing local questions, updates, events and opportunities that lead to real conversation. Scene: A Turkish commuter on a modern European tram scrolls through a local community feed on her phone. The screen contains realistic photo posts, event cards, questions and local opportunity tiles without readable text. Through the window, the city neighborhood is visible in morning light; her attentive expression shows that the feed is relevant to where she actually lives. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Feed”. Show Cadde as a living city-based community feed containing local questions, updates, events and opportunities that lead to real conversation. Scene: Three Turkish diaspora neighbors sit around a cafe table discussing a community post they have just opened on a tablet. The tablet shows a local feed with a city photo, a question card and event imagery, all copy intentionally blurred. Their body language is spontaneous and conversational, connecting the digital Cadde feed to real neighborhood life. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Profil Kapısı”. Show a complete, credible profile as the trusted entry point to Cadde, supporting relevance, verification and safer participation. Scene: A newcomer completes a detailed community profile on a laptop before joining Cadde. She sits in a calm apartment with a passport wallet, city transit card and professional notebook nearby; the interface shows photo, city, profession and interest fields as clean unreadable UI. A subtle green completion indicator and her relieved expression suggest a trusted, relevant entry process without showing private data. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Profil Kapısı”. Show a complete, credible profile as the trusted entry point to Cadde, supporting relevance, verification and safer participation. Scene: At the entrance of a small local networking event, a Turkish host warmly welcomes a new participant whose verified community profile is open on a phone. The screen is visible only as a clean portrait card with unreadable details. Other attendees converse in the softly lit room, illustrating safer participation built on a complete, credible identity rather than anonymity. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Köprü”. Show Cadde Köprü connecting people across cities and countries through practical conversation, shared needs and mutual support. Scene: A Turkish entrepreneur in Copenhagen and a Turkish supplier in Istanbul speak through a laptop video call, reviewing a shared sample on their desks. The screen shows both friendly human faces and a simple message thread with no readable copy. Matching teal and warm-orange notebook accents connect the two locations subtly while the honest working moment communicates a bridge across cities and countries. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Köprü”. Show Cadde Köprü connecting people across cities and countries through practical conversation, shared needs and mutual support. Scene: A recently arrived Turkish family meets two long-term local residents at a community-center table. They compare practical neighborhood information on a tablet, exchange phone numbers and laugh naturally over tea. Maps and paperwork remain present but unreadable, showing Cadde Köprü as real mutual support and conversation rather than a symbolic bridge. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Cafe”. Show Cadde Cafe as a lightweight live gathering space where spontaneous conversations can become genuine community connections. Scene: Four Turkish diaspora adults who did not previously know one another share coffee at a cozy independent cafe, leaning into an easy live conversation. One phone rests face-up with an active group-room interface made of participant portraits and an unreadable timer. Steam from real cups, natural gestures and warm window light make the gathering spontaneous rather than staged. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Cafe”. Show Cadde Cafe as a lightweight live gathering space where spontaneous conversations can become genuine community connections. Scene: A Turkish woman joins a live Cadde Cafe conversation from her kitchen in the evening. Her laptop shows several friendly participant faces in a clean video or audio-room layout without legible names, while a mug and half-finished dinner sit nearby. Her smile and attentive posture communicate a lightweight social space that can turn an ordinary evening into connection. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Çarşı”. Show Cadde Çarşı as a trusted diaspora marketplace for products, services and local peer-to-peer exchange. Scene: A Turkish small-business owner in a European neighborhood photographs handmade ceramic cups for a marketplace listing. A phone on a tripod frames the product while a laptop beside it shows a clean listing page with image slots, price fields and category cards, all text unreadable. Shelves, packaging materials and warm shop light make Cadde Çarşı feel like a trusted local marketplace. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Çarşı”. Show Cadde Çarşı as a trusted diaspora marketplace for products, services and local peer-to-peer exchange. Scene: A buyer and seller meet at a public cafe table to exchange a carefully packed second-hand espresso machine found through Cadde Çarşı. Both check the item together and confirm the handoff on their phones, whose interfaces are visible only as unreadable listing thumbnails. The scene feels safe, friendly and local, with no cash glamour or aggressive commerce. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shield, checkmark, and balanced scales. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Tanıtım”. Show Cadde Tanıtım helping a diaspora business, service or event reach the right local audience without aggressive advertising. Scene: A Turkish restaurant owner prepares a tasteful local promotion on a smartphone while standing inside a real, welcoming dining room before opening time. The phone shows a selected food photograph, audience area and preview card with no readable words. Deep-teal menus without text and a warm-orange napkin provide restrained CorteQS color cues; the owner looks focused rather than salesy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Tanıtım”. Show Cadde Tanıtım helping a diaspora business, service or event reach the right local audience without aggressive advertising. Scene: A community event organizer greets a newly arriving group at a small workshop that filled through a targeted Cadde promotion. A phone on the registration table shows the promoted event image and audience activity as unreadable UI. Real coats, tote bags and casual introductions make the visibility benefit tangible without megaphones, spotlights or advertising clichés. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Şikâyet / Moderasyon”. Show calm and fair community moderation: reporting, careful review, protection and humane resolution. Scene: A calm community moderator reviews a reported conversation on a laptop in a quiet office. The screen shows a simple conversation thread, report panel and action controls with every word obscured; a second monitor displays only neutral case thumbnails. The moderator's thoughtful posture, notes and balanced daylight communicate careful review, protection and proportional judgment rather than punishment. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shield, checkmark, and balanced scales. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for CorteQS, a trusted global Turkish diaspora discovery and community platform. Feature: “Cadde Şikâyet / Moderasyon”. Show calm and fair community moderation: reporting, careful review, protection and humane resolution. Scene: Two community members sit with a trained Turkish mediator at a round table after an online misunderstanding. A tablet between them contains the original thread as unreadable message blocks while the mediator listens and helps them reach agreement. Open body language, water glasses and a neutral community room create a humane visual for reporting, resolution and fair moderation. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shield, checkmark, and balanced scales. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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
