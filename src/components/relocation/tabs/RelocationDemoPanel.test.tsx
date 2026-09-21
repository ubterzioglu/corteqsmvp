import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RelocationDemoPanel } from "./RelocationDemoPanel";

describe("RelocationDemoPanel", () => {
  it("states that demo content does not replace official document lists", () => {
    render(<RelocationDemoPanel items={[]} note="Örnek içerik" />);

    expect(screen.getByText(/resmî belge listesinin yerini tutmaz/i)).toBeInTheDocument();
  });
});
