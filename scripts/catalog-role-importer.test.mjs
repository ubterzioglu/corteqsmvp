import { describe, expect, it } from "vitest";

import {
  buildImportRecord,
  parseCsv,
  parseDelimitedLine,
  resolveRoleConfig,
} from "./catalog-role-importer.mjs";

const roleMap = {
  roles: {
    Healthcare_Doctor: {
      label: "Doktor",
      itemType: "advisor",
      categorySlug: "advisor-healthcare-doctor",
      categoryName: "Doctor",
      titleColumns: ["isim", "soyisim"],
      serviceColumns: ["uzmanlik"],
      defaultLanguages: ["tr", "de"],
    },
  },
  commonColumns: {
    title: ["name"],
    phone: ["telefon"],
    email: ["email"],
    website: ["website"],
    description: ["aciklama"],
    services: ["uzmanlik"],
    city: ["city"],
    country: ["country"],
    address: ["address"],
  },
};

describe("catalog-role-importer", () => {
  it("parses semicolon CSV rows with quoted delimiters", () => {
    expect(parseDelimitedLine('isim;soyisim;uzmanlik\n'.trim())).toEqual(["isim", "soyisim", "uzmanlik"]);
    const rows = parseCsv('isim;soyisim;uzmanlik\n"Ali";"Veli";"Genel Tıp, Dahiliye"');
    expect(rows[0].values).toMatchObject({
      isim: "Ali",
      soyisim: "Veli",
      uzmanlik: "Genel Tıp, Dahiliye",
    });
  });

  it("resolves configured roles and rejects unmapped roles", () => {
    expect(resolveRoleConfig(roleMap, "Healthcare_Doctor")).toMatchObject({
      itemType: "advisor",
      roleKey: "Healthcare_Doctor",
    });
    expect(() => resolveRoleConfig(roleMap, "User_Standard")).toThrow(/role map/);
  });

  it("builds a claimable catalog import record from mapped columns", () => {
    const [row] = parseCsv(
      "isim;soyisim;telefon;website;uzmanlik\nArkin;Kara;+49 231 818 687;hausarztpraxis-arkinkara.de;Genel Tıp / Aile Hekimliği",
    );
    const record = buildImportRecord(row, resolveRoleConfig(roleMap, "Healthcare_Doctor"), roleMap, {
      sourceType: "csv.test",
      defaults: { city: "Dortmund", country: "DE" },
    });

    expect(record).toMatchObject({
      title: "Arkin Kara",
      itemType: "advisor",
      roleKey: "Healthcare_Doctor",
      slug: "dortmund-doktor-arkin-kara",
      externalId: "https-hausarztpraxis-arkinkara-de",
      location: { city: "Dortmund", country_code: "DE" },
      attributes: {
        platform_role_key: "Healthcare_Doctor",
        platform_role_label: "Doktor",
      },
    });
    expect(record.contacts.some((contact) => contact.contact_type === "website")).toBe(true);
    expect(record.services).toEqual(["Genel Tıp / Aile Hekimliği"]);
  });
});
