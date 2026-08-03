import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZgenPanel } from "@/components/relocation/tools/zgen/ZgenPanel";

describe("ZgenPanel", () => {
  it("shows the matching generation profile and compatibility guide once a valid year is typed", () => {
    render(<ZgenPanel />);

    const input = screen.getByPlaceholderText("Desteklenen yıllar: 1928–2100");
    fireEvent.change(input, { target: { value: "1990" } });

    // Appears both in the profile heading and the always-visible reference chart.
    expect(screen.getAllByText(/Millennials \(Gen Y\)/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Diğer kuşaklarla nasıl geçinilir?")).toBeInTheDocument();
    expect(screen.getByText("Gen X ile")).toBeInTheDocument();
    // Directional compat: shows tips for Gen Y talking to Gen Z, not the other 6 generations twice.
    expect(screen.queryByText("Millennials (Gen Y) ile")).not.toBeInTheDocument();
  });

  it("hides the profile card for an out-of-range or incomplete year", () => {
    render(<ZgenPanel />);

    const input = screen.getByPlaceholderText("Desteklenen yıllar: 1928–2100");
    fireEvent.change(input, { target: { value: "1900" } });
    expect(screen.queryByText("Diğer kuşaklarla nasıl geçinilir?")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "199" } });
    expect(screen.queryByText("Diğer kuşaklarla nasıl geçinilir?")).not.toBeInTheDocument();
  });

  it("always shows the generation reference chart, even before typing a year", () => {
    render(<ZgenPanel />);
    expect(screen.getByText("Kuşak tablosu")).toBeInTheDocument();
  });
});
