/**
 * Hero CTA kataloğunun sözleşme testi (L5).
 *
 * Katalog rota yollarını elle taşır; `App.tsx`'ten kopan bir hedef build'i ve
 * diğer testleri patlatmadan ziyaretçiyi 404'e götürür. Bu test hedefleri
 * `App.tsx`'in YORUMLARDAN ARINDIRILMIŞ rota tablosuna karşı doğrular — yorumlanmış
 * bir `<Route>` satırı rotayı "var" göstermemeli.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PUBLIC_WHATSAPP_COMMUNITY } from "@/lib/contact-links";
import { stripSourceComments } from "@/test/strip-source-comments";

import { HERO_CAMPAIGN_CARDS, HERO_PRIMARY_CTA, HERO_SECONDARY_BUTTONS } from "./hero-cta-data";

const appSource = stripSourceComments(readFileSync("src/App.tsx", "utf8"));
const pathOf = (to: string) => to.split("?")[0];
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const routeExists = (to: string) => new RegExp(`<Route\\s+path="${escapeRegExp(pathOf(to))}"`).test(appSource);

describe("hero CTA kataloğu", () => {
  it("uygulama içi her hedef App.tsx'te tanımlı (yorum olmayan) bir rotadır", () => {
    const targets = [
      HERO_PRIMARY_CTA.to,
      ...HERO_SECONDARY_BUTTONS.flatMap((button) => (button.to ? [button.to] : [])),
      ...HERO_CAMPAIGN_CARDS.map((card) => card.to),
    ];

    expect(targets.length).toBeGreaterThanOrEqual(6);
    for (const target of targets) {
      expect(routeExists(target), `${target} App.tsx'te yok (ya da yalnız yorumda)`).toBe(true);
    }
  });

  it("yorum ayıklayıcı yorumlanmış rotayı yok sayar", () => {
    expect(stripSourceComments('// <Route path="/x" element={<X />} />')).not.toContain('path="/x"');
    expect(stripSourceComments('{/* <Route path="/y" /> */}')).not.toContain('path="/y"');
    expect(stripSourceComments('/* <Route path="/z" /> */')).not.toContain('path="/z"');
    expect(stripSourceComments('<Route path="/ok" />')).toContain('path="/ok"');
  });

  it("Lovable'daki olmayan adresler (/founders-1000 vb.) geri girmez", () => {
    const all = JSON.stringify([HERO_PRIMARY_CTA, HERO_SECONDARY_BUTTONS, HERO_CAMPAIGN_CARDS]);
    expect(all).not.toContain("/founders-1000");
    expect(all).not.toContain("/blog-contest");
    expect(all).not.toContain("/vlogger-contest");
  });

  it("WhatsApp düğmesi depodaki tek topluluk bağlantısını kullanır", () => {
    const whatsapp = HERO_SECONDARY_BUTTONS.find((button) => button.icon === "whatsapp");
    expect(whatsapp?.href).toBe(PUBLIC_WHATSAPP_COMMUNITY);
    expect(whatsapp?.to).toBeUndefined();
  });

  it("her düğme ya `to` ya `href` taşır, ikisini birden değil", () => {
    for (const button of HERO_SECONDARY_BUTTONS) {
      expect(Boolean(button.to) !== Boolean(button.href), button.label).toBe(true);
    }
  });

  // Ödül tutarı/son tarih/gelir vaadi kesinleşmemiş bilgidir (yarışma sayfası DEMO).
  it("kartlarda ödül tutarı, tarih veya gelir vaadi yok", () => {
    for (const card of HERO_CAMPAIGN_CARDS) {
      const text = `${card.title} ${card.description}`;
      expect(text).not.toMatch(/[$€]|\d{4}|gelir|ödül/i);
    }
  });
});
