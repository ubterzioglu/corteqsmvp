import type { ReactNode } from "react";
import { BadgeCheck, MapPin, Sparkles, UserCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROFILE_TYPE_TIP } from "@/lib/profile-attribute-keys";

import { ProfileInfoTip } from "./ProfileInfoTip";
import {
  GOOGLE_SOFT_CARD_BLUE_SECTION,
  GOOGLE_SOFT_CARD_HERO,
  GOOGLE_SOFT_CARD_SUBTLE,
  GOOGLE_SOFT_HERO_SURFACE,
} from "./profile-card-styles";

export type ProfileLegacyHeroCardProps = {
  isIndividualProfile: boolean;
  avatarUrl: string;
  displayName: string;
  initials: string;
  hasPartialData: boolean;
  heroDescription: string;
  email: string;
  profileTypeLabel: string;
  locationLabel: string;
  roleSpotlight: string;
  roleTitle: string;
  completionPercentage: number;
  pendingCount: number;
  /** Bireysel profilde hero'nun sağındaki eylem paneli. */
  heroActionButtons: ReactNode;
  /** Bireysel olmayan profilde başlığın altındaki avatar eylemleri. */
  avatarActionButtons: ReactNode;
};

/** Premium pilot dışındaki (legacy) düzenin en üstteki profil kartı. */
export const ProfileLegacyHeroCard = ({
  isIndividualProfile,
  avatarUrl,
  displayName,
  initials,
  hasPartialData,
  heroDescription,
  email,
  profileTypeLabel,
  locationLabel,
  roleSpotlight,
  roleTitle,
  completionPercentage,
  pendingCount,
  heroActionButtons,
  avatarActionButtons,
}: ProfileLegacyHeroCardProps) => {
  return (
    <Card className={isIndividualProfile ? GOOGLE_SOFT_CARD_HERO : GOOGLE_SOFT_CARD_BLUE_SECTION}>
      {isIndividualProfile ? (
        <div className={GOOGLE_SOFT_HERO_SURFACE}>
          <CardHeader className="flex flex-col gap-5 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-[0_4px_16px_-4px_rgba(249,115,22,0.3)]"
                />
              ) : (
                <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-[11px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(249,115,22,0.45)]">
                  {initials}
                </div>
              )}
              <div className="space-y-2">
                {hasPartialData ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive" className="text-[11px]">Kısmi veri yüklendi</Badge>
                  </div>
                ) : null}
                <div>
                  <CardTitle className="text-[11px] tracking-tight text-slate-950 md:text-[11px]">{displayName}</CardTitle>
                  {heroDescription ? (
                    <CardDescription className="mt-1 max-w-2xl text-[11px] text-slate-600">
                      {heroDescription}
                    </CardDescription>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <UserCircle2 className="h-3.5 w-3.5" /> {email}
                  </span>
                  <span className="inline-flex items-center gap-1.5" data-testid="profile-type-chip">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> Profil tipi:
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{profileTypeLabel}</Badge>
                    <ProfileInfoTip label="Profil tipi" text={PROFILE_TYPE_TIP} />
                  </span>
                  {locationLabel ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {locationLabel}
                    </span>
                  ) : null}
                  {roleSpotlight ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> İlgi odağı: {roleSpotlight}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            {heroActionButtons}
          </CardHeader>
        </div>
      ) : null}
      {!isIndividualProfile ? (
        <>
          <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-[11px]">{roleTitle}</CardTitle>
              <div className="flex flex-wrap items-center gap-1.5" data-testid="profile-type-chip">
                <span className="text-[11px] text-muted-foreground">Profil tipi:</span>
                <Badge variant="secondary" className="text-[11px]">{profileTypeLabel}</Badge>
                <ProfileInfoTip label="Profil tipi" text={PROFILE_TYPE_TIP} />
                <Badge variant="outline" className="text-[11px]">Tamamlanma %{completionPercentage}</Badge>
                {hasPartialData ? <Badge variant="destructive" className="text-[11px]">Kısmi veri yüklendi</Badge> : null}
              </div>
              <div className="pt-1">
                {avatarActionButtons}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 pb-4 md:grid-cols-3">
            <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Görünen İsim</p>
              <p className="mt-1 text-[11px] font-semibold">{displayName}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">E-posta</p>
              <p className="mt-1 break-all text-[11px]">{email}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Bekleyen Talep</p>
              <p className="mt-1 text-[11px] font-semibold">{pendingCount}</p>
            </div>
          </CardContent>
        </>
      ) : null}
    </Card>
  );
};

export default ProfileLegacyHeroCard;
