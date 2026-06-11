import { describe, expect, it } from "vitest";

import {
  canJoinCafeRule,
  canPostCaddeRule,
  canPostKopruRule,
  computeMissingGateFields,
  isIndividualRoleKey,
  mapActorContext,
  moderateCaddeCafeName,
  resolveCaddeRpcErrorMessage,
  type CafeJoinRuleInput,
  type KopruRuleInput,
} from "@/lib/cadde-rules";

const baseKopru: KopruRuleInput = {
  isAdminOrModerator: false,
  profileComplete: true,
  hasBridgeFeature: true,
  isDiasporaResident: false,
  isTRResident: false,
  isIndividualRole: false,
  indivRelocating: false,
  digitalCommunityEnabled: false,
};

// Spec §22.1 zorunlu truth-table senaryoları
describe("canPostKopruRule (CKS §7.2 truth table)", () => {
  it("TR bireysel + indivRelocating OFF → Köprü reddedilir", () => {
    expect(canPostKopruRule({ ...baseKopru, isTRResident: true, isIndividualRole: true, indivRelocating: false })).toBe(false);
  });

  it("TR bireysel + indivRelocating ON → Köprü yayınlanır", () => {
    expect(canPostKopruRule({ ...baseKopru, isTRResident: true, isIndividualRole: true, indivRelocating: true })).toBe(true);
  });

  it("TR işletme + digitalCommunity OFF → Köprü reddedilir", () => {
    expect(canPostKopruRule({ ...baseKopru, isTRResident: true, isIndividualRole: false, digitalCommunityEnabled: false })).toBe(false);
  });

  it("TR işletme + digitalCommunity ON → Köprü yayınlanır", () => {
    expect(canPostKopruRule({ ...baseKopru, isTRResident: true, isIndividualRole: false, digitalCommunityEnabled: true })).toBe(true);
  });

  it("Diaspora yerleşik doğrulanmış → Köprü her zaman", () => {
    expect(canPostKopruRule({ ...baseKopru, isDiasporaResident: true })).toBe(true);
  });

  it("Profili eksik / doğrulanmamış kullanıcı → reddedilir", () => {
    expect(canPostKopruRule({ ...baseKopru, isDiasporaResident: true, profileComplete: false })).toBe(false);
  });

  it("bridge feature kapalı (örn. ban/override) → reddedilir", () => {
    expect(canPostKopruRule({ ...baseKopru, isDiasporaResident: true, hasBridgeFeature: false })).toBe(false);
  });

  it("Admin / moderator → her durumda override", () => {
    expect(canPostKopruRule({ ...baseKopru, isAdminOrModerator: true, profileComplete: false, hasBridgeFeature: false })).toBe(true);
  });

  it("yerleşikliği belirsiz kullanıcı (ne TR ne diaspora) → reddedilir", () => {
    expect(canPostKopruRule(baseKopru)).toBe(false);
  });
});

describe("canPostCaddeRule", () => {
  it("profil tamam + feature açık → paylaşabilir", () => {
    expect(canPostCaddeRule({ profileComplete: true, hasPostCreateFeature: true })).toBe(true);
  });

  it("profil eksik veya feature kapalı → paylaşamaz", () => {
    expect(canPostCaddeRule({ profileComplete: false, hasPostCreateFeature: true })).toBe(false);
    expect(canPostCaddeRule({ profileComplete: true, hasPostCreateFeature: false })).toBe(false);
  });
});

describe("computeMissingGateFields", () => {
  it("ülke + şehir eksiklerini listeler; telefon yalnız zorunluysa istenir (D-03 stub)", () => {
    expect(computeMissingGateFields({ country: null, city: " ", phoneRequired: false, isPhoneVerified: false }))
      .toEqual(["country", "city"]);
    expect(computeMissingGateFields({ country: "Almanya", city: "Berlin", phoneRequired: false, isPhoneVerified: false }))
      .toEqual([]);
    expect(computeMissingGateFields({ country: "Almanya", city: "Berlin", phoneRequired: true, isPhoneVerified: false }))
      .toEqual(["phone_verification"]);
    expect(computeMissingGateFields({ country: "Almanya", city: "Berlin", phoneRequired: true, isPhoneVerified: true }))
      .toEqual([]);
  });
});

describe("isIndividualRoleKey", () => {
  it("yalnız bireysel User rollerini bireysel sayar (elçi ve blogger kurumsal aktördür)", () => {
    expect(isIndividualRoleKey("User_Standard")).toBe(true);
    expect(isIndividualRoleKey("User_DiasporaMember")).toBe(true);
    expect(isIndividualRoleKey("User_Contributor")).toBe(true);
    expect(isIndividualRoleKey("User_CityAmbassador")).toBe(false);
    expect(isIndividualRoleKey("User_BloggerVlogger")).toBe(false);
    expect(isIndividualRoleKey("Business_RestaurantCafe")).toBe(false);
    expect(isIndividualRoleKey(null)).toBe(false);
  });
});

describe("resolveCaddeRpcErrorMessage", () => {
  it("RPC hata kodlarını Türkçe mesaja çevirir", () => {
    expect(resolveCaddeRpcErrorMessage(new Error("cadde_bridge_permission_denied"))).toContain("Köprü");
    expect(resolveCaddeRpcErrorMessage(new Error("cadde_tr_scope_restricted"))).toContain("Türkiye");
    expect(resolveCaddeRpcErrorMessage(new Error("phone_verification_required"))).toContain("telefon");
  });

  it("bilinmeyen hatada fallback döner", () => {
    expect(resolveCaddeRpcErrorMessage(new Error("boom"))).toBe("İşlem tamamlanamadı. Lütfen tekrar dene.");
  });
});

describe("mapActorContext", () => {
  it("RPC jsonb çıktısını context'e çevirir", () => {
    const ctx = mapActorContext({
      userId: "u1",
      roleKey: "User_Standard",
      featureKeys: ["cadde.access", "cadde.post.create"],
      country: "Almanya",
      city: "Berlin",
      isPhoneVerified: false,
      phoneRequired: false,
      isTRResident: false,
      isDiasporaResident: true,
      indivRelocating: false,
      digitalCommunityEnabled: false,
      missingGateFields: [],
      canEnterCadde: true,
      canPostCadde: true,
      canPostKopru: true,
    });
    expect(ctx).not.toBeNull();
    expect(ctx?.featureKeys.has("cadde.post.create")).toBe(true);
    expect(ctx?.canEnterCadde).toBe(true);
    expect(ctx?.profilePublic).toBe(true);
  });

  it("geçersiz girdide null döner", () => {
    expect(mapActorContext(null)).toBeNull();
    expect(mapActorContext("x")).toBeNull();
  });
});

const baseCafeJoin: CafeJoinRuleInput = {
  isAdminOrModerator: false,
  isArchivedOrInactive: false,
  hasEnded: false,
  capacity: null,
  approvedCount: 0,
  phoneRequired: false,
  isPhoneVerified: false,
  isTRCafe: false,
  isTRResident: false,
  hasTRPhone: false,
};

// SQL public.can_join_cadde_cafe ile birebir (mig 20260611100000)
describe("canJoinCafeRule (CKS 7.3 cafe giris kurallari)", () => {
  it("arsiv ve sona ermis cafe herkese kapali (admin dahil)", () => {
    expect(canJoinCafeRule({ ...baseCafeJoin, isArchivedOrInactive: true, isAdminOrModerator: true })).toBe("cadde_cafe_archived");
    expect(canJoinCafeRule({ ...baseCafeJoin, hasEnded: true, isAdminOrModerator: true })).toBe("cadde_cafe_ended");
  });

  it("admin/moderator kapasite dahil diger kurallari atlar", () => {
    expect(canJoinCafeRule({ ...baseCafeJoin, isAdminOrModerator: true, capacity: 1, approvedCount: 5 })).toBeNull();
  });

  it("kapasite dolunca katilim kapanir", () => {
    expect(canJoinCafeRule({ ...baseCafeJoin, capacity: 10, approvedCount: 10 })).toBe("cadde_cafe_full");
    expect(canJoinCafeRule({ ...baseCafeJoin, capacity: 10, approvedCount: 9 })).toBeNull();
  });

  it("telefon flag'i acikken dogrulanmamis kullanici katilamaz (D-03 stub'da flag kapali)", () => {
    expect(canJoinCafeRule({ ...baseCafeJoin, phoneRequired: true, isPhoneVerified: false })).toBe("phone_verification_required");
    expect(canJoinCafeRule({ ...baseCafeJoin, phoneRequired: false, isPhoneVerified: false })).toBeNull();
  });

  it("TR cafe yalniz TR yerlesik uyeye acik; flag acikken TR telefonu da gerekir", () => {
    expect(canJoinCafeRule({ ...baseCafeJoin, isTRCafe: true, isTRResident: false })).toBe("cadde_cafe_tr_only");
    expect(canJoinCafeRule({ ...baseCafeJoin, isTRCafe: true, isTRResident: true })).toBeNull();
    expect(canJoinCafeRule({ ...baseCafeJoin, isTRCafe: true, isTRResident: true, phoneRequired: true, isPhoneVerified: true, hasTRPhone: false })).toBe("cadde_cafe_tr_only");
    expect(canJoinCafeRule({ ...baseCafeJoin, isTRCafe: true, isTRResident: true, phoneRequired: true, isPhoneVerified: true, hasTRPhone: true })).toBeNull();
  });
});

describe("moderateCaddeCafeName (R-05)", () => {
  it("gecerli adlari kabul eder", () => {
    expect(moderateCaddeCafeName("Berlin IT Sohbeti")).toEqual({ ok: true });
  });

  it("kisa/uzun adlari reddeder", () => {
    expect(moderateCaddeCafeName("ab").ok).toBe(false);
    expect(moderateCaddeCafeName("a".repeat(81)).ok).toBe(false);
  });

  it("kufur, URL ve spam tekrarini reddeder", () => {
    expect(moderateCaddeCafeName("orospu cafe").ok).toBe(false);
    expect(moderateCaddeCafeName("https://spam.example").ok).toBe(false);
    expect(moderateCaddeCafeName("heyyyyyyyy cafe").ok).toBe(false);
  });
});
