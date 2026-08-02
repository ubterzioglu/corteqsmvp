// ResultCtaPanel — CTA'lar "Yakında" kilitli, "Tekrar Çöz" aktif buton, tek ızgara.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ResultCtaPanel } from "@/components/relocation/tools/ResultCtaPanel";
import type { ToolCta } from "@/lib/relocation-tools-types";

const CTAS: ToolCta[] = [
  { key: "start_related_tool", label: "Şehir Eşleştirmeyi Başlat", href: "/tools/sehir-eslestirme" },
  { key: "view_directory", label: "Bu Ülkedeki Üyeleri Gör", href: "/directory" },
  { key: "start_related_tool", label: "İlk 90 Gün Planlayıcı", href: "/tools/ilk-90-gun-planlayici" },
];

function renderPanel(props: Parameters<typeof ResultCtaPanel>[0]) {
  return render(
    <MemoryRouter>
      <ResultCtaPanel {...props} />
    </MemoryRouter>,
  );
}

describe("ResultCtaPanel", () => {
  it("CTA'ları pasif buton, Tekrar Çöz'ü aktif buton olarak tek ızgarada gösterir", () => {
    renderPanel({ ctas: CTAS, onRetake: vi.fn() });

    expect(screen.queryAllByRole("link")).toHaveLength(0);

    const retake = screen.getByRole("button", { name: "Tekrar Çöz" });
    const ctaButtons = screen.getAllByRole("button").filter((button) => button !== retake);
    expect(ctaButtons).toHaveLength(3);
    for (const button of ctaButtons) expect(button).toBeDisabled();
    expect(retake).toBeEnabled();

    const grid = retake.parentElement;
    for (const el of [...ctaButtons, retake]) expect(el.parentElement).toBe(grid);
    expect(grid?.className).toContain("grid");
  });

  it("CTA'larda Yakında rozeti gösterir ve href üretmez", () => {
    renderPanel({ ctas: CTAS, onRetake: vi.fn() });

    expect(screen.getByText("Şehir Eşleştirmeyi Başlat").closest("a")).toBeNull();
    expect(screen.getByText("Bu Ülkedeki Üyeleri Gör").closest("a")).toBeNull();
    expect(screen.getByText("İlk 90 Gün Planlayıcı").closest("a")).toBeNull();
    expect(screen.getAllByText("Yakında")).toHaveLength(3);
  });

  it("pasif CTA tıklanınca onCtaClick tetiklenmez", async () => {
    const onCtaClick = vi.fn();
    renderPanel({ ctas: CTAS, onCtaClick, onRetake: vi.fn() });

    await userEvent.click(screen.getByText("Bu Ülkedeki Üyeleri Gör"));
    expect(onCtaClick).not.toHaveBeenCalled();
  });

  it("Tekrar Çöz onRetake'i çağırır", async () => {
    const onRetake = vi.fn();
    renderPanel({ ctas: CTAS, onRetake });
    await userEvent.click(screen.getByRole("button", { name: "Tekrar Çöz" }));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("onRetake verilmezse yalnız CTA'lar çıkar; CTA da yoksa hiç render etmez", () => {
    const { container, rerender } = renderPanel({ ctas: CTAS });
    expect(screen.getAllByRole("button")).toHaveLength(3);
    rerender(
      <MemoryRouter>
        <ResultCtaPanel ctas={[]} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
