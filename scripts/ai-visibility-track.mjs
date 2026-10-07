// scripts/ai-visibility-track.mjs
// AI visibility tracking — aylık marka görünürlüğünü ölçen manuel/yardımcı script.
//
// AI arama motorlarında (ChatGPT, Perplexity, Google AI Overviews, Gemini)
// CorteQS'in ne sıklıkta önerildiğini/alıntlandığını takip eder.
//
// Kullanım:
//   node scripts/ai-visibility-track.mjs                    # rapor oluştur
//   node scripts/ai-visibility-track.mjs --export-prompts   # prompt listesini yazdır
//   node scripts/ai-visibility-track.mjs --record <platform> <prompt-index> <found> [url] [sentiment]
//
// Kayıt formatı (JSONL): scripts/data/ai-visibility/<YYYY-MM>.jsonl
// Her satır: { "date", "platform", "promptIndex", "prompt", "found", "url", "sentiment", "notes" }
//
// Sentiment: 0-100 (0=çok olumsuz, 50=nötr, 100=çok olumlu)
// Found: "yes" | "no" | "partial"

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const DATA_DIR = path.join(rootDir, "scripts", "data", "ai-visibility");

// ── Prompt seti ─────────────────────────────────────────────────────────────
// 30 kategori sorgusu — AI sistemlerin diaspora/relocation tavsiyelerinde
// CorteQS'i ne sıklıkta önerdiğini ölçer. 3 gruba ayrılır:
//   1. Platform keşfi (CorteQS doğrudan aranıyor mu?)
//   2. İhtiyaç bazlı (kullanıcı bir sorun belirtiyor, CorteQS çözüm olarak gösteriliyor mu?)
//   3. Şehir/ülke bazlı (spesifik bir lokasyon için tavsiye ediliyor mu?)

const PROMPTS = [
  // ── Grup 1: Platform keşfi (1-10) ──
  "Türk diasporası için networking platformu öner",
  "yurt dışındaki Türkler için topluluk platformu",
  "diaspora network platformu tavsiye et",
  "Türk expat ağı var mı?",
  "yurt dışına taşınma danışmanı bulabileceğim platform",
  "global Türk topluluğu platformu",
  "diaspora connect platformları",
  "Türk danışman bulma platformu",
  "şehir bazlı diaspora ağı",
  "CorteQS nedir, ne işe yarar?",

  // ── Grup 2: İhtiyaç bazlı (11-20) ──
  "Almanya'ya taşınmak istiyorum, danışman lazım",
  "yurt dışında Türk avukat bulmam gerekiyor",
  "Almanya'da ev bulmak için yardım arıyorum",
  "vize başvurusu için danışman öner",
  "yurt dışında iş kurmak istiyorum, yardım lazım",
  "başka ülkede Türk vergi danışmanı bul",
  "relocation desteği alabileceğim bir platform var mı?",
  "yurt dışında Türk psikolog bulabilir miyim?",
  "expat olarak şehir rehberi nereden bulurum?",
  "yurt dışındaki Türk işletmelerini nasıl bulurum?",

  // ── Grup 3: Şehir/ülke bazlı (21-30) ──
  "Berlin'de Türk danışman öner",
  "Londra'da yaşayan Türklar için kaynaklar",
  "Amsterdam'da Türk topluluğu nasıl bulunur?",
  "Dubai'de Türk iş insanları ağı",
  "Münih'te Türk avukat lazım",
  "Paris'te Türk diaspora platformu",
  "New York'ta Türk expat topluluğu",
  "Viyana'da Türk danışman bul",
  "Köln'de Türk işletmeler listesi",
  "Hamburg'da Türk topluluk ağı",
];

const PLATFORMS = ["chatgpt", "perplexity", "google-ai", "gemini", "claude"];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function dataFilePath(monthKey) {
  return path.join(DATA_DIR, `${monthKey}.jsonl`);
}

async function readRecords(monthKey) {
  const filePath = dataFilePath(monthKey);
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

async function appendRecord(record) {
  await ensureDataDir();
  const monthKey = currentMonthKey();
  const filePath = dataFilePath(monthKey);
  const line = JSON.stringify(record) + "\n";
  const existing = await readFile(filePath, "utf8").catch(() => "");
  await writeFile(filePath, existing + line, "utf8");
}

function generateReport(records) {
  if (records.length === 0) {
    return "Henüz kayıt yok. `--record` ile veri ekleyin veya manuel olarak JSONL dosyasını doldurun.";
  }

  const byPlatform = {};
  for (const r of records) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = [];
    byPlatform[r.platform].push(r);
  }

  const lines = [];
  lines.push("# AI Visibility Raporu");
  lines.push(`Tarih: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Toplam kayıt: ${records.length}`);
  lines.push("");

  lines.push("## Platform Bazlı Özet");
  lines.push("");
  lines.push("| Platform | Test | Bulundu | Kısmi | Bulunmadı | Visibility Score | Ort. Sentiment |");
  lines.push("|----------|------|---------|-------|-----------|-----------------|----------------|");

  for (const [platform, platformRecords] of Object.entries(byPlatform)) {
    const total = platformRecords.length;
    const found = platformRecords.filter((r) => r.found === "yes").length;
    const partial = platformRecords.filter((r) => r.found === "partial").length;
    const notFound = platformRecords.filter((r) => r.found === "no").length;
    const visibilityScore = ((found + partial * 0.5) / total * 100).toFixed(0);
    const avgSentiment = (
      platformRecords.reduce((sum, r) => sum + (r.sentiment ?? 50), 0) / total
    ).toFixed(0);

    lines.push(
      `| ${platform} | ${total} | ${found} | ${partial} | ${notFound} | %${visibilityScore} | ${avgSentiment}/100 |`,
    );
  }

  lines.push("");
  lines.push("## KPI Hedefleri");
  lines.push("");
  lines.push("| Metrik | Hedef | Mevcut |");
  lines.push("|--------|-------|--------|");

  const totalRecords = records.length;
  const totalFound = records.filter((r) => r.found === "yes").length;
  const totalPartial = records.filter((r) => r.found === "partial").length;
  const overallVisibility = ((totalFound + totalPartial * 0.5) / totalRecords * 100).toFixed(0);
  const overallSentiment = (
    records.reduce((sum, r) => sum + (r.sentiment ?? 50), 0) / totalRecords
  ).toFixed(0);

  lines.push(`| Visibility Score | %60+ | %${overallVisibility} |`);
  lines.push(`| Citation Rate | %40+ | %${((totalFound / totalRecords) * 100).toFixed(0)} |`);
  lines.push(`| Sentiment | 70+/100 | ${overallSentiment}/100 |`);

  lines.push("");
  lines.push("## Detaylı Kayıtlar");
  lines.push("");

  for (const [platform, platformRecords] of Object.entries(byPlatform)) {
    lines.push(`### ${platform}`);
    lines.push("");
    for (const r of platformRecords) {
      const foundIcon = r.found === "yes" ? "✓" : r.found === "partial" ? "~" : "✗";
      const promptText = PROMPTS[r.promptIndex] ?? `Prompt #${r.promptIndex}`;
      const sentiment = r.sentiment ?? "—";
      const url = r.url ? ` → ${r.url}` : "";
      lines.push(`- ${foundIcon} [${r.promptIndex}] ${promptText}${url} (sentiment: ${sentiment})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function printPrompts() {
  console.log("# AI Visibility Prompt Seti\n");
  console.log(`Toplam: ${PROMPTS.length} prompt\n`);
  for (let i = 0; i < PROMPTS.length; i++) {
    const group =
      i < 10 ? "Platform keşfi" : i < 20 ? "İhtiyaç bazlı" : "Şehir/ülke bazlı";
    console.log(`[${i}] (${group}) ${PROMPTS[i]}`);
  }
}

async function recordResult(platform, promptIndex, found, url, sentiment, notes) {
  if (!PLATFORMS.includes(platform)) {
    console.error(`Geçersiz platform: ${platform}. Geçerli: ${PLATFORMS.join(", ")}`);
    process.exit(1);
  }
  const idx = parseInt(promptIndex, 10);
  if (isNaN(idx) || idx < 0 || idx >= PROMPTS.length) {
    console.error(`Geçersiz prompt index: ${promptIndex}. Geçerli: 0-${PROMPTS.length - 1}`);
    process.exit(1);
  }
  if (!["yes", "no", "partial"].includes(found)) {
    console.error(`Geçersiz found değeri: ${found}. Geçerli: yes, no, partial`);
    process.exit(1);
  }

  const record = {
    date: new Date().toISOString(),
    platform,
    promptIndex: idx,
    prompt: PROMPTS[idx],
    found,
    url: url || null,
    sentiment: sentiment ? parseInt(sentiment, 10) : null,
    notes: notes || null,
  };

  await appendRecord(record);
  console.log(`Kaydedildi: [${platform}] #${idx} "${PROMPTS[idx]}" → ${found}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--export-prompts") || args.includes("--prompts")) {
    printPrompts();
    return;
  }

  if (args.includes("--record")) {
    const recordIdx = args.indexOf("--record");
    const [platform, promptIndex, found, url, sentiment, ...notesParts] = args.slice(recordIdx + 1);
    const notes = notesParts.join(" ");
    await recordResult(platform, promptIndex, found, url, sentiment, notes);
    return;
  }

  if (args.includes("--platforms")) {
    console.log("Geçerli platformlar:", PLATFORMS.join(", "));
    return;
  }

  const monthKey = args.find((a) => /^\d{4}-\d{2}$/.test(a)) ?? currentMonthKey();
  const records = await readRecords(monthKey);
  const report = generateReport(records);
  console.log(report);
}

const calistirilanDosya = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (calistirilanDosya === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error("[ai-visibility] hata:", error?.message ?? error);
    process.exit(1);
  });
}

export { PROMPTS, PLATFORMS, generateReport, readRecords, currentMonthKey };
