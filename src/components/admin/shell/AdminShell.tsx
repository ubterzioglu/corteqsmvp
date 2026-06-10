// Admin Panel V2 — shell kökü.
// Sorumluluklar: erişim doğrulama (AdminAccessGate), layout grid (sidebar +
// topbar + main), sidebar state ve Outlet context. Auth event yönetimi
// useAdminAccess'tedir; navigasyon verisi registry'dedir; bildirim içeriği
// ve sayfa verisi burada TUTULMAZ.

/* eslint-disable react-refresh/only-export-components */

import type { Session } from "@supabase/supabase-js";
import { Outlet, useOutletContext } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAdminAccess } from "@/hooks/admin/useAdminAccess";
import { useAdminSidebarState } from "@/hooks/admin/useAdminSidebarState";

import AdminAccessGate from "./AdminAccessGate";
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

  return (
    <AdminAccessGate access={access}>
      <div className="min-h-screen bg-background">
        <AdminSidebar collapsed={sidebar.collapsed} onToggleCollapsed={sidebar.toggleCollapsed} />
        <div className={cn("flex min-h-screen flex-col transition-[padding]", sidebar.contentPaddingClassName)}>
          <AdminTopbar
            userEmail={access.session?.user.email}
            onLogout={access.logout}
            onOpenMobileSidebar={() => sidebar.setMobileOpen(true)}
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
      </div>
    </AdminAccessGate>
  );
};

export default AdminShell;
