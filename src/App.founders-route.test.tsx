import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, isLoading: false }),
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

describe("App founders routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/founders");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the founders page on /founders", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);

    expect(screen.getByRole("link", { name: "CorteQS CorteQS Global Türk Diaspora Network" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Burak Akçakanat" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Umut Barış Terzioğlu" })).toBeInTheDocument();
    expect(screen.getAllByAltText("CorteQS").length).toBeGreaterThan(0);
    expect(screen.getByAltText("Burak Akçakanat profil fotoğrafı")).toBeInTheDocument();
    expect(screen.getByAltText("Umut Barış Terzioğlu profil fotoğrafı")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Burak Akçakanat LinkedIn profili" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/burakakcakanat/",
    );
    expect(screen.getByRole("link", { name: "Umut Barış Terzioğlu LinkedIn profili" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ubterzioglu",
    );
    expect(screen.getByText("Ürün güveni odaklı kalite yaklaşımı")).toBeInTheDocument();
    expect(screen.getByText("Disiplinli test stratejisi")).toBeInTheDocument();
    expect(screen.getByText("Süreç optimizasyonu bakışı")).toBeInTheDocument();
    expect(screen.getByText("Ölçeklenebilir otomasyon becerisi")).toBeInTheDocument();
    expect(screen.getByText("Kurumsal güvenilirlik odağı")).toBeInTheDocument();
    expect(screen.getByText("Topluluk uyumlu teknik mimari")).toBeInTheDocument();
    expect(screen.getByText("Kaliteyi koruyan sistem tasarımı")).toBeInTheDocument();
    expect(screen.getByText("Operasyonel düzen kurma disiplini")).toBeInTheDocument();
    expect(screen.getByText("Diaspora ihtiyaçlarına ürün yaklaşımı")).toBeInTheDocument();
  });
});
