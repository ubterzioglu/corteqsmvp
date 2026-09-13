import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { fetchFlatRoles, mapFlatRoleOptions } from "./flat-roles-api";

describe("flat-roles-api", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("fetchFlatRoles: get_flat_roles RPC'sini çağırır", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    await fetchFlatRoles();
    expect(rpcMock).toHaveBeenCalledWith("get_flat_roles");
  });

  it("mapFlatRoleOptions: geçerli satırları eşler", () => {
    const result = mapFlatRoleOptions([
      { key: "User_X", label: "X Rolü", description: "açıklama" },
      { key: "User_Y", label: "Y Rolü", description: null },
    ]);
    expect(result).toEqual([
      { key: "User_X", label: "X Rolü", description: "açıklama" },
      { key: "User_Y", label: "Y Rolü", description: null },
    ]);
  });

  it("mapFlatRoleOptions: eksik key/label alanlı satırları eler", () => {
    const result = mapFlatRoleOptions([
      { key: "User_X", label: "", description: null },
      { key: "", label: "Y Rolü", description: null },
      { key: 5, label: "Z", description: null },
    ]);
    expect(result).toEqual([]);
  });

  it("mapFlatRoleOptions: dizi olmayan veriyle boş liste döner", () => {
    expect(mapFlatRoleOptions(null)).toEqual([]);
    expect(mapFlatRoleOptions(undefined)).toEqual([]);
    expect(mapFlatRoleOptions("beklenmeyen")).toEqual([]);
  });
});
