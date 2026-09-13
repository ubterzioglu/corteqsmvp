// Admin Panel V2 navigasyon registry'si — "Operasyon Workspace" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez
// (masterplan §4.3). Grup sırası ../admin-navigation-registry.ts'te belirlenir.

import {
  Briefcase,
  FileText,
  FolderKanban,
  FolderOpen,
  Inbox,
  ListChecks,
  MessageSquarePlus,
  Rocket,
  ScrollText,
} from "lucide-react";

import { workspaceDocPages } from "@/lib/dashboard/workspace-doc-pages";
import type { AdminNavGroup, AdminNavItem } from "../admin-shell-types";

const workspaceDocItems: AdminNavItem[] = workspaceDocPages.map((page) => ({
  id: `workspace-doc-${page.slug}`,
  label: page.title,
  description: page.description,
  to: `/admin/workspace/docs/${page.slug}`,
  icon: ScrollText,
  accent: "slate",
}));

export const workspaceNavGroup: AdminNavGroup = {
  id: "workspace",
  label: "Operasyon Workspace",
  accent: "slate",
  items: [
    {
      id: "workspace-home",
      label: "Workspace",
      description: "Workspace ana sayfası.",
      to: "/admin/workspace",
      icon: Briefcase,
      accent: "slate",
      aliases: ["workspace", "dashboard merkezi"],
    },
    {
      id: "command-center",
      label: "Command Center",
      shortLabel: "CC",
      description: "Todo ve koordinasyon merkezi.",
      to: "/admin/workspace/command-center",
      icon: ListChecks,
      accent: "slate",
      aliases: ["cc", "todo", "komuta", "command"],
    },
    {
      id: "revision-requests",
      label: "Revizyon İstekleri",
      shortLabel: "Revizyon",
      description: "Site/ürün revizyon talepleri ve yorum thread'leri — tüm adminler ortak.",
      to: "/admin/revision-requests",
      icon: MessageSquarePlus,
      accent: "slate",
      aliases: ["revizyon", "istek", "talep", "yorum", "comment", "revision"],
    },
    {
      id: "member-feedback",
      label: "Üye Geri Bildirimleri",
      shortLabel: "Feedback",
      description: "Üyelerin 'Geri Bildirim' formundan gelen geri bildirimler — durum + arşiv.",
      to: "/admin/feedback",
      icon: Inbox,
      accent: "slate",
      aliases: ["feedback", "geri bildirim", "üye görüşü", "öneri", "şikayet"],
    },
    {
      id: "workspace-resources",
      label: "Dosyalar ve Linkler",
      description: "Kaynak merkezi.",
      to: "/admin/workspace/resources",
      icon: FolderKanban,
      accent: "slate",
      aliases: ["dosya", "link", "kaynak", "resources"],
    },
    {
      id: "contributor-resources",
      label: "Contributor Kaynakları",
      shortLabel: "Contributor",
      description: "Yerel kaynak gönderimlerini incele, eksik bilgi iste veya kabul et.",
      to: "/admin/contributor-resources",
      icon: FolderOpen,
      accent: "emerald",
      aliases: ["contributor", "katkı", "kaynak kuyruğu", "yerel kaynak"],
    },
    {
      id: "workspace-mvp",
      label: "MVP Listesi",
      description: "MVP takip listesi.",
      to: "/admin/workspace/mvp",
      icon: Rocket,
      accent: "slate",
      aliases: ["mvp"],
    },
    {
      id: "workspace-docs",
      label: "Dokümanlar",
      description: "Workspace doküman sayfaları.",
      match: ["/admin/workspace/docs"],
      icon: FileText,
      accent: "slate",
      aliases: ["doküman", "docs"],
      children: workspaceDocItems,
    },
  ],
};
