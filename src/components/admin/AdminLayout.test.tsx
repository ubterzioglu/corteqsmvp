import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AdminLayout from "@/components/admin/AdminLayout";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/admin", () => ({
  userIsAdmin: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: "admin-user",
                email: "admin@corteqs.test",
              },
            },
          },
        }),
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

function renderAdminLayout(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>Admin Home Content</div>} />
          <Route path="members" element={<div>Members Content</div>} />
          <Route path="lansman" element={<div>Lansman Content</div>} />
          <Route path="workspace/command-center" element={<div>Workspace Command Center</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  it("shows demo link in header and external links inside dashboard menu", async () => {
    renderAdminLayout("/admin");

    await waitFor(() => {
      expect(screen.getByText("Admin Home Content")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /CorteQS ana siteye git/i })).toHaveAttribute("href", "https://mvp.corteqs.net");
    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "https://global-network-bridge.lovable.app/",
    );
    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: /Üyeler/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Topluluklar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Data/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Üye Takibi" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Loginli Kullanıcılar & Roller/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dış Bağlantılar" })).not.toBeInTheDocument();
    const dashboardButton = screen.getByRole("button", { name: /Dashboard/i });

    const newMemberSystemButton = screen.getByRole("button", { name: /Üyeler/i });
    fireEvent.mouseEnter(newMemberSystemButton);
    expect(await screen.findByRole("menuitem", { name: /Üye Takibi/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Loginli Kullanıcılar & Roller/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Roller & Featurelar/i })).toBeInTheDocument();
    fireEvent.mouseLeave(newMemberSystemButton);
    const communityButton = screen.getByRole("button", { name: /Topluluklar/i });
    fireEvent.mouseEnter(communityButton);
    expect(await screen.findByRole("menuitem", { name: /Topluluk Editörleri/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Topluluk Kullanma Kılavuzu/i })).toBeInTheDocument();
    fireEvent.mouseLeave(communityButton);
    const dataButton = screen.getByRole("button", { name: /^Data$/i });
    fireEvent.mouseEnter(dataButton);
    expect(await screen.findByRole("menuitem", { name: /Büyükelçilik/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Başkonsolosluk/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Konsolosluk Ofisi/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Kullanıcı Rolleri/i })).toBeInTheDocument();
    fireEvent.mouseLeave(dataButton);
    fireEvent.mouseEnter(dashboardButton);

    const externalLinksSubTrigger = await screen.findByText("Dış Bağlantılar");
    fireEvent.click(externalLinksSubTrigger);
    expect((await screen.findByRole("menuitem", { name: /Engine/i })).closest("a")).toHaveAttribute(
      "href",
      "https://eng.corteqs.net",
    );
  });

  it("shows global actions on the members page", async () => {
    renderAdminLayout("/admin/members");

    await waitFor(() => {
      expect(screen.getByText("Members Content")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Diğer Kayıtlar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yeni kayıt ekle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Referral oluştur/i })).toBeInTheDocument();

    const otherRecordsButton = screen.getByRole("button", { name: /Diğer Kayıtlar/i });
    fireEvent.mouseEnter(otherRecordsButton);
    expect(await screen.findByRole("menuitem", { name: /Lansman Katılım/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Anketler/i })).toBeInTheDocument();
    const inactiveSubTrigger = await screen.findByText("Inaktif");
    fireEvent.click(inactiveSubTrigger);
    expect(await screen.findByRole("menuitem", { name: /19 Mayıs Fikir/i })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /19 Mayıs Anı/i })).toBeInTheDocument();
  });

  it("hides global actions outside the members page", async () => {
    renderAdminLayout("/admin/lansman");

    await waitFor(() => {
      expect(screen.getByText("Lansman Content")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Diğer Kayıtlar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Yeni kayıt ekle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Referral oluştur/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export \/ Import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Toplu işlem/i })).not.toBeInTheDocument();
  });

  it("shows internal dashboard workspace links", async () => {
    renderAdminLayout("/admin/members");

    await waitFor(() => {
      expect(screen.getByText("Members Content")).toBeInTheDocument();
    });

    const dashboardButton = screen.getByRole("button", { name: /Dashboard/i });
    fireEvent.mouseEnter(dashboardButton);

    expect(screen.getAllByText("CC")[0].closest("a")).toHaveAttribute(
      "href",
      "/admin/workspace/command-center",
    );
    expect((await screen.findByRole("menuitem", { name: /^CC$/i })).closest("a")).toHaveAttribute(
      "href",
      "/admin/workspace/command-center",
    );
    const docsSubTrigger = await screen.findByText("Diğer Dokümanlar");
    fireEvent.click(docsSubTrigger);
    expect(await screen.findByText(/Kortex .* CTO, Pitch & PRD/i)).toBeInTheDocument();
    expect(await screen.findByText(/Proje Takibi/i)).toBeInTheDocument();
  });
});
