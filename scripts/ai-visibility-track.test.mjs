// scripts/ai-visibility-track.mjs testleri.
//
// Prompt setinin bütünlüğünü ve rapor üretiminin doğruluğunu test eder.

import { describe, expect, it } from "vitest";

import { generateReport, PLATFORMS, PROMPTS } from "./ai-visibility-track.mjs";

describe("AI Visibility Tracking", () => {
  it("30 prompt tanımlıdır", () => {
    expect(PROMPTS.length).toBe(30);
  });

  it("her prompt benzersizdir", () => {
    const unique = new Set(PROMPTS);
    expect(unique.size).toBe(PROMPTS.length);
  });

  it("5 platform tanımlıdır", () => {
    expect(PLATFORMS.length).toBe(5);
    expect(PLATFORMS).toContain("chatgpt");
    expect(PLATFORMS).toContain("perplexity");
    expect(PLATFORMS).toContain("google-ai");
    expect(PLATFORMS).toContain("gemini");
    expect(PLATFORMS).toContain("claude");
  });

  it("generateReport boş kayıt için uyarı üretir", () => {
    const report = generateReport([]);
    expect(report).toContain("Henüz kayıt yok");
  });

  it("generateReport kayıt varsa KPI tablosu üretir", () => {
    const records = [
      { platform: "chatgpt", promptIndex: 0, found: "yes", sentiment: 80 },
      { platform: "chatgpt", promptIndex: 1, found: "no", sentiment: 30 },
      { platform: "perplexity", promptIndex: 0, found: "partial", sentiment: 60 },
    ];
    const report = generateReport(records);

    expect(report).toContain("# AI Visibility Raporu");
    expect(report).toContain("chatgpt");
    expect(report).toContain("perplexity");
    expect(report).toContain("Visibility Score");
    expect(report).toContain("Sentiment");
  });

  it("visibility score hesaplaması doğru çalışır", () => {
    const records = [
      { platform: "test", promptIndex: 0, found: "yes", sentiment: 70 },
      { platform: "test", promptIndex: 1, found: "yes", sentiment: 80 },
      { platform: "test", promptIndex: 2, found: "no", sentiment: 40 },
      { platform: "test", promptIndex: 3, found: "partial", sentiment: 60 },
    ];
    const report = generateReport(records);

    // 2 yes + 1 partial*0.5 = 2.5 / 4 = %62.5 → %63 (Math.round)
    expect(report).toContain("%63");
  });
});
