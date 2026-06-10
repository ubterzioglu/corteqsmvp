import { Globe, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PublicProfileQuickAction } from "@/lib/public-catalog-profile-view-model";

const ACTION_ICONS: Record<PublicProfileQuickAction["key"], typeof Globe> = {
  website: Globe,
  email: Mail,
  phone: Phone,
  map: MapPin,
};

interface PublicProfileQuickActionsProps {
  actions: PublicProfileQuickAction[];
  shareUrl: string;
  shareTitle: string;
}

const PublicProfileQuickActions = ({ actions, shareUrl, shareTitle }: PublicProfileQuickActionsProps) => {
  const handleShare = async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Profil bağlantısı kopyalandı");
    } catch (error: unknown) {
      // Kullanıcı paylaşım penceresini kapattıysa sessiz geç; diğer hatalarda bilgilendir.
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Bağlantı paylaşılamadı");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {actions.map((action) => {
        const Icon = ACTION_ICONS[action.key];
        return (
          <Button
            key={action.key}
            asChild
            variant="outline"
            size="sm"
            className="min-h-[44px] rounded-full sm:min-h-9"
          >
            <a
              href={action.href}
              {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {action.label}
            </a>
          </Button>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[44px] rounded-full sm:min-h-9"
        onClick={() => void handleShare()}
      >
        <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Paylaş
      </Button>
    </div>
  );
};

export default PublicProfileQuickActions;
