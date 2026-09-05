// Sözleşme testi — index.html CSP uyumu (05.09.2026).
//
// Neden var: `index.html` fontları `media="print" onload="this.media='all'"` hilesiyle
// yüklüyordu. CSP `script-src`'inde 'unsafe-inline' YOK (bilinçli karar, CLAUDE.md
// "Değişmez sözleşmeler" md.3), bu yüzden tarayıcı inline onload'ı hiç çalıştırmadı ve
// stylesheet `media="print"` olarak kaldı — Inter/Space Grotesk canlıda HİÇ uygulanmadı.
//
// Bu sınıfın tehlikesi sessiz olması: build geçer, test geçer, sayfa açılır, yalnız
// yazı tipi yanlıştır. Konsolda CSP ihlali görünür ama kimse bakmaz. Bu test o sınıfı
// derleme zamanına taşır.

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const RAW_INDEX_HTML = readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");

/**
 * HTML yorumları taramadan ÇIKARILIR. Bu dosyanın kendi uyarı yorumları
 * (`onload="this.media='all'"` hilesini ve "inline <script> EKLEME" cümlesini anlatan
 * satırlar) tarayıcıya hiç ulaşmaz; yorumu taramak yanlış pozitif üretir ve testi
 * susturmak için uyarı metnini silmek zorunda bırakırdı — yani testin kendisi belgeyi
 * bozardı.
 */
const INDEX_HTML = RAW_INDEX_HTML.replace(/<!--[\s\S]*?-->/g, "");

/** CSP script-src tarafından engellenen inline olay işleyicileri. */
const INLINE_EVENT_HANDLER = /\son(load|click|error|change|submit|focus|blur|mouseover)\s*=/gi;

describe("index.html CSP sözleşmesi", () => {
  it("hiçbir etikette inline olay işleyicisi yok", () => {
    const hits = Array.from(INDEX_HTML.matchAll(INLINE_EVENT_HANDLER)).map((m) => m[0].trim());
    expect(hits).toEqual([]);
  });

  it("font stylesheet'i koşulsuz uygulanır (media=print ile parkta bırakılmaz)", () => {
    const fontLinks = Array.from(
      INDEX_HTML.matchAll(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi),
    ).map((m) => m[0]);

    expect(fontLinks.length).toBeGreaterThan(0);

    const stylesheetLinks = fontLinks.filter((tag) => /rel=["']stylesheet["']/i.test(tag));
    expect(stylesheetLinks.length).toBeGreaterThan(0);

    // Uygulanan stylesheet'in hiçbiri print'e park edilmiş olmamalı.
    for (const tag of stylesheetLinks) {
      expect(tag).not.toMatch(/media=["']print["']/i);
    }
  });

  it("inline <script> yalnız JSON-LD olabilir (çalıştırılabilir inline script yok)", () => {
    const inlineScripts = Array.from(INDEX_HTML.matchAll(/<script(?![^>]*\ssrc=)[^>]*>/gi)).map(
      (m) => m[0],
    );

    for (const tag of inlineScripts) {
      expect(tag).toMatch(/type=["']application\/ld\+json["']/i);
    }
  });
});
