// Ham kayıt → NormalizedCandidate. Adapter çıktısını publish RPC'sinin beklediği şekle getirir.
import { buildDuplicateKey } from "./dedupe.js";
import type { RawRecord } from "./providers/types.js";
import type { NormalizedCandidate, RelocationJob } from "./types.js";

export function normalizeRecord(job: RelocationJob, record: RawRecord): NormalizedCandidate {
  const raw = record.raw;
  // source_id job'tan taşınır (kaynak güvenilirliği source_registry'de).
  const payload: Record<string, unknown> = {
    ...raw,
    country_code: raw.country_code ?? job.country_code,
    city_code: raw.city_code ?? job.city_code,
    source_id: job.source_id,
  };

  return {
    target_kind: job.target_kind,
    duplicate_key: buildDuplicateKey(job.target_kind, payload),
    source_url: record.source_url,
    confidence_score: typeof raw.confidence_score === "number" ? raw.confidence_score : 0.5,
    evidence: record.source_url ? [{ quote: "kaynak kaydı", source_url: record.source_url }] : [],
    payload,
  };
}
