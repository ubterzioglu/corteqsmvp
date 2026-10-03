/**
 * M15 · AdminTractionPage davranış testleri.
 *
 * Kilitler: 5 kart çizilir · sayı metrikleri gerçek değerle · tavsiye
 * available=false → "—" + "M17 ... boş (normal)" · return_rate null → "—"
 * (uydurma sayı YOK) · hata durumu görünür.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/lib/admin/admin-traction-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin/admin-traction-api")>();
  return { ...actual, fetchTractionMetrics: () => fetchMock() };
});

import AdminTractionPage from "./AdminTractionPage";

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AdminTractionPage />, { wrapper });
};

const fullData = () => ({
  weeklyActiveUsers: { active_7d: 12, window_days: 7 },
  contentCreated: {
    events_7d: 0,
    events_total: 1,
    cadde_posts_7d: 2,
    cadde_posts_total: 30,
    carsi_items_7d: 0,
    carsi_items_total: 0,
    groups_7d: 0,
    groups_total: 10,
    group_posts_7d: 0,
    group_posts_total: 0,
    recommendations_total: 0,
    window_days: 7,
  },
  recommendationResponseRate: {
    available: false,
    total: 0,
    responded: 0,
    response_rate: null,
    note: "Tavsiye modülü (M17) gelene dek boş — normal",
  },
  inviteSignups: { last_7d: 1, last_30d: 3, total: 5 },
  returnRate30d: { cohort_size: 40, returned: 10, return_rate: 0.25, window_days: 30 },
});

describe("AdminTractionPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("5 metrik kartı da başlığıyla çizilir", async () => {
    fetchMock.mockResolvedValue(fullData());
    renderPage();

    expect(await screen.findByText("Haftalık Aktif Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("Üretilen İçerik (toplam)")).toBeInTheDocument();
    expect(screen.getByText("Tavsiye Yanıt Oranı")).toBeInTheDocument();
    expect(screen.getByText("Davetle Gelen Kayıt")).toBeInTheDocument();
    expect(screen.getByText("30 Gün Geri Dönüş Oranı")).toBeInTheDocument();
  });

  it("sayı metrikleri gerçek değerle çizilir (WAU 12 · içerik 41 · davet 5)", async () => {
    fetchMock.mockResolvedValue(fullData());
    renderPage();

    expect(await screen.findByText("12")).toBeInTheDocument(); // WAU
    expect(screen.getByText("41")).toBeInTheDocument(); // toplam içerik (1+30+10)
    expect(screen.getByText("5")).toBeInTheDocument(); // davet toplam
    expect(screen.getByText("%25")).toBeInTheDocument(); // geri dönüş oranı
  });

  it("tavsiye available=false → '—' + 'M17 ... boş (normal)' (uydurma oran YOK)", async () => {
    fetchMock.mockResolvedValue(fullData());
    renderPage();

    // Önce verinin yüklendiğini bekle (WAU=12) — aksi halde isLoading değerleri
    // "…" çizer ve "—" assert'i erken koşar (subtitle yüklenirken de görünür).
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("M17 tavsiye modülü gelene dek boş (normal)")).toBeInTheDocument();
    // Tavsiye kartının değeri "—" (return_rate 0.25 → "%25", o yüzden tek "—" tavsiyeden)
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("%25")).toBeInTheDocument();
  });

  it("return_rate null → '—' (cohort boş, uydurma yüzde yok)", async () => {
    const data = fullData();
    data.returnRate30d = { cohort_size: 0, returned: 0, return_rate: null, window_days: 30 };
    fetchMock.mockResolvedValue(data);
    renderPage();

    // İçerik kırılımı alt başlığı çizildi (veri geldi) → sonra rate "—"
    expect(await screen.findByText(/Etkinlik 1 · Cadde 30/)).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("%25")).not.toBeInTheDocument();
  });

  it("hata durumunda görünür mesaj (sessiz boş panel yok)", async () => {
    fetchMock.mockRejectedValue(new Error("permission denied"));
    renderPage();

    expect(await screen.findByText(/Metrikler okunamadı/i)).toBeInTheDocument();
  });
});
