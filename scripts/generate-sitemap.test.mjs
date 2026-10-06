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

import { sliceFrom } from "../src/test/source-slice";
import {
  MIN_KEEP_RATIO,
  STATIC_ROUTES,
  countSitemapUrls,
  escapeXml,
  evaluateSitemapWrite,
  qualifiesForSitemap,
  renderUrl,
} from "./generate-sitemap.mjs";

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

  it("/kariyer önceliği 0.7'dir (KR10)", () => {
    // 0.4 → 0.7: sayfa artık 17 ilan + staj programı + kurucu mektupları taşıyor,
    // yani sitemap'in üç kriterini de geçiyor (public · useSeo+canonical · ince değil).
    // Çıpa burada: sessizce 0.4'e dönerse test söyler.
    const kariyer = STATIC_ROUTES.find((route) => route.path === "/kariyer");

    expect(kariyer, "/kariyer STATIC_ROUTES'tan düşmüş").toBeTruthy();
    expect(kariyer.priority).toBe("0.7");
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

  it("renderUrl çıktısı deterministiktir — bugünün tarihine bağlı değildir", () => {
    const bir = renderUrl({ path: "/x", priority: "0.5", changefreq: "weekly" });
    const iki = renderUrl({ path: "/x", priority: "0.5", changefreq: "weekly" });

    expect(bir).toBe(iki);
    expect(bir).toContain("<loc>https://corteqs.net/x</loc>");
  });

  it("gerçek lastmod'u bilinmeyen kayda <lastmod> YAZMAZ (build günü uydurulmaz)", () => {
    // Eskiden bilinmeyen tarih yerine build günü basılıyordu: tüm statik sayfalar her
    // build'de "bugün değişti" görünüyor, Google lastmod'u güvenilmez sayıp yok sayıyordu.
    const xml = renderUrl({ path: "/x", priority: "0.5", changefreq: "weekly" });

    expect(xml).not.toContain("<lastmod>");
  });

  it("entry kendi lastmod'unu taşıyorsa onu yazar", () => {
    const xml = renderUrl({
      path: "/y",
      priority: "0.5",
      changefreq: "weekly",
      lastmod: "2026-01-01",
    });

    expect(xml).toContain("<lastmod>2026-01-01</lastmod>");
  });

  it("hiçbir statik rota sabit lastmod taşımaz — tarih yalnız dinamik kaynaktan gelir", () => {
    const tarihli = STATIC_ROUTES.filter((r) => r.lastmod).map((r) => r.path);

    expect(tarihli, `statik rotada elle yazılmış lastmod (bayatlar): ${tarihli.join(", ")}`).toEqual([]);
  });

  it("yalnız kök sayfaya image bloğu ekler", () => {
    const kok = renderUrl({ path: "/", priority: "1.0", changefreq: "weekly" });
    const digeri = renderUrl({ path: "/founders", priority: "0.8", changefreq: "monthly" });

    expect(kok).toContain("<image:image>");
    expect(digeri).not.toContain("<image:image>");
  });
});

describe("qualifiesForSitemap — katalog kapsam kuralı (22.09)", () => {
  const row = (patch) => ({
    slug: "x",
    long_description: null,
    headline: null,
    short_description: null,
    city: null,
    ...patch,
  });

  it("uzun açıklaması olan kaydı alır", () => {
    expect(qualifiesForSitemap(row({ long_description: "Uzun metin" }))).toBe(true);
  });

  it("başlık + kısa açıklama + şehir üçlüsü olan kaydı alır (konsolosluk/uzman)", () => {
    expect(
      qualifiesForSitemap(
        row({ headline: "Başkonsolosluk", short_description: "T.C. temsilcilik", city: "Münih" }),
      ),
    ).toBe(true);
  });

  it("kısa açıklaması OLMAYAN üye kaydını ELER — ince sayfa dersi korunur", () => {
    expect(qualifiesForSitemap(row({ headline: "Ad Soyad", city: "Berlin" }))).toBe(false);
  });

  it("şehri olmayan kaydı eler", () => {
    expect(qualifiesForSitemap(row({ headline: "Ad", short_description: "Meslek" }))).toBe(false);
  });

  it("boşluktan ibaret alanları dolu saymaz", () => {
    expect(
      qualifiesForSitemap(row({ headline: "   ", short_description: "  ", city: " " })),
    ).toBe(false);
    expect(qualifiesForSitemap(row({ long_description: "   " }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Küçülme koruması
// ---------------------------------------------------------------------------
// Dinamik kaynaklar env yokken / tablo 5xx verirken HATA FIRLATMAZ, boş döner. Dockerfile'da
// VITE_SUPABASE_* build argümanı yoksa üretim sitemap'i ~413 URL yerine ~45 URL'ye
// SESSİZCE iner ve sağlam dosyanın üstüne yazılırdı.

const xmlWith = (n) =>
  `<urlset>${Array.from({ length: n }, (_, i) => `<url><loc>https://corteqs.net/${i}</loc></url>`).join("")}</urlset>`;

describe("sitemap küçülme koruması", () => {
  it("countSitemapUrls <loc> sayar", () => {
    expect(countSitemapUrls(xmlWith(0))).toBe(0);
    expect(countSitemapUrls(xmlWith(7))).toBe(7);
  });

  it("413 → 45 (env düştü) YAZILMAZ", () => {
    const karar = evaluateSitemapWrite(45, xmlWith(413));

    expect(karar.write).toBe(false);
    expect(karar.reason).toContain("SITEMAP_ALLOW_SHRINK=1");
  });

  it("eşik oranı anlamlı aralıkta: ne her küçülmeyi engeller ne de çöküşü geçirir", () => {
    // Aşağıdaki eşik testleri oranı BU sabitten türetir; oran gevşetilirse onlar yine
    // geçer. Bu test oranın kendisini sabitler. %50 altı: 413→250 gibi gerçek kayıp geçer;
    // %90 üstü: günlük dalgalanma build'i boşuna engeller.
    expect(MIN_KEEP_RATIO).toBeGreaterThanOrEqual(0.5);
    expect(MIN_KEEP_RATIO).toBeLessThanOrEqual(0.9);
  });

  it("eşiğin hemen altı yazılmaz, hemen üstü yazılır", () => {
    const mevcut = 100;
    const esik = mevcut * MIN_KEEP_RATIO; // 70

    expect(evaluateSitemapWrite(esik - 1, xmlWith(mevcut)).write).toBe(false);
    expect(evaluateSitemapWrite(esik, xmlWith(mevcut)).write).toBe(true);
  });

  it("büyüme ve küçük dalgalanma yazılır", () => {
    expect(evaluateSitemapWrite(430, xmlWith(413)).write).toBe(true);
    expect(evaluateSitemapWrite(400, xmlWith(413)).write).toBe(true);
  });

  it("mevcut dosya yoksa/boşsa her zaman yazar (ilk üretim, temiz klon)", () => {
    expect(evaluateSitemapWrite(45, null).write).toBe(true);
    expect(evaluateSitemapWrite(45, xmlWith(0)).write).toBe(true);
  });

  it("bilinçli küçülme (allowShrink) yazılabilir", () => {
    expect(evaluateSitemapWrite(45, xmlWith(413), { allowShrink: true }).write).toBe(true);
  });

  it("main() yazmadan ÖNCE korumayı çağırır (yalnız fonksiyonun varlığı yetmez)", () => {
    // Fonksiyon testleri, main() ona hiç bağlanmasa da yeşil kalırdı.
    const source = readFileSync(resolve(process.cwd(), "scripts/generate-sitemap.mjs"), "utf8");
    const main = sliceFrom(source, "async function main()", "generate-sitemap main()");
    const koruma = main.indexOf("evaluateSitemapWrite(");
    const yazma = main.indexOf("writeFile(OUTPUT");

    expect(koruma, "main() içinde evaluateSitemapWrite çağrısı yok").toBeGreaterThan(-1);
    expect(yazma, "main() içinde writeFile(OUTPUT çağrısı yok").toBeGreaterThan(-1);
    expect(koruma).toBeLessThan(yazma);
  });
});
