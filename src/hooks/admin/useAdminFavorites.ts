// Admin Panel V2 — favori ekranlar.
// Registry item id'leri admin_favorite_pages tablosunda kullanıcı bazlı tutulur
// (önceden localStorage'daydı — tarayıcı verisi silinince/farklı cihazda kayboluyordu).
// State tek instance olarak AdminShell'de yaşar; sidebar ve command palette
// prop üzerinden beslenir.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchAdminFavoritePageIds, saveAdminFavoritePageIds } from "@/lib/admin/admin-favorites-api";
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

export function useAdminFavorites(userId: string | undefined): AdminFavoritesState {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const loadedForUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!userId || loadedForUserId.current === userId) return;
    loadedForUserId.current = userId;
    let cancelled = false;

    fetchAdminFavoritePageIds(userId)
      .then((ids) => {
        if (!cancelled) setFavoriteIds(sanitizeIds(ids));
      })
      .catch((error: unknown) => {
        console.error("Favori sayfalar yüklenemedi:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    (id: string) => {
      if (!userId) return;
      setFavoriteIds((previous) => {
        const next = previous.includes(id)
          ? previous.filter((existing) => existing !== id)
          : [...previous, id];
        saveAdminFavoritePageIds(userId, next).catch((error: unknown) => {
          console.error("Favori sayfalar kaydedilemedi:", error);
        });
        return next;
      });
    },
    [userId],
  );

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const favoriteEntries = useMemo(() => {
    const entriesById = new Map(flattenAdminNav().map((entry) => [entry.item.id, entry]));
    return favoriteIds
      .map((id) => entriesById.get(id))
      .filter((entry): entry is AdminNavEntry => Boolean(entry));
  }, [favoriteIds]);

  return { favoriteIds, favoriteEntries, isFavorite, toggleFavorite };
}
