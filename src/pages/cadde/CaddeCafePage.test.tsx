import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddeCafePage from "@/pages/cadde/CaddeCafePage";
import type { CaddeCafe } from "@/lib/cadde-types";

const useAuthMock = vi.fn();
const getCaddeCafeMock = vi.fn();
const listCafeFeedMock = vi.fn();
const listCafeMembersMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/cadde-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-api")>("@/lib/cadde-api");
  return {
    ...actual,
    getCaddeCafe: (...args: unknown[]) => getCaddeCafeMock(...args),
    listCaddeCafeFeed: (...args: unknown[]) => listCafeFeedMock(...args),
    listCaddeCafeMembers: (...args: unknown[]) => listCafeMembersMock(...args),
  };
});

const makeCafe = (overrides: Partial<CaddeCafe> = {}): CaddeCafe => ({
  id: "cafe-1",
  title: "Berlin IT Sohbeti",
  summary: "Haftalık IT sohbeti",
  hostName: "Ayşe U.",
  country: "Almanya",
  city: "Berlin",
  isBridge: false,
  isFree: true,
  startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  endsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  isActive: true,
  memberCount: 5,
  joinedByViewer: false,
  mode: "real",
  slug: "berlin-it-sohbeti-abc123",
  themeKey: "IT",
  entryMode: "approval",
  entryQuestion: "Hangi alanda çalışıyorsun?",
  capacity: 50,
  archivedAt: null,
  hostUserId: "host-1",
  viewerMemberStatus: null,
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/cadde/cafe/cafe-1"]}>
        <Routes>
          <Route path="/cadde/cafe/:cafeId" element={<CaddeCafePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("CaddeCafePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ session: { user: { id: "user-1" } }, user: { id: "user-1" }, isLoading: false });
    listCafeFeedMock.mockResolvedValue([]);
    listCafeMembersMock.mockResolvedValue([]);
  });

  it("renders the cafe header with entry question for approval mode", async () => {
    getCaddeCafeMock.mockResolvedValue(makeCafe());

    renderPage();

    expect(await screen.findByText("Berlin IT Sohbeti")).toBeInTheDocument();
    expect(screen.getByText(/Canlı/)).toBeInTheDocument();
    expect(screen.getByText(/Hangi alanda çalışıyorsun\?/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Katılım Talebi Gönder/i })).toBeInTheDocument();
  });

  it("shows the read-only archive state without join box or composer", async () => {
    getCaddeCafeMock.mockResolvedValue(makeCafe({ archivedAt: new Date().toISOString(), isActive: false, viewerMemberStatus: "approved", joinedByViewer: true }));

    renderPage();

    expect(await screen.findByText(/Arşiv \(read-only\)/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Katıl/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Cafe'de paylaş/)).not.toBeInTheDocument();
    expect(screen.getByText(/read-only arşiv/)).toBeInTheDocument();
  });

  it("shows the owner approval panel with pending members", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "host-1" } }, user: { id: "host-1" }, isLoading: false });
    getCaddeCafeMock.mockResolvedValue(makeCafe({ hostUserId: "host-1", viewerMemberStatus: "approved", joinedByViewer: true }));
    listCafeMembersMock.mockResolvedValue([
      { id: "m1", userId: "u2", status: "pending", answer: "Backend geliştiriciyim", joinedAt: new Date().toISOString(), displayName: "Mert K." },
    ]);

    renderPage();

    expect(await screen.findByText("Üye Onay Paneli")).toBeInTheDocument();
    expect(screen.getByText(/Backend geliştiriciyim/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Onayla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reddet" })).toBeInTheDocument();
  });

  it("renders a not-found state when the cafe does not exist", async () => {
    getCaddeCafeMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText(/Cafe bulunamadı/)).toBeInTheDocument();
  });
});
