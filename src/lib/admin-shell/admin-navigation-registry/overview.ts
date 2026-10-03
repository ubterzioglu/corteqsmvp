// Admin Panel V2 navigasyon registry'si — "Genel Bakış" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { LayoutDashboard, TrendingUp } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const overviewNavGroup: AdminNavGroup = {
  id: "overview",
  label: "Genel Bakış",
  accent: "indigo",
  defaultOpen: true,
  items: [
    {
      id: "dashboard",
      label: "Genel Bakış",
      description: "Operasyon merkezi: KPI'lar, dikkat isteyenler ve hızlı işlemler.",
      to: "/admin",
      icon: LayoutDashboard,
      accent: "indigo",
      aliases: ["dashboard", "ana sayfa", "home", "özet"],
    },
    {
      id: "traction",
      label: "Traction",
      description:
        "Büyüme metrikleri: haftalık aktif kullanıcı, üretilen içerik, tavsiye yanıt oranı, davetle kayıt ve 30 gün geri dönüş.",
      to: "/admin/traction",
      icon: TrendingUp,
      accent: "indigo",
      aliases: ["traction", "büyüme", "growth", "metrikler", "büyüme metrikleri", "faz 6"],
    },
  ],
};
