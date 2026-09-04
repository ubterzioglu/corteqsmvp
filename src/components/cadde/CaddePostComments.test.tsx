// Yorum paneli — "yükleme hatası ≠ hiç yorum yok" sözleşmesi.
//
// Kusur (04.09.2026): listCaddePostComments FIRLATIYOR, yani isError doğru kuruluyordu
// ama panel onu hiç çizmiyordu. Sonuç: RLS reddi / ağ hatası ekranda
// "İlk yorumu sen bırak ve konuşmayı başlat." olarak görünüyordu — kullanıcı hatayı
// boşluk sanıyordu. Aynı kusur sınıfı cadde-internal.ts'te (caddeReadError notu,
// 04.08.2026) okuma yolları için zaten belgelenmişti.
//
// Kural gereği toast ATILMAZ (hata kartı zaten görünür), satır içi kart + "Tekrar dene".

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CaddePostComments from "@/components/cadde/CaddePostComments";

const listCaddePostComments = vi.fn();

vi.mock("@/lib/cadde-api", () => ({
  listCaddePostComments: (...args: unknown[]) => listCaddePostComments(...args),
  createCaddeComment: vi.fn(),
}));

const renderPanel = () => {
  // retry kapalı: test hatayı beklemeden görsün.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CaddePostComments postId="post-1" commentCount={0} canComment={false} />
    </QueryClientProvider>,
  );
};

describe("CaddePostComments — hata/boşluk ayrımı", () => {
  it("yükleme hatasında hata kartı çizer, 'ilk yorumu sen bırak' YAZMAZ", async () => {
    listCaddePostComments.mockRejectedValue(new Error("RLS reddi"));
    renderPanel();

    // Panel kapalıyken sorgu hiç çalışmaz (m21) — önce aç.
    screen.getByTestId("cadde-post-comments-toggle").click();

    await waitFor(() => {
      expect(screen.getByTestId("cadde-post-comments-error")).toBeInTheDocument();
    });

    // Asıl regresyon: hata, boşlukmuş gibi gösterilmemeli.
    expect(screen.queryByText(/İlk yorumu sen bırak/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tekrar dene/ })).toBeInTheDocument();
  });

  it("gerçekten yorum yoksa boş durum mesajı çizilir, hata kartı çizilmez", async () => {
    listCaddePostComments.mockResolvedValue({ items: [], nextCursor: null });
    renderPanel();

    screen.getByTestId("cadde-post-comments-toggle").click();

    await waitFor(() => {
      expect(screen.getByText(/İlk yorumu sen bırak/)).toBeInTheDocument();
    });

    expect(screen.queryByTestId("cadde-post-comments-error")).not.toBeInTheDocument();
  });
});
