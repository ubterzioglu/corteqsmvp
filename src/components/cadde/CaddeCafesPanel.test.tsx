// m70 + revizyon 2b9a8d04 — başlık ve kart açıklaması seçili konum filtresini söylüyor mu.
//
// Bu dosyanın ilk hâli "Berlin için açık odalar — Konum kartındaki seçimi izler."
// cümlesini kilitliyordu; o metin 2b9a8d04 kararıyla YANLIŞ davranış oldu (konum
// adı artık başlıkta duruyor, açıklama onu tekrar etmiyor). Test gevşetilmedi,
// DOĞRU davranışı kilitleyecek şekilde yeniden yazıldı.
//
// Panelin akordeon/önizleme davranışı CaddePage.test.tsx'te (cadde-cafes-toggle sözleşmesi).
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CaddeCafesPanel from "@/components/cadde/CaddeCafesPanel";
import type { CaddeCafe } from "@/lib/cadde-types";

const cafe = (overrides: Partial<CaddeCafe> = {}): CaddeCafe => ({
  id: "cafe-1",
  title: "Berlin Kahvaltı",
  summary: "",
  hostName: "Ada",
  country: "Almanya",
  city: "Berlin",
  isBridge: false,
  isFree: true,
  startsAt: "2026-08-05T10:00:00.000Z",
  endsAt: "2026-08-05T12:00:00.000Z",
  isActive: true,
  memberCount: 3,
  joinedByViewer: false,
  mode: "real",
  slug: null,
  themeKey: null,
  entryMode: "open",
  entryQuestion: null,
  capacity: null,
  archivedAt: null,
  hostUserId: null,
  viewerMemberStatus: null,
  ...overrides,
});

const renderPanel = (locationLabel: string | null, cafes: readonly CaddeCafe[] = []) =>
  render(
    <MemoryRouter>
      <CaddeCafesPanel
        cafes={cafes}
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

describe("CaddeCafesPanel — 2b9a8d04 başlık filtreyi söyler", () => {
  it("konum seçiliyken başlık ve aria-label seçilen filtreyi adıyla söyler", () => {
    renderPanel("Berlin");

    expect(screen.getByTestId("cadde-cafes-heading")).toHaveTextContent("Cafeler · Berlin");
    expect(screen.getByTestId("cadde-cafes-toggle")).toHaveAccessibleName("Cafeler · Berlin bölümünü kapat");
    // "Aktif" ikinci bir boyut ima ediyordu ("aktif olmayan cafe" diye bir şey yok).
    expect(screen.queryByText(/Aktif Cafeler/)).not.toBeInTheDocument();
  });

  it("konum seçili değilken kapsamı 'tüm konumlar' olarak adlandırır", () => {
    renderPanel(null);

    expect(screen.getByTestId("cadde-cafes-heading")).toHaveTextContent("Cafeler · tüm konumlar");
    expect(screen.getByTestId("cadde-cafes-toggle")).toHaveAccessibleName(
      "Cafeler · tüm konumlar bölümünü kapat",
    );
  });

  it("başlık kapalıyken aria-label 'aç' der", () => {
    render(
      <MemoryRouter>
        <CaddeCafesPanel
          cafes={[]}
          themeLabelByKey={new Map()}
          hasSession={false}
          locationLabel="Berlin"
          sparseContentHint="İçerik az."
          open={false}
          onOpenChange={vi.fn()}
          showAll={false}
          onShowAll={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("cadde-cafes-toggle")).toHaveAccessibleName("Cafeler · Berlin bölümünü aç");
  });

  it("kafe sayısı başlığın yanında kalır", () => {
    renderPanel("Berlin", [cafe(), cafe({ id: "cafe-2", title: "Berlin Yürüyüş" })]);

    expect(screen.getByTestId("cadde-cafes-toggle")).toHaveTextContent("Cafeler · Berlin(2)");
  });

  it("konum seçiliyken açıklama başlığı TEKRARLAMAZ, yalnız seçimin kaynağını söyler", () => {
    renderPanel("Berlin");

    expect(screen.getByText("Konum kartındaki seçimi izler.")).toBeInTheDocument();
    // Eski hâl "Berlin için açık odalar — ..." diyerek başlıktaki konumu tekrarlıyordu.
    expect(screen.queryByText(/için açık odalar/)).not.toBeInTheDocument();
  });

  it("konum seçili değilken genel açıklama kalır", () => {
    renderPanel(null);

    expect(screen.getByText("Kısa süreli topluluk odaları ve tema bazlı buluşmalar")).toBeInTheDocument();
    expect(screen.queryByText(/Konum kartındaki seçimi izler/)).not.toBeInTheDocument();
  });
});
