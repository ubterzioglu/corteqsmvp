import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CaddeEmojiPickerButton from "@/components/cadde/CaddeEmojiPickerButton";

vi.mock("@/components/cadde/CaddeEmojiPickerContent", () => ({
  default: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
    <button type="button" onClick={() => onSelect("😊")}>
      😊
    </button>
  ),
}));

describe("CaddeEmojiPickerButton", () => {
  it("lazy-renders the picker content only after opening and forwards the selected emoji", async () => {
    const onSelect = vi.fn();
    render(<CaddeEmojiPickerButton onSelect={onSelect} />);

    expect(screen.queryByRole("button", { name: "😊" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Emoji ekle" }));
    fireEvent.click(await screen.findByRole("button", { name: "😊" }));

    expect(onSelect).toHaveBeenCalledWith("😊");
    await waitFor(() => expect(screen.queryByRole("button", { name: "😊" })).not.toBeInTheDocument());
  });
});
