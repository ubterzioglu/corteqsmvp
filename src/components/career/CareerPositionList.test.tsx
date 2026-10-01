/**
 * KR05 sözleşmeleri: ilan listesi + alan filtresi + derin bağlantı.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. Derin bağlantı (`#ilan-<id>`) açılırken filtrenin temizlenmemesi — ilan
 *      seçili alanın dışında kalır, bağlantı boş bir listeye düşer ve hiçbir
 *      hata görünmez.
 *   2. Çapa biçiminin üç yerde ayrışması (kart `id`'si · liste okuyucusu ·
 *      staj bölümü).
 *   3. Arama/filtre eşleşmesinde çıplak `toLowerCase()` — Türkçe'de `İ → i̇`
 *      üretir ve eşleşmeyi sessizce bozar.
 */
import { readFileSync } from "node:fs";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { positionAnchorId } from "@/components/career/career-anchors";
import CareerPositionList from "@/components/career/CareerPositionList";
import { CAREER_AREAS, CAREER_INTERNSHIP, CAREER_JOBS } from "@/lib/careers/careers-data";

const listSource = () => readFileSync("src/components/career/CareerPositionList.tsx", "utf8");

describe("kariyer ilan listesi", () => {
  it("17 ilanın hepsini ve her alan için bir çip çizer", () => {
    render(<CareerPositionList onApply={vi.fn()} />);

    for (const job of CAREER_JOBS) {
      expect(screen.getByText(job.tr)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Tümü" })).toBeInTheDocument();
    for (const area of CAREER_AREAS) {
      expect(screen.getByRole("button", { name: area.label })).toBeInTheDocument();
    }
  });

  it("alan çipi yalnız o alanın ilanlarını bırakır", () => {
    render(<CareerPositionList onApply={vi.fn()} />);
    const tech = CAREER_AREAS.find((area) => area.id === "tech")!;

    fireEvent.click(screen.getByRole("button", { name: tech.label }));

    const techJobs = CAREER_JOBS.filter((job) => job.area === "tech");
    const otherJob = CAREER_JOBS.find((job) => job.area !== "tech")!;

    expect(techJobs.length).toBeGreaterThan(0);
    for (const job of techJobs) expect(screen.getByText(job.tr)).toBeInTheDocument();
    expect(screen.queryByText(otherJob.tr)).not.toBeInTheDocument();
  });

  it("başvur düğmesi ilan kimliğini yukarı taşır", () => {
    const onApply = vi.fn();
    render(<CareerPositionList onApply={onApply} />);
    const job = CAREER_JOBS[0];

    fireEvent.click(screen.getByText(job.tr));
    const panel = screen.getByText(job.intro).closest("div")!;
    fireEvent.click(within(panel.parentElement ?? panel).getByRole("button", { name: "Bu pozisyona başvur" }));

    expect(onApply).toHaveBeenCalledWith(job.id);
  });

  it("derin bağlantı filtreyi TEMİZLER ve ilanı açar", () => {
    const job = CAREER_JOBS.find((item) => item.area === "tech")!;
    window.location.hash = `#${positionAnchorId(job.id)}`;

    render(<CareerPositionList onApply={vi.fn()} />);

    // Filtre "Tümü"de kalmalı: ilan hangi alanda olursa olsun görünür.
    expect(screen.getByRole("button", { name: "Tümü" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(job.intro)).toBeInTheDocument();

    window.location.hash = "";
  });

  it("sayfadayken gelen derin bağlantı da çalışır ve filtreyi temizler", () => {
    // ⚠️ Bu testin ilk hâli mount-only idi ve mutasyonu KAÇIRDI: mount anında
    // filtre zaten "Tümü" olduğu için `setFilter(ALL)` satırı silinse bile hiçbir
    // şey düşmüyordu. Gerçek senaryo bu: kullanıcı bir alana filtreliyor, sonra
    // başka bir alandaki ilanın bağlantısına tıklıyor.
    const target = CAREER_JOBS.find((job) => job.area === "tech")!;
    const other = CAREER_AREAS.find((area) => area.id === "mkt")!;

    render(<CareerPositionList onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: other.label }));
    expect(screen.queryByText(target.tr)).not.toBeInTheDocument();

    window.location.hash = `#${positionAnchorId(target.id)}`;
    fireEvent(window, new HashChangeEvent("hashchange"));

    expect(screen.getByRole("button", { name: "Tümü" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(target.intro)).toBeInTheDocument();

    window.location.hash = "";
  });

  it("bilinmeyen çapa listeyi bozmaz", () => {
    window.location.hash = "#ilan-olmayan-bir-ilan";

    render(<CareerPositionList onApply={vi.fn()} />);

    expect(screen.getByText(CAREER_JOBS[0].tr)).toBeInTheDocument();
    window.location.hash = "";
  });

  it("çapa biçimi tek kaynaktan gelir", () => {
    expect(positionAnchorId("coo")).toBe("ilan-coo");
    // Staj bölümü de aynı biçimi kullanır (`ilan-intern`).
    expect(positionAnchorId(CAREER_INTERNSHIP.id)).toBe(`ilan-${CAREER_INTERNSHIP.id}`);
  });

  it("eşleşmede çıplak `toLowerCase()` kullanılmaz", () => {
    // Türkçe'de `"İstanbul".toLowerCase()` sade "istanbul" ile eşleşmez.
    // İleride arama eklenirse `trIncludes` kullanılmalı.
    const source = listSource();

    expect(source).not.toMatch(/\.toLowerCase\(\)/);
    expect(source).not.toMatch(/\.toUpperCase\(\)/);
  });
});
