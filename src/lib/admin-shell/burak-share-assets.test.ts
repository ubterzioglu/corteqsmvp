import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
    storage: { from: vi.fn() },
  },
}));

import {
  burakSlotKey,
  listBurakShareAssets,
  upsertBurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
});

describe("burakSlotKey", () => {
  it("builds a deterministic slot key from tool id and variant index", () => {
    expect(burakSlotKey("burak-tool-11", 1)).toBe("burak/burak-tool-11/variant-1");
  });
});

describe("listBurakShareAssets", () => {
  it("maps rows into a slot_key keyed record with camelCase fields", async () => {
    const rows = [
      {
        slot_key: "burak/burak-tool-1/variant-0",
        image_bucket: "burak-share",
        image_path: "burak-tool-1/variant-0/x.png",
        image_url: null,
        video_url: "https://drive.google.com/file/d/abc/view",
        note: "hazır",
      },
    ];
    fromMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    });

    const state = await listBurakShareAssets();

    expect(fromMock).toHaveBeenCalledWith("social_share_assets");
    expect(state["burak/burak-tool-1/variant-0"]).toEqual({
      slotKey: "burak/burak-tool-1/variant-0",
      imageBucket: "burak-share",
      imagePath: "burak-tool-1/variant-0/x.png",
      imageUrl: null,
      videoUrl: "https://drive.google.com/file/d/abc/view",
      note: "hazır",
    });
  });

  it("throws a Turkish fallback message when the query fails", async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }),
    });
    await expect(listBurakShareAssets()).rejects.toThrow("Medya kayıtları yüklenemedi");
  });
});

describe("upsertBurakShareAsset", () => {
  it("upserts by slot_key with current user and snake_case patch", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await upsertBurakShareAsset("burak/burak-tool-2/variant-1", {
      videoUrl: "https://drive.google.com/file/d/zzz/view",
      note: "video eklendi",
    });

    expect(fromMock).toHaveBeenCalledWith("social_share_assets");
    const [values, options] = upsert.mock.calls[0];
    expect(values).toMatchObject({
      slot_key: "burak/burak-tool-2/variant-1",
      video_url: "https://drive.google.com/file/d/zzz/view",
      note: "video eklendi",
      updated_by: "admin-1",
    });
    expect(options).toEqual({ onConflict: "slot_key" });
  });

  it("only includes patched columns in the upsert values", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await upsertBurakShareAsset("burak/burak-tool-3/variant-0", { note: "sadece not" });

    const [values] = upsert.mock.calls[0];
    expect(values).toHaveProperty("note", "sadece not");
    expect(values).not.toHaveProperty("video_url");
    expect(values).not.toHaveProperty("image_url");
  });

  it("throws when the upsert errors", async () => {
    fromMock.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: new Error("nope") }) });
    await expect(
      upsertBurakShareAsset("burak/burak-tool-1/variant-0", { note: "x" }),
    ).rejects.toThrow("nope");
  });
});
