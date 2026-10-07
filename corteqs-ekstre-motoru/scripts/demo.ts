// Motoru gerçek Drive verisi + örnek ekstre + örnek Mercury işlemleriyle çalıştırır.
// Çalıştırma:  node --experimental-strip-types scripts/demo.ts   (Node 22+)  ya da  deno run -A scripts/demo.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  DEFAULT_CARDS, DEFAULT_RULES, mercuryToRaw, parseCsv, parseDriveSheetCsv, parseAmount, parseDate,
  processLines, sanitize, summarize, tableFx, toExpenseRow, round2,
} from "../supabase/functions/_shared/engine/index.ts";
import type { Currency, ExistingExpense, PaymentCard, ProcessedLine } from "../supabase/functions/_shared/engine/index.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (p: string) => readFileSync(root + p, "utf8");
mkdirSync(root + "out", { recursive: true });

// — Kur tablosu: Drive'daki TL -> $ oranlarından türet (testte internet yok; canlıda TCMB kullanılır)
const csv = read("fixtures/drive_teknoloji_harcamalari.csv");
const fxTable: Record<string, Partial<Record<Currency, number>>> = {};
{
  const rows = parseCsv(csv);
  for (const r of rows) {
    const date = parseDate(r[2] ?? ""); const tl = parseAmount(r[7]); const usd = parseAmount(r[8]); const amt = parseAmount(r[6]);
    if (!date || !usd) continue;
    fxTable[date] ??= {};
    if (tl && Math.abs(tl) > 0) fxTable[date].TRY = usd / tl;
    if (r[5] === "EUR" && amt) fxTable[date].EUR = usd / amt;
  }
  // EUR'u olmayan günlere son bilinen EUR kurunu taşı
  let lastEur = 1.139, lastTry = 1 / 44;
  for (const d of Object.keys(fxTable).sort()) {
    fxTable[d].EUR = fxTable[d].EUR ?? lastEur; lastEur = fxTable[d].EUR!;
    fxTable[d].TRY = fxTable[d].TRY ?? lastTry; lastTry = fxTable[d].TRY!;
  }
}
const fx = tableFx(fxTable);
const existingAdmin: ExistingExpense[] = JSON.parse(read("fixtures/admin_expenses_snapshot.json"));
const cards: PaymentCard[] = [
  ...DEFAULT_CARDS,
  { last4: "4421", label: "Mercury Sanal (…4421)", bank: "Mercury", payment_method: "sanal_kart_burak", owner: "burak", is_virtual: true, default_person: "ortak" },
];

const report: string[] = ["# Ekstre Motoru — Demo Çıktısı", `Oluşturma: ${new Date().toISOString()}`, ""];

function table(lines: ProcessedLine[]) {
  const h = "| Tarih | Ekstre açıklaması | Tüccar | Kategori | Kim | Tutar | $ net | Karar | Bayraklar |\n|---|---|---|---|---|---|---|---|---|";
  return h + "\n" + lines.map((l) =>
    `| ${l.date} | ${l.description.slice(0, 38)} | ${l.merchant} | ${l.category} | ${l.person} | ${l.amount_original} ${l.currency_original} | ${l.amount_usd_net ?? "—"} | **${l.decision}** | ${l.flags.join(", ")} |`).join("\n");
}

// ─── Senaryo 1: Drive geçmişi toplu içe aktarma (backfill) ─────────────────────────────
const driveRaw = parseDriveSheetCsv(csv, { corteqsPerson: null });
const drive = await processLines(driveRaw, { rules: DEFAULT_RULES, cards, fx, existing: existingAdmin });
const s1 = summarize(drive);
// Doğruluk: motorun $ karşılığı Drive'daki "Dolar Karşılığı (Net)" ile ne kadar tutuyor?
const sheetNet = parseCsv(csv).filter((r) => parseDate(r[2] ?? "")).map((r) => parseAmount(r[10]) ?? 0);
let maxDiff = 0, sumEngine = 0, sumSheet = 0;
drive.forEach((l, i) => { const d = Math.abs((l.amount_usd_net ?? 0) - sheetNet[i]); maxDiff = Math.max(maxDiff, d); sumEngine += l.amount_usd_net ?? 0; sumSheet += sheetNet[i]; });
report.push("## 1) Drive tablosunun toplu aktarımı", "",
  `- Okunan satır: **${drive.length}** · aktar: **${s1.import}** · incele: **${s1.review}** · atla: **${s1.skip}**`,
  `- Net $ toplamı — motor: **$${round2(sumEngine)}**, Drive: **$${round2(sumSheet)}** (satır başı en büyük fark: $${round2(maxDiff)})`,
  `- Admin'de zaten olan (olası mükerrer) satır: **${drive.filter((l) => l.flags.includes("olasi_mukerrer")).length}**`,
  `- Kuralı olmayan satır: **${drive.filter((l) => l.flags.includes("kural_yok")).length}** · teknoloji dışı: **${drive.filter((l) => l.flags.includes("teknoloji_disi")).length}**`,
  "", "Kategori dağılımı (net $): " + Object.entries(s1.by_category).map(([k, v]) => `${k}: $${v}`).join(" · "), "",
  "<details><summary>Tüm satırlar</summary>", "", table(drive), "", "</details>", "");

// ─── Senaryo 2: PDF ekstre (Gemini çıktısı simülasyonu) ─────────────────────────────────
// Drive'dan aktarılanlar artık admin'de varmış gibi davran (motor kayıtları parmak iziyle eşleşir)
const afterBackfill: ExistingExpense[] = [
  ...existingAdmin,
  ...drive.filter((l) => l.decision === "import").map((l, i) => ({ id: "bf-" + i, expense_date: l.date, description: l.merchant, amount: l.amount_original, currency: l.currency_original, source_fingerprint: l.fingerprint })),
];
const pdf = sanitize(JSON.parse(read("fixtures/ornek_gemini_cikti_qnb.json")));
const stmt = await processLines(pdf.lines, { rules: DEFAULT_RULES, cards, fx, existing: afterBackfill });
const s2 = summarize(stmt);
report.push("## 2) PDF ekstre (QNB, Eylül 2026 — örnek Gemini çıktısı)", "",
  `- Banka: ${pdf.meta.bank} · dönem ${pdf.meta.period_start} → ${pdf.meta.period_end} · kartlar: ${pdf.meta.cards.map((c) => c.last4).join(", ")}`,
  `- Uyarılar: ${pdf.warnings.length ? pdf.warnings.join(" / ") : "yok"}`,
  `- aktar **${s2.import}** · incele **${s2.review}** · atla **${s2.skip}** · aktarılacak net: **$${s2.usd_net_import}**`, "", table(stmt), "");

// İkinci yükleme: aynı ekstre tekrar yüklenirse?
const reupload = await processLines(pdf.lines, {
  rules: DEFAULT_RULES, cards, fx,
  existing: [...afterBackfill, ...stmt.filter((l) => l.decision !== "skip").map((l, i) => ({ id: "st-" + i, expense_date: l.date, description: l.merchant, amount: l.amount_original, currency: l.currency_original, source_fingerprint: l.fingerprint }))],
});
report.push(`**Aynı ekstre ikinci kez yüklendi:** ${reupload.filter((l) => l.flags.includes("mukerrer")).length}/${reupload.length} satır "mukerrer" olarak atlandı, yeni kayıt: ${reupload.filter((l) => l.decision === "import").length}.`, "");

// ─── Senaryo 3: Mercury ────────────────────────────────────────────────────────────────
const merc = await processLines(mercuryToRaw(JSON.parse(read("fixtures/ornek_mercury_islemler.json"))), {
  rules: DEFAULT_RULES, cards, fx, existing: afterBackfill, autoCommitMode: true, fallbackPaymentMethod: "sanal_kart_burak",
});
report.push("## 3) Mercury senkronu (örnek işlemler, otomatik mod)", "", table(merc), "",
  "Gelen havale elendi; kural eşleşen ve `auto_commit` açık olanlar doğrudan aktarılır, diğerleri inceleme kuyruğuna düşer.", "");

writeFileSync(root + "out/demo_rapor.md", report.join("\n"));
writeFileSync(root + "out/ekstre_onizleme.json", JSON.stringify({ drive: s1, pdf: s2, lines: stmt }, null, 2));
writeFileSync(root + "out/expenses_insert_ornegi.json", JSON.stringify(stmt.filter((l) => l.decision === "import").map((l) => toExpenseRow(l, { source: "pdf_statement", importId: "demo" })), null, 2));
console.log(report.slice(0, 12).join("\n"));
console.log("\nPDF:", s2, "\nMercury:", merc.map((l) => `${l.merchant}:${l.decision}`).join(", "));
