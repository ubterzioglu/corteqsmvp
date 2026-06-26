// Admin Panel V2 — Test Araçları İçerik Paketi (statik tek kaynak).
// /admin/social-share-vault sayfasının "Test Araçları" sekmesi bu listeden
// beslenir. 10 click-through test aracı; her araç için 3 varyant, her varyant
// 1 metinsiz Canva görsel promptu (İngilizce) + 1 hazır Türkçe LinkedIn postu.
//
// İçerik düzenlemesi BU dosyadan yapılır. Metinler temiz UTF-8 Türkçe + gerçek
// tırnak + emoji olarak tutulur; HTML-entity / mojibake KULLANILMAZ.

export type SocialTestVariant = {
  /** Metinsiz İngilizce Canva promptu (numarasız gövde). */
  canvaPrompt: string;
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
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
        canvaPrompt:
          "A glowing world globe with several countries softly highlighted by warm light beams, a stylized location pin gently descending toward the best-fit region, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, hopeful and aspirational, no text, no letters, no words, no typography.",
        linkedinPost: `🌍 "Nereye taşınsam?" sorusu geceleri uykunu mu kaçırıyor?

5 dakikalık testimizi çöz; kariyerine, bütçene ve yaşam tarzına göre sana en uygun ülkeleri puanlayarak listeleyelim. Tahminle değil, verilerle karar ver.

👉 Ücretsiz kayıt olun!
CorteQS, göç yolculuğunu şansa bırakmıyor; seni doğru ülkeyle ve oradaki Türk topluluğuyla buluşturuyor. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Göç #TürkDiasporası #ÜlkeSeçimi #YurtDışı #CorteQS`,
      },
      {
        canvaPrompt:
          "An abstract radar/compass made of light scanning across a dark map and locking onto one country with a bright glow ring, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, decision-making mood, no text, no letters, no words, no typography.",
        linkedinPost: `✈️ Aynı maaş, üç farklı ülkede üç farklı hayat demek.

Hangi ülke senin için "mükemmel uyum"? CorteQS Ülke Seçimi Aracı; sağlık, güvenlik, dil ve iş piyasası gibi onlarca faktörü senin önceliklerinle eşleştiriyor.

👉 Ücretsiz kayıt olun!
CorteQS, dünyaya açılırken yalnız bırakmaz; testten çıkan her ülkede seni bekleyen bir diaspora ağı var. Güvenle keşfet, güvenle taşın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ÜlkeSeçimi #Diaspora #GöçPlanı #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A split illustration of diverse lifestyle scenes (career skyline, cozy home, sunny coast) floating as glowing cards around a central glowing globe, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, lifestyle-matching feel, no text, no letters, no words, no typography.",
        linkedinPost: `🧭 Göç kararı duygusal değil, stratejik olmalı.

Bütçenden dil becerine, vize durumundan değerlerine kadar her şeyi hesaba katan testimizle sana en uygun 3 ülkeyi öğren. 5 soruda başla, detaylı modda derinleş.

👉 Ücretsiz kayıt olun!
CorteQS, en doğru kararı verebilmen için veriyi ve topluluğu bir araya getiriyor. Bir dizin değil, yaşayan bir rehber.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GöçKararı #ÜlkeTesti #TürkDiasporası #YurtDışıHayat #CorteQS`,
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
        canvaPrompt:
          "An abstract bar-chart landscape made of glowing golden coins/columns of different heights across a stylized map, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, salary-comparison feel, no text, no letters, no words, no typography.",
        linkedinPost: `💰 Aynı işi yapıyorsun ama Berlin'de mi yoksa Toronto'da mı daha çok kazanırsın?

Mesleğini ve deneyimini gir; alanının farklı ülkelerde ne kadar kazandırdığını saniyeler içinde karşılaştır. Hayalini rakamlarla test et.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer kararlarını net verilerle aydınlatıyor ve seni o ülkelerdeki meslektaşlarınla buluşturuyor. Bilgi paylaşıldıkça büyür.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Maaş #Kariyer #TürkDiasporası #YurtDışıİş #CorteQS`,
      },
      {
        canvaPrompt:
          "A balanced scale of light weighing a glowing coin stack against a small house (cost of living), golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, purchasing-power concept, no text, no letters, no words, no typography.",
        linkedinPost: `📊 Yüksek maaş her zaman yüksek refah demek değil.

Maaş Karşılaştırma Aracımız, brüt rakamı değil yaşam maliyetine göre "cebinde kalanı" gösteriyor. Nerede paran gerçekten daha çok eder, öğren.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette kariyerini kurarken hem veriyle hem mentorlarla yanında. Doğru karar, doğru bilgiyle başlar.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YaşamMaliyeti #Maaş #Diaspora #Kariyer #CorteQS`,
      },
      {
        canvaPrompt:
          "A briefcase emitting glowing pathways that branch toward multiple city skylines of different brightness, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, career-value-by-country mood, no text, no letters, no words, no typography.",
        linkedinPost: `🚀 Mesleğin senin pasaportun. Peki dünya onu nasıl değerlendiriyor?

Yazılımcıdan hemşireye, mühendisten öğretmene — alanının küresel maaş haritasını çıkar. Birkaç soruyla başla, kararını güçlendir.

👉 Ücretsiz kayıt olun!
CorteQS, yeteneğinin karşılığını dünyada bulman için yol gösteriyor; her hedef ülkede seni bekleyen bir Türk ağı var. Yalnız değilsin.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#MaaşHaritası #YurtDışıKariyer #TürkDiasporası #İşHayatı #CorteQS`,
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
        canvaPrompt:
          "A glowing readiness gauge/speedometer-like arc of light filling up, surrounded by small icons of suitcase, documents, language bubble, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, self-assessment mood, no text, no letters, no words, no typography.",
        linkedinPost: `🎒 Taşınmaya gerçekten hazır mısın, yoksa sadece hayalini mi kuruyorsun?

5 soruluk hazırlık testimiz; finansından dil becerine, destek ağından risk toleransına kadar seni dürüstçe puanlıyor. Cesur ol, gerçeği gör.

👉 Ücretsiz kayıt olun!
CorteQS, taşınma yolculuğunda sana ayna tutuyor ve eksiklerini kapatacak mentorlarla buluşturuyor. Hazırlıklı giden, güçlü gelir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaHazırlığı #Göç #TürkDiasporası #YurtDışı #CorteQS`,
      },
      {
        canvaPrompt:
          "A checklist made of glowing checkmarks floating above a packed-but-open suitcase, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, preparation feel, no text, no letters, no words, no typography.",
        linkedinPost: `⚖️ Cesaret yeterli mi? Bir de gerçeklik kontrolü yapalım.

Hazırlık Testimiz finansal birikiminden evrak durumuna kadar her şeyi ölçüp "Hazırsın" ya da "Biraz daha hazırlık" diyor. Skorunu öğren, planını yap.

👉 Ücretsiz kayıt olun!
CorteQS, hayalini sağlam temellere oturtman için hem rehberlik hem topluluk sunuyor. Doğru hazırlık, yarı yol demektir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GerçeklikKontrolü #TaşınmaTesti #Diaspora #GöçPlanı #CorteQS`,
      },
      {
        canvaPrompt:
          "A person silhouette standing confidently at a doorway of light stepping from a dim room into a bright path, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, readiness-to-leap mood, no text, no letters, no words, no typography.",
        linkedinPost: `🧠 Taşınmanın en zor kısmı bavul değil, hazır olmak.

Finansal güvence, dil, destek ağı, uyum yeteneği... Hepsini tek testte değerlendir, hangi alanda güçlü hangi alanda eksik olduğunu gör.

👉 Ücretsiz kayıt olun!
CorteQS, her adımında yanında; eksik kaldığın yerde sana yol gösterecek bir diaspora ağı bir tık uzağında. Birlikte daha hazırız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaHazırlığı #YurtDışıHayat #TürkDiasporası #Göç #CorteQS`,
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
        canvaPrompt:
          "A stylized map with several glowing city markers, one pulsing brighter as the best match, soft connecting light lines, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, city-matching mood, no text, no letters, no words, no typography.",
        linkedinPost: `🏙️ Doğru ülkeyi seçtin ama hangi şehir tam sana göre?

Berlin mi Münih mi? İş fırsatından iklime, yaşam maliyetinden Türk topluluğunun büyüklüğüne kadar tercihlerini eşleştirip sana en uygun 3 şehri öğren.

👉 Ücretsiz kayıt olun!
CorteQS, sadece ülkeyi değil, doğru mahalleyi bulmana yardım ediyor ve o şehirdeki Türklerle seni buluşturuyor. Şehrin tanıdık olsun.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirSeçimi #Göç #TürkDiasporası #YurtDışı #CorteQS`,
      },
      {
        canvaPrompt:
          "Three glowing city skyline silhouettes of varying brightness side by side ranked by a soft light podium, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, top-cities ranking feel, no text, no letters, no words, no typography.",
        linkedinPost: `📍 Ülke büyük, ama hayatın bir şehirde kuruluyor.

Şehir Eşleştirme Aracımız; kariyer hub'larından iklime, expat topluluğundan kira seviyesine kadar her detayı tartıp senin şehrini bulur. Birkaç soruyla başla.

👉 Ücretsiz kayıt olun!
CorteQS, gideceğin şehirde seni yalnız bırakmıyor; oradaki diaspora ağı ilk günden yanında. Yeni şehir, tanıdık bir aile.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirEşleştirme #Diaspora #YurtDışıHayat #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A magnifier of light hovering over a cluster of neighborhoods with tiny glowing icons (job, home, climate, community), golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, granular city-fit mood, no text, no letters, no words, no typography.",
        linkedinPost: `🗺️ İki şehir aynı ülkede ama iki ayrı dünya olabilir.

İş piyasası, şehir büyüklüğü, kültür, Türk topluluğu... Senin önceliklerine göre puanlayıp en uygun şehirleri haritada gösteriyoruz. Kararını kolaylaştır.

👉 Ücretsiz kayıt olun!
CorteQS, doğru şehirde doğru bağlantılarla başlaman için hazır; her şehirde yaşayan bir ağ seni bekliyor. Bir dizin değil, bir topluluk.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirRehberi #Göç #TürkDiasporası #YeniHayat #CorteQS`,
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
        canvaPrompt:
          "Two glowing profile orbs connected by a luminous matching line, complementary puzzle-piece glow between them, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, mentor-matching mood, no text, no letters, no words, no typography.",
        linkedinPost: `🤝 Gurbette en kıymetli şey: senden önce o yoldan geçmiş biri.

Diaspora Ağı Eşleştirici; mesleğine, şehrine ve ihtiyacına göre sana en uygun mentoru, iş bağlantısını ya da yol arkadaşını buluyor. Doğru kişi, bir tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık diasporayı akıllı eşleştirmeyle bir araya getiriyor; aradığın insan da seni arıyor olabilir. Birlikte daha güçlüyüz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Networking #Mentorluk #TürkDiasporası #Eşleşme #CorteQS`,
      },
      {
        canvaPrompt:
          "A network constellation of people-icons with bright lines forming between the most compatible nodes, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, community matchmaking feel, no text, no letters, no words, no typography.",
        linkedinPost: `🌐 Tanıdık bir tanıdık beklemek devri bitti.

Ne sunduğunu ve ne aradığını yaz; alan, şehir ve dil uyumuna göre sana en uygun diaspora bağlantılarını puanlayarak getirelim. Saatlerce arama yok, akıllı eşleşme var.

👉 Ücretsiz kayıt olun!
CorteQS, kökenini paylaşan milyonları görünür kılan güven ağı. Yardım istemek de vermek de artık çok kolay.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#DiasporaAğı #Mentorluk #TürkDiasporası #Topluluk #CorteQS`,
      },
      {
        canvaPrompt:
          "A handshake formed of light between a newcomer silhouette and an experienced mentor silhouette across a city backdrop, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, give-and-get help mood, no text, no letters, no words, no typography.",
        linkedinPost: `💡 Sen birine yardım edebilir, biri de sana yol gösterebilir.

Diaspora Eşleştirici, ihtiyaçları ve yetenekleri eşleştiren bir köprü. Yeni gelensen mentor bul, deneyimliysen birine ışık ol.

👉 Ücretsiz kayıt olun!
CorteQS, dayanışmayı bir değer değil bir refleks haline getiriyor; her eşleşme yeni bir kapı. Nerede olursan ol, yanında biri var.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #Networking #Diaspora #TürkDiasporası #CorteQS`,
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
        canvaPrompt:
          "Several glowing career pathways branching from a single bright point toward different icons (lab, laptop, lightbulb, briefcase), golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, career-direction mood, no text, no letters, no words, no typography.",
        linkedinPost: `🎓 Yüksek lisans mı, teknoloji işi mi, kendi girişimin mi?

Kariyer Yolu Testimiz; ilgi alanlarını ve becerilerini analiz edip yurt dışında sana en uygun yolu öneriyor. Yönünü bul, adımını at.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer yolculuğunda hem rehber hem ağ; testten çıkan her yolda sana eşlik edecek mentorlar var. Geleceğin bugünden başlasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kariyer #YurtDışıEğitim #TürkDiasporası #YolHaritası #CorteQS`,
      },
      {
        canvaPrompt:
          "A compass of light whose needle points toward one of several glowing professional persona symbols, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, path-finding feel, no text, no letters, no words, no typography.",
        linkedinPost: `🧭 Yetenekli olmak yetmez; doğru yöne gitmek gerekir.

İlgi alanların, çalışma stilin ve risk toleransın hangi kariyere işaret ediyor? Birkaç soruyla yurt dışındaki en uygun rotanı keşfet.

👉 Ücretsiz kayıt olun!
CorteQS, hedefine giden yolda seni başarılı diaspora profesyonelleriyle buluşturuyor. İlham ve fırsat, tek ağda.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KariyerTesti #YurtDışıKariyer #Diaspora #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A staircase of light rising toward a bright horizon with small milestone glows along the way, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, career-growth-abroad mood, no text, no letters, no words, no typography.",
        linkedinPost: `🚀 Akademi mi, sektör mü, girişim mi? Karar senin, rehber bizden.

Kariyer Yolu Aracı, becerilerini ve hedeflerini eşleştirip sana özel bir yön öneriyor. Belirsizlikte kaybolma; net bir rotayla ilerle.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette kariyerini kurarken yalnız bırakmaz; her alanda sana yol gösterecek bir topluluk hazır. Birlikte daha yükseğe.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KariyerYolu #YurtDışıHayat #TürkDiasporası #Mentorluk #CorteQS`,
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
        canvaPrompt:
          "A playful set of glowing persona badges/symbols (networker, explorer, homebody) floating with sparkles, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, fun personality-quiz mood, no text, no letters, no words, no typography.",
        linkedinPost: `✨ Sen bir "Küresel Networker" mısın yoksa "Sakin Yerli" mi?

Eğlenceli 8 soruluk testimizle yurt dışı yaşam tarzı kişiliğini keşfet. Sonucu arkadaşlarınla paylaş, kim olduğunu gör. Hadi başla!

👉 Ücretsiz kayıt olun!
CorteQS, kişiliğine uyan diaspora kabilesini bulmana yardım ediyor; benzer ruhlar bir tık uzağında. Eğlen, bağlan, ait ol.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KişilikTesti #YurtDışıYaşam #TürkDiasporası #Eğlence #CorteQS`,
      },
      {
        canvaPrompt:
          "A vibrant character silhouette surrounded by lifestyle icons (coffee, plane, city lights, books) in a joyful swirl, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, shareable playful feel, no text, no letters, no words, no typography.",
        linkedinPost: `🎭 Gurbetteki tarzın seni ele veriyor.

Gece hayatı mı sakin kafeler mi? Solo gezi mi tur mu? Cevapların hangi expat kişiliğine uyuyor, öğren ve rozetini kap. 2 dakikalık keyifli test.

👉 Ücretsiz kayıt olun!
CorteQS, seni sana benzeyen insanlarla buluşturan sıcak bir topluluk. Tarzın ne olursa olsun, yerin burada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ExpatKişilik #YaşamTarzı #Diaspora #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A glowing spinning wheel of personality types with a light pointer landing on one, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, gamified quiz mood, no text, no letters, no words, no typography.",
        linkedinPost: `🌟 Aynı şehirde yaşayıp bambaşka hayatlar kurarız. Seninki hangisi?

Macera Avcısı, Kozmopolit Networker, Huzurlu Yerli... Hangi tip sana uyuyor? Eğlenceli testle öğren, sonucu story'ne taşı.

👉 Ücretsiz kayıt olun!
CorteQS, kişiliğine en uygun toplulukları önererek gurbeti eğlenceli kılıyor. Kendini bul, çevreni kur.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YaşamTarzıTesti #YurtDışı #TürkDiasporası #Topluluk #CorteQS`,
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
        canvaPrompt:
          "A glowing 90-day timeline ribbon with milestone dots and small task icons (house key, bank card, language bubble) along it, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, planning mood, no text, no letters, no words, no typography.",
        linkedinPost: `🗓️ Yeni ülkede ilk 90 gün her şeyi belirler. Hazır mısın?

İlk 90 Gün Planlayıcı; konaklamadan banka hesabına, sigortadan dil kursuna kadar sana özel bir görev listesi çıkarıyor. Kaosa değil, plana başla.

👉 Ücretsiz kayıt olun!
CorteQS, yeni hayatının ilk adımlarını düzene sokuyor ve her görevde sana yol gösterecek bir topluluk sunuyor. Sıfırdan değil, destekle başla.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #Planlama #TürkDiasporası #YurtDışı #CorteQS`,
      },
      {
        canvaPrompt:
          "An accordion-like stack of glowing checklist cards being ticked off one by one, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, actionable-plan feel, no text, no letters, no words, no typography.",
        linkedinPost: `✅ "Önce neyi halletmeliyim?" panikleme, listele.

Birkaç soruyla yanıtla; sana hafta hafta önceliklendirilmiş bir yerleşme planı sunalım. İlk hafta, ilk ay, ilk üç ay — hepsi net.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette ilk adımlarını atarken elinden tutuyor; deneyimli komşuların tecrübesi bir tık uzağında. Yalnız uğraşma.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YerleşmePlanı #YeniGelenler #Diaspora #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A calendar made of light with the first weeks gently highlighted and small glowing checkmarks appearing, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, first-days roadmap mood, no text, no letters, no words, no typography.",
        linkedinPost: `📋 Yeni bir ülke, yüzlerce yapılacak iş. Nereden başlanır?

İlk 90 Gün Planlayıcı, durumuna göre kişisel bir kontrol listesi üretiyor — ikamet kaydından okula, sağlıktan sosyal çevreye. Adım adım, stressiz.

👉 Ücretsiz kayıt olun!
CorteQS, yeni başlangıcını kolaylaştırıyor; her görevde sana destek olacak bir diaspora ağı hazır. Birlikte daha kolay.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İlk90Gün #YerleşmeRehberi #TürkDiasporası #Göç #CorteQS`,
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
        canvaPrompt:
          "A glowing radar pinpointing the single biggest obstacle among several dimmer icons (visa, language, job, home), golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, focus-finding mood, no text, no letters, no words, no typography.",
        linkedinPost: `🎯 Her şeyi aynı anda çözmeye çalışınca hiçbiri çözülmüyor.

5 soruluk testimiz, taşınma sürecindeki EN büyük engelini belirliyor: vize mi, dil mi, iş mi, konut mu? Önce neye odaklanman gerektiğini öğren.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık kaygıları net bir önceliğe çeviriyor ve o konuda sana yardımcı olacak mentorlarla buluşturuyor. Önce doğru adım.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Önceliklendirme #Göç #TürkDiasporası #YurtDışı #CorteQS`,
      },
      {
        canvaPrompt:
          "A tangle of glowing threads with one bright thread being pulled out and untangled first, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, prioritization feel, no text, no letters, no words, no typography.",
        linkedinPost: `🧩 Kafanda yüz tane soru var ama hangisi gerçekten acil?

Kısa testimizle en kritik engelini tespit et, enerjini doğru yere harca. Vize evrakı mı, iş arama mı, dil mi — odağını bul.

👉 Ücretsiz kayıt olun!
CorteQS, seni doğru kaynağa ve doğru kişiye yönlendiriyor; engelini aşmış biri zaten ağda seni bekliyor. Yalnız çözme.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TaşınmaEngeli #Odak #Diaspora #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A spotlight of light singling out one glowing hurdle icon on a path while others fade, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, top-challenge clarity mood, no text, no letters, no words, no typography.",
        linkedinPost: `🔦 En büyük engelini bil ki onu aşabilesin.

2 dakikalık testle taşınma sürecindeki bir numaralı zorluğunu belirliyoruz ve sana özel bir başlangıç önerisi sunuyoruz. Net hedef, hızlı çözüm.

👉 Ücretsiz kayıt olun!
CorteQS, her zorlukta yanında; aynı yolu yürümüş bir diaspora ağıyla çözüm hep yakında. Birlikte daha kolay aşarız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#EngelTesti #GöçPlanı #TürkDiasporası #Topluluk #CorteQS`,
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
        canvaPrompt:
          "A glowing probability gauge arc filling toward a bright zone, with small skill icons feeding into it, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, job-odds mood, no text, no letters, no words, no typography.",
        linkedinPost: `📈 Hedef ülkende iş bulma şansın gerçekte ne kadar?

Becerilerini, dilini ve sektör talebini girersek sana gerçekçi bir olasılık ve yol haritası çıkarıyoruz. Hayal değil, plan yap.

👉 Ücretsiz kayıt olun!
CorteQS, iş arama yolculuğunu hem veriyle hem ağla güçlendiriyor; hedef ülkede seni bekleyen profesyoneller var. Doğru bağlantı, doğru iş.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşBulma #Kariyer #TürkDiasporası #YurtDışıİş #CorteQS`,
      },
      {
        canvaPrompt:
          "A resume silhouette glowing and rising toward a bright open door with light spilling through, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, getting-hired-abroad feel, no text, no letters, no words, no typography.",
        linkedinPost: `💼 "Acaba beni işe alırlar mı?" sorusuna veriyle cevap ver.

İş Bulma Olasılığı Aracımız; yeteneklerini pazar talebiyle eşleştirip güçlü ve zayıf yönlerini gösteriyor. Eksiğini gör, şansını artır.

👉 Ücretsiz kayıt olun!
CorteQS, gurbette iş ararken seni mentorlar ve referanslarla buluşturuyor. Şans değil, hazırlık ve ağ kazandırır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşArama #YurtDışıKariyer #Diaspora #TürkDiasporası #CorteQS`,
      },
      {
        canvaPrompt:
          "A bar of light showing skill-vs-market match growing taller, with a city skyline behind, golden-bronze (#aa8c42) primary with six-color pinwheel accents (teal, blue, indigo, pink, orange, yellow) on deep navy, Gen Z modern diaspora aesthetic, motivational job-market mood, no text, no letters, no words, no typography.",
        linkedinPost: `🚪 İş bulmak şans değil, strateji.

Beceri-pazar uyumundan dil seviyene kadar değerlendirip o ülkede işe girme ihtimalini ve nasıl artıracağını söylüyoruz. Motive ol, harekete geç.

👉 Ücretsiz kayıt olun!
CorteQS, kariyer hedefinde yalnız bırakmaz; her hedef ülkede sana kapı açacak bir diaspora ağı hazır. Birlikte daha şanslıyız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İşOlasılığı #Kariyer #TürkDiasporası #YurtDışı #CorteQS`,
      },
    ],
  },
];
