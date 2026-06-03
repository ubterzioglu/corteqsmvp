import { describe, expect, it } from "vitest";

import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";
import type { CurrentUserProfilePayload } from "@/lib/member-profile";
import {
  buildPublicProfileViewModelFromCurrentUser,
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

  it("maps social media url attributes into public links without duplicating them as sections", () => {
    const profile: CurrentUserProfilePayload = {
      userId: "user-3",
      email: "user3@example.com",
      fullName: "Ayse Kaya",
      profileType: "isletme",
      roleKey: "isletme",
      roleLabel: "İşletme",
      roleDescription: "İşletme profili",
      roleSlug: "business",
      features: [
        { key: GENERIC_FEATURE_KEYS.profileWebsiteCard, isEnabled: true, source: "role_default" },
        { key: GENERIC_FEATURE_KEYS.profileLinkedinCard, isEnabled: false, source: "role_default" },
        { key: INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge, isEnabled: true, source: "role_default" },
      ],
      attributes: [
        {
          attributeKey: "full_name",
          label: "İşletme Adı",
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
          valueText: "Ayse Kaya Studio",
          valueJson: null,
          displayValue: "Ayse Kaya Studio",
        },
        {
          attributeKey: "bio_short",
          label: "Kısa Açıklama",
          description: null,
          dataType: "textarea",
          isSystem: false,
          sortOrder: 20,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "Berlin merkezli tasarım stüdyosu.",
          valueJson: null,
          displayValue: "Berlin merkezli tasarım stüdyosu.",
        },
        {
          attributeKey: "instagram_url",
          label: "Instagram",
          description: null,
          dataType: "url",
          isSystem: false,
          sortOrder: 171,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "https://www.instagram.com/aysekaya",
          valueJson: null,
          displayValue: "https://www.instagram.com/aysekaya",
        },
        {
          attributeKey: "website_url",
          label: "Website",
          description: null,
          dataType: "url",
          isSystem: false,
          sortOrder: 170,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "https://aysekaya.studio",
          valueJson: null,
          displayValue: "https://aysekaya.studio",
        },
        {
          attributeKey: "linkedin_url",
          label: "LinkedIn",
          description: null,
          dataType: "url",
          isSystem: false,
          sortOrder: 171,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "https://www.linkedin.com/in/aysekaya",
          valueJson: null,
          displayValue: "https://www.linkedin.com/in/aysekaya",
        },
        {
          attributeKey: "x_url",
          label: "X (Twitter)",
          description: null,
          dataType: "url",
          isSystem: false,
          sortOrder: 175,
          isRequired: false,
          isPublicDefault: true,
          userCanEdit: true,
          userCanHide: true,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: "https://x.com/aysekaya",
          valueJson: null,
          displayValue: "https://x.com/aysekaya",
        },
        {
          attributeKey: "job_seeking_opt_in",
          label: "İş Arıyorum Badge'i",
          description: null,
          dataType: "boolean",
          isSystem: false,
          sortOrder: 180,
          isRequired: false,
          isPublicDefault: false,
          userCanEdit: true,
          userCanHide: false,
          requiresAdminApprovalOnChange: false,
          visibility: "public",
          approvalStatus: "approved",
          valueText: null,
          valueJson: true,
          displayValue: true,
        },
      ],
      taxonomyGroups: [],
      pendingRequests: [],
      profileCompletion: {
        requiredTotal: 2,
        requiredCompleted: 2,
        percentage: 100,
      },
    };

    const model = buildPublicProfileViewModelFromCurrentUser(profile);

    expect(model.links).toEqual([
      { label: "Instagram", url: "https://www.instagram.com/aysekaya" },
      { label: "Website", url: "https://aysekaya.studio" },
      { label: "X (Twitter)", url: "https://x.com/aysekaya" },
    ]);
    expect(model.links.some((item) => item.label === "LinkedIn")).toBe(false);
    expect(model.badges).toContain("İş Arıyorum");
    expect(model.sections.some((section) => section.key === "instagram_url")).toBe(false);
    expect(model.sections.some((section) => section.key === "x_url")).toBe(false);
    expect(model.sections.some((section) => section.key === "website_url")).toBe(false);
  });
});
