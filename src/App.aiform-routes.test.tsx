import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "@/App";

vi.mock("@/pages/AIFormPage.tsx", () => ({
  default: () => <div>AI Form Route</div>,
}));

describe("App /aiform routing", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the public /aiform route", () => {
    window.history.pushState({}, "", "/aiform");

    render(<App />);

    expect(screen.getByText("AI Form Route")).toBeInTheDocument();
  });
});
