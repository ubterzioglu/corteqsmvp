// Genel rota ↔ SEO sözleşmesi.
//
// SESSİZ KUSUR SINIFI: bir sayfa `useSeo` çağırmazsa hata vermez; canlıda ana sayfanın
// başlığını ve açıklamasını gösterir ve index.html'in global "index, follow" değeri
// geçerli kalır. 2026-09-20'de dört sayfa (`/anket` dahil, üstelik sitemap'te ilan
// edilmişti) aylarca böyle durdu; hiçbir test yakalamadı. generate-sitemap.mjs'in kendi
// (b) kuralı ("sayfa useSeo + canonicalPath tanımlıyor mu?") yalnız yorumdaydı.
//
// Bu dosya iki sözleşmeyi kilitler:
//   1. Auth duvarı OLMAYAN her <Route> bir SEO çağrısı yapan sayfaya çıkar.
//   2. Sitemap'e (STATIC_ROUTES) giren her yol, sayfasında KENDİ canonicalPath'iyle durur.
//
// Kaynak metni okur; çalışan SPA'yı değil. Çıpa kaybolursa test AÇIKÇA düşer.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

import { STATIC_ROUTES } from "../../scripts/generate-sitemap.mjs";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

const APP = read("src/App.tsx");
const PAGE_SEO_SOURCE = read("src/lib/page-seo.ts");

/** `useSeo(`/`applySeo(` çağrısı — sayfanın gerçekten meta yazdığının kanıtı. */
const SEO_CALL = /\b(useSeo|applySeo)\(/;
/** Çağrıyı kendisi yapan, sayfaların `seoKey`/props ile devrettiği sarmalayıcılar. */
const SEO_WRAPPERS: Record<string, string> = {
  LegalLayout: "src/pages/LegalLayout.tsx",
  PublicProfileShell: "src/components/directory/public-profile/PublicProfileShell.tsx",
};

/**
 * App.tsx'te kendi içinde tanımlı (dosyası olmayan) bileşenler. Gerçek içerik hangi
 * dosyalardaysa onlar denetlenir.
 */
const INLINE_COMPONENTS: Record<string, string[]> = {
  FoundersCombinedPage: ["src/pages/FoundersPage.tsx", "src/pages/AboutPage.tsx"],
};

/** SEO'su gerekmeyen genel rotalar: içerik çizmeyen yönlendirmeler. */
const NO_SEO_NEEDED: Record<string, string> = {
  "/auth": "AuthRouteRedirect — /login'e <Navigate>, içerik çizmez",
};

/**
 * BİLİNEN BOŞLUKLAR (ratchet). Bugün SEO çağrısı yok; ürün kararı bekliyor:
 * noindex mi, canonical mı (docs/plans/2026-10-06-seo-geo-cleancode-kalan-plan.md,
 * soru 1). Boşluk kapanınca BU SATIR SİLİNMEK ZORUNDADIR — aşağıdaki "hâlâ açık"
 * testi, kapanmış bir boşluğun listede unutulmasını yakalar.
 */
const KNOWN_GAPS: Record<string, string> = {
  "/ilanlar/:id": "JobListingDetailPage — ilan detayı ana sayfa başlığıyla çıkıyor",
  "/directory/profile/:userId":
    "DirectoryProfilePage — canonical hedefi /directory/catalog/:slug olmalı (kopya riski)",
};

// ---------------------------------------------------------------------------
// App.tsx ayrıştırma
// ---------------------------------------------------------------------------

type PublicRoute = { path: string; component: string; files: string[] };

const IMPORTS = new Map<string, string>();
for (const m of APP.matchAll(/const (\w+) = lazyWithReload\(\(\) => import\("([^"]+)"\)\)/g)) {
  IMPORTS.set(m[1], m[2]);
}
for (const m of APP.matchAll(/^import (\w+) from "([^"]+)";/gm)) {
  IMPORTS.set(m[1], m[2]);
}

function resolveComponentFiles(component: string): string[] {
  if (INLINE_COMPONENTS[component]) return INLINE_COMPONENTS[component];
  const specifier = IMPORTS.get(component);
  if (!specifier) return [];
  const base = specifier.startsWith("@/")
    ? specifier.replace("@/", "src/")
    : `src/${specifier.replace("./", "")}`;
  const found = [base, `${base}.tsx`, `${base}.ts`].find(
    (candidate) => /\.tsx?$/.test(candidate) && existsSync(resolve(ROOT, candidate)),
  );
  return found ? [found] : [];
}

function parsePublicRoutes(): PublicRoute[] {
  // Çocuk rotaların hepsi kendiliğinden kapanır (`/>`); ilk `</Route>` PublicLayout
  // grubunun kapanışıdır ve `*` rotası ondan ÖNCEDİR.
  const region = sliceBetween(
    APP,
    "<Route element={<PublicLayout />}>",
    "</Route>",
    "PublicLayout rota bloğu",
  );

  return region
    .split(/(?=<Route\s)/)
    .filter((block) => /path="/.test(block))
    .filter((block) => !/RequireAuth|RequireFeature/.test(block))
    .map((block) => {
      const path = block.match(/path="([^"]+)"/)?.[1] ?? "";
      const component =
        [...block.matchAll(/<([A-Z]\w+)\s*\/>/g)]
          .map((m) => m[1])
          .find((name) => name !== "Navigate") ?? "";
      return { path, component, files: resolveComponentFiles(component) };
    });
}

const PUBLIC_ROUTES = parsePublicRoutes();

/** Dosya ya doğrudan SEO çağırır ya da çağıran bir sarmalayıcıyı kullanır. */
function callsSeo(file: string): boolean {
  const source = read(file);
  if (SEO_CALL.test(source)) return true;
  return Object.keys(SEO_WRAPPERS).some((wrapper) => source.includes(`<${wrapper}`));
}

const routeHasSeo = (route: PublicRoute): boolean =>
  route.files.length > 0 && route.files.every(callsSeo);

// ---------------------------------------------------------------------------
// Sözleşme 1 — genel rota SEO çağırır
// ---------------------------------------------------------------------------

describe("genel rotalar ↔ SEO çağrısı", () => {
  it("ayrıştırma çalışıyor: yeterince genel rota ve çözümlenmiş dosya bulundu", () => {
    // Çıpa kayarsa tüm sözleşme boş listede 'geçer'. Alt sınır bilinçli düşük tutuldu.
    expect(PUBLIC_ROUTES.length).toBeGreaterThan(40);
    const cozumsuz = PUBLIC_ROUTES.filter((r) => r.files.length === 0 && !NO_SEO_NEEDED[r.path]);
    expect(
      cozumsuz.map((r) => `${r.path} → ${r.component || "(bileşen yok)"}`),
      "bileşen dosyası çözülemedi — INLINE_COMPONENTS'a ekle ya da ayrıştırıcıyı düzelt",
    ).toEqual([]);
  });

  it("auth duvarı olmayan her rota bir SEO çağrısı yapan sayfaya çıkar", () => {
    const ihlal = PUBLIC_ROUTES.filter(
      (route) => !NO_SEO_NEEDED[route.path] && !KNOWN_GAPS[route.path] && !routeHasSeo(route),
    ).map((route) => `${route.path} → ${route.component}`);

    expect(
      ihlal,
      `useSeo/applySeo çağırmayan genel rota (ana sayfa başlığıyla indekslenir): ${ihlal.join(", ")}`,
    ).toEqual([]);
  });

  it("bilinen boşluklar HÂLÂ açık — kapananlar listeden silinmeli", () => {
    const kapanmis = Object.keys(KNOWN_GAPS).filter((path) => {
      const route = PUBLIC_ROUTES.find((r) => r.path === path);
      return route ? routeHasSeo(route) : true; // rota kalktıysa da listeden düşmeli
    });

    expect(kapanmis, `KNOWN_GAPS'ten silin: ${kapanmis.join(", ")}`).toEqual([]);
  });

  it("SEO sarmalayıcıları kendileri gerçekten SEO çağırır", () => {
    // Sayfalar `<LegalLayout seoKey=…>` ile devrediyor; sarmalayıcı çağrıyı yitirirse
    // tüm legal sayfalar sessizce meta'sız kalır.
    for (const [wrapper, file] of Object.entries(SEO_WRAPPERS)) {
      expect(SEO_CALL.test(read(file)), `${wrapper} (${file}) useSeo/applySeo çağırmıyor`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Sözleşme 2 — sitemap yolları kendi canonicalPath'iyle durur
// ---------------------------------------------------------------------------

/** page-seo.ts: anahtar → canonicalPath. */
const PAGE_SEO_CANONICALS = new Map<string, string>();
for (const m of PAGE_SEO_SOURCE.matchAll(/\n {2}(\w+):\s*\{[^}]*?canonicalPath:\s*"([^"]+)"/g)) {
  PAGE_SEO_CANONICALS.set(m[1], m[2]);
}

/** Sayfa kaynağı `path`'i canonicalPath olarak ilan ediyor mu (doğrudan ya da PAGE_SEO ile)? */
function declaresCanonical(path: string, source: string): boolean {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`canonicalPath:\\s*["'\`]${escaped}["'\`]`).test(source)) return true;

  const referencedKeys = [
    ...[...source.matchAll(/PAGE_SEO\.(\w+)/g)].map((m) => m[1]),
    ...[...source.matchAll(/PAGE_SEO\[\s*["'](\w+)["']/g)].map((m) => m[1]),
    ...[...source.matchAll(/seoKey=["'](\w+)["']/g)].map((m) => m[1]),
  ];
  return referencedKeys.some((key) => PAGE_SEO_CANONICALS.get(key) === path);
}

describe("sitemap STATIC_ROUTES ↔ sayfa canonicalPath", () => {
  const siteRoutes: { path: string }[] = STATIC_ROUTES;

  it("page-seo.ts ayrıştırması çalışıyor", () => {
    expect(PAGE_SEO_CANONICALS.size).toBeGreaterThan(15);
    expect(PAGE_SEO_CANONICALS.get("home")).toBe("/");
  });

  it("sitemap'teki her yol bir genel rotadır ve SEO çağıran sayfaya çıkar", () => {
    const eksik = siteRoutes
      .filter(({ path }) => {
        const route = PUBLIC_ROUTES.find((r) => r.path === path);
        return !route || !routeHasSeo(route);
      })
      .map(({ path }) => path);

    expect(eksik, `sitemap'te ilan edilen ama SEO'su olmayan yol: ${eksik.join(", ")}`).toEqual([]);
  });

  it("sitemap'teki her yol sayfasında KENDİ canonicalPath'iyle ilan edilir", () => {
    const yanlis = siteRoutes
      .filter(({ path }) => {
        const route = PUBLIC_ROUTES.find((r) => r.path === path);
        if (!route) return true;
        // Birden çok dosyadan oluşan sayfada (örn. /founders) en az biri ilan etmeli.
        return !route.files.some((file) => declaresCanonical(path, read(file)));
      })
      .map(({ path }) => path);

    expect(
      yanlis,
      `canonicalPath'i yolla eşleşmeyen sitemap girdisi (kopya/yanlış canonical): ${yanlis.join(", ")}`,
    ).toEqual([]);
  });
});
