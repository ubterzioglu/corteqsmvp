import { Users, LayoutGrid, Clock, FileText } from "lucide-react";
import type { AdminNavGroup } from "../admin-shell-types";

export const kadroNavGroup: AdminNavGroup = {
  id: "kadro",
  label: "Kadro",
  icon: Users,
  accent: "amber",
  items: [
    {
      id: "kadro-liste",
      label: "Kadro Listesi",
      description: "52 pozisyon, durum ve öncelik takibi",
      to: "/admin/kadro",
      icon: Users,
      accent: "amber",
      aliases: ["kadro", "pozisyon", "rol"],
    },
    {
      id: "kadro-matris",
      label: "Pazarlama Matrisi",
      description: "Ürün, işlev ve coğrafya eksenleri",
      to: "/admin/kadro/matris",
      icon: LayoutGrid,
      accent: "amber",
      aliases: ["matris", "pazarlama"],
    },
    {
      id: "kadro-rutinler",
      label: "Rutinler",
      description: "Günlük, haftalık, aylık rutinler",
      to: "/admin/kadro/rutinler",
      icon: Clock,
      accent: "amber",
      aliases: ["rutin", "görev"],
    },
    {
      id: "kadro-ilanlar",
      label: "İlan Metinleri",
      description: "Pozisyon ilan metinleri",
      to: "/admin/kadro/ilanlar",
      icon: FileText,
      accent: "amber",
      aliases: ["ilan", "iş ilanı"],
    },
  ],
};
