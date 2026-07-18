// Admin Panel V2 — Diaspora LinkedIn + Instagram + Reddit Postları (statik tek kaynak).
// /admin/social-share-vault sayfasının "Diaspora Postları" sekmesi bu listeden
// beslenir. 50 kayıt; her biri için 2 metinsiz ChatGPT görsel promptu (İngilizce,
// square 1:1 / no-text kuralları promptun içine gömülü), 1 hazır Türkçe LinkedIn
// postu, 1 hazır Türkçe Instagram postu ve 1 hazır Türkçe Reddit postu (daha az
// satış dili, kişisel anekdot/soru ile açılan tartışma tonu — subreddit
// kurallarına göre editlenmesi gerekebilir). Her post ücretsiz kayıt çağrısı, web +
// WhatsApp linki ve CorteQS kapanışıyla biter (Reddit postu hariç — o bare URL'le biter).
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
};

export const DIASPORA_POSTS: DiasporaPost[] = [
  {
    id: "post-1",
    order: 1,
    theme: "gurbet",
    title: "Köprüdeki o koku",
    imagePrompts: [
      "A premium modern editorial 3D illustration of a warm cream square canvas centered on a single softly rounded teal window-frame shape, behind whose glass a glowing golden-orange horizon line hints gently at a distant skyline without depicting any real monument or literal cityscape, with a small rounded steaming teacup shape in indigo resting on the sill and soft wisps of steam curling upward rendered as delicate pink and yellow ribbons; the entire composition stays centered and comfortably inside a square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, nostalgic, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is tender and wistful yet hopeful; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded heart-shaped locket floating at the center of a warm cream square background, its glossy teal surface gently ajar to reveal a warm glow of orange and golden light spilling out like a captured memory, encircled by a thin balanced ring of small rounded wave-shapes in blue, indigo, pink and yellow suggesting distance being crossed; every element sits safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a warm, sentimental, optimistic mood suited to both a small card and a large hero image; the scene reads instantly at thumbnail scale; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas with a soft rounded teal phone-shape standing upright at the center, its screen glowing with a gentle orange-to-pink gradient like a warm voice being carried, with two small rounded chair-silhouettes in indigo and yellow placed symmetrically on either side to suggest a shared moment across distance; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, intimate, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is tender and reassuring; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of two soft rounded glossy sound-wave arcs, one teal and one warm orange, curving toward each other and gently overlapping at the center of a warm cream square background, surrounded by small floating rounded heart-shapes in pink, indigo and yellow drifting in a balanced circular pattern to represent a caring voice reaching across distance; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, comforting, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas split gently down the middle by a soft glowing vertical seam of golden-orange light, with two identical smooth rounded moon-orb shapes in teal floating symmetrically on either side, each haloed by a thin ring of small pinwheel-colored stars in blue, indigo, pink and yellow; both orbs are centered along the frame's horizontal axis and stay fully inside the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a calm, unifying, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is quiet, warm and connective; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a single soft rounded glossy teal moon-shape centered on a warm cream square background, with a delicate ribbon of light made of small rounded dots in orange, indigo, pink and yellow spiraling gently outward from it in a balanced circular pattern like ripples connecting distant places; every element sits safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a serene, hopeful, inclusive mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a single soft rounded silhouette bust shape split cleanly down the middle, one half rendered in glossy teal with subtle geometric patterning and the other half in warm orange with subtle floral rounded patterning, seamlessly merging at the center seam which glows softly in indigo light; small accent dots in pink, blue and yellow float gently around the head in a balanced arc; the whole figure is centered and stays fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and subtle depth, giving a thoughtful, unifying, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is confident and whole, not divided; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of two soft rounded overlapping circle shapes forming a Venn-diagram-like heart at the center of a warm cream square background, one circle glossy teal and the other warm orange, their overlapping middle glowing softly in blended pink-indigo light, surrounded by a few small rounded sparkle accents in blue and yellow in a balanced radial arrangement; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, harmonious, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a small soft rounded vintage-style suitcase shape rendered in warm glossy orange resting at the center of a warm cream square canvas, its surface gently textured with rounded stitch-lines, with a single small rounded polaroid-like frame shape in teal and a smooth rounded smartphone silhouette in indigo placed neatly side by side on top of it; a few tiny sparkle accents in pink, blue and yellow float above in a balanced arc suggesting generations connecting; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a nostalgic yet forward-looking, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded family-tree silhouette made of simple glossy branch shapes in teal, growing from a small rounded suitcase-base shape in warm orange at the bottom center of a cream square background, with small rounded leaf-shapes in indigo, pink, blue and yellow blooming along the branches to represent later generations; the tree is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended resolution, with ample margin from every edge; smooth gradients and soft cinematic lighting create subtle depth and a warm, respectful, hopeful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, meeting in a gentle handshake at the exact center of a warm cream square canvas, with a small warm golden-light spark glowing at the point of contact and a few tiny rounded speech-bubble shapes in indigo, pink and yellow floating nearby to suggest easy mutual understanding; the whole gesture is centered and stays fully within the square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, authentic, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is friendly and relieved; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy teal name-tag-like oval shape centered on a warm cream square background, gently glowing with a warm orange inner light and encircled by a balanced ring of small rounded smiling-face abstract shapes in indigo, pink, blue and yellow representing instant recognition and belonging; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, welcoming, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas holding a soft rounded abstract landmass shape in glossy teal at the center, dotted with several small glowing rounded pin-shapes in warm orange pulsing gently over it like population hubs, connected by thin delicate arcs of light in indigo, pink, blue and yellow forming a balanced network; the whole shape stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a confident, data-driven yet warm, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a large soft rounded glossy teal circle representing a population mass, centered on a warm cream square background, filled with many small rounded dot-shapes in orange, indigo, pink and yellow clustered densely yet playfully inside it like countless individuals forming one community, with a few dots gently drifting outward at the edge in a balanced radial pattern; the entire composition remains safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and an impressive, unified, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas showing five small soft rounded glossy landmass shapes in teal arranged in a balanced arc around the center, each topped with a gently glowing rounded pin-shape in a different accent color — orange, indigo, pink and yellow — all linked by delicate curved threads of light forming a unified web; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a sophisticated, unified, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a balanced circular constellation of small rounded glossy node-shapes in teal, orange, indigo, pink and yellow floating evenly spaced around a slightly larger central teal hub on a warm cream square background, connected by thin glowing threads of light radiating outward like a continental network; every node remains safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all edges; smooth gradients and soft cinematic lighting add subtle depth and a confident, collaborative, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded stylized globe shape in glossy teal at the center, with three small glowing rounded location-pin shapes in orange, pink and indigo positioned at balanced points around its circumference, connected by gentle arcing flight-path lines rendered in soft yellow and blue light; the globe and all connecting arcs stay fully within the square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an aspirational, global, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of three small rounded glossy paper-airplane shapes in orange, indigo and pink gently gliding along balanced curved paths across a warm cream square background, each leaving a soft trailing glow, converging toward a central rounded teal starburst shape that represents a shared destination; every shape remains safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an adventurous, hopeful, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded open-book shape rendered in glossy teal, with small rounded speech-bubble shapes in orange and pink gently floating above each page like a parent-and-child exchange, and a tiny rounded heart shape in indigo glowing softly between them; a few small star-accents in yellow and blue drift nearby in a balanced arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a tender, nurturing, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of two soft rounded glossy figure-silhouettes, one small and one larger, sitting closely together at the center of a warm cream square background, sharing a single glowing rounded speech-bubble shape in teal above them that gently splits into two smaller bubbles in orange and indigo, with soft sparkle accents in pink and yellow drifting around in a balanced arc; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, intimate, hopeful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy storybook shape glowing gently from within with warm orange light, from which small rounded firefly-like light specks in teal, indigo, pink and yellow float upward in a balanced arc like little stories escaping into the air; the book stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a dreamy, nurturing, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded crescent-moon shape in glossy teal cradling a tiny rounded sleeping-figure silhouette at the center of a warm cream square background, surrounded by a gentle balanced ring of small floating rounded star-shapes in orange, indigo, pink and yellow like a lullaby made visible; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a soothing, warm, hopeful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded glossy plate shape in teal, holding several small rounded roll-shaped forms in warm orange arranged in a neat spiral like stuffed grape leaves, with delicate steam rendered as smooth curling ribbons in pink and yellow rising above, and a small rounded napkin-fold accent in indigo beside the plate; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, appetizing, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy heart-shape formed from a spiral of small rounded roll-shapes in warm orange and teal, centered on a warm cream square background, with a few floating rounded steam-wisp accents in pink, indigo and yellow drifting gently above in a balanced arc to suggest a home-cooked meal made with love; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, nostalgic, comforting mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy ring-shape in warm orange dotted with tiny rounded seed-like textures to evoke a sesame bread ring, placed beside a small rounded tulip-shaped glass silhouette in teal filled with a warm gradient, both resting on a softly reflective surface; a few small steam-wisp accents in pink and yellow curl gently above in a balanced composition; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a cozy, nostalgic, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a small rounded glossy teal tulip-shaped glass at the center of a warm cream square background, gently overlapping with a soft rounded ring-shape in warm orange, both haloed by a soft morning-light glow with small sparkle accents in indigo, pink and yellow drifting around in a balanced arc; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, homely, comforting mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded teal window-frame shape at the center through which a gentle sunrise gradient of orange and yellow light glows softly, with a small rounded silhouette figure shape in indigo standing quietly before it, and a few tiny rounded crescent-and-star accent shapes in pink floating softly nearby to suggest a quiet holiday morning; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a bittersweet, hopeful, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy sunrise-arc shape in warm orange rising gently behind a small rounded teal doorway silhouette at the center of a warm cream square background, with delicate light rays in pink, indigo and yellow fanning outward in a balanced symmetrical pattern; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a tender, reflective, quietly festive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded glossy tray shape in teal holding several small rounded diamond-cut forms in warm orange arranged in a neat grid to evoke a festive sweet, gently glistening with a soft syrup-like sheen, surrounded by a few small rounded lantern-shapes in indigo, pink and yellow glowing softly above in a balanced arc; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a festive, warm, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy lantern-shapes in teal, orange, indigo, pink and yellow floating gently above a warm cream square background, each softly glowing from within, with a single larger lantern centered slightly above the rest to anchor the composition and hint at a shared celebration; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a joyful, warm, communal mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded glossy ornamental tray shape in warm orange holding a small rounded candle-shape in teal with a gentle glowing flame rendered in soft yellow light, surrounded by delicate rounded fabric-fold shapes in indigo and pink draped symmetrically around it; a few tiny sparkle accents float nearby in a balanced arc; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a celebratory, elegant, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy hand-shape in warm orange with a small circular henna-pattern motif rendered as simple rounded dots rather than literal ornamentation, centered on a warm cream square background, encircled by a balanced ring of small floating rounded candle-flame shapes in teal, indigo, pink and yellow; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, joyful, traditional-yet-modern mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy mountain-peak-like shape in teal at the center, with a small rounded flag-less pennant shape in warm orange planted at its summit and a gentle upward beam of golden-yellow light radiating from the peak; a few small rounded ascending arrow or chevron shapes in indigo and pink float alongside in a balanced arrangement suggesting rising achievement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a confident, aspirational, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy trophy-like abstract shape in warm orange centered on a warm cream square background, radiating a balanced circular burst of small rounded star-shapes in teal, indigo, pink and yellow outward in every direction; every shape remains safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a proud, energetic, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy seedling shape in teal at the base center, gently growing upward into a stylized rounded tree silhouette whose branches end in small glowing orb-shapes in orange, indigo, pink and yellow arranged in a balanced radial pattern; the entire tree stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an inspirational, entrepreneurial, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy garage-door-like rectangle shape in teal centered on a warm cream square background, gently opening to reveal a burst of small rounded glowing light shapes in orange, indigo, pink and yellow spilling outward in a balanced radial pattern like an idea taking flight; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, entrepreneurial, energetic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy figure-silhouette in teal standing beside a small rounded suitcase-shape in warm orange at the center, facing a gentle upward path of small glowing rounded signpost-dot shapes in indigo, pink and yellow leading forward in a balanced diagonal arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a hopeful, determined, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy compass-shape in teal centered on a warm cream square background, its needle gently glowing in warm orange and pointing toward a small cluster of rounded welcoming figure-shapes in indigo, pink and yellow arranged in a balanced arc nearby; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, guided, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy key-shape in warm orange being gently passed between two rounded hand-silhouettes, one teal and one indigo, at the center of the frame, with a soft warm glow radiating from the point of exchange and a few small rounded location-pin accents in pink and yellow floating nearby in a balanced arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a trustworthy, welcoming, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy lighthouse-like beacon shape in teal centered on a warm cream square background, gently casting a warm beam of orange light outward in a balanced fan shape toward a few small rounded figure-silhouettes in indigo, pink and yellow approaching from one side; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a guiding, reassuring, warm mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy storefront shape in teal at the center, its blank rounded awning glowing gently in warm orange, flanked by small rounded string-light dot shapes in indigo, pink and yellow strung symmetrically above in a balanced arc; the storefront stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a bustling, authentic, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy shopping-bag shape in warm orange centered on a warm cream square background, gently glowing from within, surrounded by a balanced ring of small rounded storefront-icon shapes in teal, indigo, pink and yellow representing a thriving neighborhood of small businesses; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a lively, supportive, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy teal storefront-card shape at the center, being gently arranged by two small rounded hand-silhouettes in warm orange, with a subtle glowing rounded blank sign-shape above radiating soft indigo and pink light, and a few small rounded product-box accents in yellow arranged neatly nearby; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a determined, empowering, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy seedling shape in teal growing out of a small rounded briefcase-shape in warm orange at the center of a warm cream square background, with a few small rounded upward arrow-accents in indigo, pink and yellow floating nearby in a balanced arrangement to suggest new business growth; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a confident, hopeful, entrepreneurial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a small cluster of soft rounded glossy backpack shapes in teal, orange and indigo arranged in a balanced walking-line composition at the center, with a few small rounded confetti-like light specks in pink and yellow drifting playfully around them; the whole group stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a youthful, adventurous, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy open-book shape in teal centered on a warm cream square background, transforming gently at one end into a small rounded airplane silhouette in warm orange lifting off, with a balanced trail of small rounded sparkle-dots in indigo, pink and yellow following behind; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and an excited, hopeful, youthful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy graduation-cap shape in teal resting atop a small neat stack of rounded book-shapes in warm orange at the center, with a tiny rounded tulip-shaped glass silhouette in indigo placed beside it, and a few small rounded bokeh-light accents in pink and yellow softly blurred in the background in a balanced arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an ambitious, warm, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a soft rounded glossy diploma-scroll shape in warm orange tied with a simple rounded ribbon-bow in teal, centered on a warm cream square background, gently radiating a balanced circular halo of small rounded star-accents in indigo, pink, blue and yellow; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a proud, hopeful, warm mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a warm cream square canvas featuring two soft rounded glossy puzzle-piece shapes, one teal and one warm orange, clicking together at the exact center, with a gentle golden-light spark glowing at the join and a few small rounded gear or node accents in indigo, pink and yellow floating nearby in a balanced arrangement to suggest professional connection; the whole composition stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a clean, professional, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.",
      "A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy hand-shapes in teal, orange, indigo, pink and yellow reaching toward a single glowing rounded handshake-point at the center of a warm cream square background, like a network converging at the right moment; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a confident, timely, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of two smooth rounded figure shapes seated across a small rounded teal table from each other on a warm cream square canvas, one figure gently offering a glowing rounded lightbulb-shaped orb in golden-yellow light toward the other, with soft orange, indigo and pink accent shapes drifting around them in a balanced radial composition; both figures and the table stay comfortably centered and fully inside the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a warm, encouraging, polished professional feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a rounded teal staircase made of soft glossy steps rising diagonally across a warm cream square background, with a small glowing golden-orange orb resting on the topmost step and a friendly rounded figure silhouette climbing from below, gently guided by a translucent indigo hand-shape reaching down from beside the staircase; pink and yellow sparkle accents drift near the top in a balanced composition; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, professional, encouraging mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a single small rounded teal figure silhouette standing alone at the center of a warm cream square canvas, surrounded by a loose ring of faint blurred cream-toned crowd-silhouette shapes fading softly toward the edges, with one small warm orange light-orb glowing gently in the distance behind the lone figure as a sign of hope; every shape remains fully inside the square 1:1 frame at 1024x1024 recommended size, well clear of all borders; soft cinematic lighting produces smooth gradients and subtle depth, giving a quiet, emotional yet ultimately hopeful and polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a small rounded teal figure standing inside a soft translucent glass-like bubble at the center of a warm cream square background, with faint indigo and pink dotted outlines of other figures visible just outside the bubble, and one thin warm-yellow light thread gently connecting the bubble to a distant glowing orb, suggesting an invisible link waiting to form; the whole scene sits safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and a wistful yet optimistic, polished mood suited to both a small card and a hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a balanced circle of small rounded glossy figure shapes in teal, orange, indigo, pink and yellow gathered closely around a small rounded warm-cream table at the center of a cream square canvas, with tiny rounded tea-glass shapes on the table glowing softly in golden light; the whole circular gathering is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows across the rounded forms, giving a warm, joyful, polished, inclusive feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded teal house-shaped outline glowing gently at the center of a warm cream square background, with small rounded figure silhouettes in orange, blue, indigo and pink standing comfortably inside and around it like a family, and a warm golden-light halo surrounding the whole group; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a heartfelt, welcoming, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a soft rounded teal path forking into two smooth glossy trails on a warm cream square canvas, one trail leading toward a cluster of small rounded orange rooftop shapes and the other toward a cluster of small rounded indigo skyline shapes, with a single small rounded figure silhouette pausing thoughtfully at the fork where the paths meet; a gentle pink and yellow light glow softly marks the crossroad; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and subtle depth, giving a calm, contemplative, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded compass shape rendered in glossy teal at the center of a warm cream square background, its needle gently wavering between two small glowing rounded markers, one in warm orange and one in indigo, with faint balanced rings of orange, pink and yellow light radiating outward to suggest careful deliberation; the compass and markers are scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a thoughtful, calm, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a soft rounded heart shape split evenly down the middle on a warm cream square canvas, one half rendered in glossy teal with small rounded skyline shapes and the other half in warm orange with small rounded rooftop and hill shapes, joined seamlessly at the center by a thin glowing indigo seam of light, with a few small rounded bird shapes in pink and yellow gently flying across the seam; the whole heart is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and subtle depth, giving a warm, emotional, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of two soft rounded landmass shapes, one teal and one warm orange, gently overlapping at the center of a warm cream square background like two halves of one whole, with a small glowing golden light-thread connecting their centers and a few rounded bird silhouettes in indigo and pink flying between them in a balanced arc; every shape is comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, hopeful, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy figure shapes in teal, orange, indigo, pink and yellow forming a lively gathering at the center of a warm cream square canvas, with a few soft rounded flag-shaped banners (plain, uncolored no pattern) fluttering gently above them and small confetti-like sparkle accents drifting around; the whole gathering is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows across the rounded forms, giving a joyful, warm, polished, community-oriented feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded stage-platform shape in teal at the center of a warm cream square background, with small rounded dancing figure silhouettes in orange, indigo and pink arranged in a joyful circular formation on top, and a warm golden spotlight glow washing gently over the scene from above; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a festive, inclusive, polished mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a row of small rounded glossy market-stall shapes strung with soft glowing light-bulb garlands rendered as tiny rounded orange and yellow orbs, centered on a warm cream square canvas at dusk-inspired warm lighting, with small rounded steam-wisp shapes in teal rising gently from the stalls and a few pink and indigo sparkle accents floating above; the whole fair scene is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an energetic, festive, polished, culturally proud feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a large soft rounded spotlight-circle shape in warm golden light at the center of a cream square background, revealing a balanced cluster of small rounded cultural-icon shapes in teal, orange, indigo and pink (simple abstract rounded forms suggesting music notes, a plate, a lantern) arranged like petals inside the light; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and a proud, vibrant, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a cluster of soft rounded glossy moving-box shapes stacked neatly at the center of a warm cream square canvas, one box in teal, others in orange, indigo and pink, with a small rounded armchair silhouette resting beside them and a gentle golden light-glow washing over the stack; the whole scene is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a practical yet warm, polished, optimistic mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, exchanging a small rounded armchair-shaped icon between them at the center of a cream square background, with a faint circular trust-badge glow in indigo forming behind the handoff and small yellow and pink sparkle accents nearby; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a trustworthy, practical, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a cozy soft rounded living-room scene at the center of a warm cream square canvas, featuring a small rounded teal sofa shape, a rounded orange shelf holding a simple rounded plant silhouette, and a small rounded rug shape below, all softly glowing under warm golden light; small pink and indigo sparkle accents drift gently above the scene; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a heartwarming, polished, optimistic home-building mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a small rounded teal house-outline shape gradually filling with warm rounded furniture silhouettes in orange, indigo, pink and yellow floating gently into place inside it, centered on a warm cream square background, with a soft golden glow emanating from within the house as it comes together; every shape is comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, hopeful, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a soft rounded dome-and-minaret silhouette shape rendered in gentle glossy teal, centered on a warm cream square canvas, with a balanced circle of small rounded figure silhouettes in orange, indigo, pink and yellow gathering peacefully around its base, and a warm golden-light halo glowing softly above the dome; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a respectful, calm, polished, community-oriented mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded crescent-and-glow shape in warm golden light floating gently above a balanced circle of small rounded glossy figure silhouettes in teal, orange, indigo and pink standing together on a warm cream square background, evoking quiet togetherness; every element stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a peaceful, respectful, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of many soft rounded glossy hand shapes in teal, orange, indigo, pink and yellow reaching inward and joining together to form a supportive circle at the center of a warm cream square canvas, with a gentle warm golden-light glow radiating outward from the point where the hands meet; the whole circle of hands is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a powerful, warm, polished, solidarity-driven mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a single soft rounded teal hand shape gently cupping a small glowing golden-orange orb of light at the center of a warm cream square background, surrounded by a wider balanced ring of small rounded supportive hand silhouettes in indigo, pink and yellow reaching toward the center; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, professional, warm mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy figure silhouettes in teal, orange, indigo, pink and yellow raising their rounded arms together like a cheering stadium crowd, centered on a warm cream square canvas, with a soft glowing golden-light burst radiating outward from the center like a celebrated goal moment; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving an electric, joyful, polished, communal sports-passion mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded glossy ball shape in teal flying through the air at the center of a warm cream square background, trailing a smooth arc of small rounded sparkle shapes in orange, indigo, pink and yellow, with a wide balanced ring of small rounded cheering figure silhouettes surrounding the scene like a stadium; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an energetic, festive, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a small rounded glossy teal screen-shape at the center of a warm cream square canvas, with a balanced semicircle of small rounded glossy figure silhouettes in orange, indigo, pink and yellow gathered in front of it, arms raised together in celebration, and a few small rounded tea-glass shapes glowing warmly nearby; the whole scene is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a lively, warm, polished, community-driven mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded circular rooftop-shape in teal at the center of a warm cream square background, sheltering a small balanced cluster of rounded figure silhouettes in orange, indigo, pink and yellow standing shoulder to shoulder underneath it like one family, with a gentle golden light glowing from within the shelter; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, unifying, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a smooth rounded teal globe shape at the center of a warm cream square canvas, wrapped in a delicate glowing web of thin rounded connector-lines in orange, indigo, pink and yellow linking small softly pulsing node-orbs across its surface; the globe and its network stay comfortably centered and fully inside the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow across the rounded forms, giving a futuristic yet warm, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a balanced constellation of small rounded glossy node-orbs in teal, orange, indigo, pink and yellow connected by soft glowing thread-lines forming a gentle circular network pattern at the center of a warm cream square background, with one node pulsing slightly brighter to suggest active connection; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a modern, optimistic, professional technology mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a sleek rounded smartphone shape held upright at the center of a warm cream square canvas, its screen glowing softly with an abstract rounded search-bar shape in teal and small orbiting result-card shapes in orange, indigo, pink and yellow gently emerging above it; the phone and its glow stay comfortably centered and fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle highlights across the rounded forms, giving a clean, modern, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a glossy rounded teal magnifying-glass shape hovering at the center of a warm cream square background, with a soft trail of small rounded profile-silhouette icons in orange, indigo, pink and yellow appearing to be drawn toward its lens in a balanced radial pattern; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an efficient, optimistic, professional technology mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of two soft rounded glossy parent-figure silhouettes in teal and orange gently pushing a small rounded stroller shape across a warm cream square canvas, with a tiny rounded pinwheel-toy shape in indigo, pink and yellow spinning playfully on the stroller and soft sunlight-inspired golden glow surrounding the scene; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a tender, warm, polished parenting mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded teal parent-figure silhouette holding hands with a small rounded child-figure silhouette at the center of a warm cream square background, surrounded by a loose balanced ring of small rounded supportive figure silhouettes in orange, indigo, pink and yellow standing nearby like a caring village; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, reassuring, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a balanced circle of small rounded glossy mother-figure silhouettes in teal, orange, indigo, pink and yellow sitting together on a warm cream square canvas, each gently holding or standing near a small rounded child-shape, with tiny rounded toy shapes scattered playfully between them and soft warm golden light washing over the gathering; the whole circle stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a warm, supportive, polished community mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of two soft rounded glossy mother-figure silhouettes, one teal and one warm orange, sitting close together sharing a small rounded tea-cup shape between them at the center of a cream square background, with gentle indigo, pink and yellow heart-shaped sparkle accents floating softly above them; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, reassuring, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a small rounded glossy teal car shape driving along a soft winding rounded road at the center of a warm cream square canvas, packed with tiny rounded luggage shapes in orange and pink on its roof, heading toward a cluster of small rounded coastal-hill shapes in indigo and yellow glowing with warm golden sunset light; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a joyful, warm, polished summer-journey mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded suitcase shape in teal standing open at the center of a warm cream square background, with small rounded sun-ray shapes in golden-orange radiating gently behind it and tiny rounded seashell and wave-shaped accents in indigo, pink and yellow scattered nearby; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a joyful, anticipatory, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a soft rounded airplane-window shape at the center of a warm cream square canvas, framing a gentle glimpse of small rounded coastline-hill shapes in teal and orange bathed in warm golden sunrise light, with soft rounded cloud-puff shapes in indigo, pink and yellow drifting around the window frame; the whole scene stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an emotional, warm, polished homecoming mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded heart-shaped cloud floating at the center of a warm cream square background, glowing gently in golden-orange light, with a small rounded airplane silhouette in teal passing just beneath it and faint indigo, pink and yellow light-ray accents radiating outward; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a tender, nostalgic, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a neat balanced flat-lay arrangement of small rounded glossy object shapes (a simple rounded chair silhouette, a rounded book stack, a rounded electronics-box shape) in teal, orange, indigo, pink and yellow spaced evenly across a warm cream square canvas, with a small rounded trust-badge glow in golden light hovering above the center; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a clean, trustworthy, polished marketplace mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, exchanging a small glowing rounded shield-shaped trust badge at the center of a cream square background, with faint indigo, pink and yellow sparkle accents drifting around the handoff; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, professional, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a stylized cluster of small rounded glossy rooftop shapes forming a friendly skyline at the bottom of a warm cream square canvas, with small rounded feed-card shapes in orange, indigo, pink and yellow gently floating upward above the rooftops like a lively activity stream, and soft golden light connecting the cards to a small pulsing teal notification-dot at the top; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving a dynamic, warm, polished, community-feed mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded teal heartbeat-pulse line looping gently through a small stylized skyline made of rounded rooftop shapes in orange, indigo and pink, centered on a warm cream square background, with small yellow sparkle accents marking each pulse peak; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a lively, local, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a single confident soft rounded glossy female figure silhouette in teal standing centered on a warm cream square canvas, looking forward with quiet strength, softly rim-lit with warm golden light along her edges, surrounded by a balanced ring of small rounded sparkle accents in orange, indigo, pink and yellow; the figure stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an empowering, warm, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a balanced circle of small rounded glossy female figure silhouettes in teal, orange, indigo, pink and yellow standing shoulder to shoulder at the center of a warm cream square background, each softly glowing with a shared warm golden light connecting them like a support network; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an empowering, inclusive, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a pair of soft rounded glossy elderly hand shapes in warm orange gently holding a small rounded tea-glass shape and a small rounded photograph-frame shape at the center of a warm cream square canvas, with a faint respectful teal glow surrounding the hands and soft pink and yellow memory-sparkle accents drifting nearby; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle warmth, giving a nostalgic, respectful, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded tree-shape rendered in glossy teal at the center of a warm cream square background, its roots glowing gently in warm golden light and its branches holding small rounded leaf-shapes in orange, indigo, pink and yellow, symbolizing generations connected to shared roots; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a respectful, warm, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a breathtaking balanced network of small rounded glossy people-icon nodes in teal, orange, indigo, pink and yellow interconnected by thin glowing lines forming a gentle globe-like sphere shape at the center of a warm cream square canvas, with a few main hub-nodes pulsing softly brighter in warm golden light; the whole network stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving a bold, inspirational, polished, living-network mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a soft rounded teal tree-of-life shape at the center of a warm cream square background, its branches ending in small glowing rounded node-orbs in orange, indigo, pink and yellow that pulse gently like a living network, with soft golden light flowing through the trunk to every branch; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inspirational, unifying, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
      "A premium modern editorial 3D illustration of a soft rounded glossy teal hand shape reaching gently toward a glowing rounded network-sphere shape at the center of a warm cream square canvas, the sphere lighting up in warm golden-orange with small rounded connection-lines in indigo, pink and yellow radiating outward upon the touch; the whole scene stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an uplifting, warm, polished, inviting call-to-action mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
      "A premium modern editorial 3D illustration of a balanced circle of small rounded glossy figure silhouettes in teal, orange, indigo, pink and yellow standing evenly spaced around a glowing warm golden-light core at the center of a cream square background, each figure connected to the core by a thin soft light-thread, with one figure gesturing warmly toward an open spot in the circle as if inviting someone new to join; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inviting, optimistic, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.",
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
];
