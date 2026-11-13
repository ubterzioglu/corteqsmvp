import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const fileName = "20260922200000_directory_exclude_placeholders.sql";
const pendingPath = `supabase/migrations/${fileName}`;
const appliedPath = `supabase/migrations/applied/${fileName}`;

const migration = readFileSync(existsSync(pendingPath) ? pendingPath : appliedPath, "utf8");

describe("dizin placeholder elemesi", () => {
  it("placeholder kayıtları arama sonucundan eler", () => {
    expect(migration).toContain("not coalesce(ci.is_placeholder, false)");
  });

  it("kayıtları SİLMEZ ve yayından kaldırmaz — yalnız aramada gizler", () => {
    expect(migration).not.toMatch(/delete\s+from\s+public\.catalog_items/i);
    expect(migration).not.toMatch(/update\s+public\.catalog_items/i);
  });

  it("B20 yönetici koşulları ve semantik dal bozulursa yamayı reddeder", () => {
    expect(migration).toContain("refusing placeholder patch");
    expect(migration).toContain("semantic_hits");
    expect(migration).toContain("r_x.key ilike ''Admin_%''");
    expect(migration).toContain("r_x.key ilike ''Moderator_%''");
  });

  it("iki kez uygulanmayı reddeder", () => {
    expect(migration).toContain("placeholder filter already present");
  });
});
