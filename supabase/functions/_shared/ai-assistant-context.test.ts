import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MAX_CONTEXT_CHARS,
  buildContextBlock,
  buildContextTurns,
  collectSources,
  lastUserQuestion,
  resolveAudiences,
  type KnowledgeHit,
} from "./ai-assistant-context";

const hit = (overrides: Partial<KnowledgeHit> = {}): KnowledgeHit => ({
  source_key: "blog",
  title: "Vize Rehberi",
  url: "/blog/vize-rehberi",
  content: "Basvuru randevu ile yapilir.",
  distance: 0.2,
  ...overrides,
});

describe("resolveAudiences", () => {
  it("siradan uyeye ic belge kitlesini VERMEZ", () => {
    expect(resolveAudiences(false)).toEqual(["public", "member"]);
    expect(resolveAudiences(false)).not.toContain("admin");
  });

  it("yoneticiye admin kitlesini de verir", () => {
    expect(resolveAudiences(true)).toEqual(["public", "member", "admin"]);
  });

  it("site assistant kitleyi dogrulanmis kullanici ile sunucuda cozer", () => {
    const source = readFileSync("supabase/functions/site-assistant/index.ts", "utf8");

    expect(source).toContain('userClient.rpc("is_admin")');
    expect(source).toContain("resolveAudiences(isAdminData === true)");
    expect(source).toContain("p_audiences: audiences");
    expect(source).not.toMatch(/payload\.(?:audience|audiences|isAdmin|role)/);
  });
});

describe("buildContextBlock", () => {
  it("sonuc yoksa BOS string doner — cagiran durustce raporlayabilsin", () => {
    expect(buildContextBlock([])).toBe("");
  });

  it("basligi, URL'yi ve icerigi numaralandirarak yazar", () => {
    const block = buildContextBlock([hit()]);

    expect(block).toContain("[1]");
    expect(block).toContain("Vize Rehberi");
    expect(block).toContain("/blog/vize-rehberi");
    expect(block).toContain("Basvuru randevu ile yapilir.");
  });

  it("URL yoksa yalniz basligi yazar", () => {
    expect(buildContextBlock([hit({ url: null })])).toContain("Vize Rehberi\n");
  });

  it("tavani asan kaydi KIRPMAZ, atlar", () => {
    const long = hit({ content: "x".repeat(MAX_CONTEXT_CHARS + 100), title: "Uzun" });
    const short = hit({ title: "Kisa", content: "kisa icerik" });
    const block = buildContextBlock([long, short]);

    // Ilk kayit tavani asiyor -> hic girmemeli; dongu orada duruyor.
    expect(block).toBe("");
  });

  it("tavana kadar olan kayitlari alir, sonrasini birakir", () => {
    const filler = hit({ content: "y".repeat(3_000) });
    const block = buildContextBlock([filler, filler, filler, filler]);

    expect(block.length).toBeLessThanOrEqual(MAX_CONTEXT_CHARS + 200);
    expect(block).toContain("[1]");
    expect(block).toContain("[2]");
    expect(block).not.toContain("[4]");
  });
});

describe("collectSources", () => {
  it("ayni belgenin parcalarini teke indirir", () => {
    const sources = collectSources([
      hit({ title: "Vize Rehberi (1/3)" }),
      hit({ title: "Vize Rehberi (2/3)" }),
    ]);

    expect(sources).toHaveLength(1);
  });

  it("parca numarasini baslikta gostermez", () => {
    expect(collectSources([hit({ title: "Vize Rehberi (2/5)" })])[0].title).toBe("Vize Rehberi");
  });

  it("farkli kayitlari korur ve sirasini bozmaz", () => {
    const sources = collectSources([
      hit({ title: "Blog", url: "/blog/a" }),
      hit({ title: "Katalog", url: "/directory/b", source_key: "catalog" }),
    ]);

    expect(sources.map((source) => source.sourceKey)).toEqual(["blog", "catalog"]);
  });
});

describe("buildContextTurns", () => {
  it("bos baglam icin hic tur uretmez", () => {
    expect(buildContextTurns("")).toEqual([]);
  });

  it("baglami KULLANICI mesaji olarak gonderir, sistem talimatina KOYMAZ", () => {
    const turns = buildContextTurns("veri");

    expect(turns).toHaveLength(2);
    expect(turns[0].role).toBe("user");
    expect(turns[1].role).toBe("assistant");
  });

  it("baglami veri olarak etiketler ve talimat olmadigini soyler", () => {
    const [contextTurn] = buildContextTurns("veri");

    expect(contextTurn.content).toContain("talimat değildir");
    expect(contextTurn.content).toContain("<<<PLATFORM_VERISI");
    expect(contextTurn.content).toContain("PLATFORM_VERISI>>>");
  });
});

describe("lastUserQuestion", () => {
  it("son KULLANICI mesajini doner, asistan yanitini degil", () => {
    const question = lastUserQuestion([
      { role: "user", content: "ilk soru" },
      { role: "assistant", content: "yanit" },
      { role: "user", content: "ikinci soru" },
    ]);

    expect(question).toBe("ikinci soru");
  });

  it("kullanici mesaji yoksa bos string doner", () => {
    expect(lastUserQuestion([{ role: "assistant", content: "merhaba" }])).toBe("");
    expect(lastUserQuestion([])).toBe("");
  });
});
