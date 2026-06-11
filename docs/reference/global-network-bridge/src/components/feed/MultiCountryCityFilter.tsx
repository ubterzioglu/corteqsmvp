import { useMemo, useState } from "react";
import { Globe, MapPin, X, ChevronDown, Sparkles, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { allCountries, countryCities } from "@/data/countryCities";
import { continents, continentList } from "@/data/continents";

interface Props {
  selectedCountries: string[];
  selectedCities: string[];
  selectedContinent: string | null;
  onCountriesChange: (v: string[]) => void;
  onCitiesChange: (v: string[]) => void;
  onContinentChange: (v: string | null) => void;
  /** TR'de yaşayan / TR numaralı kullanıcılar yalnızca Türkiye, Köprü ve Global akışı görüntüleyebilir. */
  restrictTR?: boolean;
  /** Gerçek vs Demo akış toggle */
  demoMode?: boolean;
  onDemoModeChange?: (v: boolean) => void;
}

const MultiCountryCityFilter = ({
  selectedCountries,
  selectedCities,
  selectedContinent,
  onCountriesChange,
  onCitiesChange,
  onContinentChange,
  restrictTR = false,
  demoMode = false,
  onDemoModeChange,
}: Props) => {
  
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const filteredCountries = useMemo(
    () => {
      const base = restrictTR ? allCountries.filter((c) => c === "Türkiye") : allCountries;
      return base.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()));
    },
    [countrySearch, restrictTR],
  );

  const availableCities = useMemo(() => {
    let source: string[];
    if (selectedContinent) {
      source = (continents[selectedContinent] || []).flatMap((c) => countryCities[c] || []);
    } else if (selectedCountries.length > 0) {
      source = selectedCountries.flatMap((c) => countryCities[c] || []);
    } else {
      source = Object.values(countryCities).flat();
    }
    return Array.from(new Set(source))
      .filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "tr"));
  }, [selectedContinent, selectedCountries, citySearch]);

  // Single-country mode: only one country active at a time. Re-clicking the
  // active country clears the selection.
  const toggleCountry = (val: string) => {
    const has = selectedCountries.includes(val);
    if (selectedContinent) onContinentChange(null);
    onCountriesChange(has ? [] : [val]);
    // Clear cities when switching country to avoid stale city scope
    if (!has) onCitiesChange([]);
  };

  const toggleCity = (val: string) => {
    const has = selectedCities.includes(val);
    onCitiesChange(has ? selectedCities.filter((x) => x !== val) : [...selectedCities, val]);
  };

  const pickContinent = (cont: string | null) => {
    onContinentChange(cont);
    // Continent overrides individual country picks
    if (cont) onCountriesChange([]);
    onCitiesChange([]);
  };

  const isGlobal =
    !selectedContinent && selectedCountries.length === 0 && selectedCities.length === 0;

  const isKopru = selectedCountries.length === 1 && selectedCountries[0] === "Köprü";

  const pickKopru = () => {
    onContinentChange(null);
    onCitiesChange([]);
    onCountriesChange(isKopru ? [] : ["Köprü"]);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Caddeye Çık — global akış + Gerçek/Demo toggle */}
      <div className="flex flex-col gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { pickContinent(null); onCountriesChange([]); onCitiesChange([]); }}
          className="gap-1.5 h-auto py-1.5 flex-col items-start self-start"
        >
          <span className="text-xs font-semibold leading-tight">Caddeye Çık →</span>
          <span className="text-[10px] text-muted-foreground leading-tight">global akış</span>
        </Button>
        {onDemoModeChange && (
          <div className="inline-flex items-center rounded-md border border-border bg-muted/30 p-0.5 self-start">
            <button
              type="button"
              onClick={() => onDemoModeChange(false)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded ${!demoMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Veritabanındaki gerçek paylaşımları göster"
            >
              Gerçek
            </button>
            <button
              type="button"
              onClick={() => onDemoModeChange(true)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded ${demoMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Globaldeki kalabalık demo akışı göster"
            >
              Demo
            </button>
          </div>
        )}
        <span className="text-[10px] text-muted-foreground leading-tight px-0.5">
          {demoMode ? "🎬 Demo: globaldeki kalabalık akış" : "📡 Gerçek: kullanıcı paylaşımları"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Countries */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9"
              disabled={!!selectedContinent}
            >
              <Globe className="h-4 w-4 text-primary" />
              {selectedCountries.length === 0
                ? selectedContinent
                  ? "Kıta Aktif"
                  : "Ülke"
                : selectedCountries[0]}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <div className="p-2 border-b border-border">
              <Input
                placeholder="Ülke ara..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {filteredCountries.map((c) => {
                const checked = selectedCountries.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCountry(c)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                  >
                    <span
                      className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}
                    />
                    <span className="flex-1 truncate">{c}</span>
                  </button>
                );
              })}
            </div>
            {selectedCountries.length > 0 && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => { onCountriesChange([]); onCitiesChange([]); }}
                >
                  Tümünü Temizle
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Cities — TR kullanıcılar için gizli */}
        {!restrictTR && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <MapPin className="h-4 w-4 text-turquoise" />
              {selectedCities.length === 0
                ? "Şehir"
                : `${selectedCities.length} Şehir`}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <div className="p-2 border-b border-border">
              <Input
                placeholder="Şehir ara..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {availableCities.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  Şehir bulunamadı
                </div>
              )}
              {availableCities.map((c) => {
                const checked = selectedCities.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCity(c)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                  >
                    <Checkbox checked={checked} />
                    <span className="flex-1 truncate">{c}</span>
                  </button>
                );
              })}
            </div>
            {selectedCities.length > 0 && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => onCitiesChange([])}
                >
                  Şehirleri Temizle
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        )}

        {/* Köprü — TR↔Diaspora ortak cadde */}
        <Button
          variant={isKopru ? "default" : "outline"}
          size="sm"
          onClick={pickKopru}
          className="gap-1.5 h-9"
          title="TR-Diaspora arasında: Taşınanlar / İş Yapanlar / Mentör Arayanlar"
        >
          <Pin className="h-4 w-4" />
          🌉 Köprü
        </Button>

      </div>

      <p className="text-[10px] text-muted-foreground leading-snug px-0.5">
        🌉 <strong>Köprü</strong>: TR–Diaspora arasında <em>Taşınanlar / İş Yapanlar / Mentör Arayanlar</em> için ortak akış.
      </p>

      {(selectedContinent || selectedCountries.length > 0 || selectedCities.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedContinent && (
            <Badge variant="outline" className="gap-1 pr-1 border-amber-400">
              <Sparkles className="h-3 w-3 text-amber-500" /> {selectedContinent}
              <button onClick={() => pickContinent(null)} className="hover:bg-muted rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCountries.map((c) => (
            <Badge key={c} variant="outline" className="gap-1 pr-1">
              {c}
              <button onClick={() => toggleCountry(c)} className="hover:bg-muted rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCities.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1 pr-1">
              <MapPin className="h-3 w-3" /> {c}
              <button onClick={() => toggleCity(c)} className="hover:bg-muted rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiCountryCityFilter;
