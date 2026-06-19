// Relocation — skor → Türkçe "why" cümleleri (açıklanabilirlik).
// Türkçe metin kuralı: case/karşılaştırma için text-normalization helper'ları (CLAUDE.md).

import type { RelocationScoreKey } from "@/lib/relocation-ranking";

const HIGH = 0.75;
const LOW = 0.4;

/** Her bileşen için (yüksek, düşük) açıklama metni. */
const EXPLANATION_TEXT: Record<RelocationScoreKey, { high: string; low: string }> = {
  budget_fit: {
    high: "Konut bütçenize rahat uyuyor",
    low: "Konut bütçesi sınırda — erken arama önerilir",
  },
  bureaucracy_ease: {
    high: "Resmi işlemler nispeten kolay ve net",
    low: "Bürokratik süreç yoğun — checklist'i erken başlatın",
  },
  healthcare_access: {
    high: "Aile hekimi ve sağlık erişimi güçlü",
    low: "Sağlık erişimi sınırlı — randevu için erken planlayın",
  },
  gsm_coverage: {
    high: "5G/mobil kapsama güçlü",
    low: "Mobil kapsama zayıf olabilir",
  },
  community_fit: {
    high: "Türk topluluğu ve Türkçe destekli servis yoğunluğu yüksek",
    low: "Türk topluluğu yoğunluğu düşük",
  },
  flight_access: {
    high: "Doğrudan uçuş ve ulaşım seçenekleri güçlü",
    low: "Doğrudan uçuş seçenekleri kısıtlı",
  },
};

/**
 * Skor bileşenlerinden en belirgin (yüksek + düşük) açıklamaları üretir.
 * @param limit en fazla kaç cümle dönsün
 */
export function buildExplanations(
  breakdown: Partial<Record<RelocationScoreKey, number>>,
  limit = 3,
): string[] {
  const entries = (Object.keys(EXPLANATION_TEXT) as RelocationScoreKey[])
    .map((key) => ({ key, value: breakdown[key] ?? 0.5 }))
    // En uçtaki (0.5'ten en uzak) bileşenler önce.
    .sort((a, b) => Math.abs(b.value - 0.5) - Math.abs(a.value - 0.5));

  const out: string[] = [];
  for (const { key, value } of entries) {
    if (out.length >= limit) break;
    if (value >= HIGH) out.push(EXPLANATION_TEXT[key].high);
    else if (value <= LOW) out.push(EXPLANATION_TEXT[key].low);
  }
  return out;
}
