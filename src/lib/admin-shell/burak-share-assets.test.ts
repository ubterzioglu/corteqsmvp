import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock, storageFromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  storageFromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
    storage: { from: storageFromMock },
  },
}));

import {
  addBurakShareExtraImage,
  burakSlotKey,
  countBurakShareExtraImagesBySlot,
  listBurakShareAssets,
  listBurakShareExtraImages,
  removeBurakShareExtraImage,
  upsertBurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });
});

describe("burakSlotKey", () => {
  it("builds a deterministic slot key from globalId and variant index", () => {
    expect(burakSlotKey("item-98", 1)).toBe("item-98/variant-1");
  });

  it("uses globalId as the sole identity, regardless of source", () => {
    expect(burakSlotKey("item-5", 0)).toBe("item-5/variant-0");
    expect(burakSlotKey("item-1", 0)).toBe("item-1/variant-0");
    expect(burakSlotKey("item-8", 2)).toBe("item-8/variant-2");
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

describe("listBurakShareExtraImages", () => {
  it("returns ordered images for a slot, mapped to camelCase", async () => {
    const rows = [
      {
        id: "img-1",
        slot_key: "tools/tool-1/variant-0",
        image_bucket: "burak-share",
        image_path: "tools/tool-1/variant-0/a.png",
        sort_order: 0,
      },
    ];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ select });

    const images = await listBurakShareExtraImages("tools/tool-1/variant-0");

    expect(fromMock).toHaveBeenCalledWith("social_share_asset_images");
    expect(eq).toHaveBeenCalledWith("slot_key", "tools/tool-1/variant-0");
    expect(images).toEqual([
      {
        id: "img-1",
        slotKey: "tools/tool-1/variant-0",
        imageBucket: "burak-share",
        imagePath: "tools/tool-1/variant-0/a.png",
        sortOrder: 0,
      },
    ]);
  });

  it("throws a Turkish fallback message when the query fails", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } });
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order }) }) });

    await expect(listBurakShareExtraImages("tools/tool-1/variant-0")).rejects.toThrow(
      "Ek görseller yüklenemedi",
    );
  });
});

describe("addBurakShareExtraImage", () => {
  it("uploads the file, inserts the row and returns the new image", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ upload, remove });

    const insertedRow = {
      id: "img-2",
      slot_key: "tools/tool-1/variant-0",
      image_bucket: "burak-share",
      image_path: "tools/tool-1/variant-0/1-abc-b.png",
      sort_order: 1,
    };
    const single = vi.fn().mockResolvedValue({ data: insertedRow, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    const file = new File(["x"], "b.png", { type: "image/png" });
    const result = await addBurakShareExtraImage(
      "item-5",
      0,
      "tools/tool-1/variant-0",
      file,
      1,
    );

    expect(upload).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ slot_key: "tools/tool-1/variant-0", sort_order: 1 }),
    );
    expect(result).toEqual({
      id: "img-2",
      slotKey: "tools/tool-1/variant-0",
      imageBucket: "burak-share",
      imagePath: "tools/tool-1/variant-0/1-abc-b.png",
      sortOrder: 1,
    });
  });

  it("removes the uploaded file and throws when the insert fails", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ upload, remove });

    const single = vi.fn().mockResolvedValue({ data: null, error: new Error("insert failed") });
    fromMock.mockReturnValue({
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
    });

    const file = new File(["x"], "b.png", { type: "image/png" });
    await expect(
      addBurakShareExtraImage("item-5", 0, "tools/tool-1/variant-0", file, 0),
    ).rejects.toThrow("insert failed");
    expect(remove).toHaveBeenCalled();
  });
});

describe("removeBurakShareExtraImage", () => {
  it("deletes the row and removes the storage object", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ delete: del });
    const remove = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ remove });

    await removeBurakShareExtraImage({
      id: "img-1",
      slotKey: "tools/tool-1/variant-0",
      imageBucket: "burak-share",
      imagePath: "tools/tool-1/variant-0/a.png",
      sortOrder: 0,
    });

    expect(eq).toHaveBeenCalledWith("id", "img-1");
    expect(remove).toHaveBeenCalledWith(["tools/tool-1/variant-0/a.png"]);
  });
});

describe("countBurakShareExtraImagesBySlot", () => {
  it("counts rows per slot_key", async () => {
    const rows = [
      { slot_key: "tools/tool-1/variant-0" },
      { slot_key: "tools/tool-1/variant-0" },
      { slot_key: "diaspora/post-1/variant-0" },
    ];
    fromMock.mockReturnValue({ select: vi.fn().mockResolvedValue({ data: rows, error: null }) });

    const counts = await countBurakShareExtraImagesBySlot();

    expect(counts).toEqual({
      "tools/tool-1/variant-0": 2,
      "diaspora/post-1/variant-0": 1,
    });
  });
});
