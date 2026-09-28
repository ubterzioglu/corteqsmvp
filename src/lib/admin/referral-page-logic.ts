// AdminReferralPage'in SAF mantığı (C02).
//
// Sayfa 577 satırdı, tek bileşen fonksiyonu içinde 18 `useState` ve HİÇ testi yoktu.
// Repo kuralı testsiz ayrıştırmayı yasaklıyor (Cadde ikilisi tam bu yüzden ertelendi),
// bu yüzden önce React'tan bağımsız çalışabilen parçalar buraya taşındı: burada test
// yazmak render kurmayı gerektirmiyor, yani güvenlik ağı gerçekten ucuz.
//
// ⚠️ Buraya yalnız SAF fonksiyon girer: state yok, `toast` yok, Supabase yok.
// Veri yükleme ve yan etkiler sayfada kalır.

import { trIncludes } from "@/lib/text-normalization";

/** Filtreleme ve özet için gereken en dar satır şekli. */
export type ReferralCodeLike = {
  code: string;
  note: string | null;
  source_code: string;
  group_code: string;
  type_code: string;
};

export type ReferralUsageLike = { referral_code_id: string };

/** Kod listesinde aranan alanların birleşimi. */
export function referralSearchHaystack(referral: ReferralCodeLike): string {
  return `${referral.source_code}/${referral.group_code}/${referral.type_code}`;
}

/**
 * Arama kutusuna göre kodları süzer.
 *
 * ⚠️ Eşleşme `trIncludes` ile yapılır, çıplak `toLowerCase` ile DEĞİL: Türkçe'de
 * `"İSTANBUL".toLowerCase()` sade "istanbul" ÜRETMEZ ve kullanıcı aradığını bulamaz
 * (CLAUDE.md "Türkçe Metin Kuralları" md.1). Aksan toleransı da oradan gelir.
 */
export function filterReferralCodes<T extends ReferralCodeLike>(
  codes: readonly T[],
  searchQuery: string,
): T[] {
  if (!searchQuery.trim()) return [...codes];

  return codes.filter(
    (referral) =>
      trIncludes(referral.note, searchQuery)
      || trIncludes(referral.code, searchQuery)
      || trIncludes(referralSearchHaystack(referral), searchQuery),
  );
}

/**
 * Yeni kodun önizleme metni (`SRC` + `GRP` + `TYP` + `-XXXXXX`).
 *
 * Seçim yapılmamışsa `??` gösterilir — boş bırakmak kullanıcıya kodun o kısmının
 * boş kalacağını düşündürürdü.
 */
export function buildReferralCodePreview(parts: {
  sourceCode: string | undefined;
  groupCode: string | undefined;
  typeCode: string | undefined;
}): string {
  const source = parts.sourceCode ?? "??";
  const group = parts.groupCode ?? "??";
  const type = parts.typeCode ?? "??";
  return `${source}${group}${type}-XXXXXX`;
}

/** Kullanım kayıtlarını kod kimliğine göre gruplar. */
export function groupUsagesByCode<T extends ReferralUsageLike>(
  usages: readonly T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const usage of usages) {
    if (!grouped[usage.referral_code_id]) grouped[usage.referral_code_id] = [];
    grouped[usage.referral_code_id].push(usage);
  }
  return grouped;
}

/**
 * Oluşturma formunun zorunlu alan denetimi.
 *
 * @returns kullanıcıya gösterilecek hata metni, ya da geçerliyse `null`.
 */
export function validateReferralCreateForm(input: {
  sourceId: string;
  groupId: string;
  typeId: string;
  validFrom: string;
  validUntil: string;
}): string | null {
  if (!input.sourceId || !input.groupId || !input.typeId) {
    return "Source, Group ve Type gerekli";
  }
  if (!input.validFrom || !input.validUntil) {
    return "Başlangıç ve bitiş tarihi gerekli";
  }
  // ⚠️ Sıra denetimi EKLENDİ: eski kodda yoktu, bitiş başlangıçtan önce olabiliyordu
  // ve kod oluşturulduğu anda süresi dolmuş sayılıyordu.
  if (input.validUntil < input.validFrom) {
    return "Bitiş tarihi başlangıçtan önce olamaz";
  }
  return null;
}
