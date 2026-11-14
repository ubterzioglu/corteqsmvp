// Relocation Tools — sonuç payload'ındaki `primary_result.weakest3` ayrıştırıcısı.
//
// SQL tarafı (relocation_score_readiness_v1, relocation_score_job_finding_probability_v1)
// en zayıf 3 boyutu hesaplayıp `primary_result.weakest3` altına yazar. Alan `jsonb`
// olduğu için şekil garantisi YOKTUR: eksik anahtar, metne dönmüş sayı ya da tamamen
// farklı bir yapı gelebilir. Bozuk tek bir kayıt sonuç ekranının tamamını düşürmesin
// diye ayrıştırma eleyicidir — geçersiz satır sessizce atılır, hata fırlatılmaz.

export interface WeakestArea {
  key: string;
  title: string;
  /** 0..1 aralığında boyut puanı. */
  score: number;
  /** SQL'in ürettiği şablon açıklama; copy katmanı varsa onun yerine o kullanılır. */
  detail?: string;
}

/** `primary_result.weakest3` → geçerli satırlar. Alan yoksa/bozuksa boş dizi. */
export function parseWeakestAreas(primaryResult: Record<string, unknown>): WeakestArea[] {
  const raw = primaryResult?.weakest3;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): WeakestArea[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const row = entry as Record<string, unknown>;
    const key = typeof row.key === "string" ? row.key : "";
    const title = typeof row.title === "string" ? row.title : "";
    const score = Number(row.score);
    if (!key || !title || !Number.isFinite(score)) return [];
    return [
      {
        key,
        title,
        score,
        detail: typeof row.detail === "string" ? row.detail : undefined,
      },
    ];
  });
}
