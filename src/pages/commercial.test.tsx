import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import {
  commercialDocuments,
  publicCommercialDocuments,
} from "@/lib/commercial-documents";

const renderAtRoute = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

describe("commercial routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the commercial index page", () => {
    renderAtRoute("/commercial");

    expect(
      screen.getByRole("heading", {
        name: /paylaşım ve teklif görüşmeleri için/i,
      }),
    ).toBeInTheDocument();

    for (const document of publicCommercialDocuments) {
      expect(screen.getByRole("link", { name: new RegExp(document.title, "i") })).toBeInTheDocument();
    }
  });

  it("hides non-public commercial documents from the commercial index", () => {
    renderAtRoute("/commercial");

    for (const document of commercialDocuments.filter((item) => item.isPublic === false)) {
      expect(
        screen.queryByRole("link", { name: new RegExp(document.title, "i") }),
      ).not.toBeInTheDocument();
    }
  });

  it("links the contributor card to the standalone HTML document", () => {
    renderAtRoute("/commercial");

    expect(screen.getByRole("link", { name: /contributor/i })).toHaveAttribute(
      "href",
      "/commercial/contributor/",
    );
  });

  it("links the influencer partner card to the standalone HTML document", () => {
    renderAtRoute("/commercial");

    expect(screen.getByRole("link", { name: /influencer partner/i })).toHaveAttribute(
      "href",
      "/commercial/influencer-partner/",
    );
  });

  it("renders the contributor route as a standalone HTML handoff", () => {
    renderAtRoute("/commercial/contributor");

    expect(screen.getByRole("heading", { name: "Contributor" })).toBeInTheDocument();
    expect(screen.queryByTitle(/contributor document/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /standalone contributor dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/contributor/",
    );
  });

  it("redirects the short contributor route into the commercial flow", () => {
    renderAtRoute("/contributor");

    expect(window.location.pathname).toBe("/commercial/contributor");
    expect(screen.getByRole("heading", { name: "Contributor" })).toBeInTheDocument();
  });

  it("redirects the short influencer partner route into the commercial flow", () => {
    renderAtRoute("/influencer-partner");

    expect(window.location.pathname).toBe("/commercial/influencer-partner");
    expect(screen.getByRole("heading", { name: "Influencer Partner" })).toBeInTheDocument();
  });

  it("renders the strategic partner route as a standalone HTML handoff", () => {
    renderAtRoute("/commercial/strategic-partner");

    expect(screen.getByRole("heading", { name: "Strategic Partner" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /standalone strategic partner dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/strategic-partner/",
    );
  });

  it("redirects the short strategic partner route into the commercial flow", () => {
    renderAtRoute("/strategic-partner");

    expect(window.location.pathname).toBe("/commercial/strategic-partner");
    expect(screen.getByRole("heading", { name: "Strategic Partner" })).toBeInTheDocument();
  });

  it("renders the community leader route as a standalone HTML handoff", () => {
    renderAtRoute("/commercial/community-leader");

    expect(screen.getByRole("heading", { name: "Community Leader" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /standalone community leader dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/community-leader/",
    );
  });

  it("redirects the short community leader route into the commercial flow", () => {
    renderAtRoute("/community-leader");

    expect(window.location.pathname).toBe("/commercial/community-leader");
    expect(screen.getByRole("heading", { name: "Community Leader" })).toBeInTheDocument();
  });

  it("renders the ambassador route as a standalone HTML handoff", () => {
    renderAtRoute("/commercial/ambassador");

    expect(screen.getByRole("heading", { name: "Ambassador" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /standalone ambassador dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/ambassador/",
    );
  });

  it("redirects the short ambassador route into the commercial flow", () => {
    renderAtRoute("/ambassador");

    expect(window.location.pathname).toBe("/commercial/ambassador");
    expect(screen.getByRole("heading", { name: "Ambassador" })).toBeInTheDocument();
  });

  it("renders not found for an unknown commercial document", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderAtRoute("/commercial/unknown-doc");

    expect(screen.getByRole("heading", { name: /bu sayfa/i })).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
