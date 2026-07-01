import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const listSpy = vi.fn();

vi.mock("@/lib/relocation-tools-admin-api", () => ({
  listToolQuestionCounts: (...args: unknown[]) => listSpy(...args),
}));

import RelocationToolsQuestionCountsPage from "@/pages/admin/relocation/RelocationToolsQuestionCountsPage";

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RelocationToolsQuestionCountsPage />
    </QueryClientProvider>,
  );
}

describe("RelocationToolsQuestionCountsPage", () => {
  it("motor tabanlı ve standalone araçları doğru tip rozetiyle listeler", async () => {
    listSpy.mockResolvedValue([
      {
        key: "ulke_secimi",
        slug: "ulke-secimi",
        title_tr: "Ülke Seçimi",
        category: "core",
        kind: "question_bank",
        quick_count: 12,
        detailed_count: 20,
        total_count: 20,
        is_active: true,
      },
      {
        key: "vatandaslik_testi_almanya",
        slug: "vatandaslik-testi-almanya",
        title_tr: "Vatandaşlık Testi (Almanya)",
        category: "germany_tools",
        kind: "question_bank",
        quick_count: 469,
        detailed_count: 469,
        total_count: 469,
        is_active: true,
      },
      {
        key: "vize_secim_almanya",
        slug: "vize-secim-almanya",
        title_tr: "Vize Seçimi (Almanya)",
        category: "germany_tools",
        kind: "decision_tree",
        quick_count: 15,
        detailed_count: 15,
        total_count: 15,
        is_active: true,
      },
      {
        key: "maas_hesaplama_almanya",
        slug: "maas-hesaplama-almanya",
        title_tr: "Maaş Hesaplama (Almanya)",
        category: "germany_tools",
        kind: "calculator",
        quick_count: 9,
        detailed_count: 9,
        total_count: 9,
        is_active: true,
      },
    ]);

    renderPage();

    expect(await screen.findByText("Ülke Seçimi")).toBeInTheDocument();
    expect(screen.getByText("Vatandaşlık Testi (Almanya)")).toBeInTheDocument();
    expect(screen.getByText("Vize Seçimi (Almanya)")).toBeInTheDocument();
    expect(screen.getByText("Maaş Hesaplama (Almanya)")).toBeInTheDocument();

    // Tip rozetleri
    expect(screen.getAllByText("Soru Bankası").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Karar Ağacı")).toBeInTheDocument();
    expect(screen.getByText("Hesaplayıcı")).toBeInTheDocument();

    // Sayılar (Vatandaşlık Testi satırında Hızlı/Normal/Toplam üçü de 469 olduğundan üç hücrede belirir)
    expect(screen.getAllByText("469").length).toBeGreaterThanOrEqual(1);
  });

  it("arama kutusu araç adına göre filtreler", async () => {
    listSpy.mockResolvedValue([
      {
        key: "ulke_secimi",
        slug: "ulke-secimi",
        title_tr: "Ülke Seçimi",
        category: "core",
        kind: "question_bank",
        quick_count: 12,
        detailed_count: 20,
        total_count: 20,
        is_active: true,
      },
      {
        key: "banka_secim_almanya",
        slug: "banka-secim-almanya",
        title_tr: "Banka Seçimi (Almanya)",
        category: "germany_tools",
        kind: "question_bank",
        quick_count: 20,
        detailed_count: 20,
        total_count: 20,
        is_active: true,
      },
    ]);

    renderPage();
    await screen.findByText("Ülke Seçimi");

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/ara/i), "banka");

    expect(screen.queryByText("Ülke Seçimi")).not.toBeInTheDocument();
    expect(screen.getByText("Banka Seçimi (Almanya)")).toBeInTheDocument();
  });
});
