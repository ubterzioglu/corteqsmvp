// SG07 · Olmayan blog yazısı soft-404 olmamalı.
//
// 05.10 canlı ölçümü: /blog/<olmayan> (Googlebot) → 200 + "index, follow" + ana sayfa
// başlığı. SPA gerçek 404 döndüremediği için tek savunma sayfanın kendi robots meta'sıdır.

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedBlogPostBySlug = vi.fn();

vi.mock("@/lib/blog", () => ({
  blogCategoryLabels: {},
  getPublishedBlogPostBySlug: (slug: string) => getPublishedBlogPostBySlug(slug),
}));

vi.mock("@/components/blog/BlogMarkdown", () => ({ default: () => null }));

import BlogPostPage from "@/pages/BlogPostPage";

function robotsContent(): string | null {
  return document.head.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  document.head.innerHTML = "";
  getPublishedBlogPostBySlug.mockReset();
});

describe("BlogPostPage SEO", () => {
  it("bulunamayan yazıda robots meta'sını noindex yazar", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(null);
    renderAt("/blog/olmayan-yazi");

    expect(await screen.findByText("Yazı bulunamadı")).toBeInTheDocument();
    await waitFor(() => expect(robotsContent()).toBe("noindex, follow"));
    expect(document.title).toContain("Yazı bulunamadı");
  });

  it("yükleme hatasında da noindex yazar (hata = bulunamadı dalı)", async () => {
    getPublishedBlogPostBySlug.mockRejectedValue(new Error("ağ hatası"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderAt("/blog/hata");

    await waitFor(() => expect(robotsContent()).toBe("noindex, follow"));
  });

  it("bulunan yazıda noindex YAZMAZ", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue({
      slug: "var",
      title: "Var olan yazı",
      excerpt: "Özet",
      content: "",
      cover_image: null,
      published_at: "2026-10-01T00:00:00Z",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
      category: "genel",
      country_label: null,
    });
    renderAt("/blog/var");

    await waitFor(() => expect(document.title).toContain("Var olan yazı"));
    expect(robotsContent()).not.toBe("noindex, follow");
  });
});
