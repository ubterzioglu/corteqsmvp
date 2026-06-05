import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    from: vi.fn(),
  },
}));

import {
  listAdminUnifiedRecords,
  listCatalogClaims,
  removeCatalogItemAttributeOverride,
  searchAdminProfiles,
  setCatalogItemAttributeOverride,
} from "@/lib/admin-catalog";

describe("admin-catalog rpc wrappers", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("maps unified records and total count", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "item-1",
          kind: "catalog_item",
          slug: "berlin-dernegi",
          item_type: "organization",
          title: "Berlin Derneği",
          summary: "Resmi topluluk kaydı",
          status: "published",
          visibility: "public",
          verification_status: "official_source",
          platform_role_key: "Organization_Association",
          primary_city: "Berlin",
          primary_country_code: "DE",
          category_labels: ["Association"],
          source_types: ["turkish_mission"],
          created_at: "2026-06-04T10:00:00.000Z",
          updated_at: "2026-06-04T10:15:00.000Z",
          profile_type: null,
          email: null,
          total_count: 2,
        },
        {
          id: "profile-1",
          kind: "profile",
          slug: null,
          item_type: null,
          title: "Ayşe Yılmaz",
          summary: "ayse@example.com",
          status: "directory_opted_in",
          visibility: null,
          verification_status: null,
          platform_role_key: "Community_Leader",
          primary_city: null,
          primary_country_code: "DE",
          category_labels: [],
          source_types: [],
          created_at: "2026-06-03T10:00:00.000Z",
          updated_at: "2026-06-03T11:00:00.000Z",
          profile_type: "Community_Leader",
          email: "ayse@example.com",
          total_count: 2,
        },
      ],
      error: null,
    });

    const result = await listAdminUnifiedRecords({
      page: 1,
      pageSize: 50,
      filters: {
        kind: "",
        query: "berlin",
        itemType: "",
        platformRoleKey: "",
        status: "",
        verificationStatus: "",
        city: "",
        countryCode: "",
      },
    });

    expect(rpcMock).toHaveBeenCalledWith(
      "admin_list_unified_records",
      expect.objectContaining({
        p_query: "berlin",
        p_platform_role_key: null,
      }),
    );
    expect(result.totalCount).toBe(2);
    expect(result.records[0]).toMatchObject({
      id: "item-1",
      kind: "catalog_item",
      categoryLabels: ["Association"],
    });
    expect(result.records[1]).toMatchObject({
      id: "profile-1",
      kind: "profile",
      email: "ayse@example.com",
    });
  });

  it("maps claim list rows", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "claim-1",
          item_id: "item-1",
          item_title: "Berlin Derneği",
          requested_by_user_id: "user-1",
          requester_full_name: "Ayşe Yılmaz",
          requester_email: "ayse@example.com",
          claim_type: "ownership",
          note: "Bu kayıt bana ait.",
          status: "pending",
          created_at: "2026-06-04T10:00:00.000Z",
          reviewed_at: null,
          reviewed_by_user_id: null,
          reviewer_full_name: null,
        },
      ],
      error: null,
    });

    const result = await listCatalogClaims("item-1");

    expect(rpcMock).toHaveBeenCalledWith("admin_list_catalog_claims", {
      p_item_id: "item-1",
      p_status: null,
    });
    expect(result[0]).toMatchObject({
      id: "claim-1",
      requesterFullName: "Ayşe Yılmaz",
      status: "pending",
    });
  });

  it("maps profile search rows", async () => {
    rpcMock.mockResolvedValue({
      data: [{ id: "user-1", full_name: "Ayşe Yılmaz", email: "ayse@example.com" }],
      error: null,
    });

    const result = await searchAdminProfiles("ayşe");

    expect(rpcMock).toHaveBeenCalledWith("admin_search_profiles", {
      p_query: "ayşe",
      p_limit: 10,
    });
    expect(result).toEqual([{ id: "user-1", fullName: "Ayşe Yılmaz", email: "ayse@example.com" }]);
  });

  it("passes correct args to attribute override rpc wrappers", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await setCatalogItemAttributeOverride("item-1", "full_name", {
      isEnabled: false,
      displayOrder: 30,
      overrideLabel: "Özel ad",
    });
    await removeCatalogItemAttributeOverride("item-1", "full_name");

    expect(rpcMock).toHaveBeenNthCalledWith(1, "admin_upsert_catalog_item_attribute_override", {
      p_item_id: "item-1",
      p_attribute_key: "full_name",
      p_is_enabled: false,
      p_display_order: 30,
      p_override_label: "Özel ad",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "admin_delete_catalog_item_attribute_override", {
      p_item_id: "item-1",
      p_attribute_key: "full_name",
    });
  });
});
