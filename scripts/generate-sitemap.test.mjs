// scripts/generate-sitemap.mjs testleri.
//
// ASIL DEĞER: STATIC_ROUTES ↔ App.tsx drift denetimi. Sitemap'e auth arkasındaki veya
// redirect olan bir rota girdiğinde Google onu "Discovered/Crawled - currently not
// indexed" olarak işaretler ve crawl bütçesini gerçek içerikten çalar.
//
// Gerçek olay (2026-08-04 denetimi): canlı sitemap.xml'de /cadde vardı, oysa /cadde
// RequireAuth + RequireFeature(caddeAccess) arkasında. Script'in kendi yorumunda bu
// kural /tools/:slug için yazılıydı ama /cadde atlanmıştı — hiçbir test iki tarafı
// karşılaştırmadığı için 107 URL'lik sitemap'te aylarca durdu.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { STATIC_ROUTES, escapeXml, renderUrl } from "./generate-sitemap.mjs";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

/**
 * App.tsx'te verilen path'i tanımlayan <Route ...> bloğunu çıkarır.
 *
 * Sınır, BİR SONRAKİ `path="` görülene kadardır. Sabit karakter penceresi kullanmak
 * yanlış pozitif üretiyordu: /anket public'tir ama hemen ardından gelen /feedback
 * RequireAuth'ludur ve geniş pencere onu da yutuyordu.
 */
function routeBlock(path) {
  const anahtar = `path="${path}"`;
  const index = appSource.indexOf(anahtar);
  if (index === -1) return null;

  const rest = appSource.slice(index + anahtar.length);
  const sonraki = rest.indexOf('path="');
  return sonraki === -1 ? rest : rest.slice(0, sonraki);
}

describe("STATIC_ROUTES ↔ App.tsx", () => {
  it("hiçbir statik rota auth/feature duvarının arkasında değildir", () => {
    const korumali = STATIC_ROUTES.filter(({ path }) => {
      const block = routeBlock(path);
      if (!block) return false;
      return /RequireAuth|RequireFeature/.test(block);
    }).map((r) => r.path);

    expect(korumali, `auth arkasındaki rota sitemap'te: ${korumali.join(", ")}`).toEqual([]);
  });

  it("/cadde sitemap'te DEĞİLDİR (RequireAuth + RequireFeature)", () => {
    // Regresyon kilidi: 2026-08-04'te çıkarıldı, geri eklenmemeli.
    expect(STATIC_ROUTES.map((r) => r.path)).not.toContain("/cadde");
  });

  it("hiçbir statik rota bir yönlendirme kaynağı değildir", () => {
    // /blog gibi bir redirect'i sitemap'e koymak botu 301 zincirine sokar.
    const redirectKaynaklari = new Set(
      [...appSource.matchAll(/\{\s*from:\s*"([^"]+)"/g)].map((m) => m[1]),
    );
    // redirects.ts'i de doğrudan oku (App.tsx artık tabloyu import ediyor).
    const redirectsSource = readFileSync(resolve(process.cwd(), "src/lib/redirects.ts"), "utf8");
    for (const match of redirectsSource.matchAll(/from:\s*"([^"]+)"/g)) {
      redirectKaynaklari.add(match[1]);
    }

    const cakisan = STATIC_ROUTES.filter((r) => redirectKaynaklari.has(r.path)).map((r) => r.path);

    expect(cakisan, `sitemap'te redirect kaynağı var: ${cakisan.join(", ")}`).toEqual([]);
  });

  it("aynı path iki kez listelenmez", () => {
    const paths = STATIC_ROUTES.map((r) => r.path);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it("her rota mutlak yoldur ve geçerli priority/changefreq taşır", () => {
    for (const route of STATIC_ROUTES) {
      expect(route.path.startsWith("/"), `mutlak değil: ${route.path}`).toBe(true);
      expect(Number(route.priority)).toBeGreaterThanOrEqual(0);
      expect(Number(route.priority)).toBeLessThanOrEqual(1);
      expect([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ]).toContain(route.changefreq);
    }
  });
});

describe("XML üretimi", () => {
  it("XML özel karakterlerini kaçırır", () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&apos;f");
  });

  it("renderUrl verilen tarihi kullanır — çıktı deterministiktir", () => {
    const bir = renderUrl({ path: "/x", priority: "0.5", changefreq: "weekly" }, "2026-08-04");
    const iki = renderUrl({ path: "/x", priority: "0.5", changefreq: "weekly" }, "2026-08-04");

    expect(bir).toBe(iki);
    expect(bir).toContain("<lastmod>2026-08-04</lastmod>");
    expect(bir).toContain("<loc>https://corteqs.net/x</loc>");
  });

  it("entry kendi lastmod'unu taşıyorsa onu tercih eder", () => {
    const xml = renderUrl(
      { path: "/y", priority: "0.5", changefreq: "weekly", lastmod: "2026-01-01" },
      "2026-08-04",
    );

    expect(xml).toContain("<lastmod>2026-01-01</lastmod>");
  });

  it("yalnız kök sayfaya image bloğu ekler", () => {
    const kok = renderUrl({ path: "/", priority: "1.0", changefreq: "weekly" }, "2026-08-04");
    const digeri = renderUrl({ path: "/founders", priority: "0.8", changefreq: "monthly" }, "2026-08-04");

    expect(kok).toContain("<image:image>");
    expect(digeri).not.toContain("<image:image>");
  });
});
