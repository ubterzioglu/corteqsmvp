// Admin Panel V2 navigasyon registry'si — "Workshop" grubu.
// Workshop panoları: her workshop kendi madde listesi + UBT/Burak onay kutuları.
// Veri kaynağı: workshop_items tablosu (mig 20260730190000).
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { ClipboardList, Hammer } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const workshopNavGroup: AdminNavGroup = {
  id: "workshop",
  label: "Workshop",
  icon: Hammer,
  accent: "emerald",
  items: [
    {
      id: "workshop-cadde",
      label: "Cadde",
      shortLabel: "Cadde WS",
      description: "30.07.2026 Cadde workshop maddeleri; UBT + Burak onay kutuları.",
      to: "/admin/workshop/cadde",
      icon: ClipboardList,
      accent: "emerald",
      aliases: ["workshop", "cadde workshop", "atölye", "madde", "checklist", "ubt", "burak"],
    },
    {
      id: "workshop-profil",
      label: "Profil",
      shortLabel: "Profil WS",
      description: "03.09.2026 Profiller toplantısı maddeleri; UBT + Burak onay kutuları.",
      to: "/admin/workshop/profil",
      icon: ClipboardList,
      accent: "emerald",
      aliases: ["profil workshop", "profiller", "rol etiketi", "doğrulama", "referans", "paket"],
    },
  ],
};
