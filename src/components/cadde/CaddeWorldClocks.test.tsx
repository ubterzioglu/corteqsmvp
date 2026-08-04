// Analog saat şeridi (m1) — ibre matematiği + dilim çözümü + render sözleşmesi.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import CaddeWorldClocks, { MAX_CLOCKS, clockHandAngles, timePartsInTimezone } from "@/components/cadde/CaddeWorldClocks";

describe("clockHandAngles", () => {
  it("tam saatte akrep saat×30°, yelkovan 0°", () => {
    expect(clockHandAngles(3, 0)).toEqual({ hourDeg: 90, minuteDeg: 0 });
    expect(clockHandAngles(12, 0)).toEqual({ hourDeg: 0, minuteDeg: 0 });
  });

  it("akrep dakikayla süzülür (yarımda +15°), yelkovan dakika×6°", () => {
    expect(clockHandAngles(6, 30)).toEqual({ hourDeg: 195, minuteDeg: 180 });
    expect(clockHandAngles(23, 45)).toEqual({ hourDeg: 352.5, minuteDeg: 270 });
  });
});

describe("timePartsInTimezone", () => {
  it("UTC referansından dilime doğru saat+dakika çevirir", () => {
    // 12:00 UTC = 15:00 İstanbul (+03, DST'siz sabit dilim).
    const noonUtc = new Date("2026-01-15T12:00:00Z");
    expect(timePartsInTimezone(noonUtc, "Europe/Istanbul")).toEqual({ hour: 15, minute: 0 });
    expect(timePartsInTimezone(noonUtc, "UTC")).toEqual({ hour: 12, minute: 0 });
  });

  it("dakikayı korur", () => {
    const t = new Date("2026-01-15T09:37:00Z");
    expect(timePartsInTimezone(t, "UTC").minute).toBe(37);
  });
});

describe("CaddeWorldClocks render", () => {
  it("MAX_CLOCKS kadar analog kadran çizer, İstanbul şeritte, dijital saat sr-only'de kalır", () => {
    const { container } = render(
      <CaddeWorldClocks viewerCity="Berlin" filterCity={null} cities={[]} />,
    );
    const strip = screen.getByTestId("cadde-world-clocks");
    expect(strip).toBeInTheDocument();
    expect(MAX_CLOCKS).toBe(5);
    expect(container.querySelectorAll("svg")).toHaveLength(MAX_CLOCKS);
    expect(screen.getByText("İstanbul")).toBeInTheDocument();
    // m1: gün-evresi ikonları kalktı — lucide ikonların class imzası bulunmamalı.
    expect(container.querySelector(".lucide")).toBeNull();
    // Erişilebilirlik: her kadranın yanında okunabilir dijital saat (sr-only).
    expect(container.querySelectorAll(".sr-only")).toHaveLength(MAX_CLOCKS);
  });

  it("kadran sade kalır: yalnız 4 çeyrek tik + 2 ibre (ara tikler geri gelmemeli)", () => {
    const { container } = render(
      <CaddeWorldClocks viewerCity="Berlin" filterCity={null} cities={[]} />,
    );
    const firstFace = container.querySelector("svg");
    expect(firstFace?.querySelectorAll("line")).toHaveLength(6);
  });

  it("şerit mobilde gizli, md'den itibaren görünür", () => {
    render(<CaddeWorldClocks viewerCity="Berlin" filterCity={null} cities={[]} />);
    const strip = screen.getByTestId("cadde-world-clocks");
    expect(strip.className).toContain("hidden");
    expect(strip.className).toContain("md:flex");
  });
});
