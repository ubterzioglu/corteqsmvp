// Kural ve kart seed SQL'ini rules.ts'ten üretir:  node --experimental-strip-types scripts/gen-seed.ts
import { writeFileSync } from "node:fs";
import { DEFAULT_CARDS, DEFAULT_RULES } from "../supabase/functions/_shared/engine/rules.ts";
const q = (v: unknown) => v === null || v === undefined ? "null" : typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v);
const sql = [
  "-- Otomatik üretildi: scripts/gen-seed.ts (kaynak: supabase/functions/_shared/engine/rules.ts)",
  "-- Tekrar çalıştırılabilir: aynı pattern varsa atlanır.",
  "insert into public.payment_cards (last4, label, bank, payment_method, owner, is_virtual, default_person) values",
  DEFAULT_CARDS.map((c) => `  (${[c.last4, c.label, c.bank, c.payment_method, c.owner, c.is_virtual, c.default_person ?? "ortak"].map(q).join(", ")})`).join(",\n"),
  "on conflict (last4) do nothing;",
  "",
  "insert into public.merchant_rules (pattern, merchant, category, person, is_tech, share_pct, priority, auto_commit)",
  "select * from (values",
  DEFAULT_RULES.map((r) => `  (${[r.pattern, r.merchant, r.category, r.person ?? null].map(q).join(", ")}, ${r.is_tech}, ${r.share_pct ?? "null::numeric"}, ${r.priority ?? 100}, ${!!r.auto_commit})`).join(",\n"),
  ") as v(pattern, merchant, category, person, is_tech, share_pct, priority, auto_commit)",
  "where not exists (select 1 from public.merchant_rules m where m.pattern = v.pattern);",
  "",
].join("\n");
writeFileSync(new URL("../supabase/seed/merchant_rules_seed.sql", import.meta.url), sql);
console.log(`${DEFAULT_RULES.length} kural, ${DEFAULT_CARDS.length} kart yazıldı`);
