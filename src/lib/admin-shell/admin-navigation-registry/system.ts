// Admin Panel V2 navigasyon registry'si — "Sistem" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import {
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  ExternalLink,
  FolderOpen,
  Newspaper,
} from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const systemNavGroup: AdminNavGroup = {
  id: "system",
  label: "Sistem",
  accent: "red",
  items: [
    {
      id: "about",
      label: "Ürün Güncellemeleri",
      description: "Sürüm notları ve güncellemeler.",
      to: "/admin/about",
      icon: Newspaper,
      accent: "red",
      aliases: ["güncelleme", "sürüm", "release", "about"],
    },
    {
      id: "notification-settings",
      label: "Bildirim Ayarları",
      shortLabel: "Bildirimler",
      description: "Yeni üye ve güncelleme e-postalarını aç/kapa; kendi aboneliğini yönet.",
      to: "/admin/notifications",
      icon: BellRing,
      accent: "red",
      aliases: ["bildirim", "mail", "e-posta", "eposta", "abonelik", "notification", "yeni üye"],
    },
    {
      id: "tools",
      label: "Araç Kataloğu",
      shortLabel: "Araçlar",
      description: "Platformun tüm edge function, worker, modül ve script'leri — koddan otomatik üretilen liste.",
      to: "/admin/tools",
      icon: Boxes,
      accent: "red",
      aliases: ["araç", "arac", "tool", "registry", "katalog", "edge", "worker"],
    },
    {
      id: "agent-analytics",
      label: "Agent Analitik",
      shortLabel: "Analitik",
      description: "Araç sağlığı, yönlendirme skorları ve gizlilik özeti.",
      to: "/admin/agent-analytics",
      icon: BarChart3,
      accent: "red",
      aliases: ["analitik", "skor", "score", "routing", "agent", "metrik", "saglik"],
    },
    {
      id: "admin-guide",
      label: "Admin Kullanım Kılavuzu",
      shortLabel: "Kılavuz",
      description: "Tüm admin fonksiyonlarının kullanım rehberi.",
      to: "/admin/guide",
      icon: BookOpen,
      accent: "red",
      aliases: ["yardım", "kılavuz", "klavuz", "guide", "help", "rehber"],
    },
    {
      id: "external-engine",
      label: "Engine",
      href: "https://eng.corteqs.net",
      icon: ExternalLink,
      accent: "red",
      isExternal: true,
      aliases: ["engine"],
    },
    {
      id: "external-globe",
      label: "Globe",
      href: "https://globe.corteqs.net",
      icon: ExternalLink,
      accent: "red",
      isExternal: true,
      aliases: ["globe"],
    },
    {
      id: "external-founders",
      label: "Founders",
      href: "https://corteqs.net/founders",
      icon: ExternalLink,
      accent: "red",
      isExternal: true,
      aliases: ["founders", "kurucular"],
    },
    {
      id: "external-drive",
      label: "Drive Klasörü",
      href: "https://drive.google.com/drive/u/3/folders/1TYFEdjDPOLOMWAf_MScs6XJXRW9FHh-r",
      icon: FolderOpen,
      accent: "red",
      isExternal: true,
      aliases: ["drive", "google drive", "klasör", "klasor", "dosyalar", "drive klasörü"],
    },
  ],
};
