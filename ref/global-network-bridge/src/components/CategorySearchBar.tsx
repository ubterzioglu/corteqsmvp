import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CategorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional summary text rendered next to the bar (e.g. "12 sonuç"). */
  resultsLabel?: string;
  className?: string;
}

/**
 * Reusable, design-system-aligned search input for category listing pages.
 * Filters in-page client-side; pages decide how to apply the value.
 */
const CategorySearchBar = ({
  value,
  onChange,
  placeholder = "İsim, uzmanlık, şehir veya anahtar kelime ile ara…",
  resultsLabel,
  className = "",
}: CategorySearchBarProps) => {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9 h-10"
          aria-label="Bu kategoride ara"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onChange("")}
            aria-label="Aramayı temizle"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {resultsLabel && (
        <span className="text-xs text-muted-foreground hidden sm:inline">{resultsLabel}</span>
      )}
    </div>
  );
};

export default CategorySearchBar;
