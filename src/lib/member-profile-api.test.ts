import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  rpcMock,
  fromMock,
  getCurrentMemberCatalogProfileMock,
} = vi.hoisted(() => {
  return {
    rpcMock: vi.fn(),
    fromMock: vi.fn(),
    getCurrentMemberCatalogProfileMock: vi.fn(),
  };
});

vi.mock("@/lib/member-catalog", () => ({
  getCurrentMemberCatalogProfile: getCurrentMemberCatalogProfileMock,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

import {
  requestNewCatalogItem,
  updateProfileAttribute,
  upsertIndividualProfileDetailsPatch,
} from "@/lib/member-profile-api";

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

describe("updateProfileAttribute — referral_code (B11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the code first, then saves the normalized value", async () => {
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "validate_and_bind_referral_code") {
        return { data: [{ status: "valid", normalized_code: "KOD123" }], error: null };
      }
      return { data: { status: "approved", visibility: "private" }, error: null };
    });

    const result = await updateProfileAttribute("referral_code", "  kod123  ");

    // Sıra: önce doğrulama, sonra kayıt — ön kayıt akışıyla aynı desen.
    expect(rpcMock.mock.calls[0][0]).toBe("validate_and_bind_referral_code");
    expect(rpcMock.mock.calls[1][0]).toBe("update_profile_attribute");
    expect(rpcMock.mock.calls[1][1]).toMatchObject({
      attribute_key: "referral_code",
      attribute_value: "KOD123",
    });
    expect(result).toMatchObject({ status: "approved" });
  });

  it("does NOT call update_profile_attribute for an invalid code and throws Turkish message", async () => {
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "validate_and_bind_referral_code") {
        return { data: [{ status: "not_found" }], error: null };
      }
      throw new Error("update_profile_attribute cagrilmamaliydi");
    });

    await expect(updateProfileAttribute("referral_code", "YOKBOYLEKOD")).rejects.toThrow(
      "Referral kodu bulunamadi.",
    );
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock.mock.calls[0][0]).toBe("validate_and_bind_referral_code");
  });

  it("translates the SQL locked backstop (P0001 detail) to the Turkish lock message", async () => {
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "validate_and_bind_referral_code") {
        return { data: [{ status: "valid", normalized_code: "KOD999" }], error: null };
      }
      return { data: null, error: { code: "P0001", message: "referral code locked", details: "locked" } };
    });

    await expect(updateProfileAttribute("referral_code", "KOD999")).rejects.toThrow(
      "Referral kodun zaten doğrulandı; değiştirmek için yöneticiyle iletişime geç.",
    );
  });
});

describe("requestNewCatalogItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({ data: "11111111-1111-1111-1111-111111111111", error: null });
  });

  it("calls request_new_catalog_item with trimmed title", async () => {
    const requestId = await requestNewCatalogItem(
      "Consultant_HealthcareDoctor",
      "  Dr. Ahmet Yılmaz Danışmanlık  ",
      "Diş hekimiyim",
    );

    expect(rpcMock).toHaveBeenCalledWith("request_new_catalog_item", {
      p_role_key: "Consultant_HealthcareDoctor",
      p_title: "Dr. Ahmet Yılmaz Danışmanlık",
      p_note: "Diş hekimiyim",
    });
    expect(requestId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("throws when the RPC returns an error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "a pending new profile request already exists" } });

    await expect(
      requestNewCatalogItem("Consultant_HealthcareDoctor", "Başlık", ""),
    ).rejects.toEqual({ message: "a pending new profile request already exists" });
  });
});

describe("upsertIndividualProfileDetailsPatch (B6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the current row, merges the patch, and upserts it for that user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { front_card: { linkedin_url: "old" }, detail_card: null, profile_settings: null },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null });

    fromMock.mockReturnValueOnce({ select }).mockReturnValueOnce({ upsert });

    const patchBuilder = vi.fn((current) => ({
      front_card: { ...current?.front_card, linkedin_url: "new" },
    }));

    await upsertIndividualProfileDetailsPatch("user-1", patchBuilder);

    expect(select).toHaveBeenCalledWith("front_card, detail_card, profile_settings");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(patchBuilder).toHaveBeenCalledWith({
      front_card: { linkedin_url: "old" },
      detail_card: null,
      profile_settings: null,
    });
    expect(upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      front_card: { linkedin_url: "new" },
    });
  });

  it("passes null to the patch builder when no row exists yet", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ data: null, error: null });

    fromMock.mockReturnValueOnce({ select }).mockReturnValueOnce({ upsert });

    const patchBuilder = vi.fn(() => ({ job_seeking: true }));
    await upsertIndividualProfileDetailsPatch("user-2", patchBuilder);

    expect(patchBuilder).toHaveBeenCalledWith(null);
    expect(upsert).toHaveBeenCalledWith({ user_id: "user-2", job_seeking: true });
  });

  it("throws without upserting when the read fails", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "select failed" } });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));

    fromMock.mockReturnValueOnce({ select });

    await expect(
      upsertIndividualProfileDetailsPatch("user-3", () => ({})),
    ).rejects.toEqual({ message: "select failed" });
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the upsert fails", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const upsert = vi.fn().mockResolvedValue({ data: null, error: { message: "upsert failed" } });

    fromMock.mockReturnValueOnce({ select }).mockReturnValueOnce({ upsert });

    await expect(
      upsertIndividualProfileDetailsPatch("user-4", () => ({ mentor_opt_in: true })),
    ).rejects.toEqual({ message: "upsert failed" });
  });
});
