import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRolesPreviewPage from "@/pages/admin/AdminRolesPreviewPage";

const { toast, supabaseMock } = vi.hoisted(() => {
  const supabaseMock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  };
  return { toast: vi.fn(), supabaseMock };
});

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

const mockRoles = [
  { key: "User_Standard", label: "Standart Kullanıcı", description: "Temel kullanıcı", sort_order: 1000 },
  { key: "Consultant_RealEstate", label: "Gayrimenkul Danışmanı", description: null, sort_order: 1200 },
  { key: "bireysel", label: "Bireysel Kullanıcı", description: "Bireysel login", sort_order: 10 },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminRolesPreviewPage />
    </MemoryRouter>,
  );

describe("AdminRolesPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockReturnThis();
    supabaseMock.select.mockReturnThis();
    supabaseMock.eq.mockReturnThis();
    supabaseMock.order.mockResolvedValue({ data: mockRoles, error: null });
  });

  it("renders page title", async () => {
    renderPage();
    expect(screen.getByText("Roller Önizleme")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderPage();
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
  });

  it("renders role labels after load", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Standart Kullanıcı")).toBeInTheDocument();
      expect(screen.getByText("Gayrimenkul Danışmanı")).toBeInTheDocument();
      expect(screen.getByText("Bireysel Kullanıcı")).toBeInTheDocument();
    });
  });

  it("renders role keys as slugs", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("User_Standard")).toBeInTheDocument();
      expect(screen.getByText("Consultant_RealEstate")).toBeInTheDocument();
    });
  });

  it("renders description when available", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Temel kullanıcı")).toBeInTheDocument();
    });
  });

  it("shows total role count", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/3 aktif rol/i)).toBeInTheDocument();
    });
  });

  it("shows error toast on load failure", async () => {
    supabaseMock.order.mockResolvedValue({ data: null, error: { message: "DB hatası" } });
    renderPage();
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
    });
  });
});
