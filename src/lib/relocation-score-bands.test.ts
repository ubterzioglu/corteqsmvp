import { describe, expect, it } from "vitest";

import {
  SCORE_BAND_LABELS,
  SCORE_BAND_ORDER,
  SCORE_BAND_STYLES,
  scoreBand,
} from "@/lib/relocation-score-bands";
import { dimensionBandLabel } from "@/lib/relocation-tools-copy";

describe("scoreBand", () => {
  it("eşikleri sınırlarında doğru bantlar", () => {
    expect(scoreBand(0.8)).toBe("strong");
    expect(scoreBand(0.799)).toBe("good");
    expect(scoreBand(0.6)).toBe("good");
    expect(scoreBand(0.599)).toBe("fair");
    expect(scoreBand(0.4)).toBe("fair");
    expect(scoreBand(0.399)).toBe("weak");
  });

  it("uçları ve bozuk değerleri güvenle karşılar", () => {
    expect(scoreBand(1)).toBe("strong");
    expect(scoreBand(0)).toBe("weak");
    expect(scoreBand(Number.NaN)).toBe("weak");
  });
});

describe("bant görselleri", () => {
  it("dört bandın da etiketi ve stili tanımlıdır", () => {
    for (const band of SCORE_BAND_ORDER) {
      expect(SCORE_BAND_LABELS[band]).toBeTruthy();
      expect(SCORE_BAND_STYLES[band].bar).toBeTruthy();
      expect(SCORE_BAND_STYLES[band].chip).toBeTruthy();
    }
  });

  it("her bandın bar rengi FARKLIDIR", () => {
    // Bant rengi bilgi taşır; iki bant aynı rengi alırsa kart yalan söyler.
    const bars = SCORE_BAND_ORDER.map((band) => SCORE_BAND_STYLES[band].bar);
    expect(new Set(bars).size).toBe(SCORE_BAND_ORDER.length);
  });

  it("renk TEK BAŞINA anlam taşımaz — her bandın metin etiketi de vardır", () => {
    // Erişilebilirlik kuralı: durum rengi daima ikon + etiketle birlikte gelir.
    for (const band of SCORE_BAND_ORDER) {
      expect(SCORE_BAND_LABELS[band].length).toBeGreaterThan(0);
    }
  });
});

describe("dimensionBandLabel ile tek kaynak", () => {
  it("eski yardımcı yeni bant eşiklerinden türer", () => {
    // Eşikler İKİ yerde tanımlı kalsaydı biri değişince kart ile rozet farklı
    // bant gösterirdi. dimensionBandLabel artık scoreBand'e delege eder.
    for (const value of [0, 0.39, 0.4, 0.59, 0.6, 0.79, 0.8, 1]) {
      expect(dimensionBandLabel(value)).toBe(SCORE_BAND_LABELS[scoreBand(value)]);
    }
  });

  it("Türkçe etiketleri korur (mevcut ekranlar bozulmasın)", () => {
    expect(dimensionBandLabel(0.9)).toBe("Güçlü");
    expect(dimensionBandLabel(0.7)).toBe("İyi");
    expect(dimensionBandLabel(0.5)).toBe("Orta");
    expect(dimensionBandLabel(0.1)).toBe("Zayıf");
  });
});
