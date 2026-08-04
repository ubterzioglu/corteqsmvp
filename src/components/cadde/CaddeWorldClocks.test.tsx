// Analog saat şeridi (m1) — ibre matematiği + dilim çözümü + render sözleşmesi.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import CaddeWorldClocks, {
  MAX_CLOCKS,
  clockHandAngles,
  resolveViewerLabel,
  timePartsInTimezone,
} from "@/components/cadde/CaddeWorldClocks";

describe("resolveViewerLabel", () => {
  const cities = new Map([
    ["Antalya", "Europe/Istanbul"],
    ["Berlin", "Europe/Berlin"],
  ]);

  it("profil şehrinin dilimi tarayıcıyla örtüşüyorsa şehir adını korur", () => {
    expect(resolveViewerLabel("Antalya", "Europe/Istanbul", cities)).toBe("Antalya");
  });

  it("örtüşmüyorsa dilimden türetir — Antalya profili + Almanya tarayıcısı 'Berlin' yazar", () => {
    // Kadran her zaman tarayıcı dilimini çiziyor; etiket profil şehrinde kalırsa saat yalan söyler.
    expect(resolveViewerLabel("Antalya", "Europe/Berlin", cities)).toBe("Berlin");
  });

  it("şehir katalogda yoksa veya boşsa dilimden türetir, İstanbul Türkçe yazılır", () => {
    expect(resolveViewerLabel("Bilinmeyen", "Europe/Berlin", cities)).toBe("Berlin");
    expect(resolveViewerLabel(null, "Europe/Istanbul", cities)).toBe("İstanbul");
    expect(resolveViewerLabel(null, "America/New_York", cities)).toBe("New York");
  });
});

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
    // Plaka büyük harf — trUpper: "İstanbul" → "İSTANBUL" (bare toUpperCase "ISTANBUL" verirdi).
    expect(screen.getByText("İSTANBUL")).toBeInTheDocument();
    expect(screen.queryByText("ISTANBUL")).not.toBeInTheDocument();
    // m1: gün-evresi ikonları kalktı — lucide ikonların class imzası bulunmamalı.
    expect(container.querySelector(".lucide")).toBeNull();
    // Dijital saat artık GÖRÜNÜR (sr-only kopya kaldırıldı — çift okunmasın).
    expect(container.querySelectorAll(".sr-only")).toHaveLength(0);
    const digitals = Array.from(container.querySelectorAll(".tabular-nums")).map((n) => n.textContent ?? "");
    expect(digitals).toHaveLength(MAX_CLOCKS);
    digitals.forEach((value) => expect(value).toMatch(/^\d{2}:\d{2}$/));
  });

  it("kadran sade kalır: 4 çeyrek tik + 2 baton ibre (ara tikler geri gelmemeli)", () => {
    const { container } = render(
      <CaddeWorldClocks viewerCity="Berlin" filterCity={null} cities={[]} />,
    );
    const firstFace = container.querySelector("svg");
    // Tikler <line>, ibreler <polygon> (konik baton) — ikisi ayrı ayrı kilitleniyor.
    expect(firstFace?.querySelectorAll("line")).toHaveLength(4);
    expect(firstFace?.querySelectorAll("polygon")).toHaveLength(2);
  });

  it("aynı şehir iki kez yazılmaz — viewer dilimi fallback'lerden biriyle çakışsa bile", () => {
    // Tarayıcı dilimi test ortamına göre değişir; bu yüzden dilime bağlı olmayan değişmez
    // kontrol ediliyor: hangi dilim gelirse gelsin şeritte tekrar eden plaka olmamalı.
    const { container } = render(
      <CaddeWorldClocks
        viewerCity="Antalya"
        filterCity={null}
        cities={[{ name: "Antalya", timezone: "Europe/Istanbul" } as never]}
      />,
    );
    const labels = Array.from(container.querySelectorAll("[data-testid='cadde-world-clocks'] > div > div > span:first-of-type"))
      .map((node) => node.textContent?.trim() ?? "");
    expect(labels).toHaveLength(MAX_CLOCKS);
    expect(new Set(labels).size).toBe(MAX_CLOCKS);
  });

  it("şerit mobilde gizli, md'den itibaren görünür", () => {
    render(<CaddeWorldClocks viewerCity="Berlin" filterCity={null} cities={[]} />);
    const strip = screen.getByTestId("cadde-world-clocks");
    expect(strip.className).toContain("hidden");
    expect(strip.className).toContain("md:flex");
  });
});
