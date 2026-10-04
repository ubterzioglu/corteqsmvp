/**
 * M20 · RecommendationsPage (/tavsiye) davranış testleri.
 * Kilitler: liste çizilir (anonim görür) · girişli kullanıcıda "Tavsiye iste" formu ·
 *RequireFeature YOK (M01) — rota guard'sız (community-free-features.test ayrıca kilitler).
 */
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMock = vi.fn();
const createMutate = vi.fn();
let mockUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));
vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/hooks/use-recommendations", () => ({
  useRecommendations: () => listMock(),
  useCreateRecommendation: () => ({
    mutate: createMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  }),
}));

import RecommendationsPage from "./RecommendationsPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <RecommendationsPage />
    </MemoryRouter>,
  );

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "r1",
  user_id: "u9",
  title: "Dortmund'da güvenilir terzi",
  body: "Öneri var mı?",
  category_slug: "terzi",
  country: "DE",
  city: "Dortmund",
  status: "open",
  diaspora_key: "tr",
  created_at: "2026-10-03T10:00:00Z",
  updated_at: "2026-10-03T10:00:00Z",
  ...over,
});

describe("RecommendationsPage (/tavsiye)", () => {
  beforeEach(() => {
    listMock.mockReset();
    createMutate.mockReset();
    mockUser = { id: "u1" };
  });

  it("talep listesini çizer (başlık + şehir) — anonim de görür", async () => {
    listMock.mockReturnValue({ data: [row()], isLoading: false, isError: false });
    renderPage();

    expect(await screen.findByText("Dortmund'da güvenilir terzi")).toBeInTheDocument();
    expect(screen.getByText(/Dortmund, DE/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tavsiye İste/i })).toBeInTheDocument();
  });

  it("girişli kullanıcıda 'Tavsiye iste' düğmesi formu açar", async () => {
    listMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Tavsiye iste/i }));
    expect(screen.getByLabelText("Başlık")).toBeInTheDocument();
    expect(screen.getByLabelText("Açıklama")).toBeInTheDocument();
  });

  it("anonim kullanıcıda form yerine 'giriş yap' yönlendirmesi", async () => {
    mockUser = null;
    listMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderPage();

    expect(await screen.findByRole("button", { name: /Talep açmak için giriş yap/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Tavsiye iste$/i })).not.toBeInTheDocument();
  });

  it("boş liste + hata durumu görünür (sessiz boş yok)", async () => {
    listMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderPage();
    expect(await screen.findByText(/henüz talep yok/i)).toBeInTheDocument();

    listMock.mockReturnValue({ data: [], isLoading: false, isError: true });
    renderPage();
    expect(await screen.findByText(/Talepler okunamadı/i)).toBeInTheDocument();
  });
});
