/**
 * Rol taksonomisi SÖZLEŞME testi.
 *
 * ⚠️ Bu test canlı veritabanına BAĞLANMAZ — "eşleme DB ile birebir mi" sorusunu
 * cevaplayamaz. Yaptığı iş, eşlemenin kendi içinde bozulmasını (kopya anahtar,
 * boş grup, yanlış önek, kurumun uzman listesine sızması) yakalamaktır.
 * DB'ye yeni rol eklendiğinde eşlemeyi ELLE güncellemek gerekir.
 */

import { describe, expect, it } from "vitest";

import {
  BUSINESS_ROLE_GROUPS,
  CITY_AMBASSADOR_ROLE_KEY,
  CONSULTANT_ROLE_GROUPS,
  roleKeysForGroup,
  roleKeysOf,
  roleLabelOf,
  type RoleGroup,
} from "@/lib/directory-role-groups";

const ALL_GROUPS: Array<[string, readonly RoleGroup[]]> = [
  ["İşletmeler", BUSINESS_ROLE_GROUPS],
  ["Uzmanlar", CONSULTANT_ROLE_GROUPS],
];

describe.each(ALL_GROUPS)("%s taksonomisi", (_name, groups) => {
  it("her grup en az bir rol taşır", () => {
    for (const group of groups) {
      expect(group.roles.length, `${group.key} grubu boş`).toBeGreaterThan(0);
    }
  });

  it("grup anahtarları tekildir", () => {
    const keys = groups.map((group) => group.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("rol anahtarları taksonomi genelinde tekildir", () => {
    // Aynı rol iki gruba girerse kayıt iki sekmede birden sayılır ve
    // "Tümü" toplamı sekme toplamlarıyla tutmaz.
    const keys = roleKeysOf(groups);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("etiketler boş değildir ve baştaki/sondaki boşluk taşımaz", () => {
    for (const group of groups) {
      expect(group.label.trim()).not.toBe("");
      for (const role of group.roles) {
        expect(role.label.trim()).not.toBe("");
        expect(role.label).toBe(role.label.trim());
      }
    }
  });

  it("grup anahtarları ASCII'dir (URL'e ve duruma güvenle konur)", () => {
    for (const group of groups) {
      expect(group.key, `${group.key} ASCII değil`).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("İşletmeler", () => {
  it("yalnız Business_* rolleri içerir", () => {
    for (const key of roleKeysOf(BUSINESS_ROLE_GROUPS)) {
      expect(key.startsWith("Business_"), `${key} Business_ önekli değil`).toBe(true);
    }
  });

  it("canlıdaki 25 Business_* rolünün tamamını kapsar", () => {
    // Ölçüldü 2026-09-20: roles tablosunda 25 aktif Business_* rolü var.
    // Bu sayı düşerse bir rol eşlemeden düşmüş demektir ve o roldeki kayıtlar
    // sayfada sessizce görünmez olur.
    expect(roleKeysOf(BUSINESS_ROLE_GROUPS)).toHaveLength(25);
  });
});

describe("Uzmanlar", () => {
  it("yalnız Consultant_* ve Healthcare_* rolleri içerir", () => {
    for (const key of roleKeysOf(CONSULTANT_ROLE_GROUPS)) {
      expect(
        key.startsWith("Consultant_") || key.startsWith("Healthcare_"),
        `${key} beklenmeyen önek`,
      ).toBe(true);
    }
  });

  it("KURUM niteliğindeki Healthcare rollerini DIŞLAR", () => {
    // Hastane/klinik/eczane KİŞİ değil kurumdur; yerleri Kuruluşlar ve
    // İşletmeler sayfalarıdır. Buraya eklenirse aynı kurum iki sayfada listelenir.
    const keys = roleKeysOf(CONSULTANT_ROLE_GROUPS);
    expect(keys).not.toContain("Healthcare_Hospital");
    expect(keys).not.toContain("Healthcare_Clinic");
    expect(keys).not.toContain("Healthcare_Pharmacy");
    expect(keys).not.toContain("Healthcare_AppointmentProvider");
  });

  it("11 Consultant_* rolünün tamamını kapsar", () => {
    // Ölçüldü 2026-09-20: 11 aktif Consultant_* rolü.
    const consultantKeys = roleKeysOf(CONSULTANT_ROLE_GROUPS).filter((key) =>
      key.startsWith("Consultant_"),
    );
    expect(consultantKeys).toHaveLength(11);
  });

  it("Business_* rolleriyle KESİŞMEZ", () => {
    const businessKeys = new Set(roleKeysOf(BUSINESS_ROLE_GROUPS));
    const overlap = roleKeysOf(CONSULTANT_ROLE_GROUPS).filter((key) => businessKeys.has(key));
    expect(overlap).toEqual([]);
  });
});

describe("yardımcılar", () => {
  it("roleLabelOf bilinen anahtarın etiketini döner", () => {
    expect(roleLabelOf(CONSULTANT_ROLE_GROUPS, "Healthcare_Doctor")).toBe("Doktor");
    expect(roleLabelOf(BUSINESS_ROLE_GROUPS, "Business_Barber")).toBe("Berber");
  });

  it("roleLabelOf bilinmeyen/boş anahtarda null döner", () => {
    expect(roleLabelOf(BUSINESS_ROLE_GROUPS, "Yok_Boyle")).toBeNull();
    expect(roleLabelOf(BUSINESS_ROLE_GROUPS, null)).toBeNull();
    expect(roleLabelOf(BUSINESS_ROLE_GROUPS, undefined)).toBeNull();
  });

  it("roleKeysForGroup 'all' için tüm anahtarları döner", () => {
    expect(roleKeysForGroup(BUSINESS_ROLE_GROUPS, "all")).toEqual(roleKeysOf(BUSINESS_ROLE_GROUPS));
  });

  it("roleKeysForGroup bilinmeyen grup için boş dizi döner", () => {
    expect(roleKeysForGroup(BUSINESS_ROLE_GROUPS, "yok")).toEqual([]);
  });

  it("roleKeysForGroup tek grubun anahtarlarını döner", () => {
    expect(roleKeysForGroup(BUSINESS_ROLE_GROUPS, "cocuk-aile")).toEqual([
      "Business_ChildrenFamily",
    ]);
  });
});

describe("Şehir Elçisi rolü", () => {
  it("canlıdaki anahtarla birebir aynıdır", () => {
    // Yazım hatası sayfayı sessizce boşaltır (sorgu 0 satır döner, hata yok).
    expect(CITY_AMBASSADOR_ROLE_KEY).toBe("User_CityAmbassador");
  });

  it("iki liste taksonomisinin hiçbirinde YER ALMAZ", () => {
    expect(roleKeysOf(BUSINESS_ROLE_GROUPS)).not.toContain(CITY_AMBASSADOR_ROLE_KEY);
    expect(roleKeysOf(CONSULTANT_ROLE_GROUPS)).not.toContain(CITY_AMBASSADOR_ROLE_KEY);
  });
});
