import { describe, expect, it } from "vitest";

import {
  advisorProfileSections,
  createEmptyAdvisorResourceLinkFormState,
  toAdvisorResourceLinkFormState,
  toAdvisorResourceLinkPayload,
  validateAdvisorResourceLinkForm,
  type AdvisorResourceLinkRow,
} from "@/lib/resource-links";

describe("advisor resource link helpers", () => {
  it("maps advisor profile tabs to their dedicated tables", () => {
    expect(advisorProfileSections.map((section) => [section.key, section.tableName])).toEqual([
      ["consultant", "consultant_social_media_links"],
      ["influencer", "influencer_social_media_links"],
      ["contributor", "contributor_social_media_links"],
    ]);
  });

  it("builds advisor contact payloads with trimmed contact fields", () => {
    const payload = toAdvisorResourceLinkPayload({
      ...createEmptyAdvisorResourceLinkFormState(),
      name: "  Ada Lovelace  ",
      description: "  Berlin danışmanı  ",
      email: " ada@example.com ",
      phone: " +49 555 ",
      whatsapp: " +49 555 WA ",
      instagram: " @ada ",
      contacted_whatsapp: true,
      contacted_email: true,
    });

    expect(payload.name).toBe("Ada Lovelace");
    expect(payload.description).toBe("Berlin danışmanı");
    expect(payload.email).toBe("ada@example.com");
    expect(payload.phone).toBe("+49 555");
    expect(payload.whatsapp).toBe("+49 555 WA");
    expect(payload.instagram).toBe("@ada");
    expect(payload.link).toBe("@ada");
    expect(payload.platform).toBe("Instagram");
    expect(payload.contacted_whatsapp).toBe(true);
    expect(payload.contacted_instagram).toBe(false);
    expect(payload.contacted_email).toBe(true);
    expect(payload.contacted_phone).toBe(false);
  });

  it("requires an advisor name", () => {
    expect(validateAdvisorResourceLinkForm(createEmptyAdvisorResourceLinkFormState())).toBe("Ad zorunlu.");
  });

  it("stores empty optional advisor contact fields as null", () => {
    const payload = toAdvisorResourceLinkPayload({
      ...createEmptyAdvisorResourceLinkFormState(),
      name: "Katkı Veren",
    });

    expect(payload.description).toBeNull();
    expect(payload.email).toBeNull();
    expect(payload.phone).toBeNull();
    expect(payload.whatsapp).toBeNull();
    expect(payload.instagram).toBeNull();
    expect(payload.link).toBeNull();
  });

  it("maps advisor rows back to editable form state", () => {
    const row: AdvisorResourceLinkRow = {
      id: "1",
      name: "Ada",
      platform: "Diğer",
      description: null,
      link: null,
      email: null,
      phone: "+49",
      whatsapp: null,
      instagram: "@ada",
      contacted_whatsapp: false,
      contacted_instagram: true,
      contacted_email: false,
      contacted_phone: true,
      added_by: "UBT",
      created_at: "2026-04-24T00:00:00.000Z",
    };

    expect(toAdvisorResourceLinkFormState(row)).toEqual({
      name: "Ada",
      description: "",
      email: "",
      phone: "+49",
      whatsapp: "",
      instagram: "@ada",
      contacted_whatsapp: false,
      contacted_instagram: true,
      contacted_email: false,
      contacted_phone: true,
      added_by: "UBT",
    });
  });

  it("uses the legacy link as the editable Instagram value when instagram is empty", () => {
    const row: AdvisorResourceLinkRow = {
      id: "1",
      name: "Ada",
      platform: "Instagram",
      description: null,
      link: "https://instagram.com/ada",
      email: null,
      phone: null,
      whatsapp: null,
      instagram: null,
      contacted_whatsapp: false,
      contacted_instagram: false,
      contacted_email: false,
      contacted_phone: false,
      added_by: "UBT",
      created_at: "2026-04-24T00:00:00.000Z",
    };

    expect(toAdvisorResourceLinkFormState(row).instagram).toBe("https://instagram.com/ada");
  });
});
