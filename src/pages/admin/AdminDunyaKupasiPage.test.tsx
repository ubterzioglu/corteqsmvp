import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminDunyaKupasiPage from "@/pages/admin/AdminDunyaKupasiPage";

const toastSpy = vi.fn();
const listRegistrationsSpy = vi.fn();
const reviewRegistrationSpy = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/lib/admin/admin-dunya-kupasi-api", () => ({
  listWorldCupRegistrationsAsAdmin: (...args: unknown[]) => listRegistrationsSpy(...args),
  reviewWorldCupRegistrationAsAdmin: (...args: unknown[]) => reviewRegistrationSpy(...args),
}));

vi.mock("@/lib/dunya-kupasi-api", () => ({
  getWorldCupImagePublicUrl: (path: string | null) =>
    path ? `https://cdn.example/world-cup-images/${path}` : null,
}));

const pendingFixture = [
  {
    id: "reg-1",
    userId: "user-1",
    email: "cafe@example.com",
    businessName: "Boğaz Cafe",
    categoryRoleKey: "Business_RestaurantCafe",
    categoryLabel: "Restoran / Cafe",
    country: "Almanya",
    city: "Berlin",
    phone: "+49 170 1234567",
    address: "Hauptstr. 1",
    imagePath: "user-1/mekan.jpg",
    broadcastConfirmed: true,
    applicantNote: "3 ekranımız var",
    status: "pending" as const,
    reviewedAt: null,
    reviewNote: null,
    previousRoleKey: null,
    roleAssigned: null,
    createdAt: "2026-06-11T00:00:00Z",
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminDunyaKupasiPage />
    </QueryClientProvider>,
  );
}

describe("AdminDunyaKupasiPage", () => {
  beforeEach(() => {
    listRegistrationsSpy.mockResolvedValue(pendingFixture);
    reviewRegistrationSpy.mockResolvedValue({
      status: "approved",
      roleAssigned: true,
      previousRoleKey: "User_DiasporaMember",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("bekleyen başvuruları listeler", async () => {
    renderPage();

    expect(await screen.findByText("Boğaz Cafe")).toBeInTheDocument();
    expect(screen.getByText(/Restoran \/ Cafe/)).toBeInTheDocument();
    expect(screen.getByText(/cafe@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/\+49 170 1234567/)).toBeInTheDocument();
    expect(screen.getByAltText("Boğaz Cafe görseli")).toHaveAttribute(
      "src",
      "https://cdn.example/world-cup-images/user-1/mekan.jpg",
    );
    expect(listRegistrationsSpy).toHaveBeenCalledWith("pending");
  });

  it("onay aksiyonu review RPC'sini çağırır", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Onayla" }));

    await waitFor(() => {
      expect(reviewRegistrationSpy).toHaveBeenCalledWith("reg-1", true, null);
    });
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Başvuru onaylandı" }),
    );
  });

  it("rol korunduğunda uyarı toast'ı gösterir", async () => {
    reviewRegistrationSpy.mockResolvedValue({
      status: "approved",
      roleAssigned: false,
      previousRoleKey: "Consultant_Financial",
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Onayla" }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Onaylandı — rol korundu",
          description: expect.stringContaining("Consultant_Financial"),
        }),
      );
    });
  });

  it("red aksiyonu notu RPC'ye iletir", async () => {
    reviewRegistrationSpy.mockResolvedValue({ status: "rejected" });
    renderPage();

    fireEvent.change(await screen.findByPlaceholderText(/Değerlendirme notu/i), {
      target: { value: "Yayın doğrulanamadı" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reddet" }));

    await waitFor(() => {
      expect(reviewRegistrationSpy).toHaveBeenCalledWith("reg-1", false, "Yayın doğrulanamadı");
    });
  });
});
