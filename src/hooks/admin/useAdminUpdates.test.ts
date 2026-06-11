// useAdminUpdates — okunmamış güncelleme sayacı ve okundu persist testleri.

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ADMIN_STORAGE_KEYS } from "@/lib/admin-shell/admin-storage";
import { ADMIN_UPDATES } from "@/lib/admin-shell/admin-updates";
import { useAdminUpdates } from "./useAdminUpdates";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useAdminUpdates", () => {
  it("storage boşken tüm güncellemeler okunmamıştır", () => {
    const { result } = renderHook(() => useAdminUpdates());

    expect(result.current.updates).toEqual(ADMIN_UPDATES);
    expect(result.current.unreadCount).toBe(ADMIN_UPDATES.length);
    expect(result.current.isUnread(ADMIN_UPDATES[0].id)).toBe(true);
  });

  it("markAllSeen sayacı sıfırlar ve id'leri localStorage'a yazar", () => {
    const { result } = renderHook(() => useAdminUpdates());

    act(() => {
      result.current.markAllSeen();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isUnread(ADMIN_UPDATES[0].id)).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(ADMIN_STORAGE_KEYS.updatesSeen)!)).toEqual(
      ADMIN_UPDATES.map((update) => update.id),
    );
  });

  it("kısmen görülen listede yalnızca yeni kayıtlar okunmamış sayılır", () => {
    const [newest, ...rest] = ADMIN_UPDATES;
    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.updatesSeen,
      JSON.stringify(rest.map((update) => update.id)),
    );

    const { result } = renderHook(() => useAdminUpdates());

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.isUnread(newest.id)).toBe(true);
    expect(result.current.isUnread(rest[0].id)).toBe(false);
  });

  it("bozuk JSON'da çökmez, tümü okunmamış kabul edilir", () => {
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.updatesSeen, "{bozuk-json");

    const { result } = renderHook(() => useAdminUpdates());

    expect(result.current.unreadCount).toBe(ADMIN_UPDATES.length);
  });

  it("dizi olmayan değer fallback'e düşer, string olmayan id'ler atlanır", () => {
    window.localStorage.setItem(ADMIN_STORAGE_KEYS.updatesSeen, JSON.stringify({ id: 1 }));
    const { result: nonArray } = renderHook(() => useAdminUpdates());
    expect(nonArray.current.unreadCount).toBe(ADMIN_UPDATES.length);

    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.updatesSeen,
      JSON.stringify([42, null, ADMIN_UPDATES[0].id]),
    );
    const { result: mixed } = renderHook(() => useAdminUpdates());
    expect(mixed.current.unreadCount).toBe(ADMIN_UPDATES.length - 1);
  });
});
