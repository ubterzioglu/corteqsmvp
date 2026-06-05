import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useDiaspora, countryList } from "@/contexts/DiasporaContext";
import { countryCities } from "@/data/countryCities";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";

interface Props {
  city: string;
  onCityChange: (city: string) => void;
  className?: string;
}

const CountryCitySelector = ({ city, onCityChange, className = "" }: Props) => {
  const { selectedCountry, setSelectedCountry } = useDiaspora();

  const countriesWithAll = useMemo(
    () => ["all", ...countryList],
    [],
  );

  const cities = useMemo(
    () =>
      selectedCountry === "all"
        ? Array.from(new Set(Object.values(countryCities).flat())).sort((a, b) =>
            a.localeCompare(b, "tr"),
          )
        : countryCities[selectedCountry] || [],
    [selectedCountry],
  );

  const allCitiesLabel =
    selectedCountry === "all"
      ? "Tüm Şehirler"
      : `Tüm Şehirler — ${selectedCountry}`;

  const citiesWithAll = useMemo(
    () => ["all", ...cities],
    [cities],
  );

  return (
    <div className={`flex flex-col gap-2 w-full sm:w-56 ${className}`}>
      <SearchableCountrySelect
        value={selectedCountry}
        onChange={(v) => {
          setSelectedCountry(v);
          onCityChange("all");
        }}
        countries={countriesWithAll}
        placeholder="🌍 Tüm Ülkeler"
        size="sm"
        allowClear={false}
      />
      <SearchableCitySelect
        value={city}
        onChange={onCityChange}
        countryName={selectedCountry === "all" ? undefined : selectedCountry}
        cities={selectedCountry === "all" ? citiesWithAll : citiesWithAll}
        placeholder={allCitiesLabel}
        size="sm"
        allowClear={false}
      />
    </div>
  );
};

export default CountryCitySelector;
