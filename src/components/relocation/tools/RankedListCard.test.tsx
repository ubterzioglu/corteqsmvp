import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RankedListCard } from "@/components/relocation/tools/RankedListCard";
import { SCORE_BAND_LABELS, SCORE_BAND_STYLES } from "@/lib/relocation-score-bands";

const items = [
  {
    key: "de",
    title: "Almanya",
    score: 88,
    sub_scores: { budget: 0.91, language: 0.25 },
  },
  { key: "nl", title: "Hollanda", score: 52 },
];

const labels = { budget: "Bütçe uyumu", language: "Dil engeli" };

describe("RankedListCard (#REV-034 kutulu renkli görsel)", () => {
  it("her öğeyi bant rengini taşıyan başlık şeridi olan bir kutuda çizer", () => {
    const { container } = render(
      <RankedListCard title="Sıralama" items={items} dimensionLabels={labels} />,
    );

    // 88 → strong, 52 → fair. İkisi FARKLI renk almalı; aksi hâlde kutular
    // yeniden tek renge düşer ve revizyonun istediği ayrım kaybolur.
    const strong = container.querySelector(`.${CSS.escape(SCORE_BAND_STYLES.strong.chip.split(" ")[0])}`);
    const fair = container.querySelector(`.${CSS.escape(SCORE_BAND_STYLES.fair.chip.split(" ")[0])}`);
    expect(strong).not.toBeNull();
    expect(fair).not.toBeNull();
    expect(SCORE_BAND_STYLES.strong.chip).not.toBe(SCORE_BAND_STYLES.fair.chip);
  });

  it("RENK TEK BAŞINA bilgi taşımaz — bandın Türkçe etiketi yazılı durur", () => {
    render(<RankedListCard title="Sıralama" items={items} dimensionLabels={labels} />);

    expect(screen.getByText(SCORE_BAND_LABELS.strong)).toBeInTheDocument();
    expect(screen.getByText(SCORE_BAND_LABELS.fair)).toBeInTheDocument();
  });

  it("sıra numarasını ve puanı yazılı tutar", () => {
    render(<RankedListCard title="Sıralama" items={items} dimensionLabels={labels} />);

    expect(screen.getByText("Almanya")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument();
  });

  it("ScoreBandBar'ın erişilebilirlik sözleşmesini BOZMAZ (a275f131)", () => {
    render(<RankedListCard title="Sıralama" items={items} dimensionLabels={labels} />);

    const bar = screen.getByRole("progressbar", { name: "Bütçe uyumu" });
    expect(bar).toHaveAttribute("aria-valuenow", "91");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("barları kalınlaştırır — eski h-1 ince satır GERİ GELMEZ", () => {
    render(<RankedListCard title="Sıralama" items={items} dimensionLabels={labels} />);

    const bar = screen.getByRole("progressbar", { name: "Dil engeli" });
    expect(bar.className).toContain("h-2.5");
    expect(bar.className).not.toContain("h-1 ");
  });

  it("puanı olmayan öğeye bant rengi VERMEZ (0 puan 'zayıf' sanılmasın)", () => {
    render(<RankedListCard title="Sıralama" items={[{ key: "x", title: "Bilinmiyor" }]} />);

    expect(screen.getByText("Bilinmiyor")).toBeInTheDocument();
    expect(screen.queryByText(SCORE_BAND_LABELS.weak)).not.toBeInTheDocument();
  });

  it("boş listede hiçbir şey çizmez", () => {
    const { container } = render(<RankedListCard title="Sıralama" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
