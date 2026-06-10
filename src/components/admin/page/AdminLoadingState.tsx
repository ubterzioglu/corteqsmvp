// Admin Panel V2 — ortak yükleme durumu (masterplan §9.2).
// Satır sayısı kadar skeleton blok çizer.

import { cn } from "@/lib/utils";

export type AdminLoadingStateProps = {
  /** Ekran okuyucular için durum etiketi. */
  label?: string;
  rows?: number;
  className?: string;
};

export function AdminLoadingState({
  label = "Yükleniyor...",
  rows = 3,
  className,
}: AdminLoadingStateProps) {
  return (
    <div role="status" aria-label={label} className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl border border-border bg-muted/50" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
