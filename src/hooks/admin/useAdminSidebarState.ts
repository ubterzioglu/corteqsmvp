// Admin Panel V2 — sidebar durumu.
// Desktop collapse durumu localStorage'da kalıcıdır; mobil Sheet durumu
// oturum içidir. İçerik padding sınıfı sidebar genişliğiyle senkron tutulur.

import { useCallback, useState } from "react";

import { ADMIN_STORAGE_KEYS, readAdminStorage, writeAdminStorage } from "@/lib/admin-shell/admin-storage";

export type AdminSidebarState = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  /** Sidebar genişliğine karşılık gelen içerik sol padding sınıfı. */
  contentPaddingClassName: string;
};

export function useAdminSidebarState(): AdminSidebarState {
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    readAdminStorage<boolean>(ADMIN_STORAGE_KEYS.sidebarCollapsed, false) === true,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      writeAdminStorage(ADMIN_STORAGE_KEYS.sidebarCollapsed, next);
      return next;
    });
  }, []);

  return {
    collapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    contentPaddingClassName: collapsed ? "lg:pl-[72px]" : "lg:pl-[248px] xl:pl-[280px]",
  };
}
