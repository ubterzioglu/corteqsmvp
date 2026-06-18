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
  // Paris, Londra/Amsterdam'a yakın → etiketi sağ-aşağı ayrıştırıldı.
  { name: "Paris", lng: 2.3522, lat: 48.8566, align: "right", labelDx: 7, labelDy: 10 },
  // Münih, Berlin'in altında → etiketi sağ-aşağı.
  { name: "Münih", lng: 11.582, lat: 48.1351, align: "right", labelDx: 7, labelDy: 10 },
  // Stockholm kuzeyde, kendi başına → etiketi sağ-yukarı.
  { name: "Stockholm", lng: 18.0686, lat: 59.3293, align: "right", labelDx: 7, labelDy: -5 },
  // Los Angeles, Toronto/New York'tan batıda → etiketi sol-aşağı.
  { name: "Los Angeles", lng: -118.2437, lat: 34.0522, align: "left", labelDx: -7, labelDy: 9 },
  // İstanbul anlatının kalbinde — diasporanın çıkış noktası.
  // ÖNEMLİ: WorldAtlasMap hub'ı (turuncu merkez) dizinin SON elemanı olarak seçer
  // (isHub = i === ATLAS_CITIES.length - 1). İstanbul her zaman SON sırada kalmalı;
  // yeni şehirler bu satırın ÜSTÜNE eklenir. İstanbul indeksi = 12.
  { name: "İstanbul", lng: 28.9784, lat: 41.0082, align: "right", labelDx: 8, labelDy: 4 },
];

/** İstanbul (indeks 12 — dizinin son/merkez elemanı) merkezli + şehirler arası bağlantılar. */
export const ATLAS_LINKS: readonly AtlasLink[] = [
  [12, 0], // İstanbul → Berlin
  [12, 1], // İstanbul → Londra
  [12, 2], // İstanbul → Amsterdam
  [12, 3], // İstanbul → Dubai
  [12, 4], // İstanbul → Toronto
  [12, 5], // İstanbul → New York
  [12, 6], // İstanbul → Sidney
  [12, 8], // İstanbul → Paris
  [12, 9], // İstanbul → Münih
  [12, 10], // İstanbul → Stockholm
  [0, 2], // Berlin → Amsterdam
  [0, 9], // Berlin → Münih
  [1, 8], // Londra → Paris
  [2, 8], // Amsterdam → Paris
  [4, 5], // Toronto → New York
  [5, 11], // New York → Los Angeles
  [6, 7], // Sidney → Melbourne
  [10, 0], // Stockholm → Berlin
];

/**
 * Ekosistem rayı — yalnızca var olan public route'lara link verir.
 * Sıra geri-bildirim tablosundan: Uzmanlar, İşletmeler, Kuruluşlar, Topluluklar,
 * Şehir Elçileri, İnsanlar.
 */
export const ECOSYSTEM_CARDS: readonly EcosystemCard[] = [
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
    title: "Kuruluşlar",
    description: "Dernek, vakıf ve kuruluşlarla yerel hayata bağlan.",
    to: "/associations",
    cta: "Kuruluşları gör",
    iconKey: "organizations",
  },
  {
    title: "Topluluklar",
    description: "Topluluklar üzerinden yerel hayata ve etkinliklere katıl.",
    to: "/associations",
    cta: "Toplulukları gör",
    iconKey: "communities",
  },
  {
    title: "Şehir Elçileri",
    description: "Bulunduğun şehirde güveni inşa eden elçilerle tanış.",
    to: "/founders",
    cta: "Elçileri tanı",
    iconKey: "ambassadors",
  },
  {
    title: "İnsanlar",
    description: "Dünyanın dört bir yanındaki Türkleri keşfet ve bağlan.",
    to: "/directory",
    cta: "Diasporayı keşfet",
    iconKey: "people",
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
