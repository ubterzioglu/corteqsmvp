// scripts/export-blog-md.mjs
// blog_posts tablosundaki TÜM makaleleri (taslaklar dahil) markdown dosyalarına export eder.
// Her dosya: YAML frontmatter (metadata) + content_markdown gövdesi.
// Amaç: yeni makale yazarken referans/şablon olarak kullanmak.
//
// Kullanım:
//   node scripts/export-blog-md.mjs
//   node scripts/export-blog-md.mjs --env-file=.env.local --out=docs/exports/blog-md
//   node scripts/export-blog-md.mjs --published-only
//
// Gerekli: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (taslakları da çekmek için service role).
// --published-only verilirse anon anahtarla (VITE_SUPABASE_ANON_KEY) da çalışabilir.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env-file="));
const outArg = args.find((arg) => arg.startsWith("--out="));
const singleArg = args.find((arg) => arg.startsWith("--single="));
const publishedOnly = args.includes("--published-only");
// --single ile tüm makaleler tek bir dosyada toplanır (ayrı dosyalar yine de yazılır, eskiler silinmez).
const single = args.includes("--single") || Boolean(singleArg);

const envFilePath = path.resolve(projectRoot, envArg ? envArg.slice("--env-file=".length) : ".env.local");
// Varsayılan çıktı yolu 2026-08-04'te kök `exports/` yerine `docs/exports/` oldu.
const outDir = path.resolve(projectRoot, outArg ? outArg.slice("--out=".length) : "docs/exports/blog-md");
const singleFilePath = path.resolve(
  projectRoot,
  singleArg ? singleArg.slice("--single=".length) : "docs/exports/blog-md/all-articles.md"
);

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadEnv() {
  try {
    const content = await readFile(envFilePath, "utf8");
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

async function createSupabaseClient() {
  const env = await loadEnv();
  const supabaseUrl =
    process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL (veya VITE_SUPABASE_URL) gerekli.");
  }

  // Taslakları da çekmek için service role şart. --published-only ise anon yeterli.
  const key = serviceRoleKey || (publishedOnly ? anonKey : null);
  if (!key) {
    throw new Error(
      publishedOnly
        ? "SUPABASE_SERVICE_ROLE_KEY veya VITE_SUPABASE_ANON_KEY gerekli."
        : "Tüm makaleler için SUPABASE_SERVICE_ROLE_KEY gerekli. (Sadece yayındakiler için --published-only kullanın.)"
    );
  }

  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// YAML string değerini güvenli şekilde quote'lar (tek tırnak; içteki ' iki katlanır).
function yamlString(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

function buildFrontmatter(post) {
  const lines = ["---"];
  const fields = [
    ["slug", yamlString(post.slug)],
    ["title", yamlString(post.title)],
    ["excerpt", yamlString(post.excerpt)],
    ["country", yamlString(post.country)],
    ["country_label", yamlString(post.country_label)],
    ["category", yamlString(post.category)],
    ["category_label", yamlString(post.category_label)],
    ["cover_image", post.cover_image ? yamlString(post.cover_image) : "null"],
    ["published", post.published ? "true" : "false"],
    ["published_at", post.published_at ? yamlString(post.published_at) : "null"],
    ["sort_order", String(post.sort_order ?? 0)],
    ["id", yamlString(post.id)],
    ["created_at", post.created_at ? yamlString(post.created_at) : "null"],
    ["updated_at", post.updated_at ? yamlString(post.updated_at) : "null"],
  ];
  for (const [key, val] of fields) {
    lines.push(`${key}: ${val}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildMarkdown(post) {
  const frontmatter = buildFrontmatter(post);
  const body = (post.content_markdown ?? "").trim();
  return `${frontmatter}\n\n# ${post.title}\n\n${body}\n`;
}

// Çakışmayı önlemek için slug yoksa id'den dosya adı türet.
function safeFileName(post, usedNames) {
  let base = (post.slug || post.id || "post").trim();
  base = base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "post";
  let name = base;
  let counter = 2;
  while (usedNames.has(name)) {
    name = `${base}-${counter}`;
    counter += 1;
  }
  usedNames.add(name);
  return `${name}.md`;
}

async function main() {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (publishedOnly) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Supabase sorgu hatası: ${error.message}`);
  }

  const posts = data ?? [];
  if (posts.length === 0) {
    console.log("INFO: Export edilecek makale bulunamadı.");
    return;
  }

  await mkdir(outDir, { recursive: true });

  const usedNames = new Set();
  const index = [];
  const combined = [];

  for (const post of posts) {
    const fileName = safeFileName(post, usedNames);
    const filePath = path.join(outDir, fileName);
    const markdown = buildMarkdown(post);
    // UTF-8 BOM ekleme: .md dosyaları için gerekmiyor; editörler UTF-8'i doğru okur.
    await writeFile(filePath, markdown, "utf8");
    index.push({ fileName, title: post.title, country: post.country_label, published: post.published });
    combined.push(markdown.trim());
    console.log(`OK: ${fileName}${post.published ? "" : "  (taslak)"}`);
  }

  // Tek dosyada toplama: her makale "---" ayraçlı frontmatter'ıyla ardışık yazılır.
  if (single) {
    await mkdir(path.dirname(singleFilePath), { recursive: true });
    const header = `# Blog Makaleleri — Toplu (${posts.length} adet)\n`;
    const body = combined.join("\n\n---\n\n");
    await writeFile(singleFilePath, `${header}\n${body}\n`, "utf8");
    console.log(`OK: ${path.relative(projectRoot, singleFilePath)}  (tek dosya, ${posts.length} makale)`);
  }

  // Basit bir index dosyası.
  const indexLines = [
    `# Blog Makaleleri — Export (${posts.length} adet)`,
    "",
    ...index.map(
      (entry) =>
        `- [${entry.title}](${entry.fileName}) — ${entry.country}${entry.published ? "" : " _(taslak)_"}`
    ),
    "",
  ];
  await writeFile(path.join(outDir, "INDEX.md"), indexLines.join("\n"), "utf8");

  console.log(`\nTAMAM: ${posts.length} makale → ${outDir}`);
}

main().catch((err) => {
  console.error(`HATA: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
