import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("renders the public /addcom route", () => {
    window.history.pushState({}, "", "/addcom");

    render(<App />);

    expect(screen.getByText("AddCOM Route /addcom")).toBeInTheDocument();
  });

  it("redirects /addwa to /addcom", () => {
    window.history.pushState({}, "", "/addwa");

    render(<App />);

    expect(screen.getByText("AddCOM Route /addcom")).toBeInTheDocument();
  });

  it("redirects /whatsapp-groups to /addcom", () => {
    window.history.pushState({}, "", "/whatsapp-groups");

    render(<App />);

    expect(screen.getByText("AddCOM Route /addcom")).toBeInTheDocument();
  });

  it("redirects /whatsapp-groups/:id to /addcom?group=:id", () => {
    window.history.pushState({}, "", "/whatsapp-groups/berlin-grubu");

    render(<App />);

    expect(screen.getByText("AddCOM Route /addcom?group=berlin-grubu")).toBeInTheDocument();
  });
});
