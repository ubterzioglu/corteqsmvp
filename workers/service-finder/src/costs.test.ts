import { describe, expect, it } from "vitest";

import {
  estimateGeminiCost,
  estimateSerpApiSearchCost,
  estimateTavilyExtractCost,
  estimateTavilySearchCost,
} from "./costs.js";

describe("estimateTavilySearchCost", () => {
  it("basic arama 1 kredi = $0.008", () => {
    expect(estimateTavilySearchCost("basic")).toEqual({ units: 1, amountUsd: 0.008 });
  });

  it("advanced arama 2 kredi = $0.016", () => {
    expect(estimateTavilySearchCost("advanced")).toEqual({ units: 2, amountUsd: 0.016 });
  });

  it("bilinmeyen derinlik basic gibi fiyatlanır", () => {
    expect(estimateTavilySearchCost("unknown")).toEqual({ units: 1, amountUsd: 0.008 });
  });

  it("spec örneği: 10 basic arama = $0.080", () => {
    const single = estimateTavilySearchCost("basic");
    expect(Math.round(single.amountUsd * 10 * 1000) / 1000).toBe(0.08);
  });
});

describe("estimateTavilyExtractCost", () => {
  it("basic: 5 URL = 1 kredi = $0.008", () => {
    expect(estimateTavilyExtractCost(5, "basic")).toEqual({ units: 1, amountUsd: 0.008 });
  });

  it("spec örneği: 20 basic URL = 4 kredi = $0.032", () => {
    expect(estimateTavilyExtractCost(20, "basic")).toEqual({ units: 4, amountUsd: 0.032 });
  });

  it("advanced: 20 URL = 8 kredi = $0.064", () => {
    expect(estimateTavilyExtractCost(20, "advanced")).toEqual({ units: 8, amountUsd: 0.064 });
  });

  it("0 başarılı URL = 0 maliyet", () => {
    expect(estimateTavilyExtractCost(0, "basic")).toEqual({ units: 0, amountUsd: 0 });
  });
});

describe("estimateSerpApiSearchCost", () => {
  it("arama başına $0.015 (Developer planı)", () => {
    expect(estimateSerpApiSearchCost()).toEqual({ units: 1, amountUsd: 0.015 });
  });
});

describe("estimateGeminiCost", () => {
  it("2.5 flash-lite: 4000 giriş + 600 çıkış ≈ $0.0006", () => {
    const { amountUsd } = estimateGeminiCost("gemini-2.5-flash-lite", 4000, 600);
    // 4000/1M*0.10 + 600/1M*0.40 = 0.0004 + 0.00024 = 0.00064 → 4 hane yuvarlama
    expect(amountUsd).toBeCloseTo(0.0006, 4);
  });

  it("2.5 flash: 4000 giriş + 600 çıkış ≈ $0.0027", () => {
    const { amountUsd } = estimateGeminiCost("gemini-2.5-flash", 4000, 600);
    // 0.0012 + 0.0015 = 0.0027
    expect(amountUsd).toBeCloseTo(0.0027, 4);
  });

  it("bilinmeyen model flash fiyatına düşer (korumacı)", () => {
    const unknown = estimateGeminiCost("gemini-x", 1_000_000, 0);
    const flash = estimateGeminiCost("gemini-2.5-flash", 1_000_000, 0);
    expect(unknown.amountUsd).toBe(flash.amountUsd);
  });
});
