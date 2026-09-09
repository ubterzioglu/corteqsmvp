import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SiteHeader from "@/components/SiteHeader";

// Mock hoist edildiği için durum vi.hoisted ile taşınır; testler authState.user'ı
// değiştirerek giriş yapmış / yapmamış varyantını seçer.
const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    session: authState.user ? { user: authState.user } : null,
    isLoading: false,
    signOut: vi.fn(),
  }),
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    authState.user = null;
  });

  it("shows the brand header, slogan and auth links for a signed-out visitor", () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    expect(screen.getByText("CorteQS")).toBeInTheDocument();
    expect(screen.getByText("Global Türk Diaspora Network")).toBeInTheDocument();
    expect(screen.getByText("Dünyadaki Türkleri Bir Araya Getiren Platform")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giriş Yap" })).toHaveAttribute("href", "/login?mode=login");
    expect(screen.getByRole("link", { name: "Kayıt Ol" })).toHaveAttribute("href", "/login?mode=signup");
    expect(screen.queryByText("Founding 1000")).not.toBeInTheDocument();
    expect(screen.queryByText("Whatsapp Topluluğu")).not.toBeInTheDocument();
    expect(screen.queryByText("Ana Sayfa")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Anketler" })).not.toBeInTheDocument();
    expect(screen.queryByText("19 Mayıs Etkinlikleri")).not.toBeInTheDocument();
  });

  // H4 (m152): girişli üyeye pazarlama sloganı gösterilmez — Cadde'de içerikten önceki
  // ~300px yığını düşürmenin ilk adımı. Slogan yalnız ziyaretçi için anlamlı.
  it("hides the marketing slogan for a signed-in member", () => {
    authState.user = { id: "user-1" };

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    expect(
      screen.queryByText("Dünyadaki Türkleri Bir Araya Getiren Platform"),
    ).not.toBeInTheDocument();
    // Marka kimliği ve girişli nav'ı gizlemedik — yalnız pazarlama sloganı kalktı.
    expect(screen.getByText("CorteQS")).toBeInTheDocument();
    expect(screen.getByText("Global Türk Diaspora Network")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profilim" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: "Çıkış" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Giriş Yap" })).not.toBeInTheDocument();
  });
});
