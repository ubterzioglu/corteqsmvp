// Cadde yorum kutusu seçim takibi — canlı çökmenin sözleşme testi.
//
// 27 Eylül 2026'da Cadde sayfası yorum yazılırken tamamen düştü
// ("Cannot read properties of null (reading 'selectionStart')", 4 kayıt).
// Kök neden: `event.currentTarget` durum güncelleyicisinin İÇİNDE okunuyordu.
// React güncelleyiciyi olay işleyicisi bittikten SONRA çağırır; o anda
// `currentTarget` null'dur.
//
// Bu test olayı GERÇEK koşulda taklit eder: currentTarget'ı işleyici döndükten
// sonra null'a çeker. Düzeltme geri alınırsa test patlar. Gevşetmeyin —
// `currentTarget`ı bir güncelleyici içinde okumak her zaman bu hataya açıktır.

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SyntheticEvent } from "react";

vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: () => ({ data: undefined, fetchNextPage: vi.fn(), hasNextPage: false }),
  useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useQueryClient: () => ({ setQueryData: vi.fn(), invalidateQueries: vi.fn(), getQueryData: vi.fn() }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/cadde-api", () => ({
  createCaddeComment: vi.fn(),
  listCaddePostComments: vi.fn(),
  recordCaddeShare: vi.fn(),
  reportCaddeEntity: vi.fn(),
  toggleCaddeReaction: vi.fn(),
}));

import { useCaddePostEngagement } from "./useCaddePostEngagement";

/**
 * React'in davranışını taklit eder: işleyici döndüğü anda `currentTarget` boşalır.
 * Güncelleyici içinden okunursa null'a erişilir ve hata fırlar.
 */
function makeExpiringEvent(start: number, end: number) {
  const target: { selectionStart: number | null; selectionEnd: number | null } = {
    selectionStart: start,
    selectionEnd: end,
  };
  const event = { currentTarget: target as unknown } as SyntheticEvent<HTMLTextAreaElement> & {
    currentTarget: unknown;
  };
  const expire = () => {
    (event as { currentTarget: unknown }).currentTarget = null;
  };
  return { event, expire };
}

const renderEngagement = () =>
  renderHook(() =>
    useCaddePostEngagement({
      currentUserId: "user-1",
      diasporaKey: "tr",
      canInteract: true,
    } as never),
  );

// ⚠️ Buraya "çökmemeli" diye bir `not.toThrow()` testi EKLEMEYİN: React hatayı
// kendi sınırında yakalayıp konsola yazdığı için o test düzeltme geri alınsa
// DA GEÇER — yanlış güven verir (denendi, ölçüldü). Aşağıdaki iki test hatayı
// gerçekten yakalar: düzeltme geri alındığında canlıdaki mesajın aynısıyla
// ("Cannot read properties of null (reading 'selectionStart')") patlarlar.
describe("syncCommentSelection — currentTarget yaşam süresi", () => {
  // `commentSelections` iç durumdur, dışa verilmez. Doğru okunduğunu dışarıdan
  // görünen davranışla kanıtlıyoruz: emoji tam imlecin bulunduğu yere girmeli.
  it("seçimi olay geçerliyken okur — emoji doğru konuma girer", () => {
    const { result } = renderEngagement();

    act(() => {
      result.current.setCommentDrafts({ "post-1": "merhaba dunya" });
    });

    const { event, expire } = makeExpiringEvent(7, 7); // "merhaba" ile " dunya" arası
    act(() => {
      result.current.syncCommentSelection("post-1", event);
      expire();
    });

    act(() => {
      result.current.insertCommentEmoji("post-1", "🙂");
    });

    expect(result.current.commentDrafts["post-1"]).toBe("merhaba🙂 dunya");
  });

  it("seçili metni emoji ile değiştirir (start ≠ end)", () => {
    const { result } = renderEngagement();

    act(() => {
      result.current.setCommentDrafts({ "post-1": "merhaba dunya" });
    });

    const { event, expire } = makeExpiringEvent(8, 13); // "dunya" seçili
    act(() => {
      result.current.syncCommentSelection("post-1", event);
      expire();
    });

    act(() => {
      result.current.insertCommentEmoji("post-1", "🙂");
    });

    expect(result.current.commentDrafts["post-1"]).toBe("merhaba 🙂");
  });
});
