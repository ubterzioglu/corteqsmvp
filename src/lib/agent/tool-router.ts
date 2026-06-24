// Tool selection router (Faz 4) — çok ölçütlü skorla araç sıralaması.
// Kaynak tasarım: newtools.md §"Skorlama, gizlilik ve yönetici deneyimi".
//
// S_tool = 100 × (0.30 I + 0.20 C + 0.15 P + 0.10 F + 0.10 L + 0.10 D + 0.05 A)
//  I = intent match, C = contract completeness, P = privacy compatibility,
//  F = freshness/coverage, L = latency-cost, D = determinism/observability,
//  A = availability/health.
//
// Saf fonksiyonlar — yan etki yok, test edilebilir. Özellik değerleri 0..1.

export type RouteFeatures = {
  intent: number; // I
  contract: number; // C
  privacy: number; // P
  freshness: number; // F
  latency: number; // L
  determinism: number; // D
  availability: number; // A
};

export type ScoredTool = {
  toolKey: string;
  score: number; // 0..100
  features: RouteFeatures;
  eligible: boolean; // deprecated/unknown ise false
  reason: string;
};

export type RouterToolMeta = {
  tool_key: string;
  status: string; // active | deprecated | unknown
  family: string;
  input_schema?: { validation?: string; fields?: string[] };
};

const WEIGHTS: RouteFeatures = {
  intent: 0.3,
  contract: 0.2,
  privacy: 0.15,
  freshness: 0.1,
  latency: 0.1,
  determinism: 0.1,
  availability: 0.05,
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Tek bir aracın routing skorunu hesaplar (0..100). */
export function scoreFeatures(features: RouteFeatures): number {
  let sum = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof RouteFeatures)[]) {
    sum += WEIGHTS[key] * clamp01(features[key]);
  }
  return Math.round(sum * 100 * 10) / 10; // 1 ondalık
}

/**
 * Bir aracın sözleşme tamlığını (C) katalogdan türetir:
 * zod validation + tanımlı alanlar → yüksek; manual/alan yok → düşük.
 */
export function contractCompleteness(meta: RouterToolMeta): number {
  const usesZod = meta.input_schema?.validation === "zod";
  const fieldCount = meta.input_schema?.fields?.length ?? 0;
  const base = usesZod ? 0.7 : 0.4;
  const fieldBonus = Math.min(0.3, fieldCount * 0.05);
  return clamp01(base + fieldBonus);
}

/**
 * Araçları skorlayıp sıralar. deprecated/unknown araçlar eligible=false ve
 * skoru sıfırlanır (asla seçilmez). Eşitlikte deterministik (tool_key) sıralama.
 */
export function rankTools(
  tools: RouterToolMeta[],
  featuresByTool: Record<string, RouteFeatures>,
): ScoredTool[] {
  const scored = tools.map((t) => {
    const eligible = t.status === "active";
    const features =
      featuresByTool[t.tool_key] ?? {
        intent: 0,
        contract: contractCompleteness(t),
        privacy: 0.5,
        freshness: 0.5,
        latency: 0.5,
        determinism: 0.5,
        availability: eligible ? 0.8 : 0,
      };
    const raw = scoreFeatures(features);
    const score = eligible ? raw : 0;
    const reason = eligible
      ? `intent=${features.intent.toFixed(2)}, contract=${features.contract.toFixed(2)}`
      : `seçilemez (status=${t.status})`;
    return { toolKey: t.tool_key, score, features, eligible, reason };
  });

  return scored.sort(
    (a, b) => b.score - a.score || a.toolKey.localeCompare(b.toolKey),
  );
}

/** Eşik bantları: 80+ doğrudan, 65-79 orta güven, 50-64 ikincil, <50 gösterme. */
export function confidenceBand(score: number): "high" | "medium" | "low" | "reject" {
  if (score >= 80) return "high";
  if (score >= 65) return "medium";
  if (score >= 50) return "low";
  return "reject";
}
