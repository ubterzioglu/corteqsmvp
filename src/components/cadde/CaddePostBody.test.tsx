import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CaddePostBody from "@/components/cadde/CaddePostBody";
import type { CaddePostMention } from "@/lib/cadde-types";

const renderBody = (body: string, mentions: CaddePostMention[] = []) =>
  render(
    <MemoryRouter>
      <CaddePostBody body={body} mentions={mentions} />
    </MemoryRouter>,
  );

describe("CaddePostBody", () => {
  it("links hashtags to the normalized feed filter", () => {
    renderBody("Bugün #İstanbul çok güzel");

    const link = screen.getByRole("link", { name: "#İstanbul" });
    // Görünen metin özgün yazımı korur, hedef normalize anahtarı kullanır.
    expect(link).toHaveAttribute("href", "/cadde?etiket=istanbul");
  });

  it("links a cafe mention to the cafe page via its display label", () => {
    renderBody("Selam @Berlin IT Sohbeti nasıl gidiyor", [
      { type: "cafe", id: "cafe-1", label: "Berlin IT Sohbeti" },
    ]);

    expect(screen.getByRole("link", { name: "@Berlin" })).toHaveAttribute("href", "/cadde/cafe/cafe-1");
  });

  it("renders an unresolvable mention as highlighted text, not a link", () => {
    renderBody("Selam @silinmis kullanıcı", []);

    expect(screen.queryByRole("link", { name: "@silinmis" })).not.toBeInTheDocument();
    expect(screen.getByText("@silinmis")).toBeInTheDocument();
  });

  it("does not render anything for a media-only post with an empty body", () => {
    const { container } = renderBody("");
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps plain text intact", () => {
    renderBody("sade bir paylaşım");
    expect(screen.getByTestId("cadde-post-body")).toHaveTextContent("sade bir paylaşım");
  });

  // m60 — bağlantılar hiçbir Cadde yüzeyinde tıklanabilir değildi.
  describe("bağlantı linkleştirme (m60)", () => {
    it("http(s) adresini yeni sekmede açılan güvenli bir bağlantıya çevirir", () => {
      renderBody("Detaylar https://corteqs.net/cadde adresinde");

      const link = screen.getByRole("link", { name: "https://corteqs.net/cadde" });
      expect(link).toHaveAttribute("href", "https://corteqs.net/cadde");
      expect(link).toHaveAttribute("target", "_blank");
      // Sekme ele geçirme (tabnabbing) koruması.
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });

    it("adresin sonundaki noktalamayı bağlantıya dahil etmez", () => {
      renderBody("Bak: https://corteqs.net/cadde.");

      expect(screen.getByRole("link", { name: "https://corteqs.net/cadde" })).toBeInTheDocument();
      expect(screen.getByTestId("cadde-post-body")).toHaveTextContent("Bak: https://corteqs.net/cadde.");
    });

    it("javascript: gibi şemaları linkleştirmez", () => {
      renderBody("javascript:alert(1) yazsam ne olur");

      expect(screen.queryAllByRole("link")).toHaveLength(0);
    });

    it("aynı gövdede hashtag, mention ve bağlantı birlikte çalışır", () => {
      renderBody("#berlin için https://corteqs.net rehberi");

      expect(screen.getByRole("link", { name: "#berlin" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "https://corteqs.net" })).toBeInTheDocument();
    });
  });
});
