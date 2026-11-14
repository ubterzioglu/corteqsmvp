/**
 * Ana sayfa (`/` → LandingTrialPage) arama hero'sunun sözleşme testi.
 *
 * Bu testler 2026-09-20'de ölçülen üç sessiz kusuru kilitler:
 *
 * 1. Bileşen ziyaretçiyi kontrolsüzce `/directory`'ye yolluyordu. `DirectoryPage`
 *    giriş yapmamış kullanıcıda sorguyu HİÇ atmaz, RPC de anonim çağrıda
 *    `42501` fırlatır — kullanıcı yazdığı kelimeyi kaybedip boş sayfa görüyordu.
 *    ⚠️ Bu madde 2026-09-21'de KÖKTEN kapandı: RPC artık anonim çağrılabilir
 *    (migration `20260921090000`), dizin ziyaretçiye açık. Araya konan
 *    `/login?next=` yönlendirmesi de KALDIRILDI — o bir çözüm değil, aynı kök
 *    nedenin ikinci belirtisiydi (arama yapmak isteyen herkes giriş duvarına
 *    çarpıyordu). Aşağıdaki testler artık DOĞRUDAN yönlendirmeyi kilitler.
 * 2. Placeholder ve çip örnekleri ek'li/apostroflu yazılmıştı ("Berlin'de
 *    yazılımcı"). Arama RPC'si kelimeleri boşluktan bölüp HEPSİNİN eşleşmesini
 *    şart koştuğu için bu örnekler GARANTİLİ sıfır sonuç veriyordu.
 * 3. Sayaç `catalog_items`'ı filtresiz sayıyordu ("645+ kayıtlı profil"), oysa
 *    dizinde en fazla 248 kayıt görünüyor.
 *
 * Testi gevşetme — bu üç kusur da build/test patlatmadan canlıya çıkmıştı.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sliceBetween } from "@/test/source-slice";

import DiasporaSearchSection from "@/components/home-trial/DiasporaSearchSection";

const { mockNavigate, mockTotalCount } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockTotalCount: vi.fn<() => Promise<number>>(),
}));
const mockAuth = { user: null as { id: string } | null, isLoading: false };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// CLAUDE.md uyarısı: mock yolu bileşenin GERÇEKTEN import ettiği yol olmalı.
vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => mockAuth }));

vi.mock("@/lib/catalog/catalog-directory", () => ({
  getTotalDirectoryCount: () => mockTotalCount(),
}));

const renderSection = () =>
  render(
    <MemoryRouter>
      <DiasporaSearchSection />
    </MemoryRouter>,
  );

const submitSearch = (value: string) => {
  fireEvent.change(screen.getByLabelText("Diasporada ara"), { target: { value } });
  fireEvent.submit(screen.getByRole("search"));
};

describe("DiasporaSearchSection", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockTotalCount.mockReset();
    mockTotalCount.mockResolvedValue(248);
    mockAuth.user = null;
    mockAuth.isLoading = false;
  });

  it("ziyaretçiyi DOĞRUDAN dizine gönderir — giriş duvarı yok", async () => {
    renderSection();
    submitSearch("Doktor");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/directory?q=Doktor");
    });
    // Regresyon çapası: `/login?next=` geri gelirse ziyaretçi yine duvara çarpar.
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  it("giriş yapmış kullanıcıyı da aynı adrese gönderir", async () => {
    mockAuth.user = { id: "u1" };
    renderSection();
    submitSearch("Doktor");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/directory?q=Doktor");
    });
  });

  it("çip tıklaması ziyaretçi için de doğrudan dizine gider", async () => {
    renderSection();
    fireEvent.click(screen.getByRole("button", { name: "Doktor" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/directory?q=Doktor");
    });
  });

  it("ziyaretçiye aramanın AÇIK olduğunu, girişin ne kazandırdığını söyler", () => {
    renderSection();
    expect(screen.getByText(/Arama herkese açık/)).toBeInTheDocument();
  });

  it("giriş yapmış kullanıcıya bu daveti göstermez", () => {
    mockAuth.user = { id: "u1" };
    renderSection();
    expect(screen.queryByText(/Arama herkese açık/)).toBeNull();
  });

  // L5: "Ara" yazısı mobilde de görünür olmalı (eskiden `hidden sm:inline` idi).
  it("Ara düğmesinin metni her ekranda görünür", () => {
    renderSection();

    const button = screen.getByRole("button", { name: "Ara" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button.querySelector(".hidden")).toBeNull();
    expect(button).toHaveTextContent("Ara");
  });

  // Sabit "80+ kategori" / "7/24" kaldırıldı; şerit yalnız gerçek sayaçlardan beslenir.
  it("sabit istatistik göstermez", async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByText("248+")).toBeInTheDocument();
    });
    expect(screen.queryByText("80+")).toBeNull();
    expect(screen.queryByText("7/24")).toBeNull();
  });

  // Katalog boyutu (251 `geo_countries`) "ülke" diye gösterilmemeli: ağın ulaştığı
  // ülke sayısı değil. Dizin kayıtlarından ayrık ülke sayısı veren RPC gelene dek yok.
  it("katalog boyutunu 'ülke' sayacı olarak göstermez", async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByText("248+")).toBeInTheDocument();
    });
    expect(screen.queryByText("ülke")).toBeNull();
  });

  it("sayaç hata/0 dönerse şerit tamamen kaybolur", async () => {
    mockTotalCount.mockResolvedValue(0);
    const { container } = renderSection();

    await waitFor(() => {
      expect(container.querySelector("ul")).toBeNull();
    });
    expect(screen.queryByText("dizinde görünen kayıt")).toBeNull();
  });

  it("sayaç yüklenirken şerit YER TUTAR (CLS yok) ama görünmez", () => {
    mockTotalCount.mockReturnValue(new Promise<number>(() => {}));
    const { container } = renderSection();

    const strip = container.querySelector("ul");
    expect(strip).not.toBeNull();
    expect(strip).toHaveClass("invisible");
    expect(strip?.className).toContain("min-h-");
    expect(strip).toHaveAttribute("aria-hidden", "true");
  });

  it("Ara düğmesi AA kontrastlı zemin kullanır (#00838F)", () => {
    renderSection();
    expect(screen.getByRole("button", { name: "Ara" }).className).toContain("bg-[#00838F]");
  });

  it("sayaç etiketi dizinde görünen kayıt sayısını anlatır", async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByText("dizinde görünen kayıt")).toBeInTheDocument();
    });
    expect(screen.getByText("248+")).toBeInTheDocument();
  });
});

describe("DiasporaSearchSection arama örnekleri", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockTotalCount.mockResolvedValue(248);
    mockAuth.user = { id: "u1" };
    mockAuth.isLoading = false;
  });

  /**
   * Kaynak metni denetler: örnek listelerine apostrof/ek girerse arama RPC'sinin
   * AND semantiği yüzünden sonuç sıfırlanır. Bu, çalışma zamanında hiçbir hata
   * vermez — bu yüzden metinden yakalıyoruz.
   */
  it("örnek ve çip listelerinde apostroflu/ekli ifade bulunmaz", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("src/components/home-trial/DiasporaSearchSection.tsx", "utf8"),
    );

    const listBlock = sliceBetween(source, "const EXAMPLE_QUERIES", "const PLACEHOLDER_INTERVAL_MS");

    // Satır düzeninden bağımsız: biçimlendirici kısa diziyi tek satıra indirebilir.
    const entries = [...listBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    expect(entries.length).toBeGreaterThanOrEqual(10);
    for (const entry of entries) {
      expect(entry).not.toMatch(/['’]/);
    }
  });
});
