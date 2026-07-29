import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CaddeComposer from "@/components/cadde/CaddeComposer";
import { emptyCaddeComposer, type CaddeComposerValue } from "@/lib/cadde-composer";

// Yükleme yolu ayrı test edilir; burada composer'ın kendi davranışı doğrulanır.
vi.mock("@/lib/cadde-media", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-media")>("@/lib/cadde-media");
  return {
    ...actual,
    uploadCaddeMedia: vi.fn(),
    removeCaddeMedia: vi.fn(),
  };
});

const renderComposer = (overrides: Partial<CaddeComposerValue> = {}, props: Record<string, unknown> = {}) => {
  const value = { ...emptyCaddeComposer, ...overrides };
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  // MentionTextarea öneri sorgusu için QueryClient, hashtag/mention linkleri için Router gerekir.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CaddeComposer
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          isSubmitting={false}
          countries={[{ id: "c1", code: "DE", name: "Almanya" }]}
          cities={[{ id: "ct1", countryId: "c1", name: "Berlin", timezone: "Europe/Berlin" }]}
          interestCatalog={[{ key: "networking", labelTr: "Networking", sortOrder: 10 }]}
          filterCountryLabel="Global"
          onError={vi.fn()}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onChange, onSubmit };
};

describe("CaddeComposer", () => {
  it("renders a single text box with attachment chips instead of a multi-field form", () => {
    renderComposer();

    expect(screen.getByLabelText("Paylaşım metni")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fotoğraf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Video" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Konum" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Etkinlik" })).toBeInTheDocument();
  });

  it("keeps type and title hidden until Detaylar is opened", () => {
    renderComposer();

    expect(screen.queryByText("Tür")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Detaylar/ }));

    expect(screen.getByText("Tür")).toBeInTheDocument();
    expect(screen.getByText(/Başlık/)).toBeInTheDocument();
  });

  it("derives the event post type from the Etkinlik chip", () => {
    const { onChange } = renderComposer();

    fireEvent.click(screen.getByRole("button", { name: "Etkinlik" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: "event" }));
  });

  it("disables submit while empty and enables it once there is text", () => {
    const { onSubmit } = renderComposer();
    const submit = screen.getByRole("button", { name: "Paylaş" });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("enables submit for a media-only post with no text", () => {
    renderComposer({
      media: [{ kind: "image", url: "https://cdn.example.com/a.jpg", path: "uid/post/a.jpg" }],
    });

    expect(screen.getByRole("button", { name: "Paylaş" })).toBeEnabled();
    expect(screen.getByTestId("cadde-media-preview")).toBeInTheDocument();
  });

  it("reveals the location selects only when the Konum chip is pressed", () => {
    renderComposer();

    expect(screen.queryByText(/Ülke/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Konum" }));

    expect(screen.getByText(/Ülke/)).toBeInTheDocument();
    expect(screen.getByText("Şehir")).toBeInTheDocument();
  });
});
