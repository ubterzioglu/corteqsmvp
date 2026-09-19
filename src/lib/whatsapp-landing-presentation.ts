import {
  Briefcase,
  ExternalLink,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  Link2,
  MessageCircle,
  Send,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { normalizeLandingCategory, type LandingCategory, type WhatsAppLanding } from "@/lib/whatsapp-landings";

export const messagingHeroImage = "/addwaimage.png";
export const waPlaceholderImage = "/waplaceholder.png";

export const categoryMeta: Record<
  LandingCategory,
  { icon: typeof Users; label: string; chipClass: string }
> = {
  alumni: {
    icon: GraduationCap,
    label: "Alumni",
    chipClass: "border-primary bg-primary text-primary-foreground",
  },
  doktor: {
    icon: Stethoscope,
    label: "Doktor / Sağlık",
    chipClass: "border-emerald-600 bg-emerald-500 text-white",
  },
  hobi: {
    icon: Heart,
    label: "Hobi",
    chipClass: "border-cyan-600 bg-cyan-500 text-white",
  },
  is: {
    icon: Users,
    label: "İş Grubu",
    chipClass: "border-amber-600 bg-amber-500 text-white",
  },
  yatirim: {
    icon: TrendingUp,
    label: "Yatırım & Girişim",
    chipClass: "border-emerald-600 bg-emerald-500 text-white",
  },
  akademik: {
    icon: Globe,
    label: "Akademik",
    chipClass: "border-indigo-600 bg-indigo-500 text-white",
  },
  dayanisma: {
    icon: HandHeart,
    label: "Dayanışma",
    chipClass: "border-rose-600 bg-rose-500 text-white",
  },
  hr: {
    icon: Briefcase,
    label: "HR",
    chipClass: "border-violet-600 bg-violet-500 text-white",
  },
  "kisisel-gelisim": {
    icon: Sparkles,
    label: "Kişisel Gelişim",
    chipClass: "border-pink-600 bg-pink-500 text-white",
  },
  diger: {
    icon: Sparkles,
    label: "Diğer",
    chipClass: "border-slate-500 bg-slate-400 text-white",
  },
};

export const approvalBadgeMeta = {
  member: {
    label: "Üye onaylı!",
    tooltip: "Bu topluluk kaydı bir topluluk üyesi tarafından gönderildi.",
    className: "border-sky-600 bg-sky-500 text-white",
  },
  admin: {
    label: "Admin onaylı!",
    tooltip: "Bu topluluk CorteQS admin ekibi tarafından incelenip onaylandı.",
    className: "border-orange-600 bg-orange-500 text-white",
  },
} as const;

export function getCategoryMeta(category?: string | null) {
  return categoryMeta[normalizeLandingCategory(category)];
}

export function stripCommunityPrefix(text?: string | null) {
  return text?.replace(/^Topluluk\s*[:;]\s*/i, "").trim() ?? "";
}

export function formatGroupScore(score?: number) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}

export function getLandingHeroImage(landing: WhatsAppLanding) {
  return landing.heroImage?.trim() || waPlaceholderImage;
}

export function getApprovalStatusMeta(landing: WhatsAppLanding) {
  if (landing.adminApproved) {
    return {
      label: approvalBadgeMeta.admin.label,
      tooltip: approvalBadgeMeta.admin.tooltip,
      className: approvalBadgeMeta.admin.className,
    };
  }

  if (landing.memberApproved) {
    return {
      label: approvalBadgeMeta.member.label,
      tooltip: approvalBadgeMeta.member.tooltip,
      className: approvalBadgeMeta.member.className,
    };
  }

  return {
    label: "Onay bekliyor",
    tooltip: "Bu topluluk henüz topluluk üyesi veya yönetici onayı almamış.",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  };
}

export function buildLandingCardSummary(landing: WhatsAppLanding) {
  return (
    stripCommunityPrefix(landing.callToActionText) ||
    stripCommunityPrefix(
      landing.description
        ?.replace(/\[Platform:\s*[^\]]+\]\s*/gi, "")
        .replace(/\[Başvuru tipi:[^\]]+\]\s*/gi, "")
        .replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
        .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
        .trim(),
    ) ||
    "Topluluk detaylarını görmek için karta tıkla."
  );
}

export function detectPlatformFromUrl(url: string | undefined | null): string {
  if (!url) return "";
  const lower = url.toLowerCase();
  if (lower.includes("chat.whatsapp.com") || lower.includes("wa.me")) return "WhatsApp";
  if (lower.includes("t.me") || lower.includes("telegram")) return "Telegram";
  if (lower.includes("discord.gg") || lower.includes("discord.com") || lower.includes("discord.app")) return "Discord";
  if (lower.includes("facebook.com") || lower.includes("fb.com")) return "Facebook";
  if (lower.includes("instagram.com")) return "Instagram";
  if (lower.includes("linkedin.com")) return "LinkedIn";
  if (lower.includes("x.com") || lower.includes("twitter.com")) return "X";
  if (lower.includes("tiktok.com")) return "TikTok";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("reddit.com")) return "Reddit";
  return "";
}

export type PlatformCtaMeta = {
  label: string;
  bgClass: string;
  hoverClass: string;
  icon: LucideIcon;
};

export function getPlatformCtaMeta(platform: string | undefined, url: string): PlatformCtaMeta {
  const effective = platform?.trim() || detectPlatformFromUrl(url);
  switch (effective) {
    case "WhatsApp":
      return { label: "WhatsApp Grubuna Katıl", bgClass: "bg-[#25D366]", hoverClass: "hover:bg-[#1fb855]", icon: MessageCircle };
    case "Telegram":
      return { label: "Telegram Kanalına Katıl", bgClass: "bg-[#229ED9]", hoverClass: "hover:bg-[#1b8ac0]", icon: Send };
    case "Discord":
      return { label: "Discord Sunucusuna Katıl", bgClass: "bg-[#5865F2]", hoverClass: "hover:bg-[#4752C4]", icon: MessageCircle };
    case "Facebook":
      return { label: "Facebook Grubuna Katıl", bgClass: "bg-[#1877F2]", hoverClass: "hover:bg-[#1565CC]", icon: Users };
    case "Instagram":
      return { label: "Instagram'da Takip Et", bgClass: "bg-[#E1306C]", hoverClass: "hover:bg-[#c9265d]", icon: Heart };
    case "LinkedIn":
      return { label: "LinkedIn Grubuna Katıl", bgClass: "bg-[#0A66C2]", hoverClass: "hover:bg-[#084f9e]", icon: Briefcase };
    case "X":
      return { label: "X'te Takip Et", bgClass: "bg-slate-900", hoverClass: "hover:bg-slate-800", icon: ExternalLink };
    case "TikTok":
      return { label: "TikTok'ta Takip Et", bgClass: "bg-slate-900", hoverClass: "hover:bg-slate-800", icon: ExternalLink };
    case "YouTube":
      return { label: "YouTube'a Abone Ol", bgClass: "bg-[#FF0000]", hoverClass: "hover:bg-[#cc0000]", icon: ExternalLink };
    case "Reddit":
      return { label: "Reddit'te Katıl", bgClass: "bg-[#FF5700]", hoverClass: "hover:bg-[#e04d00]", icon: Users };
    default:
      return { label: "Gruba Katıl", bgClass: "bg-emerald-600", hoverClass: "hover:bg-emerald-700", icon: Link2 };
  }
}
