// Admin Panel V2 navigasyon registry'si — "Roller ve AFS" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import {
  BookOpen,
  FileText,
  Layers,
  Lightbulb,
  Shield,
  ShieldCheck,
  Table2,
} from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const rolesAfsNavGroup: AdminNavGroup = {
  id: "roles-afs",
  label: "Roller ve AFS",
  accent: "emerald",
  items: [
    {
      id: "afs-overview",
      label: "AFS Genel Bakış",
      description: "Roller ve entity genel bakış.",
      to: "/admin/new-member/roles-overview",
      icon: Layers,
      accent: "emerald",
      aliases: ["afs", "rol", "roller", "rolesgo", "genel bakış"],
    },
    {
      id: "role-matrix",
      label: "Roller AFS Matrisi",
      description: "Rol başına attribute / feature / section kuralları.",
      to: "/admin/new-member/role-matrix",
      icon: Shield,
      accent: "emerald",
      aliases: ["matris", "attribute", "feature", "section", "rol kuralları"],
    },
    {
      id: "durum-raporu",
      label: "Durum Raporu",
      description: "Canlı rebuild sağlığı ve sistem metrikleri.",
      to: "/admin/new-member/durum-raporu",
      icon: ShieldCheck,
      accent: "emerald",
      aliases: ["durum", "sağlık", "health", "rapor"],
    },
    {
      id: "database-tables",
      label: "Veritabanı Tabloları",
      description: "Teknik tablo görünümü.",
      to: "/admin/veritabani-tablolari",
      icon: Table2,
      accent: "emerald",
      aliases: ["tablo", "şema", "teknik", "database"],
    },
    {
      id: "system-guide",
      label: "Sistem Kullanım Kılavuzu",
      shortLabel: "Kılavuz",
      description: "Admin rehberi.",
      to: "/admin/new-member/guide",
      icon: BookOpen,
      accent: "emerald",
      aliases: ["kılavuz", "klavuz", "rehber", "guide", "yardım"],
    },
    {
      id: "roles-draft",
      label: "Roller Taslak",
      description: "Taslak rol çalışma ekranı.",
      to: "/admin/roller-taslak",
      icon: FileText,
      accent: "emerald",
      isInactive: true,
      aliases: ["taslak", "draft"],
    },
    {
      id: "brainstorming",
      label: "Brainstorming",
      description: "Cadde 3.0 & Premium Panel durum ve karar raporu — düzenlenebilir.",
      to: "/admin/brainstorming",
      icon: Lightbulb,
      accent: "emerald",
      aliases: ["brainstorming", "durum raporu", "karar", "statusreport", "3006"],
    },
  ],
};
