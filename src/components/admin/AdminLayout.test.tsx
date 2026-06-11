// Admin Panel V2 shell testleri — compatibility wrapper (AdminLayout)
// üzerinden yeni registry tabanlı sidebar/topbar deneyimini doğrular.

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLayout from "@/components/admin/AdminLayout";
import { ADMIN_UPDATES } from "@/lib/admin-shell/admin-updates";

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
          <Route path="data" element={<div>Unified Data Content</div>} />
          <Route path="surveys" element={<div>Surveys Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("AdminLayout (Admin Panel V2 shell)", () => {
  it("sidebar registry'deki ana ekran linklerini gösterir", async () => {
    renderAdminLayout("/admin");

    await waitFor(() => {
      expect(screen.getByText("Admin Home Content")).toBeInTheDocument();
    });

    // "Üyeler ve Dizin" defaultOpen olduğundan linkleri doğrudan görünür.
    expect(screen.getByRole("link", { name: "Kayıt Veritabanı" })).toHaveAttribute("href", "/admin/data");
    expect(screen.getByRole("link", { name: "Approval Queue" })).toHaveAttribute("href", "/admin/approvals");

    // Kapalı gruplar başlığa tıklanınca açılır.
    fireEvent.click(screen.getByRole("button", { name: "Operasyon Workspace" }));
    expect(screen.getByRole("link", { name: "Command Center" })).toHaveAttribute(
      "href",
      "/admin/workspace/command-center",
    );
    fireEvent.click(screen.getByRole("button", { name: "Muhasebe" }));
    expect(screen.getByRole("link", { name: "Muhasebe Dashboard" })).toHaveAttribute("href", "/admin/muhasebe");
    expect(screen.getByRole("button", { name: "Roller ve AFS" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /CorteQS ana siteye git/i })).toHaveAttribute(
      "href",
      "https://corteqs.net",
    );
  });

  it("inactive ekranlar ayrı İnaktif bölümünde gizlidir", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    expect(screen.queryByRole("link", { name: "19 Mayıs Kelime" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "İnaktif" }));

    expect(screen.getByRole("link", { name: "19 Mayıs Kelime" })).toHaveAttribute("href", "/admin/may19/kelime");
    expect(screen.getByRole("link", { name: "Roller Taslak" })).toHaveAttribute("href", "/admin/roller-taslak");
  });

  it("dış bağlantılar menüsü registry'deki external linkleri sunar", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    // Radix dropdown trigger'ı jsdom'da klavye ile açılır.
    fireEvent.keyDown(screen.getByRole("button", { name: "Dış bağlantılar" }), { key: "Enter" });

    const engineItem = await screen.findByRole("menuitem", { name: /Engine/i });
    expect(engineItem.closest("a")).toHaveAttribute("href", "https://eng.corteqs.net");
    expect((await screen.findByRole("menuitem", { name: /Founders/i })).closest("a")).toHaveAttribute(
      "href",
      "https://corteqs.net/founders",
    );
  });

  it("breadcrumb aktif sayfayı grup zinciriyle gösterir", async () => {
    renderAdminLayout("/admin/data");
    await screen.findByText("Unified Data Content");

    const breadcrumb = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(breadcrumb).toHaveTextContent("Üyeler ve Dizin");
    expect(breadcrumb).toHaveTextContent("Kayıt Veritabanı");
  });

  it("hamburger mobil drawer'ı aynı registry ile açar", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    fireEvent.click(screen.getByRole("button", { name: "Admin menüsünü aç" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("CorteQS Admin");
    // defaultOpen grup item'ı doğrudan görünür; kapalı grupların başlıkları görünür.
    expect(dialog).toHaveTextContent("Kayıt Veritabanı");
    expect(dialog).toHaveTextContent("Operasyon Workspace");
    expect(dialog).toHaveTextContent("Muhasebe");
    expect(dialog).toHaveTextContent("Çıkış");
  });

  it("sidebar daraltma durumu localStorage'a yazılır", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    fireEvent.click(screen.getByRole("button", { name: "Menüyü daralt" }));

    expect(window.localStorage.getItem("corteqs.admin.sidebar.collapsed.v1")).toBe("true");
    expect(screen.getByRole("button", { name: "Menüyü genişlet" })).toBeInTheDocument();
  });

  it("Ctrl+K command palette'i açar ve alias ile bulur", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByPlaceholderText(/Ekran ara/);
    fireEvent.change(input, { target: { value: "override" } });

    expect(await within(dialog).findByText("Feature Override")).toBeInTheDocument();
    expect(within(dialog).queryByText("Haber Bandı")).not.toBeInTheDocument();
  });

  it("Cmd+K ile açılan palette'ten seçim route'a gider", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByPlaceholderText(/Ekran ara/);
    fireEvent.change(input, { target: { value: "anket" } });
    fireEvent.click(await within(dialog).findByText("Anketler"));

    await waitFor(() => {
      expect(screen.getByText("Surveys Content")).toBeInTheDocument();
    });
  });

  it("sidebar yıldızı favorilere ekler, Favoriler bölümü belirir ve persist eder", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    fireEvent.click(screen.getByRole("button", { name: "Approval Queue favorilere ekle" }));

    expect(JSON.parse(window.localStorage.getItem("corteqs.admin.favorite-pages.v1")!)).toEqual([
      "approvals",
    ]);
    expect(screen.getByText("Favoriler")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Approval Queue" })).toHaveLength(2);

    // Yıldız hem grup item'ında hem Favoriler bölümündeki kopyada görünür.
    fireEvent.click(screen.getAllByRole("button", { name: "Approval Queue favorilerden çıkar" })[0]);
    expect(JSON.parse(window.localStorage.getItem("corteqs.admin.favorite-pages.v1")!)).toEqual([]);
  });

  it("route ziyaretleri son kullanılanlara kaydedilir", async () => {
    renderAdminLayout("/admin/data");
    await screen.findByText("Unified Data Content");

    const stored = JSON.parse(window.localStorage.getItem("corteqs.admin.recent-pages.v1")!);
    expect(stored[0]).toEqual({ path: "/admin/data", label: "Kayıt Veritabanı" });
  });

  it("topbar ve sidebar kılavuza (/admin/guide) link verir", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    expect(screen.getByRole("link", { name: "Kullanım kılavuzu" })).toHaveAttribute("href", "/admin/guide");
    expect(screen.getByRole("link", { name: "Yardım — kullanım kılavuzu" })).toHaveAttribute(
      "href",
      "/admin/guide",
    );
  });

  it("güncellemeler rozeti okunmamış sayıyı gösterir, menü açılınca okundu sayılır", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    const expectedBadge = ADMIN_UPDATES.length > 9 ? "9+" : String(ADMIN_UPDATES.length);
    expect(screen.getByText(expectedBadge)).toBeInTheDocument();

    // Radix dropdown trigger'ı jsdom'da klavye ile açılır.
    fireEvent.keyDown(screen.getByRole("button", { name: "Güncellemeler" }), { key: "Enter" });

    expect(await screen.findByText(ADMIN_UPDATES[0].title)).toBeInTheDocument();
    expect((await screen.findByRole("menuitem", { name: "Tümünü gör" })).closest("a")).toHaveAttribute(
      "href",
      "/admin/about",
    );
    expect(JSON.parse(window.localStorage.getItem("corteqs.admin.updates-seen.v1")!)).toEqual(
      ADMIN_UPDATES.map((update) => update.id),
    );

    await waitFor(() => {
      expect(screen.queryByText(expectedBadge)).not.toBeInTheDocument();
    });
  });

  it("kullanıcı menüsü e-posta ve çıkış aksiyonunu içerir", async () => {
    renderAdminLayout("/admin");
    await screen.findByText("Admin Home Content");

    fireEvent.keyDown(screen.getByRole("button", { name: "Kullanıcı menüsü" }), { key: "Enter" });

    expect(await screen.findByText("admin@corteqs.test")).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: /Çıkış/i })).toBeInTheDocument();
    expect((await screen.findByRole("menuitem", { name: /Ürün Güncellemeleri/i })).closest("a")).toHaveAttribute(
      "href",
      "/admin/about",
    );
  });
});
