// Admin Panel V2 — Diaspora LinkedIn Postları (statik tek kaynak).
// /admin/social-share-vault sayfasının "Diaspora Postları" sekmesi bu listeden
// beslenir. 50 hazır Türkçe LinkedIn postu + her biri için 1 metinsiz Canva
// görsel promptu (İngilizce). Her post ücretsiz kayıt çağrısı, web + WhatsApp
// linki ve CorteQS kapanışıyla biter.
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
  | "manifesto";

export type DiasporaPost = {
  /** Benzersiz kimlik ("post-1" ... "post-50"). */
  id: string;
  /** Görünüm sırası (1..50). */
  order: number;
  theme: DiasporaPostTheme;
  /** Post başlığı (numarasız). */
  title: string;
  /** Metinsiz İngilizce Canva promptu (numarasız gövde). */
  canvaPrompt: string;
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
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
};

export const DIASPORA_POSTS: DiasporaPost[] = [
  {
    id: "post-1",
    order: 1,
    theme: "gurbet",
    title: "Köprüdeki o koku",
    canvaPrompt:
      "A cinematic dusk scene of the Bosphorus bridge glowing in golden-bronze (#aa8c42) light, seen through a softly blurred window of a faraway apartment, warm tea glass steaming on the sill, deep navy night sky, subtle six-color pinwheel light reflections (teal, blue, indigo, pink, orange, yellow) shimmering on the water, modern Gen Z diaspora mood, emotional and warm, no text, no letters, no words, no typography.",
    linkedinPost: `🌉 Bir çay bardağının buharında bile İstanbul'u görebiliyorsan, gurbettesin demektir.

Binlerce kilometre uzakta uyanıyorsun ama kalbin hâlâ o köprüde. Memleket hasreti utanılacak bir şey değil — kökenin sana "buradayım" demesi.

Ama bu özlemi tek başına taşımak zorunda değilsin. Berlin'de, Toronto'da, Dubai'de aynı hasreti taşıyan binlerce insan var. Onları bulmak artık tek tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, dünyanın dört bir yanındaki Türkleri tek çatı altında buluşturan, güvene dayalı ilk diaspora ağı. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Diaspora #TürkDiasporası #Gurbet #Memleket #CorteQS`,
  },
  {
    id: "post-2",
    order: 2,
    theme: "gurbet",
    title: "Annenin sesi",
    canvaPrompt:
      "A warm close-up of a smartphone screen lying on a kitchen table during a video call, soft golden-bronze glow, an empty second chair across the table symbolizing distance, cozy evening interior, deep navy shadows, faint six-color pinwheel bokeh in the background, intimate Gen Z diaspora aesthetic, emotional, no text, no letters, no words, no typography.",
    linkedinPost: `📞 "İyi misin?" diye soran o ses, dünyanın en güçlü vatanı.

Gurbette en çok özlenen şey bazen bir yemek değil, bir telefonun arkasındaki "yemek yedin mi?" sorusudur.

Ekranlar mesafeyi kapatmaya çalışıyor ama gerçek bir topluluk, yanında fiziksel olarak duran insanlardır. Bulunduğun şehirde seni anlayan birini bulmak, o boşluğu doldurmanın ilk adımı.

👉 Ücretsiz kayıt olun!
CorteQS, "yalnız değilsin" hissini bir slogan değil, gerçek bir ağa dönüştürüyor — şehir şehir, insan insan.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Gurbet #TürkDiasporası #Özlem #Topluluk #CorteQS`,
  },
  {
    id: "post-3",
    order: 3,
    theme: "gurbet",
    title: "Aynı ay",
    canvaPrompt:
      "A split-sky composition: a glowing full moon over a European city skyline on one side and over Anatolian hills on the other, connected by a flowing golden-bronze ribbon of light, deep navy night, delicate six-color pinwheel stars (teal, blue, indigo, pink, orange, yellow), modern minimalist diaspora mood, no text, no letters, no words, no typography.",
    linkedinPost: `🌙 Baktığın ay, annenin baktığı ayla aynı.

Gurbet, mesafeyi öğretir ama aynı zamanda bir gerçeği de hatırlatır: Aynı gökyüzünün altındayız. T.C. Dışişleri Bakanlığı verilerine göre yurt dışında 7,5 milyondan fazla Türk vatandaşı yaşıyor. Yani sen yalnız değilsin — sadece henüz birbirinizi bulmadınız.

👉 Ücretsiz kayıt olun!
CorteQS, görünmez bir ağla birbirine bağlı bu büyük aileyi görünür kılıyor. Kökenini paylaşan milyonlar, artık bir arama kadar yakın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkDiasporası #Diaspora #Gurbet #Aidiyet #CorteQS`,
  },
  {
    id: "post-4",
    order: 4,
    theme: "kimlik",
    title: "İki dünya bir kalp",
    canvaPrompt:
      "A symbolic double-exposure portrait silhouette of a young person, one half blending into a European urban texture, the other half into warm Anatolian patterns, unified by golden-bronze tones, deep navy background, six-color pinwheel accent threads weaving the two halves together, contemporary Gen Z identity aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌍 İki dilde rüya görüyorsun. İki kültürde de "yabancı" hissettiğin anlar oluyor. Ama aslında ikisinin de zenginliğini taşıyorsun.

İkinci ve üçüncü kuşak için kimlik, bir "ya o ya bu" sorusu değil. Hem buralı hem oralı olmak bir kayıp değil, bir süper güç.

👉 Ücretsiz kayıt olun!
CorteQS, köklerini kaybetmeden geleceğini kurmak isteyen yeni nesil için tasarlandı. Kim olduğunu unutmadan, nereye gideceğini birlikte keşfedelim.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İkinciKuşak #Kimlik #TürkDiasporası #İkiKültür #CorteQS`,
  },
  {
    id: "post-5",
    order: 5,
    theme: "kimlik",
    title: "Dedemin valizi",
    canvaPrompt:
      "A vintage leather suitcase from the 1960s gastarbeiter era resting on a modern minimalist floor, soft golden-bronze spotlight, a single old photograph and a smartphone placed side by side on top, deep navy ambient background, subtle six-color pinwheel light leak, nostalgic-yet-modern Gen Z diaspora storytelling mood, no text, no letters, no words, no typography.",
    linkedinPost: `🧳 1961'de imzalanan işgücü anlaşmasıyla bir valizle başladı her şey. Bugün biz o yolculuğun üçüncü, dördüncü kuşağıyız.

Dedelerimiz "misafir işçi" olarak gitti, kalıcı oldu, koca bir diaspora kurdu. Onlar dernek çatısı altında birbirini buldu. Peki bizim kuşağın "köy kahvesi" nerede?

👉 Ücretsiz kayıt olun!
CorteQS, dedelerimizin dayanışmasını dijital çağa taşıyor — aynı sıcaklık, yeni bir adres. Geçmişimize saygı, geleceğimize yatırım.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Gastarbeiter #TürkDiasporası #Kuşaklar #Göç #CorteQS`,
  },
  {
    id: "post-6",
    order: 6,
    theme: "kimlik",
    title: "İsmini doğru söyleyen biri",
    canvaPrompt:
      "A warm handshake between two diverse young professionals in a modern co-working space, golden-bronze rim light on their hands, deep navy interior, soft six-color pinwheel reflection on a glass wall behind them, authentic Gen Z networking diaspora vibe, no text, no letters, no words, no typography.",
    linkedinPost: `🤝 İsmini ilk seferde doğru telaffuz eden biriyle tanışmanın huzurunu bilir misin?

Gurbette bazen en küçük şey en büyük rahatlamadır: aynı esprileri anlayan, aynı acıları bilen, "anladım seni" diyebilen biri.

👉 Ücretsiz kayıt olun!
CorteQS'te bağ kurduğun kişi sadece bir "kontak" değil; aynı kökten, aynı hikâyeden gelen bir yol arkadaşı. Güven, tanıdıklıkla başlar.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kimlik #TürkDiasporası #Networking #Aidiyet #CorteQS`,
  },
  {
    id: "post-7",
    order: 7,
    theme: "ulke-dagilimi",
    title: "Almanya'da bir Türkiye",
    canvaPrompt:
      "A stylized glowing map of Germany rendered in deep navy, with golden-bronze light nodes pulsing over major cities (Berlin, Köln, Frankfurt), connected by thin six-color pinwheel network lines, modern data-visualization diaspora aesthetic, premium Gen Z feel, no text, no letters, no words, no typography.",
    linkedinPost: `🇩🇪 Almanya'da DESTATIS 2024 verilerine göre yalnızca Türk vatandaşlığına sahip 1.385.000 kişi, Alman pasaportlu Türkiye kökenli 1.638.000 kişi ve 338.000 çifte vatandaş yaşıyor — toplamda 3 milyonu aşan bir nüfus (Perspektif.eu, Ekim 2025).

Bu, koca bir şehir değil — koca bir ülke nüfusu! Peki bu kadar kalabalıkken neden hâlâ "tanıdık bulmak" bu kadar zor?

👉 Ücretsiz kayıt olun!
CorteQS, Almanya'daki bu devasa ağı şehir bazında haritalandırıyor. Kalabalığın içinde kaybolma; kendi insanını tek aramada bul.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Almanya #TürkDiasporası #Gurbetçi #Berlin #CorteQS`,
  },
  {
    id: "post-8",
    order: 8,
    theme: "ulke-dagilimi",
    title: "Avrupa'nın dört bir yanı",
    canvaPrompt:
      "An elegant abstract map of Western Europe in deep navy, golden-bronze glowing dots over France, Netherlands, Austria, Belgium, UK, linked by luminous six-color pinwheel threads forming a web, sophisticated diaspora network visualization, modern Gen Z minimalism, no text, no letters, no words, no typography.",
    linkedinPost: `🇪🇺 Perspektif.eu/DESTATIS derlemesine (Ekim 2025) göre Fransa'da ~700 bin, Hollanda'da ~500 bin, İngiltere'de ~400 bin, Belçika'da ~240 bin Türk; Statistik Austria 2025 raporuna göre Avusturya'da 124.788 Türk vatandaşı (Türkiye kökenli Avusturya vatandaşları hariç).

Batı Avrupa, 6 milyonu aşkın Türk için adeta ikinci vatan oldu. Ama bu güç, ancak birbirine bağlandığında anlam kazanıyor.

👉 Ücretsiz kayıt olun!
CorteQS, Berlin'den Paris'e, Rotterdam'dan Viyana'ya uzanan bu ağı tek bir güven zemininde buluşturuyor. Dağınık değil, birlikte güçlüyüz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Avrupa #TürkDiasporası #Diaspora #Gurbet #CorteQS`,
  },
  {
    id: "post-9",
    order: 9,
    theme: "ulke-dagilimi",
    title: "Körfez'den Pasifik'e",
    canvaPrompt:
      "A panoramic globe view at night focusing on the arc from Dubai's skyline to Sydney's harbor to Toronto, golden-bronze flight-path arcs connecting the cities over deep navy oceans, six-color pinwheel light pulses at each hub, aspirational global Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌏 Türk diasporası artık sadece Avrupa değil. Perspektif.eu derlemesine göre ABD'de yaklaşık 300 bin Türk yaşıyor (topluluk kuruluşu Turkish Coalition of America bu sayıyı 350-500 bin olarak tahmin ediyor); Statistics Canada 2021 Sayımı'na göre Kanada'da ~76.000 Türk kökenli; ABS 2021 Sayımı'na göre Avustralya'da 87.164 Türk kökenli yaşıyor.

Dünyanın her köşesine dağıldık. Ama dağılmak, kopmak zorunda değil.

👉 Ücretsiz kayıt olun!
CorteQS, Dubai'den Sidney'e, Toronto'dan Los Angeles'a — 251 ülkeye yayılan Türkleri tek ağda buluşturuyor. Mesafe artık bir engel değil.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dubai #Avustralya #Kanada #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-10",
    order: 10,
    theme: "dil",
    title: "Anne, su alabilir miyim?",
    canvaPrompt:
      "A tender scene of a parent and small child reading a picture book together on a sofa, warm golden-bronze lamplight, deep navy evening room, a soft six-color pinwheel mobile hanging above, heartfelt Gen Z family diaspora mood, no text, no letters, no words, no typography.",
    linkedinPost: `🗣️ Çocuğun "Mummy, can I have water?" dediğinde içinde o tatlı burukluğu hisseden herkese:

Türkçeyi yaşatmak, çocuğuna sadece bir dil değil, bir kimlik, bir köprü hediye etmektir. Bir insan ancak dili kadar derin hissedebilir.

👉 Ücretsiz kayıt olun!
CorteQS'te Türkçe etkinlikler, anne-baba toplulukları ve dil destek gruplarıyla çocuğunun kökleriyle bağını canlı tut. Yalnız uğraşmana gerek yok.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Türkçe #Anadil #TürkDiasporası #İkiDillilik #CorteQS`,
  },
  {
    id: "post-11",
    order: 11,
    theme: "dil",
    title: "Ninniden masala",
    canvaPrompt:
      "An open children's storybook glowing with golden-bronze light, soft illustrated Anatolian motifs floating out of the pages like fireflies in six pinwheel colors, deep navy bedroom backdrop, dreamy nurturing Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `📖 "Dandini dandini dastana" diye başlayan ninniler, bir kuşaktan diğerine taşınan en değerli miras.

Yurt dışında doğan çocuklara Türkçeyi sevdirmek; masallarla, türkülerle, bayram sofralarıyla mümkün. Önemli olan, bu işi paylaşacak bir topluluğun olması.

👉 Ücretsiz kayıt olun!
CorteQS, dilini ve kültürünü yaşatmak isteyen ailelere şehir bazlı topluluklar ve gerçek bağlantılar sunuyor. Kökler güçlüyse dallar her yere uzanır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Anadil #Türkçe #TürkDiasporası #ÇocukEğitimi #CorteQS`,
  },
  {
    id: "post-12",
    order: 12,
    theme: "mutfak",
    title: "Annemin sarması",
    canvaPrompt:
      "A beautifully styled plate of stuffed grape leaves (sarma) and Turkish dishes on a rustic table, steam rising, warm golden-bronze food photography lighting, deep navy background, a faint six-color pinwheel napkin detail, mouth-watering Gen Z food aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🍽️ Gurbette malzemeyi bulursun ama o tadı bir türlü tutturamazsın. Çünkü eksik olan baharat değil — annenin eli.

Türk mutfağı, gurbetçinin en derin özlemlerinden biri. Ama o lezzeti paylaşacak bir sofra arkadaşı bulmak, özlemi bayrama çevirir.

👉 Ücretsiz kayıt olun!
CorteQS'te şehrindeki Türk lokantalarını, ev yemeği yapan komşuları ve sofra arkadaşlarını keşfet. Lezzet paylaşıldıkça çoğalır.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkMutfağı #Gurbet #TürkDiasporası #Lezzet #CorteQS`,
  },
  {
    id: "post-13",
    order: 13,
    theme: "mutfak",
    title: "Bir simit, bir çay",
    canvaPrompt:
      "A close-up of a sesame simit and a tulip-shaped tea glass on a marble counter, soft morning golden-bronze sunlight, deep navy shadowed kitchen behind, subtle six-color pinwheel steam swirl, cozy nostalgic Gen Z breakfast diaspora mood, no text, no letters, no words, no typography.",
    linkedinPost: `🥯 Bir simit ve bir bardak çay. Aslında çok basit. Ama gurbette bu ikili, bir sabahı memlekete çeviriyor.

Yurt dışında "nerede simit bulurum?" sorusu, aslında "nerede kendimi evimde hissederim?" sorusudur.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı ve Cadde modülleriyle şehrindeki Türk fırınını, marketini ve esnafını anında bul. Memleket lezzetleri bir tık uzağında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Simit #Çay #TürkMutfağı #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-14",
    order: 14,
    theme: "bayram",
    title: "Gurbette arife sabahı",
    canvaPrompt:
      "A serene early-morning scene of a person standing by a window in formal clothes looking out over a quiet foreign city at dawn, warm golden-bronze sunrise, deep navy fading night, faint six-color pinwheel light on the glass, emotional bayram-morning diaspora mood, no text, no letters, no words, no typography.",
    linkedinPost: `🌅 Gurbette bayram sabahı buruk başlar. Etraftaki herkes normal bir iş gününe uyanırken, sen içinde koca bir bayram taşırsın.

Çocukken kapı kapı şeker topladığın o sokaklar çok uzakta. Ama aynı özlemi paylaşan komşuların belki çok yakında.

👉 Ücretsiz kayıt olun!
CorteQS, gurbetteki bayramı yalnızlıktan kurtarıyor; şehrindeki buluşmaları, bayramlaşmaları ve toplulukları tek yerde topluyor. Bayram paylaşılınca bayram olur.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Bayram #Gurbet #TürkDiasporası #Ramazan #CorteQS`,
  },
  {
    id: "post-15",
    order: 15,
    theme: "bayram",
    title: "Baklava kokusu",
    canvaPrompt:
      "A golden tray of fresh baklava glistening with syrup under warm golden-bronze light, a softly lit Ramadan-evening table, deep navy ambient room, delicate six-color pinwheel lantern glow in the background, festive Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🍯 Almanya'da bir Türk için baklava kokusu, bayramın habercisidir. O koku evi memlekete çevirir.

Ramazan ve Kurban Bayramı gurbette dini olduğu kadar kültürel bir bağ. Bir iftar sofrası paylaşmak, binlerce kilometreyi siler.

👉 Ücretsiz kayıt olun!
CorteQS, şehrindeki iftar buluşmalarını, bayram etkinliklerini ve dayanışma ağlarını keşfetmeni sağlıyor. Sofranı büyüt, yalnızlığını küçült.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Ramazan #Bayram #İftar #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-16",
    order: 16,
    theme: "gelenek",
    title: "Gurbette kına gecesi",
    canvaPrompt:
      "An elegant henna-night setup with red and gold decorative elements, ornate candles, a decorated henna tray, warm golden-bronze celebratory glow, deep navy evening backdrop, six-color pinwheel fabric and light accents, joyful modern Turkish wedding tradition aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🔥 Kına gecesi, Orta Asya'dan bugüne taşınan bir uğurlama töreni — sevginin ve sadakatin sembolü. Avrupa'nın dört bir yanında hâlâ yaşatılıyor.

Gurbette bir kına, bir düğün, bir sünnet... Bunları doğru yapacak, doğru insanları bulacak bir ağa ihtiyacın var.

👉 Ücretsiz kayıt olun!
CorteQS'te düğün organizatöründen müzisyene, kına malzemecisinden fotoğrafçıya — kültürel etkinliğin için ihtiyacın olan herkesi bul. Geleneğimiz, güven ağıyla yaşıyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Kına #Düğün #Gelenek #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-17",
    order: 17,
    theme: "basari",
    title: "Vadideki Türkler",
    canvaPrompt:
      "A confident young professional standing on a rooftop overlooking a global tech city skyline at golden hour, golden-bronze rim light, deep navy sky, six-color pinwheel light streaks symbolizing ambition, aspirational Gen Z success diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🚀 Silikon Vadisi'nden Londra finans merkezlerine, Avrupa parlamentolarından dünya üniversitelerine — Türkler her alanda yükseliyor. Anadolu Ajansı'na göre (Nisan 2024) Avrupa genelinde 2.427 Türk kökenli siyasetçi görev yapıyor: hükümet düzeyinde 2 bakan ve 2 devlet sekreteri, Avrupa Parlamentosu'nda 7, belediye meclislerinde 2.245 üye.

Başarı bireysel başlar ama topluluğun gücüyle katlanır.

👉 Ücretsiz kayıt olun!
CorteQS, başarılı diaspora profesyonellerini yeni nesille buluşturuyor — 80+ kategoride mentorluk, ilham ve fırsat. Birlikte daha yükseğe.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#BaşarıHikayesi #TürkDiasporası #Mentorluk #Kariyer #CorteQS`,
  },
  {
    id: "post-18",
    order: 18,
    theme: "basari",
    title: "Garajdan dünyaya",
    canvaPrompt:
      "A symbolic image of a small glowing seedling growing into a luminous network tree, golden-bronze trunk, branches ending in six-color pinwheel lights (teal, blue, indigo, pink, orange, yellow), deep navy background, inspirational entrepreneurial Gen Z diaspora metaphor, no text, no letters, no words, no typography.",
    linkedinPost: `🌱 Pek çok küresel marka, bir göçmenin küçük bir fikriyle başladı. Yurt dışındaki Türkler de teknolojiden gastronomiye, modadan bilime sayısız başarıya imza atıyor.

Senin de bir hikâyen var. Onu büyütecek doğru bağlantılar bir tık uzağında.

👉 Ücretsiz kayıt olun!
CorteQS, hayalini büyütmek isteyen girişimcileri, yatırımcıları ve danışmanları tek ağda buluşturuyor. Fikrin senden, ağ bizden.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Girişimcilik #TürkDiasporası #Başarı #İlham #CorteQS`,
  },
  {
    id: "post-19",
    order: 19,
    theme: "yeni-gelenler",
    title: "İlk hafta",
    canvaPrompt:
      "A young person with a suitcase standing at the entrance of an unfamiliar modern city, soft uncertain golden-bronze dawn light, deep navy urban shadows, a faint six-color pinwheel signpost glow guiding forward, hopeful new-arrival Gen Z diaspora mood, no text, no letters, no words, no typography.",
    linkedinPost: `🧭 Yeni bir ülkeye taşındığın ilk hafta: Banka nasıl açılır? Doktor nereye? SIM kart nereden? Her şey bir bilinmez.

Kültür şoku gerçek. Ama "buraya hiç ait değilim" hissini, daha önce aynı yoldan geçmiş biri saniyede dağıtabilir.

👉 Ücretsiz kayıt olun!
CorteQS, yeni gelenlere şehir elçileri ve deneyimli komşularla anında rehberlik sunuyor. Sıfırdan başlama; senden önce gelenlerin tecrübesiyle başla.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#YeniGelenler #Oryantasyon #TürkDiasporası #Gurbet #CorteQS`,
  },
  {
    id: "post-20",
    order: 20,
    theme: "yeni-gelenler",
    title: "Şehir elçisi",
    canvaPrompt:
      "A welcoming scene of an experienced local handing a glowing golden-bronze key to a newcomer in a warm city café, deep navy interior, six-color pinwheel reflections on the window, trust and guidance Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🗝️ Her şehirde, yolunu yeni bulanlara rehberlik eden birileri olsa? CorteQS'te var: Şehir Elçileri.

Bulunduğun şehirde güveni inşa eden, sana yolu gösteren tanıdık yüzler. Çünkü gurbette en değerli şey, "ben buradayım, sor" diyen biridir.

👉 Ücretsiz kayıt olun!
CorteQS, şehir elçileriyle yeni gelenleri yerel hayata bağlıyor — güvenli, sıcak, gerçek. Bir dizin değil, yaşayan bir ağ.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#ŞehirElçisi #TürkDiasporası #YeniGelenler #Topluluk #CorteQS`,
  },
  {
    id: "post-21",
    order: 21,
    theme: "isletme",
    title: "Mahallenin Türk esnafı",
    canvaPrompt:
      "A vibrant storefront of a Turkish-owned shop glowing warmly at dusk, golden-bronze signage light (blank, no letters), deep navy street, six-color pinwheel string lights, bustling authentic Gen Z diaspora small-business aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🛒 Yurt dışındaki her Türk fırını, market, kuaför, lokanta — aslında bir köşe başı vatanı.

Türk esnafı, gurbette hem ekonomiye hem kültüre köprü. Ama görünür olmazsa, en güzel dükkân bile keşfedilmeden kalır.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülüyle işletmeni dünyaya aç, müşterini bul, esnaf dayanışmasına katıl. Kendi insanını desteklemek, kendini desteklemektir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkEsnafı #İşletme #Çarşı #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-22",
    order: 22,
    theme: "isletme",
    title: "Kendi işini kur",
    canvaPrompt:
      "A determined young entrepreneur arranging products in a bright modern shop, golden-bronze daylight, deep navy accent walls, a subtle six-color pinwheel logo glow on a blank sign, empowering Gen Z diaspora business aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `💼 Gurbette girişimci olmak cesaret ister: dil, bürokrasi, sıfırdan müşteri... Ama yalnız yürümek zorunda değilsin.

Diaspora, en güçlü ilk müşteri kitlen ve en sadık destekçindir.

👉 Ücretsiz kayıt olun!
CorteQS, girişimcileri danışmanlar, yatırımcılar ve müşterilerle aynı güven ağında buluşturuyor. İşini büyütmek için ihtiyacın olan herkes burada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Girişimcilik #TürkDiasporası #İşKurmak #Çarşı #CorteQS`,
  },
  {
    id: "post-23",
    order: 23,
    theme: "ogrenci",
    title: "Erasmus macerası",
    canvaPrompt:
      "A cheerful group of students with backpacks walking across a European university campus at golden hour, golden-bronze warm light, deep navy sky, six-color pinwheel confetti-like light specks, youthful adventurous Gen Z study-abroad aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🎓 Türkiye'den her yıl yaklaşık 15 bin üniversite öğrencisi Erasmus+ ile yurt dışına gidiyor (Türkiye Ulusal Ajansı). Yeni şehir, yeni dil, yeni hayat — heyecan verici ama bir o kadar da yalnız.

İlk günlerde "burada kimi tanıyorum?" sorusu can sıkar. Cevabı CorteQS'te.

👉 Ücretsiz kayıt olun!
CorteQS, öğrencileri gittikleri şehirdeki Türk topluluğuyla, abilerle ablalarla buluşturuyor. Yabancı bir şehir, tanıdık bir aileye dönüşsün.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Erasmus #Öğrenci #TürkDiasporası #YurtDışıEğitim #CorteQS`,
  },
  {
    id: "post-24",
    order: 24,
    theme: "ogrenci",
    title: "İlk diploma, ilk gurbet",
    canvaPrompt:
      "A graduation cap resting on a stack of books beside a small Turkish tea glass, warm golden-bronze study-desk light, deep navy room, six-color pinwheel bokeh from a window, ambitious yet warm Gen Z student diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `📚 Ailenden uzakta okumak büyük bir adım. Maddi kaygı, dil engeli, yalnızlık... Ama doğru destekle bu yolculuk bir kariyere dönüşür.

Senden önce o üniversitede okuyan biri, sana altın değerinde tavsiyeler verebilir.

👉 Ücretsiz kayıt olun!
CorteQS, öğrencileri mezunlarla, mentorlarla ve staj fırsatlarıyla buluşturuyor — eğitimden iş hayatına kesintisiz bir köprü. Geleceğin bugünden başlasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Öğrenci #YurtDışıEğitim #Mentorluk #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-25",
    order: 25,
    theme: "networking",
    title: "Doğru kişi, doğru an",
    canvaPrompt:
      "An overhead view of diverse hands connecting puzzle pieces that glow in golden-bronze and six pinwheel colors on a deep navy table, modern professional networking metaphor, clean Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🔗 İş hayatında en büyük fark: doğru kişiyi doğru anda tanımak.

Gurbette referans bulmak, kapı açmak, sektörde tanınmak — hepsi bir ağ meselesi. Ve o ağ, kökenini paylaşan insanlarla daha hızlı kurulur.

👉 Ücretsiz kayıt olun!
CorteQS'te yazılımcıdan avukata, doktordan akademisyene 80+ kategoride profesyonelleri tek aramada bul. Networking artık tesadüfe kalmıyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Networking #Kariyer #TürkDiasporası #İşDünyası #CorteQS`,
  },
  {
    id: "post-26",
    order: 26,
    theme: "mentorluk",
    title: "Bir tavsiye, bir kariyer",
    canvaPrompt:
      "A mentor and mentee sitting across a sleek table in a bright office, a glowing golden-bronze lightbulb hovering between them, deep navy background, six-color pinwheel glow on the wall, professional Gen Z mentorship diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌟 Bazen bir kişinin "şunu dene" demesi, aylarca süren iş aramayı kısaltır.

Yurt dışında iş bulmak CV'den ibaret değil; kültürü, sistemi ve kapıları bilen birinin desteğiyle çok daha kolay.

👉 Ücretsiz kayıt olun!
CorteQS, deneyimli profesyonelleri kariyerine yön arayanlarla buluşturuyor. Mentorluk, gurbette en kıymetli sermaye. Bilgi paylaşıldıkça büyür.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Mentorluk #İşBulma #Kariyer #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-27",
    order: 27,
    theme: "aidiyet",
    title: "Kalabalıkta yalnızlık",
    canvaPrompt:
      "A single figure standing amid a blurred busy crowd in a city square, the figure softly lit in warm golden-bronze while the crowd fades into deep navy, one distant six-color pinwheel light offering hope, emotional Gen Z diaspora loneliness-to-belonging aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌫️ Gurbet bazen en kalabalık caddede bile hissedilen bir eksikliktir. Etrafın insan dolu ama "beni anlayan kim?" diye sorarsın.

Bu his çok yaygın — ve çok da çözülebilir. Çünkü aidiyet, doğru topluluğu bulmakla başlar.

👉 Ücretsiz kayıt olun!
CorteQS, "kalabalıkta yalnızlık" hissini gerçek bağlantılara dönüştürüyor. Seni anlayan insanlar düşündüğünden çok daha yakında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Aidiyet #Yalnızlık #TürkDiasporası #Topluluk #CorteQS`,
  },
  {
    id: "post-28",
    order: 28,
    theme: "aidiyet",
    title: "Buraya aitim",
    canvaPrompt:
      "A warm circle of diverse friends laughing together around a table with tea glasses, golden-bronze cozy light, deep navy evening setting, six-color pinwheel garland above, heartfelt belonging Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🫂 Aidiyet, bir yere değil bir insana ait olmaktır bazen. Bir sofraya, bir gülüşe, bir "hoş geldin"e.

Nerede yaşarsan yaşa, seni "biz"den sayan bir topluluk bulduğunda gurbet biter, vatan başlar.

👉 Ücretsiz kayıt olun!
CorteQS, dünyanın neresinde olursan ol sana ait bir topluluk sunuyor — şehir bazlı, sıcak ve gerçek. Kökenin nerede, evin orada.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Aidiyet #Topluluk #TürkDiasporası #Gurbet #CorteQS`,
  },
  {
    id: "post-29",
    order: 29,
    theme: "geri-donus",
    title: "Geri dönsem mi?",
    canvaPrompt:
      "A symbolic image of a crossroad at golden hour, one path leading toward a European city and another toward Anatolian landscapes, a figure pausing in the middle, golden-bronze light, deep navy sky, six-color pinwheel signpost glow, contemplative Gen Z diaspora decision aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🛤️ "Geri dönsem mi, kalsam mı?" Bu soru, gurbetteki herkesin bir kez olsun zihnini kemirir.

Geri göç; vatan özlemi, kültürel aidiyet, çocukların geleceği... Karmaşık bir karar. Ve en iyisi, aynı kararı vermiş insanlarla konuşarak verilir.

👉 Ücretsiz kayıt olun!
CorteQS, hem kalanları hem dönenleri buluşturuyor; deneyimden beslenen gerçek bir karar ağı. Yalnız karar verme, birlikte değerlendir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#GeriDönüş #TersineGöç #TürkDiasporası #Karar #CorteQS`,
  },
  {
    id: "post-30",
    order: 30,
    theme: "geri-donus",
    title: "İki vatan arası",
    canvaPrompt:
      "A heart-shaped composition split between a European cityscape and a Turkish coastal town, joined by a golden-bronze bridge of light over deep navy, six-color pinwheel birds flying between them, emotional dual-homeland Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `❤️ Bir ayağın burada, bir ayağın orada. İki vatan arasında yaşamak hem zenginlik hem de sürekli bir iç hesaplaşma.

Kal ya da dön — her iki durumda da bir topluluğa ihtiyacın var. Çünkü aidiyet, coğrafyadan önce insanla kurulur.

👉 Ücretsiz kayıt olun!
CorteQS, iki vatan arasında köprü kuran herkesi tek ağda topluyor. Nerede olursan ol, bağın hiç kopmasın.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İkiVatan #GeriDönüş #TürkDiasporası #Aidiyet #CorteQS`,
  },
  {
    id: "post-31",
    order: 31,
    theme: "etkinlik",
    title: "Bir araya geldiğimizde",
    canvaPrompt:
      "A lively cultural festival scene with people in a community hall, colorful banners (blank), folk dance silhouettes, warm golden-bronze stage light, deep navy hall, six-color pinwheel decorations, joyful Gen Z diaspora community-event aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🎉 Bir festival, bir dernek gecesi, bir halk oyunları gösterisi... Gurbette kültürü yaşatmanın en güzel yolu bir araya gelmek.

Ama bu etkinlikleri duymak, ulaşmak, katılmak çoğu zaman şansa kalıyor. Olmamalı.

👉 Ücretsiz kayıt olun!
CorteQS, şehrindeki dernekleri, vakıfları ve kültürel etkinlikleri tek yerde topluyor. Topluluk hayatına katılmak hiç bu kadar kolay olmamıştı.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Etkinlik #Dernek #TürkDiasporası #Kültür #CorteQS`,
  },
  {
    id: "post-32",
    order: 32,
    theme: "etkinlik",
    title: "Kültürümüz görünür olsun",
    canvaPrompt:
      "A vibrant outdoor cultural fair with food stalls and string lights at dusk, warm golden-bronze glow, deep navy sky, six-color pinwheel flags fluttering, energetic Gen Z diaspora cultural-celebration aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌟 Türk kültürü; mutfağıyla, müziğiyle, misafirperverliğiyle dünyada görülmeyi hak ediyor. Her festival, her etkinlik bir gurur vesilesi.

Kültürümüzü yaşatmak, onu paylaşacak bir toplulukla mümkün.

👉 Ücretsiz kayıt olun!
CorteQS, kültürel etkinlikleri ve toplulukları tek ekosistemde buluşturarak kültürümüzü görünür kılıyor. Bir aradayken daha güçlü, daha gururluyuz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Festival #Kültür #TürkDiasporası #Gurur #CorteQS`,
  },
  {
    id: "post-33",
    order: 33,
    theme: "carsi",
    title: "Taşınırken",
    canvaPrompt:
      "A bright apartment mid-move with neatly stacked boxes and furniture, warm golden-bronze daylight, deep navy accent wall, a glowing six-color pinwheel marketplace icon floating subtly, practical modern Gen Z diaspora moving aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `📦 Yurt dışında taşınmak pahalı ve yorucu. Eşya almak, satmak, devretmek... Hepsi güvenilir bir alıcı-satıcı meselesi.

Tanımadığın birinden almak yerine, kendi topluluğundan güvenle alışveriş yapmak varken neden riske giresin?

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülü, kullanıcıdan kullanıcıya güvenli pazaryeri sunuyor — ev eşyasından arabaya, her şey güven ağında. Alışveriş artık tanıdık eller arasında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Çarşı #İkinciEl #TürkDiasporası #Pazaryeri #CorteQS`,
  },
  {
    id: "post-34",
    order: 34,
    theme: "carsi",
    title: "Sıfırdan yuva",
    canvaPrompt:
      "A cozy newly furnished living room being arranged, a person placing a plant on a shelf, warm golden-bronze home light, deep navy walls, six-color pinwheel cushion accents, heartwarming Gen Z diaspora home-building aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🏡 Gurbette sıfırdan bir yuva kurmak; bir koltuk, bir halı, bir çaydanlıkla başlar. Ve her parça, güvendiğin birinden gelince daha değerli.

Yeni evini kurarken, topluluğun elinden tutar.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülünde ihtiyacın olan her şeyi kendi insanından, güvenle bul. Yuvanı kurarken yalnız değilsin.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#EvKurma #Çarşı #TürkDiasporası #Yuva #CorteQS`,
  },
  {
    id: "post-35",
    order: 35,
    theme: "dayanisma",
    title: "Cuma buluşması",
    canvaPrompt:
      "A serene exterior of a modern mosque at golden hour with people gathering peacefully, warm golden-bronze sky, deep navy dusk, soft six-color pinwheel light reflections, respectful spiritual Gen Z diaspora community aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🕌 Gurbette cami, sadece bir ibadet yeri değil; bir buluşma, bir dayanışma, bir "memleket köşesi"dir.

Manevi bağ kadar, insanlar arası bağ da güç verir. Birlikte dua etmek kadar birbirine destek olmak da değerli.

👉 Ücretsiz kayıt olun!
CorteQS, manevi toplulukları ve dayanışma ağlarını bir araya getiriyor. Gönül bağı, güven ağıyla daha da güçlenir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #Topluluk #TürkDiasporası #ManeviBağ #CorteQS`,
  },
  {
    id: "post-36",
    order: 36,
    theme: "dayanisma",
    title: "Zor günde yanında",
    canvaPrompt:
      "Many hands joining together to form a supportive circle, glowing golden-bronze at the center, deep navy background, six-color pinwheel light radiating outward, powerful solidarity Gen Z diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🤲 Gurbette en çok ihtiyaç duyulan şey: zor bir günde "yanındayım" diyen bir el.

Hastalık, kayıp, kriz... Bunlar yalnız taşınmamalı. Bir topluluk, en ağır yükü hafifletir.

👉 Ücretsiz kayıt olun!
CorteQS, dayanışmayı bir değer değil, bir refleks haline getiriyor. Birbirine kenetlenen bir ağda, kimse yalnız kalmaz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Dayanışma #TürkDiasporası #Topluluk #Yardımlaşma #CorteQS`,
  },
  {
    id: "post-37",
    order: 37,
    theme: "spor",
    title: "Gurbette milli maç",
    canvaPrompt:
      "A roaring crowd of fans in a stadium waving red flags (blank, no emblems), golden-bronze floodlight glow, deep navy night sky, six-color pinwheel light flares celebrating a goal, electric Gen Z diaspora football-passion aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `⚽ EURO 2024 grup aşamasında Türk taraftarlar toplam 130 bin biletle tribünleri doldurdu; Hürriyet'in deyişiyle "ev sahibi Almanya'dan (125 bin) bile daha fazla taraftar topladı." Gurbetin ortasında koca bir Türkiye yarattılar.

Milli maç gecesi, gurbetçinin en birleştirici anı. Birlikte bağırmak, birlikte sevinmek — paha biçilemez.

👉 Ücretsiz kayıt olun!
CorteQS, maç gecesi buluşmalarını, taraftar gruplarını ve canlı yayın mekanlarını tek yerde topluyor. Coşkuyu paylaşacak bir tribün hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Futbol #MilliTakım #TürkDiasporası #Taraftar #CorteQS`,
  },
  {
    id: "post-38",
    order: 38,
    theme: "spor",
    title: "Aynı takım, aynı çatı",
    canvaPrompt:
      "A group of friends in a sports bar cheering at a screen, raising tea and drinks, warm golden-bronze ambient light, deep navy interior, six-color pinwheel neon glow, lively Gen Z diaspora sports-community aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `📺 Bir golü tek başına izlemek başka, 30 kişiyle bağırarak kutlamak başka.

Sporun gurbette en güzel yanı: yabancıları bir anda kardeş yapması. Bir takım sevgisi, bir şehirde koca bir aile kurabilir.

👉 Ücretsiz kayıt olun!
CorteQS, aynı takımı tutanları, aynı coşkuyu paylaşanları buluşturuyor. Tribünün her yerde seninle.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Spor #Futbol #TürkDiasporası #Topluluk #CorteQS`,
  },
  {
    id: "post-39",
    order: 39,
    theme: "teknoloji",
    title: "Görünmez ağı görünür kıl",
    canvaPrompt:
      "An abstract glowing global network of nodes and connections wrapping a dark globe, golden-bronze primary lines with six-color pinwheel data pulses, deep navy space background, futuristic Gen Z digital-diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌐 8,8 milyonluk bir halk, görünmez bir ağla birbirine bağlı. Teknoloji, bu ağı nihayet görünür kılabilir.

Dijital topluluk, mesafeyi anlamsız kılıyor. Berlin'deki bir yazılımcı, Sidney'deki bir girişimciyle saniyeler içinde bağlanabilir.

👉 Ücretsiz kayıt olun!
CorteQS, dağınık diasporayı tek bir dijital güven ağında topluyor — 251 ülke, 80+ kategori, 7/24 yaşayan bir ekosistem. Geleceğin topluluğu burada kuruluyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#DijitalTopluluk #Teknoloji #TürkDiasporası #Network #CorteQS`,
  },
  {
    id: "post-40",
    order: 40,
    theme: "teknoloji",
    title: "Tek aramada bul",
    canvaPrompt:
      "A sleek smartphone held in hand displaying an abstract glowing search interface (no text, only golden-bronze and six-color pinwheel UI shapes), deep navy minimalist background, clean modern Gen Z tech-diaspora aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🔍 Şehir, meslek ya da isim. Aradığın Türk profesyoneli tek aramada bulmak artık hayal değil.

Eskiden "tanıdık" bulmak şansa kalıyordu. Artık dünyaya yayılmış diaspora, parmağının ucunda.

👉 Ücretsiz kayıt olun!
CorteQS, 80+ kategoride dünyaya yayılmış diaspora ağında ara, bağlan, keşfet. Aradığın kişi, bir tık uzağında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Teknoloji #Network #TürkDiasporası #DijitalAğ #CorteQS`,
  },
  {
    id: "post-41",
    order: 41,
    theme: "ebeveyn",
    title: "Gurbette ebeveyn olmak",
    canvaPrompt:
      "A warm scene of parents pushing a stroller in a sunny park, golden-bronze afternoon light, deep navy tree shadows, six-color pinwheel toy spinning on the stroller, tender Gen Z diaspora parenting aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `👶 Gurbette çocuk büyütmek, kılavuzsuz bir yolculuk. "Bizim mahalle" yok, "yan komşu teyze" yok, danışacak büyük yok.

Ama aynı yoldan geçen anneler, babalar var. Onları bulmak, en büyük destek.

👉 Ücretsiz kayıt olun!
CorteQS, gurbetteki ebeveynleri buluşturuyor; oyun gruplarından tavsiyelere, dil desteğinden dostluğa. Çocuğunu bir köy büyütür — biz o köyü kuruyoruz.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Ebeveyn #Anne #Baba #TürkDiasporası #CorteQS`,
  },
  {
    id: "post-42",
    order: 42,
    theme: "ebeveyn",
    title: "Bir anne bir anneyi anlar",
    canvaPrompt:
      "A circle of mothers with young children gathered in a bright living room sharing tea and laughter, warm golden-bronze light, deep navy decor, six-color pinwheel toys scattered playfully, supportive Gen Z diaspora mom-community aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🍼 Gurbette bir anne, başka bir anneyi en iyi anlayandır. Uykusuz geceler, dil endişesi, "doğru mu yapıyorum?" kaygısı — hepsi paylaşılınca hafifler.

Yalnız ebeveynlik yorar. Topluluk iyileştirir.

👉 Ücretsiz kayıt olun!
CorteQS, anne-baba topluluklarıyla gurbette ebeveynliği bir dayanışmaya çeviriyor. Soru sorabileceğin, dert paylaşabileceğin bir aile hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Anne #Ebeveyn #TürkDiasporası #Topluluk #CorteQS`,
  },
  {
    id: "post-43",
    order: 43,
    theme: "tatil",
    title: "Yaz geldi, yollar açıldı",
    canvaPrompt:
      "A car packed for a summer road trip on a coastal highway at golden hour heading toward a Turkish seaside town, warm golden-bronze sunset, deep navy sea, six-color pinwheel sun flares, joyful Gen Z diaspora summer-homecoming aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🚗 Yaz demek, gurbetçi için "memlekete gidiş" demek. Aylar öncesinden sayılan günler, dolan valizler, gözlerde o bilindik ışıltı.

Türkiye'ye gidiş bir tatil değil, bir kavuşma. Ve bu yolculuk, paylaşıldıkça güzelleşir.

👉 Ücretsiz kayıt olun!
CorteQS, memlekete dönüş öncesi tavsiyelerden yol arkadaşlarına kadar her şeyi bir araya getiriyor. Kavuşmanın heyecanını topluluğunla paylaş.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Tatil #Memleket #TürkDiasporası #YazTatili #CorteQS`,
  },
  {
    id: "post-44",
    order: 44,
    theme: "tatil",
    title: "Sılaya selam",
    canvaPrompt:
      "An airplane window view of the Anatolian coastline appearing through clouds at sunrise, warm golden-bronze light flooding the cabin, deep navy sky above, six-color pinwheel cloud reflections, emotional Gen Z diaspora homecoming aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `✈️ Uçağın camından sahili gördüğün an boğazına düğümlenen o duygu... İşte o, sıla.

Her yaz milyonlarca gurbetçi sınır kapılarından akın ediyor. Çünkü vatan, görülmese de kalpte hep en üstte.

👉 Ücretsiz kayıt olun!
CorteQS, hem gittiğin yerde hem döndüğün yerde bağını canlı tutuyor. Sıla da gurbet de artık tek bir ağda buluşuyor.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Sıla #Memleket #TürkDiasporası #Tatil #CorteQS`,
  },
  {
    id: "post-45",
    order: 45,
    theme: "carsi",
    title: "Güvenle al, güvenle sat",
    canvaPrompt:
      "A vibrant flat-lay of diverse second-hand goods (furniture, electronics, books) arranged neatly with golden-bronze price-tag shapes (blank), deep navy surface, six-color pinwheel marketplace glow, clean modern Gen Z diaspora marketplace aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🛍️ Gurbette en çok duyulan cümle: "Acaba güvenilir mi?" Tanımadığın biriyle alışveriş hep tedirgin eder.

Çözüm basit: kendi güven ağında alıp sat.

👉 Ücretsiz kayıt olun!
CorteQS'in Çarşı modülü, kullanıcıdan kullanıcıya güvene dayalı bir pazaryeri. Ne alırsan al, kimden alırsan al — hep tanıdık, hep güvenli.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Çarşı #Pazaryeri #TürkDiasporası #Güven #CorteQS`,
  },
  {
    id: "post-46",
    order: 46,
    theme: "cadde",
    title: "Şehrinin nabzı",
    canvaPrompt:
      "A stylized city street scene at golden hour with glowing activity feeds floating as abstract golden-bronze cards above the buildings, deep navy sky, six-color pinwheel notification dots, dynamic modern Gen Z diaspora social-feed aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `📍 Şehrinde bugün ne oluyor? Hangi etkinlik var, kim ne paylaşıyor, nerede buluşuluyor?

Gurbette en çok ihtiyaç duyulan şey, şehrinin nabzını tutmak. Yerel hayata bağlı kalmak.

👉 Ücretsiz kayıt olun!
CorteQS'in Cadde modülü, şehir bazlı sosyal akışla bulunduğun yerdeki diaspora hayatını canlı tutuyor. Şehrinin nabzı artık avucunun içinde.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#Cadde #ŞehirHayatı #TürkDiasporası #SosyalAğ #CorteQS`,
  },
  {
    id: "post-47",
    order: 47,
    theme: "kadin",
    title: "Gurbetin güçlü kadınları",
    canvaPrompt:
      "A confident woman standing in a modern city looking forward with quiet strength, golden-bronze rim light, deep navy urban backdrop, six-color pinwheel light accents around her, empowering Gen Z diaspora women aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `💪 Gurbette kadın olmak: hem yeni bir hayat kurmak hem kültürü taşımak hem de çoğu zaman ailenin direği olmak.

Yurt dışındaki Türk kadınları işte, akademide, girişimcilikte parlıyor. Ama güç, dayanışmayla katlanır.

👉 Ücretsiz kayıt olun!
CorteQS, gurbetteki kadınları birbirine bağlıyor; mentorluktan dostluğa, iş birliğinden desteğe. Güçlü kadınlar, güçlü bir ağla daha da yükselir.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#KadınGücü #TürkDiasporası #Dayanışma #Kadın #CorteQS`,
  },
  {
    id: "post-48",
    order: 48,
    theme: "kusaklar",
    title: "İlk kuşağın hatırı",
    canvaPrompt:
      "A warm portrait-style scene of an elderly person's hands holding a tea glass and an old photograph, golden-bronze soft light, deep navy background, a faint six-color pinwheel memory glow, respectful nostalgic Gen Z diaspora elder-honoring aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `👴 Bu diasporanın temelini atan ilk kuşak, bugün gurbette yaşlanıyor. Onların hikâyeleri, hepimizin kökü.

Dil sorunu, yalnızlık, sağlık... İlk kuşağın yükü ağır. Onlara sahip çıkmak, kim olduğumuzu unutmamaktır.

👉 Ücretsiz kayıt olun!
CorteQS, kuşakları birbirine bağlıyor; gençlerin enerjisini büyüklerin tecrübesiyle buluşturuyor. Köklerimize saygı, ağımızın temeli.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#İlkKuşak #TürkDiasporası #Kuşaklar #Saygı #CorteQS`,
  },
  {
    id: "post-49",
    order: 49,
    theme: "manifesto",
    title: "Bir dizin değil, yaşayan bir ağ",
    canvaPrompt:
      "A breathtaking view of a glowing global network forming the shape of interconnected people-icons across a dark world map, golden-bronze main hubs pulsing with six-color pinwheel energy, deep navy cosmic background, bold inspirational Gen Z diaspora manifesto aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `🌍 Berlin'den Sidney'e, Toronto'dan Dubai'ye — dünyanın dört bir yanına dağılmış bir halkız. Ama dağınık olmak zorunda değiliz.

T.C. Dışişleri Bakanlığı'na göre 7,5 milyon yurt dışı vatandaş, köken dahil 14 milyonu aşan bir potansiyel. Bu, sıradan bir kalabalık değil; uyuyan bir dev.

👉 Ücretsiz kayıt olun!
CorteQS bir dizin değil, yaşayan bir ağ. İnsanları, toplulukları ve işletmeleri tek bir güven zemininde buluşturuyor. Nerede olursan ol, kökenin hep yanında.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#TürkDiasporası #Diaspora #Manifesto #Topluluk #CorteQS`,
  },
  {
    id: "post-50",
    order: 50,
    theme: "manifesto",
    title: "Sen de bu ağın parçası ol",
    canvaPrompt:
      "An uplifting image of a hand reaching toward a glowing golden-bronze network sphere that lights up with six-color pinwheel connections upon touch, deep navy background, warm inviting Gen Z diaspora call-to-action aesthetic, no text, no letters, no words, no typography.",
    linkedinPost: `✨ Gurbet zor. Ama yalnız olmak zorunda değil.

Bugün dünyanın neresinde olursan ol, kökenini paylaşan milyonlarca insan bir tık uzağında. Eksik olan tek şey: ilk adım.

👉 Ücretsiz kayıt olun!
CorteQS, dünyadaki Türkleri tek çatı altında buluşturan, güvene dayalı diaspora ağı. Açık beta yayında — sen de bu büyümenin parçası ol. Berlin'den Sidney'e, hepimiz aynı ağdayız.
🔗 https://corteqs.net/
💬 WhatsApp topluluğu: https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD
#CorteQS #TürkDiasporası #Diaspora #Topluluk #Gurbet`,
  },
];
