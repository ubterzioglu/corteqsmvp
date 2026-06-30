import { describe, expect, it } from "vitest";

import {
  STEPSTONE_2026,
  compareStepstone,
  getStepstoneCities,
  getStepstoneJobGroups,
} from "@/lib/germany-stepstone";

// Kaynak: ref101 StepStone Gehaltsreport 2026.

describe("STEPSTONE_2026 veri bütünlüğü", () => {
  it("genel medyan ve mean tanımlı", () => {
    expect(STEPSTONE_2026.overall.median).toBe(53900);
    expect(STEPSTONE_2026.overall.mean).toBe(59100);
  });
  it("16 eyalet, 6 deneyim bandı", () => {
    expect(Object.keys(STEPSTONE_2026.states)).toHaveLength(16);
    expect(Object.keys(STEPSTONE_2026.experience)).toHaveLength(6);
  });
  it("şehirler ve meslek grupları alfabetik sıralı döner", () => {
    const cities = getStepstoneCities();
    expect(cities).toEqual([...cities].sort((a, b) => a.localeCompare(b, "de")));
    const jobs = getStepstoneJobGroups();
    expect(jobs.length).toBeGreaterThan(20);
  });
});

describe("compareStepstone", () => {
  it("seçim yoksa sadece genel medyan benchmark'ı", () => {
    const r = compareStepstone({});
    expect(r.benchmarks).toHaveLength(1);
    expect(r.benchmarks[0].key).toBe("overall");
    expect(r.primaryMedian).toBe(53900);
    expect(r.diffPercent).toBeNull();
  });

  it("meslek grubu seçilince birincil medyan o olur", () => {
    const r = compareStepstone({ jobGroup: "Informationstechnologie (IT)" });
    expect(r.primaryMedian).toBe(66750);
    expect(r.benchmarks.some((b) => b.key === "jobGroup")).toBe(true);
  });

  it("deneyim, meslek grubu yoksa birincil olur", () => {
    const r = compareStepstone({ experience: "3-5" });
    expect(r.primaryMedian).toBe(51700);
  });

  it("kullanıcı maaşı medyandan yüksekse pozitif fark", () => {
    const r = compareStepstone({ jobGroup: "Informationstechnologie (IT)", salary: 80000 });
    // (80000 - 66750) / 66750 = %19.85
    expect(r.diffPercent).toBeGreaterThan(0);
    expect(r.diffPercent).toBeCloseTo(19.9, 0);
  });

  it("kullanıcı maaşı medyandan düşükse negatif fark", () => {
    const r = compareStepstone({ jobGroup: "Informationstechnologie (IT)", salary: 50000 });
    expect(r.diffPercent).toBeLessThan(0);
  });

  it("birden çok kriter → birden çok benchmark", () => {
    const r = compareStepstone({
      jobGroup: "Ingenieurwesen",
      experience: "6-10",
      city: "München",
      companySize: ">5000",
    });
    expect(r.benchmarks.length).toBe(5); // overall + 4
  });

  it("geçersiz meslek grubu yok sayılır", () => {
    const r = compareStepstone({ jobGroup: "Yok Böyle Bir Şey" });
    expect(r.benchmarks.some((b) => b.key === "jobGroup")).toBe(false);
  });
});
