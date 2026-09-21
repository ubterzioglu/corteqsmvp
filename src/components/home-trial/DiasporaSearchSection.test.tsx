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

import DiasporaSearchSection from "@/components/home-trial/DiasporaSearchSection";

const mockNavigate = vi.fn();
const mockAuth = { user: null as { id: string } | null, isLoading: false };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// CLAUDE.md uyarısı: mock yolu bileşenin GERÇEKTEN import ettiği yol olmalı.
vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => mockAuth }));

vi.mock("@/hooks/useGeo", () => ({ useGeoCountries: () => ({ data: [] }) }));

vi.mock("@/lib/catalog-directory", () => ({
  getTotalDirectoryCount: () => Promise.resolve(248),
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

    const listBlock = source.slice(
      source.indexOf("const EXAMPLE_QUERIES"),
      source.indexOf("const PLACEHOLDER_INTERVAL_MS"),
    );

    const entries = [...listBlock.matchAll(/^\s*"([^"]+)",$/gm)].map((match) => match[1]);

    expect(entries.length).toBeGreaterThanOrEqual(10);
    for (const entry of entries) {
      expect(entry).not.toMatch(/['’]/);
    }
  });
});
