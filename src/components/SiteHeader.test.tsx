import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SiteHeader from "@/components/SiteHeader";

// Mock hoist edildiği için durum vi.hoisted ile taşınır; testler authState.user'ı
// değiştirerek giriş yapmış / yapmamış varyantını seçer.
const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    session: authState.user ? { user: authState.user } : null,
    isLoading: false,
    signOut: vi.fn(),
  }),
}));

const BETA_BANNER_STORAGE_KEY = "corteqs.site.beta-banner-dismissed.v1";
const BETA_BANNER_TEXT = "CorteQS açık beta yayında!";
const renderHeader = (initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SiteHeader />
    </MemoryRouter>,
  );

describe("SiteHeader", () => {
  beforeEach(() => {
    authState.user = null;
    window.localStorage.clear();
  });

  it("shows the brand header, slogan and auth links for a signed-out visitor", () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    expect(screen.getByText("CorteQS")).toBeInTheDocument();
    expect(screen.getByText("Global Türk Diaspora Network")).toBeInTheDocument();
    expect(screen.getByText("Dünyadaki Türkleri Bir Araya Getiren Platform")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giriş Yap" })).toHaveAttribute("href", "/login?mode=login");
    expect(screen.getByRole("link", { name: "Kayıt Ol" })).toHaveAttribute("href", "/login?mode=signup");
    expect(screen.queryByText("Founding 1000")).not.toBeInTheDocument();
    expect(screen.queryByText("Kurucu 1000")).not.toBeInTheDocument();
    expect(screen.queryByText("Whatsapp Topluluğu")).not.toBeInTheDocument();
    expect(screen.queryByText("Ana Sayfa")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Anketler" })).not.toBeInTheDocument();
    expect(screen.queryByText("19 Mayıs Etkinlikleri")).not.toBeInTheDocument();
  });

  // H4 (m152): girişli üyeye pazarlama sloganı gösterilmez — Cadde'de içerikten önceki
  // ~300px yığını düşürmenin ilk adımı. Slogan yalnız ziyaretçi için anlamlı.
  it("hides the marketing slogan for a signed-in member", () => {
    authState.user = { id: "user-1" };

    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    expect(
      screen.queryByText("Dünyadaki Türkleri Bir Araya Getiren Platform"),
    ).not.toBeInTheDocument();
    // Marka kimliği ve girişli nav'ı gizlemedik — yalnız pazarlama sloganı kalktı.
    expect(screen.getByText("CorteQS")).toBeInTheDocument();
    expect(screen.getByText("Global Türk Diaspora Network")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profilim" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: "Çıkış" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Giriş Yap" })).not.toBeInTheDocument();
  });

  describe("üst navigasyon renk sözleşmesi", () => {
    const expectNeutralNavigationColor = (element: HTMLElement) => {
      expect(element).toHaveClass("text-slate-700", "hover:text-slate-950");
      expect(element.className).not.toMatch(/text-\[#/);
    };

    it("ziyaretçi navigasyonundaki tüm eylemleri aynı koyu gri renkte gösterir", () => {
      renderHeader();

      ["Araçlar", "Giriş Yap", "Kayıt Ol"].forEach((name) => {
        expectNeutralNavigationColor(screen.getByRole("link", { name }));
      });
    });

    it("üye navigasyonundaki tüm eylemleri aynı koyu gri renkte gösterir", () => {
      authState.user = { id: "user-1" };
      renderHeader();

      ["Araçlar", "Geri Bildirim", "Profilim"].forEach((name) => {
        expectNeutralNavigationColor(screen.getByRole("link", { name }));
      });
      expectNeutralNavigationColor(screen.getByRole("button", { name: "Çıkış" }));
    });
  });

  // Kullanıcı kararı 2026-09-20: mobilde gezinme bağlantıları şeride sığmıyor,
  // satırları sarıp header'ı şişiriyordu. Artık tek "Menü" düğmesi ve sağdan
  // açılan çekmece var. Çekmece KAPALIYKEN içeriği DOM'a girmez — bu dosyadaki
  // diğer `getByRole("link", …)` iddiaları ancak o sayede tekil kalıyor.
  describe("mobil menü çekmecesi", () => {
    it("ziyaretçiye önce Giriş Yap sonra Kayıt Ol gösterir", () => {
      renderHeader();

      fireEvent.click(screen.getByRole("button", { name: "Menü" }));

      const drawer = screen.getByRole("navigation", { name: "Mobil gezinme" });
      const labels = Array.from(drawer.children).map((child) => child.textContent);

      expect(labels).toEqual([
        "Giriş Yap",
        "Kayıt Ol",
        "Araçlar",
        "Radar",
        "Dijital Gruplar",
        "Etkinlik Oluştur",
        "Kampanya & Yarışmalar",
        "Biz kimiz?",
      ]);
    });

    // 2026-09-25: Kampanyalar + Yarışmalar aynı hedefe giden iki ayrı bağlantıydı;
    // tek "Kampanya & Yarışmalar" öğesine indirildi. İkisi geri ayrışırsa düşer.
    it("kampanya ve yarışmaları tek öğede /campaign'e bağlar", () => {
      renderHeader();

      fireEvent.click(screen.getByRole("button", { name: "Menü" }));
      const drawer = screen.getByRole("navigation", { name: "Mobil gezinme" });
      const campaignLinks = Array.from(drawer.querySelectorAll('a[href="/campaign"]'));

      expect(campaignLinks).toHaveLength(1);
      expect(campaignLinks[0].textContent).toBe("Kampanya & Yarışmalar");
      expect(within(drawer).queryByText("Kampanyalar")).not.toBeInTheDocument();
      expect(within(drawer).queryByText("Yarışmalar")).not.toBeInTheDocument();
    });

    it("üyeye önce Profilim sonra Çıkış gösterir", () => {
      authState.user = { id: "user-1" };
      renderHeader();

      fireEvent.click(screen.getByRole("button", { name: "Menü" }));

      const drawer = screen.getByRole("navigation", { name: "Mobil gezinme" });
      const labels = Array.from(drawer.children).map((child) => child.textContent);

      expect(labels.slice(0, 2)).toEqual(["Profilim", "Çıkış"]);
      expect(labels).toContain("Geri Bildirim");
      expect(labels.filter((label) => label === "Kampanya & Yarışmalar")).toHaveLength(1);
      expect(labels).not.toContain("Kampanyalar");
      expect(labels).not.toContain("Yarışmalar");
    });

    // Çekmece ile masaüstü şeridi AYNI listeden üretilir; çekmece kapalıyken
    // ikinci bir kopya bırakmamalı.
    it("kapalıyken bağlantıları DOM'a bırakmaz", () => {
      renderHeader();

      expect(screen.queryByRole("navigation", { name: "Mobil gezinme" })).not.toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: "Giriş Yap" })).toHaveLength(1);
    });
  });

  // DEMO deseni (2026-09-20) — bkz. src/lib/demo-pages.ts ve
  // docs/guides/demo-icerik-deseni.md. Bant ROTADAN türetilir; demo sayfaların
  // kendisine kod eklenmez, bu yüzden davranış burada doğrulanır.
  describe("demo bandı", () => {
    it("demo rotasında çizilir ve sayfayı adıyla söyler", () => {
      renderHeader("/campaign/vlogger");

      expect(screen.getByText(/Demo sayfa: Vlogger Yarışması/)).toBeInTheDocument();
    });

    it("demo olmayan rotada çizilmez", () => {
      renderHeader("/campaign");

      expect(screen.queryByText(/Demo sayfa:/)).not.toBeInTheDocument();
    });

    // Beta bandı kapatılabilir, demo bandı KAPATILAMAZ — ikisi farklı iştir.
    it("beta bandı kapatılmış olsa da görünmeye devam eder", () => {
      window.localStorage.setItem(BETA_BANNER_STORAGE_KEY, "true");

      renderHeader("/campaign/blogger");

      expect(screen.queryByText(BETA_BANNER_TEXT)).not.toBeInTheDocument();
      expect(screen.getByText(/Demo sayfa: Blogger Yarışması/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Demo.*kapat/i })).not.toBeInTheDocument();
    });
  });

  // H5 (m150): beta bandı her sayfada ~40px yiyordu ve kapatılamıyordu.
  describe("beta bandı", () => {
    it("varsayılan olarak görünür ve kapatma düğmesi taşır", () => {
      renderHeader();

      expect(screen.getByText(BETA_BANNER_TEXT)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Beta duyurusunu kapat" })).toBeInTheDocument();
    });

    it("kapatınca bandı gizler ve tercihi localStorage'a yazar", () => {
      renderHeader();

      fireEvent.click(screen.getByRole("button", { name: "Beta duyurusunu kapat" }));

      expect(screen.queryByText(BETA_BANNER_TEXT)).not.toBeInTheDocument();
      expect(window.localStorage.getItem(BETA_BANNER_STORAGE_KEY)).toBe("true");
    });

    it("tercih kayıtlıysa ilk render'da hiç çizmez (flash yok)", () => {
      window.localStorage.setItem(BETA_BANNER_STORAGE_KEY, "true");

      renderHeader();

      // İLK render'da yok: lazy initializer yerine useEffect kullanılsaydı band bir kare
      // görünüp kaybolurdu ve bu iddia düşerdi.
      expect(screen.queryByText(BETA_BANNER_TEXT)).not.toBeInTheDocument();
    });

    // Fail-open sözleşmesi: depolama okunamıyorsa (gizli mod, kısıtlı depolama, bozuk
    // değer) band GÖSTERİLİR. Ters davranış sessizce duyuruyu yutardı.
    it("bozuk depolama değerinde bandı yine de gösterir", () => {
      window.localStorage.setItem(BETA_BANNER_STORAGE_KEY, "{bozuk-json");

      renderHeader();

      expect(screen.getByText(BETA_BANNER_TEXT)).toBeInTheDocument();
    });
  });
});
