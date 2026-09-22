import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const fileName = "20260922170000_public_profile_provenance.sql";
const pendingPath = `supabase/migrations/${fileName}`;
const appliedPath = `supabase/migrations/applied/${fileName}`;

const migration = readFileSync(existsSync(pendingPath) ? pendingPath : appliedPath, "utf8");

describe("B16 provenance migration", () => {
  it("künyeyi var olan alanlardan TÜRETİR, 61 satıra metin yazmaz", () => {
    expect(migration).toContain("v_item.attributes->>'import_source'");
    expect(migration).toContain("to_char(v_item.created_at, 'YYYY-MM-DD')");
    expect(migration).not.toMatch(/update\s+public\.catalog_items/i);
  });

  it("künyeyi yalnız sahibi olmayan içe aktarma kayıtlarında açar", () => {
    expect(migration).toContain("v_item.created_by is null");
    expect(migration).toContain("else null");
  });

  it("canlı gövde sözleşmesi bozulmuşsa yamayı reddeder", () => {
    expect(migration).toContain("refusing provenance patch");
    expect(migration).toContain("provenance patch point not found");
    expect(migration).toContain("provenance already present");
  });
});
