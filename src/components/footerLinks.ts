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
      { label: "Hakkımızda", to: "/founders" },
      { label: "Blog", to: "/radar/rehberler" },
      { label: "Fiyatlandırma", to: "/pricing" },
      { label: "Founding 1000", to: "/founding-1000" },
      { label: "İletişim", to: "/iletisim" },
      { label: "Kariyer", to: "/kariyer" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Şirket Bilgileri", to: "/legal/business-information" },
      { label: "Gizlilik Politikası", to: "/legal/privacy" },
      { label: "Kullanım Şartları", to: "/legal/terms" },
      { label: "İade ve İptal", to: "/legal/refund-cancellation" },
      { label: "Hizmet Teslim", to: "/legal/service-delivery" },
      { label: "KVKK / GDPR / CCPA", to: "/legal/kvkk" },
      { label: "Çerez Politikası", to: "/legal/cookies" },
    ],
  },
];

export const footerFlatLinks = footerLinkSections.flatMap((section) => section.links);
