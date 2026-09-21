import { describe, expect, it } from "vitest";

import { KADRO_ROLE_IDS } from "./roles";
import { KADRO_ROUTINES, KADRO_ROUTINE_FREQS, groupRoutinesByFreq } from "./kadro-routines";

describe("kadro rutinleri", () => {
  it("17 rutin tanımlar", () => {
    expect(KADRO_ROUTINES).toHaveLength(17);
  });

  it("her rutinin sahibi GERÇEK bir rol anahtarıdır", () => {
    for (const routine of KADRO_ROUTINES) {
      expect(KADRO_ROLE_IDS.has(routine.owner), `${routine.name} → ${routine.owner}`).toBe(true);
    }
  });

  it("sıklıklar tanımlı kümededir", () => {
    for (const routine of KADRO_ROUTINES) {
      expect(KADRO_ROUTINE_FREQS).toContain(routine.freq);
    }
  });

  it("gruplama sıklık sırasını korur ve boş grup üretmez", () => {
    const groups = groupRoutinesByFreq(KADRO_ROUTINES);
    expect(groups.map((g) => g.freq)).toEqual(["Günlük", "Haftalık", "Aylık", "Yıllık"]);
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});
