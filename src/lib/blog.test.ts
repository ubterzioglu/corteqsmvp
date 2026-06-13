import { describe, expect, it } from "vitest";

import {
  blogCategoryLabels,
  groupBlogPostsByCountry,
  slugifyBlogTitle,
  type BlogPostRow,
} from "./blog";

const makePost = (overrides: Partial<BlogPostRow>): BlogPostRow => ({
  id: overrides.id ?? "id",
  slug: overrides.slug ?? "slug",
  title: overrides.title ?? "Başlık",
  excerpt: overrides.excerpt ?? "",
  content_markdown: overrides.content_markdown ?? "icerik",
  country: overrides.country ?? "almanya",
  country_label: overrides.country_label ?? "Almanya",
  category: overrides.category ?? "genel",
  category_label: overrides.category_label ?? "Genel",
  cover_image: overrides.cover_image ?? null,
  published: overrides.published ?? true,
  published_at: overrides.published_at ?? null,
  sort_order: overrides.sort_order ?? 0,
  created_at: overrides.created_at ?? "2026-06-13T00:00:00Z",
  updated_at: overrides.updated_at ?? "2026-06-13T00:00:00Z",
});

describe("slugifyBlogTitle", () => {
  it("Türkçe karakterleri ascii slug'a çevirir", () => {
    expect(slugifyBlogTitle("Almanya için Giriş ve Ulaşım")).toBe("almanya-icin-giris-ve-ulasim");
  });

  it("İ ve ı harflerini doğru indirger", () => {
    expect(slugifyBlogTitle("İSVİÇRE Şehirleri")).toBe("isvicre-sehirleri");
  });

  it("baş/son tireleri ve tekrarları temizler", () => {
    expect(slugifyBlogTitle("  --Çok   Özel--  ")).toBe("cok-ozel");
  });
});

describe("groupBlogPostsByCountry", () => {
  it("yazıları ülkeye göre ilk görülme sırasını koruyarak gruplar", () => {
    const posts = [
      makePost({ id: "1", country: "almanya", country_label: "Almanya" }),
      makePost({ id: "2", country: "fransa", country_label: "Fransa" }),
      makePost({ id: "3", country: "almanya", country_label: "Almanya" }),
    ];
    const groups = groupBlogPostsByCountry(posts);
    expect(groups.map((g) => g.country)).toEqual(["almanya", "fransa"]);
    expect(groups[0].posts).toHaveLength(2);
    expect(groups[1].posts).toHaveLength(1);
  });

  it("boş liste için boş grup döndürür", () => {
    expect(groupBlogPostsByCountry([])).toEqual([]);
  });
});

describe("blogCategoryLabels", () => {
  it("üç ana kategori için Türkçe etiket içerir", () => {
    expect(blogCategoryLabels["giris-ulasim"]).toBe("Giriş ve Ulaşım");
    expect(blogCategoryLabels["gundelik-butce"]).toBe("Gündelik Hayat ve Bütçe");
    expect(blogCategoryLabels["kultur-sosyal"]).toBe("Kültür ve Sosyal Akış");
  });
});
