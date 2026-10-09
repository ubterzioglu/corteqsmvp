// SÖZLEŞME TESTİ — yatırımcı sayfasının yerleşim ve görünürlük kuralları.
// Sayfa: siteden bağımsız (PublicLayout DIŞINDA), noindex, sitemap/robots'ta YOK.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";
import { ARCHITECTURE_PATH, INFORMATION_REDIRECTS, INVESTOR_PATH, isInvestorPath } from "./investor-route";
import { ECOSYSTEM_LINKS } from "./investor-content";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

describe("yatırımcı rotası", () => {
  const app = read("src/App.tsx");

  it("yol sabittir", () => {
    expect(INVESTOR_PATH).toBe("/information");
    expect(isInvestorPath("/information")).toBe(true);
    expect(isInvestorPath("/informations")).toBe(false);
    // Alt yol rota ile eşleşmez (NotFound çizilir) → yüzen bileşenler de gizlenmemeli.
    expect(isInvestorPath("/information/x")).toBe(false);
  });

  it("teknik mimari alt sayfası: sabit yol, kısa yol tablosuyla çakışmaz, layout dışı, noindex", () => {
    expect(ARCHITECTURE_PATH).toBe("/information/mimari");
    expect(isInvestorPath("/information/mimari")).toBe(true);
    expect(isInvestorPath("/information/mimari/")).toBe(true);
    expect(Object.keys(INFORMATION_REDIRECTS)).not.toContain("mimari");
    const topLevel = sliceBetween(app, "{LEGACY_REDIRECTS.map", "{adminRoutes}", "layout dışı");
    expect(topLevel).toContain("<Route path={ARCHITECTURE_PATH} element={<ArchitecturePage />} />");
    const page = read("src/pages/investor/ArchitecturePage.tsx");
    expect(page).toContain('robots: "noindex, nofollow"');
    // Aynı parola kapısı: kapı açılmadan içerik çizilmez.
    expect(page).toContain("<InvestorGate verifier={verifier}");
    expect(read("scripts/generate-sitemap.mjs")).not.toContain("/mimari");
  });

  it("ekosistem kısa yolları: sabit tablo, yalnız https, kartlarla birebir", () => {
    for (const target of Object.values(INFORMATION_REDIRECTS)) expect(target).toMatch(/^https:\/\//);
    expect(isInvestorPath("/information/product")).toBe(true);
    expect(isInvestorPath("/information/venture-studio/")).toBe(true);
    expect(isInvestorPath("/information/__proto__")).toBe(false);

    const internal = ECOSYSTEM_LINKS.filter((l) => l.url.includes(`corteqs.net${INVESTOR_PATH}/`));
    expect(internal.length).toBe(Object.keys(INFORMATION_REDIRECTS).length);
    for (const link of internal) {
      const slug = link.url.split(`${INVESTOR_PATH}/`)[1];
      expect(INFORMATION_REDIRECTS[slug], link.title).toBeDefined();
    }
    // Bize ait olmayan alan adı kartta doğrudan geçmez — kısa yoldan gider.
    expect(ECOSYSTEM_LINKS.every((l) => new URL(l.url).hostname.endsWith("corteqs.net"))).toBe(true);
    expect(app).toContain("<Route path={`${INVESTOR_PATH}/:slug`} element={<InformationRedirect />} />");
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
    expect(read("scripts/generate-sitemap.mjs")).not.toContain(INVESTOR_PATH);
    if (existsSync(path.join(ROOT, "public/robots.txt"))) {
      expect(read("public/robots.txt")).not.toContain(INVESTOR_PATH);
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
