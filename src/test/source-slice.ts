// Kaynak metni dilimleyen SÖZLEŞME testleri için çıpalı yardımcılar (S04b).
//
// Bu repodaki sözleşme testlerinin çoğu bir kaynak dosyayı (TS, SQL, CSS) okuyup
// `indexOf` ile bir parçasını kesiyor, sonra o parça hakkında iddiada bulunuyor.
// Çıplak `indexOf` bu işte SESSİZ BAŞARISIZLIK üretir:
//
//   const blok = kaynak.slice(kaynak.indexOf("çıpa"));
//
// Çıpa artık yoksa `indexOf` **-1** döner ve `slice(-1)` hata vermez — son karakteri
// döndürür. Ardından gelen iddia çöp bir metin üzerinde çalışır:
//   • negatif iddia (`not.toContain`) **sessizce GEÇER** — aranan şey zaten yoktur;
//   • pozitif iddia (`toContain`) ise yanlış bir metinde arar; `slice(0, -1)`
//     durumunda bu "dosyanın tamamına yakını" demektir ve o da **sessizce GEÇER**.
//
// Ölçüldü (28.09, S04b): `ai-knowledge-search-index.test.ts` içindeki çıpa bilerek
// bozulduğunda dosyanın 5 testi de yeşil kaldı — üstelik o test aynı gün yapılan
// HNSW indeks düzeltmesini koruyan testti.
//
// Kural: kaynak metni dilimleyen her yerde bu yardımcıları kullan, çıplak
// `indexOf` + `slice` yazma. Çıpa kaybolursa test AÇIKÇA düşer ve hangi çıpanın
// kaybolduğunu söyler.

import { expect } from "vitest";

function requireIndex(source: string, anchor: string, label: string): number {
  const at = source.indexOf(anchor);
  expect(at, `${label}: çıpa bulunamadı → ${JSON.stringify(anchor)}`).toBeGreaterThan(-1);
  return at;
}

/** `anchor`'dan metnin sonuna kadar diler. Çıpa yoksa test düşer. */
export function sliceFrom(source: string, anchor: string, label = "sliceFrom"): string {
  return source.slice(requireIndex(source, anchor, label));
}

/** Metnin başından `anchor`'a kadar diler. Çıpa yoksa test düşer. */
export function sliceUntil(source: string, anchor: string, label = "sliceUntil"): string {
  return source.slice(0, requireIndex(source, anchor, label));
}

/**
 * İki çıpa arasını diler. `end` çıpası `start`'tan SONRA aranır — aksi halde aynı
 * dize metnin başında da geçiyorsa negatif uzunlukta boş bir dilim üretilir ve
 * bu da sessizce geçen bir iddiaya yol açar.
 */
export function sliceBetween(
  source: string,
  start: string,
  end: string,
  label = "sliceBetween",
): string {
  const from = requireIndex(source, start, `${label} (başlangıç)`);
  const rest = source.slice(from);
  const to = requireIndex(rest, end, `${label} (bitiş)`);
  return rest.slice(0, to);
}
