// scripts/generate-sitemap.mjs
// public/sitemap.xml'i statik route'lar + dinamik blog yazıları + commercial
// dokümanlarıyla üretir. prebuild zincirinde çalışır.
//
// Tasarım: Supabase erişilebilirse yayınlanmış blog slug'larını çeker; erişilemezse
// (env yok / ağ yok / hata) yalnızca statik + commercial route'larla devam eder —
// build ASLA bu yüzden kırılmaz. Türkçe içerik yok (yalnızca URL'ler), BOM gereksiz.
//
// Usage: node scripts/generate-sitemap.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://corteqs.net";
const OUTPUT = path.join(rootDir, "public", "sitemap.xml");
const OG_IMAGE = `${SITE_ORIGIN}/og-image-new.jpg`;

// .env.local'i basitçe oku (script standalone çalışır; dotenv bağımlılığı yok).
async function loadEnvLocal() {
  try {
    const raw = await readFile(path.join(rootDir, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env.local yoksa sorun değil; CI/Coolify gerçek env kullanır.
  }
}

// PostgREST varsayılan olarak en fazla 1000 satır döner ve BUNU SESSİZCE YAPAR —
// hata vermez, eksik listeyi normal yanıt gibi gönderir. Bu tuzak bu projede daha önce
// yaşandı (v_command_center_facets, 2026-08-04: "son WA kaydı 6 Temmuz" yanılgısı).
// Aşağıdaki fetchAllRows() Range başlığıyla sayfalayarak tabloyu sonuna kadar okur.
const PAGE_SIZE = 1000;
const FETCH_TIMEOUT_MS = 15_000;

/** Supabase REST kimlik bilgileri; eksikse null (çağıran graceful atlar). */
function supabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

/**
 * Bir PostgREST sorgusunu 1000'lik sayfalar hâlinde sonuna kadar okur.
 *
 * @returns satır dizisi; hata/timeout durumunda null (build ASLA kırılmaz).
 */
async function fetchAllRows(baseEndpoint, key, label) {
  const rows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(baseEndpoint, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          // PostgREST sayfalama: satır aralığı 0-tabanlı ve iki uç dahildir.
          "Range-Unit": "items",
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn(`[sitemap] ${label} fetch ${res.status} — atlandı.`);
        return null;
      }

      const batch = await res.json();
      if (!Array.isArray(batch)) {
        console.warn(`[sitemap] ${label} beklenmeyen yanıt — atlandı.`);
        return null;
      }

      rows.push(...batch);

      // Son sayfa: istenen kadar satır gelmediyse tablo bitti.
      if (batch.length < PAGE_SIZE) break;
    } catch (error) {
      console.warn(`[sitemap] ${label} fetch hatası — atlandı:`, error?.name ?? error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (rows.length >= PAGE_SIZE) {
    console.log(`[sitemap] ${label}: ${rows.length} satır (sayfalama devrede).`);
  }

  return rows;
}

// Statik (SEO-açık) route'lar. Admin / auth / redirect-only path'ler hariç.
//
// EKLEMEDEN ÖNCE: rota (a) gerçekten public mi (RequireAuth/RequireFeature YOK),
// (b) useSeo ile canonicalPath set ediyor mu, (c) thin content değil mi?
// Üçünü de geçmeyen rota GSC'de "Crawled - currently not indexed" üretir ve crawl
// bütçesini gerçek içerikten çalar. scripts/generate-sitemap.test.mjs (a) şıkkını
// App.tsx'i okuyarak otomatik denetler.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/founders", priority: "0.8", changefreq: "monthly" },
  { path: "/radar", priority: "0.7", changefreq: "daily" },
  { path: "/radar/rehberler", priority: "0.9", changefreq: "weekly" },
  { path: "/commercial", priority: "0.6", changefreq: "monthly" },
  { path: "/lansman", priority: "0.7", changefreq: "monthly" },
  { path: "/founding-1000", priority: "0.6", changefreq: "monthly" },
  { path: "/campaign", priority: "0.6", changefreq: "monthly" },
  // Yarışma sayfaları: public, kendi canonical'ları var, dolu içerik (2026-08-04 denetimi).
  { path: "/campaign/vlogger", priority: "0.5", changefreq: "monthly" },
  { path: "/campaign/blogger", priority: "0.5", changefreq: "monthly" },
  { path: "/19051919", priority: "0.5", changefreq: "yearly" },
  { path: "/anket", priority: "0.6", changefreq: "weekly" },
  { path: "/directory", priority: "0.7", changefreq: "weekly" },
  { path: "/associations", priority: "0.6", changefreq: "weekly" },
  { path: "/tools", priority: "0.7", changefreq: "weekly" },
  // NOT: /cadde BİLİNÇLİ OLARAK YOK (2026-08-04'te çıkarıldı). RequireAuth +
  // RequireFeature(caddeAccess) arkasındadır (src/App.tsx) — girişsiz bot login'e
  // yönlenir. Aşağıdaki /tools/:slug notuyla aynı gerekçe; o kural yazılmış ama
  // /cadde atlanmıştı, canlı sitemap'te 107 URL içinde duruyordu.
  { path: "/iletisim", priority: "0.4", changefreq: "yearly" },
  { path: "/pricing", priority: "0.5", changefreq: "monthly" },
  { path: "/kariyer", priority: "0.4", changefreq: "monthly" },
  { path: "/legal/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/terms", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/business-information", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/refund-cancellation", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/service-delivery", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/kvkk", priority: "0.2", changefreq: "yearly" },
  { path: "/legal/cookies", priority: "0.2", changefreq: "yearly" },
];

// Commercial slug'ları statik kaynaktan (src/lib/commercial-documents.ts) oku.
async function getCommercialRoutes() {
  try {
    const src = await readFile(
      path.join(rootDir, "src", "lib", "commercial-documents.ts"),
      "utf8",
    );
    const slugs = [...src.matchAll(/slug:\s*["']([a-z0-9-]+)["']/gi)].map((m) => m[1]);
    return [...new Set(slugs)].map((slug) => ({
      path: `/commercial/${slug}`,
      priority: "0.6",
      changefreq: "monthly",
    }));
  } catch (error) {
    console.warn("[sitemap] commercial slugs okunamadı:", error?.message ?? error);
    return [];
  }
}

// Yayınlanmış blog yazılarını Supabase REST üzerinden çek (graceful).
async function getBlogRoutes() {
  const env = supabaseEnv();
  if (!env) {
    console.warn("[sitemap] Supabase env yok — blog yazıları atlandı.");
    return [];
  }

  const endpoint = `${env.url}/rest/v1/blog_posts?select=slug,updated_at&published=eq.true`;
  const rows = await fetchAllRows(endpoint, env.key, "blog_posts");
  if (!rows) return [];

  return rows
    .filter((r) => r?.slug)
    .map((r) => ({
      path: `/blog/${r.slug}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
    }));
}

// Yayınlanmış anketleri Supabase REST üzerinden çek (graceful; src/lib/surveys.ts
// getPublishedSurveys() ile aynı filtre: status=published + başlangıç/bitiş penceresi).
async function getSurveyRoutes() {
  const env = supabaseEnv();
  if (!env) {
    console.warn("[sitemap] Supabase env yok — anketler atlandı.");
    return [];
  }

  const nowIso = new Date().toISOString();
  const params = new URLSearchParams({
    select: "slug,updated_at",
    status: "eq.published",
  });
  // İKİ AYRI `or` — PostgREST bunları AND'ler (supabase-js'te zincirlenmiş .or() ile
  // aynı davranış). Bitiş penceresi 2026-08-04'e kadar YOKTU: src/lib/surveys.ts hem
  // starts_at hem ends_at uyguluyordu, sitemap yalnız starts_at'i uyguluyordu →
  // süresi dolmuş anketler sitemap'te kalıyor, tıklayan kullanıcı kapalı ankete düşüyordu.
  //
  // `append` zorunlu: URLSearchParams constructor'ına aynı anahtarı iki kez veremezsin,
  // ikincisi birinciyi ezer.
  params.append("or", `(starts_at.is.null,starts_at.lte.${nowIso})`);
  params.append("or", `(ends_at.is.null,ends_at.gte.${nowIso})`);

  const endpoint = `${env.url}/rest/v1/surveys?${params.toString()}`;
  const rows = await fetchAllRows(endpoint, env.key, "surveys");
  if (!rows) return [];

  return rows
    .filter((r) => r?.slug)
    .map((r) => ({
      path: `/anket/${r.slug}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
    }));
}

// Yayınlanmış diaspora/haber öğelerini Supabase REST üzerinden çek (graceful;
// src/lib/marquee.ts getPublicMarqueeItemBySlug() ile aynı filtre).
async function getDiasporaRoutes() {
  const env = supabaseEnv();
  if (!env) {
    console.warn("[sitemap] Supabase env yok — diaspora öğeleri atlandı.");
    return [];
  }

  const params = new URLSearchParams({
    select: "slug,published_at",
    is_active: "eq.true",
    link_enabled: "eq.true",
    slug: "not.is.null",
  });
  const endpoint = `${env.url}/rest/v1/marquee_items?${params.toString()}`;
  const rows = await fetchAllRows(endpoint, env.key, "marquee_items");
  if (!rows) return [];

  return rows
    .filter((r) => r?.slug)
    .map((r) => ({
      path: `/diaspora/${r.slug}`,
      priority: "0.5",
      changefreq: "monthly",
      lastmod: r.published_at ? String(r.published_at).slice(0, 10) : undefined,
    }));
}

// Herkese açık (RLS: catalog_item_is_publicly_visible) katalog profillerini çek —
// src/lib/public-catalog-profile-api.ts'in kullandığı RPC değil, doğrudan tablo;
// catalog_items_public_or_manager_read policy'si zaten görünürlüğü filtreliyor.
//
// GSC "Discovered - currently not indexed" (2026-07-28 audit, 236 sayfa): sitemap'te
// is_placeholder=true (AFS rol şablonları, gerçek içerik değil) ve long_description'ı
// boş "thin content" satırlar vardı — Google bunları düşük-değerli görüp crawl
// bütçesini gerçek/dolu profillere ayırmıyordu. status=published + visibility=public +
// is_placeholder=false + dolu long_description şartı eklendi.
async function getDirectoryCatalogRoutes() {
  const env = supabaseEnv();
  if (!env) {
    console.warn("[sitemap] Supabase env yok — directory/catalog öğeleri atlandı.");
    return [];
  }

  const params = new URLSearchParams({
    select: "slug,updated_at,long_description",
    slug: "not.is.null",
    status: "eq.published",
    visibility: "eq.public",
    is_placeholder: "eq.false",
    long_description: "not.is.null",
  });
  const endpoint = `${env.url}/rest/v1/catalog_items?${params.toString()}`;
  const rows = await fetchAllRows(endpoint, env.key, "catalog_items");
  if (!rows) return [];

  return rows
    .filter((r) => r?.slug && String(r.long_description ?? "").trim().length > 0)
    .map((r) => ({
      path: `/directory/catalog/${r.slug}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
    }));
}

// Yayınlanmış bağımsız (büyükelçilik/konsolosluk) profilleri çek — src/lib/
// independent-profiles.ts listPublishedIndependentProfiles() ile aynı filtre.
async function getIndependentProfileRoutes() {
  const env = supabaseEnv();
  if (!env) {
    console.warn("[sitemap] Supabase env yok — kuruluş profilleri atlandı.");
    return [];
  }

  const params = new URLSearchParams({
    select: "slug,updated_at",
    is_published: "eq.true",
    slug: "not.is.null",
  });
  const endpoint = `${env.url}/rest/v1/independent_profiles?${params.toString()}`;
  const rows = await fetchAllRows(endpoint, env.key, "independent_profiles");
  if (!rows) return [];

  return rows
    .filter((r) => r?.slug)
    .map((r) => ({
      path: `/kurulus/${r.slug}`,
      priority: "0.5",
      changefreq: "monthly",
      lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
    }));
}

// NOT: /tools/:slug alt sayfaları RequireAuth ile korunur (bkz. src/App.tsx) —
// girişsiz ziyaretçi/bot login'e redirect edilir. Bunları sitemap'e eklemek
// GSC'de "Discovered/Crawled - currently not indexed" üretir (2026-07-14 audit).
// Yalnızca herkese açık /tools hub'ı (STATIC_ROUTES içinde) sitemap'te kalır.
// Aynı nedenle /association/:id de hariç: src/data/mock.ts demo verisi, gerçek
// içerik değil (bkz. DemoPageBanner, AssociationDetail.tsx — noindex).

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );
}

function renderUrl(entry, today) {
  const loc = `${SITE_ORIGIN}${entry.path}`;
  const lastmod = entry.lastmod ?? today;
  const image =
    entry.path === "/"
      ? `\n    <image:image>\n      <image:loc>${OG_IMAGE}</image:loc>\n      <image:title>CorteQS Diaspora Connect</image:title>\n    </image:image>`
      : "";
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${image}
  </url>`;
}

async function main() {
  await loadEnvLocal();
  // SITE_DATE env ile sabitlenebilir; yoksa bugünün tarihi (deterministik build için).
  const today = process.env.SITE_DATE ?? new Date().toISOString().slice(0, 10);

  const [
    commercialRoutes,
    blogRoutes,
    surveyRoutes,
    diasporaRoutes,
    directoryCatalogRoutes,
    independentProfileRoutes,
  ] = await Promise.all([
    getCommercialRoutes(),
    getBlogRoutes(),
    getSurveyRoutes(),
    getDiasporaRoutes(),
    getDirectoryCatalogRoutes(),
    getIndependentProfileRoutes(),
  ]);

  const entries = [
    ...STATIC_ROUTES,
    ...commercialRoutes,
    ...blogRoutes,
    ...surveyRoutes,
    ...diasporaRoutes,
    ...directoryCatalogRoutes,
    ...independentProfileRoutes,
  ];
  // Tekilleştir (path'e göre).
  const unique = [...new Map(entries.map((e) => [e.path, e])).values()];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${unique.map((e) => renderUrl(e, today)).join("\n")}
</urlset>
`;

  await writeFile(OUTPUT, xml, "utf8");
  console.log(
    `[sitemap] ${unique.length} URL yazıldı → public/sitemap.xml ` +
      `(statik: ${STATIC_ROUTES.length}, commercial: ${commercialRoutes.length}, blog: ${blogRoutes.length}, ` +
      `anket: ${surveyRoutes.length}, diaspora: ${diasporaRoutes.length}, ` +
      `directory/catalog: ${directoryCatalogRoutes.length}, kurulus: ${independentProfileRoutes.length})`,
  );
}

// Yalnız doğrudan çalıştırıldığında üret. `import` edildiğinde (testler) main()
// tetiklenmez — aksi halde her test koşusu ağa çıkıp public/sitemap.xml'i ezerdi.
const calistirilanDosya = process.argv[1] ? path.resolve(process.argv[1]) : "";
const buDosya = path.resolve(fileURLToPath(import.meta.url));

if (calistirilanDosya === buDosya) {
  main().catch((error) => {
    // Build'i kırma: hata olsa bile mevcut sitemap.xml korunur.
    console.warn(
      "[sitemap] üretim başarısız, mevcut sitemap.xml korunuyor:",
      error?.message ?? error,
    );
    process.exit(0);
  });
}

// Test yüzeyi — bkz. scripts/generate-sitemap.test.mjs
export { STATIC_ROUTES, escapeXml, renderUrl, fetchAllRows, PAGE_SIZE };
