import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocation } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/AddWhatsAppPage.tsx", () => ({
  default: function MockAddWA() {
    const location = useLocation();
    return <div>{`AddCOM Route ${location.pathname}${location.search}`}</div>;
  },
}));

describe("App /addcom routing", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the public /addcom route", async () => {
    window.history.pushState({}, "", "/addcom");
    await act(async () => { render(<App />); });
    expect(screen.getByText("AddCOM Route /addcom")).toBeInTheDocument();
  });

  it("redirects /addwa to /addcom", async () => {
    window.history.pushState({}, "", "/addwa");
    await act(async () => { render(<App />); });
    expect(screen.getByText("AddCOM Route /addcom")).toBeInTheDocument();
  });

  it("redirects /whatsapp-groups to /addcom", async () => {
    window.history.pushState({}, "", "/whatsapp-groups");
    await act(async () => { render(<App />); });
    expect(screen.getByText("AddCOM Route /addcom")).toBeInTheDocument();
  });

  it("redirects /whatsapp-groups/:id to /addcom?group=:id", async () => {
    window.history.pushState({}, "", "/whatsapp-groups/berlin-grubu");
    await act(async () => { render(<App />); });
    expect(screen.getByText("AddCOM Route /addcom?group=berlin-grubu")).toBeInTheDocument();
  });
});
