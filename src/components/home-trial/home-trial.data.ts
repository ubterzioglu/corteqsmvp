/**
 * Deneme landing (/landingtrial) verisi.
 * Tüm içerik Türkçe ve statiktir — canlı API çağrısı yok (deneme sayfası).
 *
 * NOT (dürüstlük): Buradaki sayılar kavramsal/placeholder'dır, canlı metrik DEĞİL.
 * Mevcut HeroNetworkStats.tsx ile aynı çizgide ("8M+ diaspora potansiyeli", "∞").
 */

import type {
  AtlasCity,
  AtlasLink,
  DiasporaStory,
  EcosystemCard,
  ProofStat,
} from "./home-trial.types";

/** Atlas haritasındaki diaspora şehirleri (deterministik koordinat — hydration güvenli). */
export const ATLAS_CITIES: readonly AtlasCity[] = [
  { name: "Berlin", lng: 13.405, lat: 52.52, align: "right" },
  { name: "Londra", lng: -0.1276, lat: 51.5072, align: "left" },
  { name: "Amsterdam", lng: 4.9041, lat: 52.3676, align: "right" },
  { name: "Dubai", lng: 55.2708, lat: 25.2048, align: "right" },
  { name: "Toronto", lng: -79.3832, lat: 43.6532, align: "left" },
  { name: "New York", lng: -74.006, lat: 40.7128, align: "left" },
  { name: "Sidney", lng: 151.2093, lat: -33.8688, align: "right" },
  { name: "Melbourne", lng: 144.9631, lat: -37.8136, align: "right" },
  // İstanbul anlatının kalbinde — diasporanın çıkış noktası.
  { name: "İstanbul", lng: 28.9784, lat: 41.0082, align: "right" },
];

/** İstanbul (indeks 8) merkezli + şehirler arası route bağlantıları. */
export const ATLAS_LINKS: readonly AtlasLink[] = [
  [8, 0], // İstanbul → Berlin
  [8, 1], // İstanbul → Londra
  [8, 2], // İstanbul → Amsterdam
  [8, 3], // İstanbul → Dubai
  [8, 4], // İstanbul → Toronto
  [8, 5], // İstanbul → New York
  [8, 6], // İstanbul → Sidney
  [0, 2], // Berlin → Amsterdam
  [4, 5], // Toronto → New York
  [6, 7], // Sidney → Melbourne
];

/** Ekosistem rayı — yalnızca var olan public route'lara link verir. */
export const ECOSYSTEM_CARDS: readonly EcosystemCard[] = [
  {
    title: "İnsanlar",
    description: "Dünyanın dört bir yanındaki Türkleri keşfet ve bağlan.",
    to: "/directory",
    cta: "Diasporayı keşfet",
    iconKey: "people",
  },
  {
    title: "Topluluklar",
    description: "Dernekler ve topluluklar üzerinden yerel hayata katıl.",
    to: "/associations",
    cta: "Toplulukları gör",
    iconKey: "communities",
  },
  {
    title: "Uzmanlar",
    description: "Güvenilir Türk profesyonellere ve danışmanlara ulaş.",
    to: "/directory",
    cta: "Uzmanları bul",
    iconKey: "experts",
  },
  {
    title: "İşletmeler",
    description: "Yurt dışındaki Türk işletmelerini keşfet ve destekle.",
    to: "/directory",
    cta: "İşletmeleri keşfet",
    iconKey: "businesses",
  },
  {
    title: "Şehir Elçileri",
    description: "Bulunduğun şehirde güveni inşa eden elçilerle tanış.",
    to: "/founders",
    cta: "Elçileri tanı",
    iconKey: "ambassadors",
  },
];

/** Kanıt bandı — kavramsal/placeholder değerler (uydurma kesin metrik YOK). */
export const PROOF_STATS: readonly ProofStat[] = [
  // CountUp tam sayıya yuvarlar; 8.8 ondalığını korumak için sembolik gösterim.
  { value: null, display: "8.8", suffix: "M+", label: "diaspora potansiyeli" },
  { value: null, display: "∞", label: "şehir bağlandı" },
  { value: null, display: "∞", label: "topluluk aktif" },
  { value: null, display: "∞", label: "uzman listelendi" },
];

/** Hikaye nehri — placeholder anlatılar; devamı mevcut içerik route'larına gider. */
export const DIASPORA_STORIES: readonly DiasporaStory[] = [
  {
    eyebrow: "Berlin",
    title: "Bir tasarımcının diaspora referanslarıyla büyüyen müşteri ağı",
    excerpt:
      "Berlin'de yaşayan bir Türk tasarımcı, CorteQS ağı üzerinden gelen güven temelli referanslarla portföyünü genişletti.",
    to: "/radar/rehberler",
  },
  {
    eyebrow: "Londra",
    title: "Yeni gelenleri karşılayan bir topluluk nasıl kuruldu",
    excerpt:
      "Londra'daki bir topluluk, şehre yeni taşınan Türkleri ilk haftalarında yönlendirmek için ortak bir karşılama akışı oluşturdu.",
    to: "/radar/rehberler",
  },
  {
    eyebrow: "Toronto",
    title: "Şehir elçileri yerel güveni neden büyütüyor",
    excerpt:
      "Toronto'daki şehir elçileri, güvenilir esnaf ve hizmet önerileriyle diasporanın gündelik kararlarını kolaylaştırıyor.",
    to: "/founders",
  },
];

/**
 * Düşük çözünürlüklü dünya kara hattı (GeoJSON FeatureCollection).
 * d3-geo `geoPath` ile çizilir; runtime fetch / ek paket gerekmez.
 * Kasıtlı olarak basit tutulmuştur (marka argümanı — coğrafya dersi değil).
 * Koordinatlar [lng, lat] sırasında, her halka saat yönünde kapatılmıştır.
 */
export const WORLD_LAND_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Kuzey Amerika" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-168, 65],
            [-150, 70],
            [-95, 73],
            [-60, 68],
            [-52, 47],
            [-70, 42],
            [-81, 25],
            [-97, 18],
            [-105, 22],
            [-117, 32],
            [-125, 40],
            [-130, 54],
            [-168, 65],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Güney Amerika" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-81, 8],
            [-60, 5],
            [-50, -5],
            [-35, -8],
            [-40, -23],
            [-58, -35],
            [-65, -45],
            [-72, -52],
            [-75, -40],
            [-78, -20],
            [-81, 0],
            [-81, 8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Avrupa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-10, 37],
            [-9, 44],
            [-5, 48],
            [2, 51],
            [-2, 58],
            [10, 64],
            [28, 70],
            [40, 66],
            [40, 48],
            [28, 41],
            [20, 40],
            [12, 38],
            [-1, 36],
            [-10, 37],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Afrika" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-17, 21],
            [-5, 35],
            [10, 37],
            [32, 31],
            [43, 12],
            [51, 11],
            [40, -5],
            [40, -25],
            [25, -34],
            [18, -34],
            [9, -2],
            [-8, 4],
            [-17, 21],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Asya" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [40, 66],
            [60, 72],
            [100, 78],
            [140, 73],
            [160, 68],
            [170, 60],
            [145, 45],
            [135, 35],
            [122, 24],
            [108, 10],
            [95, 6],
            [80, 8],
            [72, 20],
            [60, 25],
            [48, 30],
            [40, 48],
            [40, 66],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Avustralya" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [114, -22],
            [129, -15],
            [137, -12],
            [146, -18],
            [153, -28],
            [150, -38],
            [141, -38],
            [131, -32],
            [115, -34],
            [113, -28],
            [114, -22],
          ],
        ],
      },
    },
  ],
} as const;
