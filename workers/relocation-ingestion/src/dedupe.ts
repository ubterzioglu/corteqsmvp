// Aday tekilleştirme — kararlı duplicate_key üretir (service-finder dedupe deseni).
// canonicalization kuralı: hedef türü + ülke/şehir + ad/sağlayıcı normalize edilip birleştirilir.

function norm(value: unknown): string {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü]+/gi, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 80);
}

export function buildDuplicateKey(
  targetKind: string,
  payload: Record<string, unknown>,
): string {
  const country = norm(payload.country_code);
  const city = norm(payload.city_code);
  if (targetKind === "service") {
    return ["svc", country, city, norm(payload.category), norm(payload.provider_name)].join(":");
  }
  if (targetKind === "bureaucratic_step") {
    return ["bst", country, city, norm(payload.name)].join(":");
  }
  return ["emg", country, city, norm(payload.type), norm(payload.label)].join(":");
}
