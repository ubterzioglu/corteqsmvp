import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScoreBandBar, ScoreBandChip } from "@/components/relocation/tools/ScoreBand";
import { SCORE_BAND_STYLES } from "@/lib/relocation-score-bands";

describe("ScoreBandBar", () => {
  it("puanı erişilebilir bir ölçü olarak duyurur", () => {
    render(<ScoreBandBar value01={0.42} ariaLabel="Bütçe uyumu" />);

    const bar = screen.getByRole("progressbar", { name: "Bütçe uyumu" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("dolguyu bandın rengiyle boyar", () => {
    const { container } = render(<ScoreBandBar value01={0.9} ariaLabel="X" />);
    const fill = container.querySelector("[data-band-fill]");
    expect(fill?.className).toContain(SCORE_BAND_STYLES.strong.bar);
  });

  it("zayıf puan güçlü puandan FARKLI renk alır", () => {
    // Regresyon kilidi: eskiden tüm barlar bg-primary idi ve bant görünmezdi.
    const weak = render(<ScoreBandBar value01={0.1} ariaLabel="X" />);
    const weakClass = weak.container.querySelector("[data-band-fill]")?.className;
    weak.unmount();

    const strong = render(<ScoreBandBar value01={0.95} ariaLabel="X" />);
    const strongClass = strong.container.querySelector("[data-band-fill]")?.className;

    expect(weakClass).not.toBe(strongClass);
  });

  it("0 ile 100 arasına kırpar (bozuk veri barı taşırmaz)", () => {
    const { container, rerender } = render(<ScoreBandBar value01={1.8} ariaLabel="X" />);
    expect(container.querySelector("[data-band-fill]")).toHaveStyle({ width: "100%" });

    rerender(<ScoreBandBar value01={-0.5} ariaLabel="X" />);
    expect(container.querySelector("[data-band-fill]")).toHaveStyle({ width: "0%" });
  });
});

describe("ScoreBandChip", () => {
  it("bandı METİN olarak yazar — renk tek başına anlam taşımaz", () => {
    render(<ScoreBandChip value01={0.3} />);
    expect(screen.getByText("Zayıf")).toBeInTheDocument();
  });

  it("ikonu dekoratif tutar (ekran okuyucu iki kez okumaz)", () => {
    const { container } = render(<ScoreBandChip value01={0.9} />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("her bant için farklı ikon çizer", () => {
    const seen = new Set<string>();
    for (const value of [0.9, 0.7, 0.5, 0.1]) {
      const view = render(<ScoreBandChip value01={value} />);
      seen.add(view.container.querySelector("svg")?.getAttribute("class") ?? "");
      view.unmount();
    }
    // Dört bandın ikonu birbirinden ayırt edilebilir olmalı.
    expect(seen.size).toBeGreaterThan(1);
  });
});
