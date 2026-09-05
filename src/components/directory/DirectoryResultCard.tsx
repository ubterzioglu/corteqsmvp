// Dizin sonucu — KART görünümü (revizyon 32ae55b9: "Kart gösterimi 'kuruluşlardaki'
// gibi olabilir. Sadece İnsanlarda satır satır olabilir.").
//
// Kişi ile kurum aynı satır biçiminde gösterilince ikisi ayırt edilemiyordu. Kurum
// kaydının taşıdığı bilgi (logo, açıklama, hizmet etiketi) satıra sığmıyor; kişi kaydı
// ise kartta boş duruyor. Bu yüzden `recordType` başına iki ayrı yüzey var:
// catalog_item → bu kart, member → DirectoryResultRow.

import { ArrowUpRight, MapPin, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";
import { trUpper } from "@/lib/text-normalization";

interface DirectoryResultCardProps {
  row: UnifiedDirectoryRow;
}

export const DirectoryResultCard = ({ row }: DirectoryResultCardProps) => {
  const initials = trUpper(
    row.title
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0] ?? "")
      .join(""),
  );
  const locationLabel = [row.city, row.country].filter(Boolean).join(" • ");

  return (
    <Link
      to={row.href}
      className="group flex h-full flex-col gap-3 rounded-[20px] border border-white/70 bg-white/85 p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)]"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-sm font-bold text-primary shadow-sm">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          ) : (
            <span className="text-base font-extrabold">{initials}</span>
          )}
          {row.isFeatured ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow">
              <Star className="h-2.5 w-2.5 text-white" fill="currentColor" />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug text-foreground">{row.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {row.roleLabel}
            </span>
            {row.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                <ShieldCheck className="h-3 w-3" />
                Onaylı
              </span>
            ) : null}
            {row.isClaimable ? (
              <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                Sahiplenilebilir
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {row.description ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{row.description}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {locationLabel ? (
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              {locationLabel}
            </span>
          ) : null}
          {row.specialLabel && row.specialValue ? (
            <span className="truncate">
              <span className="font-semibold text-foreground/70">{row.specialLabel}:</span> {row.specialValue}
            </span>
          ) : null}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
};

export default DirectoryResultCard;
