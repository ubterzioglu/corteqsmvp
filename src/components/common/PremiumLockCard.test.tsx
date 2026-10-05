/**
 * A3 · PremiumLockCard testleri.
 * Kilitler: kilitli yüzey çizilir · CTA /pricing'e yönlendirir ·
 * fiyat/₺/telefon UYDURULMAZ (ProLockedInboxCard ile aynı yasak).
 */
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PremiumLockCard } from "./PremiumLockCard";

const renderCard = (props: Partial<React.ComponentProps<typeof PremiumLockCard>> = {}) => {
  return render(
    <BrowserRouter>
      <PremiumLockCard
        title="CV görüntüleme Premium'da"
        description="Bu özelliği kullanmak için Premium'a geçin."
        {...props}
      />
    </BrowserRouter>
  );
};

describe("PremiumLockCard", () => {
  it("kilitli yüzey çizilir: başlık + açıklama + CTA", () => {
    renderCard();

    expect(screen.getByTestId("premium-lock-card")).toBeInTheDocument();
    expect(screen.getByText("CV görüntüleme Premium'da")).toBeInTheDocument();
    expect(screen.getByText("Bu özelliği kullanmak için Premium'a geçin.")).toBeInTheDocument();
    expect(screen.getByTestId("premium-lock-card-cta")).toBeInTheDocument();
    expect(screen.getByText("Premium'a geç")).toBeInTheDocument();
  });

  it("CTA /pricing'e yönlendirir", () => {
    renderCard();

    const cta = screen.getByTestId("premium-lock-card-cta");
    // Button asChild + Link: Link'in <a> etiketi CTA içinde render edilir
    const link = cta.closest("a") || cta.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("özel başlık ve CTA metni desteklenir", () => {
    renderCard({
      title: "İş ilanı görüntüleme kilitli",
      description: "Daha fazla ilan görmek için Premium'a geçin.",
      ctaLabel: "Hemen yükselt",
    });

    expect(screen.getByText("İş ilanı görüntüleme kilitli")).toBeInTheDocument();
    expect(screen.getByText("Daha fazla ilan görmek için Premium'a geçin.")).toBeInTheDocument();
    expect(screen.getByText("Hemen yükselt")).toBeInTheDocument();
  });

  it("fiyat/ödeme UI'ı UYDURULMAZ (Stripe PARK) + iletişim çizilmez", () => {
    renderCard();

    const card = screen.getByTestId("premium-lock-card");
    const text = card.textContent ?? "";
    expect(text).not.toMatch(/₺|\$\d|EUR \d|\d+ TL|stripe|satın al|fiyat/i);
    expect(text).not.toContain("@");
    expect(text).not.toMatch(/\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/);
  });

  it("data-testid özelleştirilebilir", () => {
    renderCard({ testId: "cv-lock-card" });

    expect(screen.getByTestId("cv-lock-card")).toBeInTheDocument();
    expect(screen.getByTestId("cv-lock-card-cta")).toBeInTheDocument();
  });
});
