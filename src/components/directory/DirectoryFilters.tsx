import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import type { DirectoryRoleOption } from "@/lib/catalog-directory";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [roleOpen, setRoleOpen] = useState(false);

  const allRoleOptions = [
    { key: "all", label: "Tümü" },
    ...roleOptions,
    { key: "featured", label: "Featured" },
  ];

  const selectedRoleLabel =
    roleFilter === "all"
      ? "Ne arıyorsun?"
      : featuredOnly
        ? "Featured"
        : (allRoleOptions.find((o) => o.key === roleFilter)?.label ?? "Ne arıyorsun?");

  const handleRoleSelect = (key: string) => {
    setRoleOpen(false);
    if (key === "featured") {
      onFeaturedChange(!featuredOnly);
      return;
    }
    onFeaturedChange(false);
    onRoleChange(key);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Role dropdown */}
      <Popover open={roleOpen} onOpenChange={setRoleOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={roleOpen}
            className={cn(
              "h-10 w-full justify-between rounded-xl border-border/60 bg-white/60 px-3 text-sm font-normal backdrop-blur-sm hover:bg-white/90",
              roleFilter === "all" && !featuredOnly && "text-muted-foreground",
            )}
          >
            <span className="truncate">{selectedRoleLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Ara..." />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                {allRoleOptions.map((option) => (
                  <CommandItem
                    key={option.key}
                    value={option.label}
                    onSelect={() => handleRoleSelect(option.key)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (option.key === "featured" ? featuredOnly : roleFilter === option.key)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Country dropdown */}
      <SearchableCountrySelect
        value={countryFilter || "all"}
        onChange={(value) => onCountryChange(value || "all")}
        countries={countryOptions ? ["all", ...countryOptions] : undefined}
        placeholder="Ülke"
        size="sm"
        allowClear={false}
        includeAllOptionLabel="Tüm Ülkeler"
      />

      {/* City dropdown */}
      <SearchableCitySelect
        value={cityFilter || "all"}
        onChange={(value) => onCityChange(value || "all")}
        countryName={countryFilter || undefined}
        placeholder={countryFilter ? `Tüm Şehirler - ${countryFilter}` : "Önce ülke seçin"}
        size="sm"
        allowClear={false}
        includeAllOptionLabel={countryFilter ? `Tüm Şehirler - ${countryFilter}` : undefined}
        disabled={!countryFilter}
      />
    </div>
  );
};

export default DirectoryFilters;
