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
          "A premium modern editorial 3D illustration of a warm cream-colored globe rendered in smooth rounded geometry at the exact center of a square 1:1 frame recommended at 1024x1024 pixels, with several small glossy rounded location-pin shapes in teal, orange, indigo and yellow scattered across its surface and one pin gently glowing brighter than the rest to suggest a best match, soft cinematic lighting casting smooth gradients and gentle depth across the warm cream background, the composition centered and balanced with generous margin so no pin or edge of the globe touches the frame border, clear single visual hierarchy that reads instantly at thumbnail size, a hopeful and optimistic professional SaaS aesthetic suitable for both a website card and a hero banner, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
          "A premium modern editorial 3D illustration of a soft rounded teal compass needle floating above a stylized cluster of rounded landmass shapes rendered in orange, indigo, pink and yellow on a warm cream square background, the needle tip haloed in gentle golden light as it settles toward one landmass to suggest a decision being made, the whole scene scaled and centered so every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution with clear space before all four edges, smooth gradients and soft cinematic lighting adding subtle depth to the rounded friendly forms, a calm decision-making mood balanced with an optimistic and inclusive tone that remains legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded radar-scan arc sweeping in soft teal light across a warm cream square background dotted with small glossy rounded shapes in orange, blue, pink and yellow representing candidate destinations, one shape lighting up with a warm golden glow as the sweep passes over it to mark the match, the entire scene centered and comfortably contained inside the square 1:1 frame at 1024x1024 recommended size with ample clearance from every edge, soft cinematic lighting producing gentle gradients and subtle depth, an inclusive and optimistic technology-brand feel that stays clear at small thumbnail scale, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of three softly rounded lifestyle vignette cards in orange, indigo and teal floating in a balanced triangular arrangement around a central glowing cream sphere at the middle of a square 1:1 canvas recommended at 1024x1024 pixels, each card hinting at a different way of life through simple rounded silhouette shapes (a skyline, a small house, a sunny coastline) without any fine detail, the whole composition scaled with generous margin so nothing touches the frame border, smooth gradients and soft cinematic lighting giving gentle depth and a polished, friendly SaaS aesthetic that reads instantly at thumbnail size, a warm and welcoming mood, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a central glowing cream-and-teal globe surrounded by a balanced ring of small rounded lifestyle icon-cards in orange, blue, pink and yellow (a tiny house, a leaf, a sun, a briefcase, all simplified without detail) floating like petals around it on a warm cream square background, the whole bloom perfectly centered inside the square 1:1 frame at 1024x1024 recommended size with clear space from all four edges, soft cinematic lighting creating smooth gradients and gentle shadows for subtle depth, a rich yet uncluttered composition that reads clearly at thumbnail size, an optimistic and exploratory mood, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded decision-tree shape made of glowing teal branches spreading from a single trunk toward several small orange, indigo, pink and yellow destination orbs at a warm cream square canvas, one orb slightly larger and haloed in gentle light to mark the top recommendation, the whole tree scaled and centered so every branch and orb stays fully inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding subtle depth to the rounded friendly forms, a clear and strategic yet warm mood that remains legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a balanced row of smooth rounded glossy column shapes of varying heights in teal, orange, indigo and yellow rising from a warm cream square base at the center of a square 1:1 frame recommended at 1024x1024 pixels, the tallest column softly haloed in golden light to draw the eye, each column scaled so its top and sides stay well clear of the frame border, soft cinematic lighting creating smooth gradients and gentle shadows for subtle depth, a clean single visual hierarchy that reads instantly at thumbnail size, a confident and optimistic professional mood suited to both a website card and hero image, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded balance scale rendered in glossy teal light at the center of a warm cream square background, one pan holding a small glowing rounded coin-stack shape in golden-orange and the other holding a tiny rounded house shape in indigo to suggest weighing pay against cost of living, the scale perfectly level and centered with clear margin from every edge of the square 1:1 frame at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a thoughtful and balanced mood that remains legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy purchasing-power gauge shaped like a soft arc, filled with warm teal light rising toward a bright zone, small rounded icon-shapes of a coin and a tiny house in orange and indigo resting at either end of the arc on a warm cream square background, the whole gauge centered and scaled to sit safely inside the square 1:1 frame at 1024x1024 recommended size with clear space from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a clear and reassuring financial-clarity mood that reads well at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a glossy rounded wallet shape in teal at the center of a warm cream square canvas, gently opening to release a soft glowing cascade of small rounded coin shapes in orange, yellow and pink that arc upward and settle around it in a balanced circular pattern, every coin and the wallet itself kept comfortably inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting giving gentle depth and a polished, optimistic financial mood that stays legible at small thumbnail scale, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy briefcase in teal at the center of a warm cream square background, with soft glowing pathways in orange, indigo and pink branching out from it toward several small rounded skyline silhouettes of varying brightness, the brightest skyline haloed in warm golden light to indicate the top opportunity, the entire scene scaled and centered so all paths and skylines remain fully within the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, smooth gradients and soft cinematic lighting adding subtle depth, an ambitious and hopeful career-growth mood legible at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a rounded glossy globe made of soft teal glass sitting on a warm cream square canvas, with a gentle ring of small rounded coin-stack shapes in orange, yellow and pink orbiting around its equator at varying heights to represent differing pay levels by region, the globe and every orbiting shape centered and scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution, soft cinematic lighting casting smooth gradients and gentle shadows for subtle depth, a worldly and optimistic professional mood that reads clearly at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "Finansal, duygusal ve lojistik açıdan taşınmaya hazır olup olmadığını ölçen kişisel hazırlık testi. \"Gerçeklik kontrolü\" isteyen, taşınmayı planlayanlar için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded glossy readiness gauge shaped like a speedometer arc, filling with warm teal light toward a bright golden zone, small rounded icon shapes of a suitcase, a document and a speech bubble in orange, indigo and pink arranged evenly around the gauge on a warm cream square background, the whole composition centered and scaled to sit safely inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a motivating self-assessment mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy suitcase in teal standing open at the center of a warm cream square canvas, with small rounded checkmark shapes in orange, yellow and pink gently floating up out of it like confirmations, arranged in a balanced radial pattern above the suitcase, every element scaled to remain comfortably inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded friendly forms, a reassuring and prepared mood that stays legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy checklist made of soft glowing checkmark shapes in teal, orange and yellow floating above a partially packed open suitcase rendered in warm cream and indigo tones at the center of a square 1:1 frame recommended at 1024x1024 pixels, the checkmarks arranged in a tidy balanced column with clear space above and to the sides so nothing touches the frame edge, soft cinematic lighting creating smooth gradients and gentle shadows for subtle depth, an organized and confident preparation mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy scale balancing a small glowing courage-flame shape in orange on one side and a stack of rounded document shapes in teal on the other, centered on a warm cream square background, perfectly level to suggest weighing bravery against practical readiness, the whole scale scaled and centered so it remains fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous margin from the border, smooth gradients and soft cinematic lighting adding subtle depth to the rounded forms, a thoughtful and encouraging mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a soft rounded silhouette figure in glossy teal standing confidently at a glowing doorway of golden-orange light on a warm cream square background, one foot stepping from a dim indigo room into a bright path lined with small rounded milestone dots, the entire scene centered and scaled so the figure and doorway stay fully inside the square 1:1 frame at 1024x1024 recommended size with clear space from all edges, soft cinematic lighting producing smooth gradients and gentle depth, a hopeful and courageous mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of four small rounded glowing pillar shapes in teal, orange, indigo and pink standing evenly spaced on a warm cream square canvas, each pillar topped with a simple rounded icon (a coin, a speech bubble, a handshake, a heart) representing different readiness dimensions, one pillar slightly taller and haloed in golden light to show relative strength, the whole row centered and scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding subtle depth, a balanced and encouraging self-assessment mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a warm cream square map dotted with several small rounded glowing city-marker shapes in teal, orange, indigo and pink connected by soft light lines, one marker pulsing brighter with a golden halo to show the best match, all markers and connecting lines centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size with clear space from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a clear single visual hierarchy that reads instantly at thumbnail size, an optimistic city-discovery mood, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of three soft rounded glossy city-skyline silhouettes in teal, orange and indigo of slightly varying heights standing side by side on a warm cream square canvas, arranged on a gentle rounded podium shape with the tallest skyline centered and haloed in warm golden light, the whole scene scaled and centered so every skyline and podium edge stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a celebratory ranking mood that reads clearly at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy magnifying glass in teal glass hovering over a cluster of small rounded neighborhood shapes in orange, indigo, pink and yellow arranged on a warm cream square background, each tiny shape topped with an even simpler icon (a briefcase, a leaf, a sun, a handshake) representing different city qualities, the magnifier and cluster centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, a curious and analytical mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy map shape unrolling gently across a warm cream square canvas, dotted with a handful of small glowing rounded pins in teal, orange and pink, with delicate light trails connecting the pins to a single central figure silhouette rendered in indigo standing at the middle, the whole scene scaled and centered so every pin, trail and the figure stay safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a guiding and reassuring mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded glowing spotlight cone in golden-yellow light illuminating one neighborhood cluster of small rounded building shapes in teal and orange while several dimmer clusters in indigo and pink fade softly around it, the composition centered and scaled so every cluster stays fully within the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a clarifying and confident mood that reads well at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy weighing scale in teal balancing two small rounded city-block shapes, one in orange and one in indigo, on a warm cream square background, tiny floating icon-dots in pink and yellow (representing job, climate, community and cost factors) drifting evenly around the scale, the whole scene centered and scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a careful and thoughtful comparison mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of two smooth rounded glossy profile-orb shapes, one in teal and one in warm orange, connected by a gentle glowing indigo line at the center of a warm cream square background, small complementary puzzle-notch details on facing sides of the orbs suggesting a perfect fit, the whole pair centered and scaled so nothing touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a warm and trustworthy connection mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a balanced constellation of small rounded glossy figure-silhouette nodes in teal, orange, indigo, pink and yellow scattered across a warm cream square canvas, with soft glowing light threads forming between the two most compatible nodes near the center while other threads stay faint, every node and thread scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a community-matchmaking mood that is optimistic and inclusive, legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a balanced radial network of small rounded glossy people-icon shapes in teal, orange, indigo, pink and yellow arranged evenly around a warm cream square canvas center, with soft bright light lines forming between the most compatible pairs and fainter lines linking the rest, the whole network centered and scaled to sit safely inside the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, an inclusive and lively matchmaking mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of two soft rounded glossy speech-bubble shapes, one in teal and one in orange, drifting toward each other above a warm cream square background with small glowing particle sparks in indigo, pink and yellow rising between them to suggest an instant connection, the bubbles and sparks centered and scaled so nothing crosses the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a warm, efficient and modern connection mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal representing a newcomer and one warm orange representing an experienced mentor, reaching toward a small glowing handshake point at the exact center of a warm cream square background, with a faint rounded city-skyline silhouette in indigo behind them, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a supportive and hopeful mentorship mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy bridge arc in teal connecting two small rounded platforms, one holding a simple orange figure shape representing someone needing help and the other holding a simple indigo figure shape representing someone offering help, set on a warm cream square canvas, small pink and yellow light particles drifting gently across the bridge, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a warm reciprocal-support mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of several smooth rounded glossy career pathways in teal, orange and indigo branching outward from a single bright point at the center of a warm cream square background toward small rounded icon shapes (a graduation cap, a laptop, a lightbulb) each softly glowing, the whole branching form centered and scaled so every path and icon stays fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a hopeful direction-finding mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy compass shape in teal at the center of a warm cream square canvas, its needle pointing toward one of three small rounded persona-icon shapes in orange, indigo and pink (representing academic, tech and entrepreneurial paths) arranged in a balanced arc around it, the compass and every icon scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a clear and confident path-finding mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy compass needle in teal glowing softly as it swings toward one of several small rounded professional-persona shapes in orange, indigo, pink and yellow arranged in a balanced circle on a warm cream square background, one persona shape haloed brighter to show the match, the entire scene centered and scaled to sit fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, a decisive and encouraging mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded glossy signpost shape in teal standing at the center of a warm cream square canvas, with several small rounded arrow-shapes in orange, indigo, pink and yellow pointing outward toward different simple destination icons, one arrow softly haloed in golden light to mark the recommended route, everything scaled and centered so no arrow or icon touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a clear wayfinding mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy staircase in teal rising diagonally across a warm cream square canvas toward a bright golden horizon glow at the top corner, small rounded milestone-dots in orange, indigo and pink placed evenly along each step, the whole staircase scaled and centered so its base and top stay well within the square 1:1 frame at 1024x1024 recommended size with clear space from every edge, soft cinematic lighting producing smooth gradients and gentle shadows for subtle depth, an ambitious growth-oriented mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy tree shape in teal at the center of a warm cream square background, its branches ending in small rounded fruit-like orbs colored orange, indigo, pink and yellow each representing a different career outcome, one orb glowing brighter with warm golden light to mark the recommended path, the whole tree scaled and centered to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding subtle depth to the rounded forms, a nurturing and growth-focused mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a playful balanced arrangement of small rounded glossy persona-badge shapes in teal, orange, indigo, pink and yellow floating with tiny sparkle accents on a warm cream square background, each badge topped with a simple friendly symbol (a globe, a coffee cup, a compass) without fine detail, one badge slightly larger and centered as the featured result, the whole cluster scaled so nothing touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a fun and shareable personality-quiz mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a vibrant rounded glossy character silhouette in teal standing at the center of a warm cream square canvas, surrounded by a joyful swirl of small rounded lifestyle icon-shapes in orange, indigo, pink and yellow (a coffee cup, an airplane, a city light, a book) orbiting gently around it, everything scaled and centered so no icon crosses the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a playful and energetic self-expression mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy spinning-wheel shape divided into colorful teal, orange, indigo, pink and yellow segments at the center of a warm cream square canvas, a small glowing pointer resting on one bright segment to reveal the result, gentle motion-blur light trails around the wheel's rim, the whole wheel centered and scaled to sit fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a playful gamified-quiz mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a joyful cluster of small rounded glossy lifestyle-scene cards in teal, orange, indigo and pink (hinting at nightlife, a quiet cafe, a solo trip, a cozy home through simple rounded shapes without detail) fanned out like a hand of cards on a warm cream square background, one card lifted forward and haloed in golden light as the chosen result, everything scaled and centered so no card touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a fun and expressive lifestyle-quiz mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a warm cream square canvas centered on a smooth rounded glossy roulette-style wheel in teal, orange, indigo, pink and yellow segments, a soft golden light pointer landing precisely on one segment, small sparkle particles drifting around the rim in a balanced circular pattern, the whole wheel scaled and centered to remain fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, a lighthearted celebratory quiz mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of three small rounded glossy persona-figure silhouettes in teal, orange and indigo standing together in the same simplified city-block setting on a warm cream square background, each figure subtly different in pose and each surrounded by a faint personal glow of a different accent color (pink, yellow, blue) to show three ways of experiencing the same place, everything scaled and centered so no figure touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a relatable and inclusive lifestyle-diversity mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy timeline ribbon in teal curving gently across a warm cream square canvas, dotted with small rounded milestone shapes in orange, indigo and pink each topped with a tiny simple icon (a house key, a bank card, a speech bubble), the ribbon centered and scaled so its full curve stays within the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, an organized and encouraging planning mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy stack of checklist-card shapes in teal, orange and indigo fanned slightly on a warm cream square background, small glowing checkmark shapes in yellow and pink appearing above the top cards as if being ticked off one by one, everything scaled and centered so no card touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a productive and actionable planning mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy accordion-style stack of checklist-card shapes in teal, orange, indigo and pink standing upright on a warm cream square canvas, small glowing checkmark shapes in golden-yellow appearing one at a time above the cards as if being ticked off in sequence, the whole stack centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with clear space from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a calm and organized progress mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy calendar shape rendered in warm cream and teal at the center of a square 1:1 canvas recommended at 1024x1024 pixels, its first few weeks gently highlighted with a warm golden glow and small rounded checkmark shapes in orange and pink appearing across those highlighted days, the whole calendar scaled and centered so it stays fully within the frame with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a hopeful first-days roadmap mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy calendar shape made of light standing at the center of a warm cream square background, its first few weeks gently highlighted in soft teal glow, small rounded checkmark shapes in orange, indigo and yellow appearing across the highlighted days in a tidy sequence, the whole calendar centered and scaled so it stays fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a structured and reassuring roadmap mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy path made of stepping-stone shapes in teal, orange, indigo and pink winding gently across a warm cream square canvas from a small house-icon shape toward a bright glowing horizon, each stone slightly larger than the last to suggest steady progress, the entire path centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a step-by-step, stress-free settling-in mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy radar-scan shape in teal light sweeping across a warm cream square background dotted with several small dimmer rounded obstacle-icon shapes (a document, a speech bubble, a briefcase, a house) in indigo, pink and yellow, with one icon pinpointed and haloed in bright golden light to mark the single biggest obstacle, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a clarifying focus-finding mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a tangled cluster of soft rounded glowing thread shapes in orange, indigo, pink and yellow at the center of a warm cream square canvas, with one bright teal thread being gently pulled free and straightened above the tangle, everything scaled and centered so no thread touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a satisfying prioritization mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy knot of tangled light-threads in indigo, pink and yellow at the center of a warm cream square background, with one glowing teal thread being carefully lifted out and untangled first while the rest remain gently coiled, the whole composition centered and scaled so nothing touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a relieving and clarifying mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a small rounded glossy figure silhouette in teal standing at a crossroads of several soft glowing paths in orange, indigo, pink and yellow on a warm cream square canvas, one path lit brighter with warm golden light to indicate the priority direction, everything scaled and centered so no path extends beyond the square 1:1 frame at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a decisive and calming prioritization mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a soft rounded glossy spotlight cone in golden light shining down onto a single small rounded obstacle-icon shape in teal on a warm cream square canvas, while several other similar obstacle-icon shapes in indigo, pink and yellow fade softly into the background around it, everything scaled and centered so no icon touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a sharply clarifying top-priority mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded glossy target/bullseye shape rendered in teal and orange rings at the center of a warm cream square background, a single small glowing arrow in indigo landing precisely in the center ring, faint rounded silhouette icons of other lesser obstacles arranged loosely outside the target, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a focused and motivating clarity mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy probability-gauge arc in teal filling toward a bright golden zone at the center of a warm cream square background, small rounded skill-icon shapes in orange, indigo and pink feeding gently into the gauge from below, the whole gauge centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a motivating and realistic mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy resume-silhouette shape in teal rising gently toward a bright open doorway of golden light at the center of a warm cream square canvas, small rounded skill-badge shapes in orange, indigo and pink floating alongside it as it rises, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a hopeful getting-hired-abroad mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a soft rounded glossy resume-silhouette shape in teal glowing softly as it rises toward a bright open doorway made of warm golden light at the center of a warm cream square canvas, small rounded sparkle accents in orange, pink and indigo drifting around the doorway frame, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, an encouraging getting-hired mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded glossy handshake shape formed of soft teal and orange light at the center of a warm cream square background, framed by a gentle arc of small rounded skill-icon shapes in indigo, pink and yellow representing different competencies, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a confident and welcoming hiring mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
          "A premium modern editorial 3D illustration of a smooth rounded glossy bar-of-light shape in teal rising taller against a warm cream square background with a soft rounded city-skyline silhouette in orange and indigo behind it, the bar topped with a gentle golden glow to show a growing skill-versus-market match, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a motivating job-market mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded glossy open door shape in teal standing at the center of a warm cream square canvas with warm golden light spilling through it, a small rounded figure silhouette in orange stepping confidently toward the light, framed by faint rounded skill-icon shapes in indigo, pink and yellow floating nearby, the whole scene scaled and centered to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with clear margin from every edge, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a motivating and optimistic career-opportunity mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
