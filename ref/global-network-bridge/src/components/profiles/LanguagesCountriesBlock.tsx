import { Badge } from "@/components/ui/badge";
import { Languages, MapPinned } from "lucide-react";

export type CountryLived = { country: string; from?: string | number | null; to?: string | number | null };

interface Props {
  languages?: string[] | null;
  countries?: CountryLived[] | null;
  compact?: boolean;
}

const formatYears = (c: CountryLived) => {
  const from = c.from ? String(c.from) : "";
  const to = c.to ? String(c.to) : "halen";
  if (!from && !c.to) return "";
  return ` (${from}${from || c.to ? "–" : ""}${to})`;
};

const LanguagesCountriesBlock = ({ languages, countries, compact }: Props) => {
  const langs = (languages || []).filter(Boolean);
  const ctrs = (countries || []).filter((c) => c && c.country);
  if (langs.length === 0 && ctrs.length === 0) return null;

  return (
    <div className={`flex flex-col gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
      {langs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Languages className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground">Diller:</span>
          {langs.map((l) => (
            <Badge key={l} variant="secondary" className="text-[10px] py-0 px-1.5 h-5">{l}</Badge>
          ))}
        </div>
      )}
      {ctrs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapPinned className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] text-muted-foreground">Yaşadığı ülkeler:</span>
          {ctrs.slice(0, 3).map((c, i) => (
            <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 h-5 leading-none inline-flex items-center">
              {c.country}{formatYears(c)}
            </Badge>
          ))}
          {ctrs.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{ctrs.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguagesCountriesBlock;
