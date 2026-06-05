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
import { allCountries } from "@/data/countryCities";
import { filterByQuery } from "@/lib/country-city-search";

export interface SearchableCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "xs";
  allowClear?: boolean;
  countries?: string[];
  label?: string;
  id?: string;
  name?: string;
}

const sizeClasses = {
  default: "h-10",
  sm: "h-9",
  xs: "h-7 text-xs",
};

const SearchableCountrySelect = ({
  value,
  onChange,
  placeholder = "Ülke seçin",
  disabled = false,
  className,
  size = "default",
  allowClear = true,
  countries,
  id,
  name,
}: SearchableCountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const list = countries ?? allCountries;

  const displayValue = value || "";

  const filteredList = useMemo(() => {
    return list;
  }, [list]);

  const valueExists = value && list.includes(value);

  return (
    <div className={cn("relative", className)}>
      <input type="hidden" id={id} name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
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
              {allowClear && value && !disabled && (
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
                {filteredList.map((country) => (
                  <CommandItem
                    key={country}
                    value={country}
                    onSelect={() => {
                      onChange(country === value ? "" : country);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === country ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {country}
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

export default SearchableCountrySelect;
