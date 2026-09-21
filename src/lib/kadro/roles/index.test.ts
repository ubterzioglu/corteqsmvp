import { describe, expect, it } from "vitest";

import { KADRO_DEPTS, KADRO_PRIORITIES, KADRO_STATUSES, KADRO_WORK_TYPES } from "../kadro-taxonomy";
import { KADRO_ROLES, kadroRoleById } from "./index";

const EXPECTED_BY_DEPT: Record<string, number> = {
  kurucu: 5, kurumsal: 3, pazarlama: 27, urun: 9, operasyon: 5, gelir: 3,
};

const EXPECTED_BY_AXIS: Record<string, number> = {
  merkez: 25, islev: 11, cografya: 9, urun: 7,
};

describe("kadro rol kataloğu", () => {
  it("tam 52 rol içerir", () => {
    expect(KADRO_ROLES).toHaveLength(52);
  });

  it("rol id'leri benzersizdir", () => {
    const ids = KADRO_ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("bölüm dağılımı beklenen sayılardadır", () => {
    for (const [dept, count] of Object.entries(EXPECTED_BY_DEPT)) {
      expect(KADRO_ROLES.filter((r) => r.dept === dept)).toHaveLength(count);
    }
  });

  it("eksen dağılımı beklenen sayılardadır", () => {
    for (const [axis, count] of Object.entries(EXPECTED_BY_AXIS)) {
      expect(KADRO_ROLES.filter((r) => r.axis === axis)).toHaveLength(count);
    }
  });

  it("her rolün alanları tanımlı değer kümelerindedir", () => {
    const deptIds = new Set(KADRO_DEPTS.map((d) => d.id));
    for (const role of KADRO_ROLES) {
      expect(deptIds.has(role.dept)).toBe(true);
      expect(["urun", "islev", "cografya", "merkez"]).toContain(role.axis);
      expect([1, 2, 3]).toContain(role.wave);
      expect(KADRO_WORK_TYPES[role.type]).toBeDefined();
      expect(KADRO_STATUSES[role.status]).toBeDefined();
      expect(KADRO_PRIORITIES[role.pri]).toBeDefined();
    }
  });

  it("her rolün zorunlu metin alanları doludur", () => {
    for (const role of KADRO_ROLES) {
      for (const field of ["title", "reports", "hours", "pay", "esop", "cadence", "tools", "trigger", "exit", "jd"] as const) {
        expect(role[field], `${role.id}.${field}`).toBeTruthy();
      }
      expect(role.kpi.length, `${role.id}.kpi`).toBeGreaterThan(0);
      expect(role.jd.length, `${role.id}.jd`).toBeGreaterThan(80);
    }
  });

  it("50 rolde ilan metni vardır, 2 kurucu rolünde yoktur", () => {
    const withAd = KADRO_ROLES.filter((r) => r.ad !== null);
    expect(withAd).toHaveLength(50);
    expect(KADRO_ROLES.filter((r) => r.ad === null).map((r) => r.id).sort())
      .toEqual(["ld-ceo", "ld-cto"]);
  });

  it("ilan metinleri eksiksizdir", () => {
    for (const role of KADRO_ROLES) {
      if (!role.ad) continue;
      expect(role.ad.sum.length, `${role.id}.ad.sum`).toBeGreaterThan(40);
      expect(role.ad.does.length, `${role.id}.ad.does`).toBeGreaterThan(0);
      expect(role.ad.profile.length, `${role.id}.ad.profile`).toBeGreaterThan(0);
      expect(role.ad.test, `${role.id}.ad.test`).toContain("Görev testi");
    }
  });

  it("transkripsiyonda yer tutucu kalmamıştır", () => {
    const blob = JSON.stringify(KADRO_ROLES);
    expect(blob).not.toContain("…");
    expect(blob).not.toContain("TODO");
    expect(blob).not.toContain("TBD");
  });

  it("kadroRoleById bilinen ve bilinmeyen id'yi doğru yanıtlar", () => {
    expect(kadroRoleById("pz-radar")?.title).toContain("Radar");
    expect(kadroRoleById("yok-boyle-bir-rol")).toBeUndefined();
  });
});
