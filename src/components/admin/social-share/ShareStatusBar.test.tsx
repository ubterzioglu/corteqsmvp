import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ShareStatusBar } from "@/components/admin/social-share/ShareStatusBar";

describe("ShareStatusBar", () => {
  it("toggles a platform on with the inverse of its current shared state", () => {
    const onToggle = vi.fn();
    render(
      <ShareStatusBar
        tab="tools"
        itemId="tool-1"
        badges={{}}
        note={undefined}
        onToggle={onToggle}
        onSaveNote={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /LinkedIn/i }));

    expect(onToggle).toHaveBeenCalledWith("linkedin", true);
  });

  it("toggles a shared platform back off", () => {
    const onToggle = vi.fn();
    render(
      <ShareStatusBar
        tab="tools"
        itemId="tool-1"
        badges={{ linkedin: { shared: true, markedAt: "2026-06-26T10:00:00.000Z", markedBy: null } }}
        note={undefined}
        onToggle={onToggle}
        onSaveNote={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /LinkedIn/i }));

    expect(onToggle).toHaveBeenCalledWith("linkedin", false);
  });

  it("saves the edited note text", () => {
    const onSaveNote = vi.fn();
    render(
      <ShareStatusBar
        tab="diaspora"
        itemId="post-2"
        badges={{}}
        note={undefined}
        onToggle={vi.fn()}
        onSaveNote={onSaveNote}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Not Ekle/i }));
    const input = screen.getByTestId("share-note-input-diaspora-post-2");
    fireEvent.change(input, { target: { value: "https://example.com/post" } });
    fireEvent.click(screen.getByRole("button", { name: /Kaydet/i }));

    expect(onSaveNote).toHaveBeenCalledWith("https://example.com/post");
  });

  it("disables all platform buttons while a mutation is pending", () => {
    render(
      <ShareStatusBar
        tab="tools"
        itemId="tool-1"
        badges={{}}
        note={undefined}
        onToggle={vi.fn()}
        onSaveNote={vi.fn()}
        pending
      />,
    );

    expect(screen.getByRole("button", { name: /LinkedIn/i })).toBeDisabled();
  });
});
