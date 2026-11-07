// Tek bir bilgi kaynağını içe aktarır: yükle → parçala → upsert → buda.
//
// `ingest.mjs`'ten ayrıldı (2026-11-07) ki test edilebilsin: o dosya import edildiği
// anda `main()`'i çalıştırır.

import { clearSource, pruneSource, upsertDocument } from "./client.mjs";
import { chunkText } from "./chunk.mjs";

function emptyReport() {
  return { inserted: 0, updated: 0, unchanged: 0, chunks: 0, deleted: 0 };
}

export async function ingestSource(client, source, { dryRun }) {
  const documents = await source.load(client);

  if (documents.length === 0) {
    // Kitle sınırı kaynağında (`allowEmpty`) boş liste MEŞRUDUR: son belge bilerek
    // geri çekilmiştir. Burada fırlatıp budamayı atlamak FAIL-OPEN olurdu — eski
    // satırlar üyeye servis edilmeye devam ederdi. Bu yüzden kaynak tamamen boşaltılır.
    if (source.allowEmpty) {
      const report = emptyReport();
      if (!dryRun) report.deleted = await clearSource(client, source.key);
      return { documents: 0, ...report };
    }
    // Diğer kaynaklarda 0 kayıt neredeyse her zaman bir okuma hatasıdır; budamaya
    // gidilirse tüm kaynak silinirdi. Hata burada, sebebi belliyken verilir.
    throw new Error(
      `${source.key}: kaynak 0 kayit dondurdu — okuma hatasi olabilir, silme yapilmadi.`,
    );
  }

  const report = emptyReport();

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
