import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { MAX_RECENT_PAGES, useAdminRecentPages } from "./useAdminRecentPages";

const STORAGE_KEY = "corteqs.admin.recent-pages.v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useAdminRecentPages", () => {
  it("ziyaret kaydeder ve localStorage'a yazar", () => {
    const { result } = renderHook(() => useAdminRecentPages());

    act(() => result.current.recordVisit({ path: "/admin/data", label: "Kayıt Veritabanı" }));

    expect(result.current.recentPages).toEqual([{ path: "/admin/data", label: "Kayıt Veritabanı" }]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
  });

  it("aynı path tekilleştirilir ve en başa taşınır", () => {
    const { result } = renderHook(() => useAdminRecentPages());

    act(() => result.current.recordVisit({ path: "/admin/data", label: "Kayıt Veritabanı" }));
    act(() => result.current.recordVisit({ path: "/admin/approvals", label: "Approval Queue" }));
    act(() => result.current.recordVisit({ path: "/admin/data", label: "Kayıt Veritabanı" }));

    expect(result.current.recentPages.map((page) => page.path)).toEqual([
      "/admin/data",
      "/admin/approvals",
    ]);
  });

  it(`maksimum ${MAX_RECENT_PAGES} kayıt tutar`, () => {
    const { result } = renderHook(() => useAdminRecentPages());

    act(() => {
      for (let index = 0; index < MAX_RECENT_PAGES + 4; index += 1) {
        result.current.recordVisit({ path: `/admin/page-${index}`, label: `Sayfa ${index}` });
      }
    });

    expect(result.current.recentPages).toHaveLength(MAX_RECENT_PAGES);
    expect(result.current.recentPages[0].path).toBe(`/admin/page-${MAX_RECENT_PAGES + 3}`);
  });

  it("bozuk JSON'da graceful fallback yapar", () => {
    window.localStorage.setItem(STORAGE_KEY, "[bozuk");
    const { result } = renderHook(() => useAdminRecentPages());
    expect(result.current.recentPages).toEqual([]);
  });

  it("geçersiz kayıtları filtreler", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ path: "/admin/data", label: "Kayıt Veritabanı" }, { foo: 1 }, "x"]),
    );
    const { result } = renderHook(() => useAdminRecentPages());
    expect(result.current.recentPages).toEqual([{ path: "/admin/data", label: "Kayıt Veritabanı" }]);
  });
});
