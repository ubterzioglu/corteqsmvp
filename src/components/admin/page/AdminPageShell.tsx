// Admin Panel V2 — ortak page shell (masterplan §9.1).
// Başlık / aksiyon / stats / filtre / içerik (+opsiyonel aside) düzenini
// standardize eder. Breadcrumb zinciri normalde topbar'da render edilir;
// buradaki breadcrumbs prop'u yalnızca sayfa içi ek zincir gerektiğinde verilir.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import type { AdminAccent, AdminBreadcrumb } from "@/lib/admin-shell/admin-shell-types";
import { AdminPageHeader } from "./AdminPageHeader";

const contentWidthClasses = {
  wide: "max-w-none",
  default: "max-w-6xl",
  narrow: "max-w-3xl",
} as const;

export type AdminPageShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  accent?: AdminAccent;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: ReactNode;
  stats?: ReactNode;
  filters?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  contentWidth?: keyof typeof contentWidthClasses;
};

export function AdminPageShell({
  title,
  description,
  eyebrow,
  icon,
  accent,
  breadcrumbs,
  actions,
  stats,
  filters,
  aside,
  children,
  contentWidth = "default",
}: AdminPageShellProps) {
  return (
    <div className={cn("mx-auto flex w-full flex-col gap-6", contentWidthClasses[contentWidth])}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Sayfa içi gezinme" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-foreground hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <AdminPageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        icon={icon}
        accent={accent}
        actions={actions}
      />

      {stats}
      {filters}

      {aside ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">{children}</div>
          <aside className="min-w-0 space-y-6">{aside}</aside>
        </div>
      ) : (
        <div className="min-w-0 space-y-6">{children}</div>
      )}
    </div>
  );
}
