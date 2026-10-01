/**
 * Kariyer sayfasının metin içeriği (KR04).
 *
 * Kaynak: ekipten gelen `kariyer (1).html` (28 Eylül 2026). Metin **makineyle**
 * çıkarıldı; HTML varlık kodları çözüldü, Türkçe harfler korundu.
 *
 * İlan verisi burada DEĞİL — `src/lib/careers/careers-data.ts` içinde (KR01).
 * Bu dosya yalnız sayfanın sabit anlatı metinlerini taşır.
 */

export type FounderLetter = {
  name: string;
  title: string;
  photo: string;
  paragraphs: string[];
};

export type ParticipationModel = {
  title: string;
  body: string;
};

export type ClockCity = {
  label: string;
  timeZone: string;
  /** Merkez şehir — bantta vurgulanır. */
  primary?: boolean;
};

export const CAREER_HERO = {
  eyebrow: "Kariyer",
  title: "Olağanüstü bir zamanda, olağanüstü bir yolculuğa davet.",
  description:
    "CorteQS'in kurucu ekibini kuruyoruz. 17 pozisyon ve bir stajyer programı; hepsi uzaktan, hepsi dünyanın dört bir yanındaki Türkler için.",
  primaryCta: { label: "Hemen başvur", href: "#basvuru" },
  secondaryCta: { label: "Açık pozisyonlar", href: "#pozisyonlar" },
} as const;

/** ⚠️ Saat bandı 8 şehirdir; `Intl.DateTimeFormat("tr-TR", { timeZone })` ile hesaplanır. */
export const CAREER_CLOCK_CITIES: ClockCity[] = [
  { label: "İstanbul", timeZone: "Europe/Istanbul", primary: true },
  { label: "Berlin", timeZone: "Europe/Berlin" },
  { label: "Londra", timeZone: "Europe/London" },
  { label: "Amsterdam", timeZone: "Europe/Amsterdam" },
  { label: "New York", timeZone: "America/New_York" },
  { label: "Toronto", timeZone: "America/Toronto" },
  { label: "Dubai", timeZone: "Asia/Dubai" },
  { label: "Sidney", timeZone: "Australia/Sydney" },
];

export const CAREER_CLOCK_NOTE = "Ekibimiz bu saatlerin hepsinde çalışacak.";

export const FOUNDER_LETTERS: FounderLetter[] = [
  {
    name: "Burak Akçakanat",
    title: "Kurucu Ortak ve CEO",
    photo: "/career/burak-akcakanat.jpg",
    paragraphs: [
      "Olağanüstü zamanlardan geçiyoruz. Teknoloji, veri ve yapay zekâ, üretimin hızını ve kalitesini birkaç yıl öncesine kadar hayal bile edemeyeceğimiz bir noktaya taşıdı. Bu dönüşüm yalnızca ürünleri değil, çalışma biçimlerimizi de kökünden değiştiriyor. Bizimkini de öyle: CorteQS'te küçük ama güçlü ekiplerin, doğru araçlarla dev işler başardığı yeni bir çalışma kültürü kuruyoruz.",
      "Dünyanın dört bir yanında yaşayan 8,8 milyon Türk, bugün ekonomik ve kültürel olarak çok yüksek bir noktada. Nitelikli, üretken ve birbirine bağlanmaya hazır. Bu koşulların, doğru alanlarda yaratan ve üretenlerin lehine işlemeye devam edeceğine yürekten inanıyoruz. CorteQS tam da bu inançla doğdu.",
      "Bizim için bugün ulaştığımız her başarı, buzdağının yalnızca görünen yüzü. Önümüzde, çıtayı hayallerimizi zorlayacak kadar yukarı koyabileceğimiz bir potansiyel var. Tutkumuz da heyecanımız da bu potansiyel kadar büyük. Bu yepyeni çağda böylesine dev bir projenin içinde olmak, eşine az rastlanır bir öğrenme ve gelişim fırsatı. Bu yolculuğu seninle birlikte yürümek istiyoruz.",
    ],
  },
  {
    name: "Umut Barış Terzioğlu",
    title: "Kurucu Ortak ve CTO",
    photo: "/career/umut-baris-terzioglu.jpg",
    paragraphs: [
      "Teknik olarak da olağanüstü bir yolculuğun başındayız. Birkaç yıl önce onlarca kişilik ekiplerin aylarca uğraşacağı bir platformu, bugün yapay zekâ destekli geliştirmeyle çok daha küçük bir ekiple, çok daha hızlı inşa ediyoruz.",
      "Ama asıl heyecan verici olan önümüzde duruyor: milyonlarca kullanıcıya ölçeklenecek bir altyapı, diaspora için akıllı arama, danışmanların yapay zekâ ikizleri, onlarca ülkede aynı anda nefes alan bir ağ. Burada yazacağın her satır kod, dünyanın bir yerinde birinin hayatına dokunacak. Bu mimariyi birlikte kuracağımız, birlikte öğrenip birlikte büyüyeceğimiz yol arkadaşlarını arıyoruz.",
    ],
  },
];

export const CAREER_OPEN_INVITE = {
  title: "Her yaşa, her deneyime açığız",
  paragraphs: [
    "Yaş ve tecrübe bizim için bir engel değil, bir zenginlik. Birikimini yeni bir kuşağa aktarmak isteyen tutkulu bir emekli de, kendi projesini kurmadan önce gerçek bir girişimin mutfağını görmek isteyen bir üniversite öğrencisi de aramızda yer bulabilir.",
    "İlanlardaki deneyim yılları bir pusula, sınır değil. Asıl ölçütümüz tutku, sahiplenme ve üretme isteği. Yurt dışında yaşamış ya da yaşıyor olman ise büyük bir artı.",
  ],
  remoteNote: "Tüm roller uzaktandır. Dünyanın neresinde yaşarsan yaşa ekibe katılabilirsin.",
} as const;

export const PARTICIPATION_MODELS: ParticipationModel[] = [
  {
    title: "Kurucu Ekip Modeli",
    body: "Ertelenmiş ücret ve vesting'li ortaklık payı. Ücretin bir kısmı ya da tamamı, şirket belirli eşiklere (yatırım turu veya gelir hedefi) ulaştığında ödenir; ortaklık payın 4 yıl içinde, 1 yıllık bekleme süresiyle hak edilir.",
  },
  {
    title: "Yatırımcı-Ortak Modeli",
    body: "Kıdemli pozisyonlarda, rolünü üstlenirken şirkete avantajlı koşullarla yatırım yaparak kurucu ortak olma imkânı.",
  },
];

export const PARTICIPATION_FINE_PRINT =
  "Her iki modelin ayrıntıları ön görüşmede paylaşılır. CorteQS erken aşamada bir girişim; bu davet, klasik ve güvenli bir maaştan çok, risk ile kazancın dengesini gören, benzersiz bir öğrenme ve referans edinme ile uzun vadeli değer yaratmak isteyenler için.";
