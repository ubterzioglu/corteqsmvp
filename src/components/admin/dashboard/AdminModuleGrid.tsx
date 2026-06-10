// Admin Panel V2 — modül kartları (masterplan §8.1.E).
// Her ana registry grubu için bir kart; kart içinde ilk 5 görünür child
// linki. Route başına ayrı büyük kart üretilmez.

import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";
import { accentIconClasses } from "@/components/admin/shell/admin-accent";
import type { AdminNavItem } from "@/lib/admin-shell/admin-shell-types";

const MAX_LINKS_PER_MODULE = 5;

function visibleLinks(items: AdminNavItem[]): AdminNavItem[] {
  return items
    .flatMap((item) => (item.to ? [item] : (item.children ?? []).filter((child) => child.to)))
    .filter((item) => !item.isInactive && !item.isExternal)
    .slice(0, MAX_LINKS_PER_MODULE);
}

const moduleGroups = adminNavGroups.filter((group) => group.id !== "overview");

const AdminModuleGrid = () => (
  <section aria-label="Modüller" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {moduleGroups.map((group) => {
      const links = visibleLinks(group.items.filter((item) => !item.isInactive));
      if (links.length === 0) return null;

      return (
        <div key={group.id} className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          <div className="mt-2.5 space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.to!}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Icon aria-hidden="true" className={cn("h-3.5 w-3.5", accentIconClasses[item.accent])} />
                  <span className="truncate">{item.label}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      );
    })}
  </section>
);

export default AdminModuleGrid;
