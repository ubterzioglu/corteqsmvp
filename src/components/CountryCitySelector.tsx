import { useMemo } from "react";
import { useDiaspora } from "@/contexts/DiasporaContext";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import { useGeoCountries } from "@/hooks/useGeo";

interface Props {
  city: string;
  onCityChange: (city: string) => void;
  className?: string;
}

const CountryCitySelector = ({ city, onCityChange, className = "" }: Props) => {
  const { selectedCountry, setSelectedCountry } = useDiaspora();
  const countriesQuery = useGeoCountries();

  const countriesWithAll = useMemo(
    () => ["all", ...(countriesQuery.data ?? []).map((country) => country.name)],
    [countriesQuery.data],
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
        includeAllOptionLabel="🌍 Tüm Ülkeler"
      />
      <SearchableCitySelect
        value={city}
        onChange={onCityChange}
        countryName={selectedCountry === "all" ? undefined : selectedCountry}
        placeholder={selectedCountry === "all" ? "Önce ülke seçin" : `Tüm Şehirler — ${selectedCountry}`}
        size="sm"
        allowClear={false}
        includeAllOptionLabel={selectedCountry === "all" ? undefined : `Tüm Şehirler — ${selectedCountry}`}
        disabled={selectedCountry === "all"}
      />
    </div>
  );
};

export default CountryCitySelector;
