/**
 * CD02 · `useCaddeComposerState` düzenleme mutasyonu sözleşmesi.
 *
 * Kilitler:
 *   • startEditing composer'ı gönderi verisiyle doldurur (body/media/konum).
 *   • updateMutation → `updateCaddePost`: postId + body + medya TAM liste +
 *     konum TEK hedef (T3) — **mentions YOK** (T1: RPC null'da anmaları korur).
 *   • Ülke seçili değilse targets HİÇ gönderilmez (null=dokunma semantiği).
 *   • Başarı: edit modu kapanır, composer sıfırlanır, onPublished + toast.
 *   • Hata: "Paylaşım güncellenemedi" destructive toast (sessiz yutma yok).
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const updateCaddePostSpy = vi.fn();
const toastSpy = vi.fn();

vi.mock("@/lib/cadde-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cadde-api")>();
  return { ...actual, updateCaddePost: (...args: unknown[]) => updateCaddePostSpy(...args) };
});

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastSpy }) }));

import { useCaddeComposerState } from "@/hooks/cadde/useCaddeComposerState";

const EDITING_POST = {
  id: "11111111-1111-1111-1111-111111111111",
  body: "Mevcut paylaşım metni",
  media: [{ kind: "image" as const, url: "https://x/y.png", path: "u/post/y.png" }],
  country: "Almanya",
  city: "Berlin",
};

const setup = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const onPublished = vi.fn().mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () =>
      useCaddeComposerState({
        canPost: true,
        diasporaKey: "tr",
        registeredCountry: "Almanya",
        registeredCity: "Berlin",
        onPublished,
      }),
    { wrapper },
  );
  return { hook, onPublished };
};

beforeEach(() => {
  vi.clearAllMocks();
  updateCaddePostSpy.mockResolvedValue(undefined);
});

describe("useCaddeComposerState · düzenleme", () => {
  it("startEditing composer'ı doldurur, editingPostId set eder", () => {
    const { hook } = setup();

    act(() => hook.result.current.startEditing(EDITING_POST));

    expect(hook.result.current.editingPostId).toBe(EDITING_POST.id);
    expect(hook.result.current.composer.body).toBe(EDITING_POST.body);
    expect(hook.result.current.composer.media).toEqual(EDITING_POST.media);
    expect(hook.result.current.composer.country).toBe("Almanya");
    expect(hook.result.current.composer.city).toBe("Berlin");
  });

  it("updateMutation: postId + body + medya TAM liste + TEK hedef — mentions YOK (T1)", async () => {
    const { hook, onPublished } = setup();

    act(() => hook.result.current.startEditing(EDITING_POST));
    await act(async () => {
      await hook.result.current.updateMutation.mutateAsync();
    });

    expect(updateCaddePostSpy).toHaveBeenCalledTimes(1);
    const payload = updateCaddePostSpy.mock.calls[0][0];
    expect(payload).toEqual({
      postId: EDITING_POST.id,
      body: EDITING_POST.body,
      media: EDITING_POST.media,
      targets: [{ country: "Almanya", city: "Berlin" }],
    });
    expect(payload).not.toHaveProperty("mentions");

    // Başarı etkileri
    await waitFor(() => expect(hook.result.current.editingPostId).toBeNull());
    expect(hook.result.current.composer.body).toBe("");
    expect(onPublished).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith({ title: "Paylaşım güncellendi" });
  });

  it("ülke seçili değilse targets HİÇ gönderilmez (konuma dokunma)", async () => {
    const { hook } = setup();

    act(() => hook.result.current.startEditing({ ...EDITING_POST, country: "", city: "" }));
    await act(async () => {
      await hook.result.current.updateMutation.mutateAsync();
    });

    const payload = updateCaddePostSpy.mock.calls[0][0];
    expect(payload).not.toHaveProperty("targets");
  });

  it("edit modu değilken updateMutation çağrılamaz (postId yok)", async () => {
    const { hook } = setup();

    await act(async () => {
      await expect(hook.result.current.updateMutation.mutateAsync()).rejects.toThrow(
        "Düzenlenen paylaşım bulunamadı.",
      );
    });
    expect(updateCaddePostSpy).not.toHaveBeenCalled();
  });

  it("boş body + boş medya reddedilir (istemci ön kontrolü)", async () => {
    const { hook } = setup();

    act(() => hook.result.current.startEditing({ ...EDITING_POST, body: "", media: [] }));
    await act(async () => {
      await expect(hook.result.current.updateMutation.mutateAsync()).rejects.toThrow(
        "Paylaşım metni veya en az bir görsel/video ekle.",
      );
    });
    expect(updateCaddePostSpy).not.toHaveBeenCalled();
  });

  it("hata → destructive toast 'Paylaşım güncellenemedi', edit modu AÇIK kalır", async () => {
    const { hook } = setup();
    updateCaddePostSpy.mockRejectedValue(new Error("Bu işlem yalnız paylaşım sahibine veya moderatöre açık."));

    act(() => hook.result.current.startEditing(EDITING_POST));
    await act(async () => {
      await hook.result.current.updateMutation.mutateAsync().catch(() => undefined);
    });

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith({
        title: "Paylaşım güncellenemedi",
        description: "Bu işlem yalnız paylaşım sahibine veya moderatöre açık.",
        variant: "destructive",
      }),
    );
    // Kullanıcının yazdığı kaybolmasın: edit modu ve içerik korunur.
    expect(hook.result.current.editingPostId).toBe(EDITING_POST.id);
    expect(hook.result.current.composer.body).toBe(EDITING_POST.body);
  });

  it("cancelEditing her şeyi sıfırlar", () => {
    const { hook } = setup();

    act(() => hook.result.current.startEditing(EDITING_POST));
    act(() => hook.result.current.cancelEditing());

    expect(hook.result.current.editingPostId).toBeNull();
    expect(hook.result.current.composer.body).toBe("");
  });
});
