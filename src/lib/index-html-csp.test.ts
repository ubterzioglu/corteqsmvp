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

  it("hiçbir stylesheet print'e park edilmez (media=print hilesi yok)", () => {
    const stylesheetLinks = Array.from(
      INDEX_HTML.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi),
    ).map((m) => m[0]);

    for (const tag of stylesheetLinks) {
      expect(tag).not.toMatch(/media=["']print["']/i);
    }
  });

  // 2026-10-12: Inter / Space Grotesk artık KENDİ sunucumuzdan (@fontsource) gelir.
  // Lighthouse'ta Google Fonts CSS'i ~824 ms render-blocking ölçüldü. Fontlar JS
  // girişinden import edilir ve hash'li /assets/ dosyası olarak (immutable) iner;
  // index.html'e Google Fonts bağlantısı GERİ EKLENMEZ. (Ticari dokümanlar ve
  // yatırımcı sayfası kendi Google Fonts'unu kullanır — CSP izni o yüzden durur.)
  it("ana fontlar kendi sunucumuzdan yüklenir, index.html Google Fonts çağırmaz", () => {
    expect(INDEX_HTML).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);

    const mainTsx = readFileSync(path.resolve(process.cwd(), "src/main.tsx"), "utf8");
    expect(mainTsx).toMatch(/import ["']@fontsource-variable\/inter\/wght\.css["']/);
    for (const weight of ["500", "600", "700"]) {
      expect(mainTsx).toContain(`import "@fontsource/space-grotesk/${weight}.css"`);
    }

    // Aile adı paketin @font-face'iyle BİREBİR aynı olmalı; yoksa font iner ama
    // hiç uygulanmaz (2026-09-05'teki "canlıda font yok" sınıfının aynısı).
    const tailwind = readFileSync(path.resolve(process.cwd(), "tailwind.config.ts"), "utf8");
    expect(tailwind).toContain(`'"Inter Variable"'`);
    expect(tailwind).toContain(`'"Space Grotesk"'`);
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
