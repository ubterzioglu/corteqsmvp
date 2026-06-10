// Admin Panel V2 — desktop sabit sidebar.
// Tek kaynak: admin-navigation-registry. Collapse durumu localStorage'da
// (useAdminSidebarState). Inactive item'lar en altta ayrı bölümde.

import { useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";

import AdminSidebarGroup from "./AdminSidebarGroup";
import AdminSidebarItem from "./AdminSidebarItem";

const logo = "/newlogo.png";

type AdminSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

const inactiveItems = adminNavGroups.flatMap((group) =>
  group.items.filter((item) => item.isInactive),
);

const AdminSidebar = ({ collapsed, onToggleCollapsed }: AdminSidebarProps) => {
  const [inactiveOpen, setInactiveOpen] = useState(false);

  return (
    <aside
      aria-label="Admin navigasyonu"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card transition-[width] lg:flex",
        collapsed ? "w-[72px]" : "w-[248px] xl:w-[280px]",
      )}
    >
      <div className={cn("flex items-center gap-3 border-b border-border px-4 py-4", collapsed && "justify-center px-2")}>
        <a
          href="https://mvp.corteqs.net"
          target="_blank"
          rel="noreferrer"
          aria-label="CorteQS ana siteye git"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background p-1.5 shadow-sm"
        >
          <img src={logo} alt="CorteQS" className="h-full w-full object-contain" />
        </a>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">CorteQS Admin</div>
            <div className="truncate text-[11px] text-muted-foreground">Global Network OS</div>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 space-y-3 overflow-y-auto px-3 py-3", collapsed && "px-2")}>
        {adminNavGroups.map((group) => (
          <AdminSidebarGroup key={group.id} group={group} collapsed={collapsed} />
        ))}

        {inactiveItems.length > 0 && !collapsed && (
          <div className="border-t border-border/60 pt-2">
            <button
              type="button"
              onClick={() => setInactiveOpen((previous) => !previous)}
              aria-expanded={inactiveOpen}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              İnaktif
              <ChevronDown
                aria-hidden="true"
                className={cn("h-3 w-3 transition-transform", inactiveOpen && "rotate-180")}
              />
            </button>
            {inactiveOpen && (
              <div className="mt-0.5 space-y-0.5">
                {inactiveItems.map((item) => (
                  <AdminSidebarItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className={cn("border-t border-border px-3 py-3", collapsed && "px-2")}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
