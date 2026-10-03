/**
 * CD02 · composer düzenleme modu (UI yakası).
 *
 * Kilitler: editMode banner + "Kaydet"/"Vazgeç" · normal modda "Paylaş" dili
 * bozulmaz · Vazgeç onCancelEdit'e düşer · düzenlerken gönderim onSubmit'e
 * gider (mutasyon seçimi parent'ın — hook testi ayrıca kilitler).
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CaddeComposer from "@/components/cadde/CaddeComposer";
import { emptyCaddeComposer, type CaddeComposerValue } from "@/lib/cadde-composer";

vi.mock("@/components/cadde/CaddeEmojiPickerContent", () => ({
  default: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
    <button type="button" onClick={() => onSelect("😊")}>😊</button>
  ),
}));

const renderComposer = (overrides: Partial<CaddeComposerValue> = {}, props: Record<string, unknown> = {}) => {
  const value = { ...emptyCaddeComposer, ...overrides };
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const onCancelEdit = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CaddeComposer
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          isSubmitting={false}
          onError={vi.fn()}
          onCancelEdit={onCancelEdit}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onChange, onSubmit, onCancelEdit };
};

describe("CaddeComposer · düzenleme modu", () => {
  it("normal modda banner YOK, buton 'Paylaş'", () => {
    renderComposer();

    expect(screen.queryByTestId("cadde-composer-edit-banner")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paylaş" })).toBeInTheDocument();
  });

  it("editMode → banner + 'Kaydet' + 'Vazgeç'; @anma koruma notu görünür", () => {
    renderComposer({ body: "mevcut metin" }, { editMode: true });

    expect(screen.getByTestId("cadde-composer-edit-banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeInTheDocument();
    expect(screen.getByText(/@anmaların korunur/)).toBeInTheDocument();
    // Ön dolu gövde textarea'da
    expect(screen.getByLabelText("Paylaşım metni")).toHaveValue("mevcut metin");
  });

  it("Vazgeç → onCancelEdit (mutasyon çağrılmaz)", () => {
    const { onCancelEdit, onSubmit } = renderComposer({}, { editMode: true });

    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(onCancelEdit).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Kaydet → onSubmit (update mutasyonu parent'ta)", () => {
    const { onSubmit } = renderComposer({ body: "x" }, { editMode: true });

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("kaydedilirken etiket 'Kaydediliyor…'", () => {
    renderComposer({ body: "x" }, { editMode: true, isSubmitting: true });

    expect(screen.getByRole("button", { name: /Kaydediliyor/ })).toBeDisabled();
  });
});
