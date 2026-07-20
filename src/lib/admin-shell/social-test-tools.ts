// Admin Panel V2 — Test Araçları İçerik Paketi (statik tek kaynak).
// /admin/social-share-vault sayfasının "Test Araçları" sekmesi bu listeden
// beslenir. 10 click-through test aracı; her araç için 3 varyant, her varyant
// 2 metinsiz ChatGPT görsel promptu (İngilizce, square 1:1 / no-text kuralları
// promptun içine gömülü) + 1 hazır Türkçe LinkedIn postu + 1 hazır Türkçe
// Instagram postu + 1 hazır Türkçe Reddit postu (daha az satış dili, soru/
// tartışma tonu — subreddit kurallarına göre editlenmesi gerekebilir).
//
// İçerik düzenlemesi BU dosyadan yapılır. Metinler temiz UTF-8 Türkçe + gerçek
// tırnak + emoji olarak tutulur; HTML-entity / mojibake KULLANILMAZ.

export type SocialTestVariant = {
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
};

export type SocialTestTool = {
  /** Benzersiz kimlik ("test-tool-1" ... "test-tool-10"). */
  id: string;
  /** Görünüm sırası (1..10). */
  order: number;
  /** Test aracı adı, ör. "Hangi Ülke Sana Uygun?". */
  name: string;
  /** Aracın kısa açıklaması (HTML .desc metni). */
  description: string;
  /** 3 metin varyantı (A/B/C kopya alternatifleri). */
  variants: SocialTestVariant[];
};

export const SOCIAL_TEST_TOOLS: SocialTestTool[] = [
  {
    id: "test-tool-1",
    order: 1,
    name: "Hangi Ülke Sana Uygun?",
    description:
      "Kariyer, yaşam tarzı ve değerlerine göre taşınmak için sana en uygun ülkeyi bulan tıkla-geç test. Kararsız genç profesyoneller ve göçü düşünen aileler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish parent balancing family and career abroad sits at a sunlit dining table comparing three clearly differentiated destination folders, a passport wallet and a laptop displaying side-by-side country result cards with all copy unreadable. The subject studies the options rather than posing, showing a real decision shaped by career, budget and lifestyle. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a young Turkish graduate beginning an international career completing a country-fit questionnaire on a tablet while a partner discusses priorities nearby. The screen uses image-based destination cards, sliders and checkmarks without readable labels; a calendar and savings notebook ground the choice in practical planning. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🌍 "Nereye taşınsam?" sorusu geceleri uykunu mu kaçırıyor?

5 dakikalık testimizi çöz; kariyerine, bütçene ve yaşam tarzına göre sana en uygun ülkeleri puanlayarak listeleyelim. Tahminle değil, verilerle karar ver.

👉 Ücretsiz kayıt olun!
CorteQS, göç yolculuğunu şansa bırakmıyor; seni doğru ülkeyle ve oradaki Türk topluluğuyla buluşturuyor. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Göç #TürkDiasporası #ÜlkeSeçimi #YurtDışı #CorteQS`,
        instagramPost: `🌍 "Acaba nereye taşınsam?" diye gece gece düşünmeyi bırak!

5 dakikalık testimiz kariyerine, bütçene ve yaşam tarzına göre sana en uygun ülkeleri sıralıyor. Tahmin değil, veri konuşuyor 📊✨

👉 Ücretsiz kayıt ol, bio'daki linkten hemen başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Göç #TürkDiasporası #ÜlkeSeçimi #YurtDışı #Gurbet #GöçPlanı #Diaspora #DünyadaTürkler #KariyerYolculuğu #Yurtdışıİş #CorteQS #TaşınmaTesti`,
        redditPost: `"Hangi ülkeye taşınmalıyım" sorusuna karar veren bir test denedim, ilginç mi işe yaramaz mı emin değilim

CorteQS diye bir platformda kariyer, bütçe ve yaşam tarzı tercihlerine göre "sana en uygun ülkeler" listesi çıkaran 5 dakikalık bir test var. Fikir olarak hoşuma gitti çünkü çoğu insan bu kararı "duyduğum kadarıyla iyiymiş" seviyesinde veriyor.

Böyle bir testin gerçekten anlamlı bir sıralama üretebileceğini düşünüyor musunuz, yoksa sonuçta ülke seçimi o kadar çok kişisel/durumsal faktöre bağlı ki hiçbir test bunu gerçekten yakalayamaz mı?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a young Turkish graduate beginning an international career meets a migration mentor in a quiet cafe and compares living-cost receipts, climate photographs and work-market notes for several countries. All written information is blurred, while pointing hands and engaged expressions communicate a data-informed narrowing of options. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish woman in her late twenties living abroad walks through an international neighborhood after viewing a recommended destination on a phone. Local transit, housing and everyday street life appear naturally around them, making the test result feel connected to a believable future rather than tourism. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `✈️ Aynı maaş, üç farklı ülkede üç farklı hayat demek.

Hangi ülke senin için "mükemmel uyum"? CorteQS Ülke Seçimi Aracı; sağlık, güvenlik, dil ve iş piyasası gibi onlarca faktörü senin önceliklerinle eşleştiriyor.

👉 Ücretsiz kayıt olun!
CorteQS, dünyaya açılırken yalnız bırakmaz; testten çıkan her ülkede seni bekleyen bir diaspora ağı var. Güvenle keşfet, güvenle taşın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ÜlkeSeçimi #Diaspora #GöçPlanı #TürkDiasporası #CorteQS`,
        instagramPost: `✈️ Aynı maaş, 3 ayrı ülkede 3 bambaşka hayat demek olabilir!

Sağlık, güvenlik, dil, iş piyasası... Hepsini senin önceliklerinle eşleştirip "mükemmel uyum" ülkeni buluyoruz 🌎

👉 Ücretsiz kayıt ol, testi hemen çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ÜlkeSeçimi #Diaspora #GöçPlanı #TürkDiasporası #YurtDışı #Gurbet #YeniHayat #TaşınmaKararı #DünyaVatandaşı #CorteQS #KariyerPlanı`,
        redditPost: `Aynı maaşın farklı ülkelerde alım gücü çok değişiyor, bunu ölçen bir araç gördüm

Sağlık, güvenlik, dil, iş piyasası gibi faktörleri girip "senin için en uygun ülke" çıkaran bir test var CorteQS'te. Mantık şu: aynı unvanla aynı maaşı alsan bile Almanya'da mı Kanada'da mı yaşadığın hayat kalitesini tamamen değiştirebiliyor.

Yurt dışına çıkmadan önce bu tür faktörleri sistematik karşılaştıran biri var mı, yoksa herkes gibi siz de tek tek forum/blog okuyarak mı karar verdiniz?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish woman in her late twenties living abroad closes a laptop after receiving a clear top-country recommendation and begins packing a small planning box with documents, language materials and a city guide. The mood is calm and decision-ready, with no triumphant travel clichés. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At an airport observation window, a Turkish man in his early thirties living abroad reviews the final recommended country on a phone while speaking with family. The interface remains unreadable; the subject's steady expression shows that multiple priorities have become one considered direction. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧭 Göç kararı duygusal değil, stratejik olmalı.

Bütçenden dil becerine, vize durumundan değerlerine kadar her şeyi hesaba katan testimizle sana en uygun 3 ülkeyi öğren. 5 soruda başla, detaylı modda derinleş.

👉 Ücretsiz kayıt olun!
CorteQS, en doğru kararı verebilmen için veriyi ve topluluğu bir araya getiriyor. Bir dizin değil, yaşayan bir rehber.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GöçKararı #ÜlkeTesti #TürkDiasporası #YurtDışıHayat #CorteQS`,
        instagramPost: `🧭 Göç kararı duygusal değil, stratejik olmalı!

Bütçe, dil, vize, değerler... Hepsini hesaba katan testimizle sana en uygun 3 ülkeyi öğren. 5 soruyla başla, istersen derinleş 🔍

👉 Ücretsiz kayıt ol, hemen dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#GöçKararı #ÜlkeTesti #TürkDiasporası #YurtDışıHayat #Diaspora #Gurbet #YeniBaşlangıç #GöçStratejisi #YurtDışıPlan #CorteQS`,
        redditPost: `Göç kararını "5 dakikalık test + detaylı mod" olarak yapılandıran bir araç var, veri temelli karar verme konusunda ne düşünürsünüz

Bütçe, dil, vize durumu ve kişisel öncelikleri girip en uygun 3 ülkeyi öneren bir test CorteQS'te. Kısa versiyon 5 soru, isteyen daha detaylı moda geçebiliyor. Amaç göçü "duygusal" değil "stratejik" bir karara çevirmek gibi duruyor.

Böyle bir çerçevede karar vermiş olan var mı? Sonuçta gerçek hayatta işe yaradı mı yoksa kağıt üstünde iyi görünüp pratikte fark yaratmadı mı?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-2",
    order: 2,
    name: "Mesleğin Dünyada Ne Kazandırıyor?",
    description:
      "Mesleğin ve deneyiminin farklı ülkelerde ne kadar kazandıracağını gösteren maaş karşılaştırma aracı. Alanının nerede daha çok değer gördüğünü merak eden Türk profesyoneller için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This is a visual for a CorteQS click-through decision tool. The tool compares compensation and purchasing power for the same profession across international markets. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a young Turkish graduate beginning an international career, a skilled professional, compares realistic salary and living-cost results on a laptop beside a calculator, rent statement and grocery receipts whose numbers are hidden. The image focuses on understanding purchasing power rather than piles of money. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This is a visual for a CorteQS click-through decision tool. The tool compares compensation and purchasing power for the same profession across international markets. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over the shoulder of a Turkish woman in her late twenties living abroad reviewing a world-salary tool on a tablet at a coworking desk. Several city photographs, role cards and proportional bars are visible but no labels or figures can be read; concentration and note-taking make the comparison believable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💰 Aynı işi yapıyorsun ama Berlin'de mi yoksa Toronto'da mı daha çok kazanırsın?

Mesleğini ve deneyimini gir; alanının farklı ülkelerde ne kadar kazandırdığını saniyeler içinde karşılaştır. Hayalini rakamlarla test et.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer kararlarını net verilerle aydınlatıyor ve seni o ülkelerdeki meslektaşlarınla buluşturuyor. Bilgi paylaşıldıkça büyür.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Maaş #Kariyer #TürkDiasporası #YurtDışıİş #CorteQS`,
        instagramPost: `💰 Aynı işi yapıyorsun ama Berlin'de mi Toronto'da mı daha çok kazanırsın?

Mesleğini ve deneyimini gir, saniyeler içinde ülkeler arası maaş farkını gör. Hayalini rakamlarla test et 📊

👉 Ücretsiz kayıt ol, hemen karşılaştır!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Maaş #Kariyer #TürkDiasporası #YurtDışıİş #Gurbet #MaaşKarşılaştırma #YurtDışıKariyer #İşFırsatı #ParaKonuşuyor #CorteQS`,
        redditPost: `Aynı mesleği farklı ülkelerde karşılaştıran bir maaş aracı denedim, sonuçlar gerçekçi mi merak ediyorum

CorteQS'te mesleğini ve deneyimini girince Berlin, Toronto gibi farklı şehir/ülkelerde ne kazanabileceğini gösteren bir karşılaştırma aracı var. Glassdoor/Levels.fyi tarzı sitelere benziyor ama daha çok "yurt dışına çıkacak Türk profesyoneller" odaklı gibi duruyor.

Böyle maaş karşılaştırma araçlarını ciddiye alıyor musunuz, yoksa gerçek teklif gelene kadar hepsi kabaca tahmin mi kalıyor? Kendi deneyiminizde tahminler ne kadar tutarlı çıktı?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This is a visual for a CorteQS click-through decision tool. The tool compares compensation and purchasing power for the same profession across international markets. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish woman in her late twenties living abroad speaks with a diaspora professional in the same field who explains how compensation and expenses differ between two countries. Their laptops and blank-looking budget sheets are open on the table, turning salary data into lived experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This is a visual for a CorteQS click-through decision tool. The tool compares compensation and purchasing power for the same profession across international markets. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish man in his early thirties living abroad stands in a real apartment kitchen in a potential destination, comparing rent, transport and net-income estimates on a phone with a local resident. The modest setting keeps the conversation about everyday quality of life. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shared plate, aroma swirl, and blank recipe card. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📊 Yüksek maaş her zaman yüksek refah demek değil.

Maaş Karşılaştırma Aracımız, brüt rakamı değil yaşam maliyetine göre "cebinde kalanı" gösteriyor. Nerede paran gerçekten daha çok eder, öğren.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette kariyerini kurarken hem veriyle hem mentorlarla yanında. Doğru karar, doğru bilgiyle başlar.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YaşamMaliyeti #Maaş #Diaspora #Kariyer #CorteQS`,
        instagramPost: `📊 Yüksek maaş her zaman yüksek refah demek değil!

Brüt rakam değil, yaşam maliyetine göre "cebinde kalan" önemli. Aracımızla paran nerede gerçekten daha çok ediyor, öğren 💸

👉 Ücretsiz kayıt ol, hemen keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YaşamMaliyeti #Maaş #Diaspora #Kariyer #TürkDiasporası #Gurbet #YurtDışıHayat #ParaYönetimi #BütçePlanı #CorteQS`,
        redditPost: `Brüt maaş yerine "yaşam maliyetine göre cebinde kalan" gösteren bir karşılaştırma aracı, bu yaklaşım size mantıklı geliyor mu

CorteQS'in maaş aracı sadece brüt rakamı değil, o ülkedeki yaşam maliyetine göre satın alma gücünü de hesaba katıyor. Fikir mantıklı: yüksek maaş + yüksek kira/vergi bazen düşük maaş + düşük maliyetten daha kötü çıkabiliyor.

Gerçekten taşınmış olanlar: sizce bu tür hesaplamalar taşınmadan önce ne kadar isabetli çıkıyor? Hangi kalemi hep eksik hesaplıyoruz (kira, vergi, sağlık sigortası vs.)?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This is a visual for a CorteQS click-through decision tool. The tool compares compensation and purchasing power for the same profession across international markets. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: After reviewing the result, a Turkish man in his early thirties living abroad updates a career plan at a tidy desk, balancing a job offer folder, housing budget and savings goal. No monetary values are visible; the clear organization communicates a realistic next step. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This is a visual for a CorteQS click-through decision tool. The tool compares compensation and purchasing power for the same profession across international markets. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish-origin couple planning their next move leaves a job interview in a new city and checks a compensation comparison on the phone before responding. Real office architecture and restrained emotion convey informed confidence rather than instant wealth. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🚀 Mesleğin senin pasaportun. Peki dünya onu nasıl değerlendiriyor?

Yazılımcıdan hemşireye, mühendisten öğretmene — alanının küresel maaş haritasını çıkar. Birkaç soruyla başla, kararını güçlendir.

👉 Ücretsiz kayıt olun!
CorteQS, yeteneğinin karşılığını dünyada bulman için yol gösteriyor; her hedef ülkede seni bekleyen bir Türk ağı var. Yalnız değilsin.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#MaaşHaritası #YurtDışıKariyer #TürkDiasporası #İşHayatı #CorteQS`,
        instagramPost: `🚀 Mesleğin senin pasaportun. Dünya onu nasıl değerlendiriyor bakalım?

Yazılımcıdan hemşireye, mühendisten öğretmene — alanının küresel maaş haritasını birkaç soruyla çıkar 🗺️

👉 Ücretsiz kayıt ol, kararını güçlendir!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#MaaşHaritası #YurtDışıKariyer #TürkDiasporası #İşHayatı #Gurbet #KariyerFırsatı #YurtDışıİş #GlobalKariyer #CorteQS`,
        redditPost: `Mesleklere göre küresel maaş haritası çıkaran bir araç var, hangi meslekler gerçekten yurt dışında daha çok kazandırıyor sizce

CorteQS'te yazılımcıdan hemşireye, mühendisten öğretmene kadar farklı mesleklerin ülkelere göre maaş farkını gösteren bir test var. "Mesleğin senin pasaportun" diye pazarlanıyor ama gerçekte bazı meslekler (örneğin sağlık, mühendislik) yurt dışında çok daha kolay tanınırken bazıları diploma denklik sorunuyla uğraşıyor.

Sizin mesleğinizde yurt dışına geçiş kolay mı oldu, yoksa maaş farkı kağıt üstünde iyi görünüp denklik/lisans süreçlerinde tıkanan bir tür mü?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-3",
    order: 3,
    name: "Yurt Dışına Taşınmaya Hazır mısın?",
    description:
      'Finansal, duygusal ve lojistik açıdan taşınmaya hazır olup olmadığını ölçen kişisel hazırlık testi. "Gerçeklik kontrolü" isteyen, taşınmayı planlayanlar için.',
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This is a visual for a CorteQS click-through decision tool. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish woman in her late twenties living abroad sits among half-packed moving boxes, checking relocation readiness on a laptop beside a passport wallet, language workbook, savings envelope and rental folder. The room is still lived-in, showing an honest preparation stage rather than a perfect departure scene. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: suitcase, house key, home, route line, checklist, wallet, and coins. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This is a visual for a CorteQS click-through decision tool. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a Turkish man in his early thirties living abroad answering a move-readiness test on a tablet while a partner sorts documents at the same table. Progress indicators are visible but unreadable; the scene balances excitement with the practical gaps still to solve. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: suitcase, house key, home, route line, checklist, speech bubbles, and sound waves. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎒 Taşınmaya gerçekten hazır mısın, yoksa sadece hayalini mi kuruyorsun?

5 soruluk hazırlık testimiz; finansından dil becerine, destek ağından risk toleransına kadar seni dürüstçe puanlıyor. Cesur ol, gerçeği gör.

👉 Ücretsiz kayıt olun!
CorteQS, taşınma yolculuğunda sana ayna tutuyor ve eksiklerini kapatacak mentorlarla buluşturuyor. Hazırlıklı giden, güçlü gelir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaHazırlığı #Göç #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🎒 Taşınmaya gerçekten hazır mısın, yoksa sadece hayalini mi kuruyorsun?

5 soruluk testimiz finansından dil becerine kadar seni dürüstçe puanlıyor. Cesur ol, gerçeği gör 👀

👉 Ücretsiz kayıt ol, hemen test et!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TaşınmaHazırlığı #Göç #TürkDiasporası #YurtDışı #Gurbet #HazırlıkTesti #GöçYolculuğu #YeniHayat #CorteQS`,
        redditPost: `"Taşınmaya hazır mısın" testi buldum, gerçek bir öz-değerlendirme mi yoksa sadece kayıt almak için tasarlanmış bir tuzak mı

CorteQS'te finans, dil, destek ağı ve risk toleransını 5 soruyla puanlayıp "hazırsın/değilsin" diyen bir test var. Genelde bu tür testlerin sonunda "kayıt ol, devamını gör" diye bitmesinden şüpheleniyorum — gerçekten dürüst bir gerçeklik kontrolü mü yapıyor yoksa sonuçta herkese "iyi gidiyorsun, sadece şunlara dikkat et" mi diyor?

Böyle bir öz-değerlendirme testi kullanan oldu mu, sonuç sizi gerçekten şaşırttı mı yoksa zaten bildiğiniz şeyleri mi söyledi?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This is a visual for a CorteQS click-through decision tool. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish man in his early thirties living abroad reviews a detailed readiness checklist with an experienced diaspora mentor, physically separating complete documents from unresolved tasks. Written content is hidden, and the mentor's calm guidance keeps the moment constructive rather than alarming. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This is a visual for a CorteQS click-through decision tool. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish-origin couple planning their next move practices a local-language conversation, checks a transit app and weighs a suitcase in one real apartment scene. The test result on a phone shows several readiness categories without legible copy, connecting assessment to concrete actions. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `⚖️ Cesaret yeterli mi? Bir de gerçeklik kontrolü yapalım.

Hazırlık Testimiz finansal birikiminden evrak durumuna kadar her şeyi ölçüp "Hazırsın" ya da "Biraz daha hazırlık" diyor. Skorunu öğren, planını yap.

👉 Ücretsiz kayıt olun!
CorteQS, hayalini sağlam temellere oturtman için hem rehberlik hem topluluk sunuyor. Doğru hazırlık, yarı yol demektir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GerçeklikKontrolü #TaşınmaTesti #Diaspora #GöçPlanı #CorteQS`,
        instagramPost: `⚖️ Cesaret yeterli mi? Bir de gerçeklik kontrolü yapalım.

Finansal birikiminden evrak durumuna kadar her şeyi ölçüyoruz: "Hazırsın" mı, "biraz daha hazırlık" mı? Skorunu öğren 📋

👉 Ücretsiz kayıt ol, planını yap!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#GerçeklikKontrolü #TaşınmaTesti #Diaspora #GöçPlanı #TürkDiasporası #Gurbet #YurtDışı #HazırlıkSkoru #CorteQS`,
        redditPost: `Finansal birikim + evrak durumuna göre "hazırsın / biraz daha hazırlık" diyen bir test, gerçeklik kontrolü olarak işe yarar mı

CorteQS'in hazırlık testi cesaretin yetip yetmediğini değil, pratik durumunu (birikim, evrak, dil) ölçtüğünü söylüyor. "Cesaret yeterli değil, gerçeklik kontrolü de lazım" mesajı hoşuma gitti ama merak ettiğim: bu tür testler genelde insanları caydırmamak için sonuçları yumuşatıyor mu, yoksa gerçekten "sen daha hazır değilsin" diyebiliyor mu?

Taşınmadan önce kendinizi objektif değerlendirdiniz mi, yoksa direkt atlayıp yolda mı öğrendiniz?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This is a visual for a CorteQS click-through decision tool. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish-origin couple planning their next move finishes the final preparation task and zips a suitcase beside neatly organized folders. The expression is grounded and calm, suggesting readiness earned through work rather than impulsive adventure. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This is a visual for a CorteQS click-through decision tool. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At the departure gate, a mid-career Turkish professional living in Europe looks back once at family and then checks a phone containing a completed readiness plan. All interface text is unreadable; the photograph captures a prepared departure without melodrama. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧠 Taşınmanın en zor kısmı bavul değil, hazır olmak.

Finansal güvence, dil, destek ağı, uyum yeteneği... Hepsini tek testte değerlendir, hangi alanda güçlü hangi alanda eksik olduğunu gör.

👉 Ücretsiz kayıt olun!
CorteQS, her adımında yanında; eksik kaldığın yerde sana yol gösterecek bir diaspora ağı bir tık uzağında. Birlikte daha hazırız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaHazırlığı #YurtDışıHayat #TürkDiasporası #Göç #CorteQS`,
        instagramPost: `🧠 Taşınmanın en zor kısmı bavul değil, hazır olmak!

Finans, dil, destek ağı, uyum... Hepsini tek testte değerlendir; güçlü ve eksik yönlerini gör 💪

👉 Ücretsiz kayıt ol, kendini test et!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TaşınmaHazırlığı #YurtDışıHayat #TürkDiasporası #Göç #Gurbet #ÖzDeğerlendirme #YeniHayat #HazırlıkTesti #CorteQS`,
        redditPost: `Finans, dil, destek ağı ve uyum yeteneğini tek testte ölçen bir "hazırlık skoru" var, güvenilir bir metrik mi sizce

CorteQS'in testi "taşınmanın en zor kısmı bavul değil, hazır olmak" diyerek dört boyutta (finans, dil, ağ, uyum) seni puanlıyor. Konsept olarak mantıklı ama tek bir testin bu kadar çok değişkeni gerçekten ölçebileceğinden emin değilim, çoğu insan kendi durumunu zaten biliyor.

Bu tür çok boyutlu öz-değerlendirme testlerine güveniyor musunuz, yoksa sonuçta "git yaşa gör" demekten farksız mı?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-4",
    order: 4,
    name: "Hangi Şehir Sana Daha Uygun?",
    description:
      "Hedef ülke içinde tercihlerinle (iş fırsatları, yaşam tarzı, iklim, topluluk) en uyumlu şehirleri öneren araç. Ülkeyi bilen ama şehre karar veremeyenler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish man in his early thirties living abroad compares three city neighborhoods on a large laptop using realistic street photographs, commute views and housing cards with no readable text. A bicycle helmet, transit card and coffee beside the computer reveal which daily-life factors matter. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over the shoulder of a Turkish-origin couple planning their next move taking a city-fit test on a tablet while looking out over an ordinary urban street. The screen shows photo choices for density, nature, nightlife and family life without labels, linking preferences to real environments. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🏙️ Doğru ülkeyi seçtin ama hangi şehir tam sana göre?

Berlin mi Münih mi? İş fırsatından iklime, yaşam maliyetinden Türk topluluğunun büyüklüğüne kadar tercihlerini eşleştirip sana en uygun 3 şehri öğren.

👉 Ücretsiz kayıt olun!
CorteQS, sadece ülkeyi değil, doğru mahalleyi bulmana yardım ediyor ve o şehirdeki Türklerle seni buluşturuyor. Şehrin tanıdık olsun.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirSeçimi #Göç #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🏙️ Doğru ülkeyi seçtin ama hangi şehir tam sana göre?

Berlin mi Münih mi? İş fırsatı, iklim, yaşam maliyeti, Türk topluluğu — hepsini eşleştirip sana en uygun 3 şehri buluyoruz 📍

👉 Ücretsiz kayıt ol, şehrini keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirSeçimi #Göç #TürkDiasporası #YurtDışı #Gurbet #ŞehirEşleştirme #YeniŞehir #TaşınmaKararı #CorteQS`,
        redditPost: `Ülke belli ama şehir seçimi için ayrı bir eşleştirme testi var, bu ikinci adım gerçekten gerekli mi

CorteQS'te "ülkeni seçtin, peki hangi şehir?" diye ayrı bir test var — iş fırsatı, iklim, yaşam maliyeti ve Türk topluluğunun büyüklüğüne göre şehir öneriyor. Almanya'ya gideceğim ama Berlin mi Münih mi bilemiyorum diyen biri için mantıklı duruyor.

Aynı ülke içinde şehir seçiminin gerçekten bu kadar büyük fark yarattığını düşünüyor musunuz? Yanlış şehri seçip pişman olan ya da tam tersi "doğru şehir her şeyi değiştirdi" diyen var mı?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish-origin couple planning their next move discusses two shortlisted cities with residents on a video call. Their faces appear in distinct home settings and the shared screen shows unreadable neighborhood images; practical questions and note-taking replace skyline fantasy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a mid-career Turkish professional living in Europe walks through a recommended neighborhood with a local CorteQS contact, observing transit, grocery shops, parks and housing rather than tourist landmarks. A phone with the city result remains visible but unreadable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📍 Ülke büyük, ama hayatın bir şehirde kuruluyor.

Şehir Eşleştirme Aracımız; kariyer hub'larından iklime, expat topluluğundan kira seviyesine kadar her detayı tartıp senin şehrini bulur. Birkaç soruyla başla.

👉 Ücretsiz kayıt olun!
CorteQS, gideceğin şehirde seni yalnız bırakmıyor; oradaki diaspora ağı ilk günden yanında. Yeni şehir, tanıdık bir aile.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirEşleştirme #Diaspora #YurtDışıHayat #TürkDiasporası #CorteQS`,
        instagramPost: `📍 Ülke büyük, ama hayatın bir şehirde kuruluyor!

Kariyer fırsatı, iklim, expat topluluğu, kira seviyesi — hepsini tartıp senin şehrini buluyoruz. Birkaç soruyla başla ⚡

👉 Ücretsiz kayıt ol, şehrini bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirEşleştirme #Diaspora #YurtDışıHayat #TürkDiasporası #Gurbet #YeniŞehir #ŞehirRehberi #TaşınmaPlanı #CorteQS`,
        redditPost: `Kariyer hub'ı, iklim, expat topluluğu ve kira seviyesini tartıp şehir öneren bir araç, hangi kriter sizce en belirleyici olmalı

CorteQS'in şehir eşleştirme aracı "ülke büyük ama hayatın bir şehirde kuruluyor" mantığıyla birkaç faktörü ağırlıklandırıp öneri sunuyor. Ama bu faktörlerin kişiden kişiye önem sırası çok değişiyor — biri için kira belirleyici, biri için sadece iş piyasası önemli.

Siz şehir seçerken hangi tek kritere en çok ağırlık verdiniz? Sonradan "keşke şuna daha çok önem verseydim" dediğiniz oldu mu?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a mid-career Turkish professional living in Europe sits in a cafe in the selected city, comparing the test result with the street outside and marking a housing shortlist. The mood is observant and realistic, showing fit through ordinary routines. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish parent balancing family and career abroad receives apartment keys in a city that matches the chosen lifestyle, with a park, tram line or coworking space visible nearby. The outcome is modest and credible, not a luxury relocation fantasy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🗺️ İki şehir aynı ülkede ama iki ayrı dünya olabilir.

İş piyasası, şehir büyüklüğü, kültür, Türk topluluğu... Senin önceliklerine göre puanlayıp en uygun şehirleri haritada gösteriyoruz. Kararını kolaylaştır.

👉 Ücretsiz kayıt olun!
CorteQS, doğru şehirde doğru bağlantılarla başlaman için hazır; her şehirde yaşayan bir ağ seni bekliyor. Bir dizin değil, bir topluluk.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirRehberi #Göç #TürkDiasporası #YeniHayat #CorteQS`,
        instagramPost: `🗺️ İki şehir aynı ülkede ama iki ayrı dünya olabilir!

İş piyasası, kültür, Türk topluluğu, kira seviyesi — önceliklerine göre puanlayıp en uygun şehirleri haritada gösteriyoruz 📌

👉 Ücretsiz kayıt ol, kararını kolaylaştır!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirRehberi #Göç #TürkDiasporası #YeniHayat #Gurbet #ŞehirKarşılaştırma #YurtDışı #TaşınmaKararı #CorteQS`,
        redditPost: `"Aynı ülkede iki şehir iki ayrı dünya olabilir" diyen bir şehir karşılaştırma testi, katılıyor musunuz

CorteQS'te iş piyasası, kültür, Türk topluluğu büyüklüğü ve kira seviyesini önceliklerine göre puanlayıp şehir öneren bir araç var. Bu iddiaya (aynı ülkede şehirlerin bu kadar farklı olabileceğine) genelde katılıyorum ama merak ettiğim: küçük bir Türk topluluğu olan bir şehirde yaşamak gerçekten dezavantaj mı, yoksa bazı insanlar için tam tersi mi?

Küçük ya da hiç Türk topluluğu olmayan bir şehirde yaşayanlar var mı, deneyiminiz nasıldı?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-5",
    order: 5,
    name: "Diaspora Ağı Eşleştirme",
    description:
      "Diaspora üyelerini tamamlayıcı ihtiyaç ve uzmanlıklara göre eşleştiren akıllı eşleştirici. Mentor/iş fırsatı arayan yeni gelenler ve yardım etmek isteyen deneyimliler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This is a visual for a CorteQS click-through decision tool. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish-origin couple planning their next move enters a specific need into a laptop and reviews several relevant diaspora profiles with portraits, cities and skill cards, all text unreadable. One result is visually selected while the subject leans closer in recognition. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This is a visual for a CorteQS click-through decision tool. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a mid-career Turkish professional living in Europe accepting a suggested community match on a phone. The screen shows two profile portraits and shared-interest cues without labels, while a notebook records nothing legible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, profile badge, camera, and open book. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🤝 Gurbette en kıymetli şey: senden önce o yoldan geçmiş biri.

Diaspora Ağı Eşleştirici; mesleğine, şehrine ve ihtiyacına göre sana en uygun mentoru, iş bağlantısını ya da yol arkadaşını buluyor. Doğru kişi, bir tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık diasporayı akıllı eşleştirmeyle bir araya getiriyor; aradığın insan da seni arıyor olabilir. Birlikte daha güçlüyüz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Networking #Mentorluk #TürkDiasporası #Eşleşme #CorteQS`,
        instagramPost: `🤝 Gurbette en kıymetli şey: senden önce o yoldan geçmiş biri!

Mesleğine, şehrine ve ihtiyacına göre sana en uygun mentoru veya yol arkadaşını buluyoruz. Doğru kişi bir tık uzağında ✨

👉 Ücretsiz kayıt ol, eşleşmeni bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Networking #Mentorluk #TürkDiasporası #Eşleşme #Diaspora #Gurbet #YolArkadaşı #TopluluğaKatıl #CorteQS`,
        redditPost: `Diaspora üyelerini "kim ne arıyor, kim ne sunuyor" mantığıyla eşleştiren bir sistem var, gerçekten kaliteli eşleşme çıkarabilir mi

CorteQS'te mesleğine, şehrine ve ihtiyacına göre sana mentor, iş bağlantısı ya da yol arkadaşı öneren bir eşleştirici var. Fikir "tanıdık bir tanıdık" beklemek yerine sistematik arama yapmak gibi duruyor ama bu tür eşleştirmelerin kalitesi genelde havuzun büyüklüğüne bağlı oluyor.

Yeni bir şehre taşınırken mentor/yol arkadaşı bulma konusunda organik yollar mı (Facebook grupları, tanıdıklar) yoksa bu tür yapılandırılmış eşleştirme sistemleri mi daha işe yaradı sizin için?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This is a visual for a CorteQS click-through decision tool. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a mid-career Turkish professional living in Europe joins a first video call with a matched mentor or collaborator. Both people appear in realistic workspaces and discuss a concrete document or prototype, demonstrating relevance through the conversation itself. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This is a visual for a CorteQS click-through decision tool. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish parent balancing family and career abroad meets the matched contact at a cafe and immediately opens a shared project on a tablet. Their natural rapport and purposeful discussion make the network match tangible, with no glowing connection lines. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🌐 Tanıdık bir tanıdık beklemek devri bitti.

Ne sunduğunu ve ne aradığını yaz; alan, şehir ve dil uyumuna göre sana en uygun diaspora bağlantılarını puanlayarak getirelim. Saatlerce arama yok, akıllı eşleşme var.

👉 Ücretsiz kayıt olun!
CorteQS, kökenini paylaşan milyonları görünür kılan güven ağı. Yardım istemek de vermek de artık çok kolay.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#DiasporaAğı #Mentorluk #TürkDiasporası #Topluluk #CorteQS`,
        instagramPost: `🌐 Tanıdık bir tanıdık beklemek devri bitti!

Ne sunduğunu ve ne aradığını yaz, alan-şehir-dil uyumuna göre en uygun bağlantılarını getirelim. Saatlerce arama yok, akıllı eşleşme var ⚡

👉 Ücretsiz kayıt ol, hemen dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#DiasporaAğı #Mentorluk #TürkDiasporası #Topluluk #Gurbet #AkıllıEşleşme #Networking #Dayanışma #CorteQS`,
        redditPost: `"Ne sunduğunu ve ne aradığını yaz" mantığıyla çalışan bir diaspora eşleştirme aracı, serbest metin girişi klasik filtrelemeden daha mı iyi sonuç veriyor

CorteQS'te profil listesini kendin taramak yerine bir kutuya ne aradığını yazınca alan/şehir/dil uyumuna göre eşleşme öneren bir sistem var. "Tanıdık bir tanıdık beklemek devri bitti" diye pazarlanıyor ama bu tür serbest metin eşleştirmelerin ne kadar isabetli olduğunu merak ediyorum.

Böyle bir sistemde arama yapan oldu mu — yazdığınız şeyle gerçekten alakalı sonuçlar mı geldi, yoksa anahtar kelime eşleşmesinden öteye geçmedi mi?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This is a visual for a CorteQS click-through decision tool. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish parent balancing family and career abroad attends a small meetup introduced by the matched contact and is welcomed into an existing circle. The phone profile remains in hand but the real relationships now dominate the frame. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This is a visual for a CorteQS click-through decision tool. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a young Turkish graduate beginning an international career and the matched professional complete a useful first outcome—reviewing a resume, planning a supplier call or solving a local question—at a real table with believable materials and no readable private data. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💡 Sen birine yardım edebilir, biri de sana yol gösterebilir.

Diaspora Eşleştirici, ihtiyaçları ve yetenekleri eşleştiren bir köprü. Yeni gelensen mentor bul, deneyimliysen birine ışık ol.

👉 Ücretsiz kayıt olun!
CorteQS, dayanışmayı bir değer değil bir refleks haline getiriyor; her eşleşme yeni bir kapı. Nerede olursan ol, yanında biri var.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #Networking #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `💡 Sen birine yardım edebilir, biri de sana yol gösterebilir!

Diaspora Eşleştirici ihtiyaçları ve yetenekleri buluşturan bir köprü. Yeni gelensen mentor bul, deneyimliysen birine ışık ol ✨

👉 Ücretsiz kayıt ol, köprüde yerini al!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Dayanışma #Networking #Diaspora #TürkDiasporası #Gurbet #Mentorluk #YardımlaşmaAğı #TopluluğaKatıl #CorteQS`,
        redditPost: `İhtiyaç ve yetenekleri eşleştirip "yeni gelen - deneyimli" köprüsü kuran bir sistem, karşılıklı dayanışma modelleri gerçekten sürdürülebilir mi

CorteQS'in eşleştiricisi hem "mentor arıyorum" hem "mentor olabilirim" tarafını aynı sistemde tutuyor. Fikir güzel ama bu tür karşılıklı yardımlaşma platformlarında genelde bir taraf (yardım isteyenler) çok kalabalık, diğer taraf (yardım etmek isteyen deneyimliler) az kalıyor.

Bu tür bir dengesizlik yaşayan ya da tam tersi iyi işleyen bir mentor/dayanışma ağı deneyimi olan var mı?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-6",
    order: 6,
    name: "Yurt Dışında Hangi Kariyer Sana Uygun?",
    description:
      "İlgi alanların ve becerilerine göre yurt dışındaki kariyer seçeneklerini öneren test. Yön arayan öğrenciler ve profesyoneller için (eğitim mi, teknoloji mi, girişimcilik mi).",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool translates skills, experience and preferences into realistic international career directions. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a mid-career Turkish professional living in Europe reviews a career-fit assessment on a laptop beside a portfolio, certificates turned face-down and objects from several possible roles. The selected path is indicated through one realistic workplace photograph, not a symbolic icon. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool translates skills, experience and preferences into realistic international career directions. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over the shoulder of a Turkish parent balancing family and career abroad answering scenario-based career questions on a tablet in a coworking space. Photo choices show teamwork, technical work, client service and creative practice without readable labels; the subject considers each carefully. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎓 Yüksek lisans mı, teknoloji işi mi, kendi girişimin mi?

Kariyer Yolu Testimiz; ilgi alanlarını ve becerilerini analiz edip yurt dışında sana en uygun yolu öneriyor. Yönünü bul, adımını at.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer yolculuğunda hem rehber hem ağ; testten çıkan her yolda sana eşlik edecek mentorlar var. Geleceğin bugünden başlasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kariyer #YurtDışıEğitim #TürkDiasporası #YolHaritası #CorteQS`,
        instagramPost: `🎓 Yüksek lisans mı, teknoloji işi mi, kendi girişimin mi?

İlgi alanlarını ve becerilerini analiz edip yurt dışında sana en uygun yolu öneriyoruz. Yönünü bul, adımını at 🚀

👉 Ücretsiz kayıt ol, kariyer yolunu keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Kariyer #YurtDışıEğitim #TürkDiasporası #YolHaritası #Gurbet #KariyerYolu #YurtDışıKariyer #GelecekPlanı #CorteQS`,
        redditPost: `İlgi alanı ve becerilerine göre "akademi mi, teknoloji mi, girişimcilik mi" öneren bir kariyer testi var, bu üçlü ayrım gerçekçi mi

CorteQS'te yurt dışında hangi kariyer yönünün sana uygun olduğunu analiz eden bir test var. Yüksek lisans, teknoloji sektörü ya da kendi işini kurma arasında öneri sunuyor. Sorun şu: bu üç yol gerçek hayatta genelde birbirine karışıyor (biri hem çalışıp hem yüksek lisans yapıyor, biri şirkette çalışırken yan proje açıyor).

Yön arayan öğrenciler/yeni mezunlar: bu kararı nasıl verdiniz, tek bir yol mu seçtiniz yoksa zamanla karışık bir şey mi oldu?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool translates skills, experience and preferences into realistic international career directions. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish parent balancing family and career abroad meets a diaspora career mentor who compares current skills with two realistic role paths using portfolios and job examples. All text is blurred, while the mentor's specific pointing and the subject's notes show practical translation of experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool translates skills, experience and preferences into realistic international career directions. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a young Turkish graduate beginning an international career spends a day shadowing a recommended profession in a real workplace, observing tasks rather than posing. A phone with the career result is briefly visible with no readable interface. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧭 Yetenekli olmak yetmez; doğru yöne gitmek gerekir.

İlgi alanların, çalışma stilin ve risk toleransın hangi kariyere işaret ediyor? Birkaç soruyla yurt dışındaki en uygun rotanı keşfet.

👉 Ücretsiz kayıt olun!
CorteQS, hedefine giden yolda seni başarılı diaspora profesyonelleriyle buluşturuyor. İlham ve fırsat, tek ağda.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KariyerTesti #YurtDışıKariyer #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `🧭 Yetenekli olmak yetmez; doğru yöne gitmek gerekir!

İlgi alanların, çalışma stilin ve risk toleransın hangi kariyere işaret ediyor? Birkaç soruyla rotanı keşfet 🗺️

👉 Ücretsiz kayıt ol, testi çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KariyerTesti #YurtDışıKariyer #Diaspora #TürkDiasporası #Gurbet #KariyerYönü #Mentorluk #İlhamVeFırsat #CorteQS`,
        redditPost: `Çalışma stili ve risk toleransına göre kariyer rotası öneren bir test, risk toleransı gerçekten bu kadar belirleyici mi

CorteQS'in kariyer testi "yetenekli olmak yetmez, doğru yöne gitmek gerekir" diyerek ilgi alanı + çalışma stili + risk toleransını birlikte değerlendiriyor. Risk toleransını ölçmek ilginç bir yaklaşım çünkü çoğu kariyer testi sadece beceri/ilgiye bakıyor, riske hiç değinmiyor.

Yurt dışında kariyer değiştirenler: risk toleransınız kararınızı gerçekten değiştirdi mi, yoksa sonunda hepiniz aynı mantıklı yolu mu seçtiniz?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool translates skills, experience and preferences into realistic international career directions. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a young Turkish graduate beginning an international career updates a portfolio and learning plan after choosing a direction, arranging a course schedule, project samples and interview clothing. The scene communicates focused transition rather than instant reinvention. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This is a visual for a CorteQS click-through decision tool. The tool translates skills, experience and preferences into realistic international career directions. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish woman in her late twenties living abroad begins the first day in the recommended field, receiving an orientation from a colleague in a believable workplace. Quiet confidence and real tools communicate an attainable outcome. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, linked hands, rising sun, and star. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🚀 Akademi mi, sektör mü, girişim mi? Karar senin, rehber bizden.

Kariyer Yolu Aracı, becerilerini ve hedeflerini eşleştirip sana özel bir yön öneriyor. Belirsizlikte kaybolma; net bir rotayla ilerle.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette kariyerini kurarken yalnız bırakmaz; her alanda sana yol gösterecek bir topluluk hazır. Birlikte daha yükseğe.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KariyerYolu #YurtDışıHayat #TürkDiasporası #Mentorluk #CorteQS`,
        instagramPost: `🚀 Akademi mi, sektör mü, girişim mi? Karar senin, rehber bizden!

Becerilerini ve hedeflerini eşleştirip sana özel bir yön öneriyoruz. Belirsizlikte kaybolma, net rotayla ilerle 📈

👉 Ücretsiz kayıt ol, yönünü bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KariyerYolu #YurtDışıHayat #TürkDiasporası #Mentorluk #Gurbet #KariyerRotası #Girişimcilik #YurtDışıKariyer #CorteQS`,
        redditPost: `Akademi, sektör ya da girişim arasında karar veremeyenler için becerileri hedeflerle eşleştiren bir araç var

CorteQS'in Kariyer Yolu Aracı becerilerini ve hedeflerini eşleştirip "sana özel bir yön" önerdiğini söylüyor. Belirsizlikte kaybolmamak için mantıklı bir fikir ama merak ediyorum: bu tür testler genelde zaten içten içe bildiğin cevabı mı doğruluyor, yoksa gerçekten beklemediğin bir öneri de çıkabiliyor mu?

Böyle bir kariyer testi/rehberlik aracı kullanıp "hiç düşünmediğim bir yol" önerisi alan oldu mu?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-7",
    order: 7,
    name: "Yurt Dışı Yaşam Tarzın Ne?",
    description:
      "Kullanıcıları eğlenceli kişilik tiplerine ayıran (Küresel Networker, Sakin Yerli, Macera Avcısı gibi) keyifli kişilik testi. Etkileşim ve paylaşım için ideal.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This is a visual for a CorteQS click-through decision tool. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish parent balancing family and career abroad completes a lifestyle assessment at home while real cues of daily priorities surround them: bicycle, family calendar, remote-work desk, cooking ingredients and hiking shoes. The tablet shows photographic choices with no readable labels. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This is a visual for a CorteQS click-through decision tool. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a young Turkish graduate beginning an international career selecting between urban, family-oriented, nature-focused and mobile work scenarios on a laptop. Each option is a realistic photo tile rather than an icon, and the subject's home context reveals genuine trade-offs. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `✨ Sen bir "Küresel Networker" mısın yoksa "Sakin Yerli" mi?

Eğlenceli 8 soruluk testimizle yurt dışı yaşam tarzı kişiliğini keşfet. Sonucu arkadaşlarınla paylaş, kim olduğunu gör. Hadi başla!

👉 Ücretsiz kayıt olun!
CorteQS, kişiliğine uyan diaspora kabilesini bulmana yardım ediyor; benzer ruhlar bir tık uzağında. Eğlen, bağlan, ait ol.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KişilikTesti #YurtDışıYaşam #TürkDiasporası #Eğlence #CorteQS`,
        instagramPost: `✨ Sen bir "Küresel Networker" mısın yoksa "Sakin Yerli" mi?

Eğlenceli 8 soruluk testle yurt dışı yaşam tarzı kişiliğini keşfet, sonucu story'ne at! 🎉

👉 Ücretsiz kayıt ol, hemen başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KişilikTesti #YurtDışıYaşam #TürkDiasporası #Eğlence #Gurbet #ExpatKişilik #TestZamanı #Paylaş #CorteQS`,
        redditPost: `Sıkılınca yaptığım "hangi expat tipisin" testi, sonuç beni gerçekten şaşırttı mı bilmiyorum ama eğlenceliydi

CorteQS diye bir sitede "Küresel Networker" mi "Sakin Yerli" mi gibi tiplere ayıran bir yaşam tarzı testi var, 8 soru falan sürüyor. Ciddi bir şey değil, daha çok BuzzFeed tarzı bir kişilik testi mantığında ama yurt dışında yaşayanlara özel sorular soruyor.

Böyle bir test yapıp sonucu gerçekten kendine uygun bulan var mı, yoksa hepimiz "beklenmedik" bir sonuç mu alıyoruz?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This is a visual for a CorteQS click-through decision tool. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a young Turkish graduate beginning an international career discusses the result with a partner or friend, comparing a busy central apartment, quiet suburb and smaller nature-rich city through photographs and budget notes. Written details are blurred; the conversation feels honest. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This is a visual for a CorteQS click-through decision tool. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish woman in her late twenties living abroad spends a weekend testing the recommended lifestyle in a real neighborhood—using transit, working from a cafe, shopping locally or visiting a park. The image emphasizes ordinary routines over sightseeing. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: coffee cup, conversation bubbles, round table symbol, aroma swirl, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎭 Gurbetteki tarzın seni ele veriyor.

Gece hayatı mı sakin kafeler mi? Solo gezi mi tur mu? Cevapların hangi expat kişiliğine uyuyor, öğren ve rozetini kap. 2 dakikalık keyifli test.

👉 Ücretsiz kayıt olun!
CorteQS, seni sana benzeyen insanlarla buluşturan sıcak bir topluluk. Tarzın ne olursa olsun, yerin burada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ExpatKişilik #YaşamTarzı #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `🎭 Gurbetteki tarzın seni ele veriyor!

Gece hayatı mı sakin kafeler mi? Solo gezi mi tur mu? 2 dakikalık keyifli testle expat kişiliğini öğren, rozetini kap 🏅

👉 Ücretsiz kayıt ol, hemen test et!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ExpatKişilik #YaşamTarzı #Diaspora #TürkDiasporası #Gurbet #KeyifliTest #YurtDışıHayat #Rozet #CorteQS`,
        redditPost: `"Gece hayatı mı sakin kafeler mi" gibi sorularla expat kişiliğini belirleyen bir rozet testi var, bu tür şeyler bağımlılık yapıyor bazen değil mi

CorteQS'te gece hayatı/sakin kafeler, solo gezi/tur gibi tercihlerine göre bir expat kişilik rozeti veren 2 dakikalık bir test var. Ciddiye almıyorum ama itiraf edeyim bu tür kişilik testlerini hep tıklıyorum, bir tuhaf tatmin ediyor.

Sizin expat/gurbet tarzınız hangisine daha yakın — gece hayatı tipi mi, sakin/ev odaklı tip mi? Yoksa zamanla değişti mi?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This is a visual for a CorteQS click-through decision tool. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish woman in her late twenties living abroad reorganizes the home and weekly schedule to fit the chosen lifestyle, creating a practical balance between work, community and personal time. The result screen remains visible but unreadable on a phone. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This is a visual for a CorteQS click-through decision tool. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish man in his early thirties living abroad enjoys an unforced daily moment that matches the result—cycling to work, sharing a family meal or working remotely near nature—photographed as real life rather than an aspirational travel ad. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, shared plate, aroma swirl, and blank recipe card. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🌟 Aynı şehirde yaşayıp bambaşka hayatlar kurarız. Seninki hangisi?

Macera Avcısı, Kozmopolit Networker, Huzurlu Yerli... Hangi tip sana uyuyor? Eğlenceli testle öğren, sonucu story'ne taşı.

👉 Ücretsiz kayıt olun!
CorteQS, kişiliğine en uygun toplulukları önererek gurbeti eğlenceli kılıyor. Kendini bul, çevreni kur.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YaşamTarzıTesti #YurtDışı #TürkDiasporası #Topluluk #CorteQS`,
        instagramPost: `🌟 Aynı şehirde yaşayıp bambaşka hayatlar kurarız. Seninki hangisi?

Macera Avcısı, Kozmopolit Networker, Huzurlu Yerli... Hangisi sana uyuyor? Eğlenceli testle öğren, story'ne taşı 📲

👉 Ücretsiz kayıt ol, kendini bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YaşamTarzıTesti #YurtDışı #TürkDiasporası #Topluluk #Gurbet #KişilikTesti #ExpatHayatı #KendiniKeşfet #CorteQS`,
        redditPost: `"Macera Avcısı", "Kozmopolit Networker", "Huzurlu Yerli" gibi tiplere ayıran bir yaşam tarzı testi var, siz hangisi çıkardınız

CorteQS'in yaşam tarzı testi "aynı şehirde yaşayıp bambaşka hayatlar kurarız" fikrinden yola çıkıyor ve seni birkaç expat tipinden birine yerleştiriyor. Aynı şehirde yaşayan iki kişinin tamamen farklı bir gurbet deneyimi yaşayabileceği gözlemine katılıyorum aslında.

Kendinizi hangi tipe yakın buluyorsunuz, yoksa zamanla bir tipten diğerine mi geçtiniz (mesela ilk yıl Macera Avcısı, sonra Huzurlu Yerli gibi)?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-8",
    order: 8,
    name: "İlk 90 Gün Planlayıcı",
    description:
      "Yeni gelenler için görev ve ipuçlarından oluşan kişisel kontrol listesi üreten interaktif planlayıcı. İlk haftalarını organize etmek isteyenler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This is a visual for a CorteQS click-through decision tool. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a young Turkish graduate beginning an international career builds a first-90-days plan at a real apartment table with a wall calendar, city registration folder, bank appointment card, language materials and housing notes. The laptop organizes phases and tasks with no readable copy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This is a visual for a CorteQS click-through decision tool. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a Turkish woman in her late twenties living abroad moving tasks across a digital 90-day planner on a tablet while unpacked boxes remain in the room. Progress bars and calendar blocks are visible but unreadable, making the planning process tangible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: suitcase, house key, home, route line, checklist, linked hands, and rising sun. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🗓️ Yeni ülkede ilk 90 gün her şeyi belirler. Hazır mısın?

İlk 90 Gün Planlayıcı; konaklamadan banka hesabına, sigortadan dil kursuna kadar sana özel bir görev listesi çıkarıyor. Kaosa değil, plana başla.

👉 Ücretsiz kayıt olun!
CorteQS, yeni hayatının ilk adımlarını düzene sokuyor ve her görevde sana yol gösterecek bir topluluk sunuyor. Sıfırdan değil, destekle başla.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #Planlama #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🗓️ Yeni ülkede ilk 90 gün her şeyi belirler. Hazır mısın?

Konaklamadan banka hesabına, sigortadan dil kursuna kadar sana özel görev listesi çıkarıyoruz. Kaosa değil, plana başla 📋

👉 Ücretsiz kayıt ol, planını al!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YeniGelenler #Planlama #TürkDiasporası #YurtDışı #Gurbet #İlk90Gün #YerleşmePlanı #YeniHayat #CorteQS`,
        redditPost: `Konaklama, banka hesabı, sigorta, dil kursu gibi ilk 90 gün görevlerini listeleyen bir planlayıcı var, bu tür genel şablonlar ne kadar işe yarıyor

CorteQS'te yeni gelenler için ilk 90 günde yapılması gerekenleri sıralayan bir planlayıcı var. Fikir mantıklı çünkü ilk haftalarda insan gerçekten neyi ne zaman yapacağını bilemiyor, ama her ülkenin/şehrin bürokrasisi çok farklı olduğu için genel bir şablonun ne kadar isabetli olabileceğini merak ediyorum.

Yeni taşındığınızda ilk 90 günde en çok neyi geç fark ettiniz / keşke daha erken halletseydim dediniz?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This is a visual for a CorteQS click-through decision tool. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish woman in her late twenties living abroad reviews the first-month priorities with an experienced local mentor, checking appointments and dependencies against real documents. Personal details are hidden and all text blurred; their focused exchange communicates sequence and support. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This is a visual for a CorteQS click-through decision tool. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish man in his early thirties living abroad completes several early tasks in one realistic morning: transit card, registration folder and first grocery setup on the kitchen counter. The planner on the phone shows completed blocks without legible labels. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: shared plate, aroma swirl, blank recipe card, helping hands, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `✅ "Önce neyi halletmeliyim?" panikleme, listele.

Birkaç soruyla yanıtla; sana hafta hafta önceliklendirilmiş bir yerleşme planı sunalım. İlk hafta, ilk ay, ilk üç ay — hepsi net.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette ilk adımlarını atarken elinden tutuyor; deneyimli komşuların tecrübesi bir tık uzağında. Yalnız uğraşma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YerleşmePlanı #YeniGelenler #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `✅ "Önce neyi halletmeliyim?" panikleme, listele!

Birkaç soruyla hafta hafta önceliklendirilmiş bir yerleşme planı çıkarıyoruz. İlk hafta, ilk ay, ilk üç ay — hepsi net 📆

👉 Ücretsiz kayıt ol, planını çıkar!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YerleşmePlanı #YeniGelenler #Diaspora #TürkDiasporası #Gurbet #YurtDışı #İlkAylar #DestekAğı #CorteQS`,
        redditPost: `Sorulara göre hafta hafta önceliklendirilmiş bir yerleşme planı çıkaran bir araç, "ilk hafta / ilk ay / ilk üç ay" ayrımı gerçekçi mi

CorteQS'in planlayıcısı birkaç soruyla sana özel, zaman bazlı bir yerleşme sırası öneriyor. "Önce neyi halletmeliyim, panikleme, listele" mesajı hoş ama gerçek hayatta bürokratik randevular (ikamet, banka vs.) genelde senin planına değil, kurumların takvimine göre şekilleniyor.

Kendi ilk 90 gününüzü planlı mı geçirdiniz yoksa işler zaten randevu/bürokrasi sırasına göre kendiliğinden mi dizildi?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This is a visual for a CorteQS click-through decision tool. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At roughly day sixty, a Turkish man in his early thirties living abroad works from a settled desk with fewer boxes and a clearer routine, checking the next phase of the plan. The environment visibly shows progress without artificial before-and-after graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: compass, balanced scale, forking paths, checkmark, target, and location pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This is a visual for a CorteQS click-through decision tool. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At the end of the first ninety days, a Turkish-origin couple planning their next move hosts two new local friends in the now-lived-in apartment while the completed planner rests on a closed laptop. The outcome is stability and connection, not perfection. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📋 Yeni bir ülke, yüzlerce yapılacak iş. Nereden başlanır?

İlk 90 Gün Planlayıcı, durumuna göre kişisel bir kontrol listesi üretiyor — ikamet kaydından okula, sağlıktan sosyal çevreye. Adım adım, stressiz.

👉 Ücretsiz kayıt olun!
CorteQS, yeni başlangıcını kolaylaştırıyor; her görevde sana destek olacak bir diaspora ağı hazır. Birlikte daha kolay.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İlk90Gün #YerleşmeRehberi #TürkDiasporası #Göç #CorteQS`,
        instagramPost: `📋 Yeni bir ülke, yüzlerce yapılacak iş. Nereden başlanır?

İkamet kaydından okula, sağlıktan sosyal çevreye — kişisel kontrol listeni çıkarıyoruz. Adım adım, stressiz 🌿

👉 Ücretsiz kayıt ol, listeni al!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İlk90Gün #YerleşmeRehberi #TürkDiasporası #Göç #Gurbet #YeniBaşlangıç #YurtDışı #DestekAğı #CorteQS`,
        redditPost: `İkamet kaydından okula, sağlıktan sosyal çevreye kişisel kontrol listesi çıkaran bir planlayıcı, sosyal çevre kısmı gerçekten "görev listesine" konabilir mi

CorteQS'in İlk 90 Gün Planlayıcı'sı bürokratik işlerin yanına sosyal çevre kurmayı da bir görev olarak koyuyor. Bürokrasi kısmı (ikamet, banka, sigorta) net adımlarla listelenebilir ama "sosyal çevre kur" gibi bir şeyin checklist mantığına ne kadar uyduğunu merak ediyorum, bu daha çok zamanla organik oluşan bir şey değil mi?

Yeni bir yerde sosyal çevre kurmayı gerçekten "planlı" mı yaptınız, yoksa kendiliğinden mi oluştu?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-9",
    order: 9,
    name: "Önce Hangi Soruna Odaklanmalısın?",
    description:
      "Kullanıcının taşınma sürecindeki ana engelini (vize, dil, iş, konut, yalnızlık) hızlıca belirleyen çok kısa test. Önceliklendirme yapmak isteyenler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This is a visual for a CorteQS click-through decision tool. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish woman in her late twenties living abroad sits at a crowded table with housing, language, work and paperwork materials, using a laptop assessment to identify the first priority. One physical folder is pulled forward while the others remain stacked, making focus literal and real. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This is a visual for a CorteQS click-through decision tool. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a Turkish man in his early thirties living abroad rating current challenges on a tablet. The screen shows four photographic problem categories with no readable labels; the subject pauses on one while a partner listens. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎯 Her şeyi aynı anda çözmeye çalışınca hiçbiri çözülmüyor.

5 soruluk testimiz, taşınma sürecindeki EN büyük engelini belirliyor: vize mi, dil mi, iş mi, konut mu? Önce neye odaklanman gerektiğini öğren.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık kaygıları net bir önceliğe çeviriyor ve o konuda sana yardımcı olacak mentorlarla buluşturuyor. Önce doğru adım.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Önceliklendirme #Göç #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🎯 Her şeyi aynı anda çözmeye çalışınca hiçbiri çözülmüyor!

5 soruluk testimiz taşınma sürecindeki EN büyük engelini belirliyor: vize mi, dil mi, iş mi, konut mu? 🔍

👉 Ücretsiz kayıt ol, odağını bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Önceliklendirme #Göç #TürkDiasporası #YurtDışı #Gurbet #OdakBul #TaşınmaEngeli #YolHaritası #CorteQS`,
        redditPost: `Taşınma sürecindeki EN büyük engeli (vize/dil/iş/konut) bulan 5 soruluk bir test, tek bir engeli işaret etmek gerçekçi mi

CorteQS'te taşınırken kafanı en çok karıştıran şeyi belirleyip "önce buna odaklan" diyen kısa bir test var. Fikir güzel çünkü genelde insanlar her şeyi aynı anda çözmeye çalışıp hiçbirini bitiremiyor, ama gerçek hayatta vize/dil/iş/konut genelde birbirine bağlı sorunlar (vize olmadan iş, iş olmadan bazı vizeler olmuyor mesela).

Siz taşınırken gerçekten tek bir "ana engel" yaşadınız mı, yoksa hepsi iç içe mi geçti?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This is a visual for a CorteQS click-through decision tool. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish man in his early thirties living abroad meets a community advisor who helps sort urgent, important and later tasks using real folders and a blank whiteboard. All writing is out of focus, while the ordered table shows the problem becoming manageable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This is a visual for a CorteQS click-through decision tool. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish-origin couple planning their next move works directly on the selected first issue—making a housing call, revising a resume, practicing language or organizing registration documents—while the assessment result remains unreadable on the phone. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧩 Kafanda yüz tane soru var ama hangisi gerçekten acil?

Kısa testimizle en kritik engelini tespit et, enerjini doğru yere harca. Vize evrakı mı, iş arama mı, dil mi — odağını bul.

👉 Ücretsiz kayıt olun!
CorteQS, seni doğru kaynağa ve doğru kişiye yönlendiriyor; engelini aşmış biri zaten ağda seni bekliyor. Yalnız çözme.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaEngeli #Odak #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `🧩 Kafanda yüz tane soru var ama hangisi gerçekten acil?

Kısa testimizle en kritik engelini tespit et, enerjini doğru yere harca. Vize mi, iş mi, dil mi — odağını bul 💡

👉 Ücretsiz kayıt ol, hemen test et!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TaşınmaEngeli #Odak #Diaspora #TürkDiasporası #Gurbet #YurtDışı #DoğruKaynak #ÇözümZamanı #CorteQS`,
        redditPost: `"Kafanda yüz soru var ama hangisi acil" mantığıyla önceliklendirme yapan bir test, gerçekten enerji tasarrufu sağlıyor mu

CorteQS'in bu testi kısa bir anketle en kritik engelini (vize evrakı, iş arama, dil gibi) tespit edip enerjini oraya harcamanı öneriyor. Mantık olarak anlıyorum ama bazı insanlar için "hangisi acil" sorusunun cevabı zaten çok netken bazıları için hepsi eşit derecede kaygı verici olabiliyor.

Taşınma sürecinde önceliklerinizi nasıl belirlediniz — sezgisel mi gitti yoksa gerçekten sistematik bir sıralama mı yaptınız?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This is a visual for a CorteQS click-through decision tool. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: After resolving the first priority, a Turkish-origin couple planning their next move clears space on the table and opens the next folder calmly. The scene communicates momentum through changed behavior and environment rather than checkmark graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This is a visual for a CorteQS click-through decision tool. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a mid-career Turkish professional living in Europe leaves a successful appointment related to the chosen priority, holding a closed folder and calling a supportive contact. Relief is restrained and believable, showing why sequence matters. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🔦 En büyük engelini bil ki onu aşabilesin.

2 dakikalık testle taşınma sürecindeki bir numaralı zorluğunu belirliyoruz ve sana özel bir başlangıç önerisi sunuyoruz. Net hedef, hızlı çözüm.

👉 Ücretsiz kayıt olun!
CorteQS, her zorlukta yanında; aynı yolu yürümüş bir diaspora ağıyla çözüm hep yakında. Birlikte daha kolay aşarız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#EngelTesti #GöçPlanı #TürkDiasporası #Topluluk #CorteQS`,
        instagramPost: `🔦 En büyük engelini bil ki onu aşabilesin!

2 dakikalık testle taşınma sürecindeki bir numaralı zorluğunu belirliyoruz ve başlangıç önerisi sunuyoruz. Net hedef, hızlı çözüm 🎯

👉 Ücretsiz kayıt ol, hemen test et!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#EngelTesti #GöçPlanı #TürkDiasporası #Topluluk #Gurbet #YurtDışı #NetHedef #DiasporaAğı #CorteQS`,
        redditPost: `2 dakikalık testle "bir numaralı zorluğunu" belirleyip başlangıç önerisi veren bir araç var, bu tür kısa testler derinlemesine bir tavsiyeden daha mı işe yarıyor

CorteQS'in testi taşınma sürecindeki en büyük tek zorluğunu bulup ona özel bir başlangıç önerisi sunuyor. "Net hedef, hızlı çözüm" diye pazarlanıyor ama 2 dakikalık bir testin gerçekten kişiye özel bir tavsiye üretebileceğinden emin değilim, çoğu öneri muhtemelen genel geçer tavsiyeler oluyordur.

Böyle hızlı testlerden aldığınız önerinin gerçekten işinize yaradığı oldu mu, yoksa hep "zaten bildiğim şeyi söyledi" dediniz mi?

corteqs.net`,
      },
    ],
  },
  {
    id: "test-tool-10",
    order: 10,
    name: "Yurt Dışında İş Bulma Şansın?",
    description:
      "Becerilerine ve hedef pazara göre o ülkede iş bulma olasılığını tahmin eden motive edici araç. Garanti değil, gerçekçi bir yol haritası sunar.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This is a visual for a CorteQS click-through decision tool. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: a Turkish parent balancing family and career abroad completes an employability assessment on a laptop beside a resume, portfolio, language certificate turned away and a list of target companies with no readable names. The result shows several factors and an overall level without visible numbers. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This is a visual for a CorteQS click-through decision tool. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of a young Turkish graduate beginning an international career comparing current skills with real job requirements on a tablet. A few missing areas are highlighted through layout only, while the subject takes focused notes for improvement. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📈 Hedef ülkende iş bulma şansın gerçekte ne kadar?

Becerilerini, dilini ve sektör talebini girersek sana gerçekçi bir olasılık ve yol haritası çıkarıyoruz. Hayal değil, plan yap.

👉 Ücretsiz kayıt olun!
CorteQS, iş arama yolculuğunu hem veriyle hem ağla güçlendiriyor; hedef ülkede seni bekleyen profesyoneller var. Doğru bağlantı, doğru iş.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşBulma #Kariyer #TürkDiasporası #YurtDışıİş #CorteQS`,
        instagramPost: `📈 Hedef ülkende iş bulma şansın gerçekte ne kadar?

Becerilerini, dilini ve sektör talebini girersek gerçekçi bir olasılık ve yol haritası çıkarıyoruz. Hayal değil, plan yap 💪

👉 Ücretsiz kayıt ol, şansını öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İşBulma #Kariyer #TürkDiasporası #YurtDışıİş #Gurbet #İşArama #YolHaritası #KariyerFırsatı #CorteQS`,
        redditPost: `Beceri + dil + sektör talebine göre "iş bulma olasılığı" hesaplayan bir araç var, bu tür bir olasılık gerçekten anlamlı bir sayı mı üretebilir

CorteQS'te becerilerini, dilini ve sektör talebini girince hedef ülkede iş bulma ihtimalini ve bir yol haritası çıkaran bir araç var. "Garanti değil, gerçekçi bir yol haritası" diye açıkça belirtmişler ki bu dürüst bir yaklaşım, ama iş bulma o kadar çok değişkene (network, zamanlama, şans) bağlı ki bunu bir "olasılık" olarak sunmak bana biraz iddialı geliyor.

Yurt dışında iş ararken sizce beceri/dil seviyesi mi yoksa network/şans mı daha belirleyici oldu?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This is a visual for a CorteQS click-through decision tool. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a young Turkish graduate beginning an international career reviews the result with a diaspora recruiter who gives specific feedback on portfolio, language and local-market fit. Documents and screens remain unreadable, and the conversation feels direct rather than motivational. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This is a visual for a CorteQS click-through decision tool. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: a Turkish woman in her late twenties living abroad acts on the assessment by practicing an interview, revising a portfolio and contacting a professional connection in one believable coworking scene. Real effort replaces probability graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, storefront, shopping bag, and package. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💼 "Acaba beni işe alırlar mı?" sorusuna veriyle cevap ver.

İş Bulma Olasılığı Aracımız; yeteneklerini pazar talebiyle eşleştirip güçlü ve zayıf yönlerini gösteriyor. Eksiğini gör, şansını artır.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette iş ararken seni mentorlar ve referanslarla buluşturuyor. Şans değil, hazırlık ve ağ kazandırır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşArama #YurtDışıKariyer #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `💼 "Acaba beni işe alırlar mı?" sorusuna veriyle cevap ver!

Yeteneklerini pazar talebiyle eşleştirip güçlü ve zayıf yönlerini gösteriyoruz. Eksiğini gör, şansını artır 📊

👉 Ücretsiz kayıt ol, hemen dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İşArama #YurtDışıKariyer #Diaspora #TürkDiasporası #Gurbet #İşBulma #Mentorluk #KariyerHazırlığı #CorteQS`,
        redditPost: `"Acaba beni işe alırlar mı" sorusuna yeteneği pazar talebiyle eşleştirerek cevap veren bir araç, güçlü/zayıf yön analizi ne kadar isabetli olabilir

CorteQS'in aracı yeteneklerini hedef pazarın talebiyle karşılaştırıp nerede güçlü nerede zayıf olduğunu gösteriyor. "Şans değil, hazırlık ve ağ kazandırır" mesajı doğru geliyor ama bir aracın senin gerçek pazar değerini ne kadar isabetli tahmin edebileceğini merak ediyorum, bu genelde gerçek mülakatlarda ortaya çıkan bir şey değil mi?

İş ararken kendi güçlü/zayıf yönlerinizi önceden mi tahmin ettiniz yoksa mülakat sürecinde mi fark ettiniz?

corteqs.net`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This is a visual for a CorteQS click-through decision tool. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish woman in her late twenties living abroad enters a structured job interview in a modern office, prepared with a clean portfolio and calm posture. The phone containing the completed assessment is put away, showing transition from analysis to action. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This is a visual for a CorteQS click-through decision tool. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: a Turkish man in his early thirties living abroad receives a positive call after an interview while walking outside the office. No offer text or company branding appears; the quiet, relieved reaction communicates improved chances without guaranteeing an outcome. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, speech bubbles, sound waves, and open book. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🚪 İş bulmak şans değil, strateji.

Beceri-pazar uyumundan dil seviyene kadar değerlendirip o ülkede işe girme ihtimalini ve nasıl artıracağını söylüyoruz. Motive ol, harekete geç.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer hedefinde yalnız bırakmaz; her hedef ülkede sana kapı açacak bir diaspora ağı hazır. Birlikte daha şanslıyız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşOlasılığı #Kariyer #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🚪 İş bulmak şans değil, strateji!

Beceri-pazar uyumundan dil seviyene kadar değerlendirip işe girme ihtimalini ve nasıl artıracağını söylüyoruz. Motive ol, harekete geç 🔥

👉 Ücretsiz kayıt ol, stratejini kur!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İşOlasılığı #Kariyer #TürkDiasporası #YurtDışı #Gurbet #KariyerStratejisi #İşBulma #DiasporaAğı #CorteQS`,
        redditPost: `"İş bulmak şans değil, strateji" diyen bir araç var, beceri-pazar uyumu + dil seviyesine bakarak işe girme ihtimalini değerlendiriyor

CorteQS'in bu aracı beceri-pazar uyumundan dil seviyene kadar bakıp o ülkede işe girme ihtimalini ve bunu nasıl artıracağını söylüyor. "Şans değil strateji" iddiasına genelde katılırım ama yurt dışında iş ararken bazen gerçekten zamanlama/şans faktörü (bir pozisyonun tam o an açılması gibi) belirleyici oluyor.

Siz yurt dışında iş bulmayı daha çok "doğru strateji" sonucu mu gördünüz yoksa "doğru zamanda doğru yerde olmak" mı belirleyiciydi?

corteqs.net`,
      },
    ],
  },
];
