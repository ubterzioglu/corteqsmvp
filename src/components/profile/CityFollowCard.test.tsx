/**
 * M26 · CityFollowCard davranış testleri.
 * Kilitler: takip listesi + kaldırma · ülke→şehir ekleme akışı (addCityFollow
 * city_id ile) · tavan doluyken ekleme bölümü YOK + tavan notu · hata görünür ·
 * DÜRÜST metin (platform anahtarı KAPALI açıkça yazar; sahte toggle YOK).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const followsMock = vi.fn();
const countriesMock = vi.fn();
const citiesMock = vi.fn();
const addMock = vi.fn();
const removeMock = vi.fn();

vi.mock("@/lib/city-follows-api", () => ({
  CITY_FOLLOWS_MAX_PER_USER: 10,
  fetchMyCityFollows: () => followsMock(),
  listCityOptionsForCountry: (c: string) => citiesMock(c),
  filterCityOptions: (options: Array<{ name: string }>, query: string) =>
    query.trim() ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())) : options,
  addCityFollow: (id: string) => addMock(id),
  removeCityFollow: (id: string) => removeMock(id),
}));
vi.mock("@/lib/geo", () => ({ listGeoCountries: () => countriesMock() }));

import CityFollowCard from "./CityFollowCard";

const renderCard = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<CityFollowCard />, { wrapper });
};

const follow = (id: string, name: string, country = "Almanya") => ({
  city_id: id,
  created_at: "2026-10-04T10:00:00Z",
  city_name: name,
  country_name: country,
});

describe("CityFollowCard", () => {
  beforeEach(() => {
    followsMock.mockReset();
    countriesMock.mockReset();
    citiesMock.mockReset();
    addMock.mockReset();
    removeMock.mockReset();
    countriesMock.mockResolvedValue([{ code: "DE", name: "Almanya" }]);
    citiesMock.mockResolvedValue([]);
  });

  it("takip listesi çiplerle çizilir + kaldırma removeCityFollow çağırır", async () => {
    followsMock.mockResolvedValue([follow("c1", "Dortmund")]);
    renderCard();

    expect(await screen.findByTestId("city-follow-chip-c1")).toBeInTheDocument();
    // Sayaç JSX enterpolasyonuyla BÖLÜNÜR ("(", "1", "/", "10", ")") — birleşik
    // metin normalizer ile okunur (tek text node varsayımı yanlış pozitifti).
    expect(screen.getByText(/Takip edilen şehirler/)).toBeInTheDocument();
    expect(screen.getByTestId("city-follow-chip-c1").parentElement?.parentElement?.textContent).toContain("1/10");

    fireEvent.click(screen.getByRole("button", { name: /Dortmund takibini kaldır/i }));
    await waitFor(() => expect(removeMock).toHaveBeenCalledWith("c1"));
  });

  it("ülke seçince şehirler yüklenir; Takip et → addCityFollow(city_id)", async () => {
    followsMock.mockResolvedValue([]);
    citiesMock.mockResolvedValue([{ id: "c2", name: "Münih" }]);
    renderCard();

    // 🔴 YARIŞ YOK: option YÜKLENMEDEN change atılırsa select değeri ""a düşer
    // ve şehir sorgusu hiç açılmaz — önce option'ı bekle.
    expect(await screen.findByRole("option", { name: "Almanya" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Şehir ekle/i), { target: { value: "DE" } });
    const addButton = await screen.findByTestId("city-follow-add-c2");
    fireEvent.click(addButton);

    await waitFor(() => expect(addMock).toHaveBeenCalledWith("c2"));
  });

  it("tavan doluyken ekleme bölümü ÇİZİLMEZ + tavan notu görünür", async () => {
    followsMock.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => follow(`c${i}`, `Stadt${i}`)),
    );
    renderCard();

    expect(await screen.findByText(/Takip tavanına ulaştın \(10 şehir\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Şehir ekle/i)).not.toBeInTheDocument();
  });

  it("dürüst metin: platform anahtarı KAPALI açıkça yazar — sahte aç/kapa toggle YOK", async () => {
    followsMock.mockResolvedValue([]);
    renderCard();

    expect(await screen.findByText(/doğrulama aşamasında KAPALI/i)).toBeInTheDocument();
    expect(screen.getByText(/Takip ettiğin şehir yoksa özet de gelmez/i)).toBeInTheDocument();
    // Kart içinde Switch/toggle rolü YOK (aç-kapa = takip listesinin kendisi):
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("hata durumunda mesaj görünür (sessiz yutma yok)", async () => {
    followsMock.mockResolvedValue([]);
    addMock.mockRejectedValue(new Error("En fazla 10 şehir takip edebilirsin."));
    citiesMock.mockResolvedValue([{ id: "c3", name: "Berlin" }]);
    renderCard();

    expect(await screen.findByRole("option", { name: "Almanya" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Şehir ekle/i), { target: { value: "DE" } });
    fireEvent.click(await screen.findByTestId("city-follow-add-c3"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/En fazla 10 şehir/i);
  });
});
