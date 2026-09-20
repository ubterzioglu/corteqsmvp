import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { ProfileAccent } from "./public-profile-utils";

const ICON_TEXT_BY_ACCENT: Record<ProfileAccent, string> = {
  orange: "text-orange-600 dark:text-orange-400",
  blue: "text-sky-600 dark:text-sky-400",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-rose-600 dark:text-rose-400",
  purple: "text-violet-600 dark:text-violet-400",
};

interface PublicProfileSectionFrameProps {
  title: string;
  description?: string | null;
  Icon: LucideIcon;
  accent: ProfileAccent;
  children: ReactNode;
}

/**
 * Inner card following the IndividualPublicView bottom-card pattern.
 *
 * ⚠️ BURAYA `h-full` GERİ EKLEME (kaldırıldı 2026-09-20). Kartlar doğrudan
 * grid hücresi DEĞİL, `PublicProfileSectionList` içindeki `space-y-4` bloğunun
 * çocuklarıdır. O blok ise `grid`in çocuğu olduğu için `align-items: stretch`
 * ile KESİN bir yükseklik alır — dolayısıyla `h-full` "kendi içeriğim kadar"
 * değil, "TÜM KOLON kadar" demek olur. Kolonda iki ya da daha çok bölüm varsa
 * her biri kolon boyuna şişer, blok taşar ve bir SONRAKİ içeriğin (yan kolonun
 * "Profil Güvencesi" kartının, hatta footer'ın) üstüne biner.
 *
 * Canlıda ölçüldü: /directory/catalog/dortmund-doktor-suleyman-soyturk,
 * 390px genişlik — "Hizmetler" ve "Profil Güvencesi" kartları aynı `top`
 * değerinde üst üste çiziliyordu. Tek bölümlü profillerde kusur GÖRÜNMEZ
 * (h-full o zaman kartın kendi boyuna eşit), bu yüzden sessizce yaşadı.
 */
const PublicProfileSectionFrame = ({
  title,
  description,
  Icon,
  accent,
  children,
}: PublicProfileSectionFrameProps) => (
  <section className="rounded-[22px] border border-border bg-background/70 p-4 md:p-5">
    <div className="mb-3 flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${ICON_TEXT_BY_ACCENT[accent]}`} aria-hidden="true" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    {description ? <p className="-mt-1 mb-3 text-xs text-muted-foreground">{description}</p> : null}
    {children}
  </section>
);

export default PublicProfileSectionFrame;
