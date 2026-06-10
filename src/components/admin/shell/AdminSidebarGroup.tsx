// Admin Panel V2 — sidebar kategori grubu.
// Grup başlığı aç/kapa yapılabilir; aktif child içeren grup otomatik açılır.
// Inactive item'lar grup içinde gösterilmez (AdminSidebar en altta ayrı
// "İnaktif" bölümünde toplar).

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { isNavItemOrChildActive } from "@/lib/admin-shell/admin-navigation-utils";
import type { AdminNavGroup } from "@/lib/admin-shell/admin-shell-types";

import AdminSidebarItem from "./AdminSidebarItem";

type AdminSidebarGroupProps = {
  group: AdminNavGroup;
  collapsed?: boolean;
  onNavigate?: () => void;
};

const AdminSidebarGroup = ({ group, collapsed = false, onNavigate }: AdminSidebarGroupProps) => {
  const location = useLocation();
  const visibleItems = group.items.filter((item) => !item.isInactive);
  const containsActive = visibleItems.some((item) => isNavItemOrChildActive(item, location.pathname));
  const [open, setOpen] = useState(Boolean(group.defaultOpen) || containsActive);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, location.pathname]);

  if (visibleItems.length === 0) return null;

  if (collapsed) {
    return (
      <div className="space-y-0.5 border-t border-border/60 pt-2 first:border-t-0 first:pt-0">
        {visibleItems.map((item) => (
          <AdminSidebarItem key={item.id} item={item} collapsed onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-foreground"
      >
        {group.label}
        <ChevronDown
          aria-hidden="true"
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {visibleItems.map((item) => (
            <AdminSidebarItem key={item.id} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSidebarGroup;
