// Admin Panel V2 navigasyon registry'si — "Hizmet Bulucu" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import {
  BookOpen,
  ClipboardList,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const serviceFinderNavGroup: AdminNavGroup = {
  id: "service-finder",
  label: "Hizmet Bulucu",
  accent: "sky",
  items: [
    {
      id: "service-finder-dashboard",
      label: "Hizmet Bulucu",
      shortLabel: "Bulucu",
      description: "AI destekli hizmet sağlayıcı keşfi — özet ve hızlı iş oluşturma.",
      to: "/admin/service-finder",
      icon: Sparkles,
      accent: "sky",
      aliases: ["service finder", "bulucu", "tarama", "scraper", "keşif"],
    },
    {
      id: "service-finder-jobs",
      label: "Tarama İşleri",
      description: "İş kuyruğu, durum ve aday incelemesi.",
      to: "/admin/service-finder/jobs",
      icon: ListChecks,
      accent: "sky",
      aliases: ["tarama işi", "job", "kuyruk"],
      match: ["/admin/service-finder/jobs"],
    },
    {
      id: "service-finder-providers",
      label: "Sağlayıcılar",
      description: "Tavily / SerpAPI / Gemini ayarları ve bütçe tavanları.",
      to: "/admin/service-finder/providers",
      icon: SlidersHorizontal,
      accent: "sky",
      aliases: ["tavily", "serpapi", "gemini", "sağlayıcı", "provider"],
    },
    {
      id: "service-finder-templates",
      label: "Meslek Şablonları",
      description: "Sorgu üretimi için meslek/dil terimi şablonları.",
      to: "/admin/service-finder/templates",
      icon: ClipboardList,
      accent: "sky",
      aliases: ["şablon", "template", "meslek"],
    },
    {
      id: "service-finder-costs",
      label: "Maliyetler",
      description: "Sağlayıcı bazında maliyet defteri toplamları.",
      to: "/admin/service-finder/costs",
      icon: TrendingUp,
      accent: "sky",
      aliases: ["maliyet", "cost", "harcama", "bütçe"],
    },
    {
      id: "service-finder-guide",
      label: "Hizmet Bulucu Kılavuzu",
      shortLabel: "Kılavuz",
      description: "İş oluşturma, aday inceleme ve sağlayıcı ayarları rehberi.",
      to: "/admin/service-finder/guide",
      icon: BookOpen,
      accent: "sky",
      aliases: ["hizmet bulucu kılavuz", "scrapper rehber", "tarama rehber", "bulucu kılavuz"],
    },
  ],
};
