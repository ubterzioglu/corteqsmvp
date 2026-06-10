// Admin Panel V2 — ortak filtre çubuğu (masterplan §9.2 / §9.3).
// Sticky değildir; sticky gereken sayfa kendi wrapper'ında konumlandırır.

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type AdminFilterBarProps = {
  children: ReactNode;
  /** Verilirse sağda "Filtreleri sıfırla" butonu gösterilir. */
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
};

export function AdminFilterBar({
  children,
  onReset,
  resetLabel = "Filtreleri sıfırla",
  className,
}: AdminFilterBarProps) {
  return (
    <div
      role="search"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3",
        className,
      )}
    >
      {children}
      {onReset ? (
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}
