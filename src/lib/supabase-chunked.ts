// PostgREST satır tavanı yardımcıları — CLAUDE.md "Değişmez sözleşmeler" md.5.
//
// PostgREST sınırsız bir sorguyu **1000 satırda SESSİZCE keser**: hata dönmez, eksik
// veri döner. Bu repoda bir kez canlıda yaşandı (Komuta Merkezi listesi 1000'de
// kesilince "son WhatsApp kaydı 6 Temmuz" sanıldı — kayıtlar duruyordu).
//
// ⚠️ `.in("user_id", ids)` TEK BAŞINA GÜVENLİ DEĞİLDİR. Dönen satır sayısı
// `ids.length × kullanıcı başına satır` kadardır: `user_profile_attributes`'tan iki
// nitelik çeken bir sorgu **500 kullanıcıda 1000 satıra** ulaşır ve sessizce kesilir.
// Kullanıcı listesi büyüdükçe kayıp büyür ve hiçbir yerde hata görünmez.
//
// Çözüm: kimlik listesini parçala, her istek tavanın ALTINDA kalsın.

/** PostgREST'in örtük satır tavanı. Aşan sorgu sessizce kesilir. */
export const POSTGREST_ROW_CAP = 1000;

/**
 * Bir `.in(...)` sorgusunu parça parça çalıştırır ve sonuçları birleştirir.
 *
 * @param ids      Sorgulanacak kimlikler (yinelenenler temizlenir).
 * @param rowsPerId Bir kimliğin döndürebileceği EN FAZLA satır sayısı. Parça boyu
 *                  bundan türetilir; yanlış (düşük) verilirse kesme geri gelir.
 * @param run      Tek bir parçayı sorgulayan fonksiyon.
 *
 * Parça boyu tavanın yarısında tutulur: sorgu tam tavana dayanırsa kesilmiş mi yoksa
 * gerçekten o kadar mı satır var ayırt edilemez.
 */
export async function fetchInChunks<TRow>(
  ids: readonly string[],
  rowsPerId: number,
  run: (chunk: string[]) => PromiseLike<{ data: TRow[] | null; error: unknown }>,
): Promise<TRow[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];

  const safeRowsPerId = Math.max(1, Math.floor(rowsPerId));
  const chunkSize = Math.max(1, Math.floor(POSTGREST_ROW_CAP / 2 / safeRowsPerId));

  const out: TRow[] = [];
  for (let index = 0; index < unique.length; index += chunkSize) {
    const chunk = unique.slice(index, index + chunkSize);
    const { data, error } = await run(chunk);
    if (error) throw error;
    if (data) out.push(...data);
  }
  return out;
}
