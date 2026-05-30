import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import May19MapPage from "@/pages/May19MapPage";

vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children }: { children: React.ReactNode }) => <svg data-testid="map-shell">{children}</svg>,
  Geographies: ({ children }: { children: (arg: { geographies: Array<{ rsmKey: string; id: string; properties: { name: string } }> }) => React.ReactNode }) =>
    <g>{children({ geographies: [{ rsmKey: "geo-1", id: "geo-1", properties: { name: "Geo" } }] })}</g>,
  Geography: () => <path data-testid="geography" />,
  Graticule: () => <path />,
  Line: () => <path />,
  Marker: ({ children }: { children: React.ReactNode }) => <g>{children}</g>,
  Sphere: () => <circle />,
}));

describe("May19MapPage", () => {
  it("renders without backend data and links back to the campaign", () => {
    render(
      <MemoryRouter>
        <May19MapPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Global Diaspora Haritası/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ana Kampanyaya Dön/i })).toHaveAttribute("href", "/19051919");
    expect(screen.getByTestId("map-shell")).toBeInTheDocument();
  });
});
