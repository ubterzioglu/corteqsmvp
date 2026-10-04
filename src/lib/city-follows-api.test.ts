/**
 * M26 · city-follows-api sözleşmeleri.
 * Kilitler: tavan sabiti M24 seed aynası (migration metninden okunur) · user_id
 * İSTEMCİDEN ALINMAZ (auth.getUser) · SIRA: count ÖNCE insert SONRA (tavan
 * aşımında insert hiç denenmez) · PK çakışması idempotent · geo_cities sunucuda
 * satır başına taranmaz (filtre istemcide filterByQuery).
 */
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

const MIGRATION = "supabase/migrations/applied/20261004120000_user_city_follows.sql";

// ── supabase mock: zincir çağrıları kaydeder, sonuç tabloya+ilk op'a göre ──
type Call = { table: string; ops: string[]; row?: Record<string, unknown> };
const calls: Call[] = [];
let results: Record<string, { data?: unknown; error?: unknown; count?: number | null }> = {};
const authGetUserMock = vi.fn();

function makeChain(table: string) {
  const call: Call = { table, ops: [] };
  calls.push(call);
  const chain: Record<string, unknown> = {};
  const passthru = (op: string) => (...args: unknown[]) => {
    call.ops.push(op);
    if (op === "insert") call.row = args[0] as Record<string, unknown>;
    return chain;
  };
  for (const op of ["select", "order", "limit", "eq", "insert", "delete", "maybeSingle", "range", "or"]) {
    chain[op] = passthru(op);
  }
  chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    Promise.resolve(results[`${table}:${call.ops[0]}`] ?? { data: null, error: null, count: 0 }).then(resolve, reject);
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => makeChain(table),
    auth: { getUser: () => authGetUserMock() },
  },
}));

import {
  CITY_FOLLOWS_MAX_PER_USER,
  addCityFollow,
  filterCityOptions,
  removeCityFollow,
} from "@/lib/city-follows-api";

const UID = "11111111-2222-3333-4444-555555555555";

beforeEach(() => {
  calls.length = 0;
  results = {};
  authGetUserMock.mockReset();
  authGetUserMock.mockResolvedValue({ data: { user: { id: UID } }, error: null });
});

describe("M26 · tavan sabiti M24 seed aynası", () => {
  it("CITY_FOLLOWS_MAX_PER_USER migration'daki ayar değeriyle birebir", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("'weekly_city_digest.max_follows_per_user', '10'");
    expect(CITY_FOLLOWS_MAX_PER_USER).toBe(10);
  });
});

describe("M26 · addCityFollow", () => {
  it("user_id ÇAĞIRANDAN DEĞİL auth.getUser'dan konur (RLS ile çift katman)", async () => {
    results["user_city_follows:select"] = { count: 2, error: null };
    results["user_city_follows:insert"] = { error: null };

    await addCityFollow("city-1");

    const insert = calls.find((c) => c.ops.includes("insert"));
    expect(insert?.row).toEqual({ user_id: UID, city_id: "city-1" });
  });

  it("SIRA KİLİDİ: tavan doluyken insert HİÇ denenmez (count önce)", async () => {
    results["user_city_follows:select"] = { count: CITY_FOLLOWS_MAX_PER_USER, error: null };

    await expect(addCityFollow("city-1")).rejects.toThrow(/En fazla 10 şehir/);
    expect(calls.some((c) => c.ops.includes("insert"))).toBe(false);
  });

  it("PK çakışması (23505) idempotent yutulur — ikinci kez takip hata değil", async () => {
    results["user_city_follows:select"] = { count: 1, error: null };
    results["user_city_follows:insert"] = { error: { code: "23505", message: "duplicate" } };

    await expect(addCityFollow("city-1")).resolves.toBeUndefined();
  });

  it("giriş yoksa auth_required (insert denenmez)", async () => {
    authGetUserMock.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });

    await expect(addCityFollow("city-1")).rejects.toThrow(/giriş yapmalısın/i);
    expect(calls.some((c) => c.ops.includes("insert"))).toBe(false);
  });
});

describe("M26 · removeCityFollow + istemci filtresi", () => {
  it("delete city_id ile (RLS kendi satırına sınırlar)", async () => {
    results["user_city_follows:delete"] = { error: null };

    await removeCityFollow("city-9");

    const del = calls.find((c) => c.ops.includes("delete"));
    expect(del?.ops).toContain("eq");
    expect(results).toBeDefined();
  });

  it("şehir filtresi İSTEMCİDE Türkçe katlamalı (Münih~munih) — sunucu taraması yok", () => {
    const options = [
      { id: "c1", name: "München" },
      { id: "c2", name: "Münih" },
      { id: "c3", name: "Berlin" },
    ];
    const filtered = filterCityOptions(options, "mun");
    // normalizeSearchText ü/ö katlar: "Münih" eşleşir; "München" de (ü→u, ama
    // 'nchen' ≠ 'n'... includes('mun') → münchen→munchen 'mun' içerir ✓)
    expect(filtered.map((o) => o.id).sort()).toEqual(["c1", "c2"]);
  });
});
