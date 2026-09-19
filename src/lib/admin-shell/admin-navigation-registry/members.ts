// Admin Panel V2 navigasyon registry'si — "Üyeler ve Dizin" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import {
  Bug,
  ClipboardList,
  Database,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const membersNavGroup: AdminNavGroup = {
  id: "members",
  label: "Üyeler ve Dizin",
  accent: "sky",
  defaultOpen: true,
  items: [
    {
      id: "catalog-database",
      label: "Kayıt Veritabanı",
      shortLabel: "Veritabanı",
      description: "Tüm katalog ve profil kayıtları; kullanıcı rol atama buradan yapılır.",
      to: "/admin/data",
      // İkinci URL backward compatibility için korunur (masterplan §6.1.B notu).
      match: ["/admin/new-member/profile-role-assignment", "/admin/data"],
      icon: Database,
      accent: "sky",
      aliases: ["kayıt", "katalog", "veritabanı", "üyeler", "kullanıcı rol atama", "profil"],
    },
    {
      id: "bulk-import",
      label: "Toplu İçe Aktarma",
      shortLabel: "İçe Aktar",
      description: "CSV/JSON profesyonel listelerini beklemeye al; Kayıt Veritabanı'ndan onayla.",
      to: "/admin/bulk-import",
      icon: Upload,
      accent: "sky",
      aliases: ["içe aktar", "ice aktar", "import", "toplu", "csv", "json", "profil yükle", "deep research"],
    },
    {
      id: "approvals",
      label: "Approval Queue",
      description: "Bekleyen talepleri incele, onayla veya reddet.",
      to: "/admin/approvals",
      icon: ClipboardList,
      accent: "sky",
      badge: "approval-count",
      aliases: ["onay", "approval", "claim", "bekleyen talepler"],
    },
    {
      id: "feature-overrides",
      label: "Feature Override",
      description: "Kullanıcı bazlı feature istisnaları.",
      to: "/admin/new-member/overrides",
      icon: SlidersHorizontal,
      accent: "sky",
      aliases: ["override", "feature", "istisna", "yetki"],
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      description: "Kritik admin işlem geçmişi.",
      to: "/admin/audit-logs",
      icon: ScrollText,
      accent: "sky",
      aliases: ["audit", "log", "denetim", "geçmiş"],
    },
    {
      id: "client-errors",
      label: "İstemci Hataları",
      shortLabel: "Hatalar",
      description: "Tarayıcıda yakalanan Cadde yazma/okuma ve render hataları (m134 tanısı).",
      to: "/admin/client-errors",
      icon: Bug,
      accent: "sky",
      aliases: ["hata", "istemci", "client error", "m134", "tarayıcı hatası", "console"],
    },
    {
      id: "referral",
      label: "Referans Kodları",
      shortLabel: "Ref Kod",
      description: "Referans kodu kaynakları, grupları ve tipleri.",
      to: "/admin/referral",
      match: ["/admin/referral"],
      icon: Sparkles,
      accent: "sky",
      aliases: ["ref kod", "referans", "davet", "referral"],
    },
  ],
};
