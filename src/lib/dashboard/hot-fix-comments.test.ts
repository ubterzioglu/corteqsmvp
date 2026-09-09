// TOP 10 HOT FIX yorumlarının sözleşmesi.
//
// Kilitlenen davranışlar:
//   1. Boş / çok uzun gövde DB'ye gitmeden reddedilir (DB CHECK ile aynı sınır).
//   2. Supabase hataları DÜZ NESNEDİR — hata mesajı okunabilmeli.
//      (CLAUDE.md'de kayıtlı tuzak: `instanceof Error` daraltması Cadde hata
//      sözlüğünü bir süre tamamen ölü bırakmıştı.)
//   3. Yorumlar ESKİDEN YENİYE sıralanır: bu bir sohbet değil, soru-cevap dizisi.

import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("./supabase", () => ({
  getSupabaseBrowserClient: () => ({ from: fromMock }),
}));

import {
  HOT_FIX_COMMENT_BODY_MAX,
  createHotFixComment,
  listHotFixComments,
} from "./hot-fix-comments";

/** `select().eq().is().order()` zincirini taklit eder. */
const selectChain = (result: unknown) => {
  const order = vi.fn().mockResolvedValue(result);
  const is = vi.fn(() => ({ order }));
  const eq = vi.fn(() => ({ is }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, is, order };
};

/** `insert().select().single()` zincirini taklit eder. */
const insertChain = (result: unknown) => {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
};

describe("listHotFixComments", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("satırları arayüz biçimine çevirir", async () => {
    const chain = selectChain({
      data: [
        {
          id: "c1",
          hot_fix_id: "h1",
          author_name: "Burak",
          body: "Cevap: A şıkkı.",
          created_at: "2026-09-09T10:00:00Z",
          created_by: "u1",
        },
      ],
      error: null,
    });
    fromMock.mockReturnValue({ select: chain.select });

    const comments = await listHotFixComments("h1");

    expect(comments).toEqual([
      {
        id: "c1",
        hotFixId: "h1",
        authorName: "Burak",
        body: "Cevap: A şıkkı.",
        createdAt: "2026-09-09T10:00:00Z",
      },
    ]);
  });

  it("ESKİDEN YENİYE sıralar — soru önce, cevap sonra okunmalı", async () => {
    const chain = selectChain({ data: [], error: null });
    fromMock.mockReturnValue({ select: chain.select });

    await listHotFixComments("h1");

    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("silinmiş yorumları dışarıda bırakır", async () => {
    const chain = selectChain({ data: [], error: null });
    fromMock.mockReturnValue({ select: chain.select });

    await listHotFixComments("h1");

    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("hata durumunda boş dizi döner, patlamaz", async () => {
    const chain = selectChain({ data: null, error: { message: "kapali" } });
    fromMock.mockReturnValue({ select: chain.select });

    await expect(listHotFixComments("h1")).resolves.toEqual([]);
  });
});

describe("createHotFixComment", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("boş gövdeyi DB'ye GÖNDERMEDEN reddeder", async () => {
    const result = await createHotFixComment("h1", "Barış", "   ");

    expect(result.ok).toBe(false);
    expect(result.message).toContain("boş");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("sınırı aşan gövdeyi DB'ye GÖNDERMEDEN reddeder", async () => {
    const result = await createHotFixComment("h1", "Barış", "x".repeat(HOT_FIX_COMMENT_BODY_MAX + 1));

    expect(result.ok).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("uzun soru listesi sınırın ALTINDA kalır — tipik kullanım budur", async () => {
    // "10 soruyu tek seferde yapıştır" bu özelliğin asıl kullanım biçimi;
    // sınırı kısaltmak işi baştan bozar.
    const chain = insertChain({
      data: {
        id: "c9",
        hot_fix_id: "h1",
        author_name: "Barış",
        body: "soru",
        created_at: "2026-09-09T12:00:00Z",
        created_by: null,
      },
      error: null,
    });
    fromMock.mockReturnValue({ insert: chain.insert });

    const uzunSoruListesi = "1. Soru...\n".repeat(300); // ~3.600 karakter
    expect(uzunSoruListesi.length).toBeLessThan(HOT_FIX_COMMENT_BODY_MAX);

    const result = await createHotFixComment("h1", "Barış", uzunSoruListesi);

    expect(result.ok).toBe(true);
  });

  it("yazar adı boşsa 'Anonim' yazar", async () => {
    const chain = insertChain({
      data: {
        id: "c2",
        hot_fix_id: "h1",
        author_name: "Anonim",
        body: "not",
        created_at: "2026-09-09T12:00:00Z",
        created_by: null,
      },
      error: null,
    });
    fromMock.mockReturnValue({ insert: chain.insert });

    await createHotFixComment("h1", "   ", "not");

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ author_name: "Anonim", hot_fix_id: "h1" }),
    );
  });

  it("DÜZ NESNE supabase hatasının mesajını okur", async () => {
    // ⚠️ `instanceof Error` daraltması burada mesajı yutardı.
    const chain = insertChain({ data: null, error: { message: "row-level security engeli" } });
    fromMock.mockReturnValue({ insert: chain.insert });

    const result = await createHotFixComment("h1", "Barış", "deneme");

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Bu işlem için yetkiniz yok.");
  });

  it("tanınmayan hatada anlaşılır bir yedek mesaj verir", async () => {
    const chain = insertChain({ data: null, error: {} });
    fromMock.mockReturnValue({ insert: chain.insert });

    const result = await createHotFixComment("h1", "Barış", "deneme");

    expect(result.message).toBe("Yorum eklenemedi.");
  });
});
