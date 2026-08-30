import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RouteLoadingFallback from "@/components/RouteLoadingFallback";

describe("RouteLoadingFallback", () => {
  it("announces route loading without leaving a blank screen", () => {
    render(<RouteLoadingFallback />);

    expect(screen.getByRole("status")).toHaveTextContent("Sayfa yükleniyor");
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  });
});
