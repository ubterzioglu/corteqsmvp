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

// Statik (SEO-açık) route'lar. Admin / auth / redirect-only path'ler hariç.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/founders", priority: "0.8", changefreq: "monthly" },
  { path: "/radar", priority: "0.7", changefreq: "daily" },
  { path: "/radar/rehberler", priority: "0.9", changefreq: "weekly" },
  { path: "/commercial", priority: "0.6", changefreq: "monthly" },
  { path: "/lansman", priority: "0.7", changefreq: "monthly" },
  { path: "/founding-1000", priority: "0.6", changefreq: "monthly" },
  { path: "/campaign", priority: "0.6", changefreq: "monthly" },
  { path: "/19051919", priority: "0.5", changefreq: "yearly" },
  { path: "/anket", priority: "0.6", changefreq: "weekly" },
  { path: "/directory", priority: "0.7", changefreq: "weekly" },
  { path: "/associations", priority: "0.6", changefreq: "weekly" },
  { path: "/tools", priority: "0.7", changefreq: "weekly" },
  { path: "/cadde", priority: "0.6", changefreq: "daily" },
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
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env yok — blog yazıları atlandı.");
    return [];
  }

  try {
    const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/blog_posts?select=slug,updated_at&published=eq.true`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[sitemap] blog_posts fetch ${res.status} — atlandı.`);
      return [];
    }
    const rows = await res.json();
    return rows
      .filter((r) => r?.slug)
      .map((r) => ({
        path: `/blog/${r.slug}`,
        priority: "0.7",
        changefreq: "monthly",
        lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
      }));
  } catch (error) {
    console.warn("[sitemap] blog fetch hatası — atlandı:", error?.name ?? error);
    return [];
  }
}

// Yayınlanmış anketleri Supabase REST üzerinden çek (graceful; src/lib/surveys.ts
// getPublishedSurveys() ile aynı filtre: status=published + başlangıç/bitiş penceresi).
async function getSurveyRoutes() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env yok — anketler atlandı.");
    return [];
  }

  try {
    const nowIso = new Date().toISOString();
    const params = new URLSearchParams({
      select: "slug,updated_at",
      status: "eq.published",
      or: `(starts_at.is.null,starts_at.lte.${nowIso})`,
    });
    const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/surveys?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[sitemap] surveys fetch ${res.status} — atlandı.`);
      return [];
    }
    const rows = await res.json();
    return rows
      .filter((r) => r?.slug)
      .map((r) => ({
        path: `/anket/${r.slug}`,
        priority: "0.6",
        changefreq: "weekly",
        lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
      }));
  } catch (error) {
    console.warn("[sitemap] anket fetch hatası — atlandı:", error?.name ?? error);
    return [];
  }
}

// NOT: /tools/:slug alt sayfaları RequireAuth ile korunur (bkz. src/App.tsx) —
// girişsiz ziyaretçi/bot login'e redirect edilir. Bunları sitemap'e eklemek
// GSC'de "Discovered/Crawled - currently not indexed" üretir (2026-07-14 audit).
// Yalnızca herkese açık /tools hub'ı (STATIC_ROUTES içinde) sitemap'te kalır.

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

  const [commercialRoutes, blogRoutes, surveyRoutes] = await Promise.all([
    getCommercialRoutes(),
    getBlogRoutes(),
    getSurveyRoutes(),
  ]);

  const entries = [...STATIC_ROUTES, ...commercialRoutes, ...blogRoutes, ...surveyRoutes];
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
      `(statik: ${STATIC_ROUTES.length}, commercial: ${commercialRoutes.length}, blog: ${blogRoutes.length}, anket: ${surveyRoutes.length})`,
  );
}

main().catch((error) => {
  // Build'i kırma: hata olsa bile mevcut sitemap.xml korunur.
  console.warn("[sitemap] üretim başarısız, mevcut sitemap.xml korunuyor:", error?.message ?? error);
  process.exit(0);
});
