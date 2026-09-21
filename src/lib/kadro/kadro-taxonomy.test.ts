import { describe, expect, it } from "vitest";

import {
  KADRO_AD_BLOCKS, KADRO_AXES, KADRO_CANDIDATE_STAGES, KADRO_DEPTS,
  KADRO_FILLED_STATUSES, KADRO_OPEN_STATUSES, KADRO_PRIORITIES,
  KADRO_STATUSES, KADRO_WAVES, KADRO_WORK_TYPES,
} from "./kadro-taxonomy";

describe("kadro taksonomisi", () => {
  it("altı bölüm tanımlar ve id'leri benzersizdir", () => {
    expect(KADRO_DEPTS).toHaveLength(6);
    expect(new Set(KADRO_DEPTS.map((d) => d.id)).size).toBe(6);
  });

  it("dört eksen ve üç dalga tanımlar", () => {
    expect(KADRO_AXES).toHaveLength(4);
    expect(KADRO_WAVES.map((w) => w.id)).toEqual([1, 2, 3]);
  });

  it("yedi durum ve dört öncelik tanımlar", () => {
    expect(Object.keys(KADRO_STATUSES)).toHaveLength(7);
    expect(Object.keys(KADRO_PRIORITIES)).toHaveLength(4);
    expect(Object.keys(KADRO_WORK_TYPES)).toHaveLength(6);
    expect(Object.keys(KADRO_CANDIDATE_STAGES)).toHaveLength(4);
  });

  it("açık ve dolu durum kümeleri örtüşmez ve hepsi tanımlı durumdur", () => {
    const overlap = KADRO_OPEN_STATUSES.filter((s) => KADRO_FILLED_STATUSES.includes(s));
    expect(overlap).toEqual([]);
    for (const status of [...KADRO_OPEN_STATUSES, ...KADRO_FILLED_STATUSES]) {
      expect(KADRO_STATUSES[status]).toBeDefined();
    }
  });

  it("etiketler Türkçe karakter kaybetmemiştir", () => {
    expect(KADRO_STATUSES.acik.label).toBe("Açık");
    expect(KADRO_STATUSES.gorusme.label).toBe("Görüşmede");
    expect(KADRO_PRIORITIES.yuksek.label).toBe("Yüksek");
    expect(KADRO_PRIORITIES.dusuk.label).toBe("Düşük");
    expect(KADRO_CANDIDATE_STAGES.gorusme).toBe("Görüşmede");
  });

  it("ortak ilan blokları doldurulmuştur — yer tutucu kalmamıştır", () => {
    for (const block of Object.values(KADRO_AD_BLOCKS)) {
      expect(block.length).toBeGreaterThan(200);
      expect(block).not.toContain("…");
    }
  });
});
