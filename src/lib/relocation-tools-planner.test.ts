import { describe, expect, it } from "vitest";

import {
  type PlannerAnswers,
  PHASE_ORDER,
  arrivalProximity,
  generatePlannerTasks,
  groupTasksByPhase,
} from "@/lib/relocation-tools-planner";

// docs/10tool/08 §4 — görev kataloğu + priority formülü aynası (SQL relocation_score_first_90_days_v1).

describe("arrivalProximity — varış yakınlığı", () => {
  it("tarih yoksa nötr 0.6", () => {
    expect(arrivalProximity(undefined)).toBe(0.6);
    expect(arrivalProximity("invalid")).toBe(0.6);
  });
  it("çok uzak tarih ≥180g → 0.3", () => {
    const far = new Date(Date.now() + 400 * 86_400_000).toISOString().slice(0, 10);
    expect(arrivalProximity(far)).toBe(0.3);
  });
});

describe("generatePlannerTasks — boş cevap (varsayılan gap'ler)", () => {
  it("cevapsızken belge/konaklama/sigorta gibi 'bilinmiyor' görevleri üretilir + her zaman integration_routine", () => {
    const tasks = generatePlannerTasks({});
    const keys = tasks.map((t) => t.key);
    // Bilinmeyen (undefined) cevaplar gap sayılır:
    expect(keys).toContain("health_insurance_setup");
    expect(keys).toContain("housing_secure");
    expect(keys).toContain("documents_copies");
    expect(keys).toContain("address_registration");
    // Her zaman üretilen:
    expect(keys).toContain("integration_routine");
    // visa_status undefined → 'applied/researching/none' listesinde değil → visa_finalize ÜRETİLMEZ
    expect(keys).not.toContain("visa_finalize");
  });
});

describe("generatePlannerTasks — gap olmayan cevaplar görev üretmez", () => {
  it("her şey 'hazır' ise sadece her-zaman görev kalır", () => {
    const ready: PlannerAnswers = {
      visa_status: "approved",
      housing_status: "secured",
      health_insurance: "active",
      banking: "ready",
      phone_internet: "ready",
      address_registration_known: "yes",
      documents_ready: "yes",
      emergency_contacts: "yes",
      transport: "public_transport",
      tax_social_security: "yes",
      children_school: "no",
      pets: "no",
      credential_recognition: "no",
      language_course: "no",
      driving_license: "no",
    };
    const keys = generatePlannerTasks(ready).map((t) => t.key);
    expect(keys).toEqual(["integration_routine"]);
  });
});

describe("generatePlannerTasks — faz sıralaması", () => {
  it("görevler faz sırasına (before_departure önce) göre sıralanır", () => {
    const tasks = generatePlannerTasks({ visa_status: "none", banking: "none" });
    const phases = tasks.map((t) => PHASE_ORDER[t.phase]);
    const sorted = [...phases].sort((a, b) => a - b);
    expect(phases).toEqual(sorted);
  });
});

describe("generatePlannerTasks — priority formülü (deterministic)", () => {
  it("visa_finalize önceliği formülle birebir (proximity 0.6, no arrival_date)", () => {
    const tasks = generatePlannerTasks({ visa_status: "none" });
    const visa = tasks.find((t) => t.key === "visa_finalize");
    // deadline = 1.0*0.5 + 1.0*0.3 + 0.6*0.2 = 0.92
    // priority = 0.92*0.4 + 1.0*0.25 + 1.0*0.25 + 0.8*0.1 = 0.368 + 0.25 + 0.25 + 0.08 = 0.948
    expect(visa?.priority).toBeCloseTo(0.948, 4);
  });
});

describe("groupTasksByPhase", () => {
  it("dolu fazları sırayla gruplar, boşları atlar", () => {
    const groups = groupTasksByPhase(generatePlannerTasks({ pets: "yes" }));
    expect(groups.length).toBeGreaterThan(0);
    // gruplar faz sırasında
    const order = groups.map((g) => PHASE_ORDER[g.phase]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // pets görevi before_departure'da
    const before = groups.find((g) => g.phase === "before_departure");
    expect(before?.tasks.some((t) => t.key === "pets_transfer")).toBe(true);
  });
});
