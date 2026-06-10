// Admin Panel V2 — shell kökü.
// Sorumluluklar: erişim doğrulama (AdminAccessGate), layout grid (sidebar +
// topbar + main), sidebar/palette/favori/recent state'leri ve Outlet context.
// Route değişiminde son kullanılanlar kaydedilir. Auth event yönetimi
// useAdminAccess'tedir; navigasyon verisi registry'dedir.

/* eslint-disable react-refresh/only-export-components */

import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Outlet, useLocation, useOutletContext } from "react-router-dom";

import { cn } from "@/lib/utils";
import { buildAdminBreadcrumbs } from "@/lib/admin-shell/admin-navigation-utils";
import { useAdminAccess } from "@/hooks/admin/useAdminAccess";
import { useAdminCommandPalette } from "@/hooks/admin/useAdminCommandPalette";
import { useAdminFavorites } from "@/hooks/admin/useAdminFavorites";
import { useAdminRecentPages } from "@/hooks/admin/useAdminRecentPages";
import { useAdminSidebarState } from "@/hooks/admin/useAdminSidebarState";

import AdminAccessGate from "./AdminAccessGate";
import AdminCommandPalette from "./AdminCommandPalette";
import AdminMobileSidebar from "./AdminMobileSidebar";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export type AdminOutletContext = {
  session: Session;
  onLogout: () => Promise<void>;
};

export function useAdminOutletContext() {
  return useOutletContext<AdminOutletContext>();
}

const AdminShell = () => {
  const access = useAdminAccess();
  const sidebar = useAdminSidebarState();
  const palette = useAdminCommandPalette();
  const favorites = useAdminFavorites();
  const { recentPages, recordVisit } = useAdminRecentPages();
  const location = useLocation();

  useEffect(() => {
    if (access.status !== "authorized") return;
    const breadcrumbs = buildAdminBreadcrumbs(location.pathname);
    const label =
      breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : location.pathname;
    recordVisit({ path: location.pathname, label });
  }, [access.status, location.pathname, recordVisit]);

  return (
    <AdminAccessGate access={access}>
      <div className="min-h-screen bg-background">
        <AdminSidebar
          collapsed={sidebar.collapsed}
          onToggleCollapsed={sidebar.toggleCollapsed}
          favorites={favorites}
        />
        <div className={cn("flex min-h-screen flex-col transition-[padding]", sidebar.contentPaddingClassName)}>
          <AdminTopbar
            userEmail={access.session?.user.email}
            onLogout={access.logout}
            onOpenMobileSidebar={() => sidebar.setMobileOpen(true)}
            onOpenCommandPalette={() => palette.setOpen(true)}
          />
          <main className="container mx-auto flex-1 px-4 py-6">
            {access.session && (
              <Outlet context={{ session: access.session, onLogout: access.logout }} />
            )}
          </main>
        </div>
        <AdminMobileSidebar
          open={sidebar.mobileOpen}
          onOpenChange={sidebar.setMobileOpen}
          onLogout={access.logout}
        />
        <AdminCommandPalette
          open={palette.open}
          onOpenChange={palette.setOpen}
          recentPages={recentPages}
          favoriteEntries={favorites.favoriteEntries}
        />
      </div>
    </AdminAccessGate>
  );
};

export default AdminShell;
