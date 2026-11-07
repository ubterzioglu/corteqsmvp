import { describe, expect, it } from "vitest";
import { formatCompactAmountTR, formatCurrencyTR } from "@/lib/format-money";

// ICU, tr-TR kısa gösterimde ve harf kodlu para biriminde sayı ile ek arasına
// bölünmez boşluk (U+00A0) koyar; görünmez karakteri kaynağa gömmek yerine üretilir.
const NBSP = String.fromCharCode(0xa0);

describe("formatCurrencyTR", () => {
  it("varsayılan olarak tam 2 ondalıkla tr-TR para biçimi üretir", () => {
    expect(formatCurrencyTR(1234.5, "TRY")).toBe("₺1.234,50");
    expect(formatCurrencyTR(1234.5, "EUR")).toBe("€1.234,50");
    expect(formatCurrencyTR(1234.5, "USD")).toBe("$1.234,50");
    expect(formatCurrencyTR(1234.5, "GBP")).toBe("£1.234,50");
    expect(formatCurrencyTR(1234.5, "QAR")).toBe(`QAR${NBSP}1.234,50`);
  });

  it("negatif tutarda işareti sembolün önüne koyar", () => {
    expect(formatCurrencyTR(-1234.5, "EUR")).toBe("-€1.234,50");
  });

  it("yarım kuruşu yukarı yuvarlar", () => {
    expect(formatCurrencyTR(0.005, "TRY")).toBe("₺0,01");
    expect(formatCurrencyTR(1.125, "TRY")).toBe("₺1,13");
    expect(formatCurrencyTR(2.675, "EUR")).toBe("€2,68");
  });

  it("minimumFractionDigits verilirse kuruşu yalnız gerekince gösterir (en çok 2)", () => {
    expect(formatCurrencyTR(5000, "TRY", 0)).toBe("₺5.000");
    expect(formatCurrencyTR(1234.5, "TRY", 0)).toBe("₺1.234,5");
    expect(formatCurrencyTR(1234.567, "USD", 0)).toBe("$1.234,57");
  });

  it("önbellek para birimini ve ondalık sayısını ayırt eder", () => {
    expect(formatCurrencyTR(10, "EUR")).toBe("€10,00");
    expect(formatCurrencyTR(10, "TRY")).toBe("₺10,00");
    expect(formatCurrencyTR(10, "TRY", 0)).toBe("₺10");
    expect(formatCurrencyTR(10, "TRY")).toBe("₺10,00");
  });

  it("yedek metin üretmez: NaN olduğu gibi biçimlenir, geçersiz kod fırlatır", () => {
    expect(formatCurrencyTR(Number.NaN, "TRY")).toBe("₺NaN");
    expect(() => formatCurrencyTR(1, "EURO")).toThrow(RangeError);
    expect(() => formatCurrencyTR(1, "TRY", 3)).toThrow(RangeError);
  });
});

describe("formatCompactAmountTR", () => {
  it("küçük tutarı olduğu gibi, büyüğü tr-TR kısa ekiyle yazar", () => {
    expect(formatCompactAmountTR(0)).toBe("0");
    expect(formatCompactAmountTR(999)).toBe("999");
    expect(formatCompactAmountTR(1250)).toBe(`1,3${NBSP}B`);
    expect(formatCompactAmountTR(12345)).toBe(`12,3${NBSP}B`);
    expect(formatCompactAmountTR(1_500_000)).toBe(`1,5${NBSP}Mn`);
    expect(formatCompactAmountTR(2_500_000_000)).toBe(`2,5${NBSP}Mr`);
  });

  it("negatif tutarı ve küçük ondalığı en çok 1 ondalıkla yazar", () => {
    expect(formatCompactAmountTR(-2500)).toBe(`-2,5${NBSP}B`);
    expect(formatCompactAmountTR(0.05)).toBe("0,1");
  });
});
