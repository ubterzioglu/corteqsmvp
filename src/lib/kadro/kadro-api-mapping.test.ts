// Kadro satır eşlemesi sözleşmesi (A05c).
//
// Neden var: 27.09.2026'ya kadar `kadro-api.ts` `(supabase as any).from(name)`
// gevşek şimini kullanıyor ve satırları DÖNÜŞTÜRMEDEN `as KadroRoleState[]` ile
// işaretliyordu. DB sütunları snake_case, alan tipleri camelCase olduğu için
// tüketicilerin okuduğu her alan `undefined`'dı:
//   - `kadro-view.ts` → `stateMap` anahtarı `s.roleKey` → hepsi undefined,
//     yani kaydedilmiş hiçbir rol durumu panoda görünmezdi
//   - `KadroEventLog.tsx` → `event.changedAt` / `event.oldValue`
//   - `KadroCandidateList.tsx` → `candidate.fullName`
// Cast, tsc'nin bunu görmesini engelliyordu. Canlıda patlamamasının tek sebebi
// üç kadro tablosunun da BOŞ olmasıydı (ölçüm 27.09.2026: 0 / 0 / 0 satır).
//
// Bu testler eşlemeyi kilitler. Sütun adı değişirse burada düşer, canlıda değil.
import { describe, expect, it } from "vitest";

import {
  mapKadroCandidate,
  mapKadroRoleEvent,
  mapKadroRoleState,
} from "@/lib/kadro/kadro-api";

describe("mapKadroRoleState", () => {
  const row = {
    role_key: "kurucu-cto",
    status: "gorusme",
    priority: "kritik",
    owner_name: "UBT",
    note: "iki aday var",
    updated_at: "2026-09-27T10:00:00Z",
    updated_by: "user-1",
  };

  it("snake_case sütunları camelCase alanlara çevirir", () => {
    expect(mapKadroRoleState(row)).toEqual({
      roleKey: "kurucu-cto",
      status: "gorusme",
      priority: "kritik",
      ownerName: "UBT",
      note: "iki aday var",
      updatedAt: "2026-09-27T10:00:00Z",
      updatedBy: "user-1",
    });
  });

  // Kusurun tam noktası: kadro-view stateMap'i bu alanla kuruyor.
  it("`roleKey` ASLA undefined bırakmaz", () => {
    expect(mapKadroRoleState(row).roleKey).toBe("kurucu-cto");
    expect(mapKadroRoleState(row)).not.toHaveProperty("role_key");
  });

  it("boş alanları null olarak korur", () => {
    const mapped = mapKadroRoleState({
      ...row,
      status: null,
      priority: null,
      owner_name: null,
      note: null,
      updated_by: null,
    });

    expect(mapped.status).toBeNull();
    expect(mapped.priority).toBeNull();
    expect(mapped.ownerName).toBeNull();
    expect(mapped.note).toBeNull();
    expect(mapped.updatedBy).toBeNull();
  });
});

describe("mapKadroRoleEvent", () => {
  const row = {
    id: "event-1",
    role_key: "kurucu-cto",
    field: "status",
    old_value: "acik",
    new_value: "gorusme",
    changed_by: "user-1",
    changed_at: "2026-09-27T11:00:00Z",
  };

  it("olay sütunlarını camelCase alanlara çevirir", () => {
    expect(mapKadroRoleEvent(row)).toEqual({
      id: "event-1",
      roleKey: "kurucu-cto",
      field: "status",
      oldValue: "acik",
      newValue: "gorusme",
      changedBy: "user-1",
      changedAt: "2026-09-27T11:00:00Z",
    });
  });

  // KadroEventLog.tsx bu üç alanı doğrudan ekrana basıyor.
  it("KadroEventLog'un okuduğu alanlar dolu gelir", () => {
    const mapped = mapKadroRoleEvent(row);
    expect(mapped.changedAt).toBeTruthy();
    expect(mapped.oldValue).toBe("acik");
    expect(mapped.newValue).toBe("gorusme");
  });
});

describe("mapKadroCandidate", () => {
  const row = {
    id: "cand-1",
    role_key: "kurucu-cto",
    full_name: "Ayşe Yılmaz",
    links: "https://example.test",
    stage: "gorusme",
    note: "ikinci tur",
    created_by: "user-1",
    created_at: "2026-09-27T09:00:00Z",
    updated_at: "2026-09-27T12:00:00Z",
  };

  it("aday sütunlarını camelCase alanlara çevirir", () => {
    expect(mapKadroCandidate(row)).toEqual({
      id: "cand-1",
      roleKey: "kurucu-cto",
      fullName: "Ayşe Yılmaz",
      links: "https://example.test",
      stage: "gorusme",
      note: "ikinci tur",
      createdBy: "user-1",
      createdAt: "2026-09-27T09:00:00Z",
      updatedAt: "2026-09-27T12:00:00Z",
    });
  });

  // Arayüz bu iki alanı input value'suna veriyor; null React uyarısı üretir.
  it("null `links` ve `note` alanlarını boş dizeye indirir", () => {
    const mapped = mapKadroCandidate({ ...row, links: null, note: null });
    expect(mapped.links).toBe("");
    expect(mapped.note).toBe("");
  });

  it("Türkçe karakterleri bozmadan taşır", () => {
    expect(mapKadroCandidate(row).fullName).toBe("Ayşe Yılmaz");
  });
});
