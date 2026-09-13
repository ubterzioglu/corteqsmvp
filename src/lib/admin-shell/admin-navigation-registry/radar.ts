// Admin Panel V2 navigasyon registry'si — "Radar Haber Pipeline" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { BookOpen, ListChecks, Newspaper, Radio } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const radarNavGroup: AdminNavGroup = {
  id: "radar",
  label: "Radar Haber Pipeline",
  accent: "violet",
  items: [
    {
      id: "radar-queue",
      label: "Moderasyon Kuyruğu",
      shortLabel: "Kuyruk",
      description: "Bekleyen haber adaylarını incele, onayla veya reddet.",
      to: "/admin/radar/queue",
      icon: Radio,
      accent: "violet",
      aliases: ["radar", "haber kuyruğu", "moderasyon", "aday haber"],
    },
    {
      id: "radar-sources",
      label: "Haber Kaynakları",
      shortLabel: "Kaynaklar",
      description: "RSS, Atom ve GDELT kaynaklarını yönet.",
      to: "/admin/radar/sources",
      icon: Newspaper,
      accent: "violet",
      aliases: ["kaynak", "rss", "atom", "gdelt", "feed"],
    },
    {
      id: "radar-runs",
      label: "Tarama Geçmişi",
      shortLabel: "Taramalar",
      description: "Günlük cron ve manuel tarama sonuçlarını izle.",
      to: "/admin/radar/runs",
      icon: ListChecks,
      accent: "violet",
      aliases: ["tarama geçmişi", "cron", "scan runs"],
    },
    {
      id: "radar-guide",
      label: "Radar Kural Kitabı",
      shortLabel: "Rehber",
      description: "Radar'ın nasıl çalıştığını ve nasıl yönetildiğini anlatan rehber.",
      to: "/admin/radar/rehber",
      icon: BookOpen,
      accent: "violet",
      aliases: ["radar rehber", "haber rehber", "radar kılavuz", "haber otomasyonu rehber"],
    },
  ],
};
