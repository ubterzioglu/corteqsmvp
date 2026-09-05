import { describe, expect, it } from "vitest";

import type { BlogPostRow } from "@/lib/blog";
import { collectGuideCountries, filterGuidePosts } from "@/lib/radar-guides";

function post(overrides: Partial<BlogPostRow> = {}): BlogPostRow {
  return {
    id: "p-1",
    slug: "yazi",
    title: "Başlık",
    excerpt: "Özet",
    category: "yasam-sartlari",
    country: "almanya",
    country_label: "Almanya",
    ...overrides,
  } as BlogPostRow;
}

const POSTS = [
  post({ id: "1", title: "Almanya rehberi", country: "almanya", country_label: "Almanya" }),
  post({ id: "2", title: "Hollanda rehberi", country: "hollanda", country_label: "Hollanda" }),
  post({
    id: "3",
    title: "İsviçre rehberi",
    country: "isvicre",
    country_label: "İsviçre",
    category: "is-bulma",
  }),
];

describe("collectGuideCountries", () => {
  it("ülkeleri tekilleştirir ve Türkçe sıralar", () => {
    expect(collectGuideCountries(POSTS).map((option) => option.label)).toEqual([
      "Almanya",
      "Hollanda",
      "İsviçre",
    ]);
  });

  it("ülkesi olmayan yazıyı 'Diğer' altında toplar", () => {
    expect(collectGuideCountries([post({ id: "x", country: "", country_label: "" })])).toEqual([
      { value: "diger", label: "Diğer" },
    ]);
  });

  it("yayında yazı yoksa boş liste döner", () => {
    expect(collectGuideCountries([])).toEqual([]);
  });

  it("aynı ülkenin ilk etiketini korur, tekrar üretmez", () => {
    const posts = [
      post({ id: "a", country: "almanya", country_label: "Almanya" }),
      post({ id: "b", country: "almanya", country_label: "Almanya" }),
    ];
    expect(collectGuideCountries(posts)).toHaveLength(1);
  });
});

describe("filterGuidePosts", () => {
  it("varsayılanda hepsini döner", () => {
    expect(filterGuidePosts(POSTS)).toHaveLength(3);
  });

  it("ülkeye göre süzer", () => {
    expect(filterGuidePosts(POSTS, { country: "hollanda" }).map((entry) => entry.title)).toEqual([
      "Hollanda rehberi",
    ]);
  });

  it("kategoriye göre süzer", () => {
    expect(filterGuidePosts(POSTS, { category: "is-bulma" }).map((entry) => entry.title)).toEqual([
      "İsviçre rehberi",
    ]);
  });

  it("kategori ve ülke birlikte uygulanır", () => {
    expect(filterGuidePosts(POSTS, { category: "is-bulma", country: "isvicre" })).toHaveLength(1);
    // İsviçre yazısı "is-bulma" kategorisinde; "yasam-sartlari" ile kesişimi boş.
    expect(filterGuidePosts(POSTS, { category: "yasam-sartlari", country: "isvicre" })).toHaveLength(0);
  });

  it("ülkesi boş yazıyı 'diger' anahtarıyla eşler", () => {
    expect(filterGuidePosts([post({ id: "x", country: "", country_label: "" })], { country: "diger" })).toHaveLength(1);
  });
});
