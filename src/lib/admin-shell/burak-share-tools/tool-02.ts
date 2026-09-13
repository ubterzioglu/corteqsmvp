// BURAK paylaşım aracı 2/12 — "Mesleğin Dünyada Ne Kazandırıyor?".
// İçerik (3 varyant × görsel promptu + LinkedIn/Instagram/Reddit postu) bu
// dosyadan düzenlenir; sıra ve dizi birleştirme `../burak-share-tools.ts`
// barrel'ındadır.

import type { BurakShareTool } from "./types.ts";

export const BURAK_SHARE_TOOL_02: BurakShareTool = {
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
};
