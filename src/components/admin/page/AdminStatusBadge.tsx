// Admin Panel V2 — semantik durum rozeti (masterplan §9.2 / §9.3).
// Tailwind sınıfları statiktir (JIT purge); dinamik string birleştirme YAPILMAZ.

/* eslint-disable react-refresh/only-export-components */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminStatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "neutral";

const toneClasses: Record<AdminStatusTone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  pending: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  neutral: "border-border bg-muted text-muted-foreground",
};

/** Sık geçen kayıt durumlarını rozet tonuna çevirir; bilinmeyen değer → neutral. */
export function statusToTone(status: string): AdminStatusTone {
  switch (status) {
    case "approved":
    case "published":
    case "verified":
    case "active":
      return "success";
    case "pending":
    case "pending_review":
    case "draft":
      return "pending";
    case "rejected":
    case "error":
      return "danger";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export type AdminStatusBadgeProps = {
  tone?: AdminStatusTone;
  children: ReactNode;
  className?: string;
};

export function AdminStatusBadge({ tone = "neutral", children, className }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
