// Canlı sitede revizyon isteklerinin izini süren tanı taraması (salt okuma).
//
// Neden ayrı bir spec: 2026-09-05 triyajında beş revizyon maddesi "ekran görüntüsü ya da
// canlı sitede birlikte gezinme gerekli" diye açık kaldı. Bu tarama, kod aramasının
// bulamadığı metinleri ÇALIŞAN sayfada arar (SPA olduğu için ham HTML yetmez).
//
// Varsayılan olarak ATLANIR: yalnız LIVE_SCAN=1 ile ve canlı adrese karşı çalışır.
//   $env:LIVE_SCAN=1; npx playwright test e2e/canli-revizyon-tarama.spec.ts
// Hiçbir şey yazmaz, hiçbir form göndermez — yalnız gezer, metin arar, ekran görüntüsü alır.

import { expect, test } from "@playwright/test";

const RUN = process.env.LIVE_SCAN === "1";
const BASE = process.env.LIVE_SCAN_BASE_URL ?? "https://corteqs.net";

/** Revizyon c7e32bfc: "RADAR — Experimental kalmış" (kodda karşılığı bulunamadı). */
const LEAK_PATTERNS = [
  "Experimental",
  "experimental",
  "Lorem ipsum",
  "TODO",
  "undefined",
  "NaN",
  "[object Object]",
];

/** Kamuya açık, oturum istemeyen sayfalar. */
const PUBLIC_ROUTES = ["/", "/radar", "/cadde", "/directory", "/tools", "/anket", "/lansman"];

test.describe("canlı revizyon taraması", () => {
  test.skip(!RUN, "LIVE_SCAN=1 ile açıkça çalıştırılır");
  test.describe.configure({ mode: "serial" });

  for (const route of PUBLIC_ROUTES) {
    test(`sızıntı metni taraması: ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
      });

      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(1500);

      const bodyText = (await page.locator("body").innerText().catch(() => "")) ?? "";
      const hits = LEAK_PATTERNS.filter((pattern) => bodyText.includes(pattern));

      const slug = route === "/" ? "anasayfa" : route.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: `test-results/canli-${slug}.png`, fullPage: true });

      // Bulguları rapora yaz — test DÜŞMEZ, çünkü bu bir tanı taraması, bir kapı değil.
      console.log(
        JSON.stringify({ route, leaks: hits, consoleErrors: consoleErrors.slice(0, 5) }, null, 1),
      );

      expect(bodyText.length).toBeGreaterThan(0);
    });
  }
});
