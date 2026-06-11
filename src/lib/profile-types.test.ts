import { describe, expect, it } from "vitest";

import { defaultProfileType, getUiProfileType, profileTypes } from "@/lib/profile-types";

describe("getUiProfileType", () => {
  it("legacy profil tiplerini olduğu gibi geçirir", () => {
    for (const legacyType of profileTypes) {
      expect(getUiProfileType(legacyType)).toBe(legacyType);
    }
  });

  it("null/undefined/boş için varsayılan kategoriye düşer", () => {
    expect(getUiProfileType(null)).toBe(defaultProfileType);
    expect(getUiProfileType(undefined)).toBe(defaultProfileType);
    expect(getUiProfileType("")).toBe(defaultProfileType);
  });

  it("explicit override'ları prefix kuralından önce uygular", () => {
    expect(getUiProfileType("User_CityAmbassador")).toBe("sehir-elcisi");
    expect(getUiProfileType("User_BloggerVlogger")).toBe("blogger-vlogger-youtuber");
    expect(getUiProfileType("Healthcare_Doctor")).toBe("danisman");
    expect(getUiProfileType("Healthcare_Dentist")).toBe("danisman");
    expect(getUiProfileType("Healthcare_Psychologist")).toBe("danisman");
    expect(getUiProfileType("Job_Recruiter")).toBe("danisman");
    expect(getUiProfileType("Job_Candidate")).toBe("bireysel");
    expect(getUiProfileType("Job_Employer")).toBe("isletme");
    expect(getUiProfileType("Job_Agency")).toBe("isletme");
    expect(getUiProfileType("Marketplace_IndividualSeller")).toBe("bireysel");
  });

  it("User_ ve Admin_ prefix'lerini bireysel'e eşler", () => {
    expect(getUiProfileType("User_Standard")).toBe("bireysel");
    expect(getUiProfileType("User_DiasporaMember")).toBe("bireysel");
    expect(getUiProfileType("User_Contributor")).toBe("bireysel");
    expect(getUiProfileType("Admin_SuperAdmin")).toBe("bireysel");
    expect(getUiProfileType("Admin_PlatformAdmin")).toBe("bireysel");
    expect(getUiProfileType("Admin_ContentModerator")).toBe("bireysel");
  });

  it("Consultant_ prefix'ini danisman'a eşler", () => {
    expect(getUiProfileType("Consultant_RealEstate")).toBe("danisman");
    expect(getUiProfileType("Consultant_PracticalLife")).toBe("danisman");
    expect(getUiProfileType("Consultant_LawTax")).toBe("danisman");
  });

  it("kurumsal prefix'leri isletme'ye eşler", () => {
    expect(getUiProfileType("Business_RestaurantCafe")).toBe("isletme");
    expect(getUiProfileType("Business_ECommerce")).toBe("isletme");
    expect(getUiProfileType("Healthcare_Hospital")).toBe("isletme");
    expect(getUiProfileType("Healthcare_Clinic")).toBe("isletme");
    expect(getUiProfileType("Healthcare_Pharmacy")).toBe("isletme");
    expect(getUiProfileType("Healthcare_AppointmentProvider")).toBe("isletme");
    expect(getUiProfileType("Event_Organizer")).toBe("isletme");
    expect(getUiProfileType("Event_Venue")).toBe("isletme");
    expect(getUiProfileType("Marketplace_BusinessSeller")).toBe("isletme");
    expect(getUiProfileType("Marketplace_ServiceProvider")).toBe("isletme");
    expect(getUiProfileType("Marketplace_Landlord")).toBe("isletme");
  });

  it("Organization_ ve Community_ prefix'lerini kurulus-dernek'e eşler", () => {
    expect(getUiProfileType("Organization_AssociationFoundation")).toBe("kurulus-dernek");
    expect(getUiProfileType("Organization_EmbassyConsulate")).toBe("kurulus-dernek");
    expect(getUiProfileType("Community_WhatsAppAdmin")).toBe("kurulus-dernek");
    expect(getUiProfileType("Community_GroupAdmin")).toBe("kurulus-dernek");
  });

  it("bilinmeyen rol anahtarında varsayılana düşer (gelecekteki 77. rol)", () => {
    expect(getUiProfileType("Future_NewRole")).toBe(defaultProfileType);
    expect(getUiProfileType("garbage")).toBe(defaultProfileType);
  });

  it("dönen değer her zaman geçerli bir ProfileType'tır", () => {
    const samples = [
      "User_DiasporaMember",
      "Consultant_Financial",
      "Business_Gym",
      "Organization_TurkishMedia",
      "Healthcare_Doctor",
      "Unknown_Whatever",
      null,
    ];
    for (const sample of samples) {
      expect(profileTypes).toContain(getUiProfileType(sample));
    }
  });
});
