import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: { method: string; args: unknown[] }[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "select", "eq", "order"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.limit = (...args: unknown[]) => {
    calls.push({ method: "limit", args });
    return Promise.resolve({ data: [{ slug: "a" }], error: null });
  };
  return { supabase: builder };
});

import { listLatestBlogPostCards } from "./blog";

describe("listLatestBlogPostCards", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("markdown gövdesini ÇEKMEZ ve satır sayısını sınırlar (ana sayfa yükü)", async () => {
    const rows = await listLatestBlogPostCards(3);

    expect(rows).toEqual([{ slug: "a" }]);
    const select = calls.find((c) => c.method === "select");
    expect(select?.args[0]).not.toContain("content_markdown");
    expect(select?.args[0]).not.toBe("*");
    expect(calls.find((c) => c.method === "limit")?.args[0]).toBe(3);
    expect(calls).toContainEqual({ method: "eq", args: ["published", true] });
  });

  it("BlogPosting JSON-LD'nin okuduğu kolonları içerir", async () => {
    await listLatestBlogPostCards(3);
    const columns = String(calls.find((c) => c.method === "select")?.args[0]);
    for (const column of ["slug", "title", "excerpt", "published_at", "created_at", "updated_at", "country_label", "category", "cover_image"]) {
      expect(columns).toContain(column);
    }
  });
});
