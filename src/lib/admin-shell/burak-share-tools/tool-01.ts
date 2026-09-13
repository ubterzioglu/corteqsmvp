// BURAK paylaşım aracı 1/12 — "Hangi Ülke Sana Uygun?".
// İçerik (3 varyant × görsel promptu + LinkedIn/Instagram/Reddit postu) bu
// dosyadan düzenlenir; sıra ve dizi birleştirme `../burak-share-tools.ts`
// barrel'ındadır.

import type { BurakShareTool } from "./types.ts";

export const BURAK_SHARE_TOOL_01: BurakShareTool = {
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
};
