// scripts/generate-llms-full.mjs
// public/llms-full.txt'u üretir — AI agent'lar için genişletilmiş referans dosyası.
//
// llms.txt (64 satır) site haritası düzeyindeyken llms-full.txt her sayfa için
// 2-3 cümle özet, blog yazıları, SSS ve servis tanımı içerir. Build sırasında
// çalışır; Supabase erişilemezse blog bölümü atlanır (build kırılmaz).
//
// Kullanım:
//   node scripts/generate-llms-full.mjs          # yaz
//   node scripts/generate-llms-full.mjs --check  # bayatsa exit 1 (CI)
//
// Kaynaklar:
//   - public/llms.txt (temel yapı)
//   - public/ai/faq.json (SSS)
//   - public/ai/service.json (servis tanımı)
//   - Supabase blog_posts (yayınlanmış yazılar)

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const OUTPUT = path.join(rootDir, "public", "llms-full.txt");
const LLMS_TXT = path.join(rootDir, "public", "llms.txt");
const FAQ_JSON = path.join(rootDir, "public", "ai", "faq.json");
const SERVICE_JSON = path.join(rootDir, "public", "ai", "service.json");

const SITE_ORIGIN = "https://corteqs.net";
const PAGE_SIZE = 1000;
const FETCH_TIMEOUT_MS = 15_000;

function supabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

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
          "Range-Unit": "items",
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        console.warn(`[llms-full] ${label} fetch ${res.status} — atlandı.`);
        return null;
      }
      const batch = await res.json();
      if (!Array.isArray(batch)) {
        console.warn(`[llms-full] ${label} beklenmeyen yanıt — atlandı.`);
        return null;
      }
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    } catch (error) {
      console.warn(`[llms-full] ${label} fetch hatası — atlandı:`, error?.name ?? error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
  return rows;
}

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
    // .env.local yoksa sorun değil
  }
}

async function getBlogPosts() {
  const env = supabaseEnv();
  if (!env) {
    console.warn("[llms-full] Supabase env yok — blog yazıları atlandı.");
    return [];
  }
  const endpoint = `${env.url}/rest/v1/blog_posts?select=slug,title,excerpt,country_label,category_label,published_at&published=eq.true&order=sort_order.asc,published_at.desc`;
  const rows = await fetchAllRows(endpoint, env.key, "blog_posts");
  return rows ?? [];
}

async function getFaqQuestions() {
  try {
    const raw = await readFile(FAQ_JSON, "utf8");
    const parsed = JSON.parse(raw);
    return (parsed.mainEntity ?? []).map((q) => ({
      question: q.name,
      answer: q.acceptedAnswer?.text,
    }));
  } catch {
    console.warn("[llms-full] faq.json okunamadı — SSS atlandı.");
    return [];
  }
}

async function getServiceDescription() {
  try {
    const raw = await readFile(SERVICE_JSON, "utf8");
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name,
      description: parsed.description,
      serviceType: parsed.serviceType,
      areas: (parsed.areaServed ?? [])
        .map((a) => a.name)
        .filter(Boolean),
      audience: parsed.audience?.audienceType,
    };
  } catch {
    console.warn("[llms-full] service.json okunamadı — servis tanımı atlandı.");
    return null;
  }
}

function buildFullContent(llmsTxtBase, blogPosts, faqQuestions, service) {
  const sections = [];

  sections.push(llmsTxtBase.trimEnd());

  if (service) {
    sections.push(`

## Platform Detayları

**Servis:** ${service.name}
**Tür:** ${service.serviceType}
**Açıklama:** ${service.description}
${service.audience ? `**Hedef kitle:** ${service.audience}` : ""}
${service.areas.length > 0 ? `**Aktif bölgeler:** ${service.areas.join(", ")}` : ""}`);
  }

  if (blogPosts.length > 0) {
    const byCountry = {};
    for (const post of blogPosts) {
      const country = post.country_label || "Genel";
      if (!byCountry[country]) byCountry[country] = [];
      byCountry[country].push(post);
    }

    sections.push("\n\n## Blog Yazıları — Ülke Rehberleri\n");
    for (const [country, posts] of Object.entries(byCountry)) {
      sections.push(`### ${country}\n`);
      for (const post of posts) {
        const url = `${SITE_ORIGIN}/blog/${post.slug}`;
        const excerpt = post.excerpt ? ` — ${post.excerpt}` : "";
        const category = post.category_label ? ` [${post.category_label}]` : "";
        sections.push(`- [${post.title}](${url})${category}${excerpt}\n`);
      }
    }
  }

  if (faqQuestions.length > 0) {
    sections.push("\n## Sık Sorulan Sorular\n");
    for (const faq of faqQuestions) {
      sections.push(`**S:** ${faq.question}`);
      sections.push(`**C:** ${faq.answer}\n`);
    }
  }

  sections.push(`
## AI Agent Entegrasyonu

Bu dosya CorteQS platformunun AI agent'lar için genişletilmiş referansıdır.
- \`/llms.txt\` — Kısa site haritası (bu dosyanın özeti)
- \`/ai/faq.json\` — Yapılandırılmış SSS (JSON-LD FAQPage)
- \`/ai/service.json\` — Servis tanımı (JSON-LD Service)
- \`/ai/summary.json\` — Site özeti (JSON-LD WebSite)
- \`/sitemap.xml\` — Tüm URL'ler (XML)

## İletişim

- E-posta: info@corteqs.net
- LinkedIn: https://www.linkedin.com/company/corteqs-global
- X (Twitter): https://x.com/corteqsx
- Instagram: https://www.instagram.com/corteqssocial
`);

  return sections.join("");
}

async function main() {
  await loadEnvLocal();

  const [llmsTxtBase, blogPosts, faqQuestions, service] = await Promise.all([
    readFile(LLMS_TXT, "utf8"),
    getBlogPosts(),
    getFaqQuestions(),
    getServiceDescription(),
  ]);

  const next = buildFullContent(llmsTxtBase, blogPosts, faqQuestions, service);
  const current = await readFile(OUTPUT, "utf8").catch(() => null);

  if (process.argv.includes("--check")) {
    if (current === next) {
      console.log("[llms-full] llms-full.txt güncel.");
      return;
    }
    console.error("[llms-full] llms-full.txt bayat — `node scripts/generate-llms-full.mjs` çalıştırın.");
    process.exit(1);
  }

  if (current === next) {
    console.log("[llms-full] değişiklik yok.");
    return;
  }

  await writeFile(OUTPUT, next, "utf8");
  const lineCount = next.split("\n").length;
  console.log(
    `[llms-full] ${lineCount} satır yazıldı → public/llms-full.txt ` +
      `(blog: ${blogPosts.length}, SSS: ${faqQuestions.length})`,
  );
}

const calistirilanDosya = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (calistirilanDosya === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error("[llms-full] hata:", error?.message ?? error);
    process.exit(1);
  });
}

export { buildFullContent, getBlogPosts, getFaqQuestions, getServiceDescription };
