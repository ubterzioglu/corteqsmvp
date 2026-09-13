// Admin Panel V2 navigasyon registry'si — "Linkler" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { BarChart3, Link2 } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const linksNavGroup: AdminNavGroup = {
  id: "links",
  label: "Linkler",
  accent: "indigo",
  items: [
    {
      id: "links-overview",
      label: "Linkler",
      description: "Admin panelinden hızlı erişilen dış araçlar ve panolar.",
      to: "/admin/links",
      icon: Link2,
      accent: "indigo",
      aliases: ["link", "linkler", "dış bağlantı", "araçlar", "kısayol"],
    },
    {
      id: "external-site-traffic",
      label: "Site Trafik Durumu",
      description: "Microsoft Clarity — site trafik ve davranış panosu.",
      href: "https://clarity.microsoft.com/projects/view/wdkgdje6rb/",
      icon: BarChart3,
      accent: "indigo",
      isExternal: true,
      aliases: ["trafik", "clarity", "site trafik", "analytics", "ziyaretçi", "istatistik"],
    },
  ],
};
