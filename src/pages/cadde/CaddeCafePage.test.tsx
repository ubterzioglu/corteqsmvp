import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddeCafePage from "@/pages/cadde/CaddeCafePage";
import type { CaddeCafe } from "@/lib/cadde-types";

const useAuthMock = vi.fn();
const getCaddeCafeMock = vi.fn();
const listCafeFeedMock = vi.fn();
const listCafeMembersMock = vi.fn();
const listPostCommentsMock = vi.fn();
const createCommentMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/cadde-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-api")>("@/lib/cadde-api");
  return {
    ...actual,
    getCaddeCafe: (...args: unknown[]) => getCaddeCafeMock(...args),
    listCaddeCafeFeed: (...args: unknown[]) => listCafeFeedMock(...args),
    listCaddeCafeMembers: (...args: unknown[]) => listCafeMembersMock(...args),
    listCaddePostComments: (...args: unknown[]) => listPostCommentsMock(...args),
    createCaddeComment: (...args: unknown[]) => createCommentMock(...args),
  };
});

vi.mock("@/lib/cadde-cafe-api", () => ({ listCaddeCafeThemes: vi.fn().mockResolvedValue([]) }));

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
    listPostCommentsMock.mockResolvedValue({ items: [], nextCursor: null });
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
    expect(screen.queryByPlaceholderText(/Bu odada bir şey paylaş/)).not.toBeInTheDocument();
    expect(screen.getByText(/read-only arşiv/)).toBeInTheDocument();
  });

  it("shows the owner approval panel with pending members", async () => {
    useAuthMock.mockReturnValue({ session: { user: { id: "host-1" } }, user: { id: "host-1" }, isLoading: false });
    getCaddeCafeMock.mockResolvedValue(makeCafe({ hostUserId: "host-1", viewerMemberStatus: "approved", joinedByViewer: true }));
    listCafeMembersMock.mockResolvedValue([
      {
        id: "m1",
        userId: "u2",
        status: "pending",
        answer: "Backend geliştiriciyim",
        joinedAt: new Date().toISOString(),
        displayName: "Mert K.",
        country: "Almanya",
        city: "Berlin",
        roleKey: "User_Standard",
        roleLabel: "Bireysel Üye",
        shortBio: "Dağıtık sistemlerle ilgileniyorum.",
        hasPublicProfile: true,
      },
      {
        id: "m2",
        userId: "u3",
        status: "pending",
        answer: null,
        joinedAt: new Date().toISOString(),
        displayName: "Zeynep T.",
        country: null,
        city: null,
        roleKey: "User_Standard",
        roleLabel: "Bireysel Üye",
        shortBio: null,
        hasPublicProfile: false,
      },
    ]);

    renderPage();

    expect(await screen.findByText("Üye Onay Paneli")).toBeInTheDocument();
    expect(screen.getByText(/Backend geliştiriciyim/)).toBeInTheDocument();
    expect(screen.getAllByText("Almanya • Berlin")).toHaveLength(2);
    expect(screen.getAllByText("Bireysel Üye")).toHaveLength(2);
    expect(screen.getByText("Dağıtık sistemlerle ilgileniyorum.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Açık profili görüntüle" })).toHaveAttribute(
      "href",
      "/directory/profile/u2",
    );
    expect(screen.getByText("Profil herkese açık değil")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Onayla" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Reddet" })).toHaveLength(2);
  });

  it("renders a not-found state when the cafe does not exist", async () => {
    getCaddeCafeMock.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText(/Cafe bulunamadı/)).toBeInTheDocument();
  });

  // WS2 m57/m59/m60/m61 — kafe içi sosyal katman.
  describe("kafe içi sosyal katman (WS2)", () => {
    const joinedCafe = () =>
      makeCafe({ entryMode: "open", viewerMemberStatus: "approved", joinedByViewer: true });

    const post = {
      id: "cafe-post-1",
      authorName: "Ayşe",
      body: "Detaylar https://corteqs.net/cadde adresinde",
      createdAt: new Date().toISOString(),
      commentCount: 1,
      media: [],
      mentions: [],
    };

    it("m59+m61: kafe kutusu ana akışla aynı composer — medya ve emoji taşır", async () => {
      getCaddeCafeMock.mockResolvedValue(joinedCafe());

      renderPage();

      expect(await screen.findByRole("button", { name: "Fotoğraf" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Video" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Emoji ekle" })).toBeInTheDocument();
    });

    it("kafe varyantında konum çipi çizilmez (post zaten bu odaya gider)", async () => {
      getCaddeCafeMock.mockResolvedValue(joinedCafe());

      renderPage();

      await screen.findByRole("button", { name: "Fotoğraf" });
      expect(screen.queryByRole("button", { name: "Konum" })).not.toBeInTheDocument();
    });

    it("m60: gövdedeki bağlantı tıklanabilir çizilir (düz metin değil)", async () => {
      getCaddeCafeMock.mockResolvedValue(joinedCafe());
      listCafeFeedMock.mockResolvedValue([post]);

      renderPage();

      const link = await screen.findByRole("link", { name: /corteqs\.net\/cadde/i });
      expect(link.getAttribute("href")).toContain("corteqs.net/cadde");
    });

    it("m57: yorum paneli açılır, yorumu gösterir ve butonla gönderir", async () => {
      const user = userEvent.setup();
      getCaddeCafeMock.mockResolvedValue(joinedCafe());
      listCafeFeedMock.mockResolvedValue([post]);
      listPostCommentsMock.mockResolvedValue({
        items: [{ id: "c1", postId: post.id, userId: "u2", body: "İlk yorum", authorName: "Zeynep", createdAt: new Date().toISOString() }],
        nextCursor: null,
      });
      createCommentMock.mockResolvedValue("new-comment");

      renderPage();

      // m21 deseni: panel kapalıyken yorumlar DB'den HİÇ çekilmez.
      const toggle = await screen.findByTestId("cadde-post-comments-toggle");
      expect(listPostCommentsMock).not.toHaveBeenCalled();

      await user.click(toggle);
      expect(await screen.findByText("İlk yorum")).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText("Yorum yaz"), "Katılıyorum");
      await user.click(screen.getByRole("button", { name: /Gönder/i }));

      await waitFor(() => expect(createCommentMock).toHaveBeenCalledWith("cafe-post-1", "Katılıyorum"));
    });

    it("m80+m81 kafede de geçerli: Enter yorumu göndermez", async () => {
      const user = userEvent.setup();
      getCaddeCafeMock.mockResolvedValue(joinedCafe());
      listCafeFeedMock.mockResolvedValue([post]);

      renderPage();

      await user.click(await screen.findByTestId("cadde-post-comments-toggle"));
      await user.type(await screen.findByPlaceholderText("Yorum yaz"), "satır{Enter}");

      expect(createCommentMock).not.toHaveBeenCalled();
    });

    it("üye olmayan yorum yazamaz, yalnız okur", async () => {
      getCaddeCafeMock.mockResolvedValue(makeCafe({ viewerMemberStatus: null, joinedByViewer: false }));
      listCafeFeedMock.mockResolvedValue([post]);

      const user = userEvent.setup();
      renderPage();

      await user.click(await screen.findByTestId("cadde-post-comments-toggle"));

      expect(screen.queryByPlaceholderText("Yorum yaz")).not.toBeInTheDocument();
      expect(screen.getByText(/bu odaya katılmalısın/i)).toBeInTheDocument();
    });
  });
});
