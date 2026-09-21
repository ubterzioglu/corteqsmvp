// Bilgi tabanı içe aktarma (MVP Adım 2).
//
//   npm run ai:ingest                 tüm kaynaklar
//   npm run ai:ingest -- --source=blog
//   npm run ai:ingest -- --dry-run    hiçbir şey yazmaz, sayıları raporlar
//
// İDEMPOTENT: her çalıştırmada bütün korpus gönderilir; `ai_knowledge_upsert_document`
// md5 karşılaştırır ve yalnız DEĞİŞEN satırların embedding'ini geçersiz kılar. Yani
// bu script'i tekrar tekrar çalıştırmak güvenlidir ve yeniden ücretlendirme yapmaz.

import { createServiceClient, pruneSource, readStats, upsertDocument } from "./client.mjs";
import { KNOWLEDGE_SOURCES, findSource } from "./sources.mjs";
import { chunkText } from "./chunk.mjs";

function parseArgs(argv) {
  const args = { sources: null, dryRun: false };
  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    const sourceMatch = /^--source=(.+)$/.exec(arg);
    if (sourceMatch) {
      args.sources = sourceMatch[1].split(",").map((value) => value.trim()).filter(Boolean);
      continue;
    }
    throw new Error(`Bilinmeyen secenek: ${arg}`);
  }
  return args;
}

function resolveSources(requested) {
  if (!requested) return KNOWLEDGE_SOURCES;
  return requested.map((key) => {
    const source = findSource(key);
    if (!source) {
      const known = KNOWLEDGE_SOURCES.map((entry) => entry.key).join(", ");
      throw new Error(`Bilinmeyen kaynak: ${key}. Gecerli degerler: ${known}`);
    }
    return source;
  });
}

async function ingestSource(client, source, { dryRun }) {
  const documents = await source.load(client);

  // Kaynak hiç kayıt döndürmediyse bu neredeyse her zaman bir okuma hatasıdır.
  // Devam edersek `prune` tüm kaynağı silmeye çalışır (ve RPC bunu reddeder),
  // ama hatayı burada, sebebi belliyken vermek daha açık.
  if (documents.length === 0) {
    throw new Error(
      `${source.key}: kaynak 0 kayit dondurdu — okuma hatasi olabilir, silme yapilmadi.`,
    );
  }

  const report = { inserted: 0, updated: 0, unchanged: 0, chunks: 0, deleted: 0 };

  for (const document of documents) {
    const chunks = chunkText(document.text);
    report.chunks += chunks.length;
    if (dryRun) continue;

    for (const [chunkIndex, content] of chunks.entries()) {
      const action = await upsertDocument(client, {
        sourceKey: source.key,
        externalId: document.externalId,
        chunkIndex,
        // Çok parçalı belgede başlığa parça numarası eklenir: getirme sonucunda
        // "Vize Rehberi (2/5)" görmek, aynı başlığın beş kez tekrarlamasından iyidir.
        title: chunks.length > 1 ? `${document.title} (${chunkIndex + 1}/${chunks.length})` : document.title,
        url: document.url,
        audience: source.audience,
        content,
      });
      if (action === "inserted") report.inserted += 1;
      else if (action === "updated") report.updated += 1;
      else report.unchanged += 1;
    }
  }

  if (!dryRun) {
    report.deleted = await pruneSource(
      client,
      source.key,
      documents.map((document) => document.externalId),
    );
  }

  return { documents: documents.length, ...report };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = resolveSources(args.sources);
  const client = createServiceClient();

  console.log(
    `[ai-knowledge] İçe aktarma başlıyor: ${sources.map((s) => s.key).join(", ")}` +
      (args.dryRun ? " (DRY RUN — yazma yok)" : ""),
  );

  let failed = false;
  for (const source of sources) {
    try {
      const report = await ingestSource(client, source, { dryRun: args.dryRun });
      console.log(
        `[ai-knowledge] ${source.key}: ${report.documents} belge → ${report.chunks} parca` +
          ` (yeni ${report.inserted} · guncel ${report.updated} · degismedi ${report.unchanged}` +
          ` · silindi ${report.deleted})`,
      );
    } catch (error) {
      failed = true;
      console.error(`[ai-knowledge] ${source.key} BASARISIZ: ${error.message}`);
    }
  }

  if (!args.dryRun) {
    console.log("\n[ai-knowledge] Durum:");
    for (const row of await readStats(client)) {
      console.log(
        `  ${row.sourceKey.padEnd(12)} toplam ${row.total} · embedding ${row.embedded}` +
          ` · bekleyen ${row.pending} · hatali ${row.failed}`,
      );
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[ai-knowledge] HATA: ${error.message}`);
  process.exitCode = 1;
});
