import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
  },
}));

import { fetchShareState, saveItemNote, shareKey, toggleShare } from "@/lib/admin-shell/social-share-log";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
});

describe("fetchShareState", () => {
  it("maps log + note rows into globalId keyed records", async () => {
    const logRows = [
      {
        global_id: "item-5",
        platform: "linkedin",
        shared: true,
        marked_at: "2026-06-26T10:00:00.000Z",
        marked_by: "admin-1",
      },
      {
        global_id: "item-17",
        platform: "reddit",
        shared: false,
        marked_at: "2026-06-26T11:00:00.000Z",
        marked_by: null,
      },
    ];
    const noteRows = [
      {
        global_id: "item-5",
        note: "https://linkedin.com/post/123",
        marked_at: "2026-06-26T10:05:00.000Z",
        marked_by: "admin-1",
      },
    ];

    fromMock.mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue({
        data: table === "social_share_log" ? logRows : noteRows,
        error: null,
      }),
    }));

    const state = await fetchShareState();

    expect(state.badges[shareKey("item-5")].linkedin).toEqual({
      shared: true,
      markedAt: "2026-06-26T10:00:00.000Z",
      markedBy: "admin-1",
    });
    expect(state.badges[shareKey("item-17")].reddit?.shared).toBe(false);
    expect(state.notes[shareKey("item-5")].note).toBe("https://linkedin.com/post/123");
  });

  it("surfaces the underlying error message when the log query fails", async () => {
    fromMock.mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: table === "social_share_log" ? new Error("boom") : null,
      }),
    }));

    await expect(fetchShareState()).rejects.toThrow("boom");
  });

  it("falls back to a Turkish message for non-Error failures", async () => {
    fromMock.mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: table === "social_share_log" ? { code: "42501" } : null,
      }),
    }));

    await expect(fetchShareState()).rejects.toThrow("Paylaşım durumları yüklenemedi");
  });
});

describe("toggleShare", () => {
  it("upserts the log row with the correct conflict target and current user", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await toggleShare({ globalId: "item-24", platform: "instagram", shared: true });

    expect(fromMock).toHaveBeenCalledWith("social_share_log");
    const [values, options] = upsert.mock.calls[0];
    expect(values).toMatchObject({
      global_id: "item-24",
      platform: "instagram",
      shared: true,
      marked_by: "admin-1",
    });
    expect(options).toEqual({ onConflict: "global_id,platform" });
  });

  it("throws when the upsert errors", async () => {
    fromMock.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: new Error("nope") }) });
    await expect(
      toggleShare({ globalId: "item-8", platform: "x", shared: false }),
    ).rejects.toThrow("nope");
  });
});

describe("saveItemNote", () => {
  it("upserts the note row keyed by globalId only", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await saveItemNote({ globalId: "item-7", note: "paylaşıldı" });

    expect(fromMock).toHaveBeenCalledWith("social_share_item_note");
    const [values, options] = upsert.mock.calls[0];
    expect(values).toMatchObject({
      global_id: "item-7",
      note: "paylaşıldı",
      marked_by: "admin-1",
    });
    expect(options).toEqual({ onConflict: "global_id" });
  });
});
