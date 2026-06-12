import { ExternalLink, HelpCircle, ImagePlus, LogOut, MapPin, Mail, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Owner hero for the premium profile editor (Experimental_2 pilot).
 * Pure presentation: every action is delegated to the page via callbacks and
 * all values come from the already-loaded profile payload.
 */
type PremiumProfileHeroProps = {
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  roleLabel: string | null;
  eyebrow: string | null;
  email: string | null;
  locationLabel: string | null;
  shortBio: string | null;
  completionPercentage: number;
  hasPartialData: boolean;
  /** Catalog slug for the public preview CTA; CTA is hidden when null. */
  publicProfileSlug: string | null;
  avatarUploading: boolean;
  avatarRemoving: boolean;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
  onShowHelp: () => void;
  onSignOut: () => void;
};

const HERO_SURFACE =
  "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))]";

const PremiumProfileHero = ({
  displayName,
  initials,
  avatarUrl,
  roleLabel,
  eyebrow,
  email,
  locationLabel,
  shortBio,
  completionPercentage,
  hasPartialData,
  publicProfileSlug,
  avatarUploading,
  avatarRemoving,
  onChangePhoto,
  onRemovePhoto,
  onShowHelp,
  onSignOut,
}: PremiumProfileHeroProps) => (
  <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
    <div className={`relative border-b border-border px-5 py-6 md:px-7 ${HERO_SURFACE}`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        {/* Avatar / initials fallback */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-24 w-24 shrink-0 rounded-[24px] object-cover shadow-lg ring-2 ring-background/90 md:h-28 md:w-28"
          />
        ) : (
          <div
            aria-label={displayName}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-lg ring-2 ring-background/90 md:h-28 md:w-28 md:text-3xl"
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
              {eyebrow}
            </p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="break-words text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {displayName}
            </h1>
            {roleLabel ? (
              <Badge variant="outline" className="rounded-full text-xs font-medium">
                {roleLabel}
              </Badge>
            ) : null}
            <Badge className="rounded-full border-violet-500/30 bg-violet-500/15 text-xs font-medium text-violet-700 dark:text-violet-400">
              Tamamlanma %{completionPercentage}
            </Badge>
            {hasPartialData ? (
              <Badge variant="destructive" className="rounded-full text-xs">
                Kısmi veri yüklendi
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {email ? (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {email}
              </span>
            ) : null}
            {locationLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {locationLabel}
              </span>
            ) : null}
          </div>

          {shortBio ? (
            <p className="mt-3 max-w-2xl break-words text-sm leading-relaxed text-foreground/80">
              {shortBio}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {publicProfileSlug ? (
              <Button asChild className="min-h-[44px] rounded-full sm:min-h-9">
                <Link to={`/directory/catalog/${publicProfileSlug}`}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Public Profili Görüntüle
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] rounded-full sm:min-h-9"
              onClick={onChangePhoto}
              disabled={avatarUploading || avatarRemoving}
            >
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {avatarUploading ? "Yükleniyor..." : avatarUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] rounded-full sm:min-h-9"
                onClick={onRemovePhoto}
                disabled={avatarUploading || avatarRemoving}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {avatarRemoving ? "Kaldırılıyor..." : "Fotoğrafı Kaldır"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="min-h-[44px] rounded-full sm:min-h-9"
              onClick={onShowHelp}
            >
              <HelpCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Yardım
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-[44px] rounded-full text-muted-foreground sm:min-h-9"
              onClick={onSignOut}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default PremiumProfileHero;
