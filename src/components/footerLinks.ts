export type FooterLinkItem = {
  label: string;
  to?: string;
  href?: string;
};

export type FooterLinkSection = {
  title: string;
  links: FooterLinkItem[];
};

export const footerLinkSections: FooterLinkSection[] = [
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "#" },
      { label: "Fiyatlandırma", to: "/pricing" },
      { label: "Founding 1000", to: "/founders-1000" },
      { label: "İletişim", href: "#" },
      { label: "Kariyer", to: "/kariyer" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", to: "/legal/privacy" },
      { label: "Kullanım Şartları", to: "/legal/terms" },
      { label: "KVKK / GDPR / CCPA", to: "/legal/kvkk" },
      { label: "Çerez Politikası", to: "/legal/cookies" },
    ],
  },
];

export const footerFlatLinks = footerLinkSections.flatMap((section) => section.links);
