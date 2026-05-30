import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildNewsPostSummary, importNewsPostToMarquee, listImportableNewsPosts, type NewsPostRow } from "@/lib/marquee";

type QueryResult<T> = Promise<{ data: T; error: null }>;

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from,
  },
}));

const makeNewsPost = (overrides: Partial<NewsPostRow> = {}): NewsPostRow => ({
  id: 42,
  title: "Berlin'de Türk girişimciler buluştu",
  summary: null,
  source_name: "Anadolu Ajansı",
  source_url: "https://example.com/source",
  original_url: "https://example.com/original",
  image_url: "https://example.com/image.jpg",
  category: "Girişimcilik",
  city: "Berlin",
  country: "Almanya",
  language: "tr",
  published_at: "2026-05-02T10:00:00Z",
  unique_hash: "abc",
  status: "active",
  created_at: "2026-05-01T10:00:00Z",
  ...overrides,
});

describe("marquee helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists only active importable news posts", async () => {
    const rows = [makeNewsPost()];
    const finalOrder = vi.fn<() => QueryResult<NewsPostRow[]>>().mockResolvedValue({ data: rows, error: null });
    const firstOrder = vi.fn(() => ({ order: finalOrder }));
    const eq = vi.fn(() => ({ order: firstOrder }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValueOnce({ select });

    const result = await listImportableNewsPosts();

    expect(result).toEqual(rows);
    expect(from).toHaveBeenCalledWith("news_posts");
    expect(eq).toHaveBeenCalledWith("status", "active");
    expect(firstOrder).toHaveBeenCalledWith("published_at", { ascending: false, nullsFirst: false });
    expect(finalOrder).toHaveBeenCalledWith("created_at", { ascending: false, nullsFirst: false });
  });

  it("builds a fallback summary from source and location", () => {
    expect(buildNewsPostSummary(makeNewsPost())).toBe("Anadolu Ajansı • Girişimcilik • Berlin, Almanya");
    expect(buildNewsPostSummary(makeNewsPost({ summary: "Kısa özet" }))).toBe("Kısa özet");
  });

  it("imports a news post into marquee with the expected mapping", async () => {
    const post = makeNewsPost();
    const insertedRow = {
      id: "marquee-1",
      type: "news",
      slug: null,
      title: post.title,
      summary: "Anadolu Ajansı • Girişimcilik • Berlin, Almanya",
      detail_content: null,
      image_url: post.image_url,
      image_alt: post.title,
      metric_value: null,
      news_post_id: post.id,
      link_enabled: false,
      sort_order: 0,
      is_active: true,
      published_at: post.published_at!,
      created_at: "2026-05-02T10:00:00Z",
      updated_at: "2026-05-02T10:00:00Z",
    };

    const existingMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const existingEq = vi.fn(() => ({ maybeSingle: existingMaybeSingle }));
    const existingSelect = vi.fn(() => ({ eq: existingEq }));

    const postMaybeSingle = vi.fn().mockResolvedValue({ data: post, error: null });
    const postStatusEq = vi.fn(() => ({ maybeSingle: postMaybeSingle }));
    const postIdEq = vi.fn(() => ({ eq: postStatusEq }));
    const postSelect = vi.fn(() => ({ eq: postIdEq }));

    const insertSingle = vi.fn().mockResolvedValue({ data: insertedRow, error: null });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));

    from
      .mockReturnValueOnce({ select: existingSelect })
      .mockReturnValueOnce({ select: postSelect })
      .mockReturnValueOnce({ insert });

    const result = await importNewsPostToMarquee(post.id);

    expect(result).toEqual(insertedRow);
    expect(insert).toHaveBeenCalledWith({
      type: "news",
      title: post.title,
      summary: "Anadolu Ajansı • Girişimcilik • Berlin, Almanya",
      detail_content: null,
      image_url: post.image_url,
      image_alt: post.title,
      metric_value: null,
      news_post_id: post.id,
      link_enabled: false,
      slug: null,
      sort_order: 0,
      is_active: true,
      published_at: post.published_at,
    });
  });

  it("returns the existing marquee item when the news post was already imported", async () => {
    const existing = {
      id: "existing-1",
      type: "news",
      slug: null,
      title: "Mevcut kayıt",
      summary: "Mevcut özet",
      detail_content: null,
      image_url: null,
      image_alt: null,
      metric_value: null,
      news_post_id: 42,
      link_enabled: false,
      sort_order: 0,
      is_active: true,
      published_at: "2026-05-02T10:00:00Z",
      created_at: "2026-05-02T10:00:00Z",
      updated_at: "2026-05-02T10:00:00Z",
    };

    const maybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValueOnce({ select });

    const result = await importNewsPostToMarquee(42);

    expect(result).toEqual(existing);
    expect(from).toHaveBeenCalledTimes(1);
  });
});
