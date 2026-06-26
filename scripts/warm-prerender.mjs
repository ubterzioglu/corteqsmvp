// scripts/warm-prerender.mjs
// Prerender cache'ini sitemap.xml'deki tüm URL'leri bot User-Agent'ı ile bir kez
// çağırarak önceden ısıtır. Böylece bir sayfa İLK kez paylaşıldığında (WhatsApp/
// LinkedIn/X/Google) prerender soğuk-render gecikmesi (~3 sn) yaşanmaz; herkes
// için ~0.2 sn'lik sıcak cache'ten yanıt döner.
//
// Tasarım: bağımlılıksız (yalnızca Node built-in fetch). Hata toleranslı — tek tek
// URL hataları toplam akışı kırmaz, yalnızca raporlanır. CI/postdeploy'da güvenle koşar.
//
// Usage:
//   node scripts/warm-prerender.mjs                      # public/sitemap.xml'i ısıt
//   SITE_ORIGIN=https://corteqs.net node scripts/warm-prerender.mjs
//   node scripts/warm-prerender.mjs --concurrency=4 --timeout=30000
//   node scripts/warm-prerender.mjs --sitemap=https://corteqs.net/sitemap.xml

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// --- CLI argümanları ---------------------------------------------------------
const args = new Map(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), "true"];
  }),
);

const SITE_ORIGIN = (process.env.SITE_ORIGIN ?? "https://corteqs.net").replace(/\/+$/, "");
// Sitemap kaynağı: ya yerel dosya (varsayılan) ya da uzaktan URL (--sitemap=https://...).
const SITEMAP_ARG = args.get("sitemap") ?? "";
const LOCAL_SITEMAP = path.join(rootDir, "public", "sitemap.xml");
const CONCURRENCY = Math.max(1, Number.parseInt(args.get("concurrency") ?? "4", 10));
const TIMEOUT_MS = Math.max(5000, Number.parseInt(args.get("timeout") ?? "30000", 10));
// prerender katmanını tetikleyen bot UA (server.mjs botUserAgentPattern ile eşleşir).
const BOT_UA = "Googlebot/2.1 (+http://www.google.com/bot.html) corteqs-prerender-warmer";

// --- sitemap'ten <loc> URL'lerini çıkar -------------------------------------
function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  // Aynı URL birden fazla kez geçebilir (image sitemap vb.) — tekilleştir.
  return [...new Set(locs)];
}

async function loadSitemap() {
  if (SITEMAP_ARG.startsWith("http")) {
    const res = await fetch(SITEMAP_ARG, { headers: { "User-Agent": BOT_UA } });
    if (!res.ok) throw new Error(`Sitemap fetch failed: HTTP ${res.status} (${SITEMAP_ARG})`);
    return res.text();
  }
  return readFile(LOCAL_SITEMAP, "utf8");
}

// --- tek bir URL'i ısıt ------------------------------------------------------
async function warmOne(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = process.hrtime.bigint();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": BOT_UA },
      redirect: "follow",
      signal: controller.signal,
    });
    // Yanıt gövdesini tüket ki bağlantı tam kapansın (prerender render'ı bitsin).
    await res.arrayBuffer();
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const prerendered = res.headers.get("x-prerendered") === "1";
    return { url, ok: res.ok, status: res.status, ms, prerendered };
  } catch (error) {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    return { url, ok: false, status: 0, ms, prerendered: false, error: error?.name ?? String(error) };
  } finally {
    clearTimeout(timer);
  }
}

// --- sınırlı eşzamanlılıkla havuz işle --------------------------------------
async function runPool(urls, concurrency, worker) {
  const results = new Array(urls.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= urls.length) return;
      results[index] = await worker(urls[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

// --- ana akış ----------------------------------------------------------------
async function main() {
  let xml;
  try {
    xml = await loadSitemap();
  } catch (error) {
    console.error(`[warm-prerender] Sitemap okunamadı: ${error?.message ?? error}`);
    process.exitCode = 1;
    return;
  }

  let urls = extractLocs(xml);
  // Yerel dosyadaki origin farklıysa (örn. dosyada corteqs.net, SITE_ORIGIN başka)
  // hedefi SITE_ORIGIN'e normalize et — böylece staging/prod'a yönlendirilebilir.
  urls = urls.map((u) => {
    try {
      const parsed = new URL(u);
      return SITE_ORIGIN + parsed.pathname + parsed.search;
    } catch {
      return u;
    }
  });

  if (urls.length === 0) {
    console.error("[warm-prerender] Sitemap'te <loc> bulunamadı; ısıtılacak URL yok.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `[warm-prerender] ${urls.length} URL ısıtılıyor → ${SITE_ORIGIN} ` +
      `(eşzamanlılık=${CONCURRENCY}, timeout=${TIMEOUT_MS}ms, UA=bot)`,
  );

  const results = await runPool(urls, CONCURRENCY, warmOne);

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const prerendered = results.filter((r) => r.prerendered);
  const avgMs = ok.length ? ok.reduce((s, r) => s + r.ms, 0) / ok.length : 0;
  const slow = [...results].sort((a, b) => b.ms - a.ms).slice(0, 5);

  console.log(
    `[warm-prerender] Bitti: ${ok.length}/${results.length} OK · ` +
      `${prerendered.length} prerendered (X-Prerendered:1) · ` +
      `ortalama ${avgMs.toFixed(0)}ms`,
  );

  if (slow.length) {
    console.log("[warm-prerender] En yavaş 5:");
    for (const r of slow) {
      console.log(
        `  ${r.ms.toFixed(0).padStart(6)}ms  HTTP ${r.status}` +
          `${r.prerendered ? " [PR]" : ""}  ${r.url}`,
      );
    }
  }

  if (failed.length) {
    console.warn(`[warm-prerender] ${failed.length} URL ısıtılamadı:`);
    for (const r of failed) {
      console.warn(`  HTTP ${r.status} ${r.error ? `(${r.error})` : ""}  ${r.url}`);
    }
    // Isıtma başarısızlığı deploy'u kırmamalı (best-effort). Uyarı kodu döndür ama
    // postdeploy zincirini bozma; CI isterse exit code'a bakabilir.
    process.exitCode = 0;
  }
}

await main();
