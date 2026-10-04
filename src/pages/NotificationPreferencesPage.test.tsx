import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotificationPreferencesPage from "@/pages/NotificationPreferencesPage";
import {
  getRelocationReminderPreference,
  setRelocationReminderOptOut,
} from "@/lib/relocation-reminders-api";

vi.mock("@/lib/relocation-reminders-api", () => ({
  getRelocationReminderPreference: vi.fn(),
  setRelocationReminderOptOut: vi.fn(),
}));
vi.mock("@/lib/seo", () => ({ useSeo: vi.fn() }));
// M26: sayfa artık CityFollowCard'ı da çiziyor — kartın veri kaynakları
// BİLİNÇLİ mock'lanır (kendi testleri CityFollowCard.test.tsx'te).
vi.mock("@/lib/city-follows-api", () => ({
  CITY_FOLLOWS_MAX_PER_USER: 10,
  fetchMyCityFollows: vi.fn().mockResolvedValue([]),
  listCityOptionsForCountry: vi.fn().mockResolvedValue([]),
  filterCityOptions: (options: unknown[]) => options,
  addCityFollow: vi.fn(),
  removeCityFollow: vi.fn(),
}));
vi.mock("@/lib/geo", () => ({
  listGeoCountries: vi.fn().mockResolvedValue([]),
}));

const getMock = vi.mocked(getRelocationReminderPreference);
const setMock = vi.mocked(setRelocationReminderOptOut);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><NotificationPreferencesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NotificationPreferencesPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
  });

  it("global özellik kapalıyken bunu açıkça gösterir", async () => {
    getMock.mockResolvedValue({ opted_out: false, global_enabled: false });
    renderPage();

    expect(await screen.findByText(/hukuk\/izin onayına kadar/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Yarım kalan araç hatırlatmaları" })).toBeChecked();
  });

  it("switch kapatılınca opt-out RPC'sini çağırır", async () => {
    getMock.mockResolvedValue({ opted_out: false, global_enabled: false });
    setMock.mockResolvedValue({ opted_out: true, global_enabled: false });
    renderPage();

    const toggle = await screen.findByRole("switch", { name: "Yarım kalan araç hatırlatmaları" });
    fireEvent.click(toggle);

    await waitFor(() => expect(setMock).toHaveBeenCalledWith(true, expect.anything()));
  });

  it("M26: haftalık şehir özeti bölümü (CityFollowCard) sayfada çizilir", async () => {
    getMock.mockResolvedValue({ opted_out: false, global_enabled: false });
    renderPage();

    expect(await screen.findByTestId("city-follow-card")).toBeInTheDocument();
    // Dürüst metin: platform geneli anahtarın KAPALI olduğu açıkça yazar.
    expect(screen.getByText(/doğrulama aşamasında KAPALI/i)).toBeInTheDocument();
  });
});
