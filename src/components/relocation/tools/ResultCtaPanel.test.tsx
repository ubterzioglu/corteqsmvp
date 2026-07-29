// ResultCtaPanel — CTA'lar "Yakında" rozetiyle devre dışı, "Tekrar Çöz" aktif ve aynı ızgarada.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultCtaPanel } from "@/components/relocation/tools/ResultCtaPanel";
import type { ToolCta } from "@/lib/relocation-tools-types";

const CTAS: ToolCta[] = [
  { key: "start_related_tool", label: "Şehir Eşleştirmeyi Başlat", href: "/relocation/tools/sehir-eslestirme" },
  { key: "view_directory", label: "Bu Ülkedeki Üyeleri Gör", href: "/directory" },
  { key: "start_related_tool", label: "İlk 90 Gün Planlayıcı", href: "/relocation/tools/ilk-90-gun-planlayici" },
];

describe("ResultCtaPanel", () => {
  it("CTA'ları ve Tekrar Çöz'ü tek ızgarada, toplam 4 buton olarak gösterir", () => {
    render(<ResultCtaPanel ctas={CTAS} onRetake={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    // Hepsi aynı kapsayıcının (ızgara) doğrudan çocuğu olmalı — Tekrar Çöz ayrı blokta durmasın.
    const grid = buttons[0].parentElement;
    for (const button of buttons) expect(button.parentElement).toBe(grid);
    expect(grid?.className).toContain("grid");
  });

  it("3 CTA devre dışı ve 'Yakında' rozetli; Tekrar Çöz ne devre dışı ne rozetli", async () => {
    const onRetake = vi.fn();
    render(<ResultCtaPanel ctas={CTAS} onRetake={onRetake} />);

    expect(screen.getAllByText("Yakında")).toHaveLength(3);
    for (const label of ["Şehir Eşleştirmeyi Başlat", "Bu Ülkedeki Üyeleri Gör", "İlk 90 Gün Planlayıcı"]) {
      expect(screen.getByText(label).closest("button")).toBeDisabled();
    }

    const retake = screen.getByRole("button", { name: "Tekrar Çöz" });
    expect(retake).toBeEnabled();
    expect(retake.textContent).not.toContain("Yakında");
    await userEvent.click(retake);
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("devre dışı CTA tıklanınca onCtaClick tetiklenmez", async () => {
    const onCtaClick = vi.fn();
    render(<ResultCtaPanel ctas={CTAS} onCtaClick={onCtaClick} onRetake={vi.fn()} />);
    await userEvent.click(screen.getByText("Bu Ülkedeki Üyeleri Gör").closest("button")!, {
      pointerEventsCheck: 0,
    });
    expect(onCtaClick).not.toHaveBeenCalled();
  });

  it("onRetake verilmezse yalnız CTA'lar çıkar; CTA da yoksa hiç render etmez", () => {
    const { container, rerender } = render(<ResultCtaPanel ctas={CTAS} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    rerender(<ResultCtaPanel ctas={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
