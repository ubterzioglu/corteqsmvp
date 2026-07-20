// Admin Panel V2 — Diaspora LinkedIn + Instagram + Reddit Postları (statik tek kaynak).
// /admin/social-share-vault sayfasının "Diaspora Postları" sekmesi bu listeden
// beslenir. 68 kayıt; her biri için 2 metinsiz ChatGPT görsel promptu (İngilizce,
// square 1:1 / no-text kuralları promptun içine gömülü), 1 hazır Türkçe LinkedIn
// postu, 1 hazır Türkçe Instagram postu ve 1 hazır Türkçe Reddit postu (daha az
// satış dili, kişisel anekdot/soru ile açılan tartışma tonu — subreddit
// kurallarına göre editlenmesi gerekebilir). Her post ücretsiz kayıt çağrısı, web +
// WhatsApp linki ve CorteQS kapanışıyla biter (Reddit postu hariç — o bare URL'le biter).
// post-51..68 (2026-07-18): site özellikleri (Cadde, Çarşı, Radar, Blog, Referans) +
// genel diaspora temaları (ikinci kuşak, uzaktan çalışma, yalnızlık, dil kaybı) eklendi.
//
// İçerik düzenlemesi BU dosyadan yapılır. Metinler temiz UTF-8 Türkçe + gerçek
// tırnak + emoji olarak tutulur; HTML-entity / mojibake KULLANILMAZ. Yeni post
// eklerken `id`/`order` benzersiz olmalı ve `theme` aşağıdaki anahtar kümesinden
// seçilmeli (yeni tema eklersen DIASPORA_THEME_LABELS'a da ekle).

export type DiasporaPostTheme =
  | "gurbet"
  | "kimlik"
  | "ulke-dagilimi"
  | "dil"
  | "mutfak"
  | "bayram"
  | "gelenek"
  | "basari"
  | "yeni-gelenler"
  | "isletme"
  | "ogrenci"
  | "networking"
  | "mentorluk"
  | "aidiyet"
  | "geri-donus"
  | "etkinlik"
  | "carsi"
  | "dayanisma"
  | "spor"
  | "teknoloji"
  | "ebeveyn"
  | "tatil"
  | "cadde"
  | "kadin"
  | "kusaklar"
  | "manifesto"
  | "radar"
  | "blog"
  | "referans"
  | "kariyer"
  | "uzaktan-calisma"
  | "yalnizlik";

export type DiasporaPost = {
  /** Benzersiz kimlik ("post-1" ... "post-50"). */
  id: string;
  /** Görünüm sırası (1..50). */
  order: number;
  theme: DiasporaPostTheme;
  /** Post başlığı (numarasız). */
  title: string;
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
};

/** Tema anahtarı → Türkçe görünür etiket (filtre çipleri + rozet). */
export const DIASPORA_THEME_LABELS: Record<DiasporaPostTheme, string> = {
  gurbet: "Gurbet",
  kimlik: "Kimlik",
  "ulke-dagilimi": "Ülke Dağılımı",
  dil: "Dil",
  mutfak: "Mutfak",
  bayram: "Bayram",
  gelenek: "Gelenek",
  basari: "Başarı",
  "yeni-gelenler": "Yeni Gelenler",
  isletme: "İşletme",
  ogrenci: "Öğrenci",
  networking: "Networking",
  mentorluk: "Mentorluk",
  aidiyet: "Aidiyet",
  "geri-donus": "Geri Dönüş",
  etkinlik: "Etkinlik",
  carsi: "Çarşı",
  dayanisma: "Dayanışma",
  spor: "Spor",
  teknoloji: "Teknoloji",
  ebeveyn: "Ebeveyn",
  tatil: "Tatil",
  cadde: "Cadde",
  kadin: "Kadın",
  kusaklar: "Kuşaklar",
  manifesto: "Manifesto",
  radar: "Radar",
  blog: "Blog",
  referans: "Referans",
  kariyer: "Kariyer",
  "uzaktan-calisma": "Uzaktan Çalışma",
  yalnizlik: "Yalnızlık",
};

export const DIASPORA_POSTS: DiasporaPost[] = [
  {
    id: "post-1",
    order: 1,
    theme: "gurbet",
    title: "Köprüdeki o koku",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Köprüdeki o koku”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish man pauses halfway across a rain-darkened pedestrian bridge in a northern European city as the smell of fresh simit from a nearby street cart brings back a vivid memory of Istanbul. He holds a paper cup of tea, looks toward the river and smiles almost involuntarily; cyclists and commuters pass naturally behind him. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Köprüdeki o koku”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman on an early tram crossing a city bridge opens a small paper bag containing warm simit. Condensation on the window, the distant water and her quietly emotional expression turn an ordinary commute into a specific sensory memory of home, photographed without monuments or nostalgic clichés. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌉 Bir çay bardağının buharında bile İstanbul'u görebiliyorsan, gurbettesin demektir.

Binlerce kilometre uzakta uyanıyorsun ama kalbin hâlâ o köprüde. Memleket hasreti utanılacak bir şey değil — kökenin sana "buradayım" demesi.

Ama bu özlemi tek başına taşımak zorunda değilsin. Berlin'de, Toronto'da, Dubai'de aynı hasreti taşıyan binlerce insan var. Onları bulmak artık tek tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, dünyanın dört bir yanındaki Türkleri tek çatı altında buluşturan, güvene dayalı ilk diaspora ağı. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Gurbet #Memleket #CorteQS`,
    instagramPost: `🌉 Bir çay bardağının buharında bile İstanbul'u görüyorsan... evet, gurbettesin 🥹

Binlerce km uzaktasın ama kalbin hâlâ orada. Ve bil ki bu özlemi taşıyan tek sen değilsin — Berlin'de, Toronto'da, Dubai'de aynı hasreti taşıyan binlerce insan var 🌍

👉 Ücretsiz kayıt ol, sen de bu ağa katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Gurbet #Memleket #Özlem #YurtDışı #TürkGurbetçi #Hasret #Köken #DünyadaTürkler #CorteQS #Aidiyet`,
    redditPost: `Sıradan bir çay bardağının buharında bile memleketi görmek garip bir şey mi?

Geçen akşam çay demlerken buhardan bir an İstanbul'u, köprüyü falan "gördüm" resmen. Sonra kendime geldim, tabii ki hiçbir şey yok, sadece sıradan bir mutfaktayım binlerce km uzakta. Gurbette yaşayanlar biliyor bu hissi herhalde — en beklenmedik anda hafızan seni oraya ışınlıyor.

Bu ara CorteQS diye bir platforma denk geldim, aynı hasreti taşıyan insanları bulundukları şehre göre bir araya getirmeye çalışıyor. Henüz yeni kullanıyorum ama fikir mantıklı geldi.

Sizde de böyle anlar oluyor mu, en çok hangi sıradan şey sizi oraya götürüyor?

corteqs.net`,
  },
  {
    id: "post-2",
    order: 2,
    theme: "gurbet",
    title: "Annenin sesi",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Annenin sesi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman living abroad cooks dinner in a modest modern kitchen while listening to her mother on a phone video call propped beside the cutting board. Her mother's face is visible but not identifiable, and no interface text can be read. The daughter's expression is tender, attentive and slightly homesick. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Annenin sesi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish man rides a nearly empty night bus after work, listening to a voice message from his mother through one earbud. City lights slide across the window and his tired face softens into a small smile, capturing how a familiar voice can make a foreign city feel close to home. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📞 "İyi misin?" diye soran o ses, dünyanın en güçlü vatanı.

Gurbette en çok özlenen şey bazen bir yemek değil, bir telefonun arkasındaki "yemek yedin mi?" sorusudur.

Ekranlar mesafeyi kapatmaya çalışıyor ama gerçek bir topluluk, yanında fiziksel olarak duran insanlardır. Bulunduğun şehirde seni anlayan birini bulmak, o boşluğu doldurmanın ilk adımı.

👉 Ücretsiz kayıt olun!
CorteQS, "yalnız değilsin" hissini bir slogan değil, gerçek bir ağa dönüştürüyor — şehir şehir, insan insan.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Gurbet #TürkDiasporası #Özlem #Topluluk #CorteQS`,
    instagramPost: `📞 "Yemek yedin mi?" diyen o ses... dünyanın en güçlü vatanı 🥺

Ekranlar mesafeyi kapatmaya çalışıyor ama gerçek topluluk, yanında duran insanlardır. Bulunduğun şehirde seni anlayan birini bulmak ilk adım 💛

👉 Ücretsiz kayıt ol, yalnız değilsin!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Gurbet #TürkDiasporası #Özlem #Topluluk #YurtDışı #AnneSevgisi #Hasret #YalnızDeğilsin #TürkGurbetçi #CorteQS #Aidiyet`,
    redditPost: `Ailenizin sesi telefonda mesafeyi gerçekten kapatıyor mu, yoksa geçici bir teselli mi?

Her hafta sonu annemle görüntülü konuşuyorum, "yemek yedin mi" sorusu hâlâ beni yumuşatıyor ama konuşma bitince ekran kapanıyor ve o boşluk aynı yerde duruyor. Ekranların mesafeyi kapattığını söylüyorlar ama bence sadece hafifletiyor, kapatmıyor.

Bunu düşünürken CorteQS diye bir siteye rastladım, mantığı şuymuş: ekran yerine bulunduğun şehirde fiziksel olarak var olan birini bulmak. Denemedim henüz ama fikir olarak "ekran değil insan" yaklaşımı ilgimi çekti.

Sizin için görüntülü konuşmalar gerçekten yetiyor mu, yoksa siz de aynı şehirde biri arıyor musunuz?

corteqs.net`,
  },
  {
    id: "post-3",
    order: 3,
    theme: "gurbet",
    title: "Aynı ay",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Aynı ay”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A young Turkish woman stands at her apartment window under a clearly visible full moon while video-calling her father in another country. His face appears on the phone beside the same moon seen from his balcony, creating a literal shared-sky moment without compositing or fantasy effects. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Aynı ay”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish couple on a quiet rooftop in Brussels look at the moon while sending a live photo to family in Turkey. Their phone screen shows a family video-call thumbnail with no readable text; the scene is intimate, contemporary and grounded in real urban night light. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌙 Baktığın ay, annenin baktığı ayla aynı.

Gurbet, mesafeyi öğretir ama aynı zamanda bir gerçeği de hatırlatır: Aynı gökyüzünün altındayız. T.C. Dışişleri Bakanlığı verilerine göre yurt dışında 7,5 milyondan fazla Türk vatandaşı yaşıyor. Yani sen yalnız değilsin — sadece henüz birbirinizi bulmadınız.

👉 Ücretsiz kayıt olun!
CorteQS, görünmez bir ağla birbirine bağlı bu büyük aileyi görünür kılıyor. Kökenini paylaşan milyonlar, artık bir arama kadar yakın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkDiasporası #Diaspora #Gurbet #Aidiyet #CorteQS`,
    instagramPost: `🌙 Baktığın ay, annenin baktığı ayla aynı ✨

Mesafe çok ama gökyüzü tek! T.C. Dışişleri verilerine göre yurt dışında 7,5 milyondan fazla Türk var. Yani yalnız değilsin, sadece henüz birbirinizi bulmadınız 🌍

👉 Ücretsiz kayıt ol, bu büyük aileyi keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TürkDiasporası #Diaspora #Gurbet #Aidiyet #YurtDışı #AynıGökyüzü #TürkGurbetçi #Özlem #DünyadaTürkler #CorteQS #Topluluk`,
    redditPost: `7,5 milyon insan aynı gökyüzüne bakıp muhtemelen aynı şeyi düşünüyor, bu bir gerçek mi yoksa duygusal abartı mı?

Bir gece balkonda aya bakarken aklıma "şu an memlekette de biri aynı aya bakıyordur" diye bir düşünce geldi, biraz saçma ama içimi ısıttı. Sonra merak edip baktım, T.C. Dışişleri verilerine göre yurt dışında 7,5 milyondan fazla Türk vatandaşı yaşıyormuş. Yani teorik olarak "yalnız değilsin" doğru ama pratikte insan yine de yalnız hissedebiliyor çünkü o milyonlarla hiç bağlantın yok.

CorteQS bu boşluğu doldurmaya çalışan bir platform gibi duruyor, dağınık olan bu kitleyi bir şekilde görünür kılmayı hedefliyor.

Siz de "aynı gökyüzü altındayız" hissini gerçek bir teselli olarak mı yaşıyorsunuz yoksa bu bana biraz naif mi geliyor?

corteqs.net`,
  },
  {
    id: "post-4",
    order: 4,
    theme: "kimlik",
    title: "İki dünya bir kalp",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İki dünya bir kalp”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish-German woman prepares a contemporary dinner in her Berlin apartment: homemade mercimek soup beside a local bakery loaf, family ceramics beside minimalist European tableware. She is confident and at ease, not divided, as friends from different backgrounds arrive through the open doorway. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İki dünya bir kalp”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At a child's birthday table, a Turkish diaspora family and local friends naturally combine traditions—tea glasses, a homemade cake, modern decorations and bilingual conversation. The central parent watches the children play with a settled expression that communicates one whole life formed from two worlds. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌍 İki dilde rüya görüyorsun. İki kültürde de "yabancı" hissettiğin anlar oluyor. Ama aslında ikisinin de zenginliğini taşıyorsun.

İkinci ve üçüncü kuşak için kimlik, bir "ya o ya bu" sorusu değil. Hem buralı hem oralı olmak bir kayıp değil, bir süper güç.

👉 Ücretsiz kayıt olun!
CorteQS, köklerini kaybetmeden geleceğini kurmak isteyen yeni nesil için tasarlandı. Kim olduğunu unutmadan, nereye gideceğini birlikte keşfedelim.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İkinciKuşak #Kimlik #TürkDiasporası #İkiKültür #CorteQS`,
    instagramPost: `🌍 İki dilde rüya görüyorsun, iki kültürde de bazen "yabancı" hissediyorsun. Ama aslında ikisinin de zenginliğini taşıyorsun ✨

Hem buralı hem oralı olmak bir kayıp değil, bir süper güç 💪

👉 Ücretsiz kayıt ol, köklerini kaybetmeden geleceğini kur!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İkinciKuşak #Kimlik #TürkDiasporası #İkiKültür #YurtDışı #GenZDiaspora #KöklerimiTaşırım #Aidiyet #İkiVatan #CorteQS #Topluluk`,
    redditPost: `İki dilde rüya görmek, iki kültürde de "tam olarak oralı değilim" hissetmek — bu sadece bende mi var?

İkinci kuşağım, Türkiye'ye gittiğimde "yurt dışından gelen" muamelesi görüyorum, burada da bazen "aslen nerelisin" sorusuyla hatırlatılıyorum nereli olduğum. Uzun süre bunu bir eksiklik gibi hissettim ama son zamanlarda aslında iki tarafın da zenginliğini taşıdığımı düşünmeye başladım.

CorteQS diye bir platformda ikinci/üçüncü kuşak için tam da bu "iki dünya bir kimlik" meselesini konu eden içerikler gördüm, biraz araştırdım.

İkinci kuşak olanlar: siz bu "ne oralısın ne buralısın" hissini nasıl bir yere oturttunuz, yoksa hâlâ çözülmemiş bir şey mi sizde de?

corteqs.net`,
  },
  {
    id: "post-5",
    order: 5,
    theme: "kimlik",
    title: "Dedemin valizi",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Dedemin valizi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: An elderly Turkish grandfather opens the worn suitcase he first carried to Europe while his adult granddaughter sits beside him. Inside are a folded work shirt, an old black-and-white family photograph and a train ticket with all writing hidden. Their hands move carefully over the objects as he tells the story. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Dedemin valizi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Close documentary view of a grandfather's weathered hands passing an old leather suitcase key and faded travel photograph to his grandson at a kitchen table. A modern smartphone recording the conversation sits nearby, linking migration memory to the next generation without staged sentimentality. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🧳 1961'de imzalanan işgücü anlaşmasıyla bir valizle başladı her şey. Bugün biz o yolculuğun üçüncü, dördüncü kuşağıyız.

Dedelerimiz "misafir işçi" olarak gitti, kalıcı oldu, koca bir diaspora kurdu. Onlar dernek çatısı altında birbirini buldu. Peki bizim kuşağın "köy kahvesi" nerede?

👉 Ücretsiz kayıt olun!
CorteQS, dedelerimizin dayanışmasını dijital çağa taşıyor — aynı sıcaklık, yeni bir adres. Geçmişimize saygı, geleceğimize yatırım.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Gastarbeiter #TürkDiasporası #Kuşaklar #Göç #CorteQS`,
    instagramPost: `🧳 1961'de bir valizle başladı her şey. Bugün biz o yolculuğun 3. 4. kuşağıyız 🌍

Dedelerimiz "misafir işçi" gitti, kalıcı oldu, koca bir diaspora kurdu. Peki bizim kuşağın "köy kahvesi" nerede? 🤔

👉 Ücretsiz kayıt ol, dayanışmayı dijital çağa taşı!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Gastarbeiter #TürkDiasporası #Kuşaklar #Göç #YurtDışı #TürkGurbetçi #Almanya #Miras #Dayanışma #CorteQS #Topluluk`,
    redditPost: `Dedelerimizin "köy kahvesi" gibi bir dayanışma noktamız var mı bizim kuşağın?

Geçen gün dedemin 1960'larda bir valizle Almanya'ya gidişini anlattığı ses kaydını dinledim, dernek çatısı altında nasıl birbirlerini bulduklarını, nasıl bir arada kaldıklarını anlatıyordu. Düşündüm de biz üçüncü dördüncü kuşak için böyle bir "buluşma noktası" yok gibi, herkes dağınık, herkes kendi köşesinde.

CorteQS'in kendini biraz da bu dayanışmayı dijital çağa taşıma iddiasıyla tanımladığını gördüm, ilginç bir konumlama.

Sizin ailenizde de ilk kuşağın hikayeleri var mı, ve siz bugün onların kurduğu o "bir arada olma" hissini bir şekilde yaşıyor musunuz yoksa tamamen koptu mu?

corteqs.net`,
  },
  {
    id: "post-6",
    order: 6,
    theme: "kimlik",
    title: "İsmini doğru söyleyen biri",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İsmini doğru söyleyen biri”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At a new workplace orientation, a colleague carefully repeats a Turkish employee's name until she gets the pronunciation right. The Turkish employee's face shows genuine relief and appreciation; neutral name badges are present but blank, and the office interaction feels spontaneous rather than corporate stock photography. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İsmini doğru söyleyen biri”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A university lecturer greets a Turkish student by correctly pronouncing her name before a small seminar. The student's shoulders relax and she smiles while classmates turn warmly toward her; no names or writing are legible anywhere in the room. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🤝 İsmini ilk seferde doğru telaffuz eden biriyle tanışmanın huzurunu bilir misin?

Gurbette bazen en küçük şey en büyük rahatlamadır: aynı esprileri anlayan, aynı acıları bilen, "anladım seni" diyebilen biri.

👉 Ücretsiz kayıt olun!
CorteQS'te bağ kurduğun kişi sadece bir "kontak" değil; aynı kökten, aynı hikâyeden gelen bir yol arkadaşı. Güven, tanıdıklıkla başlar.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kimlik #TürkDiasporası #Networking #Aidiyet #CorteQS`,
    instagramPost: `🤝 İsmini ilk seferde doğru telaffuz eden biriyle tanışmanın huzurunu bilir misin?

Gurbette bazen en küçük şey en büyük rahatlamadır: aynı esprileri anlayan, "anladım seni" diyebilen biri 💛

👉 Ücretsiz kayıt ol, bağ kur!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Kimlik #TürkDiasporası #Networking #Aidiyet #YurtDışı #TürkGurbetçi #Bağlantı #GerçekTopluluk #Güven #CorteQS #Gurbet`,
    redditPost: `İsmini ilk seferde doğru söyleyen biriyle tanışmak neden bu kadar rahatlatıcı geliyor?

Geçen hafta bir toplantıda ismimi hiç zorlanmadan, ilk seferde doğru telaffuz eden biriyle tanıştım ve fark ettim ki bu küçük şey beni resmen rahatlattı. Sanki "seni anlıyorum" demiş gibi hissettim, hâlbuki daha iki cümle konuşmuştuk.

Bunu düşünürken CorteQS diye bir platforma denk geldim, mantığı tam da bu: aynı kökenden gelen insanları bir araya getirip o "anlaşılma" hissini baştan sağlamak.

Sizde de böyle küçük ama etkili anlar oldu mu — bir isim telaffuzu, bir espri, bir jest, sizi bir anda rahatlatan?

corteqs.net`,
  },
  {
    id: "post-7",
    order: 7,
    theme: "ulke-dagilimi",
    title: "Almanya'da bir Türkiye",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Almanya'da bir Türkiye”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A lively commercial street in Cologne where Turkish-origin residents run a bakery, pharmacy-style shop and modern cafe beside German neighbors. Real customers move between businesses on an ordinary afternoon, showing a large, integrated community through people and daily life rather than flags or maps. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Almanya'da bir Türkiye”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A multigenerational Turkish family picnics with friends in a German city park while children switch naturally between languages. Bicycles, reusable containers, tea and local bread share the blanket; the skyline remains recognizably central European but no landmark dominates the human scene. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🇩🇪 Almanya'da DESTATIS 2024 verilerine göre yalnızca Türk vatandaşlığına sahip 1.385.000 kişi, Alman pasaportlu Türkiye kökenli 1.638.000 kişi ve 338.000 çifte vatandaş yaşıyor — toplamda 3 milyonu aşan bir nüfus (Perspektif.eu, Ekim 2025).

Bu, koca bir şehir değil — koca bir ülke nüfusu! Peki bu kadar kalabalıkken neden hâlâ "tanıdık bulmak" bu kadar zor?

👉 Ücretsiz kayıt olun!
CorteQS, Almanya'daki bu devasa ağı şehir bazında haritalandırıyor. Kalabalığın içinde kaybolma; kendi insanını tek aramada bul.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Almanya #TürkDiasporası #Gurbetçi #Berlin #CorteQS`,
    instagramPost: `🇩🇪 Almanya'da 3 milyonu aşan bir Türk nüfusu var — koca bir ülke nüfusu! 😲

Peki bu kadar kalabalıkken neden hâlâ "tanıdık bulmak" bu kadar zor? Kalabalığın içinde kaybolma 🔎

👉 Ücretsiz kayıt ol, kendi insanını tek aramada bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Almanya #TürkDiasporası #Gurbetçi #Berlin #YurtDışı #TürkAlmanlar #Diaspora #Köln #Frankfurt #CorteQS #Networking`,
    redditPost: `Almanya'da 3 milyona yakın Türk varken neden hâlâ "tanıdık bulmak" bu kadar zor?

DESTATIS 2024 verilerine göre Almanya'da Türk vatandaşlığı + Türkiye kökenli Alman vatandaşları + çifte vatandaşlar toplamda 3 milyonu geçiyor. Yani teorik olarak koca bir şehir nüfusu kadar Türk var etrafımızda. Ama pratikte hâlâ "acaba bu şehirde başka Türk var mı" diye düşünüp duruyorum, sanki hiç yokmuşuz gibi.

Bunun sebebi gerçekten dağınıklık mı, yoksa herkesin zaten kendi küçük çevresi olup daha fazlasını aramaması mı? CorteQS gibi bu nüfusu şehir bazında haritalandırmaya çalışan bir platform gördüm, mantıklı bir problem tanımı gibi duruyor.

Almanya'da yaşayanlar: sizin şehrinizde bu "kalabalık ama izole" hissi var mı?

corteqs.net`,
  },
  {
    id: "post-8",
    order: 8,
    theme: "ulke-dagilimi",
    title: "Avrupa'nın dört bir yanı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Avrupa'nın dört bir yanı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Turkish friends living in Paris, Vienna, Stockholm and Rotterdam join the same laptop video call from one participant's dining table. The visible screen contains four natural home environments and friendly human faces with no readable names; a notebook lists nothing legible. The photograph focuses on laughter crossing distance. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Avrupa'nın dört bir yanı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A group of Turkish diaspora friends reunite at a European train station after arriving from different cities. Rolling suitcases, platform architecture and genuine embraces make the continental network feel physical and human without using maps, pins or decorative flags. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🇪🇺 Perspektif.eu/DESTATIS derlemesine (Ekim 2025) göre Fransa'da ~700 bin, Hollanda'da ~500 bin, İngiltere'de ~400 bin, Belçika'da ~240 bin Türk; Statistik Austria 2025 raporuna göre Avusturya'da 124.788 Türk vatandaşı (Türkiye kökenli Avusturya vatandaşları hariç).

Batı Avrupa, 6 milyonu aşkın Türk için adeta ikinci vatan oldu. Ama bu güç, ancak birbirine bağlandığında anlam kazanıyor.

👉 Ücretsiz kayıt olun!
CorteQS, Berlin'den Paris'e, Rotterdam'dan Viyana'ya uzanan bu ağı tek bir güven zemininde buluşturuyor. Dağınık değil, birlikte güçlüyüz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Avrupa #TürkDiasporası #Diaspora #Gurbet #CorteQS`,
    instagramPost: `🇪🇺 Batı Avrupa, 6 milyonu aşkın Türk için ikinci vatan oldu! 🌍

Fransa, Hollanda, İngiltere, Belçika, Avusturya... Ama bu güç ancak birbirine bağlandığında anlam kazanıyor 💪

👉 Ücretsiz kayıt ol, dağınık değil birlikte güçlü olalım!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Avrupa #TürkDiasporası #Diaspora #Gurbet #YurtDışı #Fransa #Hollanda #Avusturya #TürkGurbetçi #CorteQS #Birlik`,
    redditPost: `Fransa'dan Avusturya'ya 6 milyonu aşkın Türk var ama birbirimizden bu kadar habersiz olmamız normal mi?

Farklı Avrupa ülkelerinde yaşayan akrabalarımla konuşurken fark ettim, herkes kendi balonunda yaşıyor — Fransa'daki Hollanda'dakinden, Avusturya'daki İngiltere'dekinden habersiz. Oysa rakamlara bakınca (Perspektif.eu/DESTATIS derlemesi, Statistik Austria) topluca 6 milyonu geçen devasa bir nüfustan bahsediyoruz.

CorteQS bu dağınık Avrupa diasporasını tek bir ağda toplamaya çalışıyormuş, en azından iddiası bu.

Siz başka Avrupa ülkelerindeki Türklerle bir bağlantınız var mı, yoksa herkes gerçekten kendi ülkesinde mi izole yaşıyor?

corteqs.net`,
  },
  {
    id: "post-9",
    order: 9,
    theme: "ulke-dagilimi",
    title: "Körfez'den Pasifik'e",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Körfez'den Pasifik'e”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Three Turkish professionals from Dubai, Singapore and Sydney meet at an international conference coffee area. Their clothing and badges are contemporary and understated, badge text unreadable, while their animated conversation shows a network stretching from the Gulf to the Pacific through actual people. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Körfez'den Pasifik'e”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish engineer in a Gulf-city apartment video-calls a Turkish researcher near the Pacific coast while both review the same prototype. One laptop screen shows the remote collaborator with no interface text; city light and working objects establish the two regions realistically. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌏 Türk diasporası artık sadece Avrupa değil. Perspektif.eu derlemesine göre ABD'de yaklaşık 300 bin Türk yaşıyor (topluluk kuruluşu Turkish Coalition of America bu sayıyı 350-500 bin olarak tahmin ediyor); Statistics Canada 2021 Sayımı'na göre Kanada'da ~76.000 Türk kökenli; ABS 2021 Sayımı'na göre Avustralya'da 87.164 Türk kökenli yaşıyor.

Dünyanın her köşesine dağıldık. Ama dağılmak, kopmak zorunda değil.

👉 Ücretsiz kayıt olun!
CorteQS, Dubai'den Sidney'e, Toronto'dan Los Angeles'a — 251 ülkeye yayılan Türkleri tek ağda buluşturuyor. Mesafe artık bir engel değil.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dubai #Avustralya #Kanada #TürkDiasporası #CorteQS`,
    instagramPost: `🌏 Türk diasporası artık sadece Avrupa değil! Dubai, Toronto, Sidney, Los Angeles... dünyanın her köşesindeyiz 🌍

Dağıldık ama dağılmak kopmak zorunda değil. Mesafe artık bir engel değil!

👉 Ücretsiz kayıt ol, 251 ülkeye yayılan ağa katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Dubai #Avustralya #Kanada #TürkDiasporası #YurtDışı #ABD #Sidney #Toronto #KüreselTürkler #CorteQS #Diaspora`,
    redditPost: `Avrupa dışındaki Türk toplulukları (ABD, Kanada, Avustralya, Körfez) hakkında neden bu kadar az konuşuluyor?

Hep Almanya-Fransa-Hollanda diasporasından bahsediliyor ama Statistics Canada 2021 sayımına göre Kanada'da ~76 bin, ABS 2021 sayımına göre Avustralya'da 87 bin küsur Türk kökenli insan var, ABD'de de topluluk kuruluşlarının tahminine göre 350-500 bin civarında. Küçümsenecek rakamlar değil ama bu toplulukların hikayeleri Avrupa'dakiler kadar görünür değil.

CorteQS diye bir platform 251 ülkeye yayılmış bu dağınık kitleyi bir yerde toplama iddiasında, en azından coğrafi kapsamı geniş tutmuşlar.

ABD/Kanada/Avustralya/Körfez'de yaşayan var mı burada, oradaki Türk topluluğu deneyiminiz Avrupa'dakilerden nasıl farklı?

corteqs.net`,
  },
  {
    id: "post-10",
    order: 10,
    theme: "dil",
    title: "Anne, su alabilir miyim?",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Anne, su alabilir miyim?”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: In a European supermarket aisle, a bilingual Turkish child quietly asks her mother for water in Turkish while holding an empty reusable bottle. The mother bends to answer at eye level; ordinary shelves, winter coats and a shopping basket make the language moment tender and completely everyday. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Anne, su alabilir miyim?”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At a family dinner in a modern apartment, a child asks a simple question in Turkish and both parents respond naturally while continuing to set the table. The child's confidence and the parents' attentive expressions communicate how a home language survives through small repeated moments. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🗣️ Çocuğun "Mummy, can I have water?" dediğinde içinde o tatlı burukluğu hisseden herkese:

Türkçeyi yaşatmak, çocuğuna sadece bir dil değil, bir kimlik, bir köprü hediye etmektir. Bir insan ancak dili kadar derin hissedebilir.

👉 Ücretsiz kayıt olun!
CorteQS'te Türkçe etkinlikler, anne-baba toplulukları ve dil destek gruplarıyla çocuğunun kökleriyle bağını canlı tut. Yalnız uğraşmana gerek yok.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Türkçe #Anadil #TürkDiasporası #İkiDillilik #CorteQS`,
    instagramPost: `🗣️ Çocuğun "Mummy, can I have water?" dediği anda içinde o tatlı burukluğu hisseden var mı? 🥹

Türkçeyi yaşatmak, çocuğuna sadece bir dil değil, bir kimlik ve bir köprü hediye etmektir 💛

👉 Ücretsiz kayıt ol, yalnız uğraşmana gerek yok!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Türkçe #Anadil #TürkDiasporası #İkiDillilik #YurtDışı #ÇocukEğitimi #AnneBaba #KökBağı #GenZDiaspora #CorteQS #Aile`,
    redditPost: `Çocuğunuz size "Mummy, can I have water?" dediğinde tuhaf bir burukluk hissediyor musunuz?

Kızım geçen gün benden su isterken İngilizce sordu ve fark ettim ki içimde küçük bir sızı oluştu, hiç kızgın değildim ama bir şeyin kaybolduğunu hissettim. Sonra düşündüm, aslında bu çok normal, o büyüdüğü ortamın dilini konuşuyor, benim çabalarım kadar çevresi de belirleyici.

Bu konuda Türkçe etkinlikler ve anne-baba toplulukları arayan biri olarak CorteQS diye bir platforma denk geldim, yurt dışındaki ailelere yönelik bir şeyler sunuyormuş.

Aynı durumu yaşayan var mı, çocuğunuzla Türkçe konuşma çabanız gerçekten işe yarıyor mu yoksa zamanla İngilizce/Almanca ağır mı basıyor?

corteqs.net`,
  },
  {
    id: "post-11",
    order: 11,
    theme: "dil",
    title: "Ninniden masala",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Ninniden masala”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A grandmother in Turkey reads a picture book over a tablet video call while her grandchild listens from bed in another country. The screen is large enough to show her warm expression but all book text and interface labels are unreadable; a parent sits nearby, quietly sharing the moment. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Ninniden masala”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish mother sings a familiar lullaby to her sleepy child in a softly lit apartment abroad. A small audio message from the grandmother is paused on a phone beside the bed with no legible interface, suggesting how songs and stories travel through generations. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📖 "Dandini dandini dastana" diye başlayan ninniler, bir kuşaktan diğerine taşınan en değerli miras.

Yurt dışında doğan çocuklara Türkçeyi sevdirmek; masallarla, türkülerle, bayram sofralarıyla mümkün. Önemli olan, bu işi paylaşacak bir topluluğun olması.

👉 Ücretsiz kayıt olun!
CorteQS, dilini ve kültürünü yaşatmak isteyen ailelere şehir bazlı topluluklar ve gerçek bağlantılar sunuyor. Kökler güçlüyse dallar her yere uzanır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Anadil #Türkçe #TürkDiasporası #ÇocukEğitimi #CorteQS`,
    instagramPost: `📖 "Dandini dandini dastana"... ninniler bir kuşaktan diğerine taşınan en değerli miras 🌙

Yurt dışında doğan çocuklara Türkçeyi sevdirmek masallarla, türkülerle mümkün. Yeter ki paylaşacak bir topluluğun olsun ✨

👉 Ücretsiz kayıt ol, kökler güçlüyse dallar her yere uzanır!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Anadil #Türkçe #TürkDiasporası #ÇocukEğitimi #YurtDışı #Ninni #Masal #AnneBaba #KökBağı #CorteQS #Aile`,
    redditPost: `"Dandini dandini dastana" gibi ninnileri yurt dışında doğan çocuğunuza söylüyor musunuz, yoksa bu gelenek sizde de kayboluyor mu?

Anneannemin bana söylediği ninnileri kendi çocuğuma söylerken garip bir gurur duyuyorum ama aynı zamanda "acaba o da kendi çocuğuna söyleyecek mi" diye düşünmeden edemiyorum. Dil aktarımı zor, ninni ve masal gibi küçük ritüeller olmadan Türkçe sadece bir "iletişim aracı"na dönüşüyor, kültürel katmanı kayboluyor gibi hissediyorum.

CorteQS'te Türkçe etkinlikler ve anne-baba toplulukları için bir alan olduğunu gördüm, bu tür şeyleri paylaşacak insanlar bulmak işe yarayabilir diye düşündüm.

Siz üçüncü kuşağa ninni/masal/türkü aktarabiliyor musunuz, yoksa bu iş sizde de ikinci kuşakta mı kesiliyor?

corteqs.net`,
  },
  {
    id: "post-12",
    order: 12,
    theme: "mutfak",
    title: "Annemin sarması",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Annemin sarması”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Three generations of Turkish women sit around a bright kitchen table in a European home, rolling grape leaves together. Real bowls of filling, olive oil, worn recipe habits and relaxed conversation create an authentic family scene; no folkloric costumes or stylized food presentation. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Annemin sarması”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A young Turkish professional opens a carefully packed container of her mother's homemade sarma during lunch at a modern office. The familiar smell stops her for a second as coworkers gather curiously, turning a real meal into a quiet connection with home. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🍽️ Gurbette malzemeyi bulursun ama o tadı bir türlü tutturamazsın. Çünkü eksik olan baharat değil — annenin eli.

Türk mutfağı, gurbetçinin en derin özlemlerinden biri. Ama o lezzeti paylaşacak bir sofra arkadaşı bulmak, özlemi bayrama çevirir.

👉 Ücretsiz kayıt olun!
CorteQS'te şehrindeki Türk lokantalarını, ev yemeği yapan komşuları ve sofra arkadaşlarını keşfet. Lezzet paylaşıldıkça çoğalır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkMutfağı #Gurbet #TürkDiasporası #Lezzet #CorteQS`,
    instagramPost: `🍽️ Malzemeyi bulursun ama o tadı bir türlü tutturamazsın... çünkü eksik olan baharat değil, annenin eli 🥲

Türk mutfağı özlemini bir sofra arkadaşıyla bayrama çevir 🍇

👉 Ücretsiz kayıt ol, şehrindeki lezzetleri keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TürkMutfağı #Gurbet #TürkDiasporası #Lezzet #YurtDışı #Sarma #EvYemeği #SofraArkadaşı #TürkYemekleri #CorteQS #Özlem`,
    redditPost: `Aynı malzemeleri kullanıyorum ama annemin sarmasının tadını hiçbir şekilde tutturamıyorum, bu sadece bende mi var?

Geçen hafta annemi arayıp tarifi adım adım aldım, aynı yağı, aynı yaprakları kullandım ama bir türlü o tat çıkmadı. Sanırım eksik olan malzeme değil, yıllarca o mutfakta büyümüş olma tecrübesi. Gurbette bu tür "hiç tutturamama" hissi çok yaygın sanırım.

Bu arada bir sofra arkadaşı ya da ev yemeği yapan birini bulmanın da bir çözüm olabileceğini düşündüm, CorteQS gibi platformlarda böyle bağlantılar kurulabiliyormuş.

Sizin de "hiç annemin gibi olmuyor" dediğiniz bir yemek var mı, tarifi tam olarak takip etmenize rağmen?

corteqs.net`,
  },
  {
    id: "post-13",
    order: 13,
    theme: "mutfak",
    title: "Bir simit, bir çay",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir simit, bir çay”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Two Turkish friends share fresh simit and tea at a small outdoor cafe on a cold European morning before work. Coats, bicycles and pale winter light establish the city abroad, while the familiar breakfast and unforced conversation create a sense of home. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir simit, bir çay”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish remote worker sits by an apartment window with a laptop, one simit and a tulip-shaped tea glass. A video call with friends is visible as small portrait tiles with no readable names; the ordinary breakfast becomes a bridge to community. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🥯 Bir simit ve bir bardak çay. Aslında çok basit. Ama gurbette bu ikili, bir sabahı memlekete çeviriyor.

Yurt dışında "nerede simit bulurum?" sorusu, aslında "nerede kendimi evimde hissederim?" sorusudur.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı ve Cadde modülleriyle şehrindeki Türk fırınını, marketini ve esnafını anında bul. Memleket lezzetleri bir tık uzağında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Simit #Çay #TürkMutfağı #TürkDiasporası #CorteQS`,
    instagramPost: `🥯 Bir simit, bir bardak çay... çok basit ama gurbette bir sabahı memlekete çeviriyor ☕

"Nerede simit bulurum?" aslında "nerede kendimi evimde hissederim?" sorusu 🏠

👉 Ücretsiz kayıt ol, Çarşı ve Cadde'de fırınını bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Simit #Çay #TürkMutfağı #TürkDiasporası #YurtDışı #TürkFırını #KahvaltıKeyfi #MemleketLezzeti #Çarşı #CorteQS #Gurbet`,
    redditPost: `"Nerede simit bulurum" sorusu aslında hiç simitle ilgili değilmiş gibi hissediyorum, siz de öyle mi?

Yeni taşındığım şehirde ilk aylarda sürekli "acaba nerede Türk fırını var" diye arıyordum, sonradan fark ettim ki aslında aradığım şey simit değil, o sabahı biraz olsun eve benzetecek bir şeydi. Bulduğumda da tadı beklediğim gibi çıkmayabiliyor ama yine de o arayış bir tür aidiyet çabası sanki.

Bu tür yerel esnaf/fırın bulma işini kolaylaştıran bir Çarşı/Cadde bölümü olan CorteQS diye bir platform var, henüz ne kadar işe yaradığını bilmiyorum ama fikir mantıklı.

Sizde de "aslında yemekten çok özlemi arıyorum" dediğiniz böyle bir arayış var mı?

corteqs.net`,
  },
  {
    id: "post-14",
    order: 14,
    theme: "bayram",
    title: "Gurbette arife sabahı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette arife sabahı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Before sunrise on the morning before a holiday, a Turkish family abroad cleans the apartment, irons children's clothes and prepares trays of food while video-calling grandparents. The atmosphere is busy, affectionate and recognizably domestic, with no decorative flags or staged religious imagery. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette arife sabahı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A small Turkish bakery in Europe opens early on arife morning as customers collect bread and sweets for family visits. Warm oven light, paper packages without branding and quiet greetings convey a shared ritual continuing far from home. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌅 Gurbette bayram sabahı buruk başlar. Etraftaki herkes normal bir iş gününe uyanırken, sen içinde koca bir bayram taşırsın.

Çocukken kapı kapı şeker topladığın o sokaklar çok uzakta. Ama aynı özlemi paylaşan komşuların belki çok yakında.

👉 Ücretsiz kayıt olun!
CorteQS, gurbetteki bayramı yalnızlıktan kurtarıyor; şehrindeki buluşmaları, bayramlaşmaları ve toplulukları tek yerde topluyor. Bayram paylaşılınca bayram olur.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Bayram #Gurbet #TürkDiasporası #Ramazan #CorteQS`,
    instagramPost: `🌅 Gurbette bayram sabahı buruk başlar... herkes normal bir güne uyanırken içinde koca bir bayram taşırsın 🌙

Ama aynı özlemi paylaşan komşuların belki çok yakında 🤍

👉 Ücretsiz kayıt ol, bayramı yalnızlıktan kurtar!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Bayram #Gurbet #TürkDiasporası #Ramazan #YurtDışı #BayramSabahı #Özlem #Bayramlaşma #TürkGurbetçi #CorteQS #Topluluk`,
    redditPost: `Bayram sabahı herkes normal bir iş gününe uyanırken siz de içinizde bir şeyin eksik olduğunu hissediyor musunuz?

Geçen bayram sabahı işe gitmem gerekiyordu, metroda etrafımdaki insanlar sıradan bir salı sabahı yaşarken ben içimde koca bir bayram taşıyordum ve bunu kimseyle paylaşamıyordum. Çocukken kapı kapı şeker toplamak, büyüklerin elini öpmek gibi ritüeller şimdi çok uzak bir anı gibi.

CorteQS'in bayram zamanı şehir bazlı buluşmalar/bayramlaşmaları bir araya getirdiğini gördüm, bu tür bir şeyin işe yarayıp yaramadığını merak ediyorum.

Gurbette bayramı nasıl geçiriyorsunuz, aynı özlemi paylaşan biriyle bir araya gelebiliyor musunuz yoksa çoğunlukla yalnız mı geçiyor?

corteqs.net`,
  },
  {
    id: "post-15",
    order: 15,
    theme: "bayram",
    title: "Baklava kokusu",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Baklava kokusu”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Inside a real Turkish-owned bakery abroad, a baker lifts a fresh tray of baklava from the oven as the first customers enter. Honeyed layers, steam, stainless counters and morning light are rendered with food-photography realism, while the customers' expressions carry memory rather than spectacle. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Baklava kokusu”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish employee brings a homemade tray of baklava to an international office break room. Coworkers gather, ask questions and share pieces while she explains the family recipe; the scene is warm and contemporary, not a commercial food advertisement. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🍯 Almanya'da bir Türk için baklava kokusu, bayramın habercisidir. O koku evi memlekete çevirir.

Ramazan ve Kurban Bayramı gurbette dini olduğu kadar kültürel bir bağ. Bir iftar sofrası paylaşmak, binlerce kilometreyi siler.

👉 Ücretsiz kayıt olun!
CorteQS, şehrindeki iftar buluşmalarını, bayram etkinliklerini ve dayanışma ağlarını keşfetmeni sağlıyor. Sofranı büyüt, yalnızlığını küçült.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Ramazan #Bayram #İftar #TürkDiasporası #CorteQS`,
    instagramPost: `🍯 Baklava kokusu bayramın habercisidir... o koku evi memlekete çevirir 🏠

Ramazan ve Kurban Bayramı gurbette hem dini hem kültürel bir bağ. Bir iftar sofrası paylaşmak binlerce km'yi siler 🕌

👉 Ücretsiz kayıt ol, iftar buluşmalarını keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Ramazan #Bayram #İftar #TürkDiasporası #YurtDışı #Baklava #KurbanBayramı #Dayanışma #TürkGurbetçi #CorteQS #Sofra`,
    redditPost: `Sokakta bir yerden baklava kokusu gelince aniden bayram hissine kapılıyor musunuz?

Geçen gün bir pastane vitrininde baklavaya benzer bir tatlı gördüm ve anında kafamda bayram sabahları, büyüklerin elini öpme, aile sofrası gibi görüntüler canlandı. Tuhaf, sadece bir koku ya da görüntü bu kadar güçlü bir çağrışım yapabiliyor.

Ramazan/Kurban Bayramı gurbette hem dini hem kültürel bir şey benim için, ama tek başına yaşanınca eksik kalıyor. İftar buluşmaları veya bayram etkinliklerini bulmak için CorteQS diye bir platforma baktım, şehir bazlı bir şeyler sunuyormuş.

Siz gurbette iftar/bayram sofranızı nasıl büyütüyorsunuz, yoksa çoğunlukla küçük aile çevrenizle mi sınırlı kalıyor?

corteqs.net`,
  },
  {
    id: "post-16",
    order: 16,
    theme: "gelenek",
    title: "Gurbette kına gecesi",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette kına gecesi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A contemporary Turkish diaspora henna night takes place in a rented community hall with real families, friends and modern clothing. The bride sits among women of several generations as henna is applied carefully; warm practical lighting and candid smiles keep the scene respectful and believable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette kına gecesi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Documentary close view of a grandmother, mother and young friend dancing together at a diaspora kına gecesi. Their hands, fabric movement and laughing faces are sharp while the rest of the hall falls softly out of focus; no exaggerated costumes or fantasy decor. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🔥 Kına gecesi, Orta Asya'dan bugüne taşınan bir uğurlama töreni — sevginin ve sadakatin sembolü. Avrupa'nın dört bir yanında hâlâ yaşatılıyor.

Gurbette bir kına, bir düğün, bir sünnet... Bunları doğru yapacak, doğru insanları bulacak bir ağa ihtiyacın var.

👉 Ücretsiz kayıt olun!
CorteQS'te düğün organizatöründen müzisyene, kına malzemecisinden fotoğrafçıya — kültürel etkinliğin için ihtiyacın olan herkesi bul. Geleneğimiz, güven ağıyla yaşıyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kına #Düğün #Gelenek #TürkDiasporası #CorteQS`,
    instagramPost: `🔥 Kına gecesi, Orta Asya'dan bugüne taşınan bir uğurlama töreni! Avrupa'nın dört bir yanında hâlâ yaşatılıyor ✨

Gurbette bir kına, bir düğün, bir sünnet... doğru insanları bulacak bir ağa ihtiyacın var 💃

👉 Ücretsiz kayıt ol, geleneğimizi güven ağıyla yaşat!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Kına #Düğün #Gelenek #TürkDiasporası #YurtDışı #KınaGecesi #TürkDüğünü #KültürelMiras #TürkGurbetçi #CorteQS #Kutlama`,
    redditPost: `Yurt dışında kına gecesi/düğün organize etmek Türkiye'dekinden ne kadar farklı, deneyimi olan var mı?

Kuzenim yurt dışında evleniyor ve kına gecesi organize etmeye çalışırken fark ettik ki burada ne malzemeci var ne de bu işleri bilen bir organizatör bulmak kolay. Türkiye'de her şey hazır bir ekosistem ama burada sıfırdan araştırman gerekiyor.

CorteQS gibi platformlarda düğün organizatöründen müzisyene, kına malzemecisinden fotoğrafçıya kadar bu tür ihtiyaçları bir ağ üzerinden bulmaya çalışan bir yaklaşım gördüm.

Yurt dışında Türk düğünü/kınası organize eden oldu mu, en çok nerede zorlandınız?

corteqs.net`,
  },
  {
    id: "post-17",
    order: 17,
    theme: "basari",
    title: "Vadideki Türkler",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Vadideki Türkler”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A small group of Turkish engineers and founders meet after work at a casual cafe in the San Francisco Bay Area. Laptops, prototype sketches and practical conversation reveal their field; the photograph feels like a real peer meetup rather than a glamorous technology advertisement. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Vadideki Türkler”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Turkish-origin professionals walk between modern office buildings in Silicon Valley after a community lunch, continuing an animated discussion about work and migration. Subtle badges and backpacks are visible but no company logos or readable text appear. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🚀 Silikon Vadisi'nden Londra finans merkezlerine, Avrupa parlamentolarından dünya üniversitelerine — Türkler her alanda yükseliyor. Anadolu Ajansı'na göre (Nisan 2024) Avrupa genelinde 2.427 Türk kökenli siyasetçi görev yapıyor: hükümet düzeyinde 2 bakan ve 2 devlet sekreteri, Avrupa Parlamentosu'nda 7, belediye meclislerinde 2.245 üye.

Başarı bireysel başlar ama topluluğun gücüyle katlanır.

👉 Ücretsiz kayıt olun!
CorteQS, başarılı diaspora profesyonellerini yeni nesille buluşturuyor — 80+ kategoride mentorluk, ilham ve fırsat. Birlikte daha yükseğe.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#BaşarıHikayesi #TürkDiasporası #Mentorluk #Kariyer #CorteQS`,
    instagramPost: `🚀 Silikon Vadisi'nden Avrupa parlamentolarına, Türkler her alanda yükseliyor! Avrupa'da 2.427 Türk kökenli siyasetçi görev yapıyor 📈

Başarı bireysel başlar ama topluluğun gücüyle katlanır 💪

👉 Ücretsiz kayıt ol, ilham ve mentorluk seni bekliyor!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#BaşarıHikayesi #TürkDiasporası #Mentorluk #Kariyer #YurtDışı #SilikonVadisi #TürkProfesyoneller #İlham #Başarı #CorteQS #Networking`,
    redditPost: `Avrupa'da 2.427 Türk kökenli siyasetçi olduğunu öğrenince şaşırdım, bu tür başarı hikayeleri neden yeterince duyulmuyor?

Anadolu Ajansı'nın (Nisan 2024) derlemesine göre Avrupa genelinde belediye meclisinden Avrupa Parlamentosu'na kadar 2.427 Türk kökenli siyasetçi görev yapıyormuş. Bunu okuyunca "biz sadece esnaf ya da işçi diasporasıyız" algısının ne kadar eksik olduğunu düşündüm, aslında her alanda ilerleyen insanlar var ama hikayeleri birbirine ulaşmıyor.

CorteQS gibi platformların böyle profesyonelleri yeni nesille (mentorluk vs.) buluşturma iddiası var, bunun gerçekten pratik bir fayda sağlayıp sağlamadığını merak ediyorum.

Kendi çevrenizde/şehrinizde böyle "aslında hiç bilmediğim ama çok başarılı" bir Türk hikayesine denk geldiniz mi?

corteqs.net`,
  },
  {
    id: "post-18",
    order: 18,
    theme: "basari",
    title: "Garajdan dünyaya",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Garajdan dünyaya”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish founder tests the first working prototype of a small hardware product in a real residential garage, surrounded by tools, shipping boxes and a laptop. A friend helps photograph it for an international customer; the space is imperfect, practical and full of early-stage energy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Garajdan dünyaya”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A three-person Turkish diaspora startup team packs its first overseas orders in a modest workshop. Printed labels are turned away or unreadable, and their genuine concentration and excitement show a business moving from garage-scale effort toward the world. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌱 Pek çok küresel marka, bir göçmenin küçük bir fikriyle başladı. Yurt dışındaki Türkler de teknolojiden gastronomiye, modadan bilime sayısız başarıya imza atıyor.

Senin de bir hikâyen var. Onu büyütecek doğru bağlantılar bir tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, hayalini büyütmek isteyen girişimcileri, yatırımcıları ve danışmanları tek ağda buluşturuyor. Fikrin senden, ağ bizden.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Girişimcilik #TürkDiasporası #Başarı #İlham #CorteQS`,
    instagramPost: `🌱 Pek çok küresel marka bir göçmenin küçük fikriyle başladı! Türkler teknolojiden gastronomiye sayısız başarıya imza atıyor ✨

Senin de bir hikâyen var. Onu büyütecek bağlantılar bir tık uzağında 🚀

👉 Ücretsiz kayıt ol, fikrin senden ağ bizden!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Girişimcilik #TürkDiasporası #Başarı #İlham #YurtDışı #Startup #TürkGirişimci #Yatırımcı #Mentorluk #CorteQS #Networking`,
    redditPost: `Gurbette küçük bir fikirle başlayıp büyüten Türk girişimciler var mı aranızda, deneyimlerinizi merak ediyorum

Bir arkadaşımın garajda başlattığı küçük bir proje şimdi düzgün bir işe dönüştü ve bunu izlerken "keşke bu tür hikayeler daha görünür olsa, keşke daha fazla insan birbirinden ilham alsa" diye düşündüm. Yurt dışındaki Türklerin teknoloji, gastronomi, moda gibi alanlarda ciddi başarılara imza attığını biliyorum ama bu hikayeler genelde dağınık kalıyor.

CorteQS gibi platformların girişimcileri yatırımcı ve danışmanlarla buluşturma iddiası var, bunun gerçek bir fark yaratıp yaratmadığını merak ediyorum.

Siz ya da tanıdığınız biri gurbette bir iş kurdu mu, en büyük engel neydi — sermaye mi, ağ mı, yoksa bürokrasi mi?

corteqs.net`,
  },
  {
    id: "post-19",
    order: 19,
    theme: "yeni-gelenler",
    title: "İlk hafta",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İlk hafta”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A newly arrived Turkish woman stands in a European metro station with one suitcase, comparing a transit map on her phone to the signs around her. All text is intentionally unreadable, but her cautious focus, winter coat and unfamiliar surroundings clearly communicate the first week abroad. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İlk hafta”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A long-term Turkish resident helps a newcomer buy groceries and understand recycling in a small apartment kitchen. Open boxes, unfamiliar packaging and a phone translation screen with no readable words make the practical first-week support tangible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🧭 Yeni bir ülkeye taşındığın ilk hafta: Banka nasıl açılır? Doktor nereye? SIM kart nereden? Her şey bir bilinmez.

Kültür şoku gerçek. Ama "buraya hiç ait değilim" hissini, daha önce aynı yoldan geçmiş biri saniyede dağıtabilir.

👉 Ücretsiz kayıt olun!
CorteQS, yeni gelenlere şehir elçileri ve deneyimli komşularla anında rehberlik sunuyor. Sıfırdan başlama; senden önce gelenlerin tecrübesiyle başla.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #Oryantasyon #TürkDiasporası #Gurbet #CorteQS`,
    instagramPost: `🧭 Yeni ülke, ilk hafta: banka nasıl açılır? Doktor nereye? SIM kart nereden? Her şey bir bilinmez 😅

Ama daha önce aynı yoldan geçmiş biri "buraya hiç ait değilim" hissini saniyede dağıtabilir 🤝

👉 Ücretsiz kayıt ol, senden önce gelenlerin tecrübesiyle başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YeniGelenler #Oryantasyon #TürkDiasporası #Gurbet #YurtDışı #KültürŞoku #İlkHafta #Rehberlik #TürkGurbetçi #CorteQS #ŞehirElçisi`,
    redditPost: `Yeni bir ülkeye taşındığınız ilk hafta en çok hangi "basit" şey sizi zorladı?

Ben banka hesabı açmak için üç farklı şubeye gitmiştim, her seferinde farklı bir evrak eksik çıkıyordu. SIM kart almak, doktor bulmak, hatta market alışverişi bile ilk haftalarda küçük bir sınav gibi geliyor. Kültür şoku dedikleri şey aslında büyük bir travma değil, bu küçük bilinmezliklerin birikmesi sanırım.

Bu süreçte daha önce aynı şehre taşınmış birinden tavsiye almanın ne kadar fark yarattığını fark ettim. CorteQS diye bir platform "şehir elçileri" gibi bir kavramla yeni gelenlere rehberlik sağlamaya çalışıyormuş.

Sizin ilk hafta hikayeniz neydi, en çok neyde zorlandınız ve kim/ne yardımcı oldu?

corteqs.net`,
  },
  {
    id: "post-20",
    order: 20,
    theme: "yeni-gelenler",
    title: "Şehir elçisi",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehir elçisi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A volunteer Turkish city ambassador walks with two newcomers through a real neighborhood, pointing out a clinic, supermarket and tram stop. They carry phones and small notebooks but no maps or signs are legible; the interaction feels like a genuine welcome tour. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehir elçisi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish community volunteer arranges chairs and tea before a small newcomer orientation in a library meeting room. As the first guests arrive with coats and questions, she greets them personally, showing leadership through useful local knowledge rather than ceremony. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🗝️ Her şehirde, yolunu yeni bulanlara rehberlik eden birileri olsa? CorteQS'te var: Şehir Elçileri.

Bulunduğun şehirde güveni inşa eden, sana yolu gösteren tanıdık yüzler. Çünkü gurbette en değerli şey, "ben buradayım, sor" diyen biridir.

👉 Ücretsiz kayıt olun!
CorteQS, şehir elçileriyle yeni gelenleri yerel hayata bağlıyor — güvenli, sıcak, gerçek. Bir dizin değil, yaşayan bir ağ.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirElçisi #TürkDiasporası #YeniGelenler #Topluluk #CorteQS`,
    instagramPost: `🗝️ Her şehirde yolunu yeni bulanlara rehberlik eden biri olsa? CorteQS'te var: Şehir Elçileri! 🌟

Gurbette en değerli şey "ben buradayım, sor" diyen biridir 🤗

👉 Ücretsiz kayıt ol, güvenli ve sıcak bir ağla tanış!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirElçisi #TürkDiasporası #YeniGelenler #Topluluk #YurtDışı #Rehberlik #Güven #TürkGurbetçi #YerelHayat #CorteQS #Gurbet`,
    redditPost: `Yeni geldiğim şehirde "ben buradayım, ihtiyacın olursa sor" diyen biri olsa keşke, böyle bir role ihtiyaç var mı sizce?

Yeni bir şehre taşındığımda en çok özlediğim şey, karşılaştığım her soruna tek tek cevap arayan bir arama motoru değil, "bunu ben de yaşadım, şöyle yap" diyebilecek bir insan olmasıydı. Bazı şehirlerde tesadüfen böyle biriyle tanıştım ve hayatım kolaylaştı, bazılarında hiç bulamadım.

CorteQS'in "Şehir Elçisi" diye bir kavramı var, yerel hayata güven inşa eden tanıdık yüzler olarak tanımlıyorlar. Fikir olarak resmi bir rehber değil, gönüllü bir komşuluk gibi duruyor.

Siz taşındığınız şehirlerde böyle bir "elçi" bulabildiniz mi, yoksa her şeyi kendi başınıza mı çözmek zorunda kaldınız?

corteqs.net`,
  },
  {
    id: "post-21",
    order: 21,
    theme: "isletme",
    title: "Mahallenin Türk esnafı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Mahallenin Türk esnafı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish neighborhood grocer in Europe greets a regular customer while stocking fresh produce and familiar pantry goods. The shop is contemporary, clean and busy, packaging labels unreadable; the owner's warm recognition shows why local diaspora businesses become community anchors. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Mahallenin Türk esnafı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Inside a Turkish-owned repair shop, the owner explains a fixed household appliance to a newly arrived customer. Real tools, receipts turned face-down and a friendly handoff capture the practical trust built around neighborhood tradespeople. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: shield, checkmark, balanced scales, protective circle, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🛒 Yurt dışındaki her Türk fırını, market, kuaför, lokanta — aslında bir köşe başı vatanı.

Türk esnafı, gurbette hem ekonomiye hem kültüre köprü. Ama görünür olmazsa, en güzel dükkân bile keşfedilmeden kalır.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülüyle işletmeni dünyaya aç, müşterini bul, esnaf dayanışmasına katıl. Kendi insanını desteklemek, kendini desteklemektir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkEsnafı #İşletme #Çarşı #TürkDiasporası #CorteQS`,
    instagramPost: `🛒 Yurt dışındaki her Türk fırını, market, kuaför, lokanta... aslında bir köşe başı vatanı! 🏠

Türk esnafı hem ekonomiye hem kültüre köprü. Ama görünür olmazsa keşfedilmeden kalır 👀

👉 Ücretsiz kayıt ol, işletmeni Çarşı'da dünyaya aç!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TürkEsnafı #İşletme #Çarşı #TürkDiasporası #YurtDışı #KüçükİşletmeDestek #EsnafDayanışması #TürkGurbetçi #CorteQS #YerelİşletmelerYaşasın`,
    redditPost: `Yeni taşındığınız şehirde bir Türk fırını/market/kuaför bulduğunuzda o anki rahatlamayı biliyor musunuz?

Geçen ay yeni taşındığım mahallede tesadüfen bir Türk marketi keşfettim ve içeri girer girmez sanki eve gitmişim gibi hissettim, tanıdık ambalajlar, tanıdık kokular. O andan sonra o dükkân benim için sadece alışveriş yeri değil, bir "köşe başı vatan" oldu.

Ama fark ettim ki bu tür yerler genelde ağızdan ağıza ya da tesadüfen bulunuyor, düzgün bir görünürlükleri yok. CorteQS'in Çarşı modülü bu tür Türk esnafını bir araya getirmeyi hedefliyormuş.

Sizin şehrinizde böyle keşfettiğiniz bir "köşe başı vatan" var mı, nasıl buldunuz?

corteqs.net`,
  },
  {
    id: "post-22",
    order: 22,
    theme: "isletme",
    title: "Kendi işini kur",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kendi işini kur”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman unlocks the door of her first small studio business abroad early in the morning. She turns on the lights, sets out products and checks a simple launch checklist on her phone with no readable copy; nervous excitement feels visible and real. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kendi işini kur”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish entrepreneur meets a local accountant and an experienced diaspora mentor at a cafe to review the first-year plan for a new business. Laptops, blank-looking forms and cash-flow notes are present but unreadable, emphasizing practical support rather than startup fantasy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `💼 Gurbette girişimci olmak cesaret ister: dil, bürokrasi, sıfırdan müşteri... Ama yalnız yürümek zorunda değilsin.

Diaspora, en güçlü ilk müşteri kitlen ve en sadık destekçindir.

👉 Ücretsiz kayıt olun!
CorteQS, girişimcileri danışmanlar, yatırımcılar ve müşterilerle aynı güven ağında buluşturuyor. İşini büyütmek için ihtiyacın olan herkes burada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Girişimcilik #TürkDiasporası #İşKurmak #Çarşı #CorteQS`,
    instagramPost: `💼 Gurbette girişimci olmak cesaret ister: dil, bürokrasi, sıfırdan müşteri... ama yalnız yürümek zorunda değilsin! 💪

Diaspora, en güçlü ilk müşteri kitlen ve en sadık destekçin 🙌

👉 Ücretsiz kayıt ol, işini büyütecek herkes burada!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Girişimcilik #TürkDiasporası #İşKurmak #Çarşı #YurtDışı #Startup #TürkGirişimci #KüçükİşletmeDestek #İşGeliştirme #CorteQS #Networking`,
    redditPost: `Yurt dışında sıfırdan iş kuranlar, ilk müşterilerinizi nereden buldunuz?

Bir arkadaşım yurt dışında küçük bir işletme açtı ve en büyük sorunu dil ya da bürokrasi değil, "beni kim tanıyacak, ilk müşterim nereden çıkacak" sorusuydu. Sonunda ilk müşterilerinin büyük kısmı yine kendi diaspora çevresinden çıktı, sonra ağızdan ağıza yayıldı.

Bu konuda CorteQS'in Çarşı modülü gibi bir yerde girişimcilerin diaspora içinde görünürlük kazanabildiğini okudum, ilk müşteri bulma sürecini kolaylaştırıyor mu merak ediyorum.

Siz ya da tanıdığınız biri gurbette iş kurdu mu, ilk müşterilerinizi/desteğinizi nereden buldunuz?

corteqs.net`,
  },
  {
    id: "post-23",
    order: 23,
    theme: "ogrenci",
    title: "Erasmus macerası",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Erasmus macerası”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish Erasmus student arrives at a European university courtyard with a backpack and rolling suitcase, joining a small group of international students who are already sharing directions. The mood is curious and slightly uncertain, with real campus architecture and no readable signage. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Erasmus macerası”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: In a compact student dorm kitchen, a Turkish exchange student cooks with new friends from several countries. Mismatched plates, grocery bags and laughter make the Erasmus experience feel lived-in rather than like a tourism campaign. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🎓 Türkiye'den her yıl yaklaşık 15 bin üniversite öğrencisi Erasmus+ ile yurt dışına gidiyor (Türkiye Ulusal Ajansı). Yeni şehir, yeni dil, yeni hayat — heyecan verici ama bir o kadar da yalnız.

İlk günlerde "burada kimi tanıyorum?" sorusu can sıkar. Cevabı CorteQS'te.

👉 Ücretsiz kayıt olun!
CorteQS, öğrencileri gittikleri şehirdeki Türk topluluğuyla, abilerle ablalarla buluşturuyor. Yabancı bir şehir, tanıdık bir aileye dönüşsün.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Erasmus #Öğrenci #TürkDiasporası #YurtDışıEğitim #CorteQS`,
    instagramPost: `🎓 Yılda ~15 bin öğrenci Erasmus+ ile yurt dışına gidiyor! Yeni şehir, yeni dil, yeni hayat — heyecan verici ama bir o kadar yalnız 🌍

İlk günlerde "burada kimi tanıyorum?" sorusu can sıkar. Cevabı CorteQS'te 💛

👉 Ücretsiz kayıt ol, yabancı şehir tanıdık aileye dönüşsün!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Erasmus #Öğrenci #TürkDiasporası #YurtDışıEğitim #YurtDışı #Üniversite #Değişim #GenZDiaspora #YurtDışındaÖğrenci #CorteQS #Topluluk`,
    redditPost: `Erasmus'a giden herkes ilk haftalarda aynı "burada kimi tanıyorum" paniğini yaşıyor mu?

Türkiye Ulusal Ajansı verilerine göre her yıl ~15 bin öğrenci Erasmus+ ile yurt dışına gidiyormuş. Ben de gittiğimde ilk hafta çok heyecanlıydım ama ikinci hafta yalnızlık bastırdı, herkes kendi arkadaş grubunu kurmuş gibi hissettim ve Türk öğrenci bulmak da tesadüfe kalmıştı.

CorteQS gibi platformların öğrencileri gittikleri şehirdeki Türk topluluğuyla buluşturma iddiası var, ilk hafta yalnızlığını gerçekten azaltabilir mi bilmiyorum.

Erasmus ya da yurt dışı eğitim deneyimi olanlar, siz o ilk hafta yalnızlığını nasıl atlattınız?

corteqs.net`,
  },
  {
    id: "post-24",
    order: 24,
    theme: "ogrenci",
    title: "İlk diploma, ilk gurbet",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İlk diploma, ilk gurbet”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish graduate in cap and gown stands outside a European university while holding a phone on a video call with family in Turkey. Their proud faces appear on screen without readable interface text; her expression mixes achievement with the distance of first-generation migration. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İlk diploma, ilk gurbet”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A young Turkish professional sits on a train with a diploma tube, one suitcase and a laptop bag, traveling from graduation toward a first job in another country. Reflections in the window and a quiet determined expression capture the first diploma and first gurbet together. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📚 Ailenden uzakta okumak büyük bir adım. Maddi kaygı, dil engeli, yalnızlık... Ama doğru destekle bu yolculuk bir kariyere dönüşür.

Senden önce o üniversitede okuyan biri, sana altın değerinde tavsiyeler verebilir.

👉 Ücretsiz kayıt olun!
CorteQS, öğrencileri mezunlarla, mentorlarla ve staj fırsatlarıyla buluşturuyor — eğitimden iş hayatına kesintisiz bir köprü. Geleceğin bugünden başlasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Öğrenci #YurtDışıEğitim #Mentorluk #TürkDiasporası #CorteQS`,
    instagramPost: `📚 Ailenden uzakta okumak büyük bir adım! Maddi kaygı, dil engeli, yalnızlık... ama doğru destekle bu yolculuk bir kariyere dönüşür 🎓

Senden önce o üniversitede okuyan biri sana altın değerinde tavsiyeler verebilir ✨

👉 Ücretsiz kayıt ol, geleceğin bugünden başlasın!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Öğrenci #YurtDışıEğitim #Mentorluk #TürkDiasporası #YurtDışı #Üniversite #Staj #GenZDiaspora #Kariyer #CorteQS #Topluluk`,
    redditPost: `Aynı üniversitede sizden önce okumuş bir Türk öğrenciyle tanışmak gerçekten fark yaratıyor mu?

İlk yılım çok zordu, ders sistemine, dile, şehre alışmaya çalışırken sürekli tek başıma yol buluyordum. İkinci yılda bir üst sınıftan bir Türk öğrenciyle tanıştım ve onun verdiği tavsiyeler (hangi dersten kaçın, hangi hoca nasıl, staj için nereye başvur) benim için resmen bir kısayol oldu.

CorteQS gibi platformların öğrencileri mezunlarla/mentorlarla buluşturma iddiası var, bu tür bağlantılar gerçekten organik olarak mı kuruluyor yoksa hep şansa mı kalıyor merak ediyorum.

Sizin de böyle bir "bir üst sınıftan gelen altın tavsiye" anınız oldu mu?

corteqs.net`,
  },
  {
    id: "post-25",
    order: 25,
    theme: "networking",
    title: "Doğru kişi, doğru an",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Doğru kişi, doğru an”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At a crowded diaspora networking evening, an organizer introduces a newcomer to exactly the professional she needs to meet. The two immediately recognize a shared problem over a tablet with unreadable content, while the busy room remains secondary in soft focus. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Doğru kişi, doğru an”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish parent urgently needs local medical guidance and receives a calm phone introduction to a Turkish-speaking professional. The call happens at a kitchen table with a child nearby; relief arrives through the right person at the right moment, without dramatization. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🔗 İş hayatında en büyük fark: doğru kişiyi doğru anda tanımak.

Gurbette referans bulmak, kapı açmak, sektörde tanınmak — hepsi bir ağ meselesi. Ve o ağ, kökenini paylaşan insanlarla daha hızlı kurulur.

👉 Ücretsiz kayıt olun!
CorteQS'te yazılımcıdan avukata, doktordan akademisyene 80+ kategoride profesyonelleri tek aramada bul. Networking artık tesadüfe kalmıyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Networking #Kariyer #TürkDiasporası #İşDünyası #CorteQS`,
    instagramPost: `🔗 İş hayatında en büyük fark: doğru kişiyi doğru anda tanımak! 🎯

Gurbette referans bulmak, kapı açmak, sektörde tanınmak — hepsi bir ağ meselesi. O ağ kökenini paylaşan insanlarla daha hızlı kurulur 💼

👉 Ücretsiz kayıt ol, networking artık tesadüfe kalmasın!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Networking #Kariyer #TürkDiasporası #İşDünyası #YurtDışı #Profesyoneller #TürkGurbetçi #İşFırsatları #Bağlantı #CorteQS #Referans`,
    redditPost: `Yurt dışında iş bulmada "doğru kişiyi tanımak" gerçekten CV'den daha mı önemli?

Kendi deneyimimde, gönderdiğim onlarca başvurudan geri dönüş alamazken bir tanıdığımın referansıyla girdiğim mülakat çok daha hızlı sonuçlandı. Bu beni biraz rahatsız etti aslında, sanki yetkinlik değil de "kimi tanıyorsun" belirleyici gibi.

CorteQS gibi platformların 80+ kategoride profesyonelleri bir araya getirip bu "tesadüfi referans" meselesini biraz daha sistematik hale getirmeye çalıştığını gördüm.

Siz de yurt dışında iş ararken networking'in CV'den daha belirleyici olduğunu düşünüyor musunuz, yoksa bu abartılan bir şey mi?

corteqs.net`,
  },
  {
    id: "post-26",
    order: 26,
    theme: "mentorluk",
    title: "Bir tavsiye, bir kariyer",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir tavsiye, bir kariyer”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: An experienced Turkish manager reviews a younger professional's resume and portfolio at a coworking table. The documents show layout but no readable words; specific pointing, note-taking and attentive listening make one piece of advice feel capable of changing a career. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir tavsiye, bir kariyer”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish candidate enters a real job interview after a diaspora contact recommended her. Through the glass meeting-room wall, the mentor who helped make the connection gives a discreet encouraging nod before walking away. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌟 Bazen bir kişinin "şunu dene" demesi, aylarca süren iş aramayı kısaltır.

Yurt dışında iş bulmak CV'den ibaret değil; kültürü, sistemi ve kapıları bilen birinin desteğiyle çok daha kolay.

👉 Ücretsiz kayıt olun!
CorteQS, deneyimli profesyonelleri kariyerine yön arayanlarla buluşturuyor. Mentorluk, gurbette en kıymetli sermaye. Bilgi paylaşıldıkça büyür.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Mentorluk #İşBulma #Kariyer #TürkDiasporası #CorteQS`,
    instagramPost: `🌟 Bir "şunu dene" cümlesi, aylarca süren iş aramayı kısaltabilir!

Yurt dışında iş bulmak sadece CV değil; kültürü, sistemi, kapıları bilen biri yanında olunca her şey değişiyor 💼 Mentorluk gurbette en kıymetli sermaye.

👉 Ücretsiz kayıt ol, sana yol gösterecek birini bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Mentorluk #İşBulma #Kariyer #TürkDiasporası #Gurbet #YurtDışı #KariyerTavsiyesi #Networking #İşFırsatı #CorteQS #DiasporaDesteği`,
    redditPost: `Bir mentorun "şunu dene" demesi gerçekten aylarca süren iş aramayı kısaltabiliyor mu?

Aylarca CV gönderip geri dönüş alamadığım bir dönemde, sektörde deneyimli bir tanıdığım "CV'ni şu formatta yaz, şu platformları dene" dedi ve iki hafta içinde üç mülakata çağrıldım. O ana kadar hiç bilmediğim yerel detaylardı, kimse öğretmemişti.

Bu tür mentorluk bağlantılarını kolaylaştırmaya çalışan CorteQS diye bir platform var, deneyimli profesyonelleri kariyerine yön arayanlarla buluşturuyormuş.

Sizin de bir mentor tavsiyesinin iş arama sürecinizi kısalttığı bir an oldu mu, yoksa bu abartılan bir etki mi sizce?

corteqs.net`,
  },
  {
    id: "post-27",
    order: 27,
    theme: "aidiyet",
    title: "Kalabalıkta yalnızlık",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kalabalıkta yalnızlık”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish newcomer stands alone on a packed metro platform as commuters move around him, sharply focused while the crowd carries slight motion blur. His phone is dark in his hand and his expression is contained, showing loneliness inside a very busy city. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kalabalıkta yalnızlık”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: The same kind of newcomer sits at the edge of a small community cafe table and is gently drawn into conversation by two Turkish residents. Coats and bags remain on chairs, making it feel like a first, imperfect step out of isolation rather than an instant friendship montage. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌫️ Gurbet bazen en kalabalık caddede bile hissedilen bir eksikliktir. Etrafın insan dolu ama "beni anlayan kim?" diye sorarsın.

Bu his çok yaygın — ve çok da çözülebilir. Çünkü aidiyet, doğru topluluğu bulmakla başlar.

👉 Ücretsiz kayıt olun!
CorteQS, "kalabalıkta yalnızlık" hissini gerçek bağlantılara dönüştürüyor. Seni anlayan insanlar düşündüğünden çok daha yakında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Aidiyet #Yalnızlık #TürkDiasporası #Topluluk #CorteQS`,
    instagramPost: `🌫️ Kalabalık bir caddede yürürken bile "beni anlayan kim?" diye sormuşluğun var mı?

Bu his çok yaygın ama çözümsüz değil. Aidiyet, doğru topluluğu bulmakla başlıyor — ve o topluluk düşündüğünden çok daha yakın 🫂

👉 Ücretsiz kayıt ol, seni anlayanları bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Aidiyet #Yalnızlık #TürkDiasporası #Topluluk #Gurbet #YurtDışı #KendiniAit #DiasporaBağı #DuygusalDestek #CorteQS`,
    redditPost: `En kalabalık caddede yürürken bile "beni gerçekten anlayan kimse yok" hissi yaşayan var mı?

Şehrin en işlek caddesinde, etrafım tamamen insan doluyken bir keresinde garip bir yalnızlık hissetmiştim, sanki herkes bir cam duvarın arkasındaydı. Sonra fark ettim, mesele fiziksel yalnızlık değil, "beni anlayan kimse burada yok" hissi.

Bu hissi araştırırken CorteQS'in tam da bu "kalabalıkta yalnızlık" durumunu bir sorun olarak tanımladığını gördüm, çözümü doğru topluluğu bulmak olarak sunuyorlar.

Siz de kalabalık bir yerde bu tuhaf yalnızlığı hissettiniz mi, ve bu hissi nasıl aştınız (ya da aşamadınız)?

corteqs.net`,
  },
  {
    id: "post-28",
    order: 28,
    theme: "aidiyet",
    title: "Buraya aitim",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Buraya aitim”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman laughs naturally with neighbors at a street-level community dinner in her adopted city. She is serving food, knows people's names and moves through the space with ease; no national symbols are needed to communicate that she now belongs there. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Buraya aitim”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish family receives the keys to a modest apartment and opens the door together. Moving boxes, a child choosing a corner and warm daylight through bare windows create a grounded sense of finally being able to say, 'I belong here.' At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🫂 Aidiyet, bir yere değil bir insana ait olmaktır bazen. Bir sofraya, bir gülüşe, bir "hoş geldin"e.

Nerede yaşarsan yaşa, seni "biz"den sayan bir topluluk bulduğunda gurbet biter, vatan başlar.

👉 Ücretsiz kayıt olun!
CorteQS, dünyanın neresinde olursan ol sana ait bir topluluk sunuyor — şehir bazlı, sıcak ve gerçek. Kökenin nerede, evin orada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Aidiyet #Topluluk #TürkDiasporası #Gurbet #CorteQS`,
    instagramPost: `🫂 Aidiyet bazen bir yere değil, bir insana aittir.

Bir sofra, bir gülüş, bir "hoş geldin"... Seni "biz"den sayan bir topluluk bulduğunda gurbet biter, vatan başlar ✨

👉 Ücretsiz kayıt ol, bio'daki linkten sen de bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Aidiyet #Topluluk #TürkDiasporası #Gurbet #Diaspora #YurtDışı #KökenimHep #EvimBurada #CorteQS #BizdenSay #SıcakTopluluk`,
    redditPost: `Aidiyet sizin için bir yere mi yoksa bir insan grubuna mı bağlı, hangisi daha belirleyici?

Uzun süre "şu şehre alışırsam kendimi evimde hissederim" diye düşündüm ama şehre tamamen alıştıktan sonra bile bir eksiklik vardı. Sonra bir grup insanla tanıştım, beni gerçekten "biz"den saydılar, ve o an fark ettim ki aidiyet coğrafyayla değil insanla ilgiliymiş.

CorteQS'in de bu fikri merkeze aldığını gördüm, şehir bazlı ama esasen insan bağlantısına odaklanan bir topluluk kurmaya çalışıyorlar.

Siz kendinizi "buraya ait" hissetmenizi ne sağladı — yer mi, zaman mı, yoksa belirli insanlar mı?

corteqs.net`,
  },
  {
    id: "post-29",
    order: 29,
    theme: "geri-donus",
    title: "Geri dönsem mi?",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Geri dönsem mi?”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish professional sits alone at a kitchen table after dark with two real travel folders, family photographs and a laptop showing flight options as unreadable blocks. She weighs returning to Turkey against the life she built abroad, her expression thoughtful rather than melodramatic. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Geri dönsem mi?”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At an airport observation window, a Turkish man watches a plane depart while speaking to family through earbuds. A return ticket and residence card remain face-down in his hand, preserving privacy while making the decision to stay or return feel immediate. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🛤️ "Geri dönsem mi, kalsam mı?" Bu soru, gurbetteki herkesin bir kez olsun zihnini kemirir.

Geri göç; vatan özlemi, kültürel aidiyet, çocukların geleceği... Karmaşık bir karar. Ve en iyisi, aynı kararı vermiş insanlarla konuşarak verilir.

👉 Ücretsiz kayıt olun!
CorteQS, hem kalanları hem dönenleri buluşturuyor; deneyimden beslenen gerçek bir karar ağı. Yalnız karar verme, birlikte değerlendir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GeriDönüş #TersineGöç #TürkDiasporası #Karar #CorteQS`,
    instagramPost: `🛤️ "Geri dönsem mi, kalsam mı?" Bu soru gurbetteki herkesin aklından bir kez geçer.

Vatan özlemi, çocukların geleceği, kültürel aidiyet... Karmaşık bir karar. Ama aynı yoldan geçenlerle konuşunca çok daha net oluyor 🤔

👉 Ücretsiz kayıt ol, deneyimlerden faydalan!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#GeriDönüş #TersineGöç #TürkDiasporası #Karar #Gurbet #YurtDışı #VatanÖzlemi #DönüşYolu #DiasporaDesteği #CorteQS`,
    redditPost: `"Geri dönsem mi kalsam mı" sorusunu gerçekten karara bağlayabilen oldu mu, nasıl karar verdiniz?

Yıllardır bu soruyu kendime soruyorum ve her seferinde farklı bir cevaba varıyorum. Bir gün "çocuklarım için burada kalmalıyım" diyorum, ertesi gün "vatan hasreti dayanılmaz, dönmeliyim" diyorum. En çok işime yarayan şey, aynı ikilemi yaşamış ya da yaşamakta olan insanlarla konuşmak oldu, teorik değil gerçek deneyim.

CorteQS'in hem kalanları hem dönenleri aynı ağda tuttuğunu, deneyim paylaşımına izin verdiğini gördüm.

Geri dönüp de pişman olan ya da kalıp da pişman olan var mı burada, kararınızı neye göre verdiniz?

corteqs.net`,
  },
  {
    id: "post-30",
    order: 30,
    theme: "geri-donus",
    title: "İki vatan arası",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İki vatan arası”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A diaspora family packs gifts, coffee and children's drawings into suitcases before flying between their two homes. The apartment contains objects accumulated in the current country while family photos recall Turkey; the scene feels whole, busy and emotionally mixed. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İki vatan arası”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish mother says goodbye to relatives at an airport arrivals-and-departures hall while her child holds both grandparents' hands. Real luggage, security barriers and restrained emotion show what it means to live continually between two homelands. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `❤️ Bir ayağın burada, bir ayağın orada. İki vatan arasında yaşamak hem zenginlik hem de sürekli bir iç hesaplaşma.

Kal ya da dön — her iki durumda da bir topluluğa ihtiyacın var. Çünkü aidiyet, coğrafyadan önce insanla kurulur.

👉 Ücretsiz kayıt olun!
CorteQS, iki vatan arasında köprü kuran herkesi tek ağda topluyor. Nerede olursan ol, bağın hiç kopmasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İkiVatan #GeriDönüş #TürkDiasporası #Aidiyet #CorteQS`,
    instagramPost: `❤️ Bir ayağın burada, bir ayağın orada...

İki vatan arasında yaşamak hem zenginlik hem sürekli bir iç hesaplaşma. Kal ya da dön, önemli olan bir topluluğa ait olmak 🌍

👉 Ücretsiz kayıt ol, bağın hiç kopmasın!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İkiVatan #GeriDönüş #TürkDiasporası #Aidiyet #Gurbet #YurtDışı #İkiKültür #Memleket #DiasporaBağı #CorteQS`,
    redditPost: `Bir ayağınız burada bir ayağınız orada yaşamak sizce zenginlik mi yoksa yorucu bir iç hesaplaşma mı?

Yıllardır iki vatan arasında yaşıyorum ve bazı günler bunu bir zenginlik olarak görüyorum — iki kültürü, iki bakış açısını taşıyorum. Ama bazı günler de sürekli bir şeyi eksik bırakıyormuşum gibi hissediyorum, ne tam burada tam varım ne tam orada.

Kal ya da dön kararından bağımsız olarak, bu ikili aidiyeti bir topluluk içinde yaşamanın daha kolay olduğunu düşünüyorum. CorteQS gibi platformlar bu köprüyü kurmaya çalışıyor gibi duruyor.

Siz bu "iki vatan arası" hissini nasıl yönetiyorsunuz, zenginlik mi yoksa yük mü sizin için?

corteqs.net`,
  },
  {
    id: "post-31",
    order: 31,
    theme: "etkinlik",
    title: "Bir araya geldiğimizde",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir araya geldiğimizde”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A large mixed-age Turkish diaspora potluck fills a community hall with real food, folding tables and overlapping conversations. Newcomers, students, parents and older migrants participate equally; the value appears in the energy created when people actually gather. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir araya geldiğimizde”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A hands-on community workshop brings Turkish entrepreneurs, job seekers and volunteers around one table to solve a local problem. Sticky notes are blank or out of focus, while faces, gestures and collaborative work make collective strength visible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🎉 Bir festival, bir dernek gecesi, bir halk oyunları gösterisi... Gurbette kültürü yaşatmanın en güzel yolu bir araya gelmek.

Ama bu etkinlikleri duymak, ulaşmak, katılmak çoğu zaman şansa kalıyor. Olmamalı.

👉 Ücretsiz kayıt olun!
CorteQS, şehrindeki dernekleri, vakıfları ve kültürel etkinlikleri tek yerde topluyor. Topluluk hayatına katılmak hiç bu kadar kolay olmamıştı.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Etkinlik #Dernek #TürkDiasporası #Kültür #CorteQS`,
    instagramPost: `🎉 Bir festival, bir dernek gecesi, bir halk oyunları gösterisi...

Gurbette kültürü yaşatmanın en güzel yolu bir araya gelmek! Ama bu etkinlikleri duymak, ulaşmak çoğu zaman şansa kalıyor — artık kalmasın 🕺💃

👉 Ücretsiz kayıt ol, şehrindeki etkinlikleri kaçırma!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Etkinlik #Dernek #TürkDiasporası #Kültür #Gurbet #YurtDışı #TopluluğaKatıl #HalkOyunları #Festival #CorteQS`,
    redditPost: `Şehrinizde bir Türk derneği etkinliği/festivali olduğunu genelde nasıl öğreniyorsunuz, yoksa hiç haberiniz olmuyor mu?

Geçtiğimiz ay meğer şehrimde bir Türk kültür festivali varmış, sonradan bir arkadaşımın Instagram story'sinden öğrendim, kaçırmıştım. Bu tür etkinlikler genelde küçük WhatsApp gruplarında ya da ağızdan ağıza yayılıyor, düzgün bir merkezi duyuru kanalı yok gibi.

CorteQS'in dernekleri, vakıfları ve kültürel etkinlikleri tek yerde toplama iddiası olduğunu gördüm, bu tür bir "kaçırma" sorununu gerçekten çözebilir mi merak ediyorum.

Siz şehrinizdeki etkinlikleri nasıl takip ediyorsunuz, düzenli bir kaynağınız var mı yoksa hep şansa mı kalıyor?

corteqs.net`,
  },
  {
    id: "post-32",
    order: 32,
    theme: "etkinlik",
    title: "Kültürümüz görünür olsun",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kültürümüz görünür olsun”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A contemporary gallery in a European city hosts work by young Turkish diaspora artists. Visitors discuss photography, design and installations while the artists stand among them; any wall labels are unreadable, keeping the image centered on visible cultural contribution rather than folklore. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, soft spotlight, and megaphone silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kültürümüz görünür olsun”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A modern Turkish food and design pop-up opens onto a busy city street. A ceramicist, chef and fashion designer speak directly with local customers in a refined, everyday setting that makes culture visible through current creative work. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, soft spotlight, and megaphone silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌟 Türk kültürü; mutfağıyla, müziğiyle, misafirperverliğiyle dünyada görülmeyi hak ediyor. Her festival, her etkinlik bir gurur vesilesi.

Kültürümüzü yaşatmak, onu paylaşacak bir toplulukla mümkün.

👉 Ücretsiz kayıt olun!
CorteQS, kültürel etkinlikleri ve toplulukları tek ekosistemde buluşturarak kültürümüzü görünür kılıyor. Bir aradayken daha güçlü, daha gururluyuz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Festival #Kültür #TürkDiasporası #Gurur #CorteQS`,
    instagramPost: `🌟 Türk kültürü; mutfağıyla, müziğiyle, misafirperverliğiyle dünyada görülmeyi hak ediyor!

Her festival, her etkinlik bir gurur vesilesi. Kültürümüzü yaşatmak, onu paylaşacak bir toplulukla mümkün 🎊

👉 Ücretsiz kayıt ol, kültürümüzü birlikte görünür kılalım!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Festival #Kültür #TürkDiasporası #Gurur #Gurbet #YurtDışı #KültürelEtkinlik #TürkKültürü #Topluluk #CorteQS`,
    redditPost: `Yerel arkadaşlarınıza Türk kültürünü tanıtmaya çalıştığınızda en çok neyle gurur duyuyorsunuz?

Geçen ay bir uluslararası kültür gününde standımızda Türk mutfağından örnekler sunduk ve yerel arkadaşlarımın gösterdiği ilgi beni çok mutlu etti. Fark ettim ki biz kendi kültürümüzü çoğu zaman "sıradan" görüyoruz ama dışarıdan bakınca aslında ne kadar zengin ve özel.

Bu tür kültürel etkinlikleri organize etmek ve duyurmak için CorteQS gibi bir ekosistem kullanışlı olabilir diye düşündüm, tek yerde toplanmış oluyor.

Siz de kültürünüzü paylaştığınız, gurur duyduğunuz bir an yaşadınız mı, yerel çevrenizin tepkisi nasıldı?

corteqs.net`,
  },
  {
    id: "post-33",
    order: 33,
    theme: "carsi",
    title: "Taşınırken",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Taşınırken”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Friends carry boxes down the narrow stairs of a European apartment while a Turkish newcomer checks the moving van. Real tape, plants, lamps and tired laughter make the relocation physical; no impossible floating objects or spotless catalog interiors. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Taşınırken”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A local Turkish neighbor helps a family assemble furniture in their new flat after a move. Tools, instruction sheets turned away and takeaway food on the floor communicate the practical community that appears when moving becomes difficult. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📦 Yurt dışında taşınmak pahalı ve yorucu. Eşya almak, satmak, devretmek... Hepsi güvenilir bir alıcı-satıcı meselesi.

Tanımadığın birinden almak yerine, kendi topluluğundan güvenle alışveriş yapmak varken neden riske giresin?

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülü, kullanıcıdan kullanıcıya güvenli pazaryeri sunuyor — ev eşyasından arabaya, her şey güven ağında. Alışveriş artık tanıdık eller arasında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Çarşı #İkinciEl #TürkDiasporası #Pazaryeri #CorteQS`,
    instagramPost: `📦 Yurt dışında taşınmak pahalı ve yorucu, biliyoruz!

Eşya almak, satmak, devretmek... Tanımadığın biriyle riske girmek yerine kendi topluluğundan güvenle alışveriş yapsan? 🛋️

👉 Ücretsiz kayıt ol, Çarşı'da güvenle alışveriş yap!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Çarşı #İkinciEl #TürkDiasporası #Pazaryeri #Gurbet #YurtDışı #Taşınma #GüvenliAlışveriş #TürktenTürke #CorteQS`,
    redditPost: `Yurt dışında taşınırken ikinci el eşya alıp satarken kime güveneceğinizi nasıl belirliyorsunuz?

Geçen ay taşınırken yerel bir ilan sitesinden eşya almaya çalıştım ama iki kez randevuya gelmeyen satıcıyla uğraştım, güven konusunda hep tedirginlik yaşadım. Sonra bir arkadaşım "neden kendi çevrenden birinden almıyorsun" dedi ve haklıydı, aynı topluluktan biriyle işlem yapmak psikolojik olarak çok daha rahat.

CorteQS'in Çarşı modülünün tam olarak bu "tanıdık elden alışveriş" ihtiyacına yönelik olduğunu okudum.

Siz genel platformlar (Marketplace, eBay Kleinanzeigen vs.) yerine "sadece kendi topluluğunuzdan" alışveriş yapmayı tercih eder misiniz, yoksa fiyat/seçenek daha mı önemli?

corteqs.net`,
  },
  {
    id: "post-34",
    order: 34,
    theme: "carsi",
    title: "Sıfırdan yuva",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Sıfırdan yuva”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish couple builds their first home abroad in an almost empty apartment, measuring curtains and assembling a table while their child draws nearby. Bare walls, open boxes and warm window light make the beginning modest, specific and hopeful. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Sıfırdan yuva”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman hangs the first family photograph in a newly rented apartment after setting a kettle on the stove. The room is still sparse, but a plant, blanket and two cups show the instant a temporary space starts to become a home. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🏡 Gurbette sıfırdan bir yuva kurmak; bir koltuk, bir halı, bir çaydanlıkla başlar. Ve her parça, güvendiğin birinden gelince daha değerli.

Yeni evini kurarken, topluluğun elinden tutar.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülünde ihtiyacın olan her şeyi kendi insanından, güvenle bul. Yuvanı kurarken yalnız değilsin.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#EvKurma #Çarşı #TürkDiasporası #Yuva #CorteQS`,
    instagramPost: `🏡 Gurbette sıfırdan bir yuva kurmak, bir koltuk bir halı bir çaydanlıkla başlar.

Ve her parça güvendiğin birinden gelince daha değerli oluyor! Yuvanı kurarken topluluğun elinden tutuyor 🪴

👉 Ücretsiz kayıt ol, ihtiyacını kendi insanından bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#EvKurma #Çarşı #TürkDiasporası #Yuva #Gurbet #YurtDışı #YeniEv #GüvenliAlışveriş #TürktenTürke #CorteQS`,
    redditPost: `Yurt dışında sıfırdan ev kurarken en çok neye para/enerji harcadınız, ne kadarını ikinci elle çözdünüz?

İlk evimi kurarken bütçemin çoğu koltuk, dolap gibi büyük eşyalara gitti. Yeni almak inanılmaz pahalıydı, sonunda çoğunu ikinci elden buldum ama güvenilir bir satıcı bulmak da ayrı bir uğraştı. Şimdi düşünüyorum da, bir yuvayı sıfırdan kurmak sadece maddi değil duygusal bir süreç de.

CorteQS'in Çarşı kısmında bu ihtiyaçları kendi topluluğundan karşılamayı öneriyorlarmış.

Siz yeni evinizi kurarken neyi ikinci elden, neyi sıfırdan aldınız, ve bu süreçte en çok zorlandığınız şey neydi?

corteqs.net`,
  },
  {
    id: "post-35",
    order: 35,
    theme: "dayanisma",
    title: "Cuma buluşması",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Cuma buluşması”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A group of Turkish friends meet after work on Friday at a relaxed cafe terrace, arriving in office clothes and greeting one another with visible relief. Tea, coffee and shared plates feel ordinary; the weekly rhythm of connection is the subject. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Cuma buluşması”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Several Turkish diaspora families share a simple Friday evening meal in a community room while children play near the tables. The lighting is practical and warm, and the scene emphasizes regular presence rather than a formal celebration. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🕌 Gurbette cami, sadece bir ibadet yeri değil; bir buluşma, bir dayanışma, bir "memleket köşesi"dir.

Manevi bağ kadar, insanlar arası bağ da güç verir. Birlikte dua etmek kadar birbirine destek olmak da değerli.

👉 Ücretsiz kayıt olun!
CorteQS, manevi toplulukları ve dayanışma ağlarını bir araya getiriyor. Gönül bağı, güven ağıyla daha da güçlenir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #Topluluk #TürkDiasporası #ManeviBağ #CorteQS`,
    instagramPost: `🕌 Gurbette cami sadece bir ibadet yeri değil; bir buluşma, bir dayanışma, bir "memleket köşesi"dir.

Manevi bağ kadar insanlar arası bağ da güç verir. Birlikte dua etmek kadar birbirine destek olmak da değerli 🤝

👉 Ücretsiz kayıt ol, manevi topluluğunu bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Dayanışma #Topluluk #TürkDiasporası #ManeviBağ #Gurbet #YurtDışı #Cuma #GönülBağı #CorteQS #DiasporaTopluluğu`,
    redditPost: `Gurbette cami/cemaat çevresi sadece ibadet için mi yoksa sosyal bir dayanışma noktası olarak mı işlev görüyor sizce?

Yeni taşındığım şehirde Cuma namazına gitmeye başladığımda fark ettim ki asıl değer namazdan sonraki sohbetlerdeymiş, kimin işe ihtiyacı var, kim yeni geldi, kim yardıma muhtaç — bunlar orada konuşuluyor. Yani ibadet yeri aynı zamanda bir "memleket köşesi" gibi işliyor.

CorteQS gibi platformların manevi toplulukları ve dayanışma ağlarını da görünür kılmaya çalıştığını gördüm.

Siz de gurbette dini/manevi bir mekanın aynı zamanda güçlü bir sosyal dayanışma noktası olduğunu düşünüyor musunuz, yoksa bu ikisi sizin için ayrı mı?

corteqs.net`,
  },
  {
    id: "post-36",
    order: 36,
    theme: "dayanisma",
    title: "Zor günde yanında",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Zor günde yanında”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Two Turkish neighbors deliver groceries and a cooked meal to a family dealing with illness. The exchange happens quietly at an apartment door, with genuine concern and no dramatic hospital imagery; the practical help is the emotional center. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Zor günde yanında”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman sits beside a grieving friend on a park bench, holding her hand without trying to fix the moment. A phone with supportive messages rests face-down nearby, showing how a community can remain present on a hard day. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🤲 Gurbette en çok ihtiyaç duyulan şey: zor bir günde "yanındayım" diyen bir el.

Hastalık, kayıp, kriz... Bunlar yalnız taşınmamalı. Bir topluluk, en ağır yükü hafifletir.

👉 Ücretsiz kayıt olun!
CorteQS, dayanışmayı bir değer değil, bir refleks haline getiriyor. Birbirine kenetlenen bir ağda, kimse yalnız kalmaz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #TürkDiasporası #Topluluk #Yardımlaşma #CorteQS`,
    instagramPost: `🤲 Gurbette en çok ihtiyaç duyulan şey: zor bir günde "yanındayım" diyen bir el.

Hastalık, kayıp, kriz... Bunlar yalnız taşınmamalı. Bir topluluk en ağır yükü bile hafifletir 💛

👉 Ücretsiz kayıt ol, kimse yalnız kalmasın!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Dayanışma #TürkDiasporası #Topluluk #Yardımlaşma #Gurbet #YurtDışı #ZorGündeYanında #DiasporaAilesi #Destek #CorteQS`,
    redditPost: `Gurbette ciddi bir hastalık/kriz anında ailenizden uzakta kim yardımınıza koştu?

Geçen yıl ameliyat oldum ve ailem binlerce km uzaktaydı, o dönem beni hastaneye götürüp getiren, yemek yapan komşularım oldu — aslında birkaç ay önce tanıştığım insanlardı. O anda fark ettim, gurbette gerçek aile bazen kan bağı değil, yanında olan insanlar.

CorteQS'in dayanışmayı bir "refleks" haline getirme iddiasını okuyunca bu deneyimimi hatırladım.

Sizin de gurbette zor bir anda beklemediğiniz birinin yanınızda olduğu bir hikayeniz var mı?

corteqs.net`,
  },
  {
    id: "post-37",
    order: 37,
    theme: "spor",
    title: "Gurbette milli maç",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette milli maç”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Turkish diaspora friends and families watch a national football match together in a neighborhood cafe. No team logos or readable broadcast graphics appear; faces, scarves in neutral red tones, raised hands and shared tension communicate the collective experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette milli maç”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: After a late goal, Turkish fans spill onto a European city street in an orderly, joyful celebration. Parents, students and older supporters hug and laugh under streetlights, with no flags dominating the image and no aggressive crowd behavior. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `⚽ EURO 2024 grup aşamasında Türk taraftarlar toplam 130 bin biletle tribünleri doldurdu; Hürriyet'in deyişiyle "ev sahibi Almanya'dan (125 bin) bile daha fazla taraftar topladı." Gurbetin ortasında koca bir Türkiye yarattılar.

Milli maç gecesi, gurbetçinin en birleştirici anı. Birlikte bağırmak, birlikte sevinmek — paha biçilemez.

👉 Ücretsiz kayıt olun!
CorteQS, maç gecesi buluşmalarını, taraftar gruplarını ve canlı yayın mekanlarını tek yerde topluyor. Coşkuyu paylaşacak bir tribün hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Futbol #MilliTakım #TürkDiasporası #Taraftar #CorteQS`,
    instagramPost: `⚽ EURO 2024'te Türk taraftarlar 130 bin biletle tribünleri doldurdu — ev sahibi Almanya'dan bile fazla! Gurbetin ortasında koca bir Türkiye yarattık 🇹🇷🔥

Milli maç gecesi, gurbetçinin en birleştirici anı. Birlikte bağırmak, birlikte sevinmek paha biçilemez!

👉 Ücretsiz kayıt ol, coşkunu paylaşacak tribünü bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Futbol #MilliTakım #TürkDiasporası #Taraftar #Gurbet #YurtDışı #MilliMaç #Ayyıldız #FutbolTutkusu #CorteQS`,
    redditPost: `EURO 2024'te Türk taraftarların ev sahibi Almanya'dan bile fazla bilet almasını nasıl açıklıyorsunuz?

Hürriyet'in haberine göre Türk taraftarlar grup aşamasında 130 bin biletle tribünleri doldurmuş, ev sahibi Almanya'dan (125 bin) bile fazla. Bunu okuyunca gurbetteki Türklerin aslında ne kadar güçlü ve görünür bir kitle olduğunu bir kez daha fark ettim, sadece dağınık bireyler değil, bir araya gelince koca bir stadyum dolduran bir güç.

Milli maç gecelerinde toplu izleme mekanları/taraftar gruplarını bulmak için CorteQS gibi platformlar kullanışlı olabilir diye düşündüm.

Siz milli maçları nerede, kimlerle izliyorsunuz — büyük bir grupla mı yoksa genelde yalnız mı?

corteqs.net`,
  },
  {
    id: "post-38",
    order: 38,
    theme: "spor",
    title: "Aynı takım, aynı çatı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Aynı takım, aynı çatı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Three generations of a Turkish family watch the same football match from one living room abroad. A grandfather, parents and children lean forward together, snacks and tea on the table; the television content is blurred so emotion rather than branding drives the image. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Aynı takım, aynı çatı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Turkish friends from different regions and backgrounds sit under one roof in a community clubhouse, wearing simple team-color accents without logos. Their synchronized reaction to the match shows how a shared team can briefly erase other differences. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📺 Bir golü tek başına izlemek başka, 30 kişiyle bağırarak kutlamak başka.

Sporun gurbette en güzel yanı: yabancıları bir anda kardeş yapması. Bir takım sevgisi, bir şehirde koca bir aile kurabilir.

👉 Ücretsiz kayıt olun!
CorteQS, aynı takımı tutanları, aynı coşkuyu paylaşanları buluşturuyor. Tribünün her yerde seninle.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Spor #Futbol #TürkDiasporası #Topluluk #CorteQS`,
    instagramPost: `📺 Bir golü tek başına izlemek başka, 30 kişiyle bağırarak kutlamak başka!

Sporun gurbette en güzel yanı: yabancıları bir anda kardeş yapması. Bir takım sevgisi koca bir aile kurabiliyor ⚽🎉

👉 Ücretsiz kayıt ol, tribünün her yerde seninle olsun!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Spor #Futbol #TürkDiasporası #Topluluk #Gurbet #YurtDışı #MaçKeyfi #SporTutkusu #Arkadaşlık #CorteQS`,
    redditPost: `Bir golü tek başına salonda izlemekle 30 kişiyle bir kafede izlemek arasındaki fark sizi de şaşırtıyor mu?

Geçen sezon bir maçı yalnız izledim, gol olunca sessizce sevindim ve hemen unuttum. Bir hafta sonra aynı takımın maçını bir grup Türkle bir mekanda izledim, aynı gol atıldığında herkes birbirine sarıldı, o an aklımda kaldı. Aynı olay ama tamamen farklı bir deneyim.

CorteQS'in maç gecesi buluşmalarını/taraftar gruplarını bir araya getirdiğini okudum.

Siz maçları genelde nasıl izliyorsunuz, yalnız mı yoksa bir grupla mı, ve fark gerçekten bu kadar büyük mü sizce?

corteqs.net`,
  },
  {
    id: "post-39",
    order: 39,
    theme: "teknoloji",
    title: "Görünmez ağı görünür kıl",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Görünmez ağı görünür kıl”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A real diaspora networking event fills a bright coworking space as introductions happen simultaneously: a mentor reviews a portfolio, a business owner meets a supplier and a newcomer gets local advice. The network becomes visible through concrete human exchanges, not lines or nodes. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Görünmez ağı görünür kıl”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Over the shoulder of a Turkish user who finds a useful contact on a phone and then looks up to see that person entering the cafe. The profile screen is unreadable, while the real greeting in the same frame turns an invisible digital connection into a visible relationship. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, profile badge, camera, and open book. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌐 8,8 milyonluk bir halk, görünmez bir ağla birbirine bağlı. Teknoloji, bu ağı nihayet görünür kılabilir.

Dijital topluluk, mesafeyi anlamsız kılıyor. Berlin'deki bir yazılımcı, Sidney'deki bir girişimciyle saniyeler içinde bağlanabilir.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık diasporayı tek bir dijital güven ağında topluyor — 251 ülke, 80+ kategori, 7/24 yaşayan bir ekosistem. Geleceğin topluluğu burada kuruluyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#DijitalTopluluk #Teknoloji #TürkDiasporası #Network #CorteQS`,
    instagramPost: `🌐 8,8 milyonluk bir halk, görünmez bir ağla birbirine bağlı. Teknoloji bu ağı nihayet görünür kılıyor!

Dijital topluluk, mesafeyi anlamsız kılıyor. Berlin'deki yazılımcı, Sidney'deki girişimciyle saniyeler içinde bağlanabiliyor ⚡

👉 Ücretsiz kayıt ol, dijital güven ağının parçası ol!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#DijitalTopluluk #Teknoloji #TürkDiasporası #Network #Gurbet #YurtDışı #Bağlantı #DiasporaAğı #GeleceğinTopluluğu #CorteQS`,
    redditPost: `Teknoloji dağınık bir diasporayı gerçekten "görünür" kılabilir mi, yoksa bu hep bir vaat olarak mı kalıyor?

8,8 milyonluk bir halk olduğumuzu ama birbirimizden habersiz yaşadığımızı düşününce garip geliyor. Facebook grupları, WhatsApp toplulukları falan hep var ama hepsi dağınık, hiçbiri diğerinden haberdar değil. Teknoloji bunu "çözüyoruz" diyen çok platform gördüm ama çoğu bir süre sonra terk ediliyor.

CorteQS de kendini böyle bir "dijital güven ağı" olarak konumlandırıyor, 251 ülke 80+ kategori gibi büyük rakamlarla.

Sizce bu tür "diasporayı dijitalde birleştirme" projeleri gerçekten işe yarıyor mu, yoksa hep aynı kaderi mi paylaşıyorlar (başlangıç heyecanı, sonra sessizlik)?

corteqs.net`,
  },
  {
    id: "post-40",
    order: 40,
    theme: "teknoloji",
    title: "Tek aramada bul",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Tek aramada bul”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish parent searches a directory on a phone for a nearby Turkish-speaking pediatric dentist while sitting in a real waiting area. Search filters and profile photos are visible but unreadable; the chosen result is clear through composition and the parent's relieved focus. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, camera, open book, and activity symbol. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Tek aramada bul”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A newcomer at a laptop types one practical need and immediately sees a concise set of local professionals, businesses and community contacts. The interface contains realistic photos and category cards with no legible words; a packed moving box beside the desk explains why speed matters. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🔍 Şehir, meslek ya da isim. Aradığın Türk profesyoneli tek aramada bulmak artık hayal değil.

Eskiden "tanıdık" bulmak şansa kalıyordu. Artık dünyaya yayılmış diaspora, parmağının ucunda.

👉 Ücretsiz kayıt olun!
CorteQS, 80+ kategoride dünyaya yayılmış diaspora ağında ara, bağlan, keşfet. Aradığın kişi, bir tık uzağında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Teknoloji #Network #TürkDiasporası #DijitalAğ #CorteQS`,
    instagramPost: `🔍 Şehir, meslek ya da isim yaz — aradığın Türk profesyoneli tek aramada bul!

Eskiden "tanıdık" bulmak şansa kalıyordu. Artık dünyaya yayılmış diaspora parmağının ucunda 📱

👉 Ücretsiz kayıt ol, aramaya başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Teknoloji #Network #TürkDiasporası #DijitalAğ #Gurbet #YurtDışı #Arama #Keşfet #TürkProfesyoneller #CorteQS`,
    redditPost: `Bulunduğunuz şehirde belirli bir meslekten bir Türk aramanız gerektiğinde genelde nasıl buluyorsunuz?

Geçen ay bir avukata ihtiyacım oldu ve önce Facebook gruplarında sordum, sonra tanıdığımın tanıdığına ulaştım, üç gün sürdü. Düşündüm de bu kadar dağınık bir şekilde aramak yerine tek bir arama kutusuna şehir + meslek yazıp bulabilseydim ne kadar kolay olurdu.

CorteQS diye bir platform tam da bunu vaat ediyor: şehir, meslek ya da isimle arayıp dünyaya yayılmış diaspora içinde profesyonel bulmak.

Siz böyle bir ihtiyaç yaşadığınızda genelde nasıl çözüyorsunuz, hâlâ eski usul "tanıdığın tanıdığı" yöntemi mi işe yarıyor?

corteqs.net`,
  },
  {
    id: "post-41",
    order: 41,
    theme: "ebeveyn",
    title: "Gurbette ebeveyn olmak",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette ebeveyn olmak”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Turkish parents abroad talk with other families at a city playground while their bilingual children play. Strollers, snacks and school bags make the challenges of parenting tangible; the adults exchange practical advice rather than posing for a family portrait. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette ebeveyn olmak”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish father attends a pediatric appointment in a foreign-language environment with help from another diaspora parent who has been through the process. Forms and signs are unreadable, while careful listening and reassuring body language show shared parenting knowledge. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `👶 Gurbette çocuk büyütmek, kılavuzsuz bir yolculuk. "Bizim mahalle" yok, "yan komşu teyze" yok, danışacak büyük yok.

Ama aynı yoldan geçen anneler, babalar var. Onları bulmak, en büyük destek.

👉 Ücretsiz kayıt olun!
CorteQS, gurbetteki ebeveynleri buluşturuyor; oyun gruplarından tavsiyelere, dil desteğinden dostluğa. Çocuğunu bir köy büyütür — biz o köyü kuruyoruz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Ebeveyn #Anne #Baba #TürkDiasporası #CorteQS`,
    instagramPost: `👶 Gurbette çocuk büyütmek, kılavuzsuz bir yolculuk.

"Bizim mahalle" yok, "yan komşu teyze" yok... Ama aynı yoldan geçen anne babalar var! Onları bulmak en büyük destek 🍼

👉 Ücretsiz kayıt ol, ebeveyn topluluğuna katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Ebeveyn #Anne #Baba #TürkDiasporası #Gurbet #YurtDışı #ÇocukBüyütmek #EbeveynDesteği #AileTopluluğu #CorteQS`,
    redditPost: `Gurbette çocuk büyütürken "bizim mahalle" yokluğunu en çok ne zaman hissettiniz?

Çocuğum hastalandığında ilk refleksim yan komşuya koşmak oldu ama sonra hatırladım, burada öyle bir "teyze" yok, herkes kendi hayatında. Türkiye'de büyürken etraftaki komşuların, akrabaların otomatik desteği burada hiç yok, her şeyi kendi başıma çözmem gerekiyor.

CorteQS'in ebeveynleri buluşturma, "bir köy kurma" gibi bir yaklaşımı olduğunu okudum, oyun gruplarından tavsiyelere kadar.

Siz gurbette ebeveynlik yaparken bu desteği nereden buluyorsunuz, yoksa hâlâ tamamen yalnız mı ilerliyorsunuz?

corteqs.net`,
  },
  {
    id: "post-42",
    order: 42,
    theme: "ebeveyn",
    title: "Bir anne bir anneyi anlar",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir anne bir anneyi anlar”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Two Turkish mothers who met through the community share coffee beside a playground, one listening closely as the other talks about a difficult week. Their children play safely in the background; the understanding between them is quiet and immediate. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir anne bir anneyi anlar”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish mother helps another carry a stroller and groceries up apartment steps while both laugh at the familiar struggle. The scene is practical, unglamorous and warm, showing empathy grounded in the same daily experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🍼 Gurbette bir anne, başka bir anneyi en iyi anlayandır. Uykusuz geceler, dil endişesi, "doğru mu yapıyorum?" kaygısı — hepsi paylaşılınca hafifler.

Yalnız ebeveynlik yorar. Topluluk iyileştirir.

👉 Ücretsiz kayıt olun!
CorteQS, anne-baba topluluklarıyla gurbette ebeveynliği bir dayanışmaya çeviriyor. Soru sorabileceğin, dert paylaşabileceğin bir aile hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Anne #Ebeveyn #TürkDiasporası #Topluluk #CorteQS`,
    instagramPost: `🍼 Gurbette bir anne, başka bir anneyi en iyi anlayandır.

Uykusuz geceler, dil endişesi, "doğru mu yapıyorum?" kaygısı... Hepsi paylaşılınca hafifliyor 💛 Yalnız ebeveynlik yorar, topluluk iyileştirir.

👉 Ücretsiz kayıt ol, anne-baba topluluğuna katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Anne #Ebeveyn #TürkDiasporası #Topluluk #Gurbet #YurtDışı #AnneDesteği #EbeveynTopluluğu #Dayanışma #CorteQS`,
    redditPost: `"Doğru mu yapıyorum" kaygısını sadece başka bir anneyle paylaşınca mı gerçekten hafifliyor?

Yerel arkadaşlarıma çocuğumla ilgili endişelerimi anlatınca kibarca dinliyorlar ama tam olarak anlamıyorlar sanki. Geçen hafta başka bir Türk anneyle tanıştım, aynı uykusuz gece hikayelerini, aynı "iki dilli büyütme" kaygısını paylaşınca resmen rahatladım. Sanki biri "sen normalsin" demiş gibi hissettim.

CorteQS'in anne-baba topluluklarıyla bu dayanışmayı kolaylaştırmaya çalıştığını gördüm.

Siz de aynı kültürden bir ebeveynle konuşmanın, yerel çevrenizle konuşmaktan farklı bir rahatlama sağladığını düşünüyor musunuz?

corteqs.net`,
  },
  {
    id: "post-43",
    order: 43,
    theme: "tatil",
    title: "Yaz geldi, yollar açıldı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Yaz geldi, yollar açıldı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish family loads a real car for a summer road trip toward Turkey, fitting suitcases, gifts and a cooler into the trunk before dawn. Children wait sleepily in the back seat, and the parents' practiced coordination captures a familiar diaspora summer ritual. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Yaz geldi, yollar açıldı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At an airport arrivals hall in summer, Turkish grandparents see their grandchildren running toward them after a long flight. Luggage carts, casual clothes and genuine surprise make the reunion vivid without turning it into a travel advertisement. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🚗 Yaz demek, gurbetçi için "memlekete gidiş" demek. Aylar öncesinden sayılan günler, dolan valizler, gözlerde o bilindik ışıltı.

Türkiye'ye gidiş bir tatil değil, bir kavuşma. Ve bu yolculuk, paylaşıldıkça güzelleşir.

👉 Ücretsiz kayıt olun!
CorteQS, memlekete dönüş öncesi tavsiyelerden yol arkadaşlarına kadar her şeyi bir araya getiriyor. Kavuşmanın heyecanını topluluğunla paylaş.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Tatil #Memleket #TürkDiasporası #YazTatili #CorteQS`,
    instagramPost: `🚗 Yaz demek, gurbetçi için "memlekete gidiş" demek!

Aylar öncesinden sayılan günler, dolan valizler, gözlerde o bilindik ışıltı ✨ Türkiye'ye gidiş bir tatil değil, bir kavuşma.

👉 Ücretsiz kayıt ol, kavuşma heyecanını paylaş!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Tatil #Memleket #TürkDiasporası #YazTatili #Gurbet #YurtDışı #MemleketeDönüş #YazGeldi #Kavuşma #CorteQS`,
    redditPost: `Siz de yazın memlekete gidiş gününü aylar öncesinden geri sayarak mı bekliyorsunuz?

Her yıl mayıs ayı gelince telefonumun takviminde "Türkiye'ye gidişe X gün kaldı" hatırlatıcısı kuruyorum, biraz saplantılı geliyor ama gerçek. Valizler ay öncesinden hazırlanmaya başlıyor, herkese götürülecek hediyeler planlanıyor. Bu bana hiç "tatil" gibi gelmiyor, daha çok bir kavuşma provası gibi.

Bu yolculuk öncesi tavsiye/deneyim paylaşımı için CorteQS gibi bir topluluk kullanışlı olabilir diye düşündüm.

Siz de bu "geri sayım" ritüelini yaşıyor musunuz, yoksa bu sadece bende mi bu kadar abartılı?

corteqs.net`,
  },
  {
    id: "post-44",
    order: 44,
    theme: "tatil",
    title: "Sılaya selam",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Sılaya selam”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman stands on a balcony in her adopted city, video-calling relatives gathered at a table in Turkey. The phone screen shows their faces with no readable interface; she raises a tea glass in greeting as evening light connects the two homes. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Sılaya selam”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A family abroad packs a careful parcel of children's drawings, local treats and photographs to send to relatives in Turkey. Shipping labels remain blank or turned away; the hands arranging each item carry the feeling of sending a greeting to sıla. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `✈️ Uçağın camından sahili gördüğün an boğazına düğümlenen o duygu... İşte o, sıla.

Her yaz milyonlarca gurbetçi sınır kapılarından akın ediyor. Çünkü vatan, görülmese de kalpte hep en üstte.

👉 Ücretsiz kayıt olun!
CorteQS, hem gittiğin yerde hem döndüğün yerde bağını canlı tutuyor. Sıla da gurbet de artık tek bir ağda buluşuyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Sıla #Memleket #TürkDiasporası #Tatil #CorteQS`,
    instagramPost: `✈️ Uçağın camından sahili gördüğün an boğazına düğümlenen o duygu... İşte o, sıla!

Her yaz milyonlarca gurbetçi sınır kapılarından akın ediyor. Vatan görülmese de kalpte hep en üstte 💛

👉 Ücretsiz kayıt ol, bağın hiç kopmasın!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Sıla #Memleket #TürkDiasporası #Tatil #Gurbet #YurtDışı #SılaÖzlemi #Kavuşma #Vatan #CorteQS`,
    redditPost: `Uçak camından sahili/kıyıyı ilk gördüğünüz an boğazınıza bir şey düğümlendiğini hissediyor musunuz?

Her sene aynı an geliyor: uçak alçalmaya başlıyor, bulutların arasından ilk kıyı şeridi görünüyor ve nedenini tam açıklayamadığım bir duygu boğazımı düğümlüyor. Yanımdaki yolculara bakıyorum, çoğunun gözünde aynı ışıltı var, kelimelerle anlatmaya çalışmıyoruz bile, sanki hepimiz aynı şeyi hissediyoruz.

Bu "sıla" duygusunu ve dönüş öncesi hazırlıkları paylaşmak için CorteQS gibi bir topluluk var, ilginç geldi.

Siz de bu "iniş anı" duygusunu yaşıyor musunuz, nasıl tarif edersiniz?

corteqs.net`,
  },
  {
    id: "post-45",
    order: 45,
    theme: "carsi",
    title: "Güvenle al, güvenle sat",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Güvenle al, güvenle sat”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish buyer inspects a second-hand bicycle with the seller in a well-lit public courtyard. They compare the item to an unreadable marketplace listing on a phone, test the brakes and complete the exchange calmly, making safety and transparency visible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Güvenle al, güvenle sat”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman photographs a small dining table she is selling before a move, capturing condition details honestly while a friend helps measure it. The listing interface on her phone has no readable text; the scene emphasizes trustworthy peer-to-peer exchange. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🛍️ Gurbette en çok duyulan cümle: "Acaba güvenilir mi?" Tanımadığın biriyle alışveriş hep tedirgin eder.

Çözüm basit: kendi güven ağında alıp sat.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülü, kullanıcıdan kullanıcıya güvene dayalı bir pazaryeri. Ne alırsan al, kimden alırsan al — hep tanıdık, hep güvenli.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Çarşı #Pazaryeri #TürkDiasporası #Güven #CorteQS`,
    instagramPost: `🛍️ Gurbette en çok duyulan cümle: "Acaba güvenilir mi?"

Tanımadığın biriyle alışveriş hep tedirgin eder. Çözüm basit: kendi güven ağında alıp sat! ✅

👉 Ücretsiz kayıt ol, Çarşı'da güvenle alışveriş yap!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Çarşı #Pazaryeri #TürkDiasporası #Güven #Gurbet #YurtDışı #GüvenliAlışveriş #İkinciEl #TürktenTürke #CorteQS`,
    redditPost: `"Acaba güvenilir mi" düşüncesi olmadan bir ikinci el alışveriş yaptınız mı hiç?

Yerel bir ilan sitesinden bir şey alacağım zaman içimde hep bir tedirginlik oluyor, para transferi mi önce yapılır, buluşma yeri güvenli mi, kişi gerçekten dediği gibi mi. Sonra bir arkadaşımın Türk topluluğundan biriyle çok rahat bir alışveriş yaptığını duydum, "zaten aynı çevredeniz" güveniyle.

CorteQS'in Çarşı modülü bu "kendi güven ağında alışveriş" fikrine dayanıyormuş.

Sizce niş bir "sadece kendi topluluğundan al-sat" pazarı, genel platformlardaki güven sorununu gerçekten çözer mi, yoksa küçük ölçekte kalmaya mahkum mu?

corteqs.net`,
  },
  {
    id: "post-46",
    order: 46,
    theme: "cadde",
    title: "Şehrinin nabzı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehrinin nabzı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish resident walks through a lively neighborhood street festival while checking the local Cadde feed on her phone for what is happening nearby. The screen shows event images and location cards without readable copy; the real street around her confirms the city's pulse. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehrinin nabzı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Friends at a cafe compare several local updates on a tablet before deciding where to go that evening. Through the window, the city is active with markets and cyclists; the feed and the physical neighborhood feel like one continuous experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📍 Şehrinde bugün ne oluyor? Hangi etkinlik var, kim ne paylaşıyor, nerede buluşuluyor?

Gurbette en çok ihtiyaç duyulan şey, şehrinin nabzını tutmak. Yerel hayata bağlı kalmak.

👉 Ücretsiz kayıt olun!
CorteQS'in Cadde modülü, şehir bazlı sosyal akışla bulunduğun yerdeki diaspora hayatını canlı tutuyor. Şehrinin nabzı artık avucunun içinde.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Cadde #ŞehirHayatı #TürkDiasporası #SosyalAğ #CorteQS`,
    instagramPost: `📍 Şehrinde bugün ne oluyor? Hangi etkinlik var, kim ne paylaşıyor, nerede buluşuluyor?

Gurbette en çok ihtiyaç duyulan şey, şehrinin nabzını tutmak! Yerel hayata bağlı kalmak hiç bu kadar kolay olmamıştı 📲

👉 Ücretsiz kayıt ol, şehrinin nabzını avucunun içinde tut!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#Cadde #ŞehirHayatı #TürkDiasporası #SosyalAğ #Gurbet #YurtDışı #YerelTopluluk #Akış #CorteQS #DiasporaHayatı`,
    redditPost: `Bulunduğunuz şehirdeki diaspora hayatının "nabzını" gerçekten tutabiliyor musunuz, yoksa hep bir adım geride mi kalıyorsunuz?

Şehrimde ne zaman bir etkinlik, bir buluşma, bir gündem olsa genelde ya çok geç öğreniyorum ya da hiç öğrenmiyorum. Global bir akış takip etmek kolay ama "benim şehrimde ne oluyor" sorusuna cevap veren bir yer yok gibi.

CorteQS'in "Cadde" diye bir bölümü tam olarak bunu hedefliyormuş — global değil, şehir bazlı bir sosyal akış.

Sizin şehrinizde böyle nişleşmiş, sadece o şehre özel bir akış olsa gerçekten kullanır mıydınız, yoksa küçük şehirlerde bu tür şeyler kritik kütleye ulaşamadan ölüyor mu?

corteqs.net/cadde`,
  },
  {
    id: "post-47",
    order: 47,
    theme: "kadin",
    title: "Gurbetin güçlü kadınları",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbetin güçlü kadınları”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A group of Turkish diaspora women from different professions gather in a bright coworking room for peer mentoring. One founder presents a real prototype while others take notes and ask direct questions; clothing and setting are contemporary, with no empowerment clichés. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbetin güçlü kadınları”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman unlocks her own small business in the morning as another experienced entrepreneur arrives to help with opening-day details. Their focused teamwork and confident body language show strength built through knowledge and solidarity. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `💪 Gurbette kadın olmak: hem yeni bir hayat kurmak hem kültürü taşımak hem de çoğu zaman ailenin direği olmak.

Yurt dışındaki Türk kadınları işte, akademide, girişimcilikte parlıyor. Ama güç, dayanışmayla katlanır.

👉 Ücretsiz kayıt olun!
CorteQS, gurbetteki kadınları birbirine bağlıyor; mentorluktan dostluğa, iş birliğinden desteğe. Güçlü kadınlar, güçlü bir ağla daha da yükselir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KadınGücü #TürkDiasporası #Dayanışma #Kadın #CorteQS`,
    instagramPost: `💪 Gurbette kadın olmak: hem yeni bir hayat kurmak hem kültürü taşımak hem de çoğu zaman ailenin direği olmak!

Yurt dışındaki Türk kadınları işte, akademide, girişimcilikte parlıyor ✨ Ama güç, dayanışmayla katlanır.

👉 Ücretsiz kayıt ol, gurbetin güçlü kadınlarına katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KadınGücü #TürkDiasporası #Dayanışma #Kadın #Gurbet #YurtDışı #GüçlüKadınlar #KadınTopluluğu #Mentorluk #CorteQS`,
    redditPost: `Gurbette kadın olarak hem kariyer hem aile hem kültür taşıyıcılığı yükünü aynı anda taşımak sizde de yorucu mu?

Kendi hayatımda fark ettim ki hem işimde ilerlemeye çalışıyorum hem çocuklarıma Türkçeyi/kültürü aktarmaya uğraşıyorum hem de ailenin "her şeyi hatırlayan" kişisi ben oluyorum. Yerel arkadaşlarımın bu üçlü yükü tam anlamadığını hissediyorum, ama başka gurbetçi kadınlar hemen anlıyor.

CorteQS'in gurbetteki kadınları mentorluk ve dayanışma etrafında bir araya getirme fikri bu yükü hafifletebilir mi merak ediyorum.

Siz de bu "hem şunu hem bunu" yükünü hissediyor musunuz, ve bunu paylaşabildiğiniz bir kadın çevreniz var mı?

corteqs.net`,
  },
  {
    id: "post-48",
    order: 48,
    theme: "kusaklar",
    title: "İlk kuşağın hatırı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İlk kuşağın hatırı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: An elderly first-generation Turkish migrant sits in the workshop where he spent decades, telling his adult grandchildren about the early years. Worn tools, a thermos and old photographs with no readable text make the history concrete and dignified. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İlk kuşağın hatırı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A multigenerational family prepares tea around the first migrant's kitchen table while listening to her memories. Younger relatives record audio on a phone with the screen turned away; attention and respect, not nostalgia effects, carry the portrait. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `👴 Bu diasporanın temelini atan ilk kuşak, bugün gurbette yaşlanıyor. Onların hikâyeleri, hepimizin kökü.

Dil sorunu, yalnızlık, sağlık... İlk kuşağın yükü ağır. Onlara sahip çıkmak, kim olduğumuzu unutmamaktır.

👉 Ücretsiz kayıt olun!
CorteQS, kuşakları birbirine bağlıyor; gençlerin enerjisini büyüklerin tecrübesiyle buluşturuyor. Köklerimize saygı, ağımızın temeli.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İlkKuşak #TürkDiasporası #Kuşaklar #Saygı #CorteQS`,
    instagramPost: `👴 Bu diasporanın temelini atan ilk kuşak, bugün gurbette yaşlanıyor.

Onların hikâyeleri hepimizin kökü. Dil sorunu, yalnızlık, sağlık... Onlara sahip çıkmak kim olduğumuzu unutmamaktır 🙏

👉 Ücretsiz kayıt ol, kuşaklar arası köprü kur!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İlkKuşak #TürkDiasporası #Kuşaklar #Saygı #Gurbet #YurtDışı #Büyüklerimiz #Kökler #AileBağı #CorteQS`,
    redditPost: `Diasporamızın temelini atan ilk kuşağın gurbette yaşlanmasını yeterince konuşuyor muyuz sizce?

Geçen ay dedemi ziyarete gittim, 60 yıla yakındır yaşadığı bir ülkede hâlâ dili tam öğrenememiş, doktora giderken tercümana ihtiyacı var, yaşıtlarının çoğu ya vefat etmiş ya da Türkiye'ye dönmüş. Onun kuşağının yükünü, yalnızlığını düşününce içim burkuluyor, çünkü bizim bugün sahip olduğumuz her şeyin temelini onlar attı.

CorteQS'in kuşaklar arası köprü kurma, gençlerin enerjisini büyüklerin tecrübesiyle buluşturma gibi bir hedefi olduğunu okudum.

Sizin ailenizde ilk kuşak nasıl yaşlanıyor, onlara sahip çıkmak için neler yapıyorsunuz?

corteqs.net`,
  },
  {
    id: "post-49",
    order: 49,
    theme: "manifesto",
    title: "Bir dizin değil, yaşayan bir ağ",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir dizin değil, yaşayan bir ağ”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Inside a real CorteQS community meetup, a directory search leads immediately to several live interactions: a newcomer meets an advisor, a founder finds a collaborator and parents exchange school information. The scene shows a living network through simultaneous practical conversations. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir dizin değil, yaşayan bir ağ”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish user closes a laptop after finding a local contact and walks into a cafe where that person is waiting. The profile image remains visible but unreadable on screen, while the genuine face-to-face introduction proves the platform is more than a static directory. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: magnifying glass, location pin, profile badge, category tiles, camera, open book, and activity symbol. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌍 Berlin'den Sidney'e, Toronto'dan Dubai'ye — dünyanın dört bir yanına dağılmış bir halkız. Ama dağınık olmak zorunda değiliz.

T.C. Dışişleri Bakanlığı'na göre 7,5 milyon yurt dışı vatandaş, köken dahil 14 milyonu aşan bir potansiyel. Bu, sıradan bir kalabalık değil; uyuyan bir dev.

👉 Ücretsiz kayıt olun!
CorteQS bir dizin değil, yaşayan bir ağ. İnsanları, toplulukları ve işletmeleri tek bir güven zemininde buluşturuyor. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkDiasporası #Diaspora #Manifesto #Topluluk #CorteQS`,
    instagramPost: `🌍 Berlin'den Sidney'e, Toronto'dan Dubai'ye — dünyanın dört bir yanına dağılmış bir halkız. Ama dağınık olmak zorunda değiliz!

7,5 milyon yurt dışı vatandaş, köken dahil 14 milyonu aşan bir potansiyel. Bu uyuyan bir dev 💥

👉 Ücretsiz kayıt ol, yaşayan ağın parçası ol!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TürkDiasporası #Diaspora #Manifesto #Topluluk #Gurbet #YurtDışı #DünyadaTürkler #GüvenAğı #CorteQS #BirlikteGüçlüyüz`,
    redditPost: `7,5 milyon yurt dışı vatandaş + köken dahil 14 milyonu aşan bir potansiyel — bu rakamı ilk duyduğumda "uyuyan bir dev" tabiri aklıma geldi, siz ne düşünüyorsunuz?

T.C. Dışişleri Bakanlığı verilerine göre bu rakamlara bakınca fark ettim, biz aslında sıradan bir azınlık kalabalığı değiliz, koca bir potansiyel gücüz ama tamamen dağınığız — Berlin'de biri, Sidney'de biri, Toronto'da biri, birbirinden habersiz. "Bir dizin değil yaşayan bir ağ" olma iddiasıyla çıkan CorteQS gibi projeler bu potansiyeli bir araya getirmeyi hedefliyor.

Sizce bu kadar büyük ve dağınık bir kitleyi gerçekten "tek bir ağ" haline getirmek mümkün mü, yoksa bu hep bir hayal mi kalır?

corteqs.net`,
  },
  {
    id: "post-50",
    order: 50,
    theme: "manifesto",
    title: "Sen de bu ağın parçası ol",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Sen de bu ağın parçası ol”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A newcomer steps into a community circle at a neighborhood event and is physically welcomed into an open seat. The group includes students, parents, professionals and older residents; natural eye contact and movement communicate becoming part of the network. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Sen de bu ağın parçası ol”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish user finishes creating a profile on a phone, then looks up as friends wave from a nearby meetup table in the same coworking space. The digital entry and real community appear in one believable photographic moment. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `✨ Gurbet zor. Ama yalnız olmak zorunda değil.

Bugün dünyanın neresinde olursan ol, kökenini paylaşan milyonlarca insan bir tık uzağında. Eksik olan tek şey: ilk adım.

👉 Ücretsiz kayıt olun!
CorteQS, dünyadaki Türkleri tek çatı altında buluşturan, güvene dayalı diaspora ağı. Açık beta yayında — sen de bu büyümenin parçası ol. Berlin'den Sidney'e, hepimiz aynı ağdayız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#CorteQS #TürkDiasporası #Diaspora #Topluluk #Gurbet`,
    instagramPost: `✨ Gurbet zor. Ama yalnız olmak zorunda değil!

Dünyanın neresinde olursan ol, kökenini paylaşan milyonlarca insan bir tık uzağında. Eksik olan tek şey ilk adım 🚀

👉 Ücretsiz kayıt ol, sen de bu ağın parçası ol!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#CorteQS #TürkDiasporası #Diaspora #Topluluk #Gurbet #YurtDışı #AçıkBeta #İlkAdım #DiasporaAğı #BirlikteGüçlüyüz`,
    redditPost: `Gurbet zor ama "yalnız olmak zorunda değilim" fikrine gerçekten inanıyor musunuz, yoksa bu hep bir teselli cümlesi mi?

Bunca yıldır gurbetteyim ve hâlâ bazı günler "keşke daha kolay bağlanabilsem" diye düşünüyorum. Teorik olarak dünyanın neresinde olursam olayım kökenimi paylaşan milyonlarca insan var ama pratikte o bağlantıyı kurmak hep bir çaba istiyor, kendiliğinden olmuyor.

CorteQS gibi platformlar "eksik olan tek şey ilk adım" diyor, açık beta aşamasındaymış. İlk adımı atmanın gerçekten bu kadar basit olup olmadığını merak ediyorum.

Siz bu "yalnız değilsin" mesajına inanıyor musunuz, yoksa gurbette yalnızlık kaçınılmaz bir gerçek mi sizce?

corteqs.net`,
  },
  {
    id: "post-51",
    order: 51,
    theme: "cadde",
    title: "Cadde'de bugün ne konuşuluyor",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Cadde'de bugün ne konuşuluyor”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At breakfast, a Turkish woman scrolls through Cadde posts about a local event, a housing question and a job lead. The phone shows realistic photo cards without readable text while her partner points to one item and starts a conversation about it. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Cadde'de bugün ne konuşuluyor”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Several Turkish residents gather after work at a cafe and discuss the day's most active Cadde topic displayed on a tablet. The original post remains unreadable, but varied reactions and recognizable city context make the conversation itself the visual subject. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🛣️ Facebook grubu değil, gerçek bir cadde.

CorteQS'in Cadde'sinde diaspora gündemini konuşuyorsun, oda açıyorsun, katılıyorsun — hepsi tek bir sosyal akışta. Kaybolan yorumlar, dağınık gruplar yok; tek bir yer.

👉 Ücretsiz kayıt olun!
Cadde'de bugün ne konuşuluyor, gel bak.
🔗 https://corteqs.net/cadde
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Cadde #CorteQS`,
    instagramPost: `🛣️ Facebook grubu değil, gerçek bir cadde!

CorteQS'in Cadde'sinde diaspora gündemini konuş, oda aç, katıl — hepsi tek akışta 💬

👉 Ücretsiz kayıt ol, Cadde'ye çık!
🔗 corteqs.net/cadde
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Cadde #Gurbet #YurtDışı #Sosyal #Topluluk #CorteQS #Konuşalım #DünyadaTürkler`,
    redditPost: `Diaspora gündemini takip etmek için Facebook grubu yerine kullandığınız bir yer var mı?

Yıllardır aynı sorun: gündem hep dağınık gruplarda kayboluyor, önemli bir tartışma 3 gün sonra timeline'da bulunmuyor. CorteQS'te "Cadde" diye bir sosyal akış var, tek yerde konuşma + oda açma imkânı sunuyor.

Denedim ama alışkanlık değiştirmek zor oluyor tabii. Sizde diaspora gündemini takip etmenin daha iyi bir yolu var mı?

corteqs.net/cadde`,
  },
  {
    id: "post-52",
    order: 52,
    theme: "carsi",
    title: "Çarşı: birbirimizden alışveriş",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Çarşı: birbirimizden alışveriş”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish ceramic maker sells a handmade cup to another diaspora member at a weekend neighborhood market. The buyer checks the original Çarşı listing on a phone with no readable copy, and the maker wraps the item carefully in recycled paper. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Çarşı: birbirimizden alışveriş”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A family collects a second-hand child's bicycle from another Turkish family found through Çarşı. The children test it in a public courtyard while the adults complete the friendly handoff, making community commerce practical and trustworthy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🛍️ Bir ürün ya da hizmete ihtiyacın olduğunda önce kime bakarsın?

CorteQS'in Çarşı'sında dünyanın dört bir yanındaki Türk esnaf ve girişimcilerden alışveriş yapabilirsin. Güven, tanıdıktan tanıdığa değil, doğrulanmış bir ağdan gelir.

👉 Ücretsiz kayıt olun!
Çarşı'ya göz at, belki aradığın şey zaten orada.
🔗 https://corteqs.net/cadde/carsi
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Çarşı #Girişimcilik #CorteQS`,
    instagramPost: `🛍️ İhtiyacın olan şeyi önce kimden alırsın?

CorteQS'in Çarşı'sında dünyanın dört bir yanındaki Türk esnaf ve girişimcilerden alışveriş yap. Güven tanıdıktan değil, doğrulanmış ağdan gelir 🤝

👉 Ücretsiz kayıt ol, Çarşı'ya göz at!
🔗 corteqs.net/cadde/carsi
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Çarşı #Esnaf #Girişimcilik #Gurbet #YurtDışı #DestekOl #CorteQS #YerelDestek`,
    redditPost: `Yurt dışında bir hizmete ihtiyacınız olduğunda "Türk esnaf var mı" diye aramayı hâlâ yapıyor musunuz?

Ben hâlâ yapıyorum, özellikle güven gerektiren işlerde (muhasebe, tadilat, hukuki danışmanlık gibi). CorteQS'te "Çarşı" diye bir bölüm var, diasporadaki esnaf/girişimcileri bir araya getiriyor.

Fikir güzel ama arz tarafı (yeterli esnaf/girişimci) olmadan işe yaramaz gibi geliyor bana. Sizin bulunduğunuz yerde böyle bir ihtiyaç var mı, nasıl çözüyorsunuz şu an?

corteqs.net/cadde/carsi`,
  },
  {
    id: "post-53",
    order: 53,
    theme: "radar",
    title: "Diaspora haberlerini tek yerde takip et",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Diaspora haberlerini tek yerde takip et”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish professional reads a consolidated diaspora news feed on a tablet during breakfast. The screen shows a balanced mix of community, policy, culture and opportunity images with all headlines blurred; a notebook and coffee keep the scene editorial and real. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Diaspora haberlerini tek yerde takip et”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A small diaspora newsroom team reviews several verified updates before publishing them to one feed. Laptops display unreadable article layouts and source thumbnails, while the team's careful discussion conveys curation rather than information overload. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shield, checkmark, and balanced scales. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📡 Diasporayla ilgili haberleri onlarca kaynaktan tek tek takip etmek yorucu.

CorteQS Radar, dünya çapındaki diaspora haberlerini tarayıp tek bir akışta topluyor. Kaçırdığın bir gelişme kalmasın.

👉 Ücretsiz kayıt olun!
Radar'a göz at, gündemi kaçırma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Haber #CorteQS`,
    instagramPost: `📡 Diaspora haberlerini onlarca kaynaktan tek tek takip etmek mi yoruyor?

CorteQS Radar dünya çapındaki gelişmeleri tarayıp tek akışta topluyor. Kaçırdığın kalmasın 🌍

👉 Ücretsiz kayıt ol, Radar'a göz at!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Radar #Haber #Gurbet #YurtDışı #Gündem #DünyadaTürkler #CorteQS #Bilgilen`,
    redditPost: `Diasporayla ilgili haberleri tek bir yerden takip etmenin bir yolu var mı, yoksa herkes gibi 10 farklı kaynağı mı geziyorsunuz?

Ben genelde birkaç Facebook grubu + birkaç haber sitesi arasında geziniyorum, çoğu zaman da geç kalıyorum. CorteQS'te "Radar" diye otomatik toplayan bir bölüm görmüştüm, dünya çapındaki diaspora haberlerini tarıyormuş.

Böyle otomatik toplama araçlarına güveniyor musunuz, yoksa hep gecikmeli/eksik mi kalıyor sizce?

corteqs.net`,
  },
  {
    id: "post-54",
    order: 54,
    theme: "blog",
    title: "Ülke rehberleri: ilk elden bilgi",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Ülke rehberleri: ilk elden bilgi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A recent Turkish arrival meets a long-term resident at a library table to learn how local registration, transport and healthcare actually work. They compare a country guide on a laptop with real blank-looking forms; first-hand explanation is visible in the interaction. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Ülke rehberleri: ilk elden bilgi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish family plans its first month abroad at home using a CorteQS country guide on a tablet, a transit card and appointment folder. All written details are unreadable, but their organized discussion shows how practical information from residents reduces uncertainty. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📖 Yeni bir ülkeye taşınırken en çok neye ihtiyaç duyarsın? Doğru, ilk elden bilgi.

CorteQS Blog'da ülke rehberleri var — konut, sağlık sigortası, bankacılık gibi konularda pratik, güncel bilgiler. Deneme yanılma yerine hazır bir yol haritası.

👉 Ücretsiz kayıt olun!
Blog'a göz at, bir sonraki adımını kolaylaştır.
🔗 https://corteqs.net/blog
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Rehber #CorteQS`,
    instagramPost: `📖 Yeni bir ülkeye taşınırken en çok neye ihtiyacın var? İlk elden bilgi!

CorteQS Blog'da ülke rehberleri: konut, sağlık sigortası, bankacılık... Deneme yanılma yerine hazır yol haritası 🗺️

👉 Ücretsiz kayıt ol, Blog'a göz at!
🔗 corteqs.net/blog
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Rehber #YeniGelenler #YurtDışı #Gurbet #TaşınmaRehberi #CorteQS #Bilgilen #Kolaylaştır`,
    redditPost: `Yeni taşındığınız ülkede en çok hangi konuda "keşke önceden bilseydim" dediniz?

Bende sağlık sigortası ve kira sözleşmesi konusunda resmen deneme yanılmayla öğrendim, epey pahalıya da mal oldu. CorteQS'in blog kısmında ülke bazlı pratik rehberler var, keşke ben taşınmadan önce böyle bir kaynak olsaydı diye düşünmeden edemedim.

Sizin taşınma sürecinizde en çok zorlandığınız, bilgi eksikliğinden kaynaklanan konu neydi?

corteqs.net/blog`,
  },
  {
    id: "post-55",
    order: 55,
    theme: "referans",
    title: "Tanıdığını davet et, birlikte büyüyün",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Tanıdığını davet et, birlikte büyüyün”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Three Turkish friends sit together at a cafe as two of them invite a third person into CorteQS from a phone. The invitation screen contains only unreadable interface shapes; their natural explanation and the third friend's curiosity make network growth feel personal. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Tanıdığını davet et, birlikte büyüyün”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At a community dinner, an existing member introduces two newly invited friends to the group. Extra chairs are pulled in and plates are shared, showing the network expanding through real trust rather than referral graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shield, checkmark, and balanced scales. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🤝 Ağ, tek başına büyümez — birlikte büyür.

CorteQS'te tanıdığını davet ettiğinde ağ güçleniyor, sen de referans avantajlarından yararlanıyorsun. Kazan-kazan basit bir fikir ama işe yarıyor.

👉 Ücretsiz kayıt olun!
Referans linkini paylaş, tanıdığını davet et.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Referans #CorteQS`,
    instagramPost: `🤝 Ağ tek başına büyümez, birlikte büyür!

CorteQS'te tanıdığını davet ettiğinde ağ güçleniyor, sen de avantajlardan yararlanıyorsun. Kazan-kazan basit ama işe yarıyor 🎁

👉 Ücretsiz kayıt ol, referans linkini paylaş!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Referans #DavetEt #Gurbet #YurtDışı #BirlikteBüyü #CorteQS #KazanKazan #Topluluk`,
    redditPost: `Diaspora platformlarında "arkadaşını davet et" mekaniğine güveniyor musunuz, yoksa spam gibi mi geliyor?

CorteQS'te böyle bir referans sistemi var, davet ettiğin kişi katılınca ikinizin de avantajı oluyor diye okudum. Prensip olarak mantıklı buluyorum çünkü bu tür ağlar gerçekten "içeriden" büyüdükçe daha güvenilir oluyor.

Siz böyle davet/referans sistemlerini kullanıyor musunuz, işe yarıyor mu gerçekten?

corteqs.net`,
  },
  {
    id: "post-56",
    order: 56,
    theme: "kariyer",
    title: "Bulunduğun şehirde kariyer fırsatı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bulunduğun şehirde kariyer fırsatı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish candidate speaks with a recruiter at a local career evening in her own city. A phone beside them shows the opportunity card that brought her there with no readable text; the surrounding event is active but the focused conversation remains central. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bulunduğun şehirde kariyer fırsatı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish professional discovers a nearby job lead on a laptop in the morning and attends an informal interview in a neighborhood coworking room later that day, represented in one continuous real setting with the screen and interviewer both visible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `💼 Bulunduğun şehirdeki fırsatları kim biliyor? Genelde oradaki insanlar.

CorteQS ağında meslektaşlarını, işverenleri ve mentorları bulunduğun şehre göre keşfedebilirsin. Kariyer fırsatları çoğu zaman doğru bağlantıdan başlar.

👉 Ücretsiz kayıt olun!
Şehrindeki profesyonelleri keşfet.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Kariyer #CorteQS`,
    instagramPost: `💼 Bulunduğun şehirdeki fırsatları kim biliyor? Genelde oradaki insanlar!

CorteQS'te meslektaşlarını, işverenleri ve mentorları şehrine göre keşfet. Kariyer fırsatları doğru bağlantıdan başlar 🚀

👉 Ücretsiz kayıt ol, profesyonelleri keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Kariyer #Networking #YurtDışı #Gurbet #İşFırsatı #Mentorluk #CorteQS #Bağlan`,
    redditPost: `Yurt dışında kariyer fırsatlarını nasıl buluyorsunuz, LinkedIn dışında bir yol var mı?

Ben genelde LinkedIn'de arıyorum ama bazen bulunduğum şehirdeki Türk profesyonel ağı çok daha hızlı sonuç veriyor — özellikle referans/tavsiye gerektiren pozisyonlarda. CorteQS'te şehre göre profesyonel arama var, bunu deneyen oldu mu?

Sizce diaspora ağları kariyer arayışında gerçekten fark yaratıyor mu, yoksa hep genel iş platformları mı daha etkili?

corteqs.net`,
  },
  {
    id: "post-57",
    order: 57,
    theme: "uzaktan-calisma",
    title: "Nerede olursan ol, kariyerin seninle",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Nerede olursan ol, kariyerin seninle”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish remote professional works from a quiet train table while traveling between European cities. Her laptop shows a video meeting with unreadable labels, and a portfolio notebook sits beside it, communicating a career that continues wherever she lives. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Nerede olursan ol, kariyerin seninle”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish engineer settles into a new international office while connecting with former colleagues and local diaspora mentors on a tablet. Moving boxes and a new access card make the transition real; skills and relationships travel with him. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `💻 Uzaktan çalışıyorsan, ofisin dünya. Peki ağın da öyle mi?

Uzaktan çalışan diaspora üyeleri için CorteQS, hem meslektaş bulmanın hem de bulunduğun şehirdeki topluluğa bağlanmanın bir yolu. Ekran başında yalnız kalmak zorunda değilsin.

👉 Ücretsiz kayıt olun!
Nerede olursan ol, ağın seninle.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #UzaktanÇalışma #CorteQS`,
    instagramPost: `💻 Uzaktan çalışıyorsan ofisin dünya. Peki ağın da öyle mi?

CorteQS uzaktan çalışan diaspora üyeleri için hem meslektaş bulmanın hem de şehrindeki topluluğa bağlanmanın yolu. Ekran başında yalnız kalma 🌍

👉 Ücretsiz kayıt ol, ağına katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #UzaktanÇalışma #RemoteWork #Gurbet #YurtDışı #DijitalGöçebe #Networking #CorteQS #Bağlan`,
    redditPost: `Uzaktan çalışanlar, bulunduğunuz şehirde sosyal/profesyonel ağ kurmak sizin için de zor mu?

Uzaktan çalışınca ofis arkadaşlığı gibi doğal bir sosyalleşme yok, bu da diasporada çift kat izolasyon hissi yaratıyor bende. CorteQS'te şehre göre insan bulma özelliği var, uzaktan çalışanlar için de işe yarayabilir gibi duruyor.

Siz uzaktan çalışırken bulunduğunuz şehirdeki topluluğa nasıl bağlanıyorsunuz, bir yöntem buldunuz mu?

corteqs.net`,
  },
  {
    id: "post-58",
    order: 58,
    theme: "yalnizlik",
    title: "Kalabalık bir şehirde yalnız olmak",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kalabalık bir şehirde yalnız olmak”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A young Turkish man crosses a crowded city square at blue hour while everyone around him appears occupied with friends or phones. He remains sharply isolated in the composition, conveying loneliness in a large city without theatrical sadness. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Kalabalık bir şehirde yalnız olmak”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: The same emotional situation resolves gently at a small first-time meetup where a newcomer listens more than he speaks but is included by the group. An empty chair has been pulled close, making belonging feel possible rather than instant. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🏙️ Milyonlarca insanın arasında olup yine de yalnız hissetmek — gurbetin en garip paradoksu.

Kalabalık bir şehir, tanıdıklık anlamına gelmiyor. CorteQS, bulunduğun şehirdeki kökenini paylaşan insanları görünür kılarak bu paradoksu kırmaya çalışıyor.

👉 Ücretsiz kayıt olun!
Belki de aradığın bağlantı, sandığından daha yakın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Yalnızlık #Gurbet #CorteQS`,
    instagramPost: `🏙️ Milyonlarca insanın arasında olup yine de yalnız hissetmek — gurbetin garip paradoksu.

Kalabalık şehir, tanıdıklık demek değil. CorteQS bulunduğun şehirdeki kökenini paylaşanları görünür kılıyor 🤍

👉 Ücretsiz kayıt ol, bağlantını bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Yalnızlık #Gurbet #YurtDışı #RuhSağlığı #Topluluk #Bağlantı #CorteQS #YalnızDeğilsin`,
    redditPost: `Kalabalık bir şehirde yaşayıp da hiç bu kadar yalnız hissetmediğiniz oldu mu?

Milyonlarca insanın arasındayım ama gerçekten "tanıdığım" kimse yok gibi hissettiğim günler oluyor. Garip bir paradoks — etraf kalabalık ama bağlantı yok. CorteQS gibi platformların iddiası tam da bu boşluğu, aynı şehirdeki kökeni paylaşan insanları görünür kılarak doldurmak.

Siz bu "kalabalıkta yalnızlık" hissini yaşadınız mı, nasıl aştınız (ya da aşamadınız)?

corteqs.net`,
  },
  {
    id: "post-59",
    order: 59,
    theme: "kusaklar",
    title: "İkinci kuşağın kimlik arayışı",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İkinci kuşağın kimlik arayışı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A second-generation Turkish woman records her grandmother's migration story at a kitchen table while asking thoughtful questions. Modern clothing, family food and old photographs coexist naturally, showing identity being actively explored rather than represented by symbols. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “İkinci kuşağın kimlik arayışı”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish-origin young man prepares a creative project combining family archive photographs and contemporary city portraits. He works in a studio with both generations present, using art and conversation to understand where he belongs. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌱 "Nerelisin?" sorusuna tek kelimeyle cevap veremeyenler var.

Yurt dışında doğup büyüyen ikinci kuşak için kimlik, çoğu zaman iki kültür arasında bir denge kurma meselesi. CorteQS, o dengeyi kuran diğer ailelerle bağlantı kurmanın bir yolu.

👉 Ücretsiz kayıt olun!
Kökenini kendi tarzında yaşayan bir toplulukla tanış.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #İkinciKuşak #Kimlik #CorteQS`,
    instagramPost: `🌱 "Nerelisin?" sorusuna tek kelimeyle cevap veremeyenler var.

Yurt dışında büyüyen ikinci kuşak için kimlik, iki kültür arasında bir denge. CorteQS o dengeyi kuran ailelerle bağlantı kurmanın yolu 🌍

👉 Ücretsiz kayıt ol, topluluğu keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #İkinciKuşak #Kimlik #YurtDışı #İkiKültür #Aidiyet #CorteQS #KökEnKimlik #Gurbet`,
    redditPost: `Yurt dışında doğup büyüyen ikinci kuşak arkadaşlar, "nerelisin" sorusuna nasıl cevap veriyorsunuz?

Ben burada doğdum ama evde tamamen farklı bir kültürle büyüdüm, iki tarafa da tam ait hissetmiyorum bazen. Bu ikili kimlik hissini paylaşan başka ailelerle tanışmak iyi geliyor. CorteQS'te bu tür bir toplulukla bağlantı kurmaya çalışan var mı?

Siz bu "arada kalmışlık" hissini nasıl yönetiyorsunuz, yoksa bir noktadan sonra sorun olmaktan mı çıkıyor?

corteqs.net`,
  },
  {
    id: "post-60",
    order: 60,
    theme: "dil",
    title: "Ana dilini kaybetme korkusu",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Ana dilini kaybetme korkusu”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish parent reads an illustrated Turkish children's book aloud at bedtime in a home abroad. The book's writing is out of focus, while the child repeats a phrase and points to a picture; the parent's attentive expression reveals both joy and fear of language loss. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Ana dilini kaybetme korkusu”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Children and parents attend a relaxed community language circle in a library room. They sing, play and tell simple stories in Turkish with real books and toys, no classroom branding or readable text, making language preservation social rather than anxious. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🗣️ Bazı kelimeleri artık Türkçe değil, İngilizce düşünüyorsun. Tanıdık geliyor mu?

Ana dilini kaybetme korkusu gurbette çok konuşulmayan ama çok yaygın bir his. CorteQS'te Türkçe konuşabileceğin, pratik yapabileceğin bir topluluk var.

👉 Ücretsiz kayıt olun!
Dilini yaşat, bağlantını koru.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #AnaDil #CorteQS`,
    instagramPost: `🗣️ Bazı kelimeleri artık Türkçe değil, İngilizce düşünüyorsun. Tanıdık mı geliyor?

Ana dilini kaybetme korkusu gurbette çok yaygın ama az konuşulan bir his. CorteQS'te Türkçe konuşabileceğin bir topluluk var 💬

👉 Ücretsiz kayıt ol, dilini yaşat!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #AnaDil #Türkçe #Gurbet #YurtDışı #DilKaybı #Kimlik #CorteQS #KonuşmayaDevam`,
    redditPost: `Ana dilinizi unutmaya başladığınızı hissettiğiniz oldu mu, nasıl bir his?

Bazen bir kelimeyi Türkçe hatırlayamıyorum, önce İngilizcesi geliyor aklıma. Bu beni gerçekten rahatsız ediyor çünkü dilimi kimliğimin bir parçası olarak görüyorum. Düzenli Türkçe konuşacak biri olmayınca daha da hızlanıyor bu süreç sanırım.

Siz bu durumu yaşadınız mı, ana dilinizi canlı tutmak için ne yapıyorsunuz?

corteqs.net`,
  },
  {
    id: "post-61",
    order: 61,
    theme: "tatil",
    title: "Memlekete dönüş sonrası boşluk",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Memlekete dönüş sonrası boşluk”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish returnee unpacks boxes in an Istanbul apartment after years abroad, placing foreign-city photographs beside familiar family objects. The room is home, yet his paused expression and phone call to friends overseas reveal the unexpected emptiness after return. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Memlekete dönüş sonrası boşluk”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A woman who has returned to Turkey sits in a cafe video-calling her former diaspora circle. The city outside is familiar, but the faces on the laptop and her mixed smile show that reverse migration can create another kind of distance. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `✈️ Memleketten dönünce ilk hafta neden bu kadar zor?

Tatil bitip valizler açılınca gelen o boşluk hissi, gurbetçilerin çoğunun bildiği bir şey. Bulunduğun şehirde o sıcaklığı hissettiren bir toplulukla bağlantı kurmak, geçişi biraz kolaylaştırabilir.

👉 Ücretsiz kayıt olun!
Dönüş sonrası yalnız kalma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #MemleketÖzlemi #CorteQS`,
    instagramPost: `✈️ Memleketten dönünce ilk hafta neden bu kadar zor?

Tatil bitip valizler açılınca gelen boşluk hissi çoğu gurbetçinin bildiği bir şey. Bulunduğun şehirde o sıcaklığı hissettiren bir toplulukla bağlan 🧳

👉 Ücretsiz kayıt ol, yalnız kalma!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #MemleketÖzlemi #Gurbet #TatilSonrası #YurtDışı #Özlem #CorteQS #Topluluk #DönüşZor`,
    redditPost: `Memleketten döndükten sonraki o "boşluk haftası" sizde de oluyor mu?

Her tatilden sonra aynı şey oluyor: ilk birkaç gün resmen depresif hissediyorum, valizler bile açılmıyor bazen. Ailemi, arkadaşlarımı, o sokak seslerini özlüyorum ve bulunduğum şehir birden çok "yabancı" geliyor.

Siz bu geçiş dönemini nasıl atlatıyorsunuz, işe yarayan bir yöntem buldunuz mu?

corteqs.net`,
  },
  {
    id: "post-62",
    order: 62,
    theme: "isletme",
    title: "Küçük işletmeni diasporaya duyur",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Küçük işletmeni diasporaya duyur”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish cafe owner photographs a signature dish and publishes a local promotion from a smartphone before opening. The screen shows a clean preview with unreadable text; real kitchen work, staff preparation and restrained teal-orange accents align the scene with CorteQS. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, coffee cup, and conversation bubbles. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Küçük işletmeni diasporaya duyur”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: New customers enter a small Turkish-owned shop after discovering it through the diaspora network. The owner recognizes the source from the phone listing one customer shows, and the exchange feels like genuine local discovery rather than an advertisement. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🏪 Küçük işletmeni büyütmenin en ucuz yolu: doğru topluluğa duyurmak.

CorteQS'in Çarşı'sında işletmeni dünyanın dört bir yanındaki diaspora üyelerine tanıtabilirsin. Reklam bütçesi yerine, güven ağı.

👉 Ücretsiz kayıt olun!
İşletmeni ekle, diaspora seni bulsun.
🔗 https://corteqs.net/cadde/carsi
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Girişimcilik #KüçükİşletmeCorteQS`,
    instagramPost: `🏪 Küçük işletmeni büyütmenin en ucuz yolu: doğru topluluğa duyurmak!

CorteQS'in Çarşı'sında işletmeni dünyadaki diaspora üyelerine tanıt. Reklam bütçesi yerine güven ağı 📣

👉 Ücretsiz kayıt ol, işletmeni ekle!
🔗 corteqs.net/cadde/carsi
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Girişimcilik #Küçükİşletme #Esnaf #YurtDışı #Gurbet #CorteQS #İşiniBüyüt #DestekOl`,
    redditPost: `Yurt dışında küçük bir işletmeniz var mı, müşteri bulmak için diaspora ağlarını kullanıyor musunuz?

Ben yeni bir hizmet işine başladım ve reklam bütçem çok kısıtlı. Facebook gruplarında paylaşım yapıyorum ama etkisi sınırlı kalıyor. CorteQS'te "Çarşı" diye bir bölüm var, esnaf/girişimcileri listeleyen.

Böyle niş diaspora platformlarının küçük işletmelere gerçekten müşteri getirdiğini düşünüyor musunuz, yoksa hep genel platformlar mı daha etkili?

corteqs.net/cadde/carsi`,
  },
  {
    id: "post-63",
    order: 63,
    theme: "ogrenci",
    title: "Yurt dışında öğrenci olmak",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Yurt dışında öğrenci olmak”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish international student studies late in a university library with a laptop, budget notebook and simple packed meal. The surroundings are real and slightly tired; a community message notification appears only as an unreadable card on the phone. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Yurt dışında öğrenci olmak”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: In a shared student apartment, a Turkish student cooks an inexpensive dinner with international housemates while discussing exams and part-time work. Everyday mess, mismatched furniture and easy friendship make life abroad believable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🎓 Yeni bir ülkede öğrenci olmak heyecanlı ama yalnız da olabilir.

CorteQS'te bulunduğun üniversite şehrindeki diğer Türk öğrencileri bulabilir, ders notlarından ev arkadaşı aramaya kadar birçok konuda destek alabilirsin.

👉 Ücretsiz kayıt olun!
Şehrindeki öğrenci topluluğuna katıl.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Öğrenci #CorteQS`,
    instagramPost: `🎓 Yeni bir ülkede öğrenci olmak heyecanlı ama yalnız da olabilir.

CorteQS'te üniversite şehrindeki diğer Türk öğrencileri bul, ev arkadaşından ders desteğine kadar bağlan 📚

👉 Ücretsiz kayıt ol, öğrenci topluluğuna katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Öğrenci #Üniversite #YurtDışıEğitim #Gurbet #TürkÖğrenciler #CorteQS #Katıl #Networking`,
    redditPost: `Yurt dışında okuyan öğrenciler, ilk döneminizde en çok neyle zorlandınız?

Bende en zoru barınma ve "kiminle takılacağım" belirsizliğiydi, üniversitenin resmi oryantasyonu yeterli gelmedi. Sonradan öğrendim ki şehirde epey Türk öğrenci varmış ama birbirimizi bulmamız zaman aldı. CorteQS gibi platformlar şehir bazlı arama sunuyor, keşke daha önce bilseydim.

Siz nasıl bir yol izlediniz, aynı şehirdeki Türk öğrencileri nasıl buldunuz?

corteqs.net`,
  },
  {
    id: "post-64",
    order: 64,
    theme: "mentorluk",
    title: "Bir adım önde olanın deneyimi",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir adım önde olanın deneyimi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: An experienced Turkish migrant sits beside a newcomer at a municipal waiting area, quietly explaining what to expect before their appointment. Forms and signs are unreadable, but calm gestures and practical preparation show the value of someone one step ahead. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Bir adım önde olanın deneyimi”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: At a small workshop, a senior diaspora professional demonstrates how she handled housing, paperwork and first-job searches to a group of newcomers. Real documents are blurred and personal details hidden; the transfer of experience is clear through attention and questions. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🕯️ Senin şu an takıldığın yerden, biri zaten geçti.

CorteQS'te bulunduğun alanda ya da hedeflediğin şehirde daha önce yol almış diaspora üyeleriyle bağlantı kurabilir, onların deneyiminden faydalanabilirsin.

👉 Ücretsiz kayıt olun!
Bir adım önde olanı bul, sor, öğren.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Mentorluk #CorteQS`,
    instagramPost: `🕯️ Senin şu an takıldığın yerden, biri zaten geçti.

CorteQS'te alanında ya da hedeflediğin şehirde yol almış diaspora üyeleriyle bağlan, deneyimlerinden faydalan 💡

👉 Ücretsiz kayıt ol, bir adım önde olanı bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Mentorluk #Deneyim #YurtDışı #Gurbet #YolGösterici #CorteQS #SorÖğren #Networking`,
    redditPost: `Yurt dışı sürecinizde bir mentor/deneyimli birinden gerçekten fayda gördünüz mü?

Ben ilk yıllarımda çoğu şeyi tek başıma çözmeye çalıştım, sonradan fark ettim ki 5 dakikalık bir tavsiye haftalar süren bir arayışı kısaltabilirmiş. CorteQS'te alan/şehir bazlı insan bulma özelliği bu tür bağlantıları kolaylaştırabilir gibi duruyor.

Siz mentorluk/deneyim paylaşımını nasıl buluyorsunuz — resmi programlar mı, yoksa organik tanışıklıklar mı daha çok işe yarıyor?

corteqs.net`,
  },
  {
    id: "post-65",
    order: 65,
    theme: "etkinlik",
    title: "Şehrindeki bir sonraki buluşma",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehrindeki bir sonraki buluşma”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish community organizer sets up a relaxed city meetup in a park, arranging picnic blankets, tea and a small portable speaker before attendees arrive. A phone displays the event card with no readable text, linking the digital invitation to the real gathering. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehrindeki bir sonraki buluşma”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: People arrive at a neighborhood cafe for the next CorteQS meetup, recognizing one another from profile photos and greeting warmly. Coats, name cards without text and first-conversation nerves make the event feel immediate and authentic. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `📍 Ekrandaki bağlantı güzel ama gerçek buluşma başka.

CorteQS ağı, bulunduğun şehirdeki diaspora etkinliklerini ve buluşmaları keşfetmenin bir yolu. Bazen bir kahve buluşması, aylarca süren yazışmalardan daha değerli.

👉 Ücretsiz kayıt olun!
Şehrindeki bir sonraki buluşmayı kaçırma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Etkinlik #CorteQS`,
    instagramPost: `📍 Ekrandaki bağlantı güzel ama gerçek buluşma başka!

CorteQS bulunduğun şehirdeki diaspora etkinliklerini keşfetmenin yolu. Bir kahve buluşması aylarca süren yazışmadan daha değerli olabilir ☕

👉 Ücretsiz kayıt ol, buluşmaları kaçırma!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Etkinlik #Buluşma #YurtDışı #Gurbet #Topluluk #CorteQS #GerçekBağlantı #KahveBuluşması`,
    redditPost: `Bulunduğunuz şehirdeki Türk topluluğu etkinliklerini nasıl takip ediyorsunuz?

Ben genelde son anda, tesadüfen bir Facebook grubunda görüyorum ve çoğu zaman kaçırmış oluyorum. Online bağlantı güzel ama gerçek bir kahve buluşması bambaşka bir şey. CorteQS'te şehir bazlı etkinlik/buluşma keşfi varmış, deneyen oldu mu?

Siz şehrinizdeki topluluk etkinliklerini kaçırmamak için nasıl bir sistem kurdunuz?

corteqs.net`,
  },
  {
    id: "post-66",
    order: 66,
    theme: "kadin",
    title: "Gurbette kadın olmak, gurbette güçlenmek",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette kadın olmak, gurbette güçlenmek”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: Turkish diaspora women sit in a confidential support circle discussing work, family and safety abroad. The room is bright and contemporary, expressions serious but resilient; the image communicates strength through mutual listening rather than heroic posing. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Gurbette kadın olmak, gurbette güçlenmek”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish woman receives practical mentoring from two other diaspora women in a coworking studio, reviewing a business plan and childcare schedule together. Real constraints and collaborative problem-solving define empowerment in the scene. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, storefront, and shopping bag. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `💪 Gurbette kadın olmanın kendine has zorlukları var — ve kendine has gücü.

CorteQS'te bulunduğun şehirdeki kadın girişimcilerle, profesyonellerle ve annelerle bağlantı kurabilir, birbirinizden güç alabilirsiniz.

👉 Ücretsiz kayıt olun!
Sen de bu güçlü ağın parçası ol.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Kadın #CorteQS`,
    instagramPost: `💪 Gurbette kadın olmanın kendine has zorlukları var, kendine has gücü de!

CorteQS'te şehrindeki kadın girişimcilerle, profesyonellerle, annelerle bağlan. Birbirinizden güç alın 🌸

👉 Ücretsiz kayıt ol, güçlü ağa katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Kadın #GüçlüKadınlar #YurtDışı #Gurbet #KadınDayanışması #CorteQS #Networking #BirlikteGüçlüyüz`,
    redditPost: `Gurbette yaşayan kadınlar, sizin için en zor kısım ne oldu — profesyonel mi, sosyal mi?

Bende ikisi de oldu açıkçası: hem iş hayatında farklı bir kültürde kendimi kanıtlamak hem de yeni bir "kız arkadaş çevresi" kurmak zor geldi. Kadın-kadına dayanışma ağlarının diasporada özellikle değerli olduğunu düşünüyorum.

Siz bulunduğunuz yerde böyle bir kadın topluluğu buldunuz mu, nasıl?

corteqs.net`,
  },
  {
    id: "post-67",
    order: 67,
    theme: "ambasador",
    title: "Şehrinin gönüllü temsilcisi ol",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehrinin gönüllü temsilcisi ol”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A volunteer Turkish city representative waits at a station to welcome a newly arrived family, holding no sign or branded placard. She recognizes them from a profile photo, helps with luggage and begins explaining the route into the city. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “Şehrinin gönüllü temsilcisi ol”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish volunteer leads a small orientation walk through her neighborhood, introducing newcomers to local services and other residents. Her confidence comes from lived knowledge and patient conversation, not an official uniform. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🚩 Şehrini iyi tanıyorsun. Peki yeni gelenlere rehberlik etmeye ne dersin?

CorteQS'te bulunduğun şehrin gönüllü temsilcisi (ambasadörü) olabilir, yeni gelen diaspora üyelerine ilk adımlarında yardımcı olabilirsin. Küçük bir jest, büyük bir fark yaratır.

👉 Ücretsiz kayıt olun!
Şehrinin temsilcisi olmaya aday ol.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Ambasador #CorteQS`,
    instagramPost: `🚩 Şehrini iyi tanıyorsun. Yeni gelenlere rehberlik etmeye ne dersin?

CorteQS'te şehrinin gönüllü temsilcisi ol, yeni gelenlerin ilk adımlarına yardım et. Küçük jest, büyük fark 🤍

👉 Ücretsiz kayıt ol, temsilci olmaya aday ol!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Ambasador #YeniGelenler #YurtDışı #Gurbet #GönüllülükEt #CorteQS #Rehberlik #Topluluk`,
    redditPost: `Bulunduğunuz şehre yeni gelen birine gönüllü rehberlik ettiniz mi, deneyiminiz nasıldı?

Ben ilk geldiğimde bana yardımcı olan birkaç kişi sayesinde çok şey öğrendim, şimdi ben de aynısını yapmak istiyorum. CorteQS'te "ambasadör" gibi bir gönüllü temsilcilik konsepti var, şehir bazlı rehberlik için.

Siz böyle gönüllü rehberlik sistemlerinin gerçekten işe yaradığını düşünüyor musunuz, yoksa organik olarak mı gelişmeli bu tür yardımlaşma?

corteqs.net`,
  },
  {
    id: "post-68",
    order: 68,
    theme: "manifesto",
    title: "251 ülke, tek bir ağ",
    imagePrompts: [
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “251 ülke, tek bir ağ”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A large international CorteQS gathering brings Turkish diaspora members from many regions into one contemporary conference hall. Students, families, founders, artists and professionals form real conversation clusters; varied clothing and accents suggest global reach without using a map or flag wall. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
      "Create a premium square 1:1 human-centered editorial illustration for the CorteQS diaspora story “251 ülke, tek bir ağ”. The image should portray contemporary Turkish diaspora life with emotional truth: belonging, memory, identity, career, family, mutual support or finding the right people. Keep cultural references subtle, current and respectful; never reduce the subject to folklore or stereotypes. Scene: A Turkish family at home joins a global community call on a large laptop screen filled with real participant faces from many time zones. No names or locations are readable; the family recognizes someone and waves, turning worldwide scale into a human connection. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
    ],
    linkedinPost: `🌍 251 ülke. Tek bir ağ. Ortak bir köken.

CorteQS'in vizyonu büyük ama basit: dünyanın neresinde olursan ol, kökenini paylaşan biriyle bir tık uzakta olmak. Bu ağ büyüdükçe herkes için daha değerli hale geliyor.

👉 Ücretsiz kayıt olun!
Bu büyük ağın bir parçası ol.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Manifesto #CorteQS`,
    instagramPost: `🌍 251 ülke. Tek bir ağ. Ortak bir köken.

CorteQS'in vizyonu büyük ama basit: dünyanın neresinde olursan ol, kökenini paylaşan biri bir tık uzakta ✨

👉 Ücretsiz kayıt ol, bu ağın parçası ol!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Diaspora #TürkDiasporası #Manifesto #DünyadaTürkler #Gurbet #YurtDışı #GüvenAğı #CorteQS #BirlikteGüçlüyüz #251Ülke`,
    redditPost: `251 ülkeye yayılmış bir diasporayı tek bir ağda birleştirmek gerçekten mümkün mü, yoksa fazla iddialı bir hedef mi?

CorteQS'in vizyonu bu yönde, dünyanın her yerindeki Türkleri tek platformda buluşturmak. Rakam etkileyici ama bu kadar dağınık bir kitleyi bir araya getirmenin pratikte çok zor olduğunu düşünüyorum.

Siz böyle "her yeri kapsayan" ağ iddialarına ne kadar inanıyorsunuz, yoksa hep bölgesel/yerel ağlar mı daha gerçekçi kalır sizce?

corteqs.net`,
  },
];
