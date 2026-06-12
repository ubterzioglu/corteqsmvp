import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DunyaKupasiKayitPage from "@/pages/DunyaKupasiKayitPage";

const toastSpy = vi.fn();
const useAuthMock = vi.fn();
const fetchSettingsSpy = vi.fn();
const fetchMyRegistrationSpy = vi.fn();
const listCategoriesSpy = vi.fn();
const createRegistrationSpy = vi.fn();
const uploadImageSpy = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/dunya-kupasi-api", () => ({
  fetchWorldCupCampaignSettings: (...args: unknown[]) => fetchSettingsSpy(...args),
  fetchMyWorldCupRegistration: (...args: unknown[]) => fetchMyRegistrationSpy(...args),
  listBusinessCategoryOptions: (...args: unknown[]) => listCategoriesSpy(...args),
  createWorldCupRegistration: (...args: unknown[]) => createRegistrationSpy(...args),
  uploadWorldCupImage: (...args: unknown[]) => uploadImageSpy(...args),
}));

const activeSettings = { isActive: true, startsAt: null, endsAt: null };

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/dunya-kupasi/kayit"]}>
        <Routes>
          <Route path="/dunya-kupasi/kayit" element={<DunyaKupasiKayitPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DunyaKupasiKayitPage", () => {
  beforeEach(() => {
    fetchSettingsSpy.mockResolvedValue(activeSettings);
    fetchMyRegistrationSpy.mockResolvedValue(null);
    listCategoriesSpy.mockResolvedValue([
      { key: "Business_RestaurantCafe", label: "Restoran / Cafe" },
    ]);
    createRegistrationSpy.mockResolvedValue("reg-1");
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("oturum yokken doğru next paramlı login CTA'sını gösterir", async () => {
    renderPage();

    const signupLink = await screen.findByRole("link", { name: /Google veya e-posta ile kayıt ol/i });
    expect(signupLink).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fdunya-kupasi%2Fkayit",
    );
    const loginLink = screen.getByRole("link", { name: /Zaten hesabım var/i });
    expect(loginLink).toHaveAttribute("href", "/login?next=%2Fdunya-kupasi%2Fkayit");
  });

  it("kampanya pasifken formu gizler", async () => {
    fetchSettingsSpy.mockResolvedValue({ isActive: false, startsAt: null, endsAt: null });
    renderPage();

    expect(await screen.findByText(/Kampanya aktif değil/i)).toBeInTheDocument();
    expect(screen.queryByText(/İşletme Bilgileri/i)).not.toBeInTheDocument();
  });

  it("beyan işaretsiz ve kategori boşken Zod engeli RPC çağrısını durdurur", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    renderPage();

    expect(await screen.findByText(/İşletme Bilgileri/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/İşletme Adı/i), { target: { value: "Boğaz Cafe" } });
    fireEvent.change(screen.getByLabelText(/Ülke/i), { target: { value: "Almanya" } });
    fireEvent.change(screen.getByLabelText(/Şehir/i), { target: { value: "Berlin" } });

    fireEvent.click(screen.getByRole("button", { name: /Başvuruyu Gönder/i }));

    expect(await screen.findByText(/İşletme kategorisi seçmelisiniz/i)).toBeInTheDocument();
    expect(screen.getByText(/Maç yayını yaptığınızı onaylamalısınız/i)).toBeInTheDocument();
    expect(screen.getByText(/Telefon numarası gerekli/i)).toBeInTheDocument();
    expect(screen.getByText(/Adres en az 5 karakter olmalı/i)).toBeInTheDocument();
    expect(createRegistrationSpy).not.toHaveBeenCalled();
    expect(uploadImageSpy).not.toHaveBeenCalled();
  });

  it("bekleyen başvuru varsa formu değil durum kartını gösterir", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    fetchMyRegistrationSpy.mockResolvedValue({
      id: "reg-1",
      userId: "user-1",
      businessName: "Boğaz Cafe",
      categoryRoleKey: "Business_RestaurantCafe",
      country: "Almanya",
      city: "Berlin",
      phone: "+49 170 1234567",
      address: "Hauptstr. 1",
      imagePath: null,
      broadcastConfirmed: true,
      applicantNote: null,
      status: "pending",
      reviewedAt: null,
      reviewNote: null,
      createdAt: "2026-06-11T00:00:00Z",
    });
    renderPage();

    expect(await screen.findByText(/Başvurunuz onay bekliyor/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/İşletme Bilgileri/i)).not.toBeInTheDocument();
    });
  });
});
