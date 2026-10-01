import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { buildAdminMenuDocuments, classifyDocumentationPath, findSource } from "./sources.mjs";

describe("documentation knowledge-source classification", () => {
  it("exposes guides to members, keeps other docs admin-only, and skips blog exports", () => {
    expect(classifyDocumentationPath("docs/guides/claim.html")).toBe("member");
    expect(classifyDocumentationPath("docs/plans/internal.md")).toBe("admin");
    expect(classifyDocumentationPath("docs/exports/blog-md/article.md")).toBeNull();
  });
});

describe("admin-menu knowledge source", () => {
  const catalog = {
    items: [
      {
        id: "catalog-database",
        number: "2",
        label: "Kayıt Veritabanı",
        groupLabel: "Üyeler ve Dizin",
        parentId: null,
        to: "/admin/data",
        href: null,
        description: "Tüm katalog ve profil kayıtları.",
        aliases: ["kayıt", "Kayıt Veritabanı", "üyeler"],
        isExternal: false,
        isInactive: false,
      },
      {
        id: "social-links",
        number: "29",
        label: "Sosyal Link Profilleri",
        groupLabel: "Üyeler ve Dizin",
        parentId: null,
        to: null,
        href: null,
        description: null,
        aliases: [],
        isExternal: false,
        isInactive: false,
      },
      {
        id: "consultant",
        number: "29.1",
        label: "Consultant",
        groupLabel: "Üyeler ve Dizin",
        parentId: "social-links",
        to: "/admin/social/consultant",
        href: null,
        description: null,
        aliases: [],
        isExternal: false,
        isInactive: false,
      },
      {
        id: "engine",
        number: "69",
        label: "Engine",
        groupLabel: "Harici Araçlar",
        parentId: null,
        to: null,
        href: "https://eng.corteqs.net",
        description: null,
        aliases: [],
        isExternal: true,
        isInactive: false,
      },
      {
        id: "roles-draft",
        number: "73",
        label: "Roller Taslak",
        groupLabel: "Sistem",
        parentId: null,
        to: "/admin/roller-taslak",
        // Hem iç yol hem dış bağlantı varsa `to` kazanır (sözleşme mutasyonla sabit).
        href: "https://example.com/draft",
        description: null,
        aliases: [],
        isExternal: false,
        isInactive: true,
      },
      { id: "broken", number: "99", label: null, groupLabel: "Sistem" },
    ],
  };

  const documents = buildAdminMenuDocuments(catalog);
  const byId = new Map(documents.map((document) => [document.externalId, document]));

  it("produces exactly one document per valid item and drops invalid ones", () => {
    expect(documents).toHaveLength(5);
    expect(byId.has("broken")).toBe(false);
    expect(documents.map((document) => document.externalId)).toEqual([
      "catalog-database",
      "social-links",
      "consultant",
      "engine",
      "roles-draft",
    ]);
  });

  it("carries the menu position, group, path, description and aliases users would type", () => {
    const document = byId.get("catalog-database");
    expect(document.title).toBe("Kayıt Veritabanı");
    expect(document.url).toBe("/admin/data");
    expect(document.text).toContain("yönetici sol menüsünde 2. sırada");
    expect(document.text).toContain('"Üyeler ve Dizin" grubunda');
    expect(document.text).toContain("Sayfa yolu: /admin/data");
    expect(document.text).toContain("Açıklama: Tüm katalog ve profil kayıtları.");
    expect(document.text).toContain("Diğer adlar: kayıt, üyeler");
    // Etiket zaten cümlede — diğer adlarda tekrarlanmaz.
    expect(document.text).not.toContain("Diğer adlar: kayıt, Kayıt Veritabanı");
  });

  it("links a submenu item to its parent and lists children on the parent", () => {
    expect(byId.get("consultant").text).toContain("Üst menü öğesi: 29. Sosyal Link Profilleri.");
    expect(byId.get("social-links").text).toContain("Bu öğe bir alt menü açar: 29.1. Consultant.");
    expect(byId.get("social-links").url).toBeNull();
  });

  it("uses href for external tools and marks them as leaving the site", () => {
    const document = byId.get("engine");
    expect(document.url).toBe("https://eng.corteqs.net");
    expect(document.text).toContain("Dış bağlantı (siteden ayrılır): https://eng.corteqs.net");
  });

  it("flags inactive draft pages so the bot can say they are not in use", () => {
    expect(byId.get("roles-draft").text).toContain("pasif (taslak)");
    expect(byId.get("catalog-database").text).not.toContain("pasif (taslak)");
    // İç yol dış bağlantıdan önce gelir.
    expect(byId.get("roles-draft").url).toBe("/admin/roller-taslak");
  });

  it("returns an empty list for a missing or malformed catalog", () => {
    expect(buildAdminMenuDocuments(null)).toEqual([]);
    expect(buildAdminMenuDocuments({})).toEqual([]);
    expect(buildAdminMenuDocuments({ items: "nope" })).toEqual([]);
  });

  it("is registered as an admin-only source", () => {
    const source = findSource("admin-menu");
    expect(source).not.toBeNull();
    expect(source.audience).toBe("admin");
    expect(source.label).toBe("Yönetici menüsü");
  });

  it("converts every item of the generated catalog file into a document", async () => {
    const raw = await readFile("docs/agent/admin-menu.json", "utf8");
    const generated = JSON.parse(raw);
    const built = buildAdminMenuDocuments(generated);

    expect(built.length).toBe(generated.items.length);
    for (const item of generated.items) {
      const document = built.find((entry) => entry.externalId === item.id);
      expect(document, `belge yok: ${item.id}`).toBeDefined();
      expect(document.text).toContain(`menüsünde ${item.number}. sırada`);
      expect(document.url).toBe(item.to ?? item.href ?? null);
    }
  });
});
