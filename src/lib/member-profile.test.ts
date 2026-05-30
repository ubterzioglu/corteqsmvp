import { describe, expect, it } from "vitest";

import { mapCurrentUserProfilePayload } from "@/lib/member-profile";

describe("mapCurrentUserProfilePayload", () => {
  it("maps taxonomy groups and options from rpc payload", () => {
    const payload = {
      user_id: "user-1",
      email: "user@test.com",
      full_name: "Test User",
      profile_type: "isletme",
      role_key: "isletme",
      role_label: "İşletme",
      role_slug: "business",
      features: [],
      attributes: [],
      taxonomy_groups: [
        {
          group_key: "business_subtype",
          label: "Business Alt Tipi",
          description: "İşletme tipi",
          selection_mode: "single",
          is_required: true,
          options: [
            {
              key: "business_subtype.classic",
              label: "Classic",
              description: "Fiziksel adres",
              is_active: true,
              is_selected: true,
            },
          ],
        },
      ],
      pending_requests: [],
      profile_completion: {
        required_total: 1,
        required_completed: 1,
        percentage: 100,
      },
    };

    const result = mapCurrentUserProfilePayload(payload as never);

    expect(result?.taxonomyGroups).toHaveLength(1);
    expect(result?.taxonomyGroups[0]).toMatchObject({
      groupKey: "business_subtype",
      selectionMode: "single",
      isRequired: true,
    });
    expect(result?.taxonomyGroups[0]?.options[0]).toMatchObject({
      key: "business_subtype.classic",
      isSelected: true,
    });
  });
});
