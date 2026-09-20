// Orphan (linki olmayan) sayfa analizi — CorteQS
// 1) Tüm <Route path> ağacını nesting-aware çözer (App.tsx + */routes.tsx)
// 2) Kaynak ağacındaki TÜM iç bağlantı hedeflerini toplar (to=, href=, navigate(), window.location, nav registry)
// 3) Kesişimi alır: hangi rotaya hiçbir yerden link yok?

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

// Depo kökü script konumundan türetilir (docs/audits/ -> ../..), böylece
// herhangi bir makinede/klonda çalışır. JSON çıktısı geçici dizine yazılır —
// depo köküne DOSYA BIRAKMAZ (CLAUDE.md: "Do not add new files to the repo root").
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = join(ROOT, "src");
const OUT = tmpdir();

// ---------- yardımcılar ----------
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "__snapshots__") continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
}

const allFiles = walk(SRC).filter((f) => /\.(tsx?|ts)$/.test(f));
const codeFiles = allFiles.filter((f) => !/\.test\.(ts|tsx)$/.test(f) && !/[\\/]test[\\/]/.test(f));

// ---------- 1) ROTA AĞACI ----------
// <Route ...> açılış etiketinin sonunu bul (süslü parantez + quote durumunu izler)
function findTagEnd(text, start) {
  let i = start;
  let depth = 0;
  let quote = null;
  while (i < text.length) {
    const c = text[i];
    if (quote) {
      if (c === "\\") { i += 2; continue; }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; i++; continue; }
    if (c === "{") { depth++; i++; continue; }
    if (c === "}") { depth--; i++; continue; }
    if (c === ">" && depth === 0) {
      // self-closing mi?
      let j = i - 1;
      while (j > start && /\s/.test(text[j])) j--;
      return { end: i, selfClosing: text[j] === "/" };
    }
    i++;
  }
  return null;
}

function extractPathAttr(tagText) {
  // path="x"  |  path={"x"}  |  path={from}
  let m = tagText.match(/\bpath\s*=\s*"([^"]*)"/);
  if (m) return m[1];
  m = tagText.match(/\bpath\s*=\s*\{\s*"([^"]*)"\s*\}/);
  if (m) return m[1];
  m = tagText.match(/\bpath\s*=\s*\{([^}]*)\}/);
  if (m) return `«dinamik:${m[1].trim()}»`;
  return null; // index route
}

function extractElementName(tagText) {
  const idx = tagText.search(/element\s*=\s*\{/);
  if (idx === -1) return null;
  const names = [...tagText.slice(idx).matchAll(/<\s*([A-Z][A-Za-z0-9_.]*)/g)].map((m) => m[1]);
  for (const n of names) if (!WRAPPERS.has(n)) return n;
  return names[0] || null;
}

function isNavigateOnly(tagText) {
  return /element\s*=\s*\{\s*<\s*Navigate\b/.test(tagText);
}
function navigateTarget(tagText) {
  const m = tagText.match(/<\s*Navigate[^>]*\bto\s*=\s*"([^"]*)"/);
  return m ? m[1] : null;
}

function joinPath(parent, child) {
  if (child === null) return parent || "/";
  if (child.startsWith("/")) return child;
  const base = (parent || "").replace(/\/$/, "");
  return `${base}/${child}`;
}

// Bir dosyadaki Route ağacını çöz; verilen parentPrefix ile başlar.
// Satir-ici ve blok yorumlari ayni uzunlukta bosluga cevirir (pozisyon/satir korunur)
const NL = String.fromCharCode(10);
function stripComments(src) {
  let out = src.split("");
  let i = 0, state = "code", quote = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (state === "code") {
      if (quote) {
        if (c === "\\") { i += 2; continue; }
        if (c === quote) quote = null;
        i++; continue;
      }
      if (c === '"' || c === "'" || c === "`") { quote = c; i++; continue; }
      if (c === "/" && n === "/") { state = "line"; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (c === "/" && n === "*") { state = "block"; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      i++; continue;
    }
    if (state === "line") {
      if (c === NL) { state = "code"; i++; continue; }
      out[i] = " "; i++; continue;
    }
    if (state === "block") {
      if (c === "*" && n === "/") { out[i] = " "; out[i + 1] = " "; state = "code"; i += 2; continue; }
      if (c !== NL) out[i] = " ";
      i++; continue;
    }
  }
  return out.join("");
}

const WRAPPERS = new Set(["Suspense", "RequireAuth", "RequireFeature", "React.Suspense", "ErrorBoundary", "SectionErrorBoundary"]);

function parseRoutes(file, parentPrefix = "") {
  const text = stripComments(readFileSync(file, "utf8"));
  const events = [];
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith("<Route", i) && !/[A-Za-z0-9_]/.test(text[i + 6] || "")) {
      const r = findTagEnd(text, i + 6);
      if (!r) continue;
      events.push({ pos: i, kind: "open", tag: text.slice(i, r.end + 1), selfClosing: r.selfClosing, line: text.slice(0, i).split("\n").length });
      i = r.end;
    } else if (text.startsWith("</Route>", i)) {
      events.push({ pos: i, kind: "close" });
      i += 7;
    }
  }
  const stack = [parentPrefix];
  const routes = [];
  for (const ev of events) {
    if (ev.kind === "open") {
      const raw = extractPathAttr(ev.tag);
      const full = joinPath(stack[stack.length - 1], raw);
      const hasLayoutOnly = !extractElementName(ev.tag) && raw === null;
      routes.push({
        file: relative(ROOT, file).replace(/\\/g, "/"),
        line: ev.line,
        path: full,
        rawPath: raw,
        element: extractElementName(ev.tag),
        isRedirect: isNavigateOnly(ev.tag),
        redirectTo: navigateTarget(ev.tag),
        isLayout: !ev.selfClosing,
        indexRoute: raw === null,
        hasLayoutOnly,
      });
      if (!ev.selfClosing) stack.push(full);
    } else {
      if (stack.length > 1) stack.pop();
    }
  }
  return routes;
}

// App.tsx + alt modüller. Alt modüller App.tsx'e {adminRoutes} gibi gömülüyor;
// admin/routes.tsx kendi içinde "/admin" absolute başlıyor, alt modüller ona relative.
const routeFiles = [
  ["src/App.tsx", ""],
  ["src/pages/admin/routes.tsx", ""],
  ["src/pages/admin/muhasebe/routes.tsx", "/admin"],
  ["src/pages/admin/cadde/routes.tsx", "/admin"],
  ["src/pages/admin/radar/routes.tsx", "/admin"],
  ["src/pages/admin/relocation/routes.tsx", "/admin"],
  ["src/pages/admin/service-finder/routes.tsx", "/admin"],
  ["src/pages/admin/workshop/routes.tsx", "/admin"],
];

let routes = [];
for (const [rf, prefix] of routeFiles) {
  routes = routes.concat(parseRoutes(join(ROOT, rf), prefix));
}

// ---------- 2) LEGACY REDIRECTS ----------
const redirectsSrc = readFileSync(join(SRC, "lib/redirects.ts"), "utf8");
const legacyFroms = [...redirectsSrc.matchAll(/from:\s*"([^"]+)"/g)].map((m) => m[1]);
const legacyTos = [...redirectsSrc.matchAll(/\bto:\s*"([^"]+)"/g)].map((m) => m[1]);

// ---------- 3) LİNK HEDEFLERİ ----------
const linkTargets = new Map(); // path -> [{file,line}]
function addTarget(p, file, line) {
  if (!p) return;
  let t = p.trim();
  if (!t.startsWith("/")) return;
  // Template literal interpolasyonu: ${...} iceren SEGMENTI tamamen jokere cevir.
  // /admin/workspace/docs/${page.slug} -> /admin/workspace/docs/«p»
  // /login${location.search}          -> /login  (son ek query/hash tasiyor)
  if (t.includes("${")) {
    t = t
      .split("/")
      .map((seg) => {
        if (!seg.includes("${")) return seg;
        // segment tamamen interpolasyon mu, yoksa sabit bir onek tasiyor mu?
        const prefix = seg.slice(0, seg.indexOf("${"));
        return prefix && /^[A-Za-z0-9_-]+$/.test(prefix) ? prefix : "«p»";
      })
      .join("/");
  }
  t = t.split("#")[0].split("?")[0];
  if (t.length > 1) t = t.replace(/\/$/, "");
  if (!linkTargets.has(t)) linkTargets.set(t, []);
  linkTargets.get(t).push({ file: relative(ROOT, file).replace(/\\/g, "/"), line });
}

const patterns = [
  /\bto\s*=\s*"(\/[^"]*)"/g,
  /\bto\s*=\s*\{\s*"(\/[^"]*)"\s*\}/g,
  /\bto\s*=\s*\{\s*`(\/[^`]*)`\s*\}/g,
  /\bhref\s*=\s*"(\/[^"]*)"/g,
  /\bhref\s*=\s*\{\s*`(\/[^`]*)`\s*\}/g,
  /\bnavigate\s*\(\s*"(\/[^"]*)"/g,
  /\bnavigate\s*\(\s*`(\/[^`]*)`/g,
  /\bto:\s*"(\/[^"]*)"/g,
  /\bto:\s*`(\/[^`]*)`/g,
  /\bpath:\s*"(\/[^"]*)"/g,
  /\bpath:\s*`(\/[^`]*)`/g,
  /\bhref:\s*"(\/[^"]*)"/g,
  /\bhref:\s*`(\/[^`]*)`/g,
  /\bto\s*=\s*\{\s*"(\/[^"]*)"\s*\+/g,
  /\bmatch:\s*\[\s*"(\/[^"]*)"/g,
  /\burl:\s*"(\/[^"]*)"/g,
  /\broute:\s*"(\/[^"]*)"/g,
  /location\.href\s*=\s*"(\/[^"]*)"/g,
  /location\.assign\(\s*"(\/[^"]*)"/g,
  /window\.open\(\s*"(\/[^"]*)"/g,
  /corteqs\.net(\/[A-Za-z0-9_\-/]*)/g,
];

const routePathSet = new Set(routes.map((r) => r.path));

for (const file of codeFiles) {
  const text = readFileSync(file, "utf8");
  const isRouteFile = routeFiles.some(([rf]) => file.endsWith(rf.replace(/\//g, "\\")) || file.replace(/\\/g, "/").endsWith(rf));
  const lines = text.split("\n");
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      // Route tanım dosyalarında path= kendi tanımı; sadece Navigate to= sayılır
      const upto = text.slice(0, m.index);
      const line = upto.split("\n").length;
      if (isRouteFile) {
        const ctx = lines[line - 1] || "";
        if (/<Route/.test(ctx) && !/Navigate/.test(ctx)) continue;
      }
      addTarget(m[1], file, line);
    }
  }
}

// sitemap STATIC_ROUTES
const sitemapSrc = readFileSync(join(ROOT, "scripts/generate-sitemap.mjs"), "utf8");
const sitemapRoutes = [...sitemapSrc.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]);

// ---------- 4) EŞLEŞTİRME ----------
function paramPattern(p) {
  return new RegExp("^" + p.replace(/:[A-Za-z0-9_]+/g, "[^/]+").replace(/\*/g, ".*") + "$");
}

const report = [];
for (const r of routes) {
  if (r.path === "*" || r.path.endsWith("/*")) continue;
  const hasParam = /:/.test(r.path);
  let hits = [];
  if (linkTargets.has(r.path)) hits = hits.concat(linkTargets.get(r.path));
  if (hasParam) {
    const re = paramPattern(r.path);
    for (const [t, locs] of linkTargets) {
      if (t !== r.path && re.test(t)) hits = hits.concat(locs);
    }
  }
  report.push({ ...r, hits, hasParam, inSitemap: sitemapRoutes.includes(r.path), isLegacyTarget: legacyTos.includes(r.path) });
}

writeFileSync(
  join(OUT, "orphan-report.json"),
  JSON.stringify({ routes: report, linkTargets: [...linkTargets.entries()].map(([k, v]) => ({ path: k, count: v.length, where: v })), legacyFroms, legacyTos, sitemapRoutes }, null, 2)
);

// ---------- ÖZET ----------
const real = report.filter((r) => !r.isRedirect && !r.indexRoute && r.element);
const orphans = real.filter((r) => r.hits.length === 0);

// ZAYIF DEĞİNME: path string'i kaynakta hiç geçiyor mu? (rota tanımı / meta / seo / sitemap hariç)
// Amaç: "gerçekten hiç bilinmiyor" ile "biliniyor ama link yok" ayrımını yapmak.
const EXCLUDE_WEAK = /(App\.tsx|routes\.tsx|admin-route-meta\.ts|page-seo\.ts|redirects\.ts|generate-sitemap|tools-catalog\.generated|prerender)/;
const weakFiles = codeFiles.filter((f) => !EXCLUDE_WEAK.test(f.replace(/\\/g, "/")));
const weakCache = weakFiles.map((f) => ({ f: relative(ROOT, f).replace(/\\/g, "/"), text: readFileSync(f, "utf8") }));
for (const o of orphans) {
  const needle = o.path.replace(/:[A-Za-z0-9_]+/g, "");
  o.weak = [];
  for (const { f, text } of weakCache) {
    const idx = text.indexOf(o.path.split("/:")[0]);
    if (idx !== -1 && o.path.split("/:")[0].length > 6) {
      o.weak.push(f + ":" + text.slice(0, idx).split(NL).length);
      if (o.weak.length >= 3) break;
    }
  }
}

console.log("TOPLAM Route düğümü:", routes.length);
console.log("Gerçek sayfa rotası (redirect/index/layout hariç):", real.length);
console.log("Hiç link almayan (ORPHAN):", orphans.length);
console.log("\n--- ORPHAN LİSTESİ ---");
for (const o of orphans.sort((a, b) => a.path.localeCompare(b.path))) {
  const flags = [o.hasParam ? "param" : null, o.inSitemap ? "SITEMAP" : null, o.isLegacyTarget ? "legacy-hedef" : null].filter(Boolean).join(",");
  console.log(`${o.path}\t${o.element}\t${o.file}:${o.line}${flags ? "\t[" + flags + "]" : ""}${o.weak && o.weak.length ? "\n      zayif-deginme: " + o.weak.join(", ") : "\n      zayif-deginme: YOK"}`);
}

// Link var ama rota yok = kırık link
console.log("\n--- KIRIK LİNK ADAYLARI (link var, rota yok) ---");
const allRoutePatterns = routes.filter((r) => !r.path.includes("*")).map((r) => ({ p: r.path, re: paramPattern(r.path) }));
const broken = [];
for (const [t, locs] of linkTargets) {
  if (t.startsWith("//") || /^\/(assets|api|images|videos)/.test(t)) continue;
  const ok = allRoutePatterns.some((rp) => rp.p === t || rp.re.test(t)) || legacyFroms.includes(t) || t === "/";
  if (!ok) broken.push({ t, locs });
}
for (const b of broken.sort((a, b) => a.t.localeCompare(b.t))) {
  console.log(`${b.t}\t<- ${b.locs.slice(0, 3).map((l) => l.file + ":" + l.line).join(", ")}${b.locs.length > 3 ? ` (+${b.locs.length - 3})` : ""}`);
}
console.log("\nJSON:", join(OUT, "orphan-report.json"));
