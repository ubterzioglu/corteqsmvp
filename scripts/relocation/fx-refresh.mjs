// B30 — döviz kurlarını sağlayıcıdan çekip `relocation_fx_rates`'e yazar.
//
// Kur ANLIK çekilmez: sayfa her açılışta dış servise gitmez, saklanan kuru okur ve
// `rate_at` ile kurun hangi ana ait olduğunu gösterir.
//
// Kullanım:  npm run fx:refresh
// Gerekli:   .env.local içinde SUPABASE_URL/VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//
// Sağlayıcı: open.er-api.com — ücretsiz, anahtarsız, 166 para birimi. ECB (frankfurter)
// bilerek SEÇİLMEDİ: QAR ve AED'yi yayımlamıyor, yani 12 ülkenin 2'si çevrilemiyordu.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const BASE = "EUR";
const PROVIDER_URL = `https://open.er-api.com/v6/latest/${BASE}`;
const SOURCE_KEY = "fx_open_er_api";

/**
 * Yazılacak para birimleri. Maliyet satırlarının para birimleri + üyelerin bütçe
 * girebileceği yaygın birimler. Listeyi dar tutmak bilinçlidir: 166 satır yazmak
 * tabloyu, tek bir ekranda hiç kullanılmayacak kurlarla şişirir.
 */
const CURRENCIES = ["EUR", "USD", "QAR", "SEK", "AED", "CAD", "CHF", "GBP", "TRY"];

function readEnv() {
  let raw = "";
  try {
    raw = readFileSync(".env.local", "utf8");
  } catch {
    throw new Error(".env.local okunamadi.");
  }
  const env = Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
  );
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik.");
  return { url, key };
}

export function buildRateRows(payload, sourceId, currencies = CURRENCIES) {
  const rates = payload?.rates;
  if (!rates || typeof rates !== "object") throw new Error("Saglayici yanitinda rates yok.");

  // `time_last_update_unix` kurun YAYIMLANDIGI an. Bizim cektigimiz an degil —
  // ikisini karistirmak, bayat bir kuru taze gostermektir.
  const published = payload?.time_last_update_unix;
  if (!Number.isFinite(published)) throw new Error("Saglayici yanitinda time_last_update_unix yok.");
  const rateAt = new Date(published * 1000).toISOString();

  const rows = [];
  for (const quote of currencies) {
    if (quote === BASE) continue;
    const rate = rates[quote];
    // Eksik para birimi SESSIZCE atlanmaz: uydurma kur yerine hic satir yazilmaz ve
    // asagida rapor edilir.
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) continue;
    rows.push({
      base_currency: BASE,
      quote_currency: quote,
      rate,
      source_id: sourceId,
      rate_at: rateAt,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return rows;
}

async function main() {
  const { url, key } = readEnv();
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const sourceRes = await fetch(
    `${url}/rest/v1/relocation_source_registry?select=id&source_key=eq.${SOURCE_KEY}`,
    { headers },
  );
  const sources = await sourceRes.json();
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(`Kaynak kaydi bulunamadi: ${SOURCE_KEY} (migration uygulandi mi?)`);
  }
  const sourceId = sources[0].id;

  const providerRes = await fetch(PROVIDER_URL, { signal: AbortSignal.timeout(20_000) });
  if (!providerRes.ok) throw new Error(`Saglayici HTTP ${providerRes.status}`);
  const payload = await providerRes.json();

  const rows = buildRateRows(payload, sourceId);
  const missing = CURRENCIES.filter(
    (c) => c !== BASE && !rows.some((r) => r.quote_currency === c),
  );

  const writeRes = await fetch(
    `${url}/rest/v1/relocation_fx_rates?on_conflict=base_currency,quote_currency`,
    {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    },
  );
  if (!writeRes.ok) throw new Error(`Yazma HTTP ${writeRes.status}: ${await writeRes.text()}`);

  console.log(`[fx-refresh] ${rows.length} kur yazildi · baz ${BASE} · kur ani ${rows[0]?.rate_at}`);
  if (missing.length > 0) {
    console.warn(`[fx-refresh] UYARI — saglayici su birimleri vermedi: ${missing.join(", ")}`);
  }
}

// ⚠️ Windows tuzağı: `file://${argv[1]}` karşılaştırması burada ASLA tutmaz — Node
// `file:///C:/...` (üç eğik çizgi) üretir, elle kurulan dize `file://C:/...` olur.
// Script sessizce hiçbir şey yapmadan çıkar. `pathToFileURL` ikisini de doğru üretir.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[fx-refresh] ${error.message}`);
    process.exit(1);
  });
}
