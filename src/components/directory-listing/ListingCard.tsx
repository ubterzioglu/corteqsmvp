/**
 * Public liste kartı — İşletmeler / Uzmanlar / Şehir Elçileri sayfalarının ortak kartı.
 *
 * Demo kayıtlar için `isDemo` verilir; rozet `@/components/DemoBadge` (kartın üst
 * kenarına yapışan geniş bant) ile çizilir — Kuruluşlar sayfasındaki davranışın
 * AYNISI. ⚠️ Depoda iki ayrı `DemoBadge` var: `@/components/common/DemoBadge`
 * düğmelerin köşesine konan MİNİK rozettir ve `DEMO_ROUTES` desenine aittir.
 * Kart bandı için o değil, bu kullanılır.
 */

import { Link } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import DemoBadge from "@/components/DemoBadge";
import { trUpper } from "@/lib/text-normalization";
import { trTitleCasePlace } from "@/lib/public-listing-filter";
import type { PublicCatalogRow } from "@/lib/public-catalog-api";

interface ListingCardProps {
  row: PublicCatalogRow;
  /** Rozette görünen Türkçe rol etiketi. Bilinmiyorsa rozet çizilmez. */
  roleLabel: string | null;
  isDemo?: boolean;
}

/**
 * Ad baş harfleri — `trUpper` ZORUNLU. Bare `toUpperCase()` Türkçe'de yanlıştır
 * (`"irem"` → `"IREM"` olur, doğrusu `"İREM"`); CLAUDE.md avatar baş harflerini
 * bu kuralın kapsamında açıkça sayıyor.
 */
const initialsOf = (title: string): string => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.slice(0, 2).map((word) => trUpper(word.slice(0, 1)));
  return letters.join("");
};

const ListingCard = ({ row, roleLabel, isDemo = false }: ListingCardProps) => {
  const place = [trTitleCasePlace(row.city), row.countryName].filter(Boolean).join(", ");

  return (
    <Link
      to={row.href}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-6 pt-9 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {isDemo ? <DemoBadge variant="card" /> : null}

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-secondary-foreground">
          {initialsOf(row.title)}
        </div>
        <div className="min-w-0">
          {roleLabel ? (
            <span className="mb-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {roleLabel}
            </span>
          ) : null}
          <h3 className="flex items-center gap-1.5 truncate font-bold text-foreground">
            <span className="truncate">{row.title}</span>
            {row.isVerified ? (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-turquoise"
                aria-label="Doğrulanmış kayıt"
              />
            ) : null}
          </h3>
        </div>
      </div>

      {place ? (
        <p className="mb-3 flex items-center gap-1 font-body text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {place}
        </p>
      ) : null}

      {row.headline ? (
        <p className="line-clamp-2 font-body text-sm text-muted-foreground">{row.headline}</p>
      ) : null}

      {/* `short_description` ölçümde şehir elçilerinin hiçbirinde YOKTU; varsa
          ikinci satır olarak gösterilir, yoksa kart kısalır (boş kutu çizilmez). */}
      {row.description && row.description !== row.headline ? (
        <p className="mt-2 line-clamp-2 font-body text-sm text-muted-foreground/80">
          {row.description}
        </p>
      ) : null}
    </Link>
  );
};

export default ListingCard;
