import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock, saveMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  saveMock: vi.fn(),
}));

vi.mock("@/lib/admin/admin-favorites-api", () => ({
  fetchAdminFavoritePageIds: fetchMock,
  saveAdminFavoritePageIds: saveMock,
}));

import { useAdminFavorites } from "./useAdminFavorites";

const USER_ID = "admin-1";

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue([]);
  saveMock.mockResolvedValue(undefined);
});

describe("useAdminFavorites", () => {
  it("userId yokken boş başlar ve DB'ye istek atmaz", () => {
    const { result } = renderHook(() => useAdminFavorites(undefined));
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.favoriteEntries).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mount olunca DB'den favori id'leri yükler", async () => {
    fetchMock.mockResolvedValue(["approvals"]);
    const { result } = renderHook(() => useAdminFavorites(USER_ID));

    await waitFor(() => expect(result.current.favoriteIds).toEqual(["approvals"]));
    expect(fetchMock).toHaveBeenCalledWith(USER_ID);
  });

  it("toggle ekler, ikinci toggle çıkarır ve DB'ye kaydeder", async () => {
    const { result } = renderHook(() => useAdminFavorites(USER_ID));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    act(() => result.current.toggleFavorite("approvals"));
    expect(result.current.isFavorite("approvals")).toBe(true);
    await waitFor(() => expect(saveMock).toHaveBeenCalledWith(USER_ID, ["approvals"]));

    act(() => result.current.toggleFavorite("approvals"));
    expect(result.current.isFavorite("approvals")).toBe(false);
    await waitFor(() => expect(saveMock).toHaveBeenCalledWith(USER_ID, []));
  });

  it("duplicate favori oluşmaz (bozuk DB verisinde bile)", async () => {
    fetchMock.mockResolvedValue(["approvals", "approvals", 42]);
    const { result } = renderHook(() => useAdminFavorites(USER_ID));

    await waitFor(() => expect(result.current.favoriteIds).toEqual(["approvals"]));
  });

  it("favori id'leri registry entry'lerine çözülür; bilinmeyen id atlanır", async () => {
    fetchMock.mockResolvedValue(["approvals", "boyle-bir-id-yok"]);
    const { result } = renderHook(() => useAdminFavorites(USER_ID));

    await waitFor(() =>
      expect(result.current.favoriteEntries.map((entry) => entry.item.id)).toEqual(["approvals"]),
    );
  });

  it("DB okuması hata verirse boş listeyle graceful fallback yapar", async () => {
    fetchMock.mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAdminFavorites(USER_ID));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.favoriteIds).toEqual([]);
  });
});
