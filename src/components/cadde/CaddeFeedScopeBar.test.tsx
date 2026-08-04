// Scope bar (F7/m14+m15) — çip seti, açıklamalar ve iptal edilen kapsamların yokluğu.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CaddeFeedScopeBar from "@/components/cadde/CaddeFeedScopeBar";

const renderBar = (scope: Parameters<typeof CaddeFeedScopeBar>[0]["scope"] = "all") => {
  const onScopeChange = vi.fn();
  const onClearHashtag = vi.fn();
  render(
    <CaddeFeedScopeBar scope={scope} hashtag="" onScopeChange={onScopeChange} onClearHashtag={onClearHashtag} />,
  );
  return { onScopeChange };
};

describe("CaddeFeedScopeBar", () => {
  it("m15: Takip Ettiklerim ve İş Fırsatları çipleri kaldırıldı", () => {
    renderBar();
    expect(screen.queryByText("Takip Ettiklerim")).not.toBeInTheDocument();
    expect(screen.queryByText("İş Fırsatları")).not.toBeInTheDocument();
    // Yakınımda "Yakında" rozetiyle devre dışı durur (Faz 2, geo koordinat bekliyor).
    expect(screen.getByRole("button", { name: /Yakınımda/ })).toBeDisabled();
  });

  it("2026-08-04: Etkinlikler çipi kaldırıldı — composer etkinlik postu üretemiyor", () => {
    renderBar();
    expect(screen.queryByRole("button", { name: /Etkinlikler/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Etkinlikler")).not.toBeInTheDocument();
  });

  it("eski ?akis=events bağlantısı çökmez: açıklama satırı boş kalır, çipler seçilebilir durur", () => {
    // 'events' CaddeFeedScope tipinde ve parseCaddeFilters'ta DURUYOR (m15 deseni), bu yüzden
    // kayıtlı bir bağlantı hâlâ bu kapsamla gelebilir. Bar aktif çip göstermez ama kilitlenmez.
    const { onScopeChange } = renderBar("events");
    expect(screen.getByTestId("cadde-scope-description")).toHaveTextContent("");
    fireEvent.click(screen.getByRole("button", { name: "Tümü" }));
    expect(onScopeChange).toHaveBeenCalledWith("all");
  });

  it("m14: her çip title açıklaması taşır, aktif kapsamın açıklaması bar altında görünür", () => {
    renderBar("city");
    expect(screen.getByRole("button", { name: "Şehrim" })).toHaveAttribute(
      "title",
      "Yalnız senin şehrinden paylaşımlar.",
    );
    expect(screen.getByTestId("cadde-scope-description")).toHaveTextContent(
      "Yalnız senin şehrinden paylaşımlar.",
    );
  });

  it("çip tıklaması kapsamı değiştirir", () => {
    const { onScopeChange } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Cafelerim" }));
    expect(onScopeChange).toHaveBeenCalledWith("cafes");
  });
});
