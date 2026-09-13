// BURAK paylaşım aracı 4/12 — "Hangi Şehir Sana Daha Uygun?".
// İçerik (3 varyant × görsel promptu + LinkedIn/Instagram/Reddit postu) bu
// dosyadan düzenlenir; sıra ve dizi birleştirme `../burak-share-tools.ts`
// barrel'ındadır.

import type { BurakShareTool } from "./types.ts";

export const BURAK_SHARE_TOOL_04: BurakShareTool = {
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
};
