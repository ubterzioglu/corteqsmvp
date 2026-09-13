// Admin Panel V2 navigasyon registry'si — "Kullanıcı Araçları" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import { ClipboardList, ListChecks, Table2 } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const relocationIngestionNavGroup: AdminNavGroup = {
  id: "relocation-ingestion",
  label: "Kullanıcı Araçları",
  accent: "sky",
  items: [
    {
      id: "relocation-ingestion-jobs",
      label: "Toplama İşleri",
      shortLabel: "İşler",
      description: "Taşınma kaynak toplama işleri ve worker durumu.",
      to: "/admin/relocation-ingestion",
      icon: ListChecks,
      accent: "sky",
      aliases: ["relocation", "taşınma toplama", "ingestion", "relokasyon iş"],
    },
    {
      id: "relocation-ingestion-candidates",
      label: "Aday İnceleme",
      description: "Toplanan servis/bürokrasi/acil adaylarını onayla ve yayınla.",
      to: "/admin/relocation-ingestion/candidates",
      icon: ClipboardList,
      accent: "sky",
      aliases: ["taşınma aday", "relocation candidate", "aday onay"],
      match: ["/admin/relocation-ingestion/candidates"],
    },
    {
      id: "relocation-tools-question-counts",
      label: "Araç Soru Sayıları",
      shortLabel: "Soru Sayıları",
      description: "Her relocation aracında hızlı/normal modda kaç soru/alan var, canlı DB'den.",
      to: "/admin/relocation-tools/soru-sayilari",
      icon: Table2,
      accent: "sky",
      aliases: ["soru sayısı", "relocation tool questions", "araç soru", "quiz sayısı"],
    },
  ],
};
