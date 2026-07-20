/**
 * Dosya adı kodu: <toolOrder><variant><promptNo>.
 * - Son hane her zaman promptNo (1 veya 2).
 * - Varyant hanesi (2 veya 3) yalnız varyant 1 değilse yazılır; varyant 1 ise atlanır.
 * - Geri kalan basamaklar toolOrder'dır.
 *
 * Çözümleme:
 * - 2 hane: <T><P> varyant=1 ile
 * - 3 hane: önce <T><V><P> dene (T ∈ [1,9], V ∈ {1,2,3}), sonra <T'><P> (T' ∈ [10,12])
 * - 4+ hane: <T><V><P> (V = sondan ikinci hane ∈ {2,3})
 */
export function parseBurakImageFilename(filename) {
  const match = /^(\d+)\.png$/.exec(filename);
  if (!match) return null;

  const digits = match[1];
  const lastDigit = Number(digits.at(-1));
  if (lastDigit !== 1 && lastDigit !== 2) return null;

  // 2 hane: <T><P> with variant=1
  if (digits.length === 2) {
    const toolOrder = Number(digits[0]);
    if (toolOrder >= 1 && toolOrder <= 12) {
      return { toolOrder, variant: 1, promptNo: lastDigit };
    }
    return null;
  }

  // 3 hane: try both <T><V><P> and <T'><P> interpretations
  if (digits.length === 3) {
    const firstDigit = Number(digits[0]);
    const secondDigit = Number(digits[1]);
    const twoDigitToolOrder = Number(digits.slice(0, 2));

    // Try <T'><P> interpretation first (prefer 2-digit toolOrder if valid)
    if (twoDigitToolOrder >= 10 && twoDigitToolOrder <= 12) {
      return { toolOrder: twoDigitToolOrder, variant: 1, promptNo: lastDigit };
    }

    // Try <T><V><P> interpretation (single-digit toolOrder with explicit variant)
    if (firstDigit >= 1 && firstDigit <= 9 && secondDigit >= 1 && secondDigit <= 3) {
      return { toolOrder: firstDigit, variant: secondDigit, promptNo: lastDigit };
    }

    return null;
  }

  // 4+ hane: <T><V><P> where V = sondan ikinci hane ∈ {2,3}
  const variantDigit = Number(digits.at(-2));
  if (variantDigit === 2 || variantDigit === 3) {
    const toolOrderStr = digits.slice(0, -2);
    const toolOrder = Number(toolOrderStr);
    if (toolOrderStr && toolOrder >= 1 && toolOrder <= 12) {
      return { toolOrder, variant: variantDigit, promptNo: lastDigit };
    }
  }

  return null;
}
