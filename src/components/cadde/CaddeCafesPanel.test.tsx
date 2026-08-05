// m70 — kafe listesinin ortak "Konum" filtresini izlediği başlık altında görünür mü.
// Panelin akordeon/önizleme davranışı CaddePage.test.tsx'te (cadde-cafes-toggle sözleşmesi).
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CaddeCafesPanel from "@/components/cadde/CaddeCafesPanel";

const renderPanel = (locationLabel: string | null) =>
  render(
    <MemoryRouter>
      <CaddeCafesPanel
        cafes={[]}
        themeLabelByKey={new Map()}
        hasSession={false}
        locationLabel={locationLabel}
        sparseContentHint="İçerik az."
        open
        onOpenChange={vi.fn()}
        showAll={false}
        onShowAll={vi.fn()}
      />
    </MemoryRouter>,
  );

describe("CaddeCafesPanel — m70 konum bağı", () => {
  it("konum seçiliyken listenin Konum kartını izlediğini söyler", () => {
    renderPanel("Berlin");
    expect(screen.getByText(/Berlin için açık odalar/)).toBeInTheDocument();
    expect(screen.getByText(/Konum kartındaki seçimi izler/)).toBeInTheDocument();
  });

  it("konum seçili değilken genel açıklama kalır", () => {
    renderPanel(null);
    expect(screen.getByText("Kısa süreli topluluk odaları ve tema bazlı buluşmalar")).toBeInTheDocument();
    expect(screen.queryByText(/Konum kartındaki seçimi izler/)).not.toBeInTheDocument();
  });
});
