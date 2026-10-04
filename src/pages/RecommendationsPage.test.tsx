/**
 * M20 · RecommendationsPage (/tavsiye) davranış testleri.
 * Kilitler: liste çizilir (anonim görür) · girişli kullanıcıda "Tavsiye iste" formu ·
 *RequireFeature YOK (M01) — rota guard'sız (community-free-features.test ayrıca kilitler).
 */
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listMock = vi.fn();
const createMutate = vi.fn();
let mockUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));
vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/lib/geo", () => ({
  listGeoCountries: vi.fn().mockResolvedValue([{ code: "DE", name: "Almanya" }]),
}));
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

const renderPage = () => {
  // Sayfa ülke listesi için DOĞRUDAN useQuery kullanır (F5 ISO seçici) →
  // provider zorunlu.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(<RecommendationsPage />, { wrapper });
};

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
    // F4: kategori alanı formda VAR (100 puanlık sinyal UI'dan toplanır).
    expect(screen.getByLabelText("Kategori")).toBeInTheDocument();
    // F5: ülke SERBEST METİN değil ISO kod seçici (geo_countries).
    expect(await screen.findByRole("option", { name: "Almanya" })).toBeInTheDocument();
  });

  it("F4/F5: submit kategori + ülke ISO KODU taşır (serbest metin ülke DEĞİL)", async () => {
    listMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    createMutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Tavsiye iste/i }));
    fireEvent.change(screen.getByLabelText("Başlık"), { target: { value: "Terzi arıyorum" } });
    fireEvent.change(screen.getByLabelText("Açıklama"), { target: { value: "Öneri var mı?" } });
    fireEvent.change(screen.getByLabelText("Kategori"), { target: { value: "terzi" } });
    const countryOption = await screen.findByRole("option", { name: "Almanya" });
    fireEvent.change(countryOption.parentElement as HTMLSelectElement, { target: { value: "DE" } });
    fireEvent.click(screen.getByRole("button", { name: /Talebi yayınla/i }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ category_slug: "terzi", country: "DE" }),
      expect.anything(),
    );
  });

  it("F2: api'den gelen Türkçe hata AYNEN gösterilir (genel mesaja düşmez)", async () => {
    listMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    createMutate.mockImplementation((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new Error("Hesabın bu işlem için kısıtlanmış. Destek ekibiyle iletişime geçebilirsin."));
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Tavsiye iste/i }));
    fireEvent.change(screen.getByLabelText("Başlık"), { target: { value: "Deneme" } });
    fireEvent.change(screen.getByLabelText("Açıklama"), { target: { value: "Deneme gövdesi" } });
    fireEvent.click(screen.getByRole("button", { name: /Talebi yayınla/i }));

    // Çift çözüm kusuru bunu "İşlem tamamlanamadı…"ya düşürürdü:
    expect(await screen.findByText(/Hesabın bu işlem için kısıtlanmış/i)).toBeInTheDocument();
    expect(screen.queryByText(/İşlem tamamlanamadı/i)).not.toBeInTheDocument();
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
