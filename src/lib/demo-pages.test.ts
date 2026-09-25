/**
 * DEMO deseni sözleşme testi.
 *
 * Bu testler METNE bakar (App.tsx rota tablosu, düğme kataloğu) çünkü kusur
 * sınıfı "derleme geçer, test yeşil kalır ama işaret canlıda yanlış yerde
 * durur" tipindedir: DEMO_ROUTES'a yazılan bir yol App.tsx'te yoksa bant
 * HİÇBİR ZAMAN çizilmez ve kimse fark etmez.
 *
 * Gevşetme — düzeltilecek olan dosyadır, iddia değil.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEMO_ROUTES, findDemoRoute, isDemoRoute } from "@/lib/demo-pages";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("demo-pages", () => {
  it("her demo rotası App.tsx'te gerçekten tanımlı", () => {
    const appSource = readSource("src/App.tsx");

    for (const route of DEMO_ROUTES) {
      expect(appSource, `${route.path} App.tsx'te yok`).toContain(`path="${route.path}"`);
    }
  });

  it("her demo kaydı etiket ve açıklama taşır", () => {
    for (const route of DEMO_ROUTES) {
      expect(route.label.trim().length).toBeGreaterThan(0);
      expect(route.note.trim().length).toBeGreaterThan(0);
    }
  });

  it("aynı yol iki kez kaydedilmemiş", () => {
    const paths = DEMO_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("sorgu dizesi ve sondaki eğik çizgi eşleşmeyi bozmaz", () => {
    expect(isDemoRoute("/campaign/vlogger")).toBe(true);
    expect(isDemoRoute("/campaign/vlogger/")).toBe(true);
    expect(isDemoRoute("/campaign/vlogger?ref=ABC")).toBe(true);
    expect(isDemoRoute("/campaign/vlogger#odul")).toBe(true);
    expect(findDemoRoute("/campaign/vlogger")?.label).toBe("Vlogger Yarışması");
  });

  it("demo olmayan yolları demo saymaz", () => {
    expect(isDemoRoute("/campaign")).toBe(false);
    expect(isDemoRoute("/")).toBe(false);
    expect(isDemoRoute("/campaign/vlogger-baska")).toBe(false);
  });

  // Rozet ile bandın AYRIŞMASINI kapatan iddia: /campaign/vlogger ve
  // /campaign/blogger demo olduğu sürece, onları listeleyen merkeze götüren
  // "Kampanya & Yarışmalar" düğmesi rozetsiz kalamaz (2026-09-25'te tekleşti).
  it("Kampanya & Yarışmalar düğmesi demo işaretli kalır", () => {
    const catalog = readSource("src/components/home-trial/action-buttons-data.ts");
    const contestsBlock = catalog.slice(
      catalog.indexOf("campaigns:"),
      catalog.indexOf("radar:"),
    );

    expect(contestsBlock).toContain('label: "Kampanya & Yarışmalar"');
    expect(catalog).not.toContain("contests:");
    expect(contestsBlock).toContain("demo: true");
  });

  it("demo bandını SiteHeader rotadan türetir (sayfaya kod eklenmez)", () => {
    const header = readSource("src/components/SiteHeader.tsx");

    expect(header).toContain("findDemoRoute");
    expect(header).toContain("<DemoBanner route={demoRoute} />");
  });
});
