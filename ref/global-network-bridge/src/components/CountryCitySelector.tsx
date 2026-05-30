import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDiaspora, countryList } from "@/contexts/DiasporaContext";
import { countryCities } from "@/data/countryCities";

interface Props {
  city: string;
  onCityChange: (city: string) => void;
  className?: string;
}

/** Stacked Country + City selector used at the top-right of category pages. */
const CountryCitySelector = ({ city, onCityChange, className = "" }: Props) => {
  const { selectedCountry, setSelectedCountry } = useDiaspora();

  const cities =
    selectedCountry === "all"
      ? Array.from(new Set(Object.values(countryCities).flat())).sort((a, b) =>
          a.localeCompare(b, "tr"),
        )
      : countryCities[selectedCountry] || [];

  const allCitiesLabel =
    selectedCountry === "all"
      ? "Tüm Şehirler"
      : `Tüm Şehirler — ${selectedCountry}`;

  return (
    <div className={`flex flex-col gap-2 w-full sm:w-56 ${className}`}>
      <Select
        value={selectedCountry}
        onValueChange={(v) => {
          setSelectedCountry(v);
          onCityChange("all");
        }}
      >
        <SelectTrigger className="h-9 text-xs bg-card border-border">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <SelectValue placeholder="Tüm Ülkeler" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          <SelectItem value="all">🌍 Tüm Ülkeler</SelectItem>
          {countryList.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={city} onValueChange={onCityChange}>
        <SelectTrigger className="h-9 text-xs bg-card border-border">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-turquoise shrink-0" />
            <SelectValue placeholder={allCitiesLabel} />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          <SelectItem value="all">{allCitiesLabel}</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CountryCitySelector;
