// /admin/social-share-vault "BURAK BURAYA BAK" sekmesi statik içerik kaynağı.
// 12 click-through test aracı; her araç 3 varyant (2 metinsiz ChatGPT görsel
// promptu + 1 hazır Türkçe LinkedIn postu + 1 hazır Türkçe Instagram postu +
// 1 hazır Türkçe Reddit postu). İçerik BU dosyadan düzenlenir. Metinler temiz
// UTF-8 Türkçe + gerçek tırnak + emoji — HTML-entity / mojibake KULLANILMAZ.
// İlk 10 aracın name/description/linkedinPost alanları social-test-tools.ts ile
// aynıdır (kasıtlı); imagePrompts ve instagramPost bu dosyaya özgü, bağımsız
// yazılmış içeriktir ve iki dosya arasında birebir eşleşmesi gerekmez.
// 11-12 Almanya finans araçlarıdır.

export type BurakShareVariant = {
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
};

export type BurakShareTool = {
  /** Benzersiz kimlik ("burak-tool-1" ... "burak-tool-12"). */
  id: string;
  /** Kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — slot_key ve DB takibi bunu kullanır. */
  globalId: string;
  /** Görünüm sırası (1..12). */
  order: number;
  /** Test aracı adı, ör. "Hangi Ülke Sana Uygun?". */
  name: string;
  /** Aracın kısa açıklaması (HTML .desc metni). */
  description: string;
  /** 3 metin varyantı (A/B/C kopya alternatifleri). */
  variants: BurakShareVariant[];
};

export const BURAK_SHARE_TOOLS: BurakShareTool[] = [
  {
    id: "burak-tool-1",
    globalId: "item-3",
    order: 1,
    name: "Hangi Ülke Sana Uygun?",
    description:
      "Kariyer, yaşam tarzı ve değerlerine göre taşınmak için sana en uygun ülkeyi bulan tıkla-geç test. Kararsız genç profesyoneller ve göçü düşünen aileler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person sits at a sunlit dining table comparing three clearly differentiated destination folders, a passport wallet and a laptop displaying side-by-side country result cards with all copy unreadable. The subject studies the options rather than posing, showing a real decision shaped by career, budget and lifestyle. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person completing a country-fit questionnaire on a tablet while a partner discusses priorities nearby. The screen uses image-based destination cards, sliders and checkmarks without readable labels; a calendar and savings notebook ground the choice in practical planning. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🌍 "Nereye taşınsam?" sorusu geceleri uykunu mu kaçırıyor?

5 dakikalık testimizi çöz; kariyerine, bütçene ve yaşam tarzına göre sana en uygun ülkeleri puanlayarak listeleyelim. Tahminle değil, verilerle karar ver.

👉 Ücretsiz kayıt olun!
CorteQS, göç yolculuğunu şansa bırakmıyor; seni doğru ülkeyle ve oradaki Türk topluluğuyla buluşturuyor. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Göç #TürkDiasporası #ÜlkeSeçimi #YurtDışı #CorteQS`,
        instagramPost: `🌍 "Nereye taşınsam ki?" diye gece gece düşünmeyi bırak artık 😅

5 dakikalık testimizle kariyerine, bütçene ve tarzına en uygun ülkeleri saniyeler içinde önümüze seriyoruz. Tahmin yok, tamamen sana özel sonuç var ✨🧳

👉 Ücretsiz kayıt ol, bio'daki linkten hemen çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Göç #TürkDiasporası #ÜlkeSeçimi #YurtDışı #Gurbet #YurtDışıHayat #TaşınmaPlanı #CorteQS #DünyadaTürkler #YeniBaşlangıç #GöçTesti`,
        redditPost: `"Nereye taşınmalıyım" diye bir test denedim, ne kadar güvenilir sizce?

Uzun zamandır ülke seçimi konusunda kararsızım — internette bulduğum çoğu liste "en iyi ülkeler" diye genel geçer sıralamalar veriyor, benim durumuma özel bir şey yok. CorteQS diye bir platformda kariyer/bütçe/yaşam tarzına göre birkaç soruyla ülke önerisi yapan bir test var.

Böyle testlerin gerçekten işe yaradığını düşünüyor musunuz, yoksa sonuçta karar hep aynı birkaç ülkeye mi çıkıyor (Almanya, Kanada, Hollanda vs.)? Deneyimi olan var mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person meets a migration mentor in a quiet cafe and compares living-cost receipts, climate photographs and work-market notes for several countries. All written information is blurred, while pointing hands and engaged expressions communicate a data-informed narrowing of options. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person walks through an international neighborhood after viewing a recommended destination on a phone. Local transit, housing and everyday street life appear naturally around them, making the test result feel connected to a believable future rather than tourism. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `✈️ Aynı maaş, üç farklı ülkede üç farklı hayat demek.

Hangi ülke senin için "mükemmel uyum"? CorteQS Ülke Seçimi Aracı; sağlık, güvenlik, dil ve iş piyasası gibi onlarca faktörü senin önceliklerinle eşleştiriyor.

👉 Ücretsiz kayıt olun!
CorteQS, dünyaya açılırken yalnız bırakmaz; testten çıkan her ülkede seni bekleyen bir diaspora ağı var. Güvenle keşfet, güvenle taşın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ÜlkeSeçimi #Diaspora #GöçPlanı #TürkDiasporası #CorteQS`,
        instagramPost: `✈️ Aynı maaş, üç farklı ülkede üç farklı hayat demek — hangisi senin hayatın olacak?

Sağlık, güvenlik, dil, iş piyasası... hepsini önceliklerine göre eşleştirip sana "mükemmel uyum" ülkeyi buluyoruz 🎯🌎

👉 Ücretsiz kayıt ol, bio'daki linkten dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ÜlkeSeçimi #Diaspora #GöçPlanı #TürkDiasporası #YurtDışı #Gurbet #KariyerPlanı #YurtDışındaYaşam #CorteQS #YeniÜlke #TaşınmaTesti`,
        redditPost: `Aynı maaşla farklı ülkelerde alım gücü ne kadar değişiyor gerçekten?

CorteQS'in bir aracı sağlık, güvenlik, dil ve iş piyasası gibi faktörleri karşılaştırıp "sana en uygun ülke" diye bir sonuç veriyor. Sayısal bir karşılaştırma iddiası var ama bu tür hesaplamaların ne kadar gerçekçi olduğunu merak ediyorum, çünkü yaşam maliyeti/vergi gibi kalemler ülkeden ülkeye çok farklı hesaplanabiliyor.

Birden fazla ülkede yaşamış olanlar: aynı maaşla gerçekten en büyük fark neyden kaynaklanıyor sizce, vergi mi, kira mı, yoksa başka bir şey mi?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person closes a laptop after receiving a clear top-country recommendation and begins packing a small planning box with documents, language materials and a city guide. The mood is calm and decision-ready, with no triumphant travel clichés. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Ülke Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool weighs career, budget, values and lifestyle to identify plausible countries for relocation. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At an airport observation window, an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviews the final recommended country on a phone while speaking with family. The interface remains unreadable; the subject's steady expression shows that multiple priorities have become one considered direction. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, home, and heart. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧭 Göç kararı duygusal değil, stratejik olmalı.

Bütçenden dil becerine, vize durumundan değerlerine kadar her şeyi hesaba katan testimizle sana en uygun 3 ülkeyi öğren. 5 soruda başla, detaylı modda derinleş.

👉 Ücretsiz kayıt olun!
CorteQS, en doğru kararı verebilmen için veriyi ve topluluğu bir araya getiriyor. Bir dizin değil, yaşayan bir rehber.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GöçKararı #ÜlkeTesti #TürkDiasporası #YurtDışıHayat #CorteQS`,
        instagramPost: `🧭 Göç kararı duygusal değil, stratejik olmalı diyoruz!

Bütçe, dil, vize, değerler... hepsini hesaba katan testle sana en uygun 3 ülkeyi çıkarıyoruz. 5 soruyla başla, istersen derinleş 📊✨

👉 Ücretsiz kayıt ol, bio'daki linke tıkla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#GöçKararı #ÜlkeTesti #TürkDiasporası #YurtDışıHayat #Gurbet #GöçPlanı #YeniHayat #YurtDışı #CorteQS #KararVer #TaşınmaZamanı`,
        redditPost: `Göç kararını "duygusal değil stratejik" vermeye çalışan bir test var, mantıklı bir yaklaşım mı?

CorteQS'te bütçe, dil becerisi, vize durumu ve kişisel değerleri hesaba katıp 5 soruluk kısa modda başlayıp istersen detaylı moda geçebildiğin bir ülke seçim testi var. Fikir olarak "5 dakikada kabaca bir yön, sonra derinleşme" mantığı hoşuma gitti.

Göç kararı verirken siz nasıl bir yöntem izlediniz — tablo mu yaptınız, birine mi danıştınız, yoksa böyle bir test/araç kullanan oldu mu? Gerçekten karar netleştiriyor mu yoksa sadece "hoş bir oyun" olarak mı kalıyor?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-2",
    globalId: "item-12",
    order: 2,
    name: "Mesleğin Dünyada Ne Kazandırıyor?",
    description:
      "Mesleğin ve deneyiminin farklı ülkelerde ne kadar kazandıracağını gösteren maaş karşılaştırma aracı. Alanının nerede daha çok değer gördüğünü merak eden Türk profesyoneller için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares compensation and purchasing power for the same profession across international markets. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person, a skilled professional, compares realistic salary and living-cost results on a laptop beside a calculator, rent statement and grocery receipts whose numbers are hidden. The image focuses on understanding purchasing power rather than piles of money. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares compensation and purchasing power for the same profession across international markets. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over the shoulder of an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviewing a world-salary tool on a tablet at a coworking desk. Several city photographs, role cards and proportional bars are visible but no labels or figures can be read; concentration and note-taking make the comparison believable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💰 Aynı işi yapıyorsun ama Berlin'de mi yoksa Toronto'da mı daha çok kazanırsın?

Mesleğini ve deneyimini gir; alanının farklı ülkelerde ne kadar kazandırdığını saniyeler içinde karşılaştır. Hayalini rakamlarla test et.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer kararlarını net verilerle aydınlatıyor ve seni o ülkelerdeki meslektaşlarınla buluşturuyor. Bilgi paylaşıldıkça büyür.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Maaş #Kariyer #TürkDiasporası #YurtDışıİş #CorteQS`,
        instagramPost: `💰 Aynı işi yapıyorsun ama Berlin'de mi yoksa Toronto'da mı daha çok kazanırsın, hiç merak ettin mi?

Mesleğini ve deneyimini gir, saniyeler içinde ülkeler arası maaş farkını gör. Hayal kurmayı bırak, rakamlarla test et 📊💸

👉 Ücretsiz kayıt ol, bio'daki linkten karşılaştır!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Maaş #Kariyer #TürkDiasporası #YurtDışıİş #MaaşKarşılaştırma #Gurbet #YurtDışı #KariyerPlanı #CorteQS #ParaKonuşuyor #İşFırsatı`,
        redditPost: `Aynı meslek farklı ülkelerde ne kadar maaş farkı yaratıyor, bu tür karşılaştırma araçlarına güveniyor musunuz?

CorteQS'te mesleğini ve deneyimini girip farklı ülkelerdeki maaş aralığını karşılaştırabildiğin bir araç var. Glassdoor/Levels.fyi gibi kaynaklar zaten var ama onlar genelde tek şirket/tek ülke odaklı, bu daha "hangi ülkeye gitsem" sorusuna cevap vermeye çalışıyor gibi.

Yurt dışında çalışanlar: sizce bu tür maaş karşılaştırma verileri gerçeği ne kadar yansıtıyor, yoksa ilan sitelerindeki abartılı rakamlardan mı besleniyor?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares compensation and purchasing power for the same profession across international markets. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person speaks with a diaspora professional in the same field who explains how compensation and expenses differ between two countries. Their laptops and blank-looking budget sheets are open on the table, turning salary data into lived experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares compensation and purchasing power for the same profession across international markets. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person stands in a real apartment kitchen in a potential destination, comparing rent, transport and net-income estimates on a phone with a local resident. The modest setting keeps the conversation about everyday quality of life. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, shared plate, aroma swirl, and blank recipe card. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📊 Yüksek maaş her zaman yüksek refah demek değil.

Maaş Karşılaştırma Aracımız, brüt rakamı değil yaşam maliyetine göre "cebinde kalanı" gösteriyor. Nerede paran gerçekten daha çok eder, öğren.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette kariyerini kurarken hem veriyle hem mentorlarla yanında. Doğru karar, doğru bilgiyle başlar.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YaşamMaliyeti #Maaş #Diaspora #Kariyer #CorteQS`,
        instagramPost: `📊 Yüksek maaş her zaman yüksek refah demek değil, biliyor muydun?

Brüt rakama değil yaşam maliyetine göre "cebinde gerçekten ne kalıyor" onu gösteriyoruz. Paran nerede daha çok eder, öğren 💡💶

👉 Ücretsiz kayıt ol, bio'daki linke tıkla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YaşamMaliyeti #Maaş #Diaspora #Kariyer #TürkDiasporası #Gurbet #YurtDışı #FinansalÖzgürlük #CorteQS #ParaYönetimi #AkıllıKarar`,
        redditPost: `Brüt maaş yerine "yaşam maliyetine göre cebinde kalan" hesaplayan bir araç gördüm, bu ölçüm gerçekten anlamlı mı?

CorteQS'in maaş karşılaştırma özelliği ham rakamı değil, yaşam maliyetine göre satın alma gücünü göstermeye çalışıyor. Yani "Almanya'da X kazanıyorsun ama Y ülkesinde daha az kazanıp daha rahat yaşayabilirsin" gibi bir mantık.

Bunu deneyimleyen var mı — kağıt üzerinde düşük görünen bir maaşın gerçekte daha "zengin" hissettirdiği bir ülkeye taşınan oldu mu? Merak ediyorum bu hesaplama gerçek hayatta ne kadar tutuyor.

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares compensation and purchasing power for the same profession across international markets. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: After reviewing the result, an approachable Turkish male creator in his early thirties, not based on any identifiable real person updates a career plan at a tidy desk, balancing a job offer folder, housing budget and savings goal. No monetary values are visible; the clear organization communicates a realistic next step. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Mesleğin Dünyada Ne Kazandırıyor?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares compensation and purchasing power for the same profession across international markets. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person leaves a job interview in a new city and checks a compensation comparison on the phone before responding. Real office architecture and restrained emotion convey informed confidence rather than instant wealth. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🚀 Mesleğin senin pasaportun. Peki dünya onu nasıl değerlendiriyor?

Yazılımcıdan hemşireye, mühendisten öğretmene — alanının küresel maaş haritasını çıkar. Birkaç soruyla başla, kararını güçlendir.

👉 Ücretsiz kayıt olun!
CorteQS, yeteneğinin karşılığını dünyada bulman için yol gösteriyor; her hedef ülkede seni bekleyen bir Türk ağı var. Yalnız değilsin.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#MaaşHaritası #YurtDışıKariyer #TürkDiasporası #İşHayatı #CorteQS`,
        instagramPost: `🚀 Mesleğin senin pasaportun! Peki dünya onu nasıl değerlendiriyor biliyor musun?

Yazılımcıdan hemşireye, mühendisten öğretmene — alanının küresel maaş haritasını birkaç soruyla çıkarıyoruz. Kararını güçlendir 🌍💼

👉 Ücretsiz kayıt ol, bio'daki linkten keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#MaaşHaritası #YurtDışıKariyer #TürkDiasporası #İşHayatı #Gurbet #YurtDışı #KariyerFırsatı #CorteQS #DünyadaTürkler #İşFırsatları`,
        redditPost: `Yazılımcı/hemşire/mühendis/öğretmen gibi meslekler için "küresel maaş haritası" çıkaran bir araç var, mesleğinizin dünyada gerçekten değer gördüğü yer neresi?

CorteQS'te birkaç soruyla mesleğinin farklı ülkelerdeki maaş seviyesini karşılaştırabiliyorsunuz. Bazı meslekler (yazılım gibi) bu tür karşılaştırmalarda hep öne çıkıyor ama merak ettiğim, daha "yerel" meslekler (öğretmenlik, hemşirelik gibi) için veri gerçekten anlamlı mı, yoksa örneklem çok mu küçük kalıyor?

Kendi mesleğinizde yurt dışında beklediğinizden çok farklı bir maaş/talep gören oldu mu?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-3",
    globalId: "item-21",
    order: 3,
    name: "Yurt Dışına Taşınmaya Hazır mısın?",
    description:
      'Finansal, duygusal ve lojistik açıdan taşınmaya hazır olup olmadığını ölçen kişisel hazırlık testi. "Gerçeklik kontrolü" isteyen, taşınmayı planlayanlar için.',
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person sits among half-packed moving boxes, checking relocation readiness on a laptop beside a passport wallet, language workbook, savings envelope and rental folder. The room is still lived-in, showing an honest preparation stage rather than a perfect departure scene. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person answering a move-readiness test on a tablet while a partner sorts documents at the same table. Progress indicators are visible but unreadable; the scene balances excitement with the practical gaps still to solve. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎒 Taşınmaya gerçekten hazır mısın, yoksa sadece hayalini mi kuruyorsun?

5 soruluk hazırlık testimiz; finansından dil becerine, destek ağından risk toleransına kadar seni dürüstçe puanlıyor. Cesur ol, gerçeği gör.

👉 Ücretsiz kayıt olun!
CorteQS, taşınma yolculuğunda sana ayna tutuyor ve eksiklerini kapatacak mentorlarla buluşturuyor. Hazırlıklı giden, güçlü gelir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaHazırlığı #Göç #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🎒 Taşınmaya gerçekten hazır mısın, yoksa sadece hayalini mi kuruyorsun? 👀

5 soruluk testimiz finansından dil becerine, destek ağından risk toleransına kadar seni dürüstçe puanlıyor. Cesur ol, gerçeği gör ✨

👉 Ücretsiz kayıt ol, bio'daki linkten çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TaşınmaHazırlığı #Göç #TürkDiasporası #YurtDışı #Gurbet #HazırMısın #YurtDışıHayat #GöçPlanı #CorteQS #YeniHayat #TaşınmaTesti`,
        redditPost: `Taşınmaya "gerçekten hazır mısın" diye dürüst bir test denedi mi kimse?

CorteQS'te finansal durum, dil becerisi, destek ağı ve risk toleransına göre puanlayan 5 soruluk bir hazırlık testi var. Amacı sanırım insanların "hazırım" duygusuyla "gerçekten hazır olmak" arasındaki farkı görmesi.

Taşınmadan önce kendini objektif değerlendirmek için böyle bir test/checklist kullanan var mı? Yoksa sonuçta herkes zaten "param yetmez, param yeter" gibi kabaca kendi kafasında biliyor mu, testin katkısı sınırlı mı kalıyor?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviews a detailed readiness checklist with an experienced diaspora mentor, physically separating complete documents from unresolved tasks. Written content is hidden, and the mentor's calm guidance keeps the moment constructive rather than alarming. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person practices a local-language conversation, checks a transit app and weighs a suitcase in one real apartment scene. The test result on a phone shows several readiness categories without legible copy, connecting assessment to concrete actions. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `⚖️ Cesaret yeterli mi? Bir de gerçeklik kontrolü yapalım.

Hazırlık Testimiz finansal birikiminden evrak durumuna kadar her şeyi ölçüp "Hazırsın" ya da "Biraz daha hazırlık" diyor. Skorunu öğren, planını yap.

👉 Ücretsiz kayıt olun!
CorteQS, hayalini sağlam temellere oturtman için hem rehberlik hem topluluk sunuyor. Doğru hazırlık, yarı yol demektir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GerçeklikKontrolü #TaşınmaTesti #Diaspora #GöçPlanı #CorteQS`,
        instagramPost: `⚖️ Cesaret yeterli mi? Bir de gerçeklik kontrolü yapalım bakalım 👀

Finansal birikiminden evrak durumuna kadar her şeyi ölçüyoruz, "Hazırsın" mı "Biraz daha hazırlık" mı gerekiyor öğren!

👉 Ücretsiz kayıt ol, bio'daki linkten skorunu gör!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#GerçeklikKontrolü #TaşınmaTesti #Diaspora #GöçPlanı #TürkDiasporası #Gurbet #YurtDışı #HazırlıkTesti #CorteQS #YeniBaşlangıç`,
        redditPost: `"Hazırsın" ya da "biraz daha hazırlık gerek" diye net bir sonuç veren bir gerçeklik-kontrolü testi, bu tür ikili sonuçlara güvenir misiniz?

CorteQS'in testi finansal birikim ve evrak durumu gibi kalemleri ölçüp net bir "hazır/değil" cevabı veriyor. Gerçek hayat genelde bu kadar siyah-beyaz olmuyor gibi geliyor bana — kimi eksikle de gidip sonradan hallediyor, kimi her şeyi tamamlayıp yine de zorlanıyor.

Siz taşınmadan önce kendinizi "hazır" hissettiniz mi, yoksa sonradan mı öyle oldunuz? Böyle bir testin sonucuna göre karar değiştirir miydiniz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person finishes the final preparation task and zips a suitcase beside neatly organized folders. The expression is grounded and calm, suggesting readiness earned through work rather than impulsive adventure. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışına Taşınmaya Hazır mısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool evaluates financial, logistical, language and emotional readiness for an international move. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At the departure gate, an approachable Turkish male creator in his early thirties, not based on any identifiable real person looks back once at family and then checks a phone containing a completed readiness plan. All interface text is unreadable; the photograph captures a prepared departure without melodrama. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧠 Taşınmanın en zor kısmı bavul değil, hazır olmak.

Finansal güvence, dil, destek ağı, uyum yeteneği... Hepsini tek testte değerlendir, hangi alanda güçlü hangi alanda eksik olduğunu gör.

👉 Ücretsiz kayıt olun!
CorteQS, her adımında yanında; eksik kaldığın yerde sana yol gösterecek bir diaspora ağı bir tık uzağında. Birlikte daha hazırız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaHazırlığı #YurtDışıHayat #TürkDiasporası #Göç #CorteQS`,
        instagramPost: `🧠 Taşınmanın en zor kısmı bavul değil, hazır olmak!

Finansal güvence, dil, destek ağı, uyum yeteneği... hepsini tek testte değerlendiriyoruz. Güçlü ve eksik yönlerini gör 💪

👉 Ücretsiz kayıt ol, bio'daki linkten başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TaşınmaHazırlığı #YurtDışıHayat #TürkDiasporası #Göç #Gurbet #YurtDışı #HazırMısın #GöçPlanı #CorteQS #YeniHayat`,
        redditPost: `Taşınmanın en zor kısmının "bavul hazırlamak değil, kendini hazırlamak" olduğuna katılıyor musunuz?

CorteQS'in bir testi finansal güvence, dil, destek ağı ve uyum yeteneğini tek seferde değerlendirip güçlü/zayıf yönlerini gösteriyor. Fikir mantıklı ama gerçek hayatta bu dört şeyden hangisi sizce en çok göz ardı ediliyor?

Bana kalırsa insanlar genelde parayı ve evrakı düşünüp "destek ağı" ve "duygusal hazırlık" kısmını çok geç fark ediyor. Sizin deneyiminiz neydi?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-4",
    globalId: "item-30",
    order: 4,
    name: "Hangi Şehir Sana Daha Uygun?",
    description:
      "Hedef ülke içinde tercihlerinle (iş fırsatları, yaşam tarzı, iklim, topluluk) en uyumlu şehirleri öneren araç. Ülkeyi bilen ama şehre karar veremeyenler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person compares three city neighborhoods on a large laptop using realistic street photographs, commute views and housing cards with no readable text. A bicycle helmet, transit card and coffee beside the computer reveal which daily-life factors matter. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over the shoulder of an approachable Turkish male creator in his early thirties, not based on any identifiable real person taking a city-fit test on a tablet while looking out over an ordinary urban street. The screen shows photo choices for density, nature, nightlife and family life without labels, linking preferences to real environments. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🏙️ Doğru ülkeyi seçtin ama hangi şehir tam sana göre?

Berlin mi Münih mi? İş fırsatından iklime, yaşam maliyetinden Türk topluluğunun büyüklüğüne kadar tercihlerini eşleştirip sana en uygun 3 şehri öğren.

👉 Ücretsiz kayıt olun!
CorteQS, sadece ülkeyi değil, doğru mahalleyi bulmana yardım ediyor ve o şehirdeki Türklerle seni buluşturuyor. Şehrin tanıdık olsun.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirSeçimi #Göç #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🏙️ Doğru ülkeyi seçtin, peki hangi şehir tam sana göre?

Berlin mi Münih mi? İş fırsatından iklime, yaşam maliyetinden Türk topluluğuna kadar eşleştirip sana en uygun 3 şehri buluyoruz 🗺️✨

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirSeçimi #Göç #TürkDiasporası #YurtDışı #Gurbet #ŞehirRehberi #YeniŞehir #CorteQS #YurtDışıHayat #TaşınmaPlanı`,
        redditPost: `Aynı ülke içinde şehir seçimi ülke seçiminden daha mı önemli sizce?

CorteQS'te ülkeyi biliyorsan iş fırsatı, iklim, yaşam maliyeti ve oradaki Türk topluluğunun büyüklüğüne göre şehir öneren bir araç var (örnek olarak Berlin/Münih karşılaştırması geçiyor). Bence bazen insanlar ülke araştırmasına o kadar çok zaman harcıyor ki şehir kısmını son ana bırakıyor.

Aynı ülke içinde yanlış şehri seçtiği için pişman olan ya da tam tersi "aslında büyük şehri değil küçük şehri seçmeliymişim" diyen var mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person discusses two shortlisted cities with residents on a video call. Their faces appear in distinct home settings and the shared screen shows unreadable neighborhood images; practical questions and note-taking replace skyline fantasy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person walks through a recommended neighborhood with a local CorteQS contact, observing transit, grocery shops, parks and housing rather than tourist landmarks. A phone with the city result remains visible but unreadable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📍 Ülke büyük, ama hayatın bir şehirde kuruluyor.

Şehir Eşleştirme Aracımız; kariyer hub'larından iklime, expat topluluğundan kira seviyesine kadar her detayı tartıp senin şehrini bulur. Birkaç soruyla başla.

👉 Ücretsiz kayıt olun!
CorteQS, gideceğin şehirde seni yalnız bırakmıyor; oradaki diaspora ağı ilk günden yanında. Yeni şehir, tanıdık bir aile.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirEşleştirme #Diaspora #YurtDışıHayat #TürkDiasporası #CorteQS`,
        instagramPost: `📍 Ülke büyük ama hayatın aslında bir şehirde kuruluyor!

Kariyer fırsatlarından iklime, expat topluluğundan kira seviyesine kadar tartıp senin şehrini buluyoruz. Birkaç soruyla başla ✨🏡

👉 Ücretsiz kayıt ol, bio'daki linkten dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirEşleştirme #Diaspora #YurtDışıHayat #TürkDiasporası #Gurbet #YeniŞehir #YurtDışı #CorteQS #ŞehirRehberi #TaşınmaTesti`,
        redditPost: `Kira seviyesini de hesaba katan bir şehir eşleştirme aracı denedim, kira verisi bu tür araçlarda ne kadar güncel olabilir?

CorteQS'in şehir eşleştirme özelliği kariyer hub'ları, iklim, expat topluluğu büyüklüğü ve kira seviyesini birlikte değerlendiriyor. Kira/yaşam maliyeti verisi çok hızlı değiştiği için bu tür araçların en zayıf halkası genelde bu oluyor bence.

Herhangi bir şehir öneri aracı kullanıp sonra gerçek kiraların tahminden çok farklı çıktığını gören oldu mu? Meraktan soruyorum, güvenilirlik ne kadar tutuyor.

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person sits in a cafe in the selected city, comparing the test result with the street outside and marking a housing shortlist. The mood is observant and realistic, showing fit through ordinary routines. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Hangi Şehir Sana Daha Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares cities through housing, commute, work, community and everyday lifestyle fit. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person receives apartment keys in a city that matches the chosen lifestyle, with a park, tram line or coworking space visible nearby. The outcome is modest and credible, not a luxury relocation fantasy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🗺️ İki şehir aynı ülkede ama iki ayrı dünya olabilir.

İş piyasası, şehir büyüklüğü, kültür, Türk topluluğu... Senin önceliklerine göre puanlayıp en uygun şehirleri haritada gösteriyoruz. Kararını kolaylaştır.

👉 Ücretsiz kayıt olun!
CorteQS, doğru şehirde doğru bağlantılarla başlaman için hazır; her şehirde yaşayan bir ağ seni bekliyor. Bir dizin değil, bir topluluk.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirRehberi #Göç #TürkDiasporası #YeniHayat #CorteQS`,
        instagramPost: `🗺️ İki şehir aynı ülkede ama iki ayrı dünya olabilir, biliyor muydun?

İş piyasası, büyüklük, kültür, Türk topluluğu... önceliklerine göre puanlayıp en uygun şehirleri haritada gösteriyoruz 📍✨

👉 Ücretsiz kayıt ol, bio'daki linkten kolaylaştır!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ŞehirRehberi #Göç #TürkDiasporası #YeniHayat #Gurbet #YurtDışı #ŞehirSeçimi #CorteQS #YurtDışıHayat #TaşınmaPlanı`,
        redditPost: `"Aynı ülkede iki şehir, iki ayrı dünya olabilir" diyen bir şehir karşılaştırma aracı var, siz de böyle bir şey yaşadınız mı?

CorteQS'in aracı iş piyasası, şehir büyüklüğü, kültür ve Türk topluluğu gibi kriterlere göre önceliklerini puanlayıp uygun şehirleri sıralıyor. Bence bu doğru bir gözlem — aynı ülkede büyük şehir ile küçük şehir tamamen farklı deneyimler olabiliyor.

Aynı ülke içinde şehir değiştirip hayatının bambaşka bir hal aldığını yaşayan var mı? Hangi kriter sizin için en belirleyici oldu — iş mi, topluluk mu, yoksa başka bir şey mi?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-5",
    globalId: "item-39",
    order: 5,
    name: "Diaspora Ağı Eşleştirme",
    description:
      "Diaspora üyelerini tamamlayıcı ihtiyaç ve uzmanlıklara göre eşleştiren akıllı eşleştirici. Mentor/iş fırsatı arayan yeni gelenler ve yardım etmek isteyen deneyimliler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person enters a specific need into a laptop and reviews several relevant diaspora profiles with portraits, cities and skill cards, all text unreadable. One result is visually selected while the subject leans closer in recognition. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person accepting a suggested community match on a phone. The screen shows two profile portraits and shared-interest cues without labels, while a notebook records nothing legible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, profile badge, camera, and open book. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🤝 Gurbette en kıymetli şey: senden önce o yoldan geçmiş biri.

Diaspora Ağı Eşleştirici; mesleğine, şehrine ve ihtiyacına göre sana en uygun mentoru, iş bağlantısını ya da yol arkadaşını buluyor. Doğru kişi, bir tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık diasporayı akıllı eşleştirmeyle bir araya getiriyor; aradığın insan da seni arıyor olabilir. Birlikte daha güçlüyüz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Networking #Mentorluk #TürkDiasporası #Eşleşme #CorteQS`,
        instagramPost: `🤝 Gurbette en kıymetli şey: senden önce o yoldan geçmiş biri!

Diaspora Ağı Eşleştirici mesleğine, şehrine ve ihtiyacına göre sana en uygun mentoru veya iş bağlantısını buluyor. Doğru kişi bir tık uzağında 🔥

👉 Ücretsiz kayıt ol, bio'daki linkten bul!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Networking #Mentorluk #TürkDiasporası #Eşleşme #Gurbet #YurtDışı #Diaspora #CorteQS #BirlikteGüçlüyüz #TürkleriBul`,
        redditPost: `Mentor/iş bağlantısı bulmak için "eşleştirme" mantığıyla çalışan bir diaspora ağı, klasik Facebook grubundan gerçekten daha mı iyi?

CorteQS'te meslek, şehir ve ihtiyacına göre sana mentor ya da iş bağlantısı önerdiğini iddia eden bir özellik var. Genelde bu iş Facebook gruplarında "kimse yardımcı olabilir mi" diye atılan bir mesajla hallediliyor, merak ettiğim algoritmik eşleştirmenin buna göre gerçek bir avantajı var mı yoksa sonuçta yine kim müsaitse o mu cevap veriyor?

Mentor bulma konusunda hangi yöntem sizde işe yaradı — organik mi, yoksa böyle bir eşleştirme aracı mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person joins a first video call with a matched mentor or collaborator. Both people appear in realistic workspaces and discuss a concrete document or prototype, demonstrating relevance through the conversation itself. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, speech bubbles, calendar, and event pin. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person meets the matched contact at a cafe and immediately opens a shared project on a tablet. Their natural rapport and purposeful discussion make the network match tangible, with no glowing connection lines. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🌐 Tanıdık bir tanıdık beklemek devri bitti.

Ne sunduğunu ve ne aradığını yaz; alan, şehir ve dil uyumuna göre sana en uygun diaspora bağlantılarını puanlayarak getirelim. Saatlerce arama yok, akıllı eşleşme var.

👉 Ücretsiz kayıt olun!
CorteQS, kökenini paylaşan milyonları görünür kılan güven ağı. Yardım istemek de vermek de artık çok kolay.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#DiasporaAğı #Mentorluk #TürkDiasporası #Topluluk #CorteQS`,
        instagramPost: `🌐 Tanıdık bir tanıdık beklemek devri kapandı artık!

Ne sunduğunu ve ne aradığını yaz, alan/şehir/dil uyumuna göre en uygun bağlantıları getirelim. Saatlerce arama yok, akıllı eşleşme var ⚡

👉 Ücretsiz kayıt ol, bio'daki linkten dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#DiasporaAğı #Mentorluk #TürkDiasporası #Topluluk #Networking #Gurbet #YurtDışı #CorteQS #BağlantıKur #Yardımlaşma`,
        redditPost: `"Tanıdık bir tanıdık" beklemeden diaspora ağında doğrudan eşleşme kurmaya çalışan bir sistem, gerçekten arama süresini kısaltıyor mu?

CorteQS'te ne sunduğunu ve ne aradığını yazınca alan/şehir/dil uyumuna göre bağlantı öneren bir özellik var. Fikir, "saatlerce profil karıştırma" yerine doğrudan eşleşme sunmak.

Yurt dışında yaşayanlara soruyorum: network kurarken en çok zaman kaybettiğiniz kısım neresiydi — doğru kişiyi bulmak mı, yoksa bulduktan sonra güven inşa etmek mi? Çünkü bence araç ilk kısmı çözse bile ikincisi hâlâ zaman alıyor.

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person attends a small meetup introduced by the matched contact and is welcomed into an existing circle. The phone profile remains in hand but the real relationships now dominate the frame. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: profile badge, camera, open book, activity symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Diaspora Ağı Eşleştirme”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool matches a concrete need with relevant people in the Turkish diaspora using location, profession and intent. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person and the matched professional complete a useful first outcome—reviewing a resume, planning a supplier call or solving a local question—at a real table with believable materials and no readable private data. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💡 Sen birine yardım edebilir, biri de sana yol gösterebilir.

Diaspora Eşleştirici, ihtiyaçları ve yetenekleri eşleştiren bir köprü. Yeni gelensen mentor bul, deneyimliysen birine ışık ol.

👉 Ücretsiz kayıt olun!
CorteQS, dayanışmayı bir değer değil bir refleks haline getiriyor; her eşleşme yeni bir kapı. Nerede olursan ol, yanında biri var.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #Networking #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `💡 Sen birine yardım edebilirsin, biri de sana yol gösterebilir!

Diaspora Eşleştirici ihtiyaçları ve yetenekleri buluşturan bir köprü. Yeni gelensen mentor bul, deneyimliysen birine ışık ol ✨🤍

👉 Ücretsiz kayıt ol, bio'daki linkten katıl!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Dayanışma #Networking #Diaspora #TürkDiasporası #Mentorluk #Gurbet #YurtDışı #CorteQS #BirlikteGüçlüyüz #YardımlaşmaAğı`,
        redditPost: `Deneyimli diaspora üyelerini yeni gelenlerle eşleştiren bir sistem var, siz bu tür "gönüllü mentorluk" ağlarına katılır mıydınız?

CorteQS'in bir özelliği ihtiyaçları ve yetenekleri eşleştirip "yeni gelensen mentor bul, deneyimliysen birine yol göster" mantığıyla çalışıyor. Sanırım amaç dayanışmayı organik bir şekilde değil sistematik bir şekilde yürütmek.

Deneyimli olanlara soruyorum: karşılıksız mentorluk yapmaya gerçekten vaktiniz oluyor mu, yoksa iyi niyetle başlayıp sonra sürdürülemez mi hale geliyor? Bu tür platformlarda "veren taraf" genelde tükenmiyor mu?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-6",
    globalId: "item-48",
    order: 6,
    name: "Yurt Dışında Hangi Kariyer Sana Uygun?",
    description:
      "İlgi alanların ve becerilerine göre yurt dışındaki kariyer seçeneklerini öneren test. Yön arayan öğrenciler ve profesyoneller için (eğitim mi, teknoloji mi, girişimcilik mi).",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool translates skills, experience and preferences into realistic international career directions. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviews a career-fit assessment on a laptop beside a portfolio, certificates turned face-down and objects from several possible roles. The selected path is indicated through one realistic workplace photograph, not a symbolic icon. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool translates skills, experience and preferences into realistic international career directions. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over the shoulder of an approachable Turkish male creator in his early thirties, not based on any identifiable real person answering scenario-based career questions on a tablet in a coworking space. Photo choices show teamwork, technical work, client service and creative practice without readable labels; the subject considers each carefully. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎓 Yüksek lisans mı, teknoloji işi mi, kendi girişimin mi?

Kariyer Yolu Testimiz; ilgi alanlarını ve becerilerini analiz edip yurt dışında sana en uygun yolu öneriyor. Yönünü bul, adımını at.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer yolculuğunda hem rehber hem ağ; testten çıkan her yolda sana eşlik edecek mentorlar var. Geleceğin bugünden başlasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kariyer #YurtDışıEğitim #TürkDiasporası #YolHaritası #CorteQS`,
        instagramPost: `🎓 Yüksek lisans mı, teknoloji işi mi, kendi girişimin mi? Karar zamanı!

Kariyer Yolu Testimiz ilgi alanlarını ve becerilerini analiz edip yurt dışında sana en uygun yolu öneriyor. Yönünü bul, adımını at 🧭

👉 Ücretsiz kayıt ol, bio'daki linkten keşfet!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Kariyer #YurtDışıEğitim #TürkDiasporası #YolHaritası #Gurbet #YurtDışı #KariyerTesti #CorteQS #GeleceğiniPlanla #Mentorluk`,
        redditPost: `Yüksek lisans / teknoloji işi / girişim arasında kalanlar için bir "kariyer yolu" testi var, böyle testlere ne kadar güveniyorsunuz?

CorteQS'in testi ilgi alanları ve becerileri analiz edip yurt dışı için bir kariyer yönü öneriyor. Bu tür kişilik/kariyer testlerinin genelde biraz "herkes için geçerli" tavsiyeler verdiğini düşünüyorum ama merak ediyorum somut bir yön belirlemede işe yarayan oldu mu.

Yurt dışında kariyer değiştiren ya da yön belirlerken zorlananlar: siz nasıl karar verdiniz, test mi kullandınız yoksa deneme-yanılma mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool translates skills, experience and preferences into realistic international career directions. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person meets a diaspora career mentor who compares current skills with two realistic role paths using portfolios and job examples. All text is blurred, while the mentor's specific pointing and the subject's notes show practical translation of experience. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool translates skills, experience and preferences into realistic international career directions. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person spends a day shadowing a recommended profession in a real workplace, observing tasks rather than posing. A phone with the career result is briefly visible with no readable interface. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧭 Yetenekli olmak yetmez; doğru yöne gitmek gerekir.

İlgi alanların, çalışma stilin ve risk toleransın hangi kariyere işaret ediyor? Birkaç soruyla yurt dışındaki en uygun rotanı keşfet.

👉 Ücretsiz kayıt olun!
CorteQS, hedefine giden yolda seni başarılı diaspora profesyonelleriyle buluşturuyor. İlham ve fırsat, tek ağda.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KariyerTesti #YurtDışıKariyer #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `🧭 Yetenekli olmak yetmez, doğru yöne gitmek gerekir!

İlgi alanların, çalışma stilin, risk toleransın hangi kariyere işaret ediyor? Birkaç soruyla yurt dışındaki en uygun rotanı keşfet 🔥

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KariyerTesti #YurtDışıKariyer #Diaspora #TürkDiasporası #Gurbet #YurtDışı #YolHaritası #CorteQS #KariyerFırsatları #Mentorluk`,
        redditPost: `"Yetenekli olmak yetmez, doğru yöne gitmek gerekir" diyen bir kariyer testi denedim, risk toleransını da hesaba katan yaklaşımı nasıl buluyorsunuz?

CorteQS'in aracı ilgi alanları, çalışma stili ve risk toleransına göre yurt dışında bir kariyer rotası öneriyor. Risk toleransını dahil etmesi ilginç geldi çünkü çoğu kariyer testi sadece beceri/ilgiye bakıyor, "ne kadar risk alabilirsin" sorusunu atlıyor.

Kendi risk toleransınızı doğru tahmin ettiniz mi yoksa sonradan "meğer sandığımdan daha temkinliymişim/cesurmuşum" mu dediniz? Kariyer kararında bu ne kadar belirleyici oldu?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool translates skills, experience and preferences into realistic international career directions. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person updates a portfolio and learning plan after choosing a direction, arranging a course schedule, project samples and interview clothing. The scene communicates focused transition rather than instant reinvention. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında Hangi Kariyer Sana Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool translates skills, experience and preferences into realistic international career directions. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person begins the first day in the recommended field, receiving an orientation from a colleague in a believable workplace. Quiet confidence and real tools communicate an attainable outcome. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🚀 Akademi mi, sektör mü, girişim mi? Karar senin, rehber bizden.

Kariyer Yolu Aracı, becerilerini ve hedeflerini eşleştirip sana özel bir yön öneriyor. Belirsizlikte kaybolma; net bir rotayla ilerle.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette kariyerini kurarken yalnız bırakmaz; her alanda sana yol gösterecek bir topluluk hazır. Birlikte daha yükseğe.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KariyerYolu #YurtDışıHayat #TürkDiasporası #Mentorluk #CorteQS`,
        instagramPost: `🚀 Akademi mi, sektör mü, girişim mi? Karar senin, rehber bizden!

Kariyer Yolu Aracı becerilerini ve hedeflerini eşleştirip sana özel bir yön öneriyor. Belirsizlikte kaybolma, net rotayla ilerle 🌟

👉 Ücretsiz kayıt ol, bio'daki linkten dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KariyerYolu #YurtDışıHayat #TürkDiasporası #Mentorluk #Gurbet #YurtDışı #KariyerPlanı #CorteQS #GeleceğiniPlanla #YenidenBaşla`,
        redditPost: `Akademi, sektör ya da girişim arasında kararsız kalanlar için beceri/hedef eşleştiren bir araç, sizce bu üçü arasında seçim yapmak neye bağlı olmalı?

CorteQS'in aracı becerilerini ve hedeflerini eşleştirip bu üç yoldan birine yönlendiriyor. Benim gözlemim, bu kararı çoğu zaman risk toleransı ve para durumu belirliyor, "yetenek" ikinci planda kalıyor.

Akademiye devam mı ettiniz, sektöre mi geçtiniz, yoksa girişim mi kurdunuz — ve şimdi geriye dönüp baksanız aynı kararı verir miydiniz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-7",
    globalId: "item-53",
    order: 7,
    name: "Yurt Dışı Yaşam Tarzın Ne?",
    description:
      "Kullanıcıları eğlenceli kişilik tiplerine ayıran (Küresel Networker, Sakin Yerli, Macera Avcısı gibi) keyifli kişilik testi. Etkileşim ve paylaşım için ideal.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person completes a lifestyle assessment at home while real cues of daily priorities surround them: bicycle, family calendar, remote-work desk, cooking ingredients and hiking shoes. The tablet shows photographic choices with no readable labels. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person selecting between urban, family-oriented, nature-focused and mobile work scenarios on a laptop. Each option is a realistic photo tile rather than an icon, and the subject's home context reveals genuine trade-offs. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `✨ Sen bir "Küresel Networker" mısın yoksa "Sakin Yerli" mi?

Eğlenceli 8 soruluk testimizle yurt dışı yaşam tarzı kişiliğini keşfet. Sonucu arkadaşlarınla paylaş, kim olduğunu gör. Hadi başla!

👉 Ücretsiz kayıt olun!
CorteQS, kişiliğine uyan diaspora kabilesini bulmana yardım ediyor; benzer ruhlar bir tık uzağında. Eğlen, bağlan, ait ol.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KişilikTesti #YurtDışıYaşam #TürkDiasporası #Eğlence #CorteQS`,
        instagramPost: `✨ Sen bir "Küresel Networker" mısın yoksa "Sakin Yerli" mi? 👀

Eğlenceli 8 soruluk testle yurt dışı yaşam tarzı kişiliğini keşfet, sonucu story'ne ekle, arkadaşların da çözsün! 🎉

👉 Ücretsiz kayıt ol, bio'daki linkten hemen çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#KişilikTesti #YurtDışıYaşam #TürkDiasporası #Eğlence #Gurbet #YurtDışı #ExpatKişilik #CorteQS #TestZamanı #Paylaş`,
        redditPost: `"Küresel Networker" mi "Sakin Yerli" mi diye bir expat kişilik testi denedim, sonuç kendinizi ne kadar yansıttı?

CorteQS'te 8 soruluk eğlenceli bir test var, gurbetteki yaşam tarzına göre seni bir kişilik tipine oturtuyor. Ciddi bir karar aracı değil, daha çok BuzzFeed tarzı bir şey ama merak ettim gerçekten "kendini gördüğünü" hissedenler oldu mu yoksa herkes aynı 2-3 sonuçtan birine mi çıkıyor?

Yurt dışında yaşayanlar, siz kendinizi hangi tipe yakın buluyorsunuz — sosyal kelebek mi, sakin/içine kapanık mı, yoksa hepsi karışık mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person discusses the result with a partner or friend, comparing a busy central apartment, quiet suburb and smaller nature-rich city through photographs and budget notes. Written details are blurred; the conversation feels honest. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person spends a weekend testing the recommended lifestyle in a real neighborhood—using transit, working from a cafe, shopping locally or visiting a park. The image emphasizes ordinary routines over sightseeing. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: coffee cup, conversation bubbles, round table symbol, aroma swirl, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎭 Gurbetteki tarzın seni ele veriyor.

Gece hayatı mı sakin kafeler mi? Solo gezi mi tur mu? Cevapların hangi expat kişiliğine uyuyor, öğren ve rozetini kap. 2 dakikalık keyifli test.

👉 Ücretsiz kayıt olun!
CorteQS, seni sana benzeyen insanlarla buluşturan sıcak bir topluluk. Tarzın ne olursa olsun, yerin burada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ExpatKişilik #YaşamTarzı #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `🎭 Gurbetteki tarzın seni ele veriyor, farkında mısın?

Gece hayatı mı sakin kafeler mi? Solo gezi mi tur mu? 2 dakikalık keyifli testle expat kişiliğini öğren, rozetini kap 🏆

👉 Ücretsiz kayıt ol, bio'daki linkten çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#ExpatKişilik #YaşamTarzı #Diaspora #TürkDiasporası #Gurbet #YurtDışı #KişilikTesti #CorteQS #Eğlence #Paylaş`,
        redditPost: `Gece hayatı/sakin kafe, solo gezi/tur gibi sorularla expat kişilik tipi çıkaran bir test var, sizin gurbet tarzınız hangisine yakın?

CorteQS'in testi bu tür tercihlere bakıp bir "expat kişiliği" rozeti veriyor. Ciddiye almadan eğlence olarak bakılacak bir şey ama ilginç olan şu: gurbette yaşam tarzı gerçekten memlekettekinden çok farklılaşıyor mu, yoksa insan nereye giderse gitsin aynı alışkanlıkları mı sürdürüyor?

Siz taşındıktan sonra sosyal hayatınız/tarzınız değişti mi, yoksa hep aynı kaldı mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person reorganizes the home and weekly schedule to fit the chosen lifestyle, creating a practical balance between work, community and personal time. The result screen remains visible but unreadable on a phone. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışı Yaşam Tarzın Ne?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool identifies the type of life abroad that best fits work habits, family needs, pace and personal priorities. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person enjoys an unforced daily moment that matches the result—cycling to work, sharing a family meal or working remotely near nature—photographed as real life rather than an aspirational travel ad. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, shared plate, aroma swirl, and blank recipe card. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🌟 Aynı şehirde yaşayıp bambaşka hayatlar kurarız. Seninki hangisi?

Macera Avcısı, Kozmopolit Networker, Huzurlu Yerli... Hangi tip sana uyuyor? Eğlenceli testle öğren, sonucu story'ne taşı.

👉 Ücretsiz kayıt olun!
CorteQS, kişiliğine en uygun toplulukları önererek gurbeti eğlenceli kılıyor. Kendini bul, çevreni kur.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YaşamTarzıTesti #YurtDışı #TürkDiasporası #Topluluk #CorteQS`,
        instagramPost: `🌟 Aynı şehirde yaşayıp bambaşka hayatlar kurarız, seninki hangisi?

Macera Avcısı, Kozmopolit Networker, Huzurlu Yerli... hangi tip sana uyuyor? Eğlenceli testle öğren, story'ne taşı 🎊

👉 Ücretsiz kayıt ol, bio'daki linkten çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YaşamTarzıTesti #YurtDışı #TürkDiasporası #Topluluk #Gurbet #ExpatHayatı #CorteQS #KişilikTesti #Eğlence #Paylaş`,
        redditPost: `"Aynı şehirde yaşayıp bambaşka hayatlar kurarız" fikrine dayanan bir yaşam tarzı testi var — Macera Avcısı, Kozmopolit Networker, Huzurlu Yerli gibi tipler çıkarıyor.

CorteQS'te bu testi denedim (aslında henüz denemedim ama merak ettim), aynı şehirde yaşayan insanların gerçekten bu kadar farklı deneyimler yaşadığını düşünüyor musunuz? Bence en büyük fark dil/topluluk bağlantısından geliyor — bazıları hep kendi diasporasıyla takılıyor, bazıları hiç.

Siz kendinizi bu üç tipten hangisine (ya da farklı bir tipe) yakın buluyorsunuz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-8",
    globalId: "item-62",
    order: 8,
    name: "İlk 90 Gün Planlayıcı",
    description:
      "Yeni gelenler için görev ve ipuçlarından oluşan kişisel kontrol listesi üreten interaktif planlayıcı. İlk haftalarını organize etmek isteyenler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person builds a first-90-days plan at a real apartment table with a wall calendar, city registration folder, bank appointment card, language materials and housing notes. The laptop organizes phases and tasks with no readable copy. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: small globe, route line, bridge arc, city skyline, location pin, briefcase, and upward path. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person moving tasks across a digital 90-day planner on a tablet while unpacked boxes remain in the room. Progress bars and calendar blocks are visible but unreadable, making the planning process tangible. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🗓️ Yeni ülkede ilk 90 gün her şeyi belirler. Hazır mısın?

İlk 90 Gün Planlayıcı; konaklamadan banka hesabına, sigortadan dil kursuna kadar sana özel bir görev listesi çıkarıyor. Kaosa değil, plana başla.

👉 Ücretsiz kayıt olun!
CorteQS, yeni hayatının ilk adımlarını düzene sokuyor ve her görevde sana yol gösterecek bir topluluk sunuyor. Sıfırdan değil, destekle başla.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #Planlama #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🗓️ Yeni ülkede ilk 90 gün her şeyi belirler, hazır mısın?

Konaklamadan banka hesabına, sigortadan dil kursuna kadar sana özel görev listesi çıkarıyoruz. Kaosa değil, plana başla 📋

👉 Ücretsiz kayıt ol, bio'daki linkten planını al!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YeniGelenler #Planlama #TürkDiasporası #YurtDışı #Gurbet #İlk90Gün #YerleşmeRehberi #CorteQS #YeniHayat #Göç`,
        redditPost: `Yeni gittiğiniz ülkede ilk 90 günde gerçekten neyi önce halletmek gerekiyor, bir planlayıcı aracı bunu doğru sıralayabilir mi?

CorteQS'te konaklama, banka hesabı, sigorta ve dil kursu gibi işleri kişiye özel bir kontrol listesine dönüştüren bir "ilk 90 gün planlayıcı" var. Fikir güzel ama her ülkenin bürokrasi sırası farklı olduğu için (bazı yerlerde önce ikamet, bazı yerlerde önce banka hesabı şart) genel bir araç bunu ne kadar doğru yakalayabilir bilmiyorum.

Yeni geldiğinizde ilk 90 günde en çok neyi geç fark ettiniz, "keşke önce bunu yapsaymışım" dediğiniz bir şey oldu mu?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviews the first-month priorities with an experienced local mentor, checking appointments and dependencies against real documents. Personal details are hidden and all text blurred; their focused exchange communicates sequence and support. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person completes several early tasks in one realistic morning: transit card, registration folder and first grocery setup on the kitchen counter. The planner on the phone shows completed blocks without legible labels. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: shared plate, aroma swirl, blank recipe card, helping hands, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `✅ "Önce neyi halletmeliyim?" panikleme, listele.

Birkaç soruyla yanıtla; sana hafta hafta önceliklendirilmiş bir yerleşme planı sunalım. İlk hafta, ilk ay, ilk üç ay — hepsi net.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette ilk adımlarını atarken elinden tutuyor; deneyimli komşuların tecrübesi bir tık uzağında. Yalnız uğraşma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YerleşmePlanı #YeniGelenler #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `✅ "Önce neyi halletmeliyim?" diye panikleme, listele!

Birkaç soruyla hafta hafta önceliklendirilmiş yerleşme planını çıkarıyoruz. İlk hafta, ilk ay, ilk üç ay — hepsi net ✨

👉 Ücretsiz kayıt ol, bio'daki linkten planını al!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YerleşmePlanı #YeniGelenler #Diaspora #TürkDiasporası #Gurbet #YurtDışı #İlk90Gün #CorteQS #YeniHayat #KontrolListesi`,
        redditPost: `Hafta hafta önceliklendirilmiş bir yerleşme planı sunan bir araç var (ilk hafta / ilk ay / ilk 3 ay diye bölüyor), böyle bir zaman çizelgesi mantığı işinize yarar mıydı?

CorteQS'in aracı birkaç soruyla kişisel bir yerleşme planı çıkarıyor. "Önce neyi halletmeliyim" panik anını haftalık bir çerçeveye oturtma fikri mantıklı geliyor, ama gerçek hayatta işler genelde plan gibi ilerlemiyor (randevu gecikmesi, evrak eksikliği vb.).

Siz taşındığınızda böyle bir zaman çizelgesi takip ettiniz mi, yoksa her şey zaten kendiliğinden karman çorman mı ilerledi?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At roughly day sixty, an approachable Turkish male creator in his early thirties, not based on any identifiable real person works from a settled desk with fewer boxes and a clearer routine, checking the next phase of the plan. The environment visibly shows progress without artificial before-and-after graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, compass, balanced scale, and forking paths. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “İlk 90 Gün Planlayıcı”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool organizes the first ninety days abroad into sequenced, practical actions for settling in. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: At the end of the first ninety days, an approachable Turkish male creator in his early thirties, not based on any identifiable real person hosts two new local friends in the now-lived-in apartment while the completed planner rests on a closed laptop. The outcome is stability and connection, not perfection. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📋 Yeni bir ülke, yüzlerce yapılacak iş. Nereden başlanır?

İlk 90 Gün Planlayıcı, durumuna göre kişisel bir kontrol listesi üretiyor — ikamet kaydından okula, sağlıktan sosyal çevreye. Adım adım, stressiz.

👉 Ücretsiz kayıt olun!
CorteQS, yeni başlangıcını kolaylaştırıyor; her görevde sana destek olacak bir diaspora ağı hazır. Birlikte daha kolay.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İlk90Gün #YerleşmeRehberi #TürkDiasporası #Göç #CorteQS`,
        instagramPost: `📋 Yeni bir ülke, yüzlerce yapılacak iş... nereden başlanır?

İlk 90 Gün Planlayıcı ikamet kaydından okula, sağlıktan sosyal çevreye kişisel kontrol listesi üretiyor. Adım adım, stressiz 🌱

👉 Ücretsiz kayıt ol, bio'daki linkten planını al!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İlk90Gün #YerleşmeRehberi #TürkDiasporası #Göç #Gurbet #YurtDışı #YeniHayat #CorteQS #YeniGelenler #PlanYap`,
        redditPost: `İkamet kaydından okula, sağlıktan sosyal çevreye kadar kişisel bir kontrol listesi üreten bir "ilk 90 gün" aracı gördüm, sizce bu tür listeler ülkeye özgü detayları yeterince yakalayabilir mi?

CorteQS'in planlayıcısı durumuna göre (aile mi tek mi, çalışan mı öğrenci mi gibi) bir kontrol listesi çıkarıyor. Genel bir kontrol listesinin faydalı olduğuna inanıyorum ama her ülkenin/şehrin kendine özgü tuzakları var (randevu sistemi, adres kaydı sırası vb.), bunları bir genel araç ne kadar yakalar bilmiyorum.

Yeni yerleştiğiniz yerde kontrol listesinde hiç yer almayan ama sizi çok uğraştıran bir iş oldu mu?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-9",
    globalId: "item-71",
    order: 9,
    name: "Önce Hangi Soruna Odaklanmalısın?",
    description:
      "Kullanıcının taşınma sürecindeki ana engelini (vize, dil, iş, konut, yalnızlık) hızlıca belirleyen çok kısa test. Önceliklendirme yapmak isteyenler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person sits at a crowded table with housing, language, work and paperwork materials, using a laptop assessment to identify the first priority. One physical folder is pulled forward while the others remain stacked, making focus literal and real. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person rating current challenges on a tablet. The screen shows four photographic problem categories with no readable labels; the subject pauses on one while a partner listens. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🎯 Her şeyi aynı anda çözmeye çalışınca hiçbiri çözülmüyor.

5 soruluk testimiz, taşınma sürecindeki EN büyük engelini belirliyor: vize mi, dil mi, iş mi, konut mu? Önce neye odaklanman gerektiğini öğren.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık kaygıları net bir önceliğe çeviriyor ve o konuda sana yardımcı olacak mentorlarla buluşturuyor. Önce doğru adım.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Önceliklendirme #Göç #TürkDiasporası #YurtDışı #CorteQS`,
        instagramPost: `🎯 Her şeyi aynı anda çözmeye çalışınca hiçbiri çözülmüyor, farkında mısın?

5 soruluk testimiz taşınma sürecindeki EN büyük engelini belirliyor: vize mi, dil mi, iş mi, konut mu? 🔍

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Önceliklendirme #Göç #TürkDiasporası #YurtDışı #Gurbet #OdakNoktası #YurtDışıHayat #CorteQS #YeniHayat #Netleş`,
        redditPost: `"Her şeyi aynı anda çözmeye çalışınca hiçbiri çözülmüyor" — 5 soruyla asıl engelinizi bulan bir test bunu ne kadar doğru yapabilir?

CorteQS'te vize, dil, iş, konut gibi seçeneklerden hangisinin sizin için en büyük engel olduğunu belirleyen kısa bir test var. Fikir mantıklı: dağınık kaygı yerine tek bir önceliğe odaklanmak. Ama gerçek hayatta bu dört şey genelde birbirine bağlı oluyor (iş olmadan vize zor, vize olmadan konut zor gibi), 5 soru bu bağımlılığı yakalayabilir mi merak ediyorum.

Sizin için taşınma sürecinde gerçekten "her şeyi tıkayan" tek bir engel var mıydı, yoksa hepsi iç içe mi geçmişti?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person meets a community advisor who helps sort urgent, important and later tasks using real folders and a blank whiteboard. All writing is out of focus, while the ordered table shows the problem becoming manageable. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person works directly on the selected first issue—making a housing call, revising a resume, practicing language or organizing registration documents—while the assessment result remains unreadable on the phone. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧩 Kafanda yüz tane soru var ama hangisi gerçekten acil?

Kısa testimizle en kritik engelini tespit et, enerjini doğru yere harca. Vize evrakı mı, iş arama mı, dil mi — odağını bul.

👉 Ücretsiz kayıt olun!
CorteQS, seni doğru kaynağa ve doğru kişiye yönlendiriyor; engelini aşmış biri zaten ağda seni bekliyor. Yalnız çözme.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaEngeli #Odak #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `🧩 Kafanda yüz tane soru var ama hangisi gerçekten acil?

Kısa testimizle en kritik engelini tespit et, enerjini doğru yere harca. Vize evrakı mı, iş arama mı, dil mi — odağını bul 💡

👉 Ücretsiz kayıt ol, bio'daki linkten çöz!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#TaşınmaEngeli #Odak #Diaspora #TürkDiasporası #Gurbet #YurtDışı #Önceliklendirme #CorteQS #YeniHayat #ÇözümBul`,
        redditPost: `"Kafanda yüz tane soru var ama hangisi gerçekten acil" sorusuna cevap arayan kısa bir test var, siz kendi önceliğinizi nasıl belirlediniz?

CorteQS'in testi kısa sorularla en kritik engeli (vize, iş arama, dil vb.) tespit edip enerjinizi oraya yönlendirmenizi amaçlıyor. Bence bu tür "netleştirme" araçlarının en büyük faydası aslında cevabı bulmak değil, kişiyi oturup önceliklerini düşünmeye zorlaması.

Taşınma sürecinde "bunu çözmeden diğerleri anlamsız" dediğiniz bir şey oldu mu, yoksa hepsini paralel mi yürüttünüz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: After resolving the first priority, an approachable Turkish male creator in his early thirties, not based on any identifiable real person clears space on the table and opens the next folder calmly. The scene communicates momentum through changed behavior and environment rather than checkmark graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Önce Hangi Soruna Odaklanmalısın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps a person prioritize the first problem to solve among housing, work, language, paperwork and community needs. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person leaves a successful appointment related to the chosen priority, holding a closed folder and calling a supportive contact. Relief is restrained and believable, showing why sequence matters. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🔦 En büyük engelini bil ki onu aşabilesin.

2 dakikalık testle taşınma sürecindeki bir numaralı zorluğunu belirliyoruz ve sana özel bir başlangıç önerisi sunuyoruz. Net hedef, hızlı çözüm.

👉 Ücretsiz kayıt olun!
CorteQS, her zorlukta yanında; aynı yolu yürümüş bir diaspora ağıyla çözüm hep yakında. Birlikte daha kolay aşarız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#EngelTesti #GöçPlanı #TürkDiasporası #Topluluk #CorteQS`,
        instagramPost: `🔦 En büyük engelini bil ki onu aşabilesin!

2 dakikalık testle taşınma sürecindeki bir numaralı zorluğunu belirliyoruz, sana özel başlangıç önerisi veriyoruz. Net hedef, hızlı çözüm ⚡

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#EngelTesti #GöçPlanı #TürkDiasporası #Topluluk #Gurbet #YurtDışı #Odak #CorteQS #YeniHayat #ÇözümZamanı`,
        redditPost: `"En büyük engelini bil ki onu aşabilesin" mantığıyla 2 dakikada bir numaralı zorluğunuzu belirleyen bir test var, bu kadar hızlı bir tespitin değeri var mı sizce?

CorteQS'in testi kısa sürede taşınma sürecindeki bir numaralı zorluğu belirleyip başlangıç önerisi sunuyor. 2 dakika gibi kısa bir sürede anlamlı bir tespit yapılabileceğine şüpheyle yaklaşıyorum ama belki amaç derinlemesine analiz değil, sadece "nereden başlayacağını bilmemek" felcini kırmak.

Siz ilk zorluğunuzu hemen mi fark ettiniz, yoksa aylar sonra mı "aslında asıl sorun buymuş" dediniz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-10",
    globalId: "item-80",
    order: 10,
    name: "Yurt Dışında İş Bulma Şansın?",
    description:
      "Becerilerine ve hedef pazara göre o ülkede iş bulma olasılığını tahmin eden motive edici araç. Garanti değil, gerçekçi bir yol haritası sunar.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person completes an employability assessment on a laptop beside a resume, portfolio, language certificate turned away and a list of target companies with no readable names. The result shows several factors and an overall level without visible numbers. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person comparing current skills with real job requirements on a tablet. A few missing areas are highlighted through layout only, while the subject takes focused notes for improvement. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📈 Hedef ülkende iş bulma şansın gerçekte ne kadar?

Becerilerini, dilini ve sektör talebini girersek sana gerçekçi bir olasılık ve yol haritası çıkarıyoruz. Hayal değil, plan yap.

👉 Ücretsiz kayıt olun!
CorteQS, iş arama yolculuğunu hem veriyle hem ağla güçlendiriyor; hedef ülkede seni bekleyen profesyoneller var. Doğru bağlantı, doğru iş.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşBulma #Kariyer #TürkDiasporası #YurtDışıİş #CorteQS`,
        instagramPost: `📈 Hedef ülkende iş bulma şansın gerçekte ne kadar, merak ediyor musun?

Becerilerini, dilini ve sektör talebini girersen gerçekçi bir olasılık ve yol haritası çıkarıyoruz. Hayal değil, plan yap 💼

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İşBulma #Kariyer #TürkDiasporası #YurtDışıİş #Gurbet #YurtDışı #KariyerFırsatı #CorteQS #İşArama #YeniHayat`,
        redditPost: `Beceri, dil ve sektör talebine göre "iş bulma olasılığı" hesaplayan bir araç, böyle bir yüzdelik/olasılık tahminine ne kadar güvenir misiniz?

CorteQS'in aracı bu üç faktörü girip hedef ülkede iş bulma ihtimalini ve bir yol haritası çıkarıyor. Doğrusu "olasılık" gibi kesin bir rakam vermesi beni biraz şüpheci yapıyor, çünkü iş bulma büyük ölçüde network ve şansa da bağlı, bunu bir formüle dökmek zor gibi.

Yurt dışında iş ararken sizi en çok şaşırtan şey ne oldu — beklediğinizden kolay mı buldunuz, yoksa CV'niz güçlü olmasına rağmen çok mu zorlandınız?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviews the result with a diaspora recruiter who gives specific feedback on portfolio, language and local-market fit. Documents and screens remain unreadable, and the conversation feels direct rather than motivational. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: speech bubbles, calendar, event pin, neighbor silhouettes, small globe, route line, and bridge arc. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person acts on the assessment by practicing an interview, revising a portfolio and contacting a professional connection in one believable coworking scene. Real effort replaces probability graphics. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: glowing connection line, matching nodes, best-match star, handshake symbol, storefront, shopping bag, and package. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💼 "Acaba beni işe alırlar mı?" sorusuna veriyle cevap ver.

İş Bulma Olasılığı Aracımız; yeteneklerini pazar talebiyle eşleştirip güçlü ve zayıf yönlerini gösteriyor. Eksiğini gör, şansını artır.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette iş ararken seni mentorlar ve referanslarla buluşturuyor. Şans değil, hazırlık ve ağ kazandırır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşArama #YurtDışıKariyer #Diaspora #TürkDiasporası #CorteQS`,
        instagramPost: `💼 "Acaba beni işe alırlar mı?" sorusuna veriyle cevap ver!

İş Bulma Olasılığı Aracımız yeteneklerini pazar talebiyle eşleştirip güçlü ve zayıf yönlerini gösteriyor. Eksiğini gör, şansını artır 📊

👉 Ücretsiz kayıt ol, bio'daki linkten dene!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İşArama #YurtDışıKariyer #Diaspora #TürkDiasporası #Gurbet #YurtDışı #KariyerFırsatı #CorteQS #Mentorluk #İşFırsatları`,
        redditPost: `"Acaba beni işe alırlar mı" sorusuna güçlü/zayıf yön analiziyle cevap vermeye çalışan bir araç var, bu tür öz-değerlendirmeler gerçek mülakat sonucuyla ne kadar örtüşüyor?

CorteQS'in aracı yeteneklerini pazar talebiyle eşleştirip nerede eksik kaldığını gösteriyor. Kağıt üzerinde iyi bir fikir ama iş bulma sürecinde CV/beceri kadar mülakat performansı ve şans da rol oynuyor, bunu bir araç ne kadar öngörebilir merak ediyorum.

Kendi alanınızda "böyle bir analiz yapılsa hangi eksiğim çıkardı" diye düşündüğünüzde aklınıza bir şey geliyor mu?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person enters a structured job interview in a modern office, prepared with a clean portfolio and calm posture. The phone containing the completed assessment is put away, showing transition from analysis to action. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Yurt Dışında İş Bulma Şansın?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool assesses market fit using role demand, language, skills, experience and network readiness. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person receives a positive call after an interview while walking outside the office. No offer text or company branding appears; the quiet, relieved reaction communicates improved chances without guaranteeing an outcome. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: storefront, shopping bag, package, exchange arrows, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
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

👉 Ücretsiz kayıt ol, bio'daki linkten başla!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#İşOlasılığı #Kariyer #TürkDiasporası #YurtDışı #Gurbet #KariyerFırsatı #CorteQS #Motivasyon #İşArama #YeniHayat`,
        redditPost: `"İş bulmak şans değil, strateji" diyen bir araç var, beceri-pazar uyumu ve dil seviyesine göre işe girme ihtimalini değerlendiriyor. Siz bu ikisine ne kadar katılıyorsunuz?

CorteQS'in aracı bu iki faktöre bakıp hem bir ihtimal veriyor hem de artırma önerisi sunuyor. Bence "strateji" kısmı doğru ama tamamen "şans değil" demek biraz iddialı — doğru zamanda doğru ilana denk gelmek de gerçek bir faktör.

Siz iş ararken en çok neyle sonuç aldınız — dil seviyenizi geliştirmek mi, network mü, yoksa daha çok başvuru yapmak mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-11",
    globalId: "item-89",
    order: 11,
    name: "Almanya'da Sana Hangi Banka Uygun?",
    description:
      "Almanya'daki yaşam sürene, dil seviyene, ücret hassasiyetine ve yatırım/kripto alışkanlıklarına göre 19 banka arasından sana en uygun 3'ünü sıralayan karar aracı. Yeni gelen ve yerleşik Türkler için.",
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Sana Hangi Banka Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares German banking choices through fees, access, digital features and newcomer needs without endorsing a specific provider. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person compares three Germany-based banking options on a laptop at a kitchen table, focusing on fees, cash access and mobile features. Generic cards, branch photographs and comparison bars are visible but all names, numbers and logos are hidden. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: shared plate, aroma swirl, blank recipe card, helping hands, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Sana Hangi Banka Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares German banking choices through fees, access, digital features and newcomer needs without endorsing a specific provider. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person completing a bank-fit questionnaire on a phone beside a residence folder, transit pass and rent documents. The interface shows simple option cards without readable copy, grounding the decision in newcomer life. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🏦 Almanya'da hâlâ yanlış bankada mı boğuşuyorsun?

N26, ING, Sparkasse, Trade Republic... 20 soruyla dil, şube, ücret ve yatırım tercihini eşleştirip sana en uygun 3 bankayı sıralıyoruz. Doğru banka, dertsiz hayat.

👉 Ücretsiz kayıt olun!
CorteQS, Almanya'daki finans kararlarını netleştiriyor ve aynı yoldan geçmiş Türklerle seni buluşturuyor. Tecrübe paylaşıldıkça kolaylaşır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#AlmanyaHayatı #BankaSeçimi #TürkDiasporası #Almanya #CorteQS`,
        instagramPost: `🏦 Almanya'da hâlâ yanlış bankada mı boğuşuyorsun? 😅

N26, ING, Sparkasse, Trade Republic... 20 soruyla dil, şube, ücret ve yatırım tercihini eşleştirip sana en uygun 3 bankayı sıralıyoruz 💳

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#AlmanyaHayatı #BankaSeçimi #TürkDiasporası #Almanya #Gurbet #YurtDışı #Finans #CorteQS #AlmanyaRehberi #YeniGelenler`,
        redditPost: `Almanya'da 19 banka arasından size uygun 3'ünü sıralayan bir test, N26/Sparkasse/Trade Republic tartışmasına gerçekten netlik getirir mi?

CorteQS'in aracı Almanya'da kalış süreniz, dil seviyeniz, ücret hassasiyetiniz ve yatırım/kripto alışkanlığınıza göre 20 soruyla banka öneriyor. Bu sub'da zaten sürekli "hangi bankayı açmalıyım" soruları dönüyor, herkes N26 diyor ama Sparkasse'nin şube avantajını savunanlar da var.

Almanya'da banka değiştirenler: ilk açtığınız hesaptan neden vazgeçtiniz, yoksa hâlâ ilk bankanızda mısınız?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Sana Hangi Banka Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares German banking choices through fees, access, digital features and newcomer needs without endorsing a specific provider. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person discusses traditional and digital banking choices with an independent advisor in a quiet office. Two blank bank cards, a phone app and fee examples are arranged on the table with no branding or legible figures. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Sana Hangi Banka Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares German banking choices through fees, access, digital features and newcomer needs without endorsing a specific provider. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person tests a recommended mobile banking workflow while standing near a real German cash machine, but the machine and phone display no logos or readable text. The scene emphasizes everyday usability and access. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `💳 Gereksiz hesap ücretlerine kaç yıldır para mı yatırıyorsun?

Nakit mi mobil mi? Şube mi dijital mi? Kripto ve ETF yapıyor musun? Birkaç soruyla senin profiline en uygun masrafsız/dengeli/şubeli bankayı buluyoruz.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette parana sahip çıkman için hem veriyi hem topluluğu bir araya getiriyor. Doğru seçim, ceplerine yansır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Almanya #Banka #Finans #TürkDiasporası #CorteQS`,
        instagramPost: `💳 Gereksiz hesap ücretlerine kaç yıldır para mı yatırıyorsun? 🙈

Nakit mi mobil mi, şube mi dijital mi, kripto/ETF yapıyor musun? Birkaç soruyla profiline en uygun bankayı buluyoruz 💰

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Almanya #Banka #Finans #TürkDiasporası #Gurbet #YurtDışı #AlmanyaHayatı #CorteQS #ParaYönetimi #TasarrufZamanı`,
        redditPost: `Nakit/mobil, şube/dijital, kripto/ETF gibi tercihlere göre bankanı sıralayan bir araç var, gereksiz hesap ücreti ödeyen çok mu?

CorteQS'te birkaç soruyla (nakit kullanımı, şube ihtiyacı, yatırım alışkanlığı gibi) profiline uygun banka öneren bir test var. Almanya'da hâlâ gereksiz yere Kontoführungsgebühr ödeyen çok olduğunu duyuyorum, sırf değiştirmeye üşendikleri için.

Siz hesap ücretlerini kontrol ettiniz mi, yoksa hâlâ "değiştirmek zahmetli" diye aynı bankada mı kalıyorsunuz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Sana Hangi Banka Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares German banking choices through fees, access, digital features and newcomer needs without endorsing a specific provider. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person opens the selected account at home, verifying identity through a generic phone interface while organized documents sit nearby. The expression is focused and relieved, not celebratory or wealth-oriented. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Sana Hangi Banka Uygun?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool compares German banking choices through fees, access, digital features and newcomer needs without endorsing a specific provider. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: After choosing a suitable bank, an approachable Turkish male creator in his early thirties, not based on any identifiable real person pays the first household bill and transfers rent from a calm apartment desk. All amounts and account data are invisible, showing practical financial setup without private information. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, wallet, coins, and bank-card silhouette. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🧭 Almanya'ya yeni geldin ve banka seçimi kafanı mı karıştırdı?

İngilizce destek mi, şube yakınlığı mı, düşük komisyon mu senin için önemli? 20 soruluk testle güven, hız ve maliyet arasında sana en uygun bankayı öğren.

👉 Ücretsiz kayıt olun!
CorteQS, Almanya'daki ilk adımlarını kolaylaştırıyor; aynı bankalarda hesap açmış bir diaspora ağı bir tık uzağında. Yalnız uğraşma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #AlmanyaRehberi #Banka #TürkDiasporası #CorteQS`,
        instagramPost: `🧭 Almanya'ya yeni geldin ve banka seçimi kafanı mı karıştırdı?

İngilizce destek mi, şube yakınlığı mı, düşük komisyon mu önemli? 20 soruluk testle sana en uygun bankayı öğren 🏦

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#YeniGelenler #AlmanyaRehberi #Banka #TürkDiasporası #Gurbet #YurtDışı #AlmanyaHayatı #CorteQS #Finans #İlkAdım`,
        redditPost: `Almanya'ya yeni gelenler için İngilizce destek/şube yakınlığı/komisyon önceliğine göre banka öneren bir test, ilk banka hesabı açarken bunlardan hangisi gerçekten en önemlisi?

CorteQS'in testi bu üç önceliği tartıp yeni gelenler için bir banka sıralaması çıkarıyor. Anmeldung'dan önce mi sonra mı hesap açmak gerektiği bile başlı başına bir tartışma konusu burada, banka seçimi de cabası.

İlk hesabınızı açarken en çok neye takıldınız — dil bariyeri mi, randevu almak mı, yoksa hangi bankanın "yabancı dostu" olduğunu bilmemek mi?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
  {
    id: "burak-tool-12",
    globalId: "item-98",
    order: 12,
    name: "Almanya'da Hangi Sigortalar Sana Şart?",
    description:
      'Çalışma durumun, ailen, araç, konut ve risk profiline göre 12 sigorta türü arasından hangilerinin "önce al", "güçlü öneri" veya "opsiyonel" olduğunu gösteren karar aracı.',
    variants: [
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Hangi Sigortalar Sana Şart?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps distinguish mandatory, important and optional insurance needs in Germany without endorsing a provider. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person reviews essential German insurance categories on a laptop with recognizable household context around them: apartment keys, bicycle helmet, car documents, pet carrier and health folder. Priority levels are clear through layout but no words or logos can be read. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, umbrella, shield, and heart pulse. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Hangi Sigortalar Sana Şart?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps distinguish mandatory, important and optional insurance needs in Germany without endorsing a provider. Variant 1 should communicate the question or decision instantly with one strong human-centered moment. Scene: Over-the-shoulder view of an approachable Turkish male creator in his early thirties, not based on any identifiable real person answering an insurance-needs questionnaire on a tablet while a partner gathers family and housing documents. The screen uses realistic life photographs and option cards with no readable text. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: home, heart, family circle, phone-call waves, briefcase, upward path, and graduation cap. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `🛡️ Almanya'da hangi sigorta gerçekten şart, hangisi lüks?

Krankenversicherung mu, Haftpflicht mi, Rechtsschutz mu? 20 soruyla durumunu değerlendirip sana "önce al / güçlü öneri / opsiyonel" olarak net bir liste çıkarıyoruz.

👉 Ücretsiz kayıt olun!
CorteQS, Almanya bürokrasisinde seni yalnız bırakmıyor; aynı kararları vermiş Türklerin tecrübesi hep yanında. Bilgi, en iyi güvencedir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Almanya #Sigorta #TürkDiasporası #AlmanyaHayatı #CorteQS`,
        instagramPost: `🛡️ Almanya'da hangi sigorta gerçekten şart, hangisi lüks?

Krankenversicherung mu, Haftpflicht mi, Rechtsschutz mu? 20 soruyla "önce al / güçlü öneri / opsiyonel" net bir liste çıkarıyoruz 📋

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Almanya #Sigorta #TürkDiasporası #AlmanyaHayatı #Gurbet #YurtDışı #Finans #CorteQS #AlmanyaRehberi #Güvence`,
        redditPost: `Almanya'da 12 sigorta türünü "önce al / güçlü öneri / opsiyonel" diye üçe ayıran bir araç var, sizce Haftpflicht dışında gerçekten şart olan başka ne var?

CorteQS'in testi çalışma durumu, aile, araç, konut ve risk profiline göre 20 soruyla bu sınıflandırmayı yapıyor. Bu sub'da hep "Haftpflicht şart, gerisi opsiyonel" gibi genel geçer tavsiyeler görüyorum ama Rechtsschutz veya Hausrat gibi konularda görüşler çok ayrışıyor.

Sonradan "keşke daha önce yaptırsaymışım" dediğiniz bir sigorta oldu mu, yoksa gereksiz yere para verdiğinizi düşündüğünüz bir poliçe var mı?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Hangi Sigortalar Sana Şart?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps distinguish mandatory, important and optional insurance needs in Germany without endorsing a provider. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person meets an independent advisor at a neutral office table to distinguish mandatory, important and optional coverage. Generic policy folders and blank comparison sheets remain legible only as shapes; the advisor explains calmly without sales pressure. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, umbrella, shield, and heart pulse. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Hangi Sigortalar Sana Şart?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps distinguish mandatory, important and optional insurance needs in Germany without endorsing a provider. Variant 2 should emphasize the practical comparison, guidance or work required to reach a decision. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person examines a real-life scenario at home—a minor water leak, damaged bicycle or family health need—while checking the relevant policy area on a phone. The situation is controlled and non-dramatic, making protection practical. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: shield, checkmark, balanced scales, protective circle, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `📋 Onlarca sigorta türü var, hangisiyle başlayacağını bilmiyor musun?

Sigorta Seçimi Aracımız; çalışma durumun, ailen, araç ve konut profiline göre 12 sigorta türünü senin için önceliklendiriyor. Fazla ödeme de yok, açıkta kalma da.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette doğru güvenceyi kurman için hem rehber hem topluluk sunuyor. Doğru sigorta, huzurlu bir hayat demek.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#SigortaRehberi #Almanya #Finans #TürkDiasporası #CorteQS`,
        instagramPost: `📋 Onlarca sigorta türü var, hangisiyle başlayacağını bilmiyor musun?

Çalışma durumun, ailen, araç ve konut profiline göre 12 sigorta türünü senin için önceliklendiriyoruz. Fazla ödeme yok, açıkta kalma yok ✨

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#SigortaRehberi #Almanya #Finans #TürkDiasporası #Gurbet #YurtDışı #AlmanyaHayatı #CorteQS #Güvence #ParaYönetimi`,
        redditPost: `Onlarca sigorta türü arasında çalışma durumu/aile/araç/konut profiline göre önceliklendirme yapan bir araç, sizce sigorta acenteleri zaten bu işi yapmıyor mu?

CorteQS'in aracı bu dört profil bilgisini alıp 12 sigorta türünü önceliklendiriyor. Genelde bu konuda ya bir Versicherungsmakler'a gidiliyor ya da "arkadaşım ne yaptırdıysa" mantığıyla ilerleniyor, bağımsız bir önceliklendirme aracının bu ikisine göre avantajı ne olurdu bilmiyorum.

Sigorta seçerken makler mi kullandınız, kendiniz mi araştırdınız, yoksa hâlâ "hangisini yaptırmalıyım" diye kararsız mısınız?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
      {
        imagePrompts: [
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Hangi Sigortalar Sana Şart?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps distinguish mandatory, important and optional insurance needs in Germany without endorsing a provider. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: an approachable Turkish male creator in his early thirties, not based on any identifiable real person organizes selected coverage documents in a home file box, separating health, liability, household and vehicle folders whose labels are turned away. The scene communicates clarity and preparedness. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: briefcase, upward path, graduation cap, opportunity star, suitcase, house key, and home. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
          "Create a premium square 1:1 human-centered editorial illustration for CorteQS about “Almanya'da Hangi Sigortalar Sana Şart?”. This belongs to the CorteQS ‘Burak’ social series: practical, direct and approachable guidance about migration, career and life planning. The creator should feel knowledgeable and human, never like a celebrity endorsement or exaggerated influencer pose. The tool helps distinguish mandatory, important and optional insurance needs in Germany without endorsing a provider. Variant 3 should emphasize a credible next step or lived outcome after the decision, without promising perfection. Scene: A Turkish family in Germany leaves home for an ordinary day with appropriate practical protection already arranged: child, bicycle, apartment and car all present naturally. A closed insurance folder remains on the entry table, suggesting security without symbolic shields. At least one clearly visible human figure must be present and must remain the emotional center of the composition; use a small group only when the scene genuinely requires interaction. Around the person or group, arrange a balanced set of simple rounded contextual symbols that explain the idea immediately: shield, checkmark, balanced scales, protective circle, home, heart, and family circle. Translate the most important objects and signals from the scene into these surrounding symbols, using a halo, orbit, pathway or spatial cluster rather than a dense interface. Any phone, tablet or laptop may appear only as a secondary prop with abstract shapes; do not make screens, card grids or tiny interface details the main visual story. Use a polished contemporary editorial-illustration style with expressive simplified people, a soft dimensional vector and gentle 3D hybrid, rounded forms, smooth gradients, subtle depth and soft cinematic lighting. It does not need to look realistic; prioritize clarity, emotion and symbolic storytelling. Use the CorteQS visual system: warm ivory-cream background, deep teal as the dominant color, and controlled orange, blue, indigo, pink and yellow accents. Keep the mood inclusive, optimistic, trustworthy and modern. Square 1:1 composition at 1024x1024, strong thumbnail readability, one clear hierarchy, and at least 12% safe margin around every essential person and symbol. Keep all faces, hands and important objects fully inside the frame. No text, no letters, no readable numbers, no logos, no brand names, no provider names, no official seals and no watermark. Avoid photorealism, camera or lens aesthetics, stock-photo posing, clutter, excessive detail, decorative flags, duplicated people, distorted anatomy and unreadable fake interface text.",
        ],
        linkedinPost: `☂️ Bir kaza, bir dava, bir hastalık — Almanya'da hazırlıklı mısın?

Ailen, işin, araban ve yaşam tarzına göre gerçekten ihtiyacın olan sigortaları birkaç soruda belirliyoruz. Eksik güvenceyle risk alma, gereksizle de para kaybetme.

👉 Ücretsiz kayıt olun!
CorteQS, seni ve sevdiklerini korumana yardımcı oluyor; aynı yolu yürümüş bir diaspora ağı çözümü hep yakında. Birlikte daha güvendeyiz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Sigorta #AileGüvencesi #Almanya #TürkDiasporası #CorteQS`,
        instagramPost: `☂️ Bir kaza, bir dava, bir hastalık — Almanya'da hazırlıklı mısın?

Ailen, işin, araban ve yaşam tarzına göre gerçekten ihtiyacın olan sigortaları birkaç soruda belirliyoruz. Eksik güvence de yok, gereksiz ödeme de 💙

👉 Ücretsiz kayıt ol, bio'daki linkten öğren!
🔗 corteqs.net
💬 WhatsApp topluluğu bio'da.

#Sigorta #AileGüvencesi #Almanya #TürkDiasporası #Gurbet #YurtDışı #AlmanyaHayatı #CorteQS #Güvence #AileMutluluğu`,
        redditPost: `"Bir kaza, bir dava, bir hastalık" senaryolarına göre aile/iş/araç profiline uygun sigortaları belirleyen bir araç, bu senaryo bazlı yaklaşım size mantıklı geliyor mu?

CorteQS'in testi bu üç riski merkeze koyup gerçekten ihtiyacınız olan sigortaları birkaç soruda çıkarıyor. Almanya'da dava/Rechtsschutz konusu özellikle çok tartışılıyor, kimi şart diyor kimi hiç gerek yok diyor.

Ailesi olanlar: sigorta önceliğiniz bekar/tek yaşayanlardan farklı oldu mu, en çok hangi poliçeyi "aile için şart" olarak gördünüz?

corteqs.net

💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
🔗 https://corteqs.net/tools
`,
      },
    ],
  },
];
