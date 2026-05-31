import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AddWhatsAppPage from "@/pages/AddWhatsAppPage";
import { TooltipProvider } from "@/components/ui/tooltip";

const toastSpy = vi.fn();
const listLandingsSpy = vi.fn();
const getLandingSpy = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastSpy,
  }),
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/whatsapp-landings", () => ({
  listLandings: (...args: unknown[]) => listLandingsSpy(...args),
  getLanding: (...args: unknown[]) => getLandingSpy(...args),
  submitLanding: vi.fn(),
  createJoinRequest: vi.fn(),
}));

const listFixture = [
  {
    id: "berlin-girisim",
    dbId: "db-1",
    groupName: "Berlin Girisimciler",
    category: "yatirim",
    country: "Almanya",
    city: "Berlin",
    mode: "visual",
    heroImage: "https://example.com/hero.jpg",
    tagline: "Berlin'de is ve network",
    callToActionText: "Katıl ve ağını büyüt",
    conditions: "Reklam yasak",
    whatsappLink: "https://chat.whatsapp.com/test",
    adminName: "Burak",
    adminContact: "info@example.com",
    createdAt: "2026-05-15T00:00:00Z",
  },
] as const;

function renderPage(initialEntry = "/addcom") {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/addcom" element={<AddWhatsAppPage />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe("AddWhatsAppPage", () => {
  beforeEach(() => {
    listLandingsSpy.mockResolvedValue(listFixture);
    getLandingSpy.mockResolvedValue(listFixture[0]);
    useAuthMock.mockReturnValue({ user: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the listing view and filters by search", async () => {
    renderPage();

    expect(await screen.findByText("Berlin Girisimciler")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Topluluk Ekle/i }));
    expect(screen.getByText("Kategori")).toBeInTheDocument();
    expect(screen.getByText("İsteğe bağlı kategori seç")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Topluluk ara/i), {
      target: { value: "Tokyo" },
    });

    expect(screen.getByText(/Filtreye uygun grup bulunamadı/i)).toBeInTheDocument();
  });

  it("renders the landing detail when group query exists", async () => {
    renderPage("/addcom?group=berlin-girisim");

    expect(await screen.findByText("Berlin Girisimciler")).toBeInTheDocument();
    expect(screen.getByText(/Katıl ve ağını büyüt/i)).toBeInTheDocument();
  });

  it("shows '-' for manager when admin name is missing", async () => {
    getLandingSpy.mockResolvedValue({
      ...listFixture[0],
      adminName: undefined,
    });

    renderPage("/addcom?group=berlin-girisim");

    expect(await screen.findByText("Berlin Girisimciler")).toBeInTheDocument();
    expect(screen.getByText("Yönetici")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("shows not found state for an unknown landing slug", async () => {
    getLandingSpy.mockResolvedValue(null);

    renderPage("/addcom?group=olmayan");

    expect(await screen.findByText(/Landing sayfası bulunamadı/i)).toBeInTheDocument();
  });
});
