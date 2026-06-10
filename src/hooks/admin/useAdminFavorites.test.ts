import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAdminFavorites } from "./useAdminFavorites";

const STORAGE_KEY = "corteqs.admin.favorite-pages.v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useAdminFavorites", () => {
  it("varsayılan boş başlar", () => {
    const { result } = renderHook(() => useAdminFavorites());
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.favoriteEntries).toEqual([]);
  });

  it("toggle ekler, ikinci toggle çıkarır ve localStorage'a yazar", () => {
    const { result } = renderHook(() => useAdminFavorites());

    act(() => result.current.toggleFavorite("approvals"));
    expect(result.current.isFavorite("approvals")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(["approvals"]);

    act(() => result.current.toggleFavorite("approvals"));
    expect(result.current.isFavorite("approvals")).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  it("duplicate favori oluşmaz (bozuk storage'da bile)", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["approvals", "approvals", 42]));
    const { result } = renderHook(() => useAdminFavorites());
    expect(result.current.favoriteIds).toEqual(["approvals"]);
  });

  it("favori id'leri registry entry'lerine çözülür; bilinmeyen id atlanır", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["approvals", "boyle-bir-id-yok"]));
    const { result } = renderHook(() => useAdminFavorites());
    expect(result.current.favoriteEntries.map((entry) => entry.item.id)).toEqual(["approvals"]);
  });

  it("bozuk JSON'da graceful fallback yapar", () => {
    window.localStorage.setItem(STORAGE_KEY, "{bozuk");
    const { result } = renderHook(() => useAdminFavorites());
    expect(result.current.favoriteIds).toEqual([]);
  });
});
