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

/**
 * Atlas haritasındaki diaspora şehirleri (deterministik koordinat — hydration güvenli).
 * labelDx/labelDy: yakın şehirlerin etiketleri çakışmasın diye elle ayrıştırıldı.
 */
export const ATLAS_CITIES: readonly AtlasCity[] = [
  // Berlin ile Amsterdam yatayda yakın → Berlin etiketi sağ-yukarı, Amsterdam sol-aşağı.
  { name: "Berlin", lng: 13.405, lat: 52.52, align: "right", labelDx: 7, labelDy: -6 },
  { name: "Londra", lng: -0.1276, lat: 51.5072, align: "left", labelDx: -7, labelDy: -3 },
  { name: "Amsterdam", lng: 4.9041, lat: 52.3676, align: "left", labelDx: -7, labelDy: 9 },
  { name: "Dubai", lng: 55.2708, lat: 25.2048, align: "right", labelDx: 7, labelDy: 3 },
  // Toronto ile New York üst üste → Toronto yukarı, New York aşağı.
  { name: "Toronto", lng: -79.3832, lat: 43.6532, align: "left", labelDx: -7, labelDy: -6 },
  { name: "New York", lng: -74.006, lat: 40.7128, align: "left", labelDx: -7, labelDy: 9 },
  // Sidney ile Melbourne üst üste → Sidney yukarı, Melbourne aşağı.
  { name: "Sidney", lng: 151.2093, lat: -33.8688, align: "right", labelDx: 7, labelDy: -5 },
  { name: "Melbourne", lng: 144.9631, lat: -37.8136, align: "right", labelDx: 7, labelDy: 9 },
  // İstanbul anlatının kalbinde — diasporanın çıkış noktası.
  { name: "İstanbul", lng: 28.9784, lat: 41.0082, align: "right", labelDx: 8, labelDy: 4 },
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
