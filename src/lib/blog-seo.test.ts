import { describe, expect, it } from "vitest";

import {
  buildBlogBreadcrumbJsonLd,
  buildBlogPostingJsonLd,
  formatBlogDate,
  pickRelatedPosts,
  type BlogPostSummary,
} from "@/lib/blog-seo";

const ORIGIN = "https://corteqs.net";

const summary = (over: Partial<BlogPostSummary> & { slug: string }): BlogPostSummary => ({
  id: over.slug,
  title: `Yazı ${over.slug}`,
  excerpt: "",
  country: "",
  country_label: "",
  category: "genel",
  sort_order: 0,
  published_at: "2026-01-01T12:00:00Z",
  ...over,
});

describe("buildBlogBreadcrumbJsonLd", () => {
  it("Ana Sayfa → Rehberler → yazı sırasını ve mutlak adresleri üretir", () => {
    const ld = buildBlogBreadcrumbJsonLd({ slug: "almanya-giris", title: "Almanya'ya Giriş" });
    const items = ld.itemListElement as Array<Record<string, unknown>>;

    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items.map((i) => i.name)).toEqual(["Ana Sayfa", "Rehberler", "Almanya'ya Giriş"]);
    expect(items.map((i) => i.item)).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/radar/rehberler`,
      `${ORIGIN}/blog/almanya-giris`,
    ]);
  });

  it("Rehberler adımı /blog (301) DEĞİL doğrudan /radar/rehberler'e gider", () => {
    const items = buildBlogBreadcrumbJsonLd({ slug: "x", title: "x" }).itemListElement as Array<
      Record<string, unknown>
    >;

    expect(String(items[1].item)).not.toMatch(/\/blog\/?$/);
  });
});

describe("buildBlogPostingJsonLd", () => {
  const post = {
    slug: "a",
    title: "Başlık",
    excerpt: "Özet metni",
    country_label: "Almanya",
    category: "genel",
    cover_image: null,
    published_at: "2026-06-12T10:00:00Z",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-20T10:00:00Z",
  } as Parameters<typeof buildBlogPostingJsonLd>[0];

  it("temel alanları ve tarihleri taşır; yayın tarihi yoksa oluşturma tarihine düşer", () => {
    const ld = buildBlogPostingJsonLd(post, `${ORIGIN}/og.png`);

    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.headline).toBe("Başlık");
    expect(ld.datePublished).toBe("2026-06-12T10:00:00Z");
    expect(ld.dateModified).toBe("2026-06-20T10:00:00Z");
    expect(ld.url).toBe(`${ORIGIN}/blog/a`);
    expect(buildBlogPostingJsonLd({ ...post, published_at: null }, "x").datePublished).toBe(
      "2026-06-01T10:00:00Z",
    );
  });

  it("yazar KİŞİ uydurmaz: Organization", () => {
    const ld = buildBlogPostingJsonLd(post, "x");

    expect((ld.author as Record<string, unknown>)["@type"]).toBe("Organization");
  });

  it("ülke etiketi varsa about, yoksa hiç eklemez", () => {
    expect(buildBlogPostingJsonLd(post, "x").about).toEqual({ "@type": "Thing", name: "Almanya" });
    expect(buildBlogPostingJsonLd({ ...post, country_label: "" }, "x")).not.toHaveProperty("about");
  });
});

describe("pickRelatedPosts", () => {
  const current = { id: "cur", slug: "cur", country: "almanya", category: "genel" as const };

  it("mevcut yazıyı asla önermez (id ya da slug)", () => {
    const sonuc = pickRelatedPosts(
      [summary({ slug: "cur", id: "x", country: "almanya" }), summary({ slug: "b", id: "cur", country: "almanya" })],
      current,
    );

    expect(sonuc).toEqual([]);
  });

  it("aynı ülke, aynı kategoriden önce gelir", () => {
    const sonuc = pickRelatedPosts(
      [
        summary({ slug: "kategori", category: "genel", country: "hollanda" }),
        summary({ slug: "ulke", category: "oturum-izni", country: "almanya" }),
      ],
      current,
    );

    expect(sonuc.map((p) => p.slug)).toEqual(["ulke", "kategori"]);
  });

  it("ilgisiz yazı (ne ülke ne kategori) önerilmez — uydurma ilgi yok", () => {
    const sonuc = pickRelatedPosts([summary({ slug: "alakasiz", category: "oturum-izni", country: "hollanda" })], current);

    expect(sonuc).toEqual([]);
  });

  it("boş ülke boş ülkeyle EŞLEŞMEZ (ortak 'ülkesiz' bir ilgi değildir)", () => {
    const sonuc = pickRelatedPosts(
      [summary({ slug: "b", category: "oturum-izni", country: "" })],
      { ...current, country: "" },
    );

    expect(sonuc).toEqual([]);
  });

  it("limit uygular (varsayılan 3) ve sıralama kararlıdır: sort_order, sonra yayın tarihi", () => {
    const posts = [
      summary({ slug: "d", country: "almanya", sort_order: 5 }),
      summary({ slug: "a", country: "almanya", sort_order: 1, published_at: "2026-01-01T12:00:00Z" }),
      summary({ slug: "b", country: "almanya", sort_order: 1, published_at: "2026-03-01T12:00:00Z" }),
      summary({ slug: "c", country: "almanya", sort_order: 2 }),
    ];

    expect(pickRelatedPosts(posts, current).map((p) => p.slug)).toEqual(["b", "a", "c"]);
    expect(pickRelatedPosts(posts, current, 1)).toHaveLength(1);
    expect(pickRelatedPosts(posts, current, 0)).toEqual([]);
  });

  it("girdi dizisini DEĞİŞTİRMEZ (immutability)", () => {
    const posts = [summary({ slug: "z", country: "almanya", sort_order: 9 }), summary({ slug: "y", country: "almanya", sort_order: 1 })];
    const kopya = [...posts];

    pickRelatedPosts(posts, current);

    expect(posts).toEqual(kopya);
  });
});

describe("formatBlogDate", () => {
  it("tr-TR uzun tarih üretir", () => {
    expect(formatBlogDate("2026-06-12T12:00:00Z")).toBe("12 Haziran 2026");
  });

  it("boş/geçersiz değerde null döner (sayfa 'Invalid Date' basmaz)", () => {
    expect(formatBlogDate(null)).toBeNull();
    expect(formatBlogDate(undefined)).toBeNull();
    expect(formatBlogDate("")).toBeNull();
    expect(formatBlogDate("tarih-degil")).toBeNull();
  });
});
