import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { countryCities } from "@/data/countryCities";

interface CityDropdownProps {
  country: string;
  city: string;
  onCityChange: (city: string) => void;
}

const CityDropdown = ({ country, city, onCityChange }: CityDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Build city list based on country
  const cities = country === "all"
    ? Array.from(new Set(Object.values(countryCities).flat())).sort((a, b) => a.localeCompare(b, 'tr'))
    : (countryCities[country] || []);

  const label = country === "all"
    ? (city === "all" ? "Tüm Şehirler" : city)
    : (city === "all" ? `Tüm Şehirler - ${country}` : city);

  const allLabel = country === "all" ? "Tüm Şehirler" : `Tüm Şehirler - ${country}`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (cities.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs px-3 h-9 whitespace-nowrap"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl overflow-hidden shadow-lg z-30">
          <ScrollArea className="max-h-64">
            <div className="p-1">
              <button
                onClick={() => { onCityChange("all"); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  city === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {allLabel}
              </button>
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => { onCityChange(c); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    city === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  {c}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default CityDropdown;
