import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  EXCLUDED_DOCUMENTATION_PREFIXES,
  MEMBER_DOCUMENTATION_PATHS,
  buildAdminMenuDocuments,
  classifyDocumentationPath,
  findSource,
  isExcludedByContent,
} from "./sources.mjs";

describe("documentation knowledge-source classification", () => {
  it("guides/ bir kitle sınırı DEĞİLDİR: listede olmayan rehber admin kalır", () => {
    // 2026-11-07: eski kural guides/** altındaki her dosyayı üyeye veriyordu.
    expect(classifyDocumentationPath("docs/guides/claim-sistemi-rehberi.html")).toBe("admin");
    expect(classifyDocumentationPath("docs/guides/corteqs_clean_code_prompt.md")).toBe("admin");
    expect(classifyDocumentationPath("docs/guides/yeni-taslak.md")).toBe("admin");
  });

  it("yalnız açık izin listesindeki rehber üyeye çıkar", () => {
    expect(classifyDocumentationPath("docs/guides/belge-yukleme.md")).toBe("member");
    expect(classifyDocumentationPath("docs\\guides\\belge-yukleme.md")).toBe("member");
  });

  it("diğer dokümanlar admin kalır", () => {
    expect(classifyDocumentationPath("docs/plans/internal.md")).toBe("admin");
    expect(classifyDocumentationPath("docs/ARCHITECTURE.md")).toBe("admin");
  });

  it.each([
    "docs/exports/blog-md/article.md",
    "docs/archive/2026-09-30-kapanan-is-dokumanlari/eski.md",
    "docs/reference/global-network-bridge/README.md",
    "docs/history/SONDURUM.md",
    "docs/commandcenter/todo.md",
  ])("%s bota hiç girmez", (path) => {
    expect(classifyDocumentationPath(path)).toBeNull();
  });

  it("yol biçimi tekilleştirilir: ./ öneki, // ve büyük harfli dizin dışlamayı kaçırmaz", () => {
    expect(classifyDocumentationPath("./docs/guides/belge-yukleme.md")).toBe("member");
    expect(classifyDocumentationPath("docs//archive/x.md")).toBeNull();
    expect(classifyDocumentationPath("./docs/archive/x.md")).toBeNull();
    expect(classifyDocumentationPath("docs/Archive/x.md")).toBeNull();
  });

  it("üye listesi TAM eşleşme ister — büyük harfli yakın yazım üyeye açılmaz", () => {
    expect(classifyDocumentationPath("docs/guides/Belge-Yukleme.md")).toBe("admin");
  });

  it("önek dizin sınırında biter: docs/archive.md ve docs/historyX/ dışlanmaz", () => {
    expect(classifyDocumentationPath("docs/archive.md")).toBe("admin");
    expect(classifyDocumentationPath("docs/historyX/not.md")).toBe("admin");
  });

  it("dışlanan önek listesi beklenen beş dizindir", () => {
    expect(EXCLUDED_DOCUMENTATION_PREFIXES).toEqual([
      "docs/exports/blog-md/",
      "docs/archive/",
      "docs/reference/",
      "docs/history/",
      "docs/commandcenter/",
    ]);
  });

  it("üye listesindeki her yol diskte var ve guides/ altında (yanlış yol sessizce düşmesin)", () => {
    expect(MEMBER_DOCUMENTATION_PATHS.size).toBeGreaterThan(0);
    for (const path of MEMBER_DOCUMENTATION_PATHS) {
      expect(path.startsWith("docs/guides/"), path).toBe(true);
      expect(existsSync(path), path).toBe(true);
    }
  });
});

describe("doküman içerik dışlaması", () => {
  it("başlıkta 'BOT BİLGİ TABANINA ... ALINMAZ' işareti olan doküman dışlanır", () => {
    const raw = "# Taslak\n\n> ⛔ **DOĞRULANMADI — ÜYELERE GÖSTERİLMEZ, BOT BİLGİ TABANINA (`ai:ingest`) ALINMAZ.**\n";
    expect(isExcludedByContent(raw)).toBe(true);
  });

  it("işaret yalnız baştaki bölümde aranır — kuralı anlatan uzun doküman dışlanmaz", () => {
    const raw = `# Plan\n\n${"metin ".repeat(400)}\nÖrnek: BOT BİLGİ TABANINA (\`ai:ingest\`) ALINMAZ.\n`;
    expect(isExcludedByContent(raw)).toBe(false);
  });

  it("frontmatter'ı `durum: yerini-aldı` olan doküman dışlanır", () => {
    expect(
      isExcludedByContent("---\ndurum: yerini-aldı\nyerini_alan: docs/kalanlar/KALANLAR.md\n---\n# Eski plan\n"),
    ).toBe(true);
    expect(isExcludedByContent("---\r\ndurum: yerini-aldi\r\n---\r\n# Eski plan\r\n")).toBe(true);
  });

  it("işaret yazım varyantlarında da yakalanır: ayrık nokta (NFD), noktasız I, küçük harf", () => {
    // Birleşen nokta (U+0307) kaçış dizisiyle YAZILMAZ: kanca onu görünmez karaktere çeviriyor.
    const dot = String.fromCharCode(0x307);
    // "I + birleşen nokta" = ayrık (NFD) yazılmış İ.
    const nfd = "# T\n\n> BOT BI" + dot + "LGI" + dot + " TABANINA (ai:ingest) ALINMAZ.\n";
    expect(isExcludedByContent(nfd)).toBe(true);
    expect(isExcludedByContent("# T\n\n> BOT BILGI TABANINA ALINMAZ\n")).toBe(true);
    expect(isExcludedByContent("# T\n\n> bot bilgi tabanına alınmaz\n")).toBe(true);
  });

  it("frontmatter varyantları: BOM, tırnak, büyük harf, satır sonu yorumu", () => {
    const bom = String.fromCharCode(0xfeff);
    expect(isExcludedByContent(`${bom}---\ndurum: yerini-aldı\n---\n# Eski\n`)).toBe(true);
    expect(isExcludedByContent('---\ndurum: "yerini-aldı"\n---\n# Eski\n')).toBe(true);
    expect(isExcludedByContent("---\ndurum: Yerini-Aldı\n---\n# Eski\n")).toBe(true);
    expect(isExcludedByContent("---\ndurum: yerini-aldı # KALANLAR'a taşındı\n---\n# Eski\n")).toBe(true);
  });

  it("aktif ya da frontmatter'sız doküman dışlanmaz", () => {
    expect(isExcludedByContent("---\ndurum: aktif\n---\n# Plan\n")).toBe(false);
    expect(isExcludedByContent("# Plan\n\ndurum: yerini-aldı (gövdede, frontmatter değil)\n")).toBe(false);
  });

  it.each(["docs/guides/etkinlik-paylasma.md", "docs/guides/reklam-verme.md"])(
    "kendini bot dışı ilan eden gerçek taslak dışlanır: %s",
    async (path) => {
      expect(isExcludedByContent(await readFile(path, "utf8"))).toBe(true);
    },
  );
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
