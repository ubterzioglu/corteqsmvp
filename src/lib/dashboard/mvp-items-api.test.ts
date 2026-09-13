import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseBrowserClientMock = vi.fn();

vi.mock("./supabase", () => ({
  getSupabaseBrowserClient: () => getSupabaseBrowserClientMock(),
}));

import { createMvpItem, deleteMvpItem, listMvpItems, updateMvpItem } from "./mvp-items-api";

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  konu: "Konu",
  sub: null,
  ayrinti: null,
  mvp_level: "Atanmadi",
  added_by: "UBT",
  is_seed: false,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("mvp-items-api", () => {
  beforeEach(() => {
    getSupabaseBrowserClientMock.mockReset();
  });

  it("listMvpItems: supabase yapılandırılmamışsa hata fırlatır", async () => {
    getSupabaseBrowserClientMock.mockReturnValue(null);
    await expect(listMvpItems()).rejects.toThrow("Supabase bağlantısı yapılandırılmamış.");
  });

  it("listMvpItems: satırları domain tipine eşler", async () => {
    const order = vi.fn().mockResolvedValue({ data: [makeRow()], error: null });
    const select = vi.fn(() => ({ order }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: vi.fn(() => ({ select })) });

    const result = await listMvpItems();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("item-1");
    expect(result[0].mvpLevel).toBe("Atanmadi");
  });

  it("createMvpItem: supabase yapılandırılmamışsa null döner", async () => {
    getSupabaseBrowserClientMock.mockReturnValue(null);
    expect(await createMvpItem({ konu: "x", sub: null, ayrinti: null, mvp_level: "MVP1", added_by: "UBT" })).toBeNull();
  });

  it("createMvpItem: eklenen satırı domain tipine eşleyip döner", async () => {
    const single = vi.fn().mockResolvedValue({ data: makeRow({ id: "item-2" }), error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: vi.fn(() => ({ insert })) });

    const result = await createMvpItem({ konu: "x", sub: null, ayrinti: null, mvp_level: "MVP1", added_by: "UBT" });
    expect(result?.id).toBe("item-2");
  });

  it("updateMvpItem: supabase yapılandırılmamışsa null döner", async () => {
    getSupabaseBrowserClientMock.mockReturnValue(null);
    expect(await updateMvpItem("item-1", { mvp_level: "MVP2" })).toBeNull();
  });

  it("updateMvpItem: hata varsa fırlatır", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "yok" } });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: vi.fn(() => ({ update })) });

    await expect(updateMvpItem("item-1", { mvp_level: "MVP2" })).rejects.toEqual({ message: "yok" });
  });

  it("deleteMvpItem: supabase yapılandırılmamışsa no-op", async () => {
    getSupabaseBrowserClientMock.mockReturnValue(null);
    await expect(deleteMvpItem("item-1")).resolves.toBeUndefined();
  });

  it("deleteMvpItem: id ile satırı siler", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    const tableFrom = vi.fn(() => ({ delete: del }));
    getSupabaseBrowserClientMock.mockReturnValue({ from: tableFrom });

    await deleteMvpItem("item-1");
    expect(tableFrom).toHaveBeenCalledWith("mvp_items");
    expect(eq).toHaveBeenCalledWith("id", "item-1");
  });
});
