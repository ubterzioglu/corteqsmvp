import { ArrowUpRight, MapPin, Star, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";
import { trUpper } from "@/lib/text-normalization";

interface DirectoryResultRowProps {
  row: UnifiedDirectoryRow;
}

const roleColorMap: Record<string, string> = {
  doctor: "bg-blue-50 text-blue-700 border-blue-200",
  lawyer: "bg-purple-50 text-purple-700 border-purple-200",
  engineer: "bg-orange-50 text-orange-700 border-orange-200",
  business: "bg-emerald-50 text-emerald-700 border-emerald-200",
  default: "bg-primary/10 text-primary border-primary/20",
};

const getRoleColor = (roleKey: string) =>
  roleColorMap[roleKey] ?? roleColorMap.default;

const DirectoryResultRow = ({ row }: DirectoryResultRowProps) => {
  const initials = trUpper(
    row.title
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
  );
  const locationLabel = [row.city, row.country].filter(Boolean).join(" • ");

  return (
    <Link
      to={row.href}
      className="group relative flex items-center gap-4 rounded-[20px] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)]"
    >
      {/* Avatar */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-sm font-bold text-primary shadow-sm">
        {row.imageUrl ? (
          <img src={row.imageUrl} alt={row.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-base font-extrabold">{initials}</span>
        )}
        {row.isFeatured ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow">
            <Star className="h-2.5 w-2.5 text-white" fill="currentColor" />
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{row.title}</span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRoleColor(row.roleKey)}`}
          >
            {row.roleLabel}
          </span>
          {row.isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              <ShieldCheck className="h-3 w-3" />
              Onaylı
            </span>
          ) : null}
          {row.recordType === "catalog_item" && row.isClaimable ? (
            <Badge variant="secondary" className="px-2 py-0 text-[10px]">
              Sahiplenilebilir
            </Badge>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {row.description ? (
            <span className="line-clamp-1 max-w-xs">{row.description}</span>
          ) : null}
          {locationLabel ? (
            <span className="flex shrink-0 items-center gap-1 font-medium text-muted-foreground/80">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              {locationLabel}
            </span>
          ) : null}
          {row.specialLabel && row.specialValue ? (
            <span className="shrink-0">
              <span className="font-semibold text-foreground/70">{row.specialLabel}:</span>{" "}
              {row.specialValue}
            </span>
          ) : null}
        </div>
      </div>

      {/* Arrow */}
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
};

export default DirectoryResultRow;
