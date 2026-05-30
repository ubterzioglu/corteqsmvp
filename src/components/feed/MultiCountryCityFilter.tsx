import { useMemo, useState } from "react";
import { Globe, MapPin, X, ChevronDown, Crown, Sparkles, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { allCountries, countryCities } from "@/data/countryCities";
import { continents, continentList } from "@/data/continents";
import { useIsPremium, FREE_COUNTRY_LIMIT } from "@/hooks/useIsPremium";
import { toast } from "@/hooks/use-toast";

interface Props {
  selectedCountries: string[];
  selectedCities: string[];
  selectedContinent: string | null;
  onCountriesChange: (v: string[]) => void;
  onCitiesChange: (v: string[]) => void;
  onContinentChange: (v: string | null) => void;
}

const MultiCountryCityFilter = ({
  selectedCountries,
  selectedCities,
  selectedContinent,
  onCountriesChange,
  onCitiesChange,
  onContinentChange,
}: Props) => {
  const isPremium = useIsPremium();
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const filteredCountries = useMemo(
    () => allCountries.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch],
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

  const toggleCountry = (val: string) => {
    const has = selectedCountries.includes(val);
    if (!has && !isPremium && selectedCountries.length >= FREE_COUNTRY_LIMIT) {
      toast({
        title: `Ücretsiz planda en fazla ${FREE_COUNTRY_LIMIT} ülke seçilebilir`,
        description: "Sınırsız seçim için Premium'a geçin veya bir kıta seçin.",
      });
      return;
    }
    // Choosing countries clears continent scope
    if (selectedContinent) onContinentChange(null);
    onCountriesChange(has ? selectedCountries.filter((x) => x !== val) : [...selectedCountries, val]);
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
      {/* Caddeye Çık — global akış */}
      <div className="flex">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { pickContinent(null); onCountriesChange([]); onCitiesChange([]); }}
          className="gap-1.5 h-auto py-1.5 flex-col items-start"
        >
          <span className="text-xs font-semibold leading-tight">Caddeye Çık →</span>
          <span className="text-[10px] text-muted-foreground leading-tight">global akış</span>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Continent picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {selectedContinent ?? "Kıta Seç"}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            <button
              onClick={() => pickContinent(null)}
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${!selectedContinent ? "bg-accent/50 font-medium" : ""}`}
            >
              🌍 Tüm Kıtalar
            </button>
            {continentList.map((cont) => (
              <button
                key={cont}
                onClick={() => pickContinent(cont)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${selectedContinent === cont ? "bg-accent/50 font-medium" : ""}`}
              >
                {cont}
              </button>
            ))}
          </PopoverContent>
        </Popover>

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
                  : "Tüm Ülkeler"
                : `${selectedCountries.length}${isPremium ? "" : `/${FREE_COUNTRY_LIMIT}`} Ülke`}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            {!isPremium && (
              <div className="px-3 py-2 border-b border-border bg-amber-500/5 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Crown className="h-3 w-3" />
                Ücretsiz: en fazla {FREE_COUNTRY_LIMIT} ülke ·
                <Link to="/pricing" className="underline font-medium">Premium</Link>
              </div>
            )}
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
                const limitHit =
                  !isPremium && !checked && selectedCountries.length >= FREE_COUNTRY_LIMIT;
                return (
                  <button
                    key={c}
                    onClick={() => toggleCountry(c)}
                    disabled={limitHit}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left ${limitHit ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Checkbox checked={checked} disabled={limitHit} />
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

        {/* Cities */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <MapPin className="h-4 w-4 text-turquoise" />
              {selectedCities.length === 0
                ? "Tüm Şehirler"
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

        {/* Köprü — herkese açık ortak cadde */}
        <Button
          variant={isKopru ? "default" : "outline"}
          size="sm"
          onClick={pickKopru}
          className="gap-1.5 h-9"
          title="Taşınacaklar & Diaspora ile İş Yapanlar"
        >
          <Pin className="h-4 w-4" />
          🌉 Köprü
        </Button>

        {isPremium && (
          <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Crown className="h-3 w-3" /> Premium · Sınırsız
          </Badge>
        )}
      </div>

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
