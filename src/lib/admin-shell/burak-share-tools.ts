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
    order: 1,
    name: "Hangi Ülke Sana Uygun?",
    description:
      "Kariyer, yaşam tarzı ve değerlerine göre taşınmak için sana en uygun ülkeyi bulan tıkla-geç test. Kararsız genç profesyoneller ve göçü düşünen aileler için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream-colored globe rendered in soft rounded geometry at the exact center of a square 1:1 canvas, with a single glossy teal location-pin gently descending toward one highlighted region while faint orange, indigo, pink and yellow glow rings mark other regions further away; the globe and pin are scaled to sit comfortably inside the frame at a recommended 1024x1024 resolution with generous padding so nothing touches or crosses the edges; soft cinematic lighting produces smooth gradients and gentle rounded shadows, giving the scene subtle depth and a polished, optimistic SaaS-illustration feel that stays legible at thumbnail size and works equally well as a website card or hero image; the mood is hopeful and aspirational; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
          "A premium modern editorial 3D illustration of a friendly rounded teal compass shape floating at the center of a warm cream square background, its single glossy needle pointing toward a softly glowing orange landmass silhouette while three dimmer indigo, pink and yellow landmass silhouettes sit further out in a balanced circular arrangement; every shape stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; smooth gradients and soft cinematic lighting give the rounded forms subtle depth and a confident, inclusive, professional technology-brand mood that reads instantly at small thumbnail scale; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded radar-dish shape in teal sweeping a soft beam of light across a warm cream square canvas dotted with small rounded landmass silhouettes in orange, blue, pink and yellow, with one landmass glowing brighter at the center where the beam currently rests; the entire composition is centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size, well away from every edge; soft cinematic lighting creates smooth gradients and rounded, friendly volumes with subtle depth, producing a polished, decisive, optimistic technology-brand aesthetic that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of three soft rounded suitcase shapes in orange, teal and indigo arranged in a gentle arc on a warm cream square background, each suitcase topped with a small glowing rounded flag-less pennant shape of a different accent color, with faint dotted travel-path arcs in pink and yellow connecting them toward a single glowing star marking the best match at the top center; every element stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, decision-making, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a central glossy teal globe with three softly glowing rounded lifestyle-scene cards — a small career skyline in orange, a cozy rounded home shape in indigo, and a sunny coastline curve in pink — floating around it in a balanced circular arrangement, each connected to the globe by a thin glowing yellow thread; everything is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, optimistic, polished SaaS-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded scale-of-values shape in teal balancing gently at the center of a warm cream square background, with small glossy weight-orbs in orange, blue, indigo and pink resting on each side representing different life priorities, and a faint glowing globe silhouette softly visible behind the scale; the whole composition is centered and comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, thoughtful, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-2",
    order: 2,
    name: "Mesleğin Dünyada Ne Kazandırıyor?",
    description:
      "Mesleğin ve deneyiminin farklı ülkelerde ne kadar kazandıracağını gösteren maaş karşılaştırma aracı. Alanının nerede daha çok değer gördüğünü merak eden Türk profesyoneller için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas featuring a gentle skyline made of rounded bar-shapes of varying heights in teal, orange, indigo, pink and yellow, resembling a soft cityscape of coin-stacks, centered and balanced with the tallest bar glowing brightest at the middle; the entire skyline is scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a confident, polished, optimistic professional-finance feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded briefcase shape in teal at the center of a warm cream square background, gently opening to release a soft upward spray of small glossy rounded coin shapes in orange, indigo, pink and yellow that arc symmetrically outward like a fountain; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a rewarding, professional, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal balance-scale at the center of a warm cream square canvas, one side holding a small glossy stack of orange coin shapes and the other side holding a small rounded house silhouette in indigo, perfectly level to suggest fair comparison, with a few pink and yellow sparkle accents floating gently around the fulcrum; the whole scale is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a thoughtful, polished, trustworthy financial-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a rounded teal wallet shape resting on a warm cream square background, with a soft glowing orange coin gently sliding out and a small indigo house-shaped token beside it on a tiny weighing platform, both haloed by faint pink and yellow light rings to suggest purchasing-power comparison; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, professional, reassuring mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal briefcase shape at the center of a warm cream square canvas, gently emitting several soft glowing pathways in orange, indigo, pink and yellow that branch outward toward small rounded city-skyline silhouettes of differing heights and brightness arranged in a balanced circular pattern; every shape stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a confident, aspirational, polished professional feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a rounded teal passport-like booklet shape standing upright at the center of a warm cream square background, gently glowing at its edges, with small rounded value-orbs in orange, blue, pink and yellow orbiting around it at different heights to represent varying worth across places; the whole scene is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, professional, global mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-3",
    order: 3,
    name: "Yurt Dışına Taşınmaya Hazır mısın?",
    description:
      "Finansal, duygusal ve lojistik açıdan taşınmaya hazır olup olmadığını ölçen kişisel hazırlık testi. \"Gerçeklik kontrolü\" isteyen, taşınmayı planlayanlar için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal gauge-arc shape at the center of a warm cream square canvas, glowing progressively from soft yellow through orange toward a bright indigo peak to show a readiness level filling up, surrounded by small rounded icon-shapes of a suitcase, a document and a speech bubble in pink, blue and orange orbiting gently around it; the whole gauge is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a confident, optimistic, polished self-assessment feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal suitcase standing open at the center of a warm cream square background, with small glowing rounded checkmark shapes in orange, indigo, pink and yellow gently floating up and out of it like confirmations, arranged in a balanced upward arc; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a hopeful, prepared, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded teal suitcase lying open with its lid gently propped up, above which float several small glossy rounded checkmark shapes in orange, indigo, pink and yellow like a completed checklist, all balanced symmetrically over the suitcase; the entire composition is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving an organized, reassuring, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal magnifying-glass shape hovering at the center of a warm cream square background, focused on a small glowing orange gauge-dial shape beneath it that reads as calm self-reflection, with faint indigo, pink and yellow light particles drifting around in a balanced radial pattern; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an honest, thoughtful, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal figure-silhouette standing confidently at a glowing rounded doorway shape at the center of a warm cream square canvas, one side of the doorway softly dim and the other bathed in warm orange and yellow light, with small indigo and pink sparkle accents drifting near the threshold; the whole scene is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a confident, hopeful, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal staircase shape rising gently across a warm cream square background toward a bright glowing orange horizon line, with small rounded milestone-orbs in indigo, pink and yellow marking each step in a balanced ascending pattern; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a determined, optimistic, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-4",
    order: 4,
    name: "Hangi Şehir Sana Daha Uygun?",
    description:
      "Hedef ülke içinde tercihlerinle (iş fırsatları, yaşam tarzı, iklim, topluluk) en uyumlu şehirleri öneren araç. Ülkeyi bilen ama şehre karar veremeyenler için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded stylized map plane in pale teal, with three small glowing rounded city-marker shapes in orange, indigo and pink scattered across it, one marker pulsing brighter at the center as the best match, connected by thin glowing yellow lines to the others; the whole map is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a confident, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of three soft rounded city-skyline silhouettes of varying heights in teal, orange and indigo standing side by side on a warm cream square background, each resting on a small glowing rounded podium-step, with the tallest skyline glowing brightest in the center and pink and yellow sparkle accents drifting above it; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a decisive, polished, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal winner's podium at the center of a warm cream square canvas, holding three glowing rounded city-skyline silhouettes of differing brightness in orange, indigo and pink, the tallest and brightest skyline standing on the center step; small yellow sparkle accents float above the scene in a balanced arrangement; everything stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a celebratory, polished, optimistic feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal ranking-ladder shape at the center of a warm cream square background, with three small glowing rounded city-silhouette tokens in orange, pink and yellow resting on its rungs at different heights, the top rung glowing brightest; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a clear, decisive, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal magnifying glass hovering over a cluster of small glowing rounded neighborhood-block shapes on a warm cream square canvas, with tiny orbiting icon-shapes representing job, home, climate and community rendered as simple rounded orange, indigo, pink and yellow tokens circling above the focused area; the whole scene is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a detailed yet uncluttered, polished, optimistic feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of two soft rounded neighborhood-block clusters, one warm orange and one cool teal, resting side by side on a warm cream square background, subtly different in shape and texture to suggest two distinct city characters, with a thin glowing indigo divider line between them and small pink and yellow sparkle accents scattered above; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a thoughtful, comparative, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-5",
    order: 5,
    name: "Diaspora Ağı Eşleştirme",
    description:
      "Diaspora üyelerini tamamlayıcı ihtiyaç ve uzmanlıklara göre eşleştiren akıllı eşleştirici. Mentor/iş fırsatı arayan yeni gelenler ve yardım etmek isteyen deneyimliler için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of two soft rounded glossy profile-orb shapes, one teal and one warm orange, floating toward each other at the exact center of a warm cream square canvas, with a gentle glowing indigo puzzle-piece-shaped connector forming in the gap between them, and small pink and yellow sparkle accents drifting nearby in a balanced arrangement; both orbs and the connector stay fully within the square 1:1 frame at 1024x1024 recommended size, well clear of every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a warm, collaborative, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a balanced circular constellation of small rounded figure-silhouette shapes in teal, orange, indigo, pink and yellow connected by thin glowing lines on a warm cream square background, with two of the figures linked by a brighter, thicker golden-orange line to show the strongest match; the whole constellation is centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inclusive, optimistic, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded teal handshake-shaped icon at the center, formed from two interlocking glossy rounded forms in orange and indigo, surrounded by a balanced ring of small floating rounded speech-bubble shapes in pink, blue and yellow representing shared conversations; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, community-driven, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal magnet shape at the center of a warm cream square background, gently drawing together several small glossy rounded figure-silhouettes in orange, indigo, pink and yellow from different directions in a balanced radial pull; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inclusive, optimistic, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal handshake shape rendered in glossy light at the center of a warm cream square canvas, joining a smaller rounded orange figure-silhouette on one side and a taller rounded indigo figure-silhouette on the other, with a faint rounded city-block backdrop in pink and yellow softly visible behind them; everything is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a warm, supportive, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal bridge-arc shape connecting two small glossy rounded figure-silhouettes, one in orange and one in indigo, standing on either end on a warm cream square background, with gentle pink and yellow light particles flowing along the arc like shared knowledge passing between them; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a generous, hopeful, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-6",
    order: 6,
    name: "Yurt Dışında Hangi Kariyer Sana Uygun?",
    description:
      "İlgi alanların ve becerilerine göre yurt dışındaki kariyer seçeneklerini öneren test. Yön arayan öğrenciler ve profesyoneller için (eğitim mi, teknoloji mi, girişimcilik mi).",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal orb at the center of a warm cream square canvas, gently branching outward into several soft glowing pathways in orange, indigo, pink and yellow that lead toward small rounded icon-shapes representing a lab flask, a laptop, a lightbulb and a briefcase, arranged in a balanced radial pattern; everything is scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a hopeful, exploratory, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal signpost shape at the center of a warm cream square background, with several small glowing rounded arrow-panels in orange, indigo, pink and yellow pointing in different directions, each topped with a simple rounded icon suggesting a different career path; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a clear, optimistic, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal compass shape at the center of a warm cream square canvas, its single glossy needle pointing toward one of several small glowing rounded persona-badge shapes in orange, indigo, pink and yellow arranged in a balanced arc around it; the whole compass and badges are scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a confident, decisive, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal telescope shape at the center of a warm cream square background, gently pointed toward a distant glowing orange horizon dotted with small rounded professional-path icons in indigo, pink and yellow; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a forward-looking, optimistic, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal staircase shape rising diagonally across a warm cream square canvas toward a bright glowing orange horizon, with small rounded milestone-glow dots in indigo, pink and yellow marking each step in a balanced ascending rhythm; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows across the rounded forms, giving an ambitious, hopeful, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal rocket-like arc shape lifting gently from a warm cream square background toward a soft glowing orange and yellow sky-burst, with small rounded milestone-orbs in indigo and pink trailing behind it in a balanced upward curve; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an energetic, optimistic, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-7",
    order: 7,
    name: "Yurt Dışı Yaşam Tarzın Ne?",
    description:
      "Kullanıcıları eğlenceli kişilik tiplerine ayıran (Küresel Networker, Sakin Yerli, Macera Avcısı gibi) keyifli kişilik testi. Etkileşim ve paylaşım için ideal.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a playful balanced cluster of three soft rounded persona-badge shapes in teal, orange and pink, each topped with a tiny distinct rounded symbol (a globe, a cozy house, a compass) and gently surrounded by small sparkling yellow and indigo particle accents; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a fun, lighthearted, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal spinning-wheel shape at the center of a warm cream square background, divided into soft colorful segments in orange, indigo, pink and yellow, with a single glossy pointer resting on one segment to reveal a personality result; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a playful, gamified, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a vibrant soft rounded teal character-silhouette at the center of a warm cream square canvas, gently surrounded by small floating rounded lifestyle-icon shapes — a coffee cup, an airplane, a city-light glow and a stack of books — in orange, indigo, pink and yellow arranged in a joyful balanced swirl; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a cheerful, shareable, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal photo-frame shape at the center of a warm cream square background, containing a simplified glossy silhouette mid-motion, framed by small orbiting rounded mood-icons in orange, pink and yellow like a personality mosaic; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a fun, expressive, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal spinning-wheel shape at the center of a warm cream square canvas, divided into soft colorful wedge segments in orange, indigo, pink and yellow, each wedge topped with a simple rounded persona-symbol, with a glossy light pointer landing precisely on one wedge; the whole wheel is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows, giving a playful, celebratory, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of three soft rounded persona-badge shapes in teal, orange and pink standing in a gentle balanced row on a warm cream square background, each badge glowing with its own small distinct symbol, with playful yellow and indigo confetti-like sparkle accents drifting above them; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a lively, joyful, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-8",
    order: 8,
    name: "İlk 90 Gün Planlayıcı",
    description:
      "Yeni gelenler için görev ve ipuçlarından oluşan kişisel kontrol listesi üreten interaktif planlayıcı. İlk haftalarını organize etmek isteyenler için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal ribbon shape curving gently across a warm cream square canvas like a timeline, with small glowing rounded milestone-dots in orange, indigo, pink and yellow spaced evenly along it, each topped with a tiny simple icon suggesting a house key, a bank card or a speech bubble; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving an organized, hopeful, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal calendar-block shape at the center of a warm cream square background, with the first few day-cells softly highlighted in orange and small glowing rounded checkmark shapes in indigo, pink and yellow appearing above them in a balanced arc; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a fresh-start, organized, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded accordion-like stack of teal, orange, indigo and pink checklist-card shapes, each card slightly fanned out, with small glowing yellow checkmark shapes appearing above the top cards as they are gently ticked off; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving an actionable, satisfying, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal clipboard shape at the center of a warm cream square background, holding several small glossy rounded task-tokens in orange, indigo, pink and yellow stacked neatly, with a soft glowing checkmark hovering above the top token; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, organized, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal calendar shape at the center of a warm cream square canvas, its first few week-blocks gently highlighted in soft orange glow, with small rounded checkmark shapes in indigo, pink and yellow appearing above the highlighted section in a balanced arc; the whole calendar stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a fresh-start, structured, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal roadmap-path shape winding gently across a warm cream square background, dotted with small glowing rounded milestone-markers in orange, indigo, pink and yellow representing early tasks, leading toward a bright horizon glow at the top; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a step-by-step, reassuring, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-9",
    order: 9,
    name: "Önce Hangi Soruna Odaklanmalısın?",
    description:
      "Kullanıcının taşınma sürecindeki ana engelini (vize, dil, iş, konut, yalnızlık) hızlıca belirleyen çok kısa test. Önceliklendirme yapmak isteyenler için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal radar-dish shape at the center of a warm cream square canvas, sweeping a beam of light across several small rounded obstacle-icon shapes (a visa stamp, a speech bubble, a briefcase, a house) in orange, indigo, pink and yellow, with one icon glowing distinctly brighter to show the single biggest priority; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a focused, clarifying, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal target-ring shape at the center of a warm cream square background, with a single glossy orange dot resting precisely at its center while faint dimmer indigo, pink and yellow rings surround it further out; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a decisive, clear, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded tangle of glowing teal, orange, indigo and pink thread-shapes, with one bright yellow thread gently being pulled free from the knot and straightening out toward the top of the frame; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a relieving, clarifying, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal puzzle shape at the center of a warm cream square background, with most pieces still tangled together in soft indigo and pink, while a single glowing orange piece lifts cleanly above the rest to be placed first; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a focused, satisfying, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal spotlight cone gently shining down onto a single glowing orange hurdle-icon shape on a path across a warm cream square canvas, while several dimmer indigo, pink and yellow hurdle-icons fade into the background on either side; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a clear, purposeful, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal lighthouse-beam shape at the center of a warm cream square background, sweeping across a small cluster of rounded obstacle-tokens in orange, indigo, pink and yellow and settling brightly on just one of them; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a guiding, confident, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-10",
    order: 10,
    name: "Yurt Dışında İş Bulma Şansın?",
    description:
      "Becerilerine ve hedef pazara göre o ülkede iş bulma olasılığını tahmin eden motive edici araç. Garanti değil, gerçekçi bir yol haritası sunar.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal gauge-arc shape at the center of a warm cream square canvas, glowing progressively brighter from soft yellow through orange toward a vivid indigo peak to show a rising probability, with small rounded skill-icon shapes in pink and blue feeding gently into its base; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a motivating, confident, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal briefcase shape at the center of a warm cream square background, gently opening as a glowing orange upward arrow rises from within it toward a bright horizon glow, with small indigo, pink and yellow sparkle accents drifting around the arrow in a balanced arrangement; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an encouraging, ambitious, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal resume-silhouette shape at the center of a warm cream square canvas, gently glowing as it rises toward a bright open rounded doorway shape in orange with warm light spilling through it, small indigo, pink and yellow sparkle accents drifting around the ascent; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a hopeful, encouraging, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal key shape at the center of a warm cream square background, gently fitting into a glowing orange keyhole shaped like a briefcase outline, with small rounded sparkle accents in indigo, pink and yellow drifting around the moment of unlocking; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a hopeful, confident, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal bar-of-light shape rising taller and taller across a warm cream square canvas, representing a growing skill-versus-market match, with a small rounded city-skyline silhouette in orange softly visible behind it and indigo, pink and yellow sparkle accents celebrating the peak; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a motivating, energetic, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal open-door shape at the center of a warm cream square background, warm orange light spilling out from it onto a small rounded figure-silhouette stepping through confidently, with indigo, pink and yellow sparkle accents celebrating the moment around the doorway; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a triumphant, motivational, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-11",
    order: 11,
    name: "Almanya'da Sana Hangi Banka Uygun?",
    description:
      "Almanya'daki yaşam sürene, dil seviyene, ücret hassasiyetine ve yatırım/kripto alışkanlıklarına göre 19 banka arasından sana en uygun 3'ünü sıralayan karar aracı. Yeni gelen ve yerleşik Türkler için.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a smooth rounded teal bank-card shape floating at the center of a warm cream square canvas above a simplified rounded skyline silhouette suggesting a German city, with three small glowing rounded bank-badge orbs in orange, indigo and pink ranked on a soft podium beside it, the tallest orb glowing brightest; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a trustworthy, decisive, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a soft rounded teal smartphone shape at the center of a warm cream square background, displaying a simplified glowing rounded card-icon on its screen, surrounded by three small orbiting rounded coin-stack shapes in orange, indigo and pink of different heights representing ranked options; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a modern, reassuring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal balance-scale shape at the center of a warm cream square canvas, one side holding a small glossy stack of orange fee-coins and the other holding a clean glowing indigo mobile-app-icon shape, perfectly balanced, with small pink and yellow SEPA-style transfer-arrows gently flowing between them; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a thoughtful, value-conscious, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal wallet shape at the center of a warm cream square background, gently releasing a stream of small glowing orange coins that curve upward into a rounded indigo piggy-bank shape, with pink and yellow sparkle accents marking savings growth; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a practical, reassuring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal decision-fork shape at the center of a warm cream square canvas, one path leading toward a glowing rounded orange traditional-branch-building silhouette and the other toward a sleek glowing indigo digital-bank orb, with small pink and yellow sparkle accents marking the choice point; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a clear, newcomer-friendly, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal suitcase shape resting beside a glowing rounded orange bank-card shape on a warm cream square background, both connected by a soft dotted indigo path suggesting a newcomer's first financial step, with pink and yellow welcoming sparkle accents nearby; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a welcoming, guided, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
  {
    id: "burak-tool-12",
    order: 12,
    name: "Almanya'da Hangi Sigortalar Sana Şart?",
    description:
      "Çalışma durumun, ailen, araç, konut ve risk profiline göre 12 sigorta türü arasından hangilerinin \"önce al\", \"güçlü öneri\" veya \"opsiyonel\" olduğunu gösteren karar aracı.",
    variants: [
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal protective-shield shape at the center of a warm cream square canvas, gently surrounded by small floating rounded icon-shapes — a health cross, a car, a house, a tooth, a paw and an umbrella — in orange, indigo, pink and yellow, arranged in a balanced circular halo around the shield; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a reassuring, clear, polished financial-protection feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal umbrella shape opening at the center of a warm cream square background, sheltering a small cluster of rounded life-icon shapes — a house, a car outline and a health cross — in orange, indigo and pink beneath it, with soft yellow raindrop-like sparkle accents falling harmlessly around the edges of the umbrella; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a protective, calm, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal checklist-card shape at the center of a warm cream square canvas, with several small glowing rounded insurance-type tokens in orange, indigo, pink and yellow sorted into three gentle tiers by height, the urgent tier glowing brightest at the top; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a clear, organized, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal sorting-funnel shape at the center of a warm cream square background, with several small rounded insurance-icon tokens in orange, indigo, pink and yellow entering from the top and settling into three soft glowing tiers below labeled only by color and glow intensity; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a methodical, reassuring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
      {
        imagePrompts: [
          "A premium modern editorial 3D illustration of a soft rounded teal family-silhouette group at the center of a warm cream square canvas, sheltered beneath a large glowing rounded umbrella shape in orange, with a small rounded car-outline, house-shape and suitcase safely nestled beneath it in indigo, pink and yellow; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, protective, polished family-focused feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
          "A premium modern editorial 3D illustration of a smooth rounded teal shield shape at the center of a warm cream square background, gently overlapping with a small glossy rounded house-shape in orange and a car-outline in indigo tucked safely behind it, with pink and yellow protective glow rings radiating outward in a balanced pattern; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a secure, caring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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

corteqs.net`,
      },
    ],
  },
];
