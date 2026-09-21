// Supabase service-role istemcisi + AI bilgi tabanı RPC sarmalayıcıları.
//
// SERVICE ROLE ANAHTARI KULLANIR — bu script yalnız yerelden ya da CI'dan çalışır,
// tarayıcıya ASLA girmez. Migration'daki bütün RPC'ler `auth.role() <> 'service_role'`
// kontrolüyle başlar, yani yanlış anahtarla çağrı sessizce değil `42501` ile düşer.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * `.env.local`'dan tek bir anahtar okur.
 *
 * ⚠️ MÜKERRER ANAHTAR TUZAĞI: dotenv/Vite aynı anahtarın SON tanımını kullanır ve
 * bu dosyada geçmişte mükerrer tanımlar yüzünden gerçek sırlar placeholder'a düşmüştü.
 * Bu yüzden burada da SON eşleşme alınır — davranış Vite ile aynı kalsın.
 */
export function readEnvValue(key, { required = true } = {}) {
  if (process.env[key]) return process.env[key];

  let content;
  try {
    content = readFileSync(path.join(projectRoot, ".env.local"), "utf8");
  } catch {
    if (!required) return null;
    throw new Error(`${key} bulunamadi; .env.local okunamadi.`);
  }

  const matches = [...content.matchAll(new RegExp(`^${key}=(.*)$`, "gm"))];
  const last = matches.at(-1);
  if (!last) {
    if (!required) return null;
    throw new Error(`.env.local icinde ${key} yok.`);
  }
  return last[1].trim().replace(/^(["'])|(["'])$/g, "");
}

export function createServiceClient() {
  const url = readEnvValue("SUPABASE_URL", { required: false }) ?? readEnvValue("VITE_SUPABASE_URL");
  const serviceKey = readEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * PostgREST'ten SAYFALANARAK okur.
 *
 * ⚠️ PostgREST 1000 satırda SESSİZCE keser — hata dönmez, EKSİK veri döner. Bugün
 * katalog 647 satır olduğu için tek sayfa yetiyor, ama korpus büyüdüğünde bu fonksiyon
 * olmadan içe aktarma sessizce yarım kalırdı. `scripts/generate-sitemap.mjs`
 * içindeki `fetchAllRows()` deseniyle aynı.
 */
export async function fetchAllRows(buildQuery, { pageSize = 500 } = {}) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw new Error(`Sorgu basarisiz: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export async function upsertDocument(client, document) {
  const { data, error } = await client.rpc("ai_knowledge_upsert_document", {
    p_source_key: document.sourceKey,
    p_external_id: document.externalId,
    p_chunk_index: document.chunkIndex,
    p_title: document.title,
    p_url: document.url ?? null,
    p_audience: document.audience,
    p_content: document.content,
  });
  if (error) throw new Error(`upsert basarisiz (${document.externalId}): ${error.message}`);
  return data?.[0]?.action ?? "unknown";
}

export async function pruneSource(client, sourceKey, keepExternalIds) {
  const { data, error } = await client.rpc("ai_knowledge_prune_source", {
    p_source_key: sourceKey,
    p_keep_external_ids: keepExternalIds,
  });
  if (error) throw new Error(`prune basarisiz (${sourceKey}): ${error.message}`);
  return data ?? 0;
}

export async function fetchPendingDocuments(client, { limit = 100, maxAttempts = 3 } = {}) {
  const { data, error } = await client.rpc("ai_knowledge_pending_documents", {
    p_limit: limit,
    p_max_attempts: maxAttempts,
  });
  if (error) throw new Error(`kuyruk okunamadi: ${error.message}`);
  return data ?? [];
}

export async function setEmbedding(client, documentId, embedding) {
  const { error } = await client.rpc("ai_knowledge_set_embedding", {
    p_document_id: documentId,
    p_embedding: JSON.stringify(embedding),
  });
  if (error) throw new Error(`embedding yazilamadi (${documentId}): ${error.message}`);
}

export async function markEmbedError(client, documentId, message) {
  const { error } = await client.rpc("ai_knowledge_mark_embed_error", {
    p_document_id: documentId,
    p_error: String(message ?? "bilinmeyen hata"),
  });
  // Hata işaretlemesi de patlarsa asıl hatayı gizlememek için yalnız uyarı yazılır.
  if (error) console.warn(`[ai-knowledge] hata isaretlenemedi (${documentId}): ${error.message}`);
}

/** Kaynak bazlı ilerleme raporu. Ayrı bir stats RPC'si yok — düz sorgu yeterli. */
export async function readStats(client) {
  const rows = await fetchAllRows(() =>
    client.from("ai_knowledge_documents").select("source_key, embedding, embed_error"),
  );

  const perSource = new Map();
  for (const row of rows) {
    const entry = perSource.get(row.source_key) ?? { total: 0, embedded: 0, failed: 0 };
    entry.total += 1;
    if (row.embedding) entry.embedded += 1;
    else if (row.embed_error) entry.failed += 1;
    perSource.set(row.source_key, entry);
  }

  return [...perSource.entries()]
    .map(([sourceKey, entry]) => ({
      sourceKey,
      ...entry,
      pending: entry.total - entry.embedded - entry.failed,
    }))
    .sort((a, b) => a.sourceKey.localeCompare(b.sourceKey));
}
