import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState } from "react";

import CaddeComposer from "@/components/cadde/CaddeComposer";
import { emptyCaddeComposer, type CaddeComposerValue } from "@/lib/cadde-composer";
import { uploadCaddeMedia } from "@/lib/cadde-media";

// Yükleme yolu ayrı test edilir; burada composer'ın kendi davranışı doğrulanır.
vi.mock("@/lib/cadde-media", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cadde-media")>("@/lib/cadde-media");
  return {
    ...actual,
    uploadCaddeMedia: vi.fn(),
    removeCaddeMedia: vi.fn(),
  };
});

vi.mock("@/components/cadde/CaddeEmojiPickerContent", () => ({
  default: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
    <button type="button" onClick={() => onSelect("😊")}>
      😊
    </button>
  ),
}));

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
          countries={[
            { id: "c1", code: "DE", name: "Almanya" },
            { id: "c2", code: "NL", name: "Hollanda" },
          ]}
          cities={[
            { id: "ct1", countryId: "c1", name: "Berlin", timezone: "Europe/Berlin" },
            { id: "ct2", countryId: "c2", name: "Amsterdam", timezone: "Europe/Amsterdam" },
          ]}
          defaultLocationLabel="Almanya / Berlin"
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
  });

  it("m5+m6: Detaylar paneli ve Etkinlik çipi tamamen kalktı — tip her zaman text", () => {
    renderComposer();

    // Etkinlik çipi yok (m6), Detaylar düğmesi/paneli yok (m5) — tür/başlık/etiket girişi kalmadı.
    expect(screen.queryByRole("button", { name: "Etkinlik" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Detaylar/)).not.toBeInTheDocument();
    expect(screen.queryByText("Tür")).not.toBeInTheDocument();
    expect(screen.queryByText(/Başlık/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Etiketler/)).not.toBeInTheDocument();
    // Veri sözleşmesi: başlangıç değeri text ve composer bunu değiştiremez.
    expect(emptyCaddeComposer.type).toBe("text");
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

  it("shows the registered profile location as the blank-location default", () => {
    renderComposer();

    fireEvent.click(screen.getByRole("button", { name: "Konum" }));

    expect(screen.getByText(/boş = Almanya \/ Berlin/)).toBeInTheDocument();
    expect(screen.getByText("Profil konumunu kullan")).toBeInTheDocument();
    expect(screen.queryByText("Filtreyi kullan")).not.toBeInTheDocument();
  });

  it("adds at most one extra target and keeps premium gating informational in the UI", () => {
    const { onChange } = renderComposer();

    fireEvent.click(screen.getByRole("button", { name: "Konum" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Hedef" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ targets: [{ country: "", city: "" }] }));
    renderComposer({ targets: [{ country: "Hollanda", city: "Amsterdam" }] });
    fireEvent.click(screen.getAllByRole("button", { name: "Konum" }).at(-1)!);

    expect(screen.getByText("Ek hedef ülke 1")).toBeInTheDocument();
    expect(screen.getByText("Ek hedef şehir 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Premium ile/ })).toBeDisabled();
    expect(screen.getByText(/premium ayarıyla DB tarafında kontrol edilir/i)).toBeInTheDocument();
  });

  it("inserts a selected emoji into the body at the current caret", async () => {
    const { onChange } = renderComposer({ body: "Merhaba dunya" });
    const textarea = screen.getByLabelText("Paylaşım metni") as HTMLTextAreaElement;

    textarea.setSelectionRange(8, 8);
    fireEvent.click(textarea);
    fireEvent.click(screen.getByRole("button", { name: "Emoji ekle" }));
    fireEvent.click(await screen.findByRole("button", { name: "😊" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ body: "Merhaba 😊dunya" })));
  });

  // Revizyon 587595fa — "Paylaşım yaparken tagleme olayını netleştirelim".
  //
  // @mention ve #hashtag kod tarafında zaten çalışıyordu; eksik olan tek şey
  // kullanıcıya bunu SÖYLEYEN satırdı. Bu testler o satırın (ve balonun) varlığını
  // kilitler — silinirse özellik yine keşfedilemez hâle döner.
  describe("etiketleme ipucu (587595fa)", () => {
    it("metin alanının altında @ ve # ipucunu gösterir", () => {
      renderComposer();

      expect(screen.getByTestId("cadde-composer-tag-hint")).toHaveTextContent(
        "@ ile üye etiketle, # ile konu etiketi ekle.",
      );
    });

    it("kafe varyantında da görünür — etiketleme orada da çalışır", () => {
      renderComposer({}, { variant: "cafe" });

      expect(screen.getByTestId("cadde-composer-tag-hint")).toBeInTheDocument();
      // Kafe varyantında konum çipi yoktur; ipucu ondan bağımsız çizilmelidir.
      expect(screen.queryByRole("button", { name: "Konum" })).not.toBeInTheDocument();
    });

    it("balon kapalıyken içerik DOM'da yoktur, tıklanınca ayrıntı açılır", async () => {
      const user = userEvent.setup();
      renderComposer();

      expect(screen.queryByTestId("cadde-composer-tag-info-content")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("cadde-composer-tag-info-trigger"));

      const content = await screen.findByTestId("cadde-composer-tag-info-content");
      expect(content).toHaveTextContent(/öneri listesi açılır/);
      expect(content).toHaveTextContent(/konu etiketi eklersin/);
    });
  });

  // m63 — "görsel yüklerken donma ve görüntüleme sorunları".
  describe("yükleme sırasında davranış (m63)", () => {
    // Gerçek state tutan sarmalayıcı: stale-closure hatası ancak değer GERÇEKTEN
    // güncellenirken görülür, vi.fn() onChange ile görünmez.
    const ControlledComposer = () => {
      const [value, setValue] = useState<CaddeComposerValue>(emptyCaddeComposer);
      return (
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter>
            <CaddeComposer
              value={value}
              onChange={setValue}
              onSubmit={vi.fn()}
              isSubmitting={false}
              countries={[]}
              cities={[]}
              defaultLocationLabel="Almanya / Berlin"
              onError={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>
      );
    };

    const pickImage = (container: HTMLElement) => {
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["x"], "foto.jpg", { type: "image/jpeg" });
      fireEvent.change(input, { target: { files: [file] } });
    };

    it("yükleme sürerken yazılan metni geri almaz", async () => {
      let finishUpload: ((asset: unknown) => void) | undefined;
      vi.mocked(uploadCaddeMedia).mockImplementation(
        () => new Promise((resolve) => { finishUpload = resolve; }) as ReturnType<typeof uploadCaddeMedia>,
      );

      const { container } = render(<ControlledComposer />);
      pickImage(container);

      // Yükleme devam ederken kullanıcı yazıyor.
      const textarea = screen.getByLabelText("Paylaşım metni") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "yüklenirken yazdım" } });

      finishUpload?.({ kind: "image", path: "u/p/1.jpg", url: "https://cdn.example/1.jpg" });

      // Hata hâlinde onChange eski snapshot'ı yazıp bu metni siliyordu.
      await waitFor(() => expect(screen.getByTestId("cadde-media-preview")).toBeInTheDocument());
      expect(textarea).toHaveValue("yüklenirken yazdım");
    });

    it("yükleme sürerken görünür bir gösterge çizer", async () => {
      let finishUpload: ((asset: unknown) => void) | undefined;
      vi.mocked(uploadCaddeMedia).mockImplementation(
        () => new Promise((resolve) => { finishUpload = resolve; }) as ReturnType<typeof uploadCaddeMedia>,
      );

      const { container } = render(<ControlledComposer />);
      expect(screen.queryByTestId("cadde-composer-uploading")).not.toBeInTheDocument();

      pickImage(container);

      // Çipler pasifken kullanıcı en azından bir şey olduğunu görmeli.
      expect(await screen.findByTestId("cadde-composer-uploading")).toBeInTheDocument();

      finishUpload?.({ kind: "image", path: "u/p/1.jpg", url: "https://cdn.example/1.jpg" });
      await waitFor(() => expect(screen.queryByTestId("cadde-composer-uploading")).not.toBeInTheDocument());
    });
  });
});
