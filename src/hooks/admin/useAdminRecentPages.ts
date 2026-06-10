// Admin Panel V2 — son kullanılan ekranlar.
// Maksimum 8 kayıt, en yeni başta, path bazında tekilleştirilir
// (corteqs.admin.recent-pages.v1). Route değişiminde AdminShell kaydeder.

import { useCallback, useState } from "react";

import { ADMIN_STORAGE_KEYS, readAdminStorage, writeAdminStorage } from "@/lib/admin-shell/admin-storage";

export const MAX_RECENT_PAGES = 8;

export type AdminRecentPage = {
  path: string;
  label: string;
};

function sanitizeRecentPages(value: unknown): AdminRecentPage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is AdminRecentPage =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as AdminRecentPage).path === "string" &&
        typeof (entry as AdminRecentPage).label === "string",
    )
    .slice(0, MAX_RECENT_PAGES);
}

export type AdminRecentPagesState = {
  recentPages: AdminRecentPage[];
  recordVisit: (page: AdminRecentPage) => void;
};

export function useAdminRecentPages(): AdminRecentPagesState {
  const [recentPages, setRecentPages] = useState<AdminRecentPage[]>(() =>
    sanitizeRecentPages(readAdminStorage<unknown>(ADMIN_STORAGE_KEYS.recentPages, [])),
  );

  const recordVisit = useCallback((page: AdminRecentPage) => {
    setRecentPages((previous) => {
      const next = [page, ...previous.filter((entry) => entry.path !== page.path)].slice(
        0,
        MAX_RECENT_PAGES,
      );
      writeAdminStorage(ADMIN_STORAGE_KEYS.recentPages, next);
      return next;
    });
  }, []);

  return { recentPages, recordVisit };
}
