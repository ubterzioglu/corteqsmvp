import { describe, expect, it } from "vitest";

import {
  buildDedupeKey,
  buildOutboxRows,
  isValidEntry,
  toOutboxRow,
} from "./admin-update-outbox.mjs";

const ENTRY = {
  id: "20260729-bildirim-ayarlari",
  date: "29 Temmuz 2026",
  title: "Bildirim ayarları eklendi",
  items: ["Yeni üye maili", "Güncelleme maili"],
};

describe("buildDedupeKey", () => {
  it("migration ile aynı formatı üretir", () => {
    expect(buildDedupeKey("20260729-x")).toBe("admin_update:20260729-x");
  });
});

describe("toOutboxRow", () => {
  it("kaydı gönderilebilir outbox satırına çevirir", () => {
    expect(toOutboxRow(ENTRY)).toEqual({
      event_type: "admin_update",
      dedupe_key: "admin_update:20260729-bildirim-ayarlari",
      payload: {
        id: ENTRY.id,
        date: ENTRY.date,
        title: ENTRY.title,
        items: ENTRY.items,
      },
      status: "pending",
      last_error: null,
    });
  });

  it("--seed-only modunda kaydı 'skipped' yazar (mail gitmez)", () => {
    const row = toOutboxRow(ENTRY, true);

    expect(row.status).toBe("skipped");
    expect(row.last_error).toBe("seed_backfill");
  });

  it("items eksikse boş diziye düşer", () => {
    const row = toOutboxRow({ id: "a", date: "b", title: "c" });

    expect(row.payload.items).toEqual([]);
  });
});

describe("isValidEntry", () => {
  it("id ve title dolu olan kayıtları kabul eder", () => {
    expect(isValidEntry(ENTRY)).toBe(true);
  });

  it("id ya da title eksik/boş olanları eler", () => {
    expect(isValidEntry(null)).toBe(false);
    expect(isValidEntry({ id: "a" })).toBe(false);
    expect(isValidEntry({ id: "", title: "x" })).toBe(false);
    expect(isValidEntry({ id: "a", title: "" })).toBe(false);
    expect(isValidEntry({ id: "a", title: "   " })).toBe(false);
    expect(isValidEntry({ id: "   ", title: "x" })).toBe(false);
  });
});

describe("buildOutboxRows", () => {
  // Eski notify-admin-updates.mjs yalnız EN ÜSTTEKİ kaydı gönderiyordu; bu testin
  // asıl amacı o regresyonu yakalamak — aynı güne düşen tüm kayıtlar kuyruğa girmeli.
  it("listedeki TÜM geçerli kayıtları satıra çevirir", () => {
    const rows = buildOutboxRows([
      ENTRY,
      { ...ENTRY, id: "20260729-ikinci", title: "Aynı güne ikinci kayıt" },
      { ...ENTRY, id: "20260729-ucuncu", title: "Aynı güne üçüncü kayıt" },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.dedupe_key)).toEqual([
      "admin_update:20260729-bildirim-ayarlari",
      "admin_update:20260729-ikinci",
      "admin_update:20260729-ucuncu",
    ]);
  });

  it("bozuk kayıtları atlar ve dizi olmayan girdide boş döner", () => {
    expect(buildOutboxRows([ENTRY, { date: "x" }, null])).toHaveLength(1);
    expect(buildOutboxRows(undefined)).toEqual([]);
  });

  it("seedOnly bayrağını tüm satırlara yayar", () => {
    const rows = buildOutboxRows([ENTRY, { ...ENTRY, id: "ikinci" }], true);

    expect(rows.every((row) => row.status === "skipped")).toBe(true);
  });
});
