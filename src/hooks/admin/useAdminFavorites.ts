// Admin Panel V2 — favori ekranlar.
// Registry item id'leri localStorage'da tutulur (corteqs.admin.favorite-pages.v1).
// State tek instance olarak AdminShell'de yaşar; sidebar ve command palette
// prop üzerinden beslenir.

import { useCallback, useMemo, useState } from "react";

import { ADMIN_STORAGE_KEYS, readAdminStorage, writeAdminStorage } from "@/lib/admin-shell/admin-storage";
import { flattenAdminNav } from "@/lib/admin-shell/admin-navigation-utils";
import type { AdminNavEntry } from "@/lib/admin-shell/admin-navigation-utils";

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string"))];
}

export type AdminFavoritesState = {
  favoriteIds: string[];
  /** Favori id'lerinin registry'de çözülmüş halleri (bilinmeyen id'ler atlanır). */
  favoriteEntries: AdminNavEntry[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
};

export function useAdminFavorites(): AdminFavoritesState {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    sanitizeIds(readAdminStorage<unknown>(ADMIN_STORAGE_KEYS.favoritePages, [])),
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((previous) => {
      const next = previous.includes(id)
        ? previous.filter((existing) => existing !== id)
        : [...previous, id];
      writeAdminStorage(ADMIN_STORAGE_KEYS.favoritePages, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const favoriteEntries = useMemo(() => {
    const entriesById = new Map(flattenAdminNav().map((entry) => [entry.item.id, entry]));
    return favoriteIds
      .map((id) => entriesById.get(id))
      .filter((entry): entry is AdminNavEntry => Boolean(entry));
  }, [favoriteIds]);

  return { favoriteIds, favoriteEntries, isFavorite, toggleFavorite };
}
