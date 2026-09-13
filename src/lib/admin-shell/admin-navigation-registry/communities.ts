// Admin Panel V2 navigasyon registry'si — "Topluluklar" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { BookOpen, Globe, MessageSquare, Users } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const communitiesNavGroup: AdminNavGroup = {
  id: "communities",
  label: "Topluluklar",
  accent: "rose",
  items: [
    {
      id: "community-landings",
      label: "Topluluk Landingleri",
      description: "Topluluk kayıtları ve landing yönetimi.",
      to: "/admin/whatsapp-landings",
      icon: MessageSquare,
      accent: "rose",
      aliases: ["topluluk", "whatsapp", "landing"],
    },
    {
      id: "community-editors",
      label: "Topluluk Editörleri",
      description: "Landing editor atamaları.",
      to: "/admin/whatsapp-landings/editors",
      icon: Users,
      accent: "rose",
      aliases: ["editör", "editor"],
    },
    {
      id: "community-guide",
      label: "Topluluk Kılavuzu",
      description: "Topluluk akış rehberi.",
      to: "/admin/whatsapp-landings/guide",
      icon: BookOpen,
      accent: "rose",
      aliases: ["topluluk kılavuzu", "rehber"],
    },
    {
      id: "consulates",
      label: "Diplomatik Profiller",
      description: "Konsolosluk ve diplomatik temsilcilik profilleri.",
      to: "/admin/consulates",
      icon: Globe,
      accent: "rose",
      aliases: ["diplomatik", "konsolosluk", "consulate"],
    },
  ],
};
