// Metin parçalama — saf fonksiyon, ağ/dosya sistemi yok, bu yüzden test edilebilir.
//
// NEDEN PARÇALAMA GEREKLİ: embedding modeli tek bir vektöre sabit miktarda anlam
// sığdırır. 8.000 karakterlik bir blog yazısını tek vektöre indirirsen yazının
// TAMAMI bulanık bir ortalamaya dönüşür ve hiçbir spesifik soruya iyi eşleşmez.
// Parçalama, "Almanya'da mavi kart başvurusu" sorusunun o başlığı taşıyan
// paragrafla eşleşmesini sağlar.

/** Bir parçanın hedef üst sınırı. Türkçe metinde ~1 token ≈ 3 karakter;
 *  1.500 karakter ≈ 500 token, embedding modelinin rahat çalıştığı bant. */
export const DEFAULT_MAX_CHARS = 1_500;

/** Ardışık parçalar arasındaki örtüşme. Sınıra denk gelen bir cümlenin
 *  bağlamını kaybetmemek için parçanın sonu bir sonrakinin başında tekrarlanır. */
export const DEFAULT_OVERLAP_CHARS = 200;

/** Bundan kısa parçalar tek başına anlam taşımaz (başlık artığı, boş satır). */
export const MIN_CHUNK_CHARS = 80;

/**
 * Metni paragraf sınırlarını koruyarak parçalara böler.
 *
 * Paragraf sınırı tercih edilir çünkü cümle ortasından kesmek hem anlamı hem de
 * embedding kalitesini bozar. Tek bir paragraf üst sınırdan büyükse (uzun tablo,
 * madde listesi) o paragraf cümle sınırından, o da yoksa sert karakter sınırından
 * bölünür — yani fonksiyon her girdi için ilerleme garantisi verir, sonsuz döngüye
 * girmez.
 *
 * @param {string} text
 * @param {{ maxChars?: number, overlapChars?: number }} [options]
 * @returns {string[]}
 */
export function chunkText(text, options = {}) {
  const maxChars = Math.max(options.maxChars ?? DEFAULT_MAX_CHARS, MIN_CHUNK_CHARS);
  const overlapChars = Math.max(Math.min(options.overlapChars ?? DEFAULT_OVERLAP_CHARS, maxChars - 1), 0);

  const normalized = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const units = splitIntoUnits(normalized, maxChars);
  const chunks = [];
  let current = "";

  for (const unit of units) {
    if (!current) {
      current = unit;
      continue;
    }
    if (current.length + 2 + unit.length <= maxChars) {
      current = `${current}\n\n${unit}`;
      continue;
    }
    chunks.push(current);
    current = overlapChars > 0 ? joinWithOverlap(current, unit, overlapChars, maxChars) : unit;
  }

  if (current) chunks.push(current);

  // Çok kısa son parçayı bir öncekine geri yapıştır: tek başına gürültü, birleşince
  // bağlam. Üst sınırı aşacaksa olduğu gibi bırakılır.
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1];
    const previous = chunks[chunks.length - 2];
    if (last.length < MIN_CHUNK_CHARS && previous.length + 2 + last.length <= maxChars) {
      chunks.splice(chunks.length - 2, 2, `${previous}\n\n${last}`);
    }
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}

/** Önceki parçanın kuyruğunu yeni parçanın başına ekler (örtüşme). */
function joinWithOverlap(previous, unit, overlapChars, maxChars) {
  const tail = previous.slice(-overlapChars).trimStart();
  if (!tail || tail.length + 2 + unit.length > maxChars) return unit;
  return `${tail}\n\n${unit}`;
}

/**
 * Metni paragraflara ayırır; üst sınırdan uzun paragrafları önce cümle, gerekirse
 * karakter sınırından böler. Dönen her birim `maxChars`'tan kısadır ya da eşittir.
 */
function splitIntoUnits(text, maxChars) {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const units = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      units.push(paragraph);
      continue;
    }
    for (const sentence of splitLongParagraph(paragraph, maxChars)) {
      units.push(sentence);
    }
  }

  return units;
}

function splitLongParagraph(paragraph, maxChars) {
  // Cümle sonu: nokta/soru/ünlem + boşluk. Türkçe kısaltmalar (vb., ör.) yanlış
  // bölünebilir; bu kabul edilebilir çünkü sonuç yalnız parça sınırını etkiler,
  // metni DEĞİŞTİRMEZ.
  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
  const units = [];
  let current = "";

  for (const sentence of sentences) {
    const piece = sentence.length <= maxChars ? [sentence] : hardSplit(sentence, maxChars);
    for (const part of piece) {
      if (!current) {
        current = part;
      } else if (current.length + 1 + part.length <= maxChars) {
        current = `${current} ${part}`;
      } else {
        units.push(current);
        current = part;
      }
    }
  }

  if (current) units.push(current);
  return units;
}

/** Son çare: cümle sınırı bile yoksa sert kes. İlerleme garantisini bu sağlar. */
function hardSplit(value, maxChars) {
  const parts = [];
  for (let index = 0; index < value.length; index += maxChars) {
    parts.push(value.slice(index, index + maxChars));
  }
  return parts;
}
