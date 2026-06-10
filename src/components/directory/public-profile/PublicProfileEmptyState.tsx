import { LayoutGrid } from "lucide-react";

/** Shown in the main column when a public profile has no visible sections yet. */
const PublicProfileEmptyState = () => (
  <div className="flex flex-col items-center rounded-[28px] border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
      <LayoutGrid className="h-5 w-5" aria-hidden="true" />
    </span>
    <p className="mt-4 text-sm font-medium text-foreground">Profil içeriği hazırlanıyor</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Bu profil için henüz detaylı bilgi eklenmemiş.
    </p>
  </div>
);

export default PublicProfileEmptyState;
