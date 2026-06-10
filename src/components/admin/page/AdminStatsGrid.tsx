// Admin Panel V2 — istatistik kartları grid'i (masterplan §9.2).
// İçerik serbesttir (children); kolon sayısı responsive harita ile sabitlenir.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const columnsClasses = {
  2: "grid gap-3 sm:grid-cols-2",
  3: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
} as const;

export type AdminStatsGridProps = {
  children: ReactNode;
  columns?: keyof typeof columnsClasses;
  className?: string;
};

export function AdminStatsGrid({ children, columns = 4, className }: AdminStatsGridProps) {
  return (
    <section aria-label="Özet metrikler" className={cn(columnsClasses[columns], className)}>
      {children}
    </section>
  );
}
