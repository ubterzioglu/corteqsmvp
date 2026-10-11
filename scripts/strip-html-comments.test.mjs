// scripts/strip-html-comments.mjs testleri.
//
// ASIL DEĞER: derlenen index.html'e geliştirici yorumu sızmaması (GEO denetimi
// 2026-10-11: emir kipindeki yorumlar "prompt injection" olarak işaretlendi) ve
// bunu yaparken JSON-LD / betik içeriğinin bozulmaması.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { stripHtmlComments, stripHtmlCommentsPlugin } from "./strip-html-comments.mjs";

describe("stripHtmlComments", () => {
  it("tek ve çok satırlı yorumları siler", () => {
    const html = "<head>\n  <!-- tek -->\n  <meta a>\n  <!-- çok\n satırlı -->\n</head>";
    const out = stripHtmlComments(html);
    expect(out).not.toContain("<!--");
    expect(out).toContain("<meta a>");
  });

  it("script ve style bloklarının içine dokunmaz", () => {
    const html = [
      '<script type="application/ld+json">{"text":"<!-- json içi -->"}</script>',
      "<style>/* <!-- css --> */</style>",
      "<!-- silinecek -->",
    ].join("\n");
    const out = stripHtmlComments(html);
    expect(out).toContain('{"text":"<!-- json içi -->"}');
    expect(out).toContain("/* <!-- css --> */");
    expect(out).not.toContain("silinecek");
  });

  it("içinde <script> metni geçen yorumu da bütünüyle siler", () => {
    // index.html'de "Buraya inline <script> EKLEME" yorumu tam olarak böyle.
    const html = '<!-- inline <script> EKLEME -->\n<script src="/a.js"></script>';
    expect(stripHtmlComments(html)).toBe('\n<script src="/a.js"></script>');
  });

  it("gerçek index.html'de yorum bırakmaz, JSON-LD ve kök öğe korunur", () => {
    const source = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(source).toContain("<!--"); // kaynakta uyarılar DURUR

    const out = stripHtmlComments(source);
    const withoutScripts = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    expect(withoutScripts).not.toContain("<!--");
    expect(out).toContain('<div id="root">');

    const ldBlocks = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(ldBlocks.length).toBeGreaterThan(0);
    for (const [, json] of ldBlocks) {
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });

  it("eklenti yalnız build'de çalışır", () => {
    const plugin = stripHtmlCommentsPlugin();
    expect(plugin.apply).toBe("build");
    expect(plugin.transformIndexHtml("<p><!-- x -->y</p>")).toBe("<p>y</p>");
  });
});
