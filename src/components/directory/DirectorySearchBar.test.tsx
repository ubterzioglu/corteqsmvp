import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DirectorySearchBar from "@/components/directory/DirectorySearchBar";

describe("DirectorySearchBar", () => {
  it("renders input and forwards change", () => {
    const onChange = vi.fn();

    render(<DirectorySearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/ara/i);
    fireEvent.change(input, { target: { value: "test" } });

    expect(onChange).toHaveBeenCalledWith("test");
  });
});
