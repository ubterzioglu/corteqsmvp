// scripts/generate-ai-faq.mjs
// public/ai/faq.json'u index.html'deki FAQPage JSON-LD'sinden ÜRETİR.
//
// Neden: faq.json eskiden elle yazılmış 3 soruydu; index.html'de 12 soru vardı ve elle yazılan
// bir cevap ürün modeliyle doğrulanmamıştı. Tek kaynak index.html'dir. Bu betik index.html'i
// YALNIZ OKUR (JSON-LD'ye dokunmak yasak — CLAUDE.md), çıktıyı public/ai/faq.json'a yazar.
//
// Kullanım:
//   node scripts/generate-ai-faq.mjs          # yaz
//   node scripts/generate-ai-faq.mjs --check  # bayatsa exit 1 (CI/doğrulama)
//
// Çıktı ham UTF-8'dir (\uXXXX kaçışı yok): Türkçe karakterler korunur.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const INDEX_HTML = path.join(rootDir, "index.html");
const OUTPUT = path.join(rootDir, "public", "ai", "faq.json");

function findFaqPage(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findFaqPage(item);
      if (hit) return hit;
    }
    return null;
  }
  if (node["@type"] === "FAQPage") return node;
  for (const value of Object.values(node)) {
    const hit = findFaqPage(value);
    if (hit) return hit;
  }
  return null;
}

/** HTML içindeki application/ld+json bloklarından FAQPage düğümünü çıkarır; yoksa FIRLATIR. */
export function extractFaqPage(html) {
  const blocks = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((match) => match[1]);

  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(block);
    } catch {
      continue; // bozuk bir blok diğerlerini engellemesin
    }
    const faq = findFaqPage(parsed);
    if (faq) return faq;
  }
  throw new Error("index.html içinde FAQPage JSON-LD bulunamadı");
}

/** Yayınlanacak faq.json metni (kararlı biçim: 2 boşluk, sonda satır sonu, ham UTF-8). */
export function buildFaqJson(faqPage) {
  const questions = (faqPage.mainEntity ?? []).map((question) => ({
    "@type": "Question",
    name: question.name,
    acceptedAnswer: { "@type": "Answer", text: question.acceptedAnswer?.text },
  }));
  const body = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions };
  return `${JSON.stringify(body, null, 2)}\n`;
}

async function main() {
  const html = await readFile(INDEX_HTML, "utf8");
  const next = buildFaqJson(extractFaqPage(html));
  const current = await readFile(OUTPUT, "utf8").catch(() => null);

  if (process.argv.includes("--check")) {
    if (current === next) {
      console.log("[ai-faq] faq.json güncel.");
      return;
    }
    console.error("[ai-faq] faq.json bayat — `node scripts/generate-ai-faq.mjs` çalıştırın.");
    process.exit(1);
  }

  if (current === next) {
    console.log("[ai-faq] değişiklik yok.");
    return;
  }
  await writeFile(OUTPUT, next, "utf8");
  console.log(`[ai-faq] ${JSON.parse(next).mainEntity.length} soru yazıldı → public/ai/faq.json`);
}

const calistirilanDosya = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (calistirilanDosya === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error("[ai-faq] hata:", error?.message ?? error);
    process.exit(1);
  });
}
