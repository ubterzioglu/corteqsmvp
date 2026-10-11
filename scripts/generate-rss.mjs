// scripts/generate-rss.mjs
// public/rss.xml'i yayınlanmış blog yazılarından üretir (RSS 2.0). prebuild zincirinde
// çalışır.
//
// Neden: GEO denetimi (2026-10-11) "missing RSS" dedi; /rss.xml 404 dönüyordu. Besleme
// AI/arama ajanlarına yeni içeriği tarihiyle bildirir.
//
// Tasarım generate-sitemap.mjs ile aynı: Supabase erişilemezse (env yok / ağ yok /
// hata) mevcut rss.xml KORUNUR ve build ASLA kırılmaz. Sayfalama fetchAllRows() ile
// (PostgREST 1000 satırda sessizce keser — Değişmez sözleşmeler md.5).
//
// Filtre kaynak modülle aynıdır: blog sayfaları yalnız `published=true` yazıları gösterir.
//
// Usage: node scripts/generate-rss.mjs

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { escapeXml, fetchAllRows, loadEnvLocal, supabaseEnv } from "./generate-sitemap.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://corteqs.net";
const OUTPUT = path.join(rootDir, "public", "rss.xml");

const CHANNEL = {
  title: "CorteQS Blog",
  description:
    "Yurt dışındaki Türk diasporası için ülke ve şehir rehberleri, yaşam, kariyer ve topluluk yazıları.",
  // /blog bir 301 kaynağıdır (src/lib/redirects.ts → /radar/rehberler); kanal linki
  // yönlendirme zincirine değil hedefe işaret eder.
  link: `${SITE_ORIGIN}/radar/rehberler`,
  feedUrl: `${SITE_ORIGIN}/rss.xml`,
  language: "tr",
};

/** ISO tarih → RFC-822 (RSS pubDate). Geçersiz tarihte null. */
function toRfc822(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

function renderItem(post) {
  const url = `${SITE_ORIGIN}/blog/${encodeURIComponent(post.slug)}`;
  const pubDate = toRfc822(post.published_at ?? post.updated_at);
  const lines = [
    "    <item>",
    `      <title>${escapeXml(post.title ?? post.slug)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
  ];
  if (post.excerpt) lines.push(`      <description>${escapeXml(post.excerpt)}</description>`);
  if (post.category_label) lines.push(`      <category>${escapeXml(post.category_label)}</category>`);
  if (pubDate) lines.push(`      <pubDate>${pubDate}</pubDate>`);
  lines.push("    </item>");
  return lines.join("\n");
}

/**
 * @param {Array<{slug:string,title?:string,excerpt?:string,category_label?:string,published_at?:string|null,updated_at?:string}>} posts
 * @returns {string} RSS 2.0 XML
 */
function buildRss(posts) {
  const items = posts
    .filter((p) => p?.slug)
    .slice()
    .sort((a, b) =>
      String(b.published_at ?? b.updated_at ?? "").localeCompare(
        String(a.published_at ?? a.updated_at ?? ""),
      ),
    );

  const newest = items.length > 0 ? toRfc822(items[0].published_at ?? items[0].updated_at) : null;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(CHANNEL.title)}</title>`,
    `    <link>${escapeXml(CHANNEL.link)}</link>`,
    `    <description>${escapeXml(CHANNEL.description)}</description>`,
    `    <language>${CHANNEL.language}</language>`,
    `    <atom:link href="${escapeXml(CHANNEL.feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...(newest ? [`    <lastBuildDate>${newest}</lastBuildDate>`] : []),
    ...items.map(renderItem),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

async function main() {
  await loadEnvLocal();
  const env = supabaseEnv();
  if (!env) {
    console.warn("[rss] Supabase env yok — mevcut rss.xml korunuyor.");
    return;
  }

  const endpoint =
    `${env.url}/rest/v1/blog_posts` +
    "?select=slug,title,excerpt,category_label,published_at,updated_at" +
    "&published=eq.true&order=published_at.desc.nullslast";
  const rows = await fetchAllRows(endpoint, env.key, "blog_posts");
  if (!rows) {
    console.warn("[rss] blog_posts okunamadı — mevcut rss.xml korunuyor.");
    return;
  }
  if (rows.length === 0) {
    console.warn("[rss] 0 yayınlanmış yazı döndü — mevcut rss.xml korunuyor.");
    return;
  }

  await writeFile(OUTPUT, buildRss(rows), "utf8");
  console.log(`[rss] public/rss.xml yazıldı (${rows.length} yazı).`);
}

// Yalnız doğrudan çalıştırıldığında üret; testlerde import edilince ağa çıkmaz.
const calistirilanDosya = process.argv[1] ? path.resolve(process.argv[1]) : "";
const buDosya = path.resolve(fileURLToPath(import.meta.url));

if (calistirilanDosya === buDosya) {
  main().catch((error) => {
    console.warn("[rss] üretim başarısız, mevcut rss.xml korunuyor:", error?.message ?? error);
    process.exit(0);
  });
}

// Test yüzeyi — bkz. scripts/generate-rss.test.mjs
export { buildRss, toRfc822, CHANNEL };
