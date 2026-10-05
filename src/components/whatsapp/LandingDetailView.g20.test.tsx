/**
 * G20 kabulü — S3 detay sayfası.
 *
 * KABUL (plan G20 / tasarım #5): "Anonim ziyaretçide link hiçbir yerde (sayfa
 * kaynak dahil) görünmüyor." G03b bunu veri katmanında kapattı (view null +
 * RPC tek kapı); bu test SON kullanıcı yüzeyini kilitler: render edilen DOM'da
 * davet linki izi olamaz. Ek kilitler: boş "Grup koşulları" gizlenir (plan G20)
 * ve "Şikayet et" (G14) yalnız reportSlot yuvasından çizilir.
 */
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingDetailView, type LandingInviteState } from "@/components/whatsapp/LandingDetailView";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const landing = (overrides: Partial<WhatsAppLanding> = {}) =>
  ({
    id: "berlin-yazilimcilar",
    dbId: "11111111-1111-1111-1111-111111111111",
    groupName: "Berlin Yazılımcıları",
    platform: "WhatsApp",
    category: "is",
    country: "Almanya",
    city: "Berlin",
    mode: "text",
    tagline: "",
    callToActionText: "Katıl",
    // ⚠️ View bu alanı anon'a NULL döner — test verisi de boş.
    whatsappLink: "",
    status: "approved",
    ownership: "unclaimed",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  }) as unknown as WhatsAppLanding;

const renderDetail = (invite: LandingInviteState, props: Partial<WhatsAppLanding> = {}) =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <LandingDetailView
          loading={false}
          landing={landing(props)}
          canEdit={false}
          copied={false}
          invite={invite}
          onBackToList={vi.fn()}
          onShare={vi.fn()}
          onRequestSignIn={vi.fn()}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );

describe("G20 kabul · anonim ziyaretçide link hiçbir yerde yok", () => {
  it("signed_out detayının DOM kaynağında davet linki izi YOK", () => {
    const { container } = renderDetail({ kind: "signed_out" });

    const html = container.innerHTML;
    expect(html).not.toContain("chat.whatsapp.com");
    expect(html).not.toContain("t.me/");
    expect(html).not.toContain("discord.gg");
    // Girişsiz dış bağlantı (href) yalnız site içi olabilir:
    for (const anchor of Array.from(container.querySelectorAll("a[href^='http']"))) {
      expect(anchor.getAttribute("href")).not.toMatch(/whatsapp|telegram|discord/i);
    }
    // Katılma eylemi GÖRÜNÜR kalır (G03b kilidiyle aynı ruh)
    expect(screen.getByRole("button", { name: /Giriş yap ve katıl/i })).toBeInTheDocument();
  });

  it("link alınamayan grupta da kaynak temiz + sebep yazılı", () => {
    const { container } = renderDetail({ kind: "unavailable", message: "Bu grubun davet linki henüz eklenmemiş." });

    expect(container.innerHTML).not.toContain("chat.whatsapp.com");
    expect(screen.getByRole("status")).toHaveTextContent("Bu grubun davet linki henüz eklenmemiş.");
  });

  it("link hazırken (girişli) dış bağlantı RPC'den gelen URL'dir — DOM'a satırdan link SIZMAZ", () => {
    // 'ready' durumu yalnız girişli kullanıcıda oluşur (RPC). View satırında
    // whatsappLink boş kalmaya devam eder; render edilen href RPC sonucudur.
    const { container } = renderDetail({ kind: "ready", url: "https://chat.whatsapp.com/RPCTEN" });

    const join = screen.getByRole("link", { name: /katıl|whatsapp/i });
    expect(join).toHaveAttribute("href", "https://chat.whatsapp.com/RPCTEN");
    expect(container.querySelectorAll("a[href*='chat.whatsapp.com']")).toHaveLength(1);
  });
});

describe("G20 · plan kapsamı kilitleri", () => {
  it("boş 'Grup koşulları' bölümü GİZLENİR", () => {
    renderDetail({ kind: "signed_out" }, { conditions: "" });

    expect(screen.queryByText("Grup koşulları")).not.toBeInTheDocument();
  });

  it("dolu koşullar akordeonda görünür", () => {
    renderDetail({ kind: "signed_out" }, { conditions: "Reklam yasak\nSaygı zorunlu" });

    expect(screen.getByText("Grup koşulları")).toBeInTheDocument();
  });

  it("G14: reportSlot verilince 'Şikayet et' bölümü ÇİZİLİR; verilmezse çizilmez", () => {
    const { unmount } = renderDetail({ kind: "signed_out" });
    expect(screen.queryByText(/Şikayet/i)).not.toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <TooltipProvider>
          <LandingDetailView
            loading={false}
            landing={landing()}
            canEdit={false}
            copied={false}
            invite={{ kind: "signed_out" }}
            onBackToList={vi.fn()}
            onShare={vi.fn()}
            onRequestSignIn={vi.fn()}
            reportSlot={<button type="button">Şikayet et</button>}
          />
        </TooltipProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Şikayet et" })).toBeInTheDocument();
  });

  it("ownershipClaim yuvası verilen bileşeni çizer", () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <LandingDetailView
            loading={false}
            landing={landing()}
            canEdit={false}
            copied={false}
            invite={{ kind: "signed_out" }}
            onBackToList={vi.fn()}
            onShare={vi.fn()}
            onRequestSignIn={vi.fn()}
            ownershipClaim={<div>G20-sahiplik-yuvasi</div>}
          />
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("G20-sahiplik-yuvasi")).toBeInTheDocument();
  });
});
