import { describe, expect, it, vi } from "vitest";

import {
  countPendingCatalogDocuments,
  fetchPendingCatalogDocuments,
  runCatalogEmbeddingQueue,
  setCatalogEmbedding,
} from "./catalog-vectors.mjs";

describe("catalog embedding queue", () => {
  it("reads only missing embeddings in stable item order", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{ item_id: "item-1", search_text: "Berlin dis hekimi" }],
      error: null,
    });
    const order = vi.fn(() => ({ limit }));
    const is = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ is }));
    const from = vi.fn(() => ({ select }));

    const rows = await fetchPendingCatalogDocuments({ from }, { limit: 25 });

    expect(from).toHaveBeenCalledWith("catalog_search_documents");
    expect(select).toHaveBeenCalledWith("item_id, search_text");
    expect(is).toHaveBeenCalledWith("embedding", null);
    expect(order).toHaveBeenCalledWith("item_id", { ascending: true });
    expect(limit).toHaveBeenCalledWith(25);
    expect(rows).toEqual([{ item_id: "item-1", search_text: "Berlin dis hekimi" }]);
  });

  it("counts remaining rows without downloading vectors", async () => {
    const is = vi.fn().mockResolvedValue({ count: 7, error: null });
    const select = vi.fn(() => ({ is }));
    const from = vi.fn(() => ({ select }));

    await expect(countPendingCatalogDocuments({ from })).resolves.toBe(7);
    expect(select).toHaveBeenCalledWith("item_id", { count: "exact", head: true });
    expect(is).toHaveBeenCalledWith("embedding", null);
  });

  it("writes a serialized vector through the existing service-role RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const embedding = [0.1, 0.2, 0.3];

    await setCatalogEmbedding({ rpc }, "item-1", embedding);

    expect(rpc).toHaveBeenCalledWith("set_catalog_search_embedding", {
      target_item_id: "item-1",
      next_embedding: JSON.stringify(embedding),
    });
  });

  it("embeds and persists batches until the queue is empty", async () => {
    const fetchPending = vi
      .fn()
      .mockResolvedValueOnce([
        { item_id: "item-1", search_text: "Berlin dis hekimi" },
        { item_id: "item-2", search_text: "Viyana avukat" },
      ])
      .mockResolvedValueOnce([]);
    const embed = vi.fn(async (text) => [text.length]);
    const persist = vi.fn().mockResolvedValue(undefined);

    const result = await runCatalogEmbeddingQueue({
      client: {},
      apiKey: "test-key",
      batchSize: 2,
      fetchPending,
      embed,
      persist,
    });

    expect(embed).toHaveBeenNthCalledWith(1, "Berlin dis hekimi", "test-key");
    expect(embed).toHaveBeenNthCalledWith(2, "Viyana avukat", "test-key");
    expect(persist).toHaveBeenNthCalledWith(1, {}, "item-1", [17]);
    expect(persist).toHaveBeenNthCalledWith(2, {}, "item-2", [13]);
    expect(result).toEqual({ processed: 2, succeeded: 2 });
  });

  it("stops at the requested limit without over-reading", async () => {
    const fetchPending = vi
      .fn()
      .mockResolvedValueOnce([
        { item_id: "item-1", search_text: "bir" },
        { item_id: "item-2", search_text: "iki" },
      ])
      .mockResolvedValueOnce([{ item_id: "item-3", search_text: "uc" }]);

    const result = await runCatalogEmbeddingQueue({
      client: {},
      apiKey: "test-key",
      limit: 3,
      batchSize: 2,
      fetchPending,
      embed: vi.fn().mockResolvedValue([0.5]),
      persist: vi.fn().mockResolvedValue(undefined),
    });

    expect(fetchPending).toHaveBeenNthCalledWith(1, {}, { limit: 2 });
    expect(fetchPending).toHaveBeenNthCalledWith(2, {}, { limit: 1 });
    expect(fetchPending).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ processed: 3, succeeded: 3 });
  });

  it("fails fast so a provider error cannot create an endless queue loop", async () => {
    const persist = vi.fn();

    await expect(
      runCatalogEmbeddingQueue({
        client: {},
        apiKey: "test-key",
        fetchPending: vi
          .fn()
          .mockResolvedValue([{ item_id: "item-1", search_text: "Berlin" }]),
        embed: vi.fn().mockRejectedValue(new Error("Gemini 429")),
        persist,
      }),
    ).rejects.toThrow("catalog embedding basarisiz (item-1): Gemini 429");
    expect(persist).not.toHaveBeenCalled();
  });
});
