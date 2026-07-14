import { describe, expect, it } from "vitest";

import {
  EXPERIMENTAL_2_PRESENTATION_KEY,
  GENERIC_PRESENTATION_KEY,
  INDIVIDUAL_PRESENTATION_KEY,
  isExperimental2Presentation,
  isPremiumPresentation,
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

  it("Experimental_3 de premium pilot config'ini alır (klon)", () => {
    const presentation = resolveProfilePresentation("Experimental_3");
    expect(presentation.key).toBe(EXPERIMENTAL_2_PRESENTATION_KEY);
    expect(presentation.heroVariant).toBe("experimental");
    expect(isExperimental2Presentation(presentation)).toBe(true);
  });

  it("Experimental_1 pilot exact-match'e girmez ama getUiProfileType varsayılanı gereği Bireysel premium alır", () => {
    // "Experimental_1" ne FLAT_ROLE_UI_TYPE_OVERRIDES ne de prefix tablosunda
    // tanımlı — getUiProfileType varsayılan olarak "bireysel" döner, bu da
    // artık individual premium config'e karşılık gelir (generic DEĞİL).
    const presentation = resolveProfilePresentation("Experimental_1");
    expect(presentation.key).toBe(INDIVIDUAL_PRESENTATION_KEY);
    expect(isExperimental2Presentation(presentation)).toBe(false);
    expect(isPremiumPresentation(presentation)).toBe(true);
  });
});

describe("resolveProfilePresentation — Bireysel kategori tek tip premium sunum", () => {
  it("Bireysel UI kategorisindeki flat roller individual premium config'i alır", () => {
    for (const roleKey of ["User_DiasporaMember", "Admin_PlatformAdmin", "Job_Candidate", "Marketplace_IndividualSeller"]) {
      const presentation = resolveProfilePresentation(roleKey);
      expect(presentation.key).toBe(INDIVIDUAL_PRESENTATION_KEY);
      expect(presentation.heroVariant).toBe("experimental");
      expect(presentation.accent).toBe("purple");
      expect(presentation.showMobileActionBar).toBe(true);
      expect(isPremiumPresentation(presentation)).toBe(true);
      expect(isExperimental2Presentation(presentation)).toBe(false);
    }
  });

  it("Admin_SuperAdmin Bireysel kategoride olsa da premium sunum ALMAZ (kurucu hesap istisnası)", () => {
    // Admin_SuperAdmin getUiProfileType ile "bireysel" sayılır (Admin_ prefix'i)
    // ama iki kurucu hesap (ubterzioglu@gmail.com, burakakcakanat@gmail.com —
    // bkz. migration 20260609004000_set_admin_users.sql) bilinçli olarak sade/
    // generic görünümde tutulur. Sadece görsel bir istisna; rol kategorisi,
    // izinler ve veri modeli değişmez.
    const presentation = resolveProfilePresentation("Admin_SuperAdmin");
    expect(presentation.key).toBe(GENERIC_PRESENTATION_KEY);
    expect(presentation.heroVariant).toBe("member");
    expect(presentation.eyebrow).toBeNull();
    expect(isPremiumPresentation(presentation)).toBe(false);
  });

  it("Bireysel olmayan production rolleri generic fallback almaya devam eder", () => {
    for (const roleKey of [
      "Healthcare_Doctor",
      "Business_Restaurant",
      "Consultant_Immigration",
      "Organization_Association",
    ]) {
      const presentation = resolveProfilePresentation(roleKey);
      expect(presentation.key).toBe(GENERIC_PRESENTATION_KEY);
      expect(isPremiumPresentation(presentation)).toBe(false);
    }
  });

  it("tanımsız rol (bilinmeyen key) getUiProfileType varsayılanı gereği Bireysel premium alır", () => {
    expect(resolveProfilePresentation("Totally_Unknown_Role").key).toBe(INDIVIDUAL_PRESENTATION_KEY);
  });

  it("null / undefined / boş rol generic fallback alır (henüz rol atanmamış durum)", () => {
    expect(resolveProfilePresentation(null).key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation(undefined).key).toBe(GENERIC_PRESENTATION_KEY);
    expect(resolveProfilePresentation("").key).toBe(GENERIC_PRESENTATION_KEY);
  });

  it("pilot config kısmi eşleşmeyle başka role sızmaz (exact-match korunur)", () => {
    // Bu key'ler pilot Map'ine exact-match olarak girmez; getUiProfileType
    // varsayılanı gereği individual premium'a düşerler (generic'e değil) —
    // ama kritik olan pilot Map'in bunları YAKALAMAMASI.
    expect(resolveProfilePresentation("Experimental_2_Copy").key).not.toBe(EXPERIMENTAL_2_PRESENTATION_KEY);
    expect(resolveProfilePresentation("experimental_2").key).not.toBe(EXPERIMENTAL_2_PRESENTATION_KEY);
    expect(resolveProfilePresentation("Experimental").key).not.toBe(EXPERIMENTAL_2_PRESENTATION_KEY);
  });

  it("generic config görsel davranışı değiştirmez", () => {
    const generic = resolveProfilePresentation("Healthcare_Doctor");
    expect(generic.accent).toBeNull();
    expect(generic.eyebrow).toBeNull();
    expect(generic.primaryActionPriority).toEqual([]);
    expect(generic.preferredSectionOrder).toEqual([]);
  });
});
