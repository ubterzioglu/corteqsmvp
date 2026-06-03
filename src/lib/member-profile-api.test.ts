import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const eqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ update: updateMock }));
const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
    rpc: rpcMock,
  },
}));

import { updateProfileAttribute } from "@/lib/member-profile-api";

describe("updateProfileAttribute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    eqMock.mockResolvedValue({ error: null });
    rpcMock.mockResolvedValue({ data: { status: "approved" }, error: null });
  });

  it("updates full_name directly on user_profiles", async () => {
    const result = await updateProfileAttribute("full_name", "  Birey CorteQ  ", "public");

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("user_profiles");
    expect(updateMock).toHaveBeenCalledWith({ full_name: "Birey CorteQ" });
    expect(eqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(rpcMock).not.toHaveBeenCalled();
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
    expect(fromMock).not.toHaveBeenCalled();
  });
});
