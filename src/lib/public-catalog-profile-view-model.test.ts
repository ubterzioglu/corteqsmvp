import { describe, expect, it } from "vitest";

import type { PublicCatalogProfilePagePayload } from "@/lib/public-catalog-profile-schemas";
import {
  buildAttributeRows,
  buildContactRows,
  buildHeroLinkPills,
  buildLinkRows,
  buildPublicCatalogProfileViewModel,
} from "@/lib/public-catalog-profile-view-model";

const makePayload = (
  overrides: Partial<PublicCatalogProfilePagePayload> = {},
): PublicCatalogProfilePagePayload => ({
  item: {
    id: "item-1",
    slug: "member-arkin-kara",
    title: "Arkin Kara",
    itemType: "member",
    roleKey: "Member",
    roleLabel: "Üye",
    headline: "Genel Tıp",
    shortDescription: "Kısa açıklama",
    longDescription: "Uzun açıklama",
    avatarUrl: null,
    coverImageUrl: null,
    verificationStatus: "unverified",
    isVerified: false,
    isClaimable: true,
    city: "Dortmund",
    countryCode: "DE",
    countryLabel: "Almanya",
    addressLine: null,
    categories: [{ slug: "doctor", name: "Doktor", isPrimary: true }],
    ...(overrides.item ?? {}),
  },
  sections: overrides.sections ?? [],
  attributes: overrides.attributes ?? [],
  contacts: overrides.contacts ?? [],
  links: overrides.links ?? [],
  services: overrides.services ?? [],
  languages: overrides.languages ?? [],
  media: overrides.media ?? [],
  claim: overrides.claim ?? { canClaim: true, verificationStatus: "unverified" },
});

describe("buildPublicCatalogProfileViewModel — hero", () => {
  it("builds hero with initials fallback when no avatar exists", () => {
    const vm = buildPublicCatalogProfileViewModel(makePayload());
    expect(vm.hero.title).toBe("Arkin Kara");
    expect(vm.hero.avatarUrl).toBeNull();
    expect(vm.hero.initials).toBe("AK");
    expect(vm.hero.locationLabel).toBe("Dortmund • Almanya");
  });

  it("uses a safe avatar url when present", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({ item: { ...makePayload().item, avatarUrl: "https://cdn.corteqs.net/a.jpg" } }),
    );
    expect(vm.hero.avatarUrl).toBe("https://cdn.corteqs.net/a.jpg");
  });

  it("drops unsafe avatar urls", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({ item: { ...makePayload().item, avatarUrl: "javascript:alert(1)" } }),
    );
    expect(vm.hero.avatarUrl).toBeNull();
    expect(vm.hero.initials).toBe("AK");
  });

  it("adds Turkish status badges", () => {
    const claimable = buildPublicCatalogProfileViewModel(makePayload());
    expect(claimable.hero.badges.map((badge) => badge.label)).toContain("Sahiplenilebilir Profil");

    const managed = buildPublicCatalogProfileViewModel(
      makePayload({
        item: { ...makePayload().item, verificationStatus: "claimed", isVerified: true },
        claim: { canClaim: false, verificationStatus: "claimed" },
      }),
    );
    const labels = managed.hero.badges.map((badge) => badge.label);
    expect(labels).toContain("Yönetilen Profil");
    expect(labels).toContain("Doğrulanmış Profil");
    expect(labels).not.toContain("Sahiplenilebilir Profil");
  });

  it("maps opt-in attributes to hero badges and keeps them out of the grid", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        attributes: [
          { key: "job_seeking_opt_in", label: "İş Arıyorum", dataType: "boolean", sortOrder: 1, valueText: null, valueJson: true },
          { key: "volunteer_mentorship_opt_in", label: "Gönüllü Mentörlük", dataType: "boolean", sortOrder: 2, valueText: "true", valueJson: null },
          { key: "moving_soon_opt_in", label: "Yakında Taşınacağım", dataType: "boolean", sortOrder: 3, valueText: null, valueJson: false },
          { key: "expertise_area", label: "Uzmanlık", dataType: "text", sortOrder: 4, valueText: "Genel Tıp", valueJson: null },
        ],
      }),
    );
    const labels = vm.hero.badges.map((badge) => badge.label);
    expect(labels).toContain("İş Arıyorum");
    expect(labels).toContain("Gönüllü Mentör");
    expect(labels).not.toContain("Yakında Taşınacak");

    const gridSection = vm.mainSections.find((section) => section.componentKey === "attributes");
    const rowKeys = (gridSection?.content.rows as Array<{ key: string }>).map((row) => row.key);
    expect(rowKeys).toEqual(["expertise_area"]);
  });

  it("exposes the headline as a tagline pill", () => {
    const vm = buildPublicCatalogProfileViewModel(makePayload());
    expect(vm.hero.tagline).toBe("Genel Tıp");
  });

  it("accent is deterministic per role", () => {
    const first = buildPublicCatalogProfileViewModel(makePayload());
    const second = buildPublicCatalogProfileViewModel(makePayload());
    expect(first.hero.accent).toBe(second.hero.accent);
  });
});

describe("buildPublicCatalogProfileViewModel — sections", () => {
  const richTextSection = {
    sectionKey: "detail.hakkinda_bio",
    label: "Hakkında",
    description: null,
    sectionArea: "detail_card" as const,
    componentKey: "rich_text",
    sortOrder: 110,
    content: { text: "Uzun açıklama" },
  };

  it("keeps db section order by sortOrder", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        sections: [
          { ...richTextSection, sectionKey: "b", sortOrder: 200 },
          { ...richTextSection, sectionKey: "a", sortOrder: 100 },
        ],
      }),
    );
    expect(vm.mainSections.map((section) => section.key)).toEqual(["a", "b"]);
  });

  it("excludes preview_card sections (hero already renders them)", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        sections: [{ ...richTextSection, sectionArea: "preview_card", sectionKey: "preview.x" }],
      }),
    );
    expect(vm.mainSections).toHaveLength(0);
  });

  it("filters empty sections", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({ sections: [{ ...richTextSection, content: { text: "  " } }] }),
    );
    expect(vm.mainSections).toHaveLength(0);
  });

  it("routes unknown component keys to main with their content intact", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        sections: [
          {
            ...richTextSection,
            sectionKey: "detail.yeni",
            componentKey: "brand_new_widget",
            content: { headline: "Yeni içerik" },
          },
        ],
      }),
    );
    expect(vm.mainSections).toHaveLength(1);
    expect(vm.mainSections[0].componentKey).toBe("brand_new_widget");
    expect(vm.mainSections[0].placement).toBe("main");
  });

  it("derives attribute/services/contact/language sections and splits placements", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        attributes: [
          { key: "expertise_area", label: "Uzmanlık", dataType: "text", sortOrder: 10, valueText: "Genel Tıp", valueJson: null },
        ],
        services: [{ name: "Genel Tıp", description: null }],
        contacts: [{ type: "phone", value: "+49 231 818 687", label: null, isPrimary: true }],
        languages: [{ code: "tr", proficiency: "native_or_fluent" }],
      }),
    );
    expect(vm.mainSections.map((section) => section.componentKey)).toEqual(["attributes", "services"]);
    expect(vm.sidebarSections.map((section) => section.componentKey)).toEqual(["contact_list", "languages"]);
  });

  it("does not duplicate hero attributes inside the attribute grid", () => {
    const rows = buildAttributeRows([
      { key: "full_name", label: "İsim", dataType: "text", sortOrder: 1, valueText: "Arkin", valueJson: null },
      { key: "profile_photo_url", label: "Foto", dataType: "url", sortOrder: 2, valueText: "https://x.com/a.jpg", valueJson: null },
      { key: "expertise_area", label: "Uzmanlık", dataType: "text", sortOrder: 3, valueText: "Genel Tıp", valueJson: null },
    ]);
    expect(rows.map((row) => row.key)).toEqual(["expertise_area"]);
  });
});

describe("buildPublicCatalogProfileViewModel — quick actions ve claim", () => {
  it("creates only actions whose data exists, with safe hrefs", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [
          { type: "website", value: "https://example.com", label: null, isPrimary: true },
          { type: "email", value: "info@example.com", label: null, isPrimary: false },
          { type: "phone", value: "+49 231 818 687", label: null, isPrimary: false },
        ],
      }),
    );
    const keys = vm.quickActions.map((action) => action.key);
    expect(keys).toEqual(["website", "email", "phone", "map"]);
    expect(vm.quickActions[0].href).toBe("https://example.com/");
    expect(vm.quickActions[1].href).toBe("mailto:info@example.com");
    expect(vm.quickActions[2].href).toBe("tel:+49231818687");
  });

  it("skips website action for unsafe urls", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [{ type: "website", value: "javascript:alert(1)", label: null, isPrimary: true }],
      }),
    );
    expect(vm.quickActions.find((action) => action.key === "website")).toBeUndefined();
  });

  it("claim view-model reflects managed state", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        item: { ...makePayload().item, verificationStatus: "claimed" },
        claim: { canClaim: false, verificationStatus: "claimed" },
      }),
    );
    expect(vm.claim.canClaim).toBe(false);
    expect(vm.claim.isManaged).toBe(true);
  });
});

describe("buildHeroLinkPills", () => {
  it("merges links, social contacts and social url attributes with dedupe", () => {
    const pills = buildHeroLinkPills(
      makePayload({
        links: [
          { type: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/demo", isPrimary: false },
        ],
        contacts: [
          { type: "instagram", value: "https://www.instagram.com/demo", label: null, isPrimary: false },
          { type: "phone", value: "+49 231", label: null, isPrimary: true },
        ],
        attributes: [
          { key: "linkedin_url", label: "LinkedIn", dataType: "url", sortOrder: 1, valueText: "https://www.linkedin.com/in/demo", valueJson: null },
          { key: "website_url", label: "Website", dataType: "url", sortOrder: 2, valueText: "https://demo.example.com", valueJson: null },
          { key: "x_url", label: "X", dataType: "url", sortOrder: 3, valueText: "javascript:alert(1)", valueJson: null },
        ],
      }),
    );

    expect(pills.map((pill) => pill.label)).toEqual(["LinkedIn", "Instagram", "Website"]);
  });

  it("keeps social attributes out of the attribute grid and drops link sections when pills exist", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        links: [
          { type: "website", label: "Website", url: "https://demo.example.com", isPrimary: false },
        ],
        attributes: [
          { key: "instagram_url", label: "Instagram", dataType: "url", sortOrder: 1, valueText: "https://www.instagram.com/demo", valueJson: null },
          { key: "expertise_area", label: "Uzmanlık", dataType: "text", sortOrder: 2, valueText: "Genel Tıp", valueJson: null },
        ],
      }),
    );

    expect(vm.hero.linkPills.map((pill) => pill.label)).toEqual(["Website", "Instagram"]);
    const gridSection = vm.mainSections.find((section) => section.componentKey === "attributes");
    const rowKeys = (gridSection?.content.rows as Array<{ key: string }>).map((row) => row.key);
    expect(rowKeys).toEqual(["expertise_area"]);
    expect(
      [...vm.mainSections, ...vm.sidebarSections].some((section) => section.componentKey === "links"),
    ).toBe(false);
  });

  it("excludes social contact types from the derived contact list", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [
          { type: "phone", value: "+49 231 818 687", label: null, isPrimary: true },
          { type: "instagram", value: "https://www.instagram.com/demo", label: null, isPrimary: false },
        ],
      }),
    );
    const contactSection = vm.sidebarSections.find((section) => section.componentKey === "contact_list");
    const types = (contactSection?.content.contacts as Array<{ type: string }>).map((row) => row.type);
    expect(types).toEqual(["phone"]);
  });
});

describe("contact/link row helpers", () => {
  it("dedupes contacts and resolves semantic hrefs", () => {
    const rows = buildContactRows([
      { type: "phone", value: "+49 231", label: null, isPrimary: true },
      { type: "phone", value: "+49 231", label: null, isPrimary: false },
      { type: "email", value: "info@example.com", label: "Posta", isPrimary: false },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].href).toBe("tel:+49231");
    expect(rows[1].label).toBe("Posta");
    expect(rows[1].href).toBe("mailto:info@example.com");
  });

  it("renders whatsapp contacts as external links when the value is a url", () => {
    const rows = buildContactRows([
      { type: "whatsapp", value: "https://chat.whatsapp.com/Jqkc4xh5YYY8zeALR8WSAW", label: "Join Link", isPrimary: true },
      { type: "whatsapp", value: "+49 171 123 45 67", label: null, isPrimary: false },
    ]);
    expect(rows[0].href).toBe("https://chat.whatsapp.com/Jqkc4xh5YYY8zeALR8WSAW");
    expect(rows[0].external).toBe(true);
    expect(rows[1].href).toBe("tel:+491711234567");
    expect(rows[1].external).toBe(false);
  });

  it("filters unsafe links and dedupes by url", () => {
    const rows = buildLinkRows([
      { type: "website", label: null, url: "https://example.com", isPrimary: false },
      { type: "website", label: null, url: "https://example.com", isPrimary: false },
      { type: "website", label: null, url: "javascript:alert(1)", isPrimary: false },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].url).toBe("https://example.com/");
  });
});

describe("quick actions — whatsapp ve randevu", () => {
  it("whatsapp telefon numarasını wa.me linkine çevirir", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [{ type: "whatsapp", value: "+49 171 123 45 67", label: null, isPrimary: false }],
      }),
    );
    const whatsapp = vm.quickActions.find((action) => action.key === "whatsapp");
    expect(whatsapp?.href).toBe("https://wa.me/491711234567");
    expect(whatsapp?.external).toBe(true);
  });

  it("whatsapp chat URL'sini sanitize edip korur", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [
          { type: "whatsapp", value: "https://chat.whatsapp.com/Jqkc4xh5YYY8", label: null, isPrimary: false },
        ],
      }),
    );
    expect(vm.quickActions.find((action) => action.key === "whatsapp")?.href).toBe(
      "https://chat.whatsapp.com/Jqkc4xh5YYY8",
    );
  });

  it("randevu URL'si varsa CTA oluşturur, unsafe URL'de oluşturmaz", () => {
    const withSafe = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [
          { type: "appointment_url", value: "https://calendly.com/demo", label: null, isPrimary: false },
        ],
      }),
    );
    expect(withSafe.quickActions.find((action) => action.key === "appointment")?.label).toBe(
      "Randevu Al",
    );

    const withUnsafe = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [
          { type: "appointment_url", value: "javascript:alert(1)", label: null, isPrimary: false },
        ],
      }),
    );
    expect(withUnsafe.quickActions.find((action) => action.key === "appointment")).toBeUndefined();
  });
});

describe("presentation entegrasyonu — Experimental_2 pilot", () => {
  const pilotItem = (overrides: Record<string, unknown> = {}) => ({
    ...makePayload().item,
    roleKey: "Experimental_2",
    roleLabel: "Experimental 2",
    ...overrides,
  });

  it("Experimental_2 premium presentation çözümler", () => {
    const vm = buildPublicCatalogProfileViewModel(makePayload({ item: pilotItem() }));
    expect(vm.presentation.key).toBe("experimental-2-premium");
    expect(vm.hero.eyebrow).not.toBeNull();
    expect(vm.hero.accent).toBe("purple");
  });

  it("Experimental_1 generic fallback alır (negatif kontrol)", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({ item: { ...makePayload().item, roleKey: "Experimental_1" } }),
    );
    expect(vm.presentation.key).toBe("generic");
    expect(vm.hero.eyebrow).toBeNull();
  });

  it("generic rollerde aksiyonlar secondary kalır", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        contacts: [{ type: "email", value: "info@example.com", label: null, isPrimary: false }],
      }),
    );
    expect(vm.quickActions.every((action) => action.variant === "secondary")).toBe(true);
  });

  it("pilotta öncelik sırasına göre en fazla 2 primary aksiyon oluşur", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        item: pilotItem(),
        contacts: [
          { type: "website", value: "https://example.com", label: null, isPrimary: false },
          { type: "email", value: "info@example.com", label: null, isPrimary: false },
          { type: "phone", value: "+49 231 818 687", label: null, isPrimary: false },
          { type: "whatsapp", value: "+49 171 123 45 67", label: null, isPrimary: false },
        ],
      }),
    );
    const primary = vm.quickActions.filter((action) => action.variant === "primary");
    expect(primary.map((action) => action.key)).toEqual(["email", "whatsapp"]);
    expect(vm.quickActions.find((action) => action.key === "website")?.variant).toBe("secondary");
  });

  it("pilotta tercih edilen section sırası uygulanır, generic'te DB sırası korunur", () => {
    const sections = [
      {
        sectionKey: "detail.iletisim",
        label: "İletişim",
        description: null,
        sectionArea: "detail_card" as const,
        componentKey: "contact_list",
        sortOrder: 100,
        content: { contacts: [{ key: "a", type: "phone", label: "Tel", value: "1", href: null, external: false }] },
      },
      {
        sectionKey: "detail.diller",
        label: "Diller",
        description: null,
        sectionArea: "detail_card" as const,
        componentKey: "languages",
        sortOrder: 50,
        content: { languages: [{ code: "tr", proficiency: null }] },
      },
    ];

    const generic = buildPublicCatalogProfileViewModel(makePayload({ sections }));
    expect(generic.sidebarSections.map((section) => section.componentKey)).toEqual([
      "languages",
      "contact_list",
    ]);

    const pilot = buildPublicCatalogProfileViewModel(makePayload({ item: pilotItem(), sections }));
    expect(pilot.sidebarSections.map((section) => section.componentKey)).toEqual([
      "contact_list",
      "languages",
    ]);
  });

  it("main ve sidebar placement pilotta da korunur", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        item: pilotItem(),
        attributes: [
          { key: "expertise_area", label: "Uzmanlık", dataType: "text", sortOrder: 10, valueText: "Genel Tıp", valueJson: null },
        ],
        languages: [{ code: "tr", proficiency: "native_or_fluent" }],
      }),
    );
    expect(vm.mainSections.map((section) => section.componentKey)).toEqual(["attributes"]);
    expect(vm.sidebarSections.map((section) => section.componentKey)).toEqual(["languages"]);
  });
});

describe("trust signals", () => {
  it("claimable profil için sahiplenilebilir sinyali üretir", () => {
    const vm = buildPublicCatalogProfileViewModel(makePayload());
    expect(vm.trustSignals.map((signal) => signal.key)).toEqual(["claimable"]);
    expect(vm.trustSignals[0].label).toBe("Sahiplenilebilir Profil");
  });

  it("managed + verified profil için doğru sinyalleri üretir", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        item: { ...makePayload().item, verificationStatus: "claimed", isVerified: true },
        claim: { canClaim: false, verificationStatus: "claimed" },
      }),
    );
    expect(vm.trustSignals.map((signal) => signal.key)).toEqual(["verified", "managed"]);
  });

  it("sinyal yoksa boş liste döner", () => {
    const vm = buildPublicCatalogProfileViewModel(
      makePayload({
        item: { ...makePayload().item, isClaimable: false },
        claim: { canClaim: false, verificationStatus: "unverified" },
      }),
    );
    expect(vm.trustSignals).toEqual([]);
  });
});
