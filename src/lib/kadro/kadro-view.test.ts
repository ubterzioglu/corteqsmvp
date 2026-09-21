import { describe, expect, it } from "vitest";
import { KADRO_ROLES } from "./roles";
import {
  resolveKadroRoles,
  findOrphanStateKeys,
  filterKadroRoles,
  summarizeKadroRoles,
  groupKadroRoles,
  KADRO_EMPTY_FILTERS,
} from "./kadro-view";
import type { KadroRoleState } from "./kadro-types";

describe("resolveKadroRoles", () => {
  it("DB state yoksa kod varsayılanını kullanır", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const ceo = resolved.find((r) => r.id === "ld-ceo")!;

    expect(ceo.currentStatus).toBe("dolu");
    expect(ceo.currentPriority).toBe("kritik");
    expect(ceo.currentOwner).toBe("Burak Akçakanat");
    expect(ceo.hasState).toBe(false);
  });

  it("DB state varsa onu kullanır", () => {
    const state: KadroRoleState = {
      roleKey: "ld-cmo",
      status: "gorusme",
      priority: "yuksek",
      ownerName: "Zeynep Kaya",
      note: "İkinci tur",
      updatedAt: "2026-09-21T10:00:00Z",
      updatedBy: "user-1",
    };

    const resolved = resolveKadroRoles(KADRO_ROLES, [state]);
    const cmo = resolved.find((r) => r.id === "ld-cmo")!;

    expect(cmo.currentStatus).toBe("gorusme");
    expect(cmo.currentPriority).toBe("yuksek");
    expect(cmo.currentOwner).toBe("Zeynep Kaya");
    expect(cmo.note).toBe("İkinci tur");
    expect(cmo.hasState).toBe(true);
  });

  it("null state alanları kod varsayılanına düşer", () => {
    const state: KadroRoleState = {
      roleKey: "ld-cmo",
      status: null,
      priority: null,
      ownerName: null,
      note: null,
      updatedAt: "2026-09-21T10:00:00Z",
      updatedBy: "user-1",
    };

    const resolved = resolveKadroRoles(KADRO_ROLES, [state]);
    const cmo = resolved.find((r) => r.id === "ld-cmo")!;

    expect(cmo.currentStatus).toBe("acik");
    expect(cmo.currentPriority).toBe("kritik");
    expect(cmo.currentOwner).toBe("");
    expect(cmo.hasState).toBe(true);
  });
});

describe("findOrphanStateKeys", () => {
  it("kodda karşılığı olmayan state'leri bulur", () => {
    const states: KadroRoleState[] = [
      {
        roleKey: "ld-ceo",
        status: "dolu",
        priority: "kritik",
        ownerName: null,
        note: null,
        updatedAt: "2026-09-21T10:00:00Z",
        updatedBy: null,
      },
      {
        roleKey: "non-existent-role",
        status: "acik",
        priority: "orta",
        ownerName: null,
        note: null,
        updatedAt: "2026-09-21T10:00:00Z",
        updatedBy: null,
      },
    ];

    const orphans = findOrphanStateKeys(states);
    expect(orphans).toEqual(["non-existent-role"]);
  });

  it("tüm state'lerin karşılığı varsa boş dizi döner", () => {
    const states: KadroRoleState[] = [
      {
        roleKey: "ld-ceo",
        status: "dolu",
        priority: "kritik",
        ownerName: null,
        note: null,
        updatedAt: "2026-09-21T10:00:00Z",
        updatedBy: null,
      },
    ];

    const orphans = findOrphanStateKeys(states);
    expect(orphans).toEqual([]);
  });
});

describe("filterKadroRoles", () => {
  const resolved = resolveKadroRoles(KADRO_ROLES, []);

  it("filtre yoksa tüm rolleri döner", () => {
    const filtered = filterKadroRoles(resolved, KADRO_EMPTY_FILTERS);
    expect(filtered).toHaveLength(52);
  });

  it("departman filtresi çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, dept: "pazarlama" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => r.dept === "pazarlama")).toBe(true);
  });

  it("wave filtresi çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, wave: "1" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => r.wave === 1)).toBe(true);
  });

  it("type filtresi çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, type: "core" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => r.type === "core")).toBe(true);
  });

  it("status filtresi çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, status: "dolu" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => r.currentStatus === "dolu")).toBe(true);
  });

  it("openOnly filtresi çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, openOnly: true });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => ["acik", "aday", "gorusme", "teklif"].includes(r.currentStatus))).toBe(true);
  });

  it("arama Türkçe karakter toleranslı çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, q: "Radar" });
    expect(filtered.some((r) => r.id === "pz-radar")).toBe(true);
  });

  it("arama title'da çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, q: "CEO" });
    expect(filtered.some((r) => r.id === "ld-ceo")).toBe(true);
  });

  it("arama owner'da çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, q: "Burak" });
    expect(filtered.some((r) => r.id === "ld-ceo")).toBe(true);
  });

  it("arama kpi'da çalışır", () => {
    const filtered = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, q: "büyüme" });
    expect(filtered.length).toBeGreaterThan(0);
  });
});

describe("summarizeKadroRoles", () => {
  it("doğru özet çıkarır", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const summary = summarizeKadroRoles(resolved);

    expect(summary.total).toBe(52);
    expect(summary.open).toBeGreaterThan(0);
    expect(summary.filled).toBeGreaterThan(0);
    expect(summary.criticalOpen).toBeGreaterThanOrEqual(0);
    expect(summary.open + summary.filled).toBeLessThanOrEqual(summary.total);
  });

  it("kritik açık pozisyonları doğru sayar", () => {
    const state: KadroRoleState = {
      roleKey: "pz-radar",
      status: "acik",
      priority: "kritik",
      ownerName: null,
      note: null,
      updatedAt: "2026-09-21T10:00:00Z",
      updatedBy: null,
    };

    const resolved = resolveKadroRoles(KADRO_ROLES, [state]);
    const summary = summarizeKadroRoles(resolved);

    expect(summary.criticalOpen).toBeGreaterThan(0);
  });
});

describe("groupKadroRoles", () => {
  it("rolleri departman ve eksene göre gruplar", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const groups = groupKadroRoles(resolved);

    expect(groups.length).toBeGreaterThan(0);
    expect(groups.some((g) => g.deptId === "pazarlama")).toBe(true);
    expect(groups.some((g) => g.deptId === "urun")).toBe(true);
  });

  it("her departmanın en az bir ekseni vardır", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const groups = groupKadroRoles(resolved);

    for (const group of groups) {
      expect(group.axes.length).toBeGreaterThan(0);
      for (const axis of group.axes) {
        expect(axis.roles.length).toBeGreaterThan(0);
      }
    }
  });

  it("pazarlama departmanı 3 eksene sahiptir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const groups = groupKadroRoles(resolved);
    const pazarlama = groups.find((g) => g.deptId === "pazarlama")!;

    expect(pazarlama.axes.length).toBe(3);
    expect(pazarlama.axes.map((a) => a.axisId).sort()).toEqual(["cografya", "islev", "urun"]);
  });
});
