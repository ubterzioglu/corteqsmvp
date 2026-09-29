// Revizyon ekleri — tür/boyut TEK KAYNAK modülü (A09b).
//
// Bucket `revision-attachments` ile AYNA sözleşmesi: 11 MIME · 15 MB
// (A09a: supabase/migrations/applied/20260929120000_revision_attachments_document_mimes.sql).
// Desen: src/lib/event-media.ts · Kilit: revision-attachment-media-contract.test.ts.
//
// ⚠️ `accept=` yalnız dosya seçiciye verilen bir TAVSİYEDİR ("Tüm dosyalar"
// seçilerek atlanır); gerçek denetim `uploadAttachment` içindeki `validateFile`
// çağrısındadır. İkisi de bu sabitleri kullanır — iki yere elle liste YAZMA.

/** Uzantı → MIME haritası: hem accept hem uzantı kümesi buradan TÜRETİLİR. */
const EXTENSION_TO_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const satisfies Record<string, string>;

/** Bucket'taki `file_size_limit` ile AYNI olmak zorunda (ayna sözleşmesi). */
export const REVISION_ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;

/** Bucket'taki `allowed_mime_types` ile BİREBİR aynı — haritadan türetilir. */
export const REVISION_ATTACHMENT_MIME_TYPES: readonly string[] = [
  ...new Set<string>(Object.values(EXTENSION_TO_MIME)),
];

/** `validateFile` uzantı kümesi — aynı haritadan türetilir. */
export const REVISION_ATTACHMENT_EXTENSIONS: Set<string> = new Set<string>(
  Object.keys(EXTENSION_TO_MIME),
);

/** `<input type="file" accept=...>` için. Elle yazma, buradan türet. */
export const REVISION_ATTACHMENT_ACCEPT = REVISION_ATTACHMENT_MIME_TYPES.join(",");

/**
 * Ek görsel mi (thumbnail önizlenir) yoksa belge mi (A09c: ad + ikon + boyut
 * kartı)? `content_type` satıra yüklemede yazılır ama null olabilir (eski satırlar
 * / tarayıcı türü bilmiyor) — o durumda uzantıdan sezilir.
 */
export function isRevisionAttachmentImage(
  contentType: string | null,
  fileName: string,
): boolean {
  if (contentType) {
    return contentType.startsWith("image/");
  }
  const ext = fileName.includes(".") ? (fileName.split(".").pop() ?? "").toLowerCase() : "";
  return IMAGE_EXTENSIONS.has(ext);
}

const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/** Uzantı etiketi (büyük harf, teknik değer → düz toUpperCase doğru). */
export function revisionAttachmentExtension(fileName: string): string {
  const ext = fileName.includes(".") ? (fileName.split(".").pop() ?? "").toLowerCase() : "";
  return ext.replace(/[^a-z0-9]/g, "").toUpperCase();
}

/** Kart altında gösterim için insan-okur boyut ("340 KB", "1.2 MB"). */
export function formatRevisionAttachmentSize(sizeBytes: number | null): string {
  if (sizeBytes === null || Number.isNaN(sizeBytes)) return "";
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
