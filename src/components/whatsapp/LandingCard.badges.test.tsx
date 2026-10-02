/**
 * G19 · kart rozet/skor render sözleşmesi.
 *
 * Politika §6: rozetler sahiplik + "Yeni" + "Onaylı Grup"; "Skor hesaplanana
 * kadar kartta skor alanı gösterilmez" — "Skor bekleniyor" placeholder'ı
 * hiçbir durumda render EDİLEMEZ. Skor ölçeği 0-100 (politika §7), "/ 10" dili
 * kalktı.
 */
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingApprovalBadges } from "@/components/whatsapp/LandingApprovalBadges";
import { LandingCard } from "@/components/whatsapp/LandingCard";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const landing = (overrides: Partial<WhatsAppLanding> = {}): WhatsAppLanding =>
  ({
    id: "berlin-grup",
    groupName: "Berlin Grubu",
    category: "hobi",
    country: "Almanya",
    city: "Berlin",
    mode: "text",
    tagline: "",
    callToActionText: "",
    conditions: "",
    whatsappLink: "",
    createdAt: "2026-06-01T00:00:00Z",
    ...overrides,
  }) as WhatsAppLanding;

const renderCard = (props: Partial<WhatsAppLanding> = {}) =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <LandingCard landing={landing(props)} />
      </TooltipProvider>
    </MemoryRouter>,
  );

describe("LandingApprovalBadges · politika §6 rozet dili", () => {
  it("unclaimed → yalnız 'Üye önerisi' (eski rozetler yok)", () => {
    render(<TooltipProvider><LandingApprovalBadges landing={landing({ ownership: "unclaimed" })} /></TooltipProvider>);

    expect(screen.getByText("Üye önerisi")).toBeInTheDocument();
    expect(screen.queryByText("Sahibi doğruladı")).not.toBeInTheDocument();
    expect(screen.queryByText(/Admin onaylı!/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Üye onaylı!/)).not.toBeInTheDocument();
  });

  it("verified → 'Sahibi doğruladı'", () => {
    render(<TooltipProvider><LandingApprovalBadges landing={landing({ ownership: "verified" })} /></TooltipProvider>);

    expect(screen.getByText("Sahibi doğruladı")).toBeInTheDocument();
    expect(screen.queryByText("Üye önerisi")).not.toBeInTheDocument();
  });

  it("claim_pending → 'Üye önerisi' (henüz kanıtlanmadı)", () => {
    render(<TooltipProvider><LandingApprovalBadges landing={landing({ ownership: "claim_pending" })} /></TooltipProvider>);

    expect(screen.getByText("Üye önerisi")).toBeInTheDocument();
  });

  it("isNew → 'Yeni' etiketi sahiplik rozetine EKLENİR", () => {
    render(<TooltipProvider><LandingApprovalBadges landing={landing({ ownership: "verified", isNew: true })} /></TooltipProvider>);

    expect(screen.getByText("Sahibi doğruladı")).toBeInTheDocument();
    expect(screen.getByText("Yeni")).toBeInTheDocument();
  });

  it("hasApprovedBadge → 'Onaylı Grup' rozeti (skor eşiği istemcide DEĞİL, sunucu bayrağı)", () => {
    render(
      <TooltipProvider>
        <LandingApprovalBadges
          landing={landing({ ownership: "verified", hasApprovedBadge: true, groupScore: 85 })}
        />
      </TooltipProvider>,
    );

    expect(screen.getByText("Onaylı Grup")).toBeInTheDocument();
  });

  it("bayrak yoksa 'Onaylı Grup'/'Yeni' render edilmez (skor yüksek olsa bile)", () => {
    // Skor 90 ama rozet bayrağı false → istemci eşik UYGULAMAZ (histerezis sunucuda).
    render(<TooltipProvider><LandingApprovalBadges landing={landing({ groupScore: 90 })} /></TooltipProvider>);

    expect(screen.queryByText("Onaylı Grup")).not.toBeInTheDocument();
    expect(screen.queryByText("Yeni")).not.toBeInTheDocument();
  });
});

describe("LandingCard · skor alanı (politika §6/§7)", () => {
  it("skor null → skor alanı YOK, 'Skor bekleniyor' HİÇ render edilmez", () => {
    renderCard({ groupScore: undefined });

    expect(screen.queryByText(/Skor bekleniyor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Grup Sağlık Skoru/)).not.toBeInTheDocument();
  });

  it("skor varsa 0-100 ölçeğiyle gösterilir ('/ 10' dili kalktı)", () => {
    renderCard({ groupScore: 84 });

    expect(screen.getByText("Grup Sağlık Skoru")).toBeInTheDocument();
    expect(screen.getByText("84 / 100")).toBeInTheDocument();
    expect(screen.queryByText(/8\.4 \/ 10/)).not.toBeInTheDocument();
  });

  it("ondalıklı skor formatı korunur", () => {
    renderCard({ groupScore: 67.5 });

    expect(screen.getByText("67.5 / 100")).toBeInTheDocument();
  });

  it("kart sahiplik rozetini çizer", () => {
    renderCard({ ownership: "verified" });

    expect(screen.getByText("Sahibi doğruladı")).toBeInTheDocument();
  });
});
