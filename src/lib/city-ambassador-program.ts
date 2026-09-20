/**
 * Şehir Elçisi Programı'nın tanıtım içeriği — statik, Türkçe.
 *
 * İçerik `referanslovable/src/pages/CityAmbassadors.tsx` demo sayfasından
 * taşındı (Burak'ın "tasarımı oradan ver" isteği). Sabitler bileşenden AYRI
 * dosyada durur: aynı dosya hem bileşen hem sabit dışa açınca Vite'ın hızlı
 * yenilemesi devre dışı kalıyor ve ESLint uyarı veriyor.
 *
 * Bunlar kullanıcıya görünen METİNLERDİR — Türkçe karakterleri ASCII'ye düşürme.
 */

/** Programın öncelikli şehirleri. Başvuru tüm şehirlerden kabul edilir. */
export const PRIORITY_CITIES: readonly string[] = [
  "Berlin",
  "Londra",
  "Dubai",
  "New York",
  "Paris",
  "Amsterdam",
  "Toronto",
  "Viyana",
];

export interface ProgramItem {
  readonly title: string;
  readonly description: string;
  /** Bileşendeki ikon haritasının anahtarı — ikon nesnesi burada TUTULMAZ. */
  readonly iconKey: string;
}

/** Elçinin sorumlulukları. */
export const AMBASSADOR_RESPONSIBILITIES: readonly ProgramItem[] = [
  {
    iconKey: "network",
    title: "Yerel Ağ Oluşturma",
    description: "Şehrindeki üyelerin, uzmanların ve işletmelerin ağa katılmasını sağla.",
  },
  {
    iconKey: "megaphone",
    title: "Topluluk Yönetimi",
    description: "WhatsApp ve Telegram gruplarını, etkinlikleri ve yeni üye karşılamasını yürüt.",
  },
  {
    iconKey: "rocket",
    title: "Platform Aktivasyonu",
    description: "Şehrindeki ilk bağlantıları kur, ağın gerçekten kullanılmasını sağla.",
  },
  {
    iconKey: "calendar",
    title: "Etkinlik Organizasyonu",
    description: "Yerel buluşmalar, atölyeler ve networking akşamları düzenle.",
  },
  {
    iconKey: "target",
    title: "Strateji & Raporlama",
    description: "Şehrindeki ihtiyaçları ve fırsatları merkeze düzenli olarak aktar.",
  },
  {
    iconKey: "handshake",
    title: "İşbirlikleri Kurma",
    description: "Yerel işletmelerle ve kurumlarla ortaklıklar geliştir.",
  },
];

/** Elçinin kazanımları. */
export const AMBASSADOR_BENEFITS: readonly ProgramItem[] = [
  {
    iconKey: "revenue",
    title: "Gelir Paylaşımı",
    description: "Şehrindeki platform aktivitesinden komisyon geliri.",
  },
  {
    iconKey: "handshake",
    title: "Yerel İş Ortaklıkları",
    description: "İşletmeler ve kurumlarla doğrudan, birinci elden bağlantı.",
  },
  {
    iconKey: "award",
    title: "Kişisel Marka",
    description: "Şehrinde tanınırlık ve topluluk liderliği pozisyonu.",
  },
  {
    iconKey: "globe",
    title: "Global Ağ",
    description: "Merkez ekip ve diğer şehir elçileriyle sürekli destek hattı.",
  },
];
