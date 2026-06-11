// Admin Panel V2 — güncellemeler okundu takibi.
// Görülen update id'leri localStorage'da tutulur (corteqs.admin.updates-seen.v1).
// Tek tüketici topbar'daki AdminUpdatesMenu — instance orada yaşar.

import { useCallback, useMemo, useState } from "react";

import { ADMIN_STORAGE_KEYS, readAdminStorage, writeAdminStorage } from "@/lib/admin-shell/admin-storage";
import { ADMIN_UPDATES } from "@/lib/admin-shell/admin-updates";
import type { AdminUpdateEntry } from "@/lib/admin-shell/admin-updates";

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string"))];
}

export type AdminUpdatesState = {
  updates: AdminUpdateEntry[];
  unreadCount: number;
  isUnread: (id: string) => boolean;
  markAllSeen: () => void;
};

export function useAdminUpdates(): AdminUpdatesState {
  const [seenIds, setSeenIds] = useState<string[]>(() =>
    sanitizeIds(readAdminStorage<unknown>(ADMIN_STORAGE_KEYS.updatesSeen, [])),
  );

  const unreadCount = useMemo(
    () => ADMIN_UPDATES.filter((update) => !seenIds.includes(update.id)).length,
    [seenIds],
  );

  const isUnread = useCallback((id: string) => !seenIds.includes(id), [seenIds]);

  const markAllSeen = useCallback(() => {
    setSeenIds((previous) => {
      const allIds = ADMIN_UPDATES.map((update) => update.id);
      if (allIds.every((id) => previous.includes(id))) return previous;
      // Yalnızca mevcut listedeki id'ler saklanır; listeden düşen eski id'ler temizlenir.
      writeAdminStorage(ADMIN_STORAGE_KEYS.updatesSeen, allIds);
      return allIds;
    });
  }, []);

  return { updates: ADMIN_UPDATES, unreadCount, isUnread, markAllSeen };
}
