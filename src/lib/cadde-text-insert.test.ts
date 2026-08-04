import { describe, expect, it } from "vitest";

import { insertTextAtSelection } from "@/lib/cadde-text-insert";

describe("insertTextAtSelection", () => {
  it("inserts text at the caret", () => {
    expect(insertTextAtSelection("Merhaba dunya", "😊", { start: 8, end: 8 })).toEqual({
      value: "Merhaba 😊dunya",
      caret: 10,
    });
  });

  it("replaces the selected range", () => {
    expect(insertTextAtSelection("Cadde eski", "yeni", { start: 6, end: 10 })).toEqual({
      value: "Cadde yeni",
      caret: 10,
    });
  });

  it("clamps stale selection indexes to the current value", () => {
    expect(insertTextAtSelection("Kisa", "✨", { start: 20, end: 30 })).toEqual({
      value: "Kisa✨",
      caret: 5,
    });
  });

  // m62 — emoji surrogate çiftidir; indeks çiftin ORTASINA düşerse ham slice
  // yarım surrogate üretip karakteri bozuyordu ("" ve geri dönüşü olmayan metin).
  describe("emoji surrogate sınırları (m62)", () => {
    it("imleç emoji'nin ortasındayken karakteri ikiye bölmez", () => {
      // "😊" 2 kod birimi (0-1); 1 = çiftin ortası.
      const result = insertTextAtSelection("😊", "!", { start: 1, end: 1 });

      expect(result.value).toBe("!😊");
      // Array.from kod NOKTASI bazında gezer: yarım surrogate kalsaydı burada
      // ayrı bir bozuk eleman olarak görünürdü.
      expect(Array.from(result.value)).toEqual(["!", "😊"]);
    });

    it("seçim bitişi emoji'nin ortasındayken emoji'nin tamamını değiştirir", () => {
      // "ab😊cd": emoji 2-3 kod biriminde; 3 = ortası.
      const result = insertTextAtSelection("ab😊cd", "X", { start: 2, end: 3 });

      expect(result.value).toBe("abXcd");
      expect(Array.from(result.value)).toEqual(["a", "b", "X", "c", "d"]);
    });

    it("emoji'den emoji'ye eklemede metin bozulmaz", () => {
      const first = insertTextAtSelection("", "😊", { start: 0, end: 0 });
      // Bayat imleç çiftin ortasını gösteriyor (gerçek hayatta sık).
      const second = insertTextAtSelection(first.value, "🎉", { start: 1, end: 1 });

      expect(Array.from(second.value)).toEqual(["🎉", "😊"]);
    });
  });
});
