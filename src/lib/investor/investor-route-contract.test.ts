// SÖZLEŞME TESTİ — yatırımcı sayfasının yerleşim ve görünürlük kuralları.
// Sayfa: siteden bağımsız (PublicLayout DIŞINDA), noindex, sitemap/robots'ta YOK.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";
import { INVESTOR_PATH, isInvestorPath } from "./investor-route";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

describe("yatırımcı rotası", () => {
  const app = read("src/App.tsx");

  it("yol sabittir", () => {
    expect(INVESTOR_PATH).toBe("/yatirimci");
    expect(isInvestorPath("/yatirimci")).toBe(true);
    expect(isInvestorPath("/yatirimcilar")).toBe(false);
    // Alt yol rota ile eşleşmez (NotFound çizilir) → yüzen bileşenler de gizlenmemeli.
    expect(isInvestorPath("/yatirimci/x")).toBe(false);
  });

  it("PublicLayout DIŞINDA tanımlıdır (sitenin üst/alt bilgisi çizilmez)", () => {
    const publicBlock = sliceBetween(app, "<Route element={<PublicLayout />}>", "{LEGACY_REDIRECTS.map", "PublicLayout");
    expect(publicBlock).not.toContain("InvestorPage");
    // Redirect'lerle adminRoutes arası: üst düzey, layout sarmalayıcısı olmayan bölge.
    const topLevel = sliceBetween(app, "{LEGACY_REDIRECTS.map", "{adminRoutes}", "layout dışı");
    expect(topLevel).toContain("<Route path={INVESTOR_PATH} element={<InvestorPage />} />");
    expect(topLevel).not.toMatch(/<Route element=/);
  });

  it("yüzen bileşenler yatırımcı yolunda çizilmez", () => {
    const widgets = sliceBetween(app, "const FloatingWidgets", "const App = ()", "FloatingWidgets");
    expect(widgets).toContain("isInvestorPath(pathname)");
    expect(app).not.toMatch(/<\/Suspense>\s*<ScrollTopButton \/>/);
  });

  it("sayfa noindex, nofollow ister", () => {
    expect(read("src/pages/investor/InvestorPage.tsx")).toContain('robots: "noindex, nofollow"');
  });

  it("sitemap üreticisinde ve robots.txt'te yolu ifşa edilmez", () => {
    expect(read("scripts/generate-sitemap.mjs")).not.toContain("yatirimci");
    if (existsSync(path.join(ROOT, "public/robots.txt"))) {
      expect(read("public/robots.txt")).not.toContain("yatirimci");
    }
  });

  it("parola doğrulayıcısı çalışma anı yapılandırmasına iki yoldan da yazılır", () => {
    const entry = read("docker-entrypoint-env.sh");
    // Ham env değeri JS dizgesine DOĞRUDAN gömülmez — önce izinli karakterlere süzülür.
    expect(entry).toContain('INVESTOR_PASS_HASH: "${investor_hash}"');
    expect(entry).not.toContain('INVESTOR_PASS_HASH: "${INVESTOR_PASS_HASH');
    expect(entry).toContain("*[!0-9a-f:pbkd]*) investor_hash=\"\"");
    expect(read("server.mjs")).toContain("INVESTOR_PASS_HASH: process.env.INVESTOR_PASS_HASH");
  });
});
