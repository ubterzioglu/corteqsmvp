/**
 * G18 · S1 form bileşeni sözleşmesi (AddCommunityFormSection).
 *
 * Kilitlediği davranışlar:
 *   • Platform SEÇİMİ ve serbest metin ülke/şehir KALKTI (politika §2:
 *     "Formda olmayanlar: Platform seçimi…"; konum geo_* autocomplete).
 *   • 7 kategori tek seçim; Aile & Çocuk G06'ya dek SEÇİLEMEZ (kabul #10 UI yakası).
 *   • Grup Sözü işaretsiz gönderim YOK (politika §2 satır 7); metin BİREBİR.
 *   • 160 karakter sayacı + maxLength (politika §2 satır 5).
 *   • Global → şehir kapalı, ülke etiketi "Hedef Ülke".
 *   • Önizleme: exists (kabul #1) ve invalid gönderimi BLOKLAR; unknown/failed
 *     bloklamaz (tasarım §3.A adım 4: form bu adıma takılmaz).
 *   • Yasaklı kullanıcı (G15) formda uyarı görür, gönderemez.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddCommunityFormSection } from "@/components/whatsapp/AddCommunityFormSection";
import { GROUP_PLEDGE_TEXT, previewBlocksSubmit } from "@/lib/group-submit";
import { initialGroupForm, type GroupFormState } from "@/lib/whatsapp-landing-form";
import type { GroupPreviewState } from "@/lib/group-submit";

// Geo autocomplete'ler react-query + popover zinciri kuruyor; form sözleşmesi
// için prop'ları (value/onChange/disabled) taklit eden basit input yeterli.
vi.mock("@/components/SearchableCountrySelect", () => ({
  default: (props: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
    <input
      aria-label="Ülke autocomplete"
      value={props.value}
      disabled={props.disabled}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/SearchableCitySelect", () => ({
  default: (props: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
    <input
      aria-label="Şehir autocomplete"
      value={props.value}
      disabled={props.disabled}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}));

const baseProps = (overrides: Partial<Parameters<typeof AddCommunityFormSection>[0]> = {}) => ({
  isSignedIn: true,
  open: true,
  onOpenChange: vi.fn(),
  form: { ...initialGroupForm } as GroupFormState,
  onFieldChange: vi.fn(),
  preview: { status: "idle" } as GroupPreviewState,
  onPreviewLink: vi.fn(),
  banned: false,
  oauthSubmitting: false,
  submitting: false,
  onStartGoogleAuth: vi.fn(),
  onSubmit: vi.fn(),
  onOpenExistingGroup: vi.fn(),
  ...overrides,
});

describe("AddCommunityFormSection · eski alanlar KALKTI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("platform seçimi YOK (linkten otomatik)", () => {
    render(<AddCommunityFormSection {...baseProps()} />);

    expect(screen.queryByText("Platform *")).not.toBeInTheDocument();
    expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
    expect(screen.queryByText("Instagram")).not.toBeInTheDocument();
  });

  it("serbest metin ülke/şehir inputu YOK — autocomplete var", () => {
    render(<AddCommunityFormSection {...baseProps()} />);

    expect(screen.queryByPlaceholderText("Örn: Almanya")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Örn: Berlin")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Ülke autocomplete")).toBeInTheDocument();
    expect(screen.getByLabelText("Şehir autocomplete")).toBeInTheDocument();
  });
});

describe("AddCommunityFormSection · politika §2 satırları", () => {
  it("7 kategori listelenir; Aile & Çocuk seçilemez (G06 kilidi)", () => {
    render(<AddCommunityFormSection {...baseProps()} />);

    fireEvent.click(screen.getByRole("combobox", { name: /kategori/i }));

    for (const label of [
      "Şehir & Yaşam",
      "Meslek & Kariyer",
      "İş & Girişim",
      "Alumni & Akademik",
      "Dayanışma & Yardım",
      "Hobi & Kültür",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const locked = screen.getByText(/Aile & Çocuk/);
    expect(locked).toBeInTheDocument();
    expect(locked.closest('[role="option"]')?.getAttribute("aria-disabled")).toBe("true");
    // "Diğer" kategorisi YOK (politika §5)
    expect(screen.queryByText("Diğer")).not.toBeInTheDocument();
  });

  it("kısa açıklama 160 karakterle sınırlı + sayaç görünür", () => {
    render(
      <AddCommunityFormSection
        {...baseProps({ form: { ...initialGroupForm, shortDescription: "Merhaba" } })}
      />,
    );

    const textarea = screen.getByLabelText(/Kısa Açıklama/);
    expect(textarea).toHaveAttribute("maxlength", "160");
    expect(screen.getByText("7/160")).toBeInTheDocument();
  });

  it("Global işaretlenince şehir kapanır, ülke 'Hedef Ülke' olur", () => {
    render(
      <AddCommunityFormSection {...baseProps({ form: { ...initialGroupForm, isGlobal: true } })} />,
    );

    expect(screen.getByLabelText("Şehir autocomplete")).toBeDisabled();
    expect(screen.getByText("Hedef Ülke *")).toBeInTheDocument();
  });

  it("admin sorusu Evet/Hayır radyolarıyla sorulur", () => {
    render(<AddCommunityFormSection {...baseProps()} />);

    expect(screen.getByText("Bu grubun admini misin? *")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Evet" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Hayır" })).toBeInTheDocument();
  });

  it("Grup Sözü metni BİREBİR gösterilir; işaretsiz gönderim kapalı", () => {
    const onFieldChange = vi.fn();
    render(<AddCommunityFormSection {...baseProps({ onFieldChange })} />);

    expect(screen.getByText(GROUP_PLEDGE_TEXT)).toBeInTheDocument();

    // Kontrolsüz durum yok: bileşen prop-güdümlü. İşaretsiz → kapalı.
    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).toBeDisabled();

    // Kutuya basmak durum değişikliğini ÜST bileşene bildirir.
    fireEvent.click(screen.getByLabelText(/Grup Sözü'nü okudum/));
    expect(onFieldChange).toHaveBeenCalledWith("pledgeAccepted", true);
  });

  it("Grup Sözü işaretliyken gönderim açık", () => {
    render(
      <AddCommunityFormSection
        {...baseProps({ form: { ...initialGroupForm, pledgeAccepted: true } })}
      />,
    );

    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).not.toBeDisabled();
  });
});

describe("AddCommunityFormSection · önizleme ve yasak durumları", () => {
  it("exists → 'zaten listede' uyarısı + gönderim kapalı + 'Grubu gör' slug ile çağrılır", () => {
    const onOpenExistingGroup = vi.fn();
    render(
      <AddCommunityFormSection
        {...baseProps({
          form: { ...initialGroupForm, pledgeAccepted: true },
          preview: {
            status: "done",
            data: { exists: true, slug: "berlin-grup", group_name: "Berlin Grubu", ownership: "unclaimed", listing_status: "published" },
          },
          onOpenExistingGroup,
        })}
      />,
    );

    expect(screen.getByText(/Bu grup zaten listede/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Grubu gör/i }));
    expect(onOpenExistingGroup).toHaveBeenCalledWith("berlin-grup");
  });

  it("invalid → kesin ölü link uyarısı + gönderim kapalı", () => {
    render(
      <AddCommunityFormSection
        {...baseProps({
          form: { ...initialGroupForm, pledgeAccepted: true },
          preview: { status: "done", data: { exists: false, read_result: "invalid" } },
        })}
      />,
    );

    expect(screen.getByText(/Davet sayfası geçersiz görünüyor/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).toBeDisabled();
  });

  it("unknown/failed formu BLOKLAMAZ (tasarım §3.A adım 4)", () => {
    const { rerender } = render(
      <AddCommunityFormSection
        {...baseProps({
          form: { ...initialGroupForm, pledgeAccepted: true },
          preview: { status: "done", data: { exists: false, read_result: "unknown" } },
        })}
      />,
    );
    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).not.toBeDisabled();

    rerender(
      <AddCommunityFormSection
        {...baseProps({
          form: { ...initialGroupForm, pledgeAccepted: true },
          preview: { status: "failed", message: "ağ hatası" },
        })}
      />,
    );
    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).not.toBeDisabled();
    expect(screen.getByText(/alanları elle doldurabilirsin/i)).toBeInTheDocument();
  });

  it("banned → uyarı + gönderim kapalı (G15)", () => {
    render(
      <AddCommunityFormSection
        {...baseProps({ form: { ...initialGroupForm, pledgeAccepted: true }, banned: true })}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/yetkin askıya alınmış/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Grubu Gönder/i })).toBeDisabled();
  });

  it("previewBlocksSubmit: yalnız exists ve invalid bloklar", () => {
    expect(previewBlocksSubmit({ status: "idle" })).toBe(false);
    expect(previewBlocksSubmit({ status: "loading" })).toBe(false);
    expect(previewBlocksSubmit({ status: "unsupported" })).toBe(false);
    expect(previewBlocksSubmit({ status: "failed", message: "x" })).toBe(false);
    expect(previewBlocksSubmit({ status: "done", data: { exists: false, read_result: "unknown" } })).toBe(false);
    expect(previewBlocksSubmit({ status: "done", data: { exists: false, read_result: "ok", name: "x" } })).toBe(false);
    expect(previewBlocksSubmit({ status: "done", data: { exists: false, read_result: "invalid" } })).toBe(true);
    expect(previewBlocksSubmit({ status: "done", data: { exists: true } })).toBe(true);
  });

  it("link alanı blur'da önizlemeyi tetikler", () => {
    const onPreviewLink = vi.fn();
    render(<AddCommunityFormSection {...baseProps({ onPreviewLink })} />);

    fireEvent.blur(screen.getByLabelText(/Grup Davetiye Linki/));
    expect(onPreviewLink).toHaveBeenCalledTimes(1);
  });
});
