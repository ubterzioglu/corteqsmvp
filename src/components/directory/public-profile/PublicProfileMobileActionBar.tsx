import { CalendarDays, Globe, Mail, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicProfileQuickAction } from "@/lib/public-catalog-profile-view-model";

const ACTION_ICONS: Record<PublicProfileQuickAction["key"], typeof Globe> = {
  website: Globe,
  email: Mail,
  phone: Phone,
  map: MapPin,
  whatsapp: MessageCircle,
  appointment: CalendarDays,
};

interface PublicProfileMobileActionBarProps {
  actions: PublicProfileQuickAction[];
  onShare: () => void;
}

/**
 * Sticky bottom CTA bar for small screens (pilot presentation only).
 * Shows at most the two primary actions plus share; hidden on md+ where the
 * hero quick actions are always visible.
 */
const PublicProfileMobileActionBar = ({ actions, onShare }: PublicProfileMobileActionBarProps) => {
  const primaryActions = actions.filter((action) => action.variant === "primary").slice(0, 2);

  if (primaryActions.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur md:hidden">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
        {primaryActions.map((action) => {
          const Icon = ACTION_ICONS[action.key];
          return (
            <Button key={action.key} asChild className="min-h-[44px] flex-1 rounded-full">
              <a
                href={action.href}
                {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {action.label}
              </a>
            </Button>
          );
        })}
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] rounded-full px-3"
          onClick={onShare}
          aria-label="Profili paylaş"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

export default PublicProfileMobileActionBar;
