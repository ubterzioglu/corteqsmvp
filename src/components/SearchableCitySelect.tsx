import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { countryCities } from "@/data/countryCities";
import { filterByQuery } from "@/lib/country-city-search";

export interface SearchableCitySelectProps {
  value: string;
  onChange: (value: string) => void;
  countryName?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "xs";
  allowClear?: boolean;
  cities?: string[];
  label?: string;
  id?: string;
  name?: string;
}

const sizeClasses = {
  default: "h-10",
  sm: "h-9",
  xs: "h-7 text-xs",
};

const SearchableCitySelect = ({
  value,
  onChange,
  countryName,
  placeholder = "Şehir seçin",
  disabled = false,
  className,
  size = "default",
  allowClear = true,
  cities: externalCities,
  id,
  name,
}: SearchableCitySelectProps) => {
  const [open, setOpen] = useState(false);

  const cities = useMemo(() => {
    if (externalCities) return externalCities;
    if (!countryName) return [];
    return countryCities[countryName] || [];
  }, [externalCities, countryName]);

  const isDisabled = disabled || (!externalCities && !countryName);

  const displayValue = value || "";

  const valueExists = value && cities.includes(value);

  return (
    <div className={cn("relative", className)}>
      <input type="hidden" id={id} name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className={cn(
              "w-full justify-between font-normal",
              sizeClasses[size],
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {displayValue || placeholder}
            </span>
            <span className="flex items-center gap-0.5 shrink-0">
              {allowClear && value && !isDisabled && (
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded-sm opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange("");
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command filter={(itemValue, search) => {
            const normalized = filterByQuery([itemValue], search);
            return normalized.length > 0 ? 1 : 0;
          }}>
            <CommandInput placeholder="Ara..." />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı</CommandEmpty>
              <CommandGroup>
                {value && !valueExists && (
                  <CommandItem
                    value={value}
                    onSelect={() => {
                      onChange(value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", "opacity-100")} />
                    <span className="italic">Mevcut: {value}</span>
                  </CommandItem>
                )}
                {cities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      onChange(city === value ? "" : city);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === city ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchableCitySelect;
