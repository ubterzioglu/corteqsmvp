// Admin Panel V2 navigasyon registry'si — "Muhasebe" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { ArrowLeftRight, Calculator, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const muhasebeNavGroup: AdminNavGroup = {
  id: "muhasebe",
  label: "Muhasebe",
  accent: "green",
  items: [
    {
      id: "muhasebe-dashboard",
      label: "Muhasebe Dashboard",
      shortLabel: "Muhasebe",
      description: "KPI özet ekranı.",
      to: "/admin/muhasebe",
      icon: Calculator,
      accent: "green",
      aliases: ["muhasebe", "finans"],
    },
    {
      id: "muhasebe-giderler",
      label: "Giderler",
      description: "Gider kayıtları CRUD.",
      to: "/admin/muhasebe/giderler",
      icon: TrendingDown,
      accent: "green",
      aliases: ["gider", "masraf"],
    },
    {
      id: "muhasebe-gelirler",
      label: "Gelirler",
      description: "Gelir kayıtları CRUD.",
      to: "/admin/muhasebe/gelirler",
      icon: TrendingUp,
      accent: "green",
      aliases: ["gelir"],
    },
    {
      id: "muhasebe-nakit-akisi",
      label: "Nakit Akışı",
      description: "Finansal akış görünümü.",
      to: "/admin/muhasebe/nakit-akisi",
      icon: ArrowLeftRight,
      accent: "green",
      aliases: ["nakit", "cash flow", "akış"],
    },
    {
      id: "muhasebe-butce",
      label: "Bütçe",
      description: "Yıllık departman bütçesi, gelir beklentisi ve runway.",
      to: "/admin/muhasebe/butce",
      icon: Wallet,
      accent: "green",
      aliases: ["bütçe", "butce", "budget", "runway"],
    },
  ],
};
