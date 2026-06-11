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

const documentHeadings: Record<string, RegExp> = {
  contributor: /Şehrindeki Türk diasporasını/i,
  "influencer-partner": /Kitleni CorteQS ağına bağla/i,
  "strategic-partner": /Stratejik iş birlikleri/i,
  "community-leader": /Şehrindeki topluluğu büyüt/i,
  ambassador: /temsil et/i,
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

  it("links the document cards to the SPA routes", async () => {
    await renderAtRoute("/commercial");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /contributor/i })).toBeInTheDocument()
    );

    for (const document of publicCommercialDocuments) {
      expect(
        screen.getByRole("link", { name: new RegExp(document.title, "i") }),
      ).toHaveAttribute("href", `/commercial/${document.slug}`);
    }
  });

  for (const document of commercialDocuments) {
    it(`renders the ${document.slug} document content on its route`, async () => {
      await renderAtRoute(`/commercial/${document.slug}`);

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: documentHeadings[document.slug], level: 1 }),
        ).toBeInTheDocument()
      );

      expect(
        screen.getByRole("link", { name: /commercial alanına dön/i }),
      ).toHaveAttribute("href", "/commercial");
    });

    it(`redirects the short /${document.slug} route into the commercial flow`, async () => {
      await renderAtRoute(`/${document.slug}`);

      expect(window.location.pathname).toBe(`/commercial/${document.slug}`);
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: documentHeadings[document.slug], level: 1 }),
        ).toBeInTheDocument()
      );
    });
  }

  it("renders not found for an unknown commercial document", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await renderAtRoute("/commercial/unknown-doc");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /bu sayfa/i })).toBeInTheDocument()
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
