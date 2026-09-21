import { describe, expect, it } from "vitest";

import {
  collapseWhitespace,
  decodeHtmlEntities,
  htmlToPlainText,
  markdownToPlainText,
} from "./text-extract.mjs";

describe("markdownToPlainText", () => {
  it("baslik metnini korur, diyezi atar", () => {
    expect(markdownToPlainText("## Vize Rehberi")).toBe("Vize Rehberi");
  });

  it("kod bloklarini ICERIGIYLE birlikte atar", () => {
    // Ic belgeler SQL ve baglanti dizeleri iceriyor — bota gitmemeli.
    const markdown = "Giris metni.\n\n```sql\nselect * from secrets;\n```\n\nSon metin.";
    const result = markdownToPlainText(markdown);

    expect(result).toContain("Giris metni.");
    expect(result).toContain("Son metin.");
    expect(result).not.toContain("secrets");
    expect(result).not.toContain("select");
  });

  it("baglanti etiketini tutar, hedefi atar", () => {
    const result = markdownToPlainText("Detay icin [basvuru sayfasi](https://ornek.test/x?a=1).");
    expect(result).toBe("Detay icin basvuru sayfasi.");
  });

  it("resimleri tamamen atar", () => {
    const result = markdownToPlainText("![kapak gorseli](https://ornek.test/a.png)\n\nMetin.");
    expect(result).toBe("Metin.");
  });

  it("YAML on maddesini yalniz dosya basindayken atar", () => {
    const result = markdownToPlainText("---\ntitle: Gizli\n---\nGovde metni.");
    expect(result).toBe("Govde metni.");
    expect(result).not.toContain("Gizli");
  });

  it("kalin ve italik isaretlerini temizler, metni birakir", () => {
    expect(markdownToPlainText("**onemli** ve *vurgulu* bilgi")).toBe("onemli ve vurgulu bilgi");
  });

  it("liste maddelerini korur", () => {
    const result = markdownToPlainText("- pasaport\n- ikametgah\n- sigorta");
    expect(result).toContain("pasaport");
    expect(result).toContain("ikametgah");
    expect(result).toContain("sigorta");
  });

  it("tablo hucrelerinin metnini korur, ayrac satirini atar", () => {
    const result = markdownToPlainText("| Ulke | Sure |\n|---|---|\n| Almanya | 90 gun |");
    expect(result).toContain("Almanya");
    expect(result).toContain("90 gun");
    expect(result).not.toContain("---");
  });

  it("Turkce karakterleri bozmaz", () => {
    const result = markdownToPlainText("## Öğrenci Vizesi\n\nİstanbul'da başvuru yapılır.");
    expect(result).toContain("Öğrenci Vizesi");
    expect(result).toContain("İstanbul'da başvuru yapılır.");
  });

  it("paragraf sinirini korur — parcalayici buna dayaniyor", () => {
    const result = markdownToPlainText("Birinci paragraf.\n\nIkinci paragraf.");
    expect(result).toBe("Birinci paragraf.\n\nIkinci paragraf.");
  });
});

describe("htmlToPlainText", () => {
  it("script ve style icerigini atar", () => {
    const html = "<p>Gorunur</p><script>var gizli='anahtar';</script><style>p{color:red}</style>";
    const result = htmlToPlainText(html);

    expect(result).toContain("Gorunur");
    expect(result).not.toContain("gizli");
    expect(result).not.toContain("color");
  });

  it("blok sonlarini paragraf sinirina cevirir", () => {
    const result = htmlToPlainText("<p>Bir</p><p>Iki</p>");
    expect(result).toBe("Bir\n\nIki");
  });

  it("HTML yorumlarini atar", () => {
    expect(htmlToPlainText("<p>A</p><!-- gizli not -->")).toBe("A");
  });
});

describe("decodeHtmlEntities", () => {
  it("adli varliklari cozer", () => {
    expect(decodeHtmlEntities("T&uuml;rkiye &amp; Almanya")).toBe("Türkiye & Almanya");
  });

  it("sayisal ve onaltilik varliklari cozer", () => {
    expect(decodeHtmlEntities("&#252;")).toBe("ü");
    expect(decodeHtmlEntities("&#xFC;")).toBe("ü");
  });

  it("taninmayan varligi oldugu gibi birakir", () => {
    expect(decodeHtmlEntities("&bilinmeyen;")).toBe("&bilinmeyen;");
  });
});

describe("collapseWhitespace", () => {
  it("paragraf sinirini korur, fazlasini kirpar", () => {
    expect(collapseWhitespace("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("satir ici fazla bosluklari tek bosluga indirir", () => {
    expect(collapseWhitespace("a     b")).toBe("a b");
  });

  it("kirilmaz bosluk karakterini normal bosluga cevirir", () => {
    expect(collapseWhitespace("a b")).toBe("a b");
  });
});
