// A11c — üç nokta menüsü + onay diyaloğu sözleşmesi.
//
// Kural: silme DOĞRUDAN olmaz; önce onay diyaloğu. Yetki denetimi DB'dedir
// (delete_cadde_post_v1) — bu test istemci akışını kilitler: menü → Sil →
// onay → RPC(postId). "Vazgeç" hiçbir şey çağırmaz.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CaddePostMenu from "@/components/cadde/CaddePostMenu";

const deleteCaddePostMock = vi.fn();

vi.mock("@/lib/cadde-api", () => ({
  deleteCaddePost: (...args: unknown[]) => deleteCaddePostMock(...args),
}));

beforeEach(() => {
  deleteCaddePostMock.mockReset();
});

function renderMenu() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CaddePostMenu postId="post-1" />
    </QueryClientProvider>,
  );
}

describe("CaddePostMenu — üç nokta menüsü (A11c)", () => {
  it("Sil onay diyaloğu açar, onay RPC'yi postId ile çağırır", async () => {
    const user = userEvent.setup();
    deleteCaddePostMock.mockResolvedValue(undefined);
    renderMenu();

    await user.click(screen.getByTestId("cadde-post-menu-trigger"));
    await user.click(await screen.findByRole("menuitem", { name: /Sil/ }));

    expect(
      await screen.findByText("Bu paylaşımı silmek istiyor musun?")
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("cadde-post-delete-confirm"));

    await waitFor(() => expect(deleteCaddePostMock).toHaveBeenCalledWith("post-1"));
  });

  it("Vazgeç RPC'yi çağırmaz ve diyaloğu kapatır", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByTestId("cadde-post-menu-trigger"));
    await user.click(await screen.findByRole("menuitem", { name: /Sil/ }));
    await user.click(await screen.findByText("Vazgeç"));

    await waitFor(() =>
      expect(
        screen.queryByText("Bu paylaşımı silmek istiyor musun?")
      ).not.toBeInTheDocument()
    );
    expect(deleteCaddePostMock).not.toHaveBeenCalled();
  });

  it("A11d: Paylaş maddesi onShare'i çağırır, silme RPC'sine DOKUNMAZ", async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CaddePostMenu postId="post-1" onShare={onShare} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByTestId("cadde-post-menu-trigger"));
    await user.click(await screen.findByRole("menuitem", { name: /Paylaş/ }));

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(deleteCaddePostMock).not.toHaveBeenCalled();
  });

  it("onShare verilmeyince Paylaş maddesi hiç çizilmez", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByTestId("cadde-post-menu-trigger"));

    expect(await screen.findByRole("menuitem", { name: /Sil/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Paylaş/ })).not.toBeInTheDocument();
  });
});
