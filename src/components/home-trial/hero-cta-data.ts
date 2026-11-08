// Ana sayfa hero'sunun CTA kataloğu (L5, Lovable CORTEQS+ düzeni) — bileşenden ayrı
// dosyada; "hero'da hangi düğme nereye gider" sorusunun tek cevabı burasıdır.
//
// Hedefler `App.tsx` rotalarıyla birebir aynı olmalı (`hero-cta-data.test.ts` denetler).
// Lovable'dan YALNIZ düzen alındı; veri, ödül/tarih iddiası, sponsor satırı ve
// `/founders-1000` gibi bizde olmayan adresler alınmadı.

import { PUBLIC_WHATSAPP_COMMUNITY } from "@/lib/contact-links";

export const HERO_PRIMARY_CTA = {
  to: "/login?mode=signup",
  label: "Kaydol — Diaspora Pasaportun Çıksın",
} as const;

export type HeroSecondaryIcon = "whatsapp" | "founders" | "blogger" | "vlogger";

export interface HeroSecondaryButton {
  label: string;
  icon: HeroSecondaryIcon;
  /** Uygulama içi rota. `href` ile birlikte verilmez. */
  to?: string;
  /** Harici bağlantı (yeni sekmede açılır). */
  href?: string;
}

/** Dört ikincil düğme — masaüstünde tek satır (4 sütun), mobilde 2 × 2. */
export const HERO_SECONDARY_BUTTONS: readonly HeroSecondaryButton[] = [
  { label: "WhatsApp", icon: "whatsapp", href: PUBLIC_WHATSAPP_COMMUNITY },
  { label: "Kurucu 1000", icon: "founders", to: "/founding-1000" },
  { label: "Blogger Yarışması", icon: "blogger", to: "/campaign/blogger" },
  { label: "Vlogger Yarışması", icon: "vlogger", to: "/campaign/vlogger" },
];

export interface HeroCampaignCard {
  to: string;
  title: string;
  description: string;
  icon: "trophy" | "pin";
}

/**
 * İki kampanya kartı. Ödül tutarı ve son tarih BİLEREK yazılmaz: yarışma sayfası
 * DEMO (bkz. `src/lib/demo-pages.ts`) ve kesinleşmemiş bir rakamı ana sayfada
 * vaat etmek yanlış olur. Şehir Elçisi kartında gelir iddiası da yok.
 */
export const HERO_CAMPAIGN_CARDS: readonly HeroCampaignCard[] = [
  {
    to: "/campaign/blogger",
    title: "Blog Yazısı Yarışması",
    description: "En iyi diaspora blog yazısını yaz, yarışmaya katıl.",
    icon: "trophy",
  },
  {
    to: "/city-ambassadors",
    title: "Şehir Elçisi Programı",
    description: "Şehrindeki Türk diaspora ağını sen kur, yeni gelenleri karşıla.",
    icon: "pin",
  },
];
