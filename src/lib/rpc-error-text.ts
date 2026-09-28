// Supabase RPC hatasından aranabilir metni çıkarır — TEK KAYNAK.
//
// ⚠️ Bu sözleşme CANLIDA İKİ KEZ KIRILDI ve ikisi de aynı kök nedendendi:
//   1. `cadde-rules.ts` (2026-08-05'e kadar): `instanceof Error` ile daraltılıyordu,
//      bu yüzden Türkçe mesaj haritası AYLARCA tamamen ölüydü.
//   2. `service-finder-format.ts` (S05, 2026-09-28): aynı hata, kullanıcı
//      **`[object Object]`** görüyordu.
// İkinci vaka birincisi düzeltildikten SONRA da yaşadı, çünkü çözüm kopyalanmamıştı.
// Bu dosya o kopyayı tek kaynağa indirir.
//
// Neden `instanceof Error` yetmez: supabase-js'in RPC hataları **düz nesnedir**,
// `Error` örneği DEĞİLDİR. Üstelik kodu her zaman `message` alanında taşımazlar —
// `code`, `details` ve `hint` alanlarında da gelebilir. Daraltma bu nesneyi
// `String(error)` yoluna düşürür ve `"[object Object]"` üretir.

/** Hata nesnesinde aranan alanlar; sırası önemli değildir, hepsi birleştirilir. */
const SEARCHABLE_FIELDS = ["message", "code", "details", "hint"] as const;

/**
 * Hata nesnesini kod/desen aramaya uygun tek metne çevirir.
 *
 * ⚠️ Çıktı KULLANICIYA GÖSTERİLMEK İÇİN DEĞİLDİR — ham sunucu metni içerebilir.
 * Kullanıcıya gösterilecek metin, bu çıktı bir mesaj haritasında eşleştirildikten
 * sonra üretilir (`resolveCaddeRpcErrorMessage` · `sfErrorMessage` deseni).
 */
export function extractRpcErrorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return SEARCHABLE_FIELDS.map((field) => record[field])
      .filter((value): value is string => typeof value === "string")
      .join(" ");
  }

  return "";
}
