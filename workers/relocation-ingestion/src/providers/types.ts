// Kaynak adapter sözleşmesi. Her adapter bir kaynaktan (resmi portal / lisanslı API)
// ham kayıt çeker; normalizer bunu NormalizedCandidate'e dönüştürür.
//
// KURAL (ADR-001 / source-registry.md): HTML scraping varsayılan değildir. Adapter
// yalnız (a) hukuki onay + (b) resmi/lisanslı alternatif yokluğunda robots'a saygıyla fallback yapar.

import type { RelocationJob } from "../types.js";

export interface ProviderContext {
  job: RelocationJob;
  /** secret_ref → anahtar çözücü (env.resolveSecret). */
  resolveSecret: (secretRef: string) => string;
  /** Maliyet kaydı (worker_record_relocation_cost). */
  recordCost: (amountUsd: number, meta?: Record<string, unknown>) => Promise<void>;
}

/** Bir kaynaktan ham kayıtlar — normalizer'a girer. */
export interface RawRecord {
  source_url?: string;
  raw: Record<string, unknown>;
}

export interface SourceProvider {
  /** source_registry.source_key ile eşleşir. */
  readonly key: string;
  /** Bu adapter hangi target_kind'leri besler. */
  readonly supports: ReadonlyArray<RelocationJob["target_kind"]>;
  /** İşi çalıştır; ham kayıtları döndür. */
  fetch(ctx: ProviderContext): Promise<RawRecord[]>;
}
