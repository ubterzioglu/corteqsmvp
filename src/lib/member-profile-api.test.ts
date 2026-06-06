import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  rpcMock,
  getCurrentMemberCatalogProfileMock,
} = vi.hoisted(() => {
  return {
    rpcMock: vi.fn(),
    getCurrentMemberCatalogProfileMock: vi.fn(),
  };
});

vi.mock("@/lib/member-catalog", () => ({
  getCurrentMemberCatalogProfile: getCurrentMemberCatalogProfileMock,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { updateProfileAttribute } from "@/lib/member-profile-api";

describe("updateProfileAttribute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentMemberCatalogProfileMock.mockResolvedValue({ itemId: "item-1", userId: "user-1" });
    rpcMock.mockResolvedValue({ data: { status: "approved" }, error: null });
  });

  it("updates full_name through the catalog item RPC", async () => {
    const result = await updateProfileAttribute("full_name", "  Birey CorteQ  ", "public");

    expect(getCurrentMemberCatalogProfileMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("update_catalog_item_attribute", {
      p_item_id: "item-1",
      p_attribute_key: "full_name",
      p_value: "Birey CorteQ",
      p_visibility: "public",
    });
    expect(result).toEqual({
      attribute_key: "full_name",
      status: "approved",
      visibility: "public",
    });
  });

  it("keeps using the RPC for other attributes", async () => {
    await updateProfileAttribute("bio_short", "Kısa açıklama", "public");

    expect(rpcMock).toHaveBeenCalledWith("update_profile_attribute", {
      attribute_key: "bio_short",
      attribute_value: "Kısa açıklama",
      visibility: "public",
    });
  });
});
