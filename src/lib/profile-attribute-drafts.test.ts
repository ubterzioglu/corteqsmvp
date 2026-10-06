import { describe, expect, it } from "vitest";

import type { ProfileAttributeState } from "@/lib/member-profile";
import { readBooleanAttributeValue } from "@/lib/profile-attribute-drafts";

const attributeWith = (valueJson: ProfileAttributeState["valueJson"]) =>
  ({
    attributeKey: "cv_share_with_premium",
    label: "CV'mi Premium üyeler görebilsin",
    description: null,
    dataType: "boolean",
    isSystem: false,
    sortOrder: 0,
    isRequired: false,
    isPublicDefault: false,
    userCanEdit: true,
    userCanHide: true,
    requiresAdminApprovalOnChange: false,
    visibility: "private",
    approvalStatus: "approved",
    valueText: null,
    valueJson,
    displayValue: null,
  }) satisfies ProfileAttributeState;

describe("readBooleanAttributeValue", () => {
  // `ProfilePage` bu fonksiyona özniteliğin KENDİSİNİ vermelidir. 6 Ekim 2026'da
  // `valueJson` (ve ikinci bir argüman) verilmişti: `true?.valueJson` her zaman
  // undefined döndüğü için kayıtlı değer ne olursa olsun "CV'mi Premium üyeler
  // görebilsin" anahtarı kapalı çiziliyordu. tsc yakaladı; bu test davranışı kilitler.
  it("yalnız valueJson === true olan öznitelik için true döner", () => {
    expect(readBooleanAttributeValue(attributeWith(true))).toBe(true);
    expect(readBooleanAttributeValue(attributeWith(false))).toBe(false);
    expect(readBooleanAttributeValue(attributeWith(null))).toBe(false);
  });

  it("öznitelik yoksa (null/undefined) false döner — varsayılan KAPALI", () => {
    expect(readBooleanAttributeValue(null)).toBe(false);
    expect(readBooleanAttributeValue(undefined)).toBe(false);
  });

  it("'true' metnini veya 1'i doğru saymaz", () => {
    expect(readBooleanAttributeValue(attributeWith("true"))).toBe(false);
    expect(readBooleanAttributeValue(attributeWith(1))).toBe(false);
  });
});
