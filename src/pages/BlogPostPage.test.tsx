// SG07 · Olmayan blog yazısı soft-404 olmamalı.
//
// 05.10 canlı ölçümü: /blog/<olmayan> (Googlebot) → 200 + "index, follow" + ana sayfa
// başlığı. SPA gerçek 404 döndüremediği için tek savunma sayfanın kendi robots meta'sıdır.

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedBlogPostBySlug = vi.fn();
const listPublishedBlogPostSummaries = vi.fn();

vi.mock("@/lib/blog", () => ({
  blogCategoryLabels: { genel: "Genel" },
  getPublishedBlogPostBySlug: (slug: string) => getPublishedBlogPostBySlug(slug),
  listPublishedBlogPostSummaries: () => listPublishedBlogPostSummaries(),
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
  // Varsayılan: ilgili yazı yok. Mevcut SEO testleri bu çağrıyı umursamaz.
  listPublishedBlogPostSummaries.mockReset();
  listPublishedBlogPostSummaries.mockResolvedValue([]);
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

// SE2 · "Tüm yazılar" ve "Rehberler'e dön" bağlantıları /radar/rehberler'e yönlendirilmeli
// (301 redirect yerine doğrudan doğru URL'ye link verilir — SEO için daha iyi)
describe("BlogPostPage navigation (SE2)", () => {
  it("bulunamayan yazıda 'Rehberler'e dön' bağlantısı /radar/rehberler'e yönlendirir", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(null);
    renderAt("/blog/olmayan-yazi");

    const link = await screen.findByRole("link", { name: /rehberler'e dön/i });
    expect(link).toHaveAttribute("href", "/radar/rehberler");
  });

  it("bulunan yazıda 'Tüm yazılar' bağlantısı /radar/rehberler'e yönlendirir", async () => {
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

    const link = await screen.findByRole("link", { name: /tüm yazılar/i });
    expect(link).toHaveAttribute("href", "/radar/rehberler");
  });
});

// S7 · GEO: kırıntı şeması, görünür tarih, ilgili yazı bağlantıları.
describe("BlogPostPage GEO zenginleştirmesi (S7)", () => {
  const post = {
    id: "p1",
    slug: "almanya-giris",
    title: "Almanya'ya Giriş Rehberi",
    excerpt: "Özet metni",
    content_markdown: "",
    country: "almanya",
    country_label: "Almanya",
    cover_image: null,
    published_at: "2026-06-12T12:00:00Z",
    created_at: "2026-06-01T12:00:00Z",
    updated_at: "2026-06-20T12:00:00Z",
    category: "genel",
  };

  const summary = (slug: string, over: Record<string, unknown> = {}) => ({
    id: slug,
    slug,
    title: `Yazı ${slug}`,
    excerpt: `Özet ${slug}`,
    country: "almanya",
    country_label: "Almanya",
    category: "genel",
    sort_order: 0,
    published_at: "2026-01-01T12:00:00Z",
    ...over,
  });

  const jsonLdTypes = (): string[] =>
    [...document.head.querySelectorAll('script[type="application/ld+json"]')].map(
      (script) => JSON.parse(script.textContent ?? "{}")["@type"] as string,
    );

  it("BlogPosting ile BİRLİKTE BreadcrumbList şemasını yazar", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(post);
    renderAt("/blog/almanya-giris");

    await waitFor(() => expect(jsonLdTypes()).toContain("BreadcrumbList"));
    expect(jsonLdTypes()).toContain("BlogPosting");
  });

  it("yayın ve güncelleme tarihini GÖRÜNÜR yazar", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(post);
    renderAt("/blog/almanya-giris");

    expect(await screen.findByText("12 Haziran 2026")).toBeInTheDocument();
    expect(screen.getByText("20 Haziran 2026")).toBeInTheDocument();
    expect(screen.getByText(/Güncelleme:/)).toBeInTheDocument();
  });

  it("güncelleme tarihi yayın tarihiyle aynıysa 'Güncelleme' satırını tekrarlamaz", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue({ ...post, updated_at: post.published_at });
    renderAt("/blog/almanya-giris");

    await screen.findByText("12 Haziran 2026");
    expect(screen.queryByText(/Güncelleme:/)).not.toBeInTheDocument();
  });

  it("aynı ülkeden ilgili yazıları /blog/<slug> bağlantısıyla listeler, mevcut yazıyı hariç tutar", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(post);
    listPublishedBlogPostSummaries.mockResolvedValue([
      summary("almanya-giris"), // kendisi: önerilmemeli
      summary("almanya-vize"),
      summary("hollanda-genel", { country: "hollanda", country_label: "Hollanda" }), // aynı kategori
    ]);
    renderAt("/blog/almanya-giris");

    const nav = await screen.findByRole("navigation", { name: "İlgili yazılar" });
    const hrefs = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("href"));

    expect(hrefs).toEqual(["/blog/almanya-vize", "/blog/hollanda-genel"]);
  });

  it("ilgili yazı yoksa bölümü HİÇ çizmez", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(post);
    listPublishedBlogPostSummaries.mockResolvedValue([]);
    renderAt("/blog/almanya-giris");

    await screen.findByText("12 Haziran 2026");
    expect(screen.queryByRole("navigation", { name: "İlgili yazılar" })).not.toBeInTheDocument();
  });

  it("ilgili yazılar yüklenemezse yazının KENDİSİ yine görünür (ikincil bölüm)", async () => {
    getPublishedBlogPostBySlug.mockResolvedValue(post);
    listPublishedBlogPostSummaries.mockRejectedValue(new Error("ağ hatası"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderAt("/blog/almanya-giris");

    expect(await screen.findByRole("heading", { level: 1, name: "Almanya'ya Giriş Rehberi" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "İlgili yazılar" })).not.toBeInTheDocument();
  });
});
