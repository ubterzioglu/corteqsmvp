/**
 * M05 ayna sözleşmesi — `events-rules.ts` ↔ M02/M03/M04 migration'ları.
 *
 * Desen: `cadde-error-map.test.ts` + `cadde-rules` aynası. Kapattığı sessiz
 * başarısızlıklar:
 *   1. **Harita eksik/hayalet kod.** Yeni raise kodu haritada yoksa kullanıcı
 *      genel mesaja düşer (teşhis ölür); haritada migration'da olmayan kod
 *      varsa ölü ağırlık taşınır (çift yön kilitli).
 *   2. **Limit aynasının kayması.** `EVENTS_ACTIVE_LIMIT` UI metinlerine gömülü;
 *      canlı `event_settings` seed'i 2'den değişirse istemci metni yalan söyler.
 *   3. **createEvent'in doğrudan insert'e geri dönmesi** (M05 kabulü: "insert
 *      çağrısı kalktı") — T1'in istemci yakası.
 *   4. **userId'nin istemciden gitmeye devam etmesi** — RPC auth.uid() kullanır;
 *      CreateEventInput'ta userId alanı kalmamalı.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EVENT_RPC_ERROR_MESSAGES,
  EVENTS_ACTIVE_LIMIT,
  resolveEventRpcErrorMessage,
} from "@/lib/events-rules";

const MIGRATIONS = [
  "20261003010000_events_first_approval.sql",
  "20261003020000_events_rls_status_guard.sql",
  "20261003030000_event_attendees.sql",
];

const readMigration = (name: string) => {
  for (const dir of ["supabase/migrations/applied/", "supabase/migrations/"]) {
    const path = dir + name;
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  throw new Error(`${name} bulunamadı`);
};

const allSql = () => MIGRATIONS.map(readMigration).join("\n");

const raisedCodes = () =>
  new Set([...allSql().matchAll(/raise exception '(event_[a-z0-9_]+)'/g)].map((m) => m[1]));

describe("M05 · hata haritası üç migration'a karşı çift yönlü", () => {
  it("migration'lardaki HER event_* kodu haritada", () => {
    const codes = raisedCodes();
    expect(codes.size).toBeGreaterThanOrEqual(7);

    const missing = [...codes].filter((code) => !(code in EVENT_RPC_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada migration'larda OLMAYAN hayalet kod yok", () => {
    const sql = allSql();
    const phantom = Object.keys(EVENT_RPC_ERROR_MESSAGES).filter((code) => !sql.includes(`'${code}'`));
    expect(phantom).toEqual([]);
  });

  it("çözümleyici DÜZ NESNE hatadan Türkçe üretir (m75: instanceof Error YASAK)", () => {
    // supabase-js PostgREST hatası: Error DEĞİL, {message, details, hint}
    const plain = { message: "event_attendee_limit", details: null, hint: null };
    expect(resolveEventRpcErrorMessage(plain)).toBe(EVENT_RPC_ERROR_MESSAGES.event_attendee_limit);
    expect(resolveEventRpcErrorMessage({ message: "bilinmeyen_kod" })).toContain("tekrar dene");
  });
});

describe("M05 · limit aynası", () => {
  it("EVENTS_ACTIVE_LIMIT migration seed'iyle birebir", () => {
    const seed = allSql().match(/\('events\.active_limit',\s*'(\d+)'::jsonb\)/);
    expect(seed).not.toBeNull();
    expect(EVENTS_ACTIVE_LIMIT).toBe(Number(seed?.[1]));
  });

  it("limit mesajı sabiti kullanıyor (elle yazılmış ikinci sayı yok)", () => {
    expect(EVENT_RPC_ERROR_MESSAGES.event_active_limit).toContain(`${EVENTS_ACTIVE_LIMIT}`);
  });
});

describe("M05 · createEvent RPC'ye geçti (doğrudan insert YOK)", () => {
  const apiSource = readFileSync("src/lib/events-api.ts", "utf8");
  const createFn = apiSource.slice(
    apiSource.indexOf("export async function createEvent("),
    apiSource.indexOf("// ── M04 katılım RPC'leri"),
  );

  it("create_event_v1 çağrılır; .from(\"events\").insert createEvent'te YOK", () => {
    expect(createFn).toContain('supabase.rpc("create_event_v1" as never');
    expect(createFn).not.toContain('.from("events").insert');
    expect(createFn).not.toContain("status: \"pending\"");
  });

  it("userId istemciden GİTMEZ — CreateEventInput'ta alan yok, payload'da p_user yok", () => {
    const input = apiSource.slice(
      apiSource.indexOf("export interface CreateEventInput"),
      apiSource.indexOf("export type CreateEventResult"),
    );
    expect(input).not.toContain("userId");
    expect(createFn).not.toContain("p_user_id");
    expect(createFn).not.toContain("input.userId");
  });

  it("join/leave/count RPC sarmalayıcıları mevcut ve Türkçe hata üretiyor", () => {
    expect(apiSource).toContain('supabase.rpc("join_event_v1" as never');
    expect(apiSource).toContain('supabase.rpc("leave_event_v1" as never');
    expect(apiSource).toContain('supabase.rpc("event_attendee_count" as never');
    expect(apiSource).toContain("resolveEventRpcErrorMessage");
  });

  it("sayaç İKİNCİL yüzey: hata fırlatmaz, null döner", () => {
    const countFn = apiSource.slice(
      apiSource.indexOf("export async function fetchEventAttendeeCount"),
      apiSource.indexOf("export async function updateEvent"),
    );
    expect(countFn).toContain("if (error || !data) return null;");
    expect(countFn).not.toContain("throw");
  });
});
