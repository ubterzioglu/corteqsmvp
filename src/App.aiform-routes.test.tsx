import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "@/App";

describe("App /aiform routing", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects the legacy /aiform route to /login", async () => {
    window.history.pushState({}, "", "/aiform");

    render(<App />);

    expect(await screen.findByText("CorteQS Hesabı")).toBeInTheDocument();
  });

  it("redirects the legacy /form route to /login", async () => {
    window.history.pushState({}, "", "/form");

    render(<App />);

    expect(await screen.findByText("CorteQS Hesabı")).toBeInTheDocument();
  });

  it("redirects the legacy /auth route to /login", async () => {
    window.history.pushState({}, "", "/auth");

    render(<App />);

    expect(await screen.findByText("CorteQS Hesabı")).toBeInTheDocument();
  });
});
