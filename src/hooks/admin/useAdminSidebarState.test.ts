import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAdminSidebarState } from "./useAdminSidebarState";

const STORAGE_KEY = "corteqs.admin.sidebar.collapsed.v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useAdminSidebarState", () => {
  it("varsayılan olarak açık (collapsed=false) başlar", () => {
    const { result } = renderHook(() => useAdminSidebarState());
    expect(result.current.collapsed).toBe(false);
    expect(result.current.contentPaddingClassName).toContain("lg:pl-[248px]");
  });

  it("toggle durumu değiştirir ve localStorage'a yazar", () => {
    const { result } = renderHook(() => useAdminSidebarState());

    act(() => result.current.toggleCollapsed());

    expect(result.current.collapsed).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
    expect(result.current.contentPaddingClassName).toContain("lg:pl-[72px]");

    act(() => result.current.toggleCollapsed());

    expect(result.current.collapsed).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("persist edilmiş collapsed=true değerini okur", () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useAdminSidebarState());
    expect(result.current.collapsed).toBe(true);
  });

  it("bozuk localStorage JSON'unda graceful fallback yapar", () => {
    window.localStorage.setItem(STORAGE_KEY, "{bozuk-json");
    const { result } = renderHook(() => useAdminSidebarState());
    expect(result.current.collapsed).toBe(false);
  });

  it("mobil drawer durumu yönetilir", () => {
    const { result } = renderHook(() => useAdminSidebarState());
    expect(result.current.mobileOpen).toBe(false);

    act(() => result.current.setMobileOpen(true));
    expect(result.current.mobileOpen).toBe(true);
  });
});
