import {
  Briefcase,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
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
