// Admin Panel V2 — tek sidebar item'ı.
// Internal route (NavLink), external link (<a>) ve child'lı parent
// (açılır alt liste) durumlarını ele alır. Aktiflik registry util'leriyle
// hesaplanır; component içinde ad-hoc path karşılaştırması yapılmaz.

import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ExternalLink as ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  isNavItemOrChildActive,
} from "@/lib/admin-shell/admin-navigation-utils";
import type { AdminNavItem } from "@/lib/admin-shell/admin-shell-types";

import { accentActiveItemClasses, accentIconClasses } from "./admin-accent";

type AdminSidebarItemProps = {
  item: AdminNavItem;
  collapsed?: boolean;
  depth?: number;
  /** Mobil Sheet'te tıklamada drawer'ı kapatmak için. */
  onNavigate?: () => void;
};

const baseItemClasses =
  "flex w-full items-center gap-2.5 rounded-md border-l-2 border-l-transparent px-2.5 py-2 text-sm transition-colors";
const idleItemClasses = "text-muted-foreground hover:bg-muted hover:text-foreground";

const AdminSidebarItem = ({ item, collapsed = false, depth = 0, onNavigate }: AdminSidebarItemProps) => {
  const location = useLocation();
  const childActive = isNavItemOrChildActive(item, location.pathname);
  const selfActive = isNavItemActive(item, location.pathname);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive, location.pathname]);

  const Icon = item.icon;
  const label = collapsed ? null : <span className="truncate">{item.label}</span>;
  const iconElement = (
    <Icon
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", selfActive || childActive ? accentIconClasses[item.accent] : "")}
    />
  );

  if (item.isExternal && item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        title={collapsed ? item.label : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(baseItemClasses, idleItemClasses, collapsed && "justify-center px-0")}
      >
        {iconElement}
        {label}
        {!collapsed && <ExternalLinkIcon aria-hidden="true" className="ml-auto h-3 w-3 opacity-60" />}
      </a>
    );
  }

  const children = item.children ?? [];

  if (children.length > 0) {
    // Collapsed modda parent, navigasyon yapılabilen ilk child'a link olur.
    if (collapsed) {
      const firstTarget = item.to ?? children.find((child) => child.to)?.to;
      if (!firstTarget) return null;
      return (
        <NavLink
          to={firstTarget}
          title={item.label}
          aria-label={item.label}
          onClick={onNavigate}
          className={cn(
            baseItemClasses,
            "justify-center px-0",
            childActive ? accentActiveItemClasses[item.accent] : idleItemClasses,
          )}
        >
          {iconElement}
        </NavLink>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className={cn(
            baseItemClasses,
            childActive ? accentActiveItemClasses[item.accent] : idleItemClasses,
            "font-medium",
          )}
        >
          {iconElement}
          {label}
          <ChevronDown
            aria-hidden="true"
            className={cn("ml-auto h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5 pl-4">
            {children.map((child) => (
              <AdminSidebarItem key={child.id} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!item.to) return null;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/admin"}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        baseItemClasses,
        collapsed && "justify-center px-0",
        selfActive ? accentActiveItemClasses[item.accent] : idleItemClasses,
      )}
    >
      {iconElement}
      {label}
    </NavLink>
  );
};

export default AdminSidebarItem;
