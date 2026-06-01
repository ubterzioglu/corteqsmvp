import { describe, expect, it } from "vitest";

import type { CurrentUserProfilePayload } from "@/lib/member-profile";
import {
  buildPublicProfileViewModelFromSections,
  buildSelfProfileViewModel,
} from "@/lib/profile-view-model";
import { roleMetas } from "@/lib/profile-types";

describe("profile-view-model", () => {
  it("defines self and public section metadata for every role", () => {
    for (const role of roleMetas) {
      expect(role.selfSectionKeys.length).toBeGreaterThan(0);
      expect(role.publicSectionKeys.length).toBeGreaterThan(0);
      expect(["compact", "rich"]).toContain(role.defaultPreviewBehavior);
    }
  });

  it("builds a self profile preview model from current user payload", () => {
    const profile: CurrentUserProfilePayload = {
      userId: "user-1",
      email: "user@example.com",
      fullName: "Ada Lovelace",
      profileType: "danisman",
      roleKey: "danisman",
      roleLabel: "Consultant",
      roleDescription: "Danışman profili",
      roleSlug: "consultant",
      features: [],
      attributes: [
        {
          attributeKey: "full_name",
          label: "Ad Soyad / Uzman Adı",
          description: null,
          dataType: "text",
          isSystem: true,
          sortOrder: 10,
          isRequired: true,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: false,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "Ada Lovelace",
          valueJson: null,
          displayValue: "Ada Lovelace",
        },
        {
          attributeKey: "bio_short",
          label: "Kısa Biyografi",
          description: null,
          dataType: "textarea",
          isSystem: true,
          sortOrder: 20,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "Berlin merkezli diaspora danışmanı.",
          valueJson: null,
          displayValue: "Berlin merkezli diaspora danışmanı.",
        },
        {
          attributeKey: "city",
          label: "Şehir",
          description: null,
          dataType: "text",
          isSystem: true,
          sortOrder: 30,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "Berlin",
          valueJson: null,
          displayValue: "Berlin",
        },
        {
          attributeKey: "country",
          label: "Ülke",
          description: null,
          dataType: "text",
          isSystem: true,
          sortOrder: 40,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "Germany",
          valueJson: null,
          displayValue: "Germany",
        },
        {
          attributeKey: "expertise_area",
          label: "Uzmanlık Alanı",
          description: null,
          dataType: "text",
          isSystem: false,
          sortOrder: 50,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "Göçmenlik Hukuku",
          valueJson: null,
          displayValue: "Göçmenlik Hukuku",
        },
      ],
      taxonomyGroups: [],
      pendingRequests: [],
      profileCompletion: {
        requiredTotal: 4,
        requiredCompleted: 4,
        percentage: 100,
      },
    };

    const model = buildSelfProfileViewModel(profile, 3);

    expect(model.displayName).toBe("Ada Lovelace");
    expect(model.locationLabel).toBe("Berlin, Germany");
    expect(model.preview.sections.some((section) => section.label === "Uzmanlık Alanı")).toBe(true);
    expect(model.dashboardCount).toBe(3);
  });

  it("maps section-based public profiles into the shared public view model", () => {
    const model = buildPublicProfileViewModelFromSections("user-2", [
      {
        section_key: "preview.isim_kurulus_adi",
        section_area: "preview_card",
        label: "İsim",
        component_name: "title",
        sort_order: 10,
        content: { text: "CorteQS Business" },
      },
      {
        section_key: "detail.hakkinda_bio",
        section_area: "detail_card",
        label: "Hakkında",
        component_name: "rich_text",
        sort_order: 20,
        content: { text: "Diaspora odaklı bir business profili." },
      },
    ]);

    expect(model.displayName).toBe("CorteQS Business");
    expect(model.sections[0]?.content).toContain("Diaspora odaklı");
  });
});
