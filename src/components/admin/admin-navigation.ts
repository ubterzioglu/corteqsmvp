import { BookOpen, ClipboardList, Database, ExternalLink, FolderKanban, Globe, ListChecks, Network, Rocket, ScrollText as ScrollTextIcon, Shield, Sparkles } from "lucide-react";
import { CircleHelp, Heart, Lightbulb, Megaphone, MessageSquare, Radio, ScrollText } from "lucide-react";
import { workspaceDocPages } from "@/lib/dashboard/workspace-doc-pages";

export const primaryAdminNavItems = [
  { to: "/admin/referral", label: "Ref Kod", icon: Sparkles },
  { to: "/admin/workspace/resources", label: "Dosyalar", icon: FolderKanban },
] as const;

export const newMemberSystemNavItems = [
  { to: "/admin/members", label: "Üye Takibi", icon: Network },
  { to: "/admin/new-member/guide", label: "Genel Kullanım Kılavuzu", icon: BookOpen },
  { to: "/admin/new-member/users-roles", label: "Loginli Kullanıcılar & Roller", icon: Network },
  { to: "/admin/new-member/role-management", label: "Rol Yönetimi", icon: Shield },
  { to: "/admin/new-member/onboarding-imports", label: "Onboarding Importları", icon: ClipboardList },
  { to: "/admin/new-member/overrides", label: "Feature Override", icon: Sparkles },
] as const;

export const externalAdminNavItems = [
  { href: "https://eng.corteqs.net", label: "Engine", icon: ExternalLink },
  { href: "https://globe.corteqs.net", label: "Globe", icon: ExternalLink },
  { href: "https://mvp.corteqs.net/founders", label: "Founders", icon: ExternalLink },
] as const;

export const otherActionNavItems = [
  { to: "/admin/muhasebe", label: "Muhasebe", icon: Globe },
  { to: "/admin/marquee", label: "Haber Bandı", icon: Radio },
  { to: "/admin/cadde", label: "Cadde", icon: MessageSquare },
  { to: "/admin/social-media", label: "Sosyal Medya", icon: Megaphone },
  { to: "/admin/approvals", label: "Approval Queue", icon: ClipboardList },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollTextIcon },
  { to: "/admin/about", label: "Güncellemeler", icon: ScrollText },
] as const;

export const otherRecordNavItems = [
  { to: "/admin/surveys", label: "Anketler", icon: ClipboardList },
] as const;

export const communityNavItems = [
  { to: "/admin/whatsapp-landings", label: "Topluluklar", icon: MessageSquare },
  { to: "/admin/whatsapp-landings/editors", label: "Topluluk Editörleri", icon: Shield },
  { to: "/admin/whatsapp-landings/guide", label: "Topluluk Kullanma Kılavuzu", icon: BookOpen },
  { to: "/admin/consulates", label: "Diplomatik Profiller", icon: Globe },
] as const;

export const dataNavItems = [
  { to: "/admin/data", label: "Kataloglar", icon: Database },
] as const;

export const may19RecordNavItems = [
  { to: "/admin/may19/kelime", label: "19 Mayıs Kelime", icon: Lightbulb },
  { to: "/admin/may19/ani", label: "19 Mayıs Anı", icon: Heart },
] as const;

export const workspaceAdminNavItems = [
  { key: "workspace-home", to: "/admin/workspace", label: "Dashboard Merkezi", icon: BookOpen },
  { key: "command-center", to: "/admin/workspace/command-center", label: "CC", icon: ListChecks },
  { key: "links", to: "/admin/workspace/resources", label: "Dosyalar ve Linkler", icon: FolderKanban },
  { key: "mvp", to: "/admin/workspace/mvp", label: "MVP Listesi", icon: Rocket },
] as const;

export const adminPanelDocNavItems = workspaceDocPages.map((page) => ({
  key: `doc-${page.slug}`,
  to: `/admin/workspace/docs/${page.slug}`,
  label: page.title,
  icon: ScrollTextIcon,
})) as const;

export const adminPanelNavItems = [...workspaceAdminNavItems, ...adminPanelDocNavItems] as const;
