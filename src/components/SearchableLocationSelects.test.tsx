import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import SearchableCitySelect from "@/components/SearchableCitySelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";

HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("@/hooks/useGeo", () => ({
  useGeoCountries: () => ({
    data: [
      { code: "TR", name: "Türkiye" },
      { code: "DE", name: "Almanya" },
    ],
  }),
  useGeoCities: () => ({
    data: [
      { countryCode: "TR", countryName: "Türkiye", name: "Van" },
      { countryCode: "TR", countryName: "Türkiye", name: "Ankara" },
    ],
  }),
}));

const renderWithQuery = (ui: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
};

describe("Searchable location selects", () => {
  it("renders the all-countries option with geo-backed items", () => {
    renderWithQuery(
      <SearchableCountrySelect
        value="all"
        onChange={() => undefined}
        includeAllOptionLabel="Tüm Ülkeler"
        allowClear={false}
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));

    expect(screen.getAllByText("Tüm Ülkeler").length).toBeGreaterThan(0);
    expect(screen.getByText("Türkiye")).toBeInTheDocument();
    expect(screen.getByText("Almanya")).toBeInTheDocument();
  });

  it("keeps rendering an existing city value even when it is not in the fetched list", () => {
    renderWithQuery(
      <SearchableCitySelect
        value="Londra"
        onChange={() => undefined}
        countryName="Türkiye"
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Londra");
  });
});
