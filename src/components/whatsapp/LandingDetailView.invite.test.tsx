// G03b sözleşmesi — "Katıl" düğmesi HİÇBİR DURUMDA sessizce kaybolmaz.
//
// Davet linki artık satırla gelmiyor (`whatsapp_landings_public` onu `null` döner);
// yalnız girişli kullanıcıya RPC ile veriliyor. Eski kod `hasLink` yanlışsa düğmeyi
// hiç çizmiyordu — o davranış bırakılsaydı ziyaretçi için "Katıl" düğmesi SESSİZCE
// yok olurdu ve kullanıcı sitenin bozuk olduğunu sanırdı.
//
// Dört durumun dördünün de görünür bir karşılığı olmak ZORUNDA. Bu testi gevşetme.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingDetailView, type LandingInviteState } from "@/components/whatsapp/LandingDetailView";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

const landing = {
  id: "berlin-yazilimcilar",
  dbId: "11111111-1111-1111-1111-111111111111",
  groupName: "Berlin Yazılımcıları",
  platform: "whatsapp",
  category: "is",
  country: "Almanya",
  city: "Berlin",
  mode: "text",
  // ⚠️ View bu alanı artık boş döndürüyor — testte de boş.
  whatsappLink: "",
  memberApproved: false,
  adminApproved: true,
  editorReviewPending: false,
  status: "approved",
  createdAt: "2026-01-01T00:00:00.000Z",
} as unknown as WhatsAppLanding;

function renderDetail(invite: LandingInviteState, onRequestSignIn = vi.fn()) {
  render(
    <MemoryRouter>
      <TooltipProvider>
        <LandingDetailView
        loading={false}
        landing={landing}
        canEdit={false}
        copied={false}
        invite={invite}
        onBackToList={vi.fn()}
        onShare={vi.fn()}
          onRequestSignIn={onRequestSignIn}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
  return { onRequestSignIn };
}

describe("G03b · LandingDetailView davet düğmesi", () => {
  it("link hazırsa gerçek dış bağlantı çizer", () => {
    renderDetail({ kind: "ready", url: "https://chat.whatsapp.com/ABC123" });

    const link = screen.getByRole("link", { name: /whatsapp|katıl|gruba/i });
    expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/ABC123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("girişsiz ziyaretçiye 'Giriş yap ve katıl' GÖSTERİR — düğme kaybolmaz", () => {
    renderDetail({ kind: "signed_out" });

    expect(screen.getByRole("button", { name: "Giriş yap ve katıl" })).toBeInTheDocument();
    // Girişsizken ham link HİÇBİR YERDE olmamalı.
    expect(screen.queryByRole("link", { name: /katıl|gruba/i })).not.toBeInTheDocument();
  });

  it("girişsiz düğme giriş akışını tetikler", async () => {
    const user = userEvent.setup();
    const { onRequestSignIn } = renderDetail({ kind: "signed_out" });

    await user.click(screen.getByRole("button", { name: "Giriş yap ve katıl" }));
    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
  });

  it("yüklenirken görünür bir bekleme durumu gösterir", () => {
    renderDetail({ kind: "loading" });
    expect(screen.getByRole("button", { name: /Davet linki alınıyor/ })).toBeDisabled();
  });

  it("link alınamazsa SEBEBİ YAZAR (sessiz kaybolma yok)", () => {
    renderDetail({ kind: "unavailable", message: "Bu grubun davet linki henüz eklenmemiş." });

    expect(screen.getByRole("status")).toHaveTextContent("Bu grubun davet linki henüz eklenmemiş.");
  });

  it("⚠️ regresyon kilidi: linki boş grupta bile bir şey çizilir", () => {
    // Canlıda yayındaki 10 grubun 2'sinin linki boş. Eski davranışta bu gruplarda
    // sayfada hiçbir eylem görünmüyordu.
    const states: LandingInviteState[] = [
      { kind: "signed_out" },
      { kind: "loading" },
      { kind: "unavailable", message: "Bu grubun davet linki henüz eklenmemiş." },
      { kind: "ready", url: "https://chat.whatsapp.com/XYZ" },
    ];

    for (const state of states) {
      const view = render(
        <MemoryRouter>
          <TooltipProvider>
            <LandingDetailView
            loading={false}
            landing={landing}
            canEdit={false}
            copied={false}
            invite={state}
            onBackToList={vi.fn()}
            onShare={vi.fn()}
              onRequestSignIn={vi.fn()}
            />
          </TooltipProvider>
        </MemoryRouter>,
      );
      // ⚠️ "sayfada herhangi bir düğme var mı" diye BAKMA — "Sayfayı Paylaş"
      // her durumda var, o yüzden böyle bir iddia hep geçer (vakum test).
      // KATILMAYA AİT bir eylem aranmalı.
      const joinAffordance =
        view.queryByRole("link", { name: /katıl|gruba|whatsapp|telegram/i }) ??
        view.queryByRole("button", { name: /Giriş yap ve katıl|Davet linki alınıyor/ }) ??
        view.queryByRole("status");
      expect(joinAffordance, `${state.kind} durumunda katılma eylemi çizilmedi`).not.toBeNull();
      view.unmount();
    }
  });
});
