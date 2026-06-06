import SearchableCitySelect from "@/components/SearchableCitySelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import type { DirectoryRoleOption } from "@/lib/catalog-directory";
import { cn } from "@/lib/utils";

interface DirectoryFiltersProps {
  roleOptions: DirectoryRoleOption[];
  roleFilter: string;
  onRoleChange: (role: string) => void;
  countryFilter: string;
  cityFilter: string;
  featuredOnly: boolean;
  countryOptions?: string[];
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onFeaturedChange: (value: boolean) => void;
}

const pillBase =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5";
const pillActive = "border-primary/60 bg-primary text-primary-foreground shadow-sm";
const pillInactive =
  "border-border/60 bg-white/60 text-foreground/80 backdrop-blur-sm hover:bg-white/90";

const DirectoryFilters = ({
  roleOptions,
  roleFilter,
  onRoleChange,
  countryFilter,
  cityFilter,
  featuredOnly,
  countryOptions,
  onCountryChange,
  onCityChange,
  onFeaturedChange,
}: DirectoryFiltersProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRoleChange("all")}
          className={cn(pillBase, roleFilter === "all" ? pillActive : pillInactive)}
        >
          Tumu
        </button>
        {roleOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onRoleChange(option.key)}
            className={cn(pillBase, roleFilter === option.key ? pillActive : pillInactive)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onFeaturedChange(!featuredOnly)}
          className={cn(pillBase, featuredOnly ? pillActive : pillInactive)}
        >
          Featured
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SearchableCountrySelect
          value={countryFilter || "all"}
          onChange={(value) => onCountryChange(value || "all")}
          countries={countryOptions ? ["all", ...countryOptions] : undefined}
          placeholder="Ulke"
          size="sm"
          allowClear={false}
          includeAllOptionLabel="Tum Ulkeler"
        />
        <SearchableCitySelect
          value={cityFilter || "all"}
          onChange={(value) => onCityChange(value || "all")}
          countryName={countryFilter || undefined}
          placeholder={countryFilter ? `Tum Sehirler - ${countryFilter}` : "Once ulke secin"}
          size="sm"
          allowClear={false}
          includeAllOptionLabel={countryFilter ? `Tum Sehirler - ${countryFilter}` : undefined}
          disabled={!countryFilter}
        />
      </div>
    </div>
  );
};

export default DirectoryFilters;
