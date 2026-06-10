// Cadde 3.0 Faz 3 — çoklu ülke/şehir filtresi.
// UX, legacy src/components/feed/MultiCountryCityFilter.tsx'ten port edildi (freeze'deki
// dosyaya DOKUNULMADI); useIsPremium/kıta bağımlılıkları bilinçli olarak TAŞINMADI.
// Veri kaynağı geo_* değil cadde_countries/cities'tir (postlar yalnız bu kapsamda yaşar);
// katalog genişletmesi admin_import_cadde_geo_v1 ile yapılır (D-04).

import { useMemo, useState } from "react";
import { ChevronDown, Globe, MapPin, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CaddeCity, CaddeCountry } from "@/lib/cadde-types";

interface CaddeGeoFilterProps {
  countries: CaddeCountry[];
  /** Seçili ülkelere göre kapsamlanmış, alfabetik şehir listesi (listCaddeCities çıktısı). */
  cities: CaddeCity[];
  selectedCountries: string[];
  selectedCities: string[];
  /**
   * Tek birleşik callback: ülke kaldırma hem ülke hem şehir setini aynı anda değiştirir;
   * iki ayrı state güncellemesi URL tabanlı filtrede birbirini ezerdi.
   */
  onChange: (next: { countries: string[]; cities: string[] }) => void;
}

const CaddeGeoFilter = ({
  countries,
  cities,
  selectedCountries,
  selectedCities,
  onChange,
}: CaddeGeoFilterProps) => {
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const filteredCountries = useMemo(
    () =>
      countries
        .map((country) => country.name)
        .filter((name) => name.toLowerCase().includes(countrySearch.toLowerCase()))
        .sort((left, right) => left.localeCompare(right, "tr")),
    [countries, countrySearch],
  );

  const availableCities = useMemo(
    () =>
      Array.from(new Set(cities.map((city) => city.name)))
        .filter((name) => name.toLowerCase().includes(citySearch.toLowerCase()))
        .sort((left, right) => left.localeCompare(right, "tr")),
    [cities, citySearch],
  );

  const toggleCountry = (name: string) => {
    const has = selectedCountries.includes(name);
    const nextCountries = has ? selectedCountries.filter((item) => item !== name) : [...selectedCountries, name];

    // Ülke kaldırılınca o ülkeye ait seçili şehirler de düşer (filtre tutarlılığı).
    let nextCities = selectedCities;
    if (has) {
      const removedCountry = countries.find((country) => country.name === name);
      if (removedCountry) {
        const removedCityNames = new Set(
          cities.filter((city) => city.countryId === removedCountry.id).map((city) => city.name),
        );
        nextCities = selectedCities.filter((cityName) => !removedCityNames.has(cityName));
      }
    }

    onChange({ countries: nextCountries, cities: nextCities });
  };

  const toggleCity = (name: string) => {
    const has = selectedCities.includes(name);
    onChange({
      countries: selectedCountries,
      cities: has ? selectedCities.filter((item) => item !== name) : [...selectedCities, name],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Globe className="h-4 w-4 text-orange-500" />
              {selectedCountries.length === 0 ? "Tüm Ülkeler" : `${selectedCountries.length} Ülke`}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <div className="border-b border-border p-2">
              <Input
                placeholder="Ülke ara..."
                value={countrySearch}
                onChange={(event) => setCountrySearch(event.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {filteredCountries.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">Ülke bulunamadı</div>
              ) : null}
              {filteredCountries.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCountry(name)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Checkbox checked={selectedCountries.includes(name)} />
                  <span className="flex-1 truncate">{name}</span>
                </button>
              ))}
            </div>
            {selectedCountries.length > 0 ? (
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => {
                    onCountriesChange([]);
                    onCitiesChange([]);
                  }}
                >
                  Tümünü Temizle
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              {selectedCities.length === 0 ? "Tüm Şehirler" : `${selectedCities.length} Şehir`}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <div className="border-b border-border p-2">
              <Input
                placeholder="Şehir ara..."
                value={citySearch}
                onChange={(event) => setCitySearch(event.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {availableCities.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">Şehir bulunamadı</div>
              ) : null}
              {availableCities.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCity(name)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Checkbox checked={selectedCities.includes(name)} />
                  <span className="flex-1 truncate">{name}</span>
                </button>
              ))}
            </div>
            {selectedCities.length > 0 ? (
              <div className="border-t border-border p-2">
                <Button variant="ghost" size="sm" className="h-7 w-full text-xs" onClick={() => onCitiesChange([])}>
                  Şehirleri Temizle
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      {selectedCountries.length > 0 || selectedCities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.map((name) => (
            <Badge key={name} variant="outline" className="gap-1 pr-1">
              {name}
              <button type="button" onClick={() => toggleCountry(name)} className="rounded p-0.5 hover:bg-muted" aria-label={`${name} filtresini kaldır`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCities.map((name) => (
            <Badge key={name} variant="secondary" className="gap-1 pr-1">
              <MapPin className="h-3 w-3" /> {name}
              <button type="button" onClick={() => toggleCity(name)} className="rounded p-0.5 hover:bg-muted" aria-label={`${name} filtresini kaldır`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CaddeGeoFilter;
