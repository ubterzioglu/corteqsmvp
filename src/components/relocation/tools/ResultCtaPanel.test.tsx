// ResultCtaPanel — B21 sonrası: CTA'lar gerçek linkler, "Tekrar Çöz" aktif buton, tek ızgara.
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
  it("CTA'ları link, Tekrar Çöz'ü buton olarak tek ızgarada gösterir", () => {
    renderPanel({ ctas: CTAS, onRetake: vi.fn() });

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);

    const retake = screen.getByRole("button", { name: "Tekrar Çöz" });
    const grid = retake.parentElement;
    for (const el of [...links, retake]) expect(el.parentElement).toBe(grid);
    expect(grid?.className).toContain("grid");
  });

  it("her CTA doğru rotaya işaret eder ve 'Yakında' rozeti YOK (B21)", () => {
    renderPanel({ ctas: CTAS, onRetake: vi.fn() });

    expect(screen.getByText("Şehir Eşleştirmeyi Başlat").closest("a")).toHaveAttribute(
      "href",
      "/tools/sehir-eslestirme",
    );
    expect(screen.getByText("Bu Ülkedeki Üyeleri Gör").closest("a")).toHaveAttribute("href", "/directory");
    expect(screen.getByText("İlk 90 Gün Planlayıcı").closest("a")).toHaveAttribute(
      "href",
      "/tools/ilk-90-gun-planlayici",
    );
    expect(screen.queryByText("Yakında")).toBeNull();
  });

  it("CTA tıklanınca onCtaClick çözülmüş CTA ile tetiklenir", async () => {
    const onCtaClick = vi.fn();
    renderPanel({ ctas: CTAS, onCtaClick, onRetake: vi.fn() });

    await userEvent.click(screen.getByText("Bu Ülkedeki Üyeleri Gör"));
    expect(onCtaClick).toHaveBeenCalledTimes(1);
    expect(onCtaClick.mock.calls[0][0]).toMatchObject({ key: "view_directory", href: "/directory" });
  });

  it("Tekrar Çöz onRetake'i çağırır", async () => {
    const onRetake = vi.fn();
    renderPanel({ ctas: CTAS, onRetake });
    await userEvent.click(screen.getByRole("button", { name: "Tekrar Çöz" }));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("onRetake verilmezse yalnız CTA'lar çıkar; CTA da yoksa hiç render etmez", () => {
    const { container, rerender } = renderPanel({ ctas: CTAS });
    expect(screen.getAllByRole("link")).toHaveLength(3);
    rerender(
      <MemoryRouter>
        <ResultCtaPanel ctas={[]} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
