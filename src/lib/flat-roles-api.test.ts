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

  describe("A6 · dropdown'dan gizlenen roller", () => {
    it("eski bireysel rolleri gizler (User_DiasporaMember, User_Contributor, User_JobSeeker)", () => {
      const result = mapFlatRoleOptions([
        { key: "User_DiasporaMember", label: "Diaspora Üyesi", description: null },
        { key: "User_Contributor", label: "Destekçi", description: null },
        { key: "User_JobSeeker", label: "İş Arayan", description: null },
        { key: "User_Standard", label: "Bireysel Kullanıcı", description: null },
      ]);
      expect(result.map((r) => r.key)).toEqual(["User_Standard"]);
    });

    it("deneysel rolleri gizler (Experimental_1/2/3)", () => {
      const result = mapFlatRoleOptions([
        { key: "Experimental_1", label: "Deneysel 1", description: null },
        { key: "Experimental_2", label: "Deneysel 2", description: null },
        { key: "Experimental_3", label: "Deneysel 3", description: null },
        { key: "User_Standard", label: "Bireysel Kullanıcı", description: null },
      ]);
      expect(result.map((r) => r.key)).toEqual(["User_Standard"]);
    });

    it("moderatör/admin rollerini gizler", () => {
      const result = mapFlatRoleOptions([
        { key: "Moderator_Content", label: "İçerik Moderatörü", description: null },
        { key: "Admin_PlatformAdmin", label: "Platform Yöneticisi", description: null },
        { key: "User_Standard", label: "Bireysel Kullanıcı", description: null },
      ]);
      expect(result.map((r) => r.key)).toEqual(["User_Standard"]);
    });

    it("diğer rolleri gizlemez", () => {
      const result = mapFlatRoleOptions([
        { key: "Business_RestaurantCafe", label: "Restoran/Kafe", description: null },
        { key: "Consultant_LawTax", label: "Hukuk & Vergi", description: null },
        { key: "User_CityAmbassador", label: "Şehir Elçisi", description: null },
      ]);
      expect(result).toHaveLength(3);
    });
  });
});
