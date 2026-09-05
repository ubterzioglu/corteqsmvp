import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ToolResultReturnBar } from "@/components/relocation/tools/ToolResultReturnBar";
import { rememberToolResult } from "@/lib/relocation-result-return";

const RESULT_HREF = "/tools/city_match/result/abc-123";

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <ToolResultReturnBar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("ToolResultReturnBar", () => {
  it("CTA'dan gidilen sayfada sonuca dönüş bağlantısı çizer", () => {
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    renderAt("/cadde");

    const link = screen.getByRole("link", { name: /Şehir Eşleştirme sonucuna dön/i });
    expect(link).toHaveAttribute("href", RESULT_HREF);
  });

  it("iz yoksa HİÇBİR ŞEY çizmez", () => {
    const { container } = renderAt("/cadde");
    expect(container).toBeEmptyDOMElement();
  });

  it("sonuç sayfasının kendisinde çizmez", () => {
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    const { container } = renderAt(RESULT_HREF);
    expect(container).toBeEmptyDOMElement();
  });

  it("kapat düğmesi şeridi kaldırır ve izi siler", async () => {
    const user = userEvent.setup();
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    renderAt("/cadde");

    await user.click(screen.getByRole("button", { name: "Dönüş şeridini kapat" }));

    expect(screen.queryByRole("link", { name: /sonucuna dön/i })).not.toBeInTheDocument();
    // İz gerçekten silinmeli: aksi hâlde sonraki sayfada şerit geri gelirdi.
    expect(window.sessionStorage.getItem("corteqs.toolResultReturn")).toBeNull();
  });

  it("araç adı bilinmiyorsa genel metne düşer", () => {
    rememberToolResult({ href: RESULT_HREF, toolLabel: "" });
    renderAt("/cadde");
    expect(screen.getByRole("link", { name: "Test sonucuna dön" })).toBeInTheDocument();
  });
});
