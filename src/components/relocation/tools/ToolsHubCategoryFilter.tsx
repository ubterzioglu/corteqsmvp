// Araç hub kategori filtresi — "Tümü / Taşınma / Almanya / Nesil" çipleri.
// Sekmeler gelen veriden üretilir (buildCategoryFilters); burada yalnızca sunum var.
import type { ToolCategoryFilter } from "@/lib/relocation-tools-category";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { cn } from "@/lib/utils";

interface ToolsHubCategoryFilterProps {
  categories: ToolCategoryFilter[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function ToolsHubCategoryFilter({
  categories,
  activeKey,
  onSelect,
}: ToolsHubCategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={TOOLS_UI_COPY.hubFilterLabel}
      className="flex flex-wrap justify-center gap-2"
    >
      {categories.map((category) => {
        const isActive = category.key === activeKey;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onSelect(category.key)}
            aria-pressed={isActive}
            className={cn(
              // min-h-11 = 44px dokunma hedefi.
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium",
              "transition-colors duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <category.Icon className="h-4 w-4" aria-hidden="true" />
            {category.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                isActive ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
              )}
            >
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
