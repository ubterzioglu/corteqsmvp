import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ToolModeSelector } from "@/components/relocation/tools/ToolModeSelector";

describe("ToolModeSelector", () => {
  it("hızlı ve detaylı seçenekleri açıklamayla render eder", () => {
    render(<ToolModeSelector quickCount={8} detailedCount={10} onSelect={vi.fn()} />);

    expect(screen.getByText("Hızlı")).toBeInTheDocument();
    expect(screen.getByText("Detaylı")).toBeInTheDocument();
    expect(screen.getByText("(8 soru)")).toBeInTheDocument();
    expect(screen.getByText("(10 soru)")).toBeInTheDocument();
    // Her iki seçenekte de açıklama metni görünür.
    expect(screen.getByText(/kısa sürede sonuç/i)).toBeInTheDocument();
    expect(screen.getByText(/daha kişiselleştirilmiş/i)).toBeInTheDocument();
  });

  it("seçeneğe tıklayınca doğru mode ile onSelect çağırır", () => {
    const onSelect = vi.fn();
    render(<ToolModeSelector quickCount={8} detailedCount={10} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Hızlı"));
    expect(onSelect).toHaveBeenCalledWith("quick");

    fireEvent.click(screen.getByText("Detaylı"));
    expect(onSelect).toHaveBeenCalledWith("detailed");
  });

  it("detailedCount 0 ise detaylı seçeneği gösterilmez", () => {
    render(<ToolModeSelector quickCount={5} detailedCount={0} onSelect={vi.fn()} />);

    expect(screen.getByText("Hızlı")).toBeInTheDocument();
    expect(screen.queryByText("Detaylı")).not.toBeInTheDocument();
  });
});
