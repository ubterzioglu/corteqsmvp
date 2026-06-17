// Toplu profil içe aktarma — API katmanı.
//
// İki sorumluluk:
//   1. parseImportText: yapıştırılan/yüklenen CSV veya JSON metnini ImportRecord[]'a
//      çevirir + Zod ile doğrular. (papaparse bağımlılığı YOK — küçük, tırnak-bilinçli
//      CSV parser; mevcut scripts/catalog-role-importer.mjs parseDelimitedLine deseni.)
//   2. RPC sarmalayıcıları: admin_bulk_import_catalog_items, admin_review_catalog_import.

import { supabase } from "@/integrations/supabase/client";
import {
  CSV_HEADER_ALIASES,
  bulkImportResultSchema,
  importRecordListSchema,
  type BulkImportResult,
  type ImportRecord,
  type ReviewDecision,
} from "@/lib/catalog-import-schemas";

type QueryError = { message: string };

type CatalogImportRpcClient = {
  rpc: (
    functionName: "admin_bulk_import_catalog_items" | "admin_review_catalog_import",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: QueryError | null }>;
};

const importRpcClient = supabase as unknown as CatalogImportRpcClient;

export type ImportFormat = "csv" | "json";

/** Bir CSV satırını tırnak-bilinçli parçalar (RFC-4180 benzeri; "" kaçışı dahil). */
function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

/** Delimiter'ı başlık satırından otomatik sezer (virgül, noktalı virgül veya sekme). */
function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t"] as const;
  let best = ",";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = splitCsvLine(headerLine, candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

const FIELD_KEYS = Object.keys(CSV_HEADER_ALIASES) as (keyof ImportRecord)[];

/** Bir CSV başlığını ImportRecord alanına eşler (Türkçe/İngilizce alias toleranslı). */
function resolveHeaderField(header: string): keyof ImportRecord | null {
  const normalized = header
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");

  for (const field of FIELD_KEYS) {
    const aliases = CSV_HEADER_ALIASES[field];
    for (const alias of aliases) {
      const aliasNormalized = alias
        .toLocaleLowerCase("tr-TR")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/ı/g, "i");
      if (aliasNormalized === normalized) return field;
    }
  }
  return null;
}

function parseCsv(raw: string): unknown[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV en az bir başlık ve bir veri satırı içermeli.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);
  const fieldByIndex = headers.map(resolveHeaderField);

  if (!fieldByIndex.some((field) => field === "name")) {
    throw new Error('CSV başlıklarında "name/isim/ad" sütunu bulunamadı.');
  }

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const record: Record<string, string> = {};
    fieldByIndex.forEach((field, index) => {
      if (field) record[field] = cells[index] ?? "";
    });
    return record;
  });
}

function parseJson(raw: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Geçersiz JSON. Bir nesne dizisi bekleniyor.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("JSON bir nesne dizisi (array) olmalı.");
  }
  return parsed;
}

/**
 * Yapıştırılan/yüklenen metni doğrulanmış ImportRecord[]'a çevirir.
 * Hata fırlatır (UI yakalar) — bu sayede kısmi/bozuk veri sessizce yutulmaz.
 */
export function parseImportText(raw: string, format: ImportFormat): ImportRecord[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("İçe aktarılacak veri boş.");
  }

  const rows = format === "csv" ? parseCsv(trimmed) : parseJson(trimmed);
  const result = importRecordListSchema.safeParse(rows);

  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path?.length ? ` (kayıt ${first.path[0]})` : "";
    throw new Error(`Doğrulama hatası${where}: ${first?.message ?? "bilinmeyen"}`);
  }

  return result.data;
}

/** Kayıtları beklemede (pending_review) olarak içe aktarır. */
export async function bulkImportCatalogItems(
  records: ImportRecord[],
  sourceType: string,
  defaultRole: string,
): Promise<BulkImportResult> {
  const { data, error } = await importRpcClient.rpc("admin_bulk_import_catalog_items", {
    p_records: records,
    p_source_type: sourceType,
    p_default_role: defaultRole,
  });

  if (error) throw error;

  const parsed = bulkImportResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("İçe aktarma sonucu beklenmeyen biçimde döndü.");
  }
  return parsed.data;
}

/** Beklemedeki bir içe aktarma kaydını onaylar (yayınlar) veya reddeder. */
export async function reviewCatalogImport(
  itemId: string,
  decision: ReviewDecision,
  note: string | null = null,
): Promise<void> {
  const { error } = await importRpcClient.rpc("admin_review_catalog_import", {
    p_item_id: itemId,
    p_decision: decision,
    p_note: note,
  });

  if (error) throw error;
}
