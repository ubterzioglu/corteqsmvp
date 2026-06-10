// Admin Panel V2 — modül renk kodu (accent) sınıf haritaları.
// Tailwind sınıf adları statik kalmalıdır (JIT purge); dinamik string
// birleştirme YAPILMAZ.

import type { AdminAccent } from "@/lib/admin-shell/admin-shell-types";

/** Aktif sidebar item'ı: sol accent çizgisi + soft arka plan. */
export const accentActiveItemClasses: Record<AdminAccent, string> = {
  indigo: "border-l-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  sky: "border-l-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  emerald: "border-l-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "border-l-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  amber: "border-l-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  slate: "border-l-slate-500 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  green: "border-l-green-600 bg-green-600/10 text-green-700 dark:text-green-300",
  red: "border-l-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
};

/** Page shell başlık ikonu: soft arka plan + accent renkli ikon kutusu. */
export const accentSoftBadgeClasses: Record<AdminAccent, string> = {
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  green: "bg-green-600/10 text-green-700 dark:text-green-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
};

/** Item ikonu rengi (aktif durumda). */
export const accentIconClasses: Record<AdminAccent, string> = {
  indigo: "text-indigo-500",
  sky: "text-sky-500",
  emerald: "text-emerald-500",
  rose: "text-rose-500",
  amber: "text-amber-500",
  slate: "text-slate-500",
  green: "text-green-600",
  red: "text-red-500",
};
