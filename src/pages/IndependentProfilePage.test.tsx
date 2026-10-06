// Kuruluş (/kurulus/:slug) soft-404 SEO davranışı.
//
// SPA gerçek HTTP 404 döndüremez: olmayan bir slug da 200 + index.html olarak gelir.
// Bulunamayan profil sayfası robots meta'sı yazmazsa index.html'in global
// "index, follow" değeri geçerli kalır ve uydurma her /kurulus/<x> adresi
// indekslenebilir görünür. Sitemap'te yüzlerce kuruluş sayfası olduğu için bu sızıntı
// gerçek bir risktir. App.notfound-seo.test.tsx ile aynı sözleşmenin kuruluş kopyası.

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IndependentProfile } from "@/lib/independent-profiles";
import IndependentProfilePage from "@/pages/IndependentProfilePage";

const getPublicIndependentProfile = vi.fn();

// `satisfies`: alan eksilirse/yanlışsa derleme zamanında düşer (cast bunu gizlerdi).
const PROFIL = {
  id: "profil-1",
  slug: "ornek-konsolosluk",
  profileKind: "consulate",
  typeLabel: "Konsolosluk",
  title: "Örnek Başkonsolosluğu",
  subtitle: null,
  country: "Almanya",
  city: "Berlin",
  description: "Örnek açıklama",
  websiteUrl: null,
  heroImageUrl: null,
  logoUrl: null,
  contactEmail: null,
  contactPhone: null,
  addressText: null,
  mapQuery: null,
  workingHours: null,
  services: [],
  announcements: [],
  ctas: [],
  isPublished: true,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
} satisfies IndependentProfile;

vi.mock("@/lib/independent-profiles", () => ({
  getPublicIndependentProfile: (slug: string) => getPublicIndependentProfile(slug),
}));

const robotsContent = (): string | null =>
  document.head.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/kurulus/:slug" element={<IndependentProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  document.head.innerHTML = "";
  getPublicIndependentProfile.mockReset();
});

describe("IndependentProfilePage SEO", () => {
  it("profil bulunamazsa robots meta'sını noindex, follow yazar", async () => {
    getPublicIndependentProfile.mockResolvedValue(null);

    renderAt("/kurulus/olmayan-kurum");

    await screen.findByText("Diplomatik profil bulunamadı");
    await waitFor(() => {
      expect(robotsContent()).toBe("noindex, follow");
    });
  });

  it("yükleme sürerken noindex yazmaz — geçerli sayfa bir an bile dışlanmasın", () => {
    getPublicIndependentProfile.mockReturnValue(new Promise(() => {}));

    renderAt("/kurulus/yukleniyor");

    expect(robotsContent()).toBeNull();
  });

  it("profil bulunursa noindex yazmaz", async () => {
    getPublicIndependentProfile.mockResolvedValue(PROFIL);

    renderAt("/kurulus/ornek-konsolosluk");

    await waitFor(() => {
      expect(document.title).toContain("Örnek Başkonsolosluğu");
    });
    expect(robotsContent()).not.toBe("noindex, follow");
  });
});
