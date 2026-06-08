import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import SiteHeader from "@/components/SiteHeader";

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, isLoading: false }),
}));

describe("SiteHeader", () => {
  it("shows the brand header with auth links routed from the top bar", () => {
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
});
