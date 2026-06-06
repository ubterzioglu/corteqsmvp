import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";

interface DirectoryResultRowProps {
  row: UnifiedDirectoryRow;
}

const DirectoryResultRow = ({ row }: DirectoryResultRowProps) => {
  const initials = row.title.slice(0, 2).toUpperCase();
  const locationLabel = [row.city, row.country].filter(Boolean).join(" • ");

  return (
    <Link
      to={row.href}
      className="group flex items-center gap-4 rounded-[24px] border border-border bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
        {row.imageUrl ? (
          <img src={row.imageUrl} alt={row.title} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{row.title}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {row.roleLabel}
          </span>
          {row.isFeatured ? <Badge className="px-2 py-0 text-[10px]">Featured</Badge> : null}
          {row.isVerified ? (
            <Badge variant="outline" className="px-2 py-0 text-[10px]">
              Onayli
            </Badge>
          ) : null}
          {row.recordType === "catalog_item" && row.isClaimable ? (
            <Badge variant="secondary" className="px-2 py-0 text-[10px]">
              Claimable
            </Badge>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {row.description ? <span className="truncate">{row.description}</span> : null}
          {locationLabel ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {locationLabel}
            </span>
          ) : null}
          {row.specialLabel && row.specialValue ? (
            <span>
              <span className="font-medium text-foreground">{row.specialLabel}:</span>{" "}
              {row.specialValue}
            </span>
          ) : null}
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
};

export default DirectoryResultRow;
