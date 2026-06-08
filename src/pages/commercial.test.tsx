import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import {
  commercialDocuments,
  publicCommercialDocuments,
} from "@/lib/commercial-documents";

const renderAtRoute = async (path: string) => {
  window.history.pushState({}, "", path);
  await act(async () => { render(<App />); });
};

describe("commercial routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the commercial index page", async () => {
    await renderAtRoute("/commercial");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: /paylaşım ve teklif görüşmeleri için/i,
        }),
      ).toBeInTheDocument()
    );

    for (const document of publicCommercialDocuments) {
      expect(screen.getByRole("link", { name: new RegExp(document.title, "i") })).toBeInTheDocument();
    }
  });

  it("hides non-public commercial documents from the commercial index", async () => {
    await renderAtRoute("/commercial");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /paylaşım ve teklif görüşmeleri için/i }),
      ).toBeInTheDocument()
    );

    for (const document of commercialDocuments.filter((item) => item.isPublic === false)) {
      expect(
        screen.queryByRole("link", { name: new RegExp(document.title, "i") }),
      ).not.toBeInTheDocument();
    }
  });

  it("links the contributor card to the standalone HTML document", async () => {
    await renderAtRoute("/commercial");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /contributor/i })).toBeInTheDocument()
    );

    expect(screen.getByRole("link", { name: /contributor/i })).toHaveAttribute(
      "href",
      "/commercial/contributor/",
    );
  });

  it("links the influencer partner card to the standalone HTML document", async () => {
    await renderAtRoute("/commercial");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /influencer partner/i })).toBeInTheDocument()
    );

    expect(screen.getByRole("link", { name: /influencer partner/i })).toHaveAttribute(
      "href",
      "/commercial/influencer-partner/",
    );
  });

  it("renders the contributor route as a standalone HTML handoff", async () => {
    await renderAtRoute("/commercial/contributor");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Contributor" })).toBeInTheDocument()
    );

    expect(screen.queryByTitle(/contributor document/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /standalone contributor dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/contributor/",
    );
  });

  it("redirects the short contributor route into the commercial flow", async () => {
    await renderAtRoute("/contributor");

    expect(window.location.pathname).toBe("/commercial/contributor");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Contributor" })).toBeInTheDocument()
    );
  });

  it("redirects the short influencer partner route into the commercial flow", async () => {
    await renderAtRoute("/influencer-partner");

    expect(window.location.pathname).toBe("/commercial/influencer-partner");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Influencer Partner" })).toBeInTheDocument()
    );
  });

  it("renders the strategic partner route as a standalone HTML handoff", async () => {
    await renderAtRoute("/commercial/strategic-partner");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Strategic Partner" })).toBeInTheDocument()
    );

    expect(
      screen.getByRole("link", { name: /standalone strategic partner dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/strategic-partner/",
    );
  });

  it("redirects the short strategic partner route into the commercial flow", async () => {
    await renderAtRoute("/strategic-partner");

    expect(window.location.pathname).toBe("/commercial/strategic-partner");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Strategic Partner" })).toBeInTheDocument()
    );
  });

  it("renders the community leader route as a standalone HTML handoff", async () => {
    await renderAtRoute("/commercial/community-leader");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Community Leader" })).toBeInTheDocument()
    );

    expect(
      screen.getByRole("link", { name: /standalone community leader dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/community-leader/",
    );
  });

  it("redirects the short community leader route into the commercial flow", async () => {
    await renderAtRoute("/community-leader");

    expect(window.location.pathname).toBe("/commercial/community-leader");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Community Leader" })).toBeInTheDocument()
    );
  });

  it("renders the ambassador route as a standalone HTML handoff", async () => {
    await renderAtRoute("/commercial/ambassador");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ambassador" })).toBeInTheDocument()
    );

    expect(
      screen.getByRole("link", { name: /standalone ambassador dokümanını aç/i }),
    ).toHaveAttribute(
      "href",
      "/commercial/ambassador/",
    );
  });

  it("redirects the short ambassador route into the commercial flow", async () => {
    await renderAtRoute("/ambassador");

    expect(window.location.pathname).toBe("/commercial/ambassador");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ambassador" })).toBeInTheDocument()
    );
  });

  it("renders not found for an unknown commercial document", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await renderAtRoute("/commercial/unknown-doc");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /bu sayfa/i })).toBeInTheDocument()
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
