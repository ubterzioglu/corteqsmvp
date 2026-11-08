import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { PUBLIC_WHATSAPP_COMMUNITY } from "@/lib/contact-links";

import HeroNetworkSection from "./HeroNetworkSection";

function renderHero() {
  return render(
    <MemoryRouter>
      <HeroNetworkSection />
    </MemoryRouter>,
  );
}

const hrefsIn = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll("a")).map((anchor) => anchor.getAttribute("href"));

describe("ana sayfa hero", () => {
  // L5 (2026-11-08): Lovable CORTEQS+ düzeni — üç satırlık başlık, birincil CTA,
  // dört ikincil düğme, iki kampanya kartı. Eski 5 + 4 şerit artık yalnız
  // kapanış kartında (FinalCtaSection.test.tsx kilitler).
  it("başlık üç satırdır ve tek <h1>'dir", () => {
    renderHero();

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/Gittiğin ülkede\s*organize bir ağ\s*seni bekliyor/);
    expect(headings[0].querySelectorAll("br")).toHaveLength(2);
  });

  it("birincil CTA kayıt akışına gider", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /Kaydol — Diaspora Pasaportun Çıksın/ })).toHaveAttribute(
      "href",
      "/login?mode=signup",
    );
  });

  it("dört ikincil düğmeyi sırayla çizer", () => {
    renderHero();

    const nav = screen.getByRole("navigation", { name: "Hızlı erişim" });
    expect(Array.from(nav.querySelectorAll("a")).map((anchor) => anchor.textContent?.replace("DEMO", ""))).toEqual([
      "WhatsApp",
      "Kurucu 1000",
      "Blogger Yarışması",
      "Vlogger Yarışması",
    ]);
    expect(hrefsIn(nav)).toEqual([
      PUBLIC_WHATSAPP_COMMUNITY,
      "/founding-1000",
      "/campaign/blogger",
      "/campaign/vlogger",
    ]);
  });

  it("WhatsApp bağlantısı yeni sekmede, noopener ile açılır", () => {
    renderHero();

    const link = screen.getByRole("link", { name: /WhatsApp/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("iki kampanya kartı doğru sayfalara gider", () => {
    renderHero();

    expect(screen.getByRole("link", { name: /Blog Yazısı Yarışması/ })).toHaveAttribute("href", "/campaign/blogger");
    expect(screen.getByRole("link", { name: /Şehir Elçisi Programı/ })).toHaveAttribute("href", "/city-ambassadors");
  });

  // DEMO deseni (bkz. src/lib/demo-pages.ts): yarışma sayfaları demo; onlara giden
  // her öğe rozet taşımalı, gerçek sayfalara giden taşımamalı.
  it("demo sayfalara giden öğeler DEMO rozeti taşır, diğerleri taşımaz", () => {
    renderHero();

    for (const name of [/Blogger Yarışması/, /Vlogger Yarışması/, /Blog Yazısı Yarışması/]) {
      expect(within(screen.getByRole("link", { name })).getByText("DEMO")).toBeInTheDocument();
    }
    for (const name of [/WhatsApp/, /Kurucu 1000/, /Şehir Elçisi Programı/]) {
      expect(within(screen.getByRole("link", { name })).queryByText("DEMO")).toBeNull();
    }
  });

  // Sabit "45+ Ülke / 500+ Danışman / 200+ Dernek" Lovable'ın uydurma rakamlarıdır;
  // hero'ya GERİ GİRMEMELİ. Gerçek sayaç arama bölümünde (getTotalDirectoryCount).
  it("uydurma sabit istatistik göstermez", () => {
    renderHero();
    expect(screen.queryByText(/\d+\+\s*(Ülke|Danışman|Dernek)/)).toBeNull();
  });
  // Lighthouse 2026-10-12: LCP öğesi 8 MB'lık hero videosuydu (LCP 8,8 sn).
  // Kullanıcı kararı 2026-10-12: dar ekranda ve "azaltılmış hareket" tercihinde
  // video HİÇ çizilmez, yalnız hafif poster görseli durur. Geniş ekranda video,
  // sayfa yüklendikten sonra poster'ın üstüne gelir.
  describe("hero arka planı", () => {
    const originalMatchMedia = window.matchMedia;

    const stubMatchMedia = (matches: boolean) => {
      window.matchMedia = ((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;
    };

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("poster görseli her zaman çizilir ve yüksek öncelikle yüklenir", () => {
      stubMatchMedia(false);
      const { container } = renderHero();

      const poster = container.querySelector('img[src="/landing-assets/hero-network-poster.webp"]');
      expect(poster).not.toBeNull();
      expect(poster).toHaveAttribute("fetchpriority", "high");
      expect(poster).toHaveAttribute("alt", "");
    });

    it("dar ekranda / azaltılmış harekette video ÇİZİLMEZ", () => {
      stubMatchMedia(false);
      const { container } = renderHero();

      expect(container.querySelector("video")).toBeNull();
    });

    it("geniş ekranda video poster'la birlikte çizilir", async () => {
      stubMatchMedia(true);
      const { container } = renderHero();

      await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
      const video = container.querySelector("video");
      expect(video).toHaveAttribute("src", "/landing-assets/hero-network.mp4");
      expect(video).toHaveAttribute("poster", "/landing-assets/hero-network-poster.webp");
    });
  });
});
