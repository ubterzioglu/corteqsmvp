// B21.1 — katalog arama dokumanlari icin embedding kuyrugu.
//
//   npm run catalog:embed                                      kuyruk bosalana kadar calisir
//   node scripts/ai-knowledge/catalog-vectors.mjs --limit=50   en fazla 50 satir isler
//
// Canli tabloya yalniz service-role istemcisi ve mevcut
// `set_catalog_search_embedding` RPC'si uzerinden yazar.

import { createServiceClient, readEnvValue } from "./client.mjs";
import { embedWithRetry } from "./embed.mjs";

const BATCH_SIZE = 50;

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

export async function fetchPendingCatalogDocuments(client, { limit = BATCH_SIZE } = {}) {
  const { data, error } = await client
    .from("catalog_search_documents")
    .select("item_id, search_text")
    .is("embedding", null)
    .order("item_id", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`catalog embedding kuyrugu okunamadi: ${error.message}`);
  return data ?? [];
}

export async function countPendingCatalogDocuments(client) {
  const { count, error } = await client
    .from("catalog_search_documents")
    .select("item_id", { count: "exact", head: true })
    .is("embedding", null);

  if (error) throw new Error(`catalog embedding sayaci okunamadi: ${error.message}`);
  return count ?? 0;
}

export async function setCatalogEmbedding(client, itemId, embedding) {
  const { error } = await client.rpc("set_catalog_search_embedding", {
    target_item_id: itemId,
    next_embedding: JSON.stringify(embedding),
  });
  if (error) throw new Error(`catalog embedding yazilamadi (${itemId}): ${error.message}`);
}

export async function runCatalogEmbeddingQueue({
  client,
  apiKey,
  limit = Number.POSITIVE_INFINITY,
  batchSize = BATCH_SIZE,
  fetchPending = fetchPendingCatalogDocuments,
  embed = embedWithRetry,
  persist = setCatalogEmbedding,
}) {
  let processed = 0;
  let succeeded = 0;

  while (processed < limit) {
    const remaining = Math.min(batchSize, limit - processed);
    const pending = await fetchPending(client, { limit: remaining });
    if (pending.length === 0) break;

    for (const row of pending) {
      try {
        const embedding = await embed(row.search_text, apiKey);
        await persist(client, row.item_id, embedding);
      } catch (error) {
        throw new Error(`catalog embedding basarisiz (${row.item_id}): ${error.message}`, {
          cause: error,
        });
      }

      processed += 1;
      succeeded += 1;
    }

    console.log(`[catalog-embed] ${processed} satir islendi`);
  }

  return { processed, succeeded };
}

async function main() {
  const { limit } = parseArgs(process.argv.slice(2));
  const apiKey = readEnvValue("GEMINI_API_KEY");
  const client = createServiceClient();
  const before = await countPendingCatalogDocuments(client);

  console.log(`[catalog-embed] Baslangic kuyrugu: ${before}`);
  const result = await runCatalogEmbeddingQueue({ client, apiKey, limit });
  const after = await countPendingCatalogDocuments(client);
  console.log(
    `[catalog-embed] Tamamlandi: ${result.succeeded} basarili · ${after} embedding bos`,
  );
}

if (process.argv[1]?.endsWith("catalog-vectors.mjs")) {
  main().catch((error) => {
    console.error(`[catalog-embed] HATA: ${error.message}`);
    process.exitCode = 1;
  });
}
