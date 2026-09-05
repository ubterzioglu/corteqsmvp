import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RadarRehberlerSection from "@/components/radar/RadarRehberlerSection";
import { blogCategoryLabels, type BlogPostRow } from "@/lib/blog";

// Filtre MANTIĞI src/lib/radar-guides.test.ts'te test edilir (Radix Select jsdom'da
// pointer API'si ister). Burada yalnız bileşenin filtreyi ne zaman ÇİZDİĞİ doğrulanır.
const listPublishedBlogPostsMock = vi.fn();

vi.mock("@/lib/blog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/blog")>("@/lib/blog");
  return {
    ...actual,
    listPublishedBlogPosts: (...args: unknown[]) => listPublishedBlogPostsMock(...args),
  };
});

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
  post({ id: "1", slug: "de-1", title: "Almanya rehberi", country: "almanya", country_label: "Almanya" }),
  post({ id: "2", slug: "nl-1", title: "Hollanda rehberi", country: "hollanda", country_label: "Hollanda" }),
];

const renderSection = () =>
  render(
    <MemoryRouter>
      <RadarRehberlerSection />
    </MemoryRouter>,
  );

describe("RadarRehberlerSection", () => {
  beforeEach(() => {
    listPublishedBlogPostsMock.mockReset();
    listPublishedBlogPostsMock.mockResolvedValue(POSTS);
  });

  it("birden fazla ülke varsa ülke filtresini çizer", async () => {
    renderSection();

    expect(await screen.findByText("Almanya rehberi")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Ülke filtresi" })).toBeInTheDocument();
  });

  it("tek ülke varsa filtreyi hiç çizmez — seçenek sunmak kullanıcıyı yanıltır", async () => {
    listPublishedBlogPostsMock.mockResolvedValue([POSTS[0]]);
    renderSection();

    expect(await screen.findByText("Almanya rehberi")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Ülke filtresi" })).not.toBeInTheDocument();
  });

  it("kategori çipleri korunur", async () => {
    renderSection();

    await screen.findByText("Almanya rehberi");
    expect(screen.getByRole("button", { name: "Tümü" })).toBeInTheDocument();
    // Etiket metni tek kaynaktan gelir; testte sabit yazmak sözlük değişince
    // sessizce bayatlar.
    expect(screen.getByRole("button", { name: blogCategoryLabels["is-bulma"] })).toBeInTheDocument();
  });
});
