// Embedding üretimi (MVP Adım 3).
//
//   npm run ai:embed                  kuyruk boşalana kadar çalışır
//   npm run ai:embed -- --limit=50    en fazla 50 satır işler
//
// ⚠️ BOYUT 1536 ZORUNLU — `outputDimensionality` PARAMETRESİ ATLANAMAZ.
// `gemini-embedding-001` varsayılan olarak **3072** boyut üretir. Parametre
// verilmezse Postgres `vector(1536)` sütununa yazma anında patlar. Hata mesajı
// boyut uyuşmazlığını söyler ama sebebi burada olduğu için not düşülüyor.

import {
  createServiceClient,
  fetchPendingDocuments,
  markEmbedError,
  readEnvValue,
  readStats,
  setEmbedding,
} from "./client.mjs";

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "models/gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 1_536;

/** Tek seferde kuyruktan çekilen satır sayısı. Canlı sunucu 1 GB RAM altında —
 *  korpusun tamamını belleğe almak yerine sayfalanır. */
const BATCH_SIZE = 50;

/** Ücretsiz katmanda dakika başına istek sınırı var; 429 alınca beklenir. */
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 2_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { limit: Number.POSITIVE_INFINITY };
  for (const arg of argv) {
    const limitMatch = /^--limit=(\d+)$/.exec(arg);
    if (limitMatch) {
      args.limit = Number.parseInt(limitMatch[1], 10);
      continue;
    }
    throw new Error(`Bilinmeyen secenek: ${arg}`);
  }
  return args;
}

/**
 * Tek bir metni vektöre çevirir.
 *
 * `taskType: RETRIEVAL_DOCUMENT` bilinçli: Gemini, belge ile sorgu için AYRI
 * vektör uzayları üretir. Belgeleri `RETRIEVAL_DOCUMENT`, arama sorgusunu
 * `RETRIEVAL_QUERY` ile gömmek eşleşme kalitesini belirgin biçimde artırır.
 * Edge fonksiyonu sorgu tarafında `RETRIEVAL_QUERY` kullanmalıdır — iki taraf
 * tutarsız olursa mesafeler sessizce bozulur.
 */
export async function embedText(text, apiKey, { taskType = "RETRIEVAL_DOCUMENT" } = {}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Gemini ${response.status}: ${detail.slice(0, 300)}`);
    error.status = response.status;
    error.retryable = response.status === 429 || response.status >= 500;
    throw error;
  }

  const data = await response.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Beklenmeyen embedding boyutu: ${values?.length ?? "yok"} (beklenen ${EMBEDDING_DIMENSIONS})`,
    );
  }
  return values;
}

async function embedWithRetry(text, apiKey) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await embedText(text, apiKey);
    } catch (error) {
      lastError = error;
      if (!error.retryable || attempt === MAX_RETRIES) break;
      // Üstel geri çekilme: 429 ücretsiz katmanda beklemedir, para değil.
      await sleep(BASE_BACKOFF_MS * 2 ** attempt);
    }
  }
  throw lastError;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = readEnvValue("GEMINI_API_KEY");
  const client = createServiceClient();

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (processed < args.limit) {
    const remaining = Math.min(BATCH_SIZE, args.limit - processed);
    const pending = await fetchPendingDocuments(client, { limit: remaining });
    if (pending.length === 0) break;

    for (const row of pending) {
      processed += 1;
      try {
        const embedding = await embedWithRetry(row.content, apiKey);
        await setEmbedding(client, row.document_id, embedding);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        // Satır sessizce kaybolmaz: sebebi tabloya yazılır, `embed_attempts` artar
        // ve üç denemeden sonra kuyruktan düşer (kuyruğu tıkamaz).
        await markEmbedError(client, row.document_id, error.message);
        console.error(`[ai-embed] ${row.source_key}/${row.external_id}: ${error.message}`);
      }
    }

    console.log(`[ai-embed] ${processed} satır işlendi (başarılı ${succeeded} · hatalı ${failed})`);
  }

  console.log("\n[ai-embed] Durum:");
  for (const row of await readStats(client)) {
    console.log(
      `  ${row.sourceKey.padEnd(12)} toplam ${row.total} · embedding ${row.embedded}` +
        ` · bekleyen ${row.pending} · hatalı ${row.failed}`,
    );
  }

  if (failed > 0) process.exitCode = 1;
}

// Doğrudan çalıştırıldığında main(); import edildiğinde yalnız `embedText` dışa açılır.
if (process.argv[1] && process.argv[1].endsWith("embed.mjs")) {
  main().catch((error) => {
    console.error(`[ai-embed] HATA: ${error.message}`);
    process.exitCode = 1;
  });
}
