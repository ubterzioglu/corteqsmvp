import { describe, expect, it } from "vitest";

import {
  EXPERIMENTAL_2_PRESENTATION_KEY,
  GENERIC_PRESENTATION_KEY,
  isExperimental2Presentation,
  resolveProfilePresentation,
} from "@/lib/profile-presentation";

describe("resolveProfilePresentation — pilot izolasyonu", () => {
  it("Experimental_2 premium pilot config'ini alır", () => {
    const presentation = resolveProfilePresentation("Experimental_2");
    expect(presentation.key).toBe(EXPERIMENTAL_2_PRESENTATION_KEY);
    expect(presentation.heroVariant).toBe("experimental");
    expect(presentation.eyebrow).not.toBeNull();
    expect(presentation.showMobileActionBar).toBe(true);
    expect(isExperimental2Presentation(presentation)).toBe(true);
  });

  it("Experimental_1 generic fallback alır (negatif kontrol)", () => {
    const presentation = resolveProfilePresentation("Experimental_1");
    expect(presentation.key).toBe(GENERIC_PRESENTATION_KEY);
    expect(presentation.heroVariant).toBe("member");
    expect(presentation.showMobileActionBar).toBe(false);
    expect(isExperimental2Presentation(presentation)).toBe(false);
  });

  it("production rolleri generic fallback alır", () => {
    for (const roleKey of [
      "User_DiasporaMember",
      "Healthcare_Doctor",
      "Business_Restaurant",
      "Consultant_Immigration",
      "Organization_Association",
      "Admin_Platform",
    ]) {
      expect(resolveProfilePresentation(roleKey).key).toBe(GENERIC_PRESENTATION_KEY);
    }
  });

  it("tanımsız / boş rol generic fallback alır", () => {
    expect(resolveProfilePresentation("Totally_Unknown_Role").key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation(null).key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation(undefined).key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation("").key).toBe(GENERIC_PRESENTATION_KEY);
  });

  it("pilot config kısmi eşleşmeyle başka role sızmaz", () => {
    expect(resolveProfilePresentation("Experimental_2_Copy").key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation("experimental_2").key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation("Experimental").key).toBe(GENERIC_PRESENTATION_KEY);
  });

  it("generic config görsel davranışı değiştirmez", () => {
    const generic = resolveProfilePresentation("User_DiasporaMember");
    expect(generic.accent).toBeNull();
    expect(generic.eyebrow).toBeNull();
    expect(generic.primaryActionPriority).toEqual([]);
    expect(generic.preferredSectionOrder).toEqual([]);
  });
});
