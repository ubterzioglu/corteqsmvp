/**
 * M08 · QuickActionsCard sözleşmesi.
 *
 * Kilitler:
 *   1. Liste TEK KAYNAK (`community-quick-actions.ts`) — bileşim/liste kayması
 *      iki yüzeyi sessizce ayrıştırır.
 *   2. ÖLÜ LİNK YOK: rotası olmayan eylem listeye giremez ("Davet et" M12,
 *      "Tavsiye iste" M20 — geldiklerinde listeye EKLENECEKLER, bu test o gün
 *      bilinçli güncellenir).
 *   3. Hedef rotalar `community-free-features.test.ts`'in kilitlediği ücretsiz
 *      rotalardır (/events/create · /addcom) — RequireFeature'sız.
 *   4. `<nav>`/`<button>` YOK — ProfilePage.test premium yolda "ilk nav boş"
 *      kilidi çalıştırıyor (readMenuLabels); kart Link grid'i olarak güvenli.
 */
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { QuickActionsCard } from "@/components/profile/QuickActionsCard";
import { COMMUNITY_QUICK_ACTIONS } from "@/lib/community-quick-actions";
import { sliceBetween } from "@/test/source-slice";

const renderCard = () =>
  render(
    <MemoryRouter>
      <QuickActionsCard />
    </MemoryRouter>,
  );

describe("QuickActionsCard · liste (M08 → M12'de BİLİNÇLİ genişletildi)", () => {
  it("dört eylem: Etkinlik oluştur + Grup ekle + Davet et + Tavsiye iste (ölü link yok)", () => {
    // M12: /liderlik eklendi → "Davet et" ölü link değil. M20: /tavsiye eklendi →
    // "Tavsiye iste" ölü link değil. Bu test M20'de BİLİNÇLİ güncellendi (4 eylem).
    expect(COMMUNITY_QUICK_ACTIONS.map((action) => action.id)).toEqual([
      "create-event",
      "add-group",
      "invite",
      "request-recommendation",
    ]);
    expect(COMMUNITY_QUICK_ACTIONS.map((action) => action.to)).toEqual([
      "/events/create",
      "/addcom",
      "/liderlik",
      "/tavsiye",
    ]);
    // M20: /tavsiye rotası VAR → "Tavsiye iste" artık ÖLÜ LINK DEĞİL.
    expect(COMMUNITY_QUICK_ACTIONS.some((action) => action.to.includes("tavsiye"))).toBe(true);
    // Her eylemin rotası App.tsx'te GERÇEKTEN kayıtlı (ölü link kilidi):
    const appSource = readFileSync("src/App.tsx", "utf8");
    for (const action of COMMUNITY_QUICK_ACTIONS) {
      expect(appSource, `rota kayıtlı olmalı: ${action.to}`).toContain(`path="${action.to}"`);
    }
  });

  it("kart dört eylemi doğru href'lerle çizer", () => {
    renderCard();

    expect(screen.getByTestId("quick-actions-card")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-create-event")).toHaveAttribute("href", "/events/create");
    expect(screen.getByTestId("quick-action-add-group")).toHaveAttribute("href", "/addcom");
    expect(screen.getByTestId("quick-action-invite")).toHaveAttribute("href", "/liderlik");
    expect(screen.getByTestId("quick-action-request-recommendation")).toHaveAttribute("href", "/tavsiye");
    expect(screen.getByText("Etkinlik oluştur")).toBeInTheDocument();
    expect(screen.getByText("Grup ekle")).toBeInTheDocument();
    expect(screen.getByText("Davet et")).toBeInTheDocument();
    expect(screen.getByText("Tavsiye iste")).toBeInTheDocument();
  });

  it("nav/button YOK — Link grid (premium nav kilidiyle çakışmaz)", () => {
    const { container } = renderCard();

    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(COMMUNITY_QUICK_ACTIONS.length);
  });
});

describe("QuickActionsCard · kablolama (kaynak sözleşmesi)", () => {
  it("sidebar overview'ın EN ÜSTÜNDE ve premium düzende hero altında", () => {
    const menu = readFileSync("src/components/profile/profile-sidebar-menu.tsx", "utf8");
    const premium = readFileSync("src/components/profile/premium/ProfilePremiumLayout.tsx", "utf8");
    const page = readFileSync("src/pages/ProfilePage.tsx", "utf8");

    // overview: quickActions hero'dan ÖNCE
    const overview = sliceBetween(menu, 'id: "overview"', 'id: "fields"', "overview bölümü");
    expect(overview.indexOf("{sections.quickActionsCard}")).toBeLessThan(
      overview.indexOf("{sections.legacyHeroCard}"),
    );
    // premium: hero sonrası, sekmelerden bağımsız
    expect(premium).toContain("{sections.quickActionsCard ?? null}");
    // ProfilePage iki düzene de geçiyor (tüm roller)
    expect(page).toContain("const quickActionsCard = <QuickActionsCard />;");
    expect(page).toContain("quickActionsCard,");
    expect(page).toContain("<ProfilePremiumLayout");
  });

  it("liste bileşende TEK kaynak — elle yazılmış ikinci etiket yok", () => {
    const component = readFileSync("src/components/profile/QuickActionsCard.tsx", "utf8");

    expect(component).toContain("COMMUNITY_QUICK_ACTIONS.map(");
    expect(component).not.toContain('"Etkinlik oluştur"');
    expect(component).not.toContain('"Grup ekle"');
  });
});
