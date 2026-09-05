// Canlı font + CSP tanısı (salt okuma).
//
// Şüphe: index.html fontları `media="print" onload="this.media='all'"` hilesiyle yüklüyor.
// CSP script-src'te 'unsafe-inline' YOK (bilinçli, CLAUDE.md "Değişmez sözleşmeler" md.3),
// bu yüzden tarayıcı inline onload'ı ÇALIŞTIRMIYOR → stylesheet media="print" olarak
// kalıyor olabilir → özel fontlar (Inter, Space Grotesk) hiç uygulanmıyor olabilir.
//
//   $env:LIVE_SCAN=1; npx playwright test e2e/canli-font-csp.spec.ts

import { expect, test } from "@playwright/test";

const RUN = process.env.LIVE_SCAN === "1";
const BASE = process.env.LIVE_SCAN_BASE_URL ?? "https://corteqs.net";

test.describe("canlı font/CSP tanısı", () => {
  test.skip(!RUN, "LIVE_SCAN=1 ile açıkça çalıştırılır");

  test("Google Fonts stylesheet'i gerçekten uygulanıyor mu", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" && text.includes("Content Security Policy")) {
        cspViolations.push(text.slice(0, 200));
      }
    });

    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2000);

    const report = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((el) => ({
        href: (el as HTMLLinkElement).href,
        media: (el as HTMLLinkElement).media,
        hasOnload: el.hasAttribute("onload"),
      }));
      const heading = document.querySelector("h1, h2, .font-display") ?? document.body;
      const family = getComputedStyle(heading).fontFamily;
      const bodyFamily = getComputedStyle(document.body).fontFamily;
      const loaded = Array.from((document as unknown as { fonts: { values: () => Iterable<FontFace> } }).fonts.values())
        .map((f) => `${f.family}:${f.status}`);
      return { links, family, bodyFamily, loaded: loaded.slice(0, 12) };
    });

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ report, cspViolations }, null, 1));

    expect(report.links.length).toBeGreaterThan(0);
  });
});
