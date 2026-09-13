import { MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { approvalBadgeMeta, getCategoryMeta } from "@/lib/whatsapp-landing-presentation";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

interface LandingBadgeProps {
  landing: WhatsAppLanding;
}

export function LandingApprovalBadges({ landing }: LandingBadgeProps) {
  const badges = [];

  if (landing.memberApproved) {
    badges.push(approvalBadgeMeta.member);
  }

  if (landing.adminApproved) {
    badges.push(approvalBadgeMeta.admin);
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {badges.map((badge) => (
        <Tooltip key={badge.label}>
          <TooltipTrigger asChild>
            <Badge className={`flex h-8 w-full cursor-default items-center justify-center border px-3 text-center text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{badge.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// Detail-view badge stack. Kept verbatim from AddWhatsAppPage: it is currently not
// rendered by any view (the detail page uses LandingDetailMetaCards instead).
export function LandingDetailBadgeStack({ landing }: LandingBadgeProps) {
  const badges: JSX.Element[] = [];

  // Approval badges (detail view style)
  if (landing.memberApproved) {
    badges.push(
      <Tooltip key="member-badge">
        <TooltipTrigger asChild>
          <Badge className={`flex w-full cursor-default justify-center border px-3 py-1.5 text-center text-sm font-semibold ${approvalBadgeMeta.member.className}`}>
            {approvalBadgeMeta.member.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{approvalBadgeMeta.member.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (landing.adminApproved) {
    badges.push(
      <Tooltip key="admin-badge">
        <TooltipTrigger asChild>
          <Badge className={`flex w-full cursor-default justify-center border px-3 py-1.5 text-center text-sm font-semibold ${approvalBadgeMeta.admin.className}`}>
            {approvalBadgeMeta.admin.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{approvalBadgeMeta.admin.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Category badge (vibrant colors)
  const category = getCategoryMeta(landing.category);
  const Icon = category.icon;
  badges.push(
    <Badge key="category" className={`flex h-8 w-full cursor-default items-center justify-center border px-3 text-center text-xs font-semibold ${category.chipClass}`}>
      <Icon className="mr-1.5 h-3 w-3" />
      {category.label}
    </Badge>
  );

  // City badge (vivid slate)
  badges.push(
    <Badge key="city" className="flex w-full cursor-default justify-center border border-slate-700 bg-slate-600 px-3 py-1.5 text-center text-sm font-semibold text-white">
      <MapPin className="mr-2 h-4 w-4" />
      {landing.city}, {landing.country}
    </Badge>
  );

  // Admin badge (if present, vivid violet)
  if (landing.adminName) {
    badges.push(
      <Badge key="admin" className="flex w-full cursor-default justify-center border border-violet-600 bg-violet-500 px-3 py-1.5 text-center text-sm font-semibold text-white">
        <Users className="mr-2 h-4 w-4" />
        Yönetici: {landing.adminName}
      </Badge>
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex flex-col gap-2">{badges}</div>;
}
