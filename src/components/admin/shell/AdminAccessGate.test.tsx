import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminShell from "@/components/admin/shell/AdminShell";

const mocks = vi.hoisted(() => ({
  session: null as unknown,
  userIsAdmin: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/admin", () => ({
  userIsAdmin: mocks.userIsAdmin,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getSession: () => Promise.resolve({ data: { session: mocks.session } }),
      signInWithPassword: mocks.signInWithPassword,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signOut: mocks.signOut,
    },
  },
}));

const adminSession = {
  user: { id: "admin-user", email: "admin@corteqs.test" },
};

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<div>Admin Home Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.session = adminSession;
  mocks.userIsAdmin.mockReset().mockResolvedValue(true);
  mocks.signOut.mockReset().mockResolvedValue({ error: null });
  mocks.signInWithPassword.mockReset().mockResolvedValue({ error: null });
  mocks.resetPasswordForEmail.mockReset().mockResolvedValue({ error: null });
});

describe("AdminAccessGate / AdminShell erişim akışı", () => {
  it("session yoksa login formu gösterir", async () => {
    mocks.session = null;
    renderShell();

    expect(await screen.findByText("Admin Giriş")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("E-posta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giriş Yap" })).toBeInTheDocument();
    expect(screen.queryByText("Admin Home Content")).not.toBeInTheDocument();
  });

  it("admin kullanıcıda shell içeriğini render eder", async () => {
    renderShell();

    expect(await screen.findByText("Admin Home Content")).toBeInTheDocument();
    expect(mocks.userIsAdmin).toHaveBeenCalledWith("admin-user");
  });

  it("admin olmayan kullanıcıda erişim reddi gösterir ve admin_users'a referans vermez", async () => {
    mocks.userIsAdmin.mockResolvedValue(false);
    const { container } = renderShell();

    expect(
      await screen.findByText("Bu hesabın yönetici yetkisi bulunmuyor"),
    ).toBeInTheDocument();
    expect(screen.getByText(/is_admin\(\) kontrolü üzerinden doğrulanır/)).toBeInTheDocument();
    expect(screen.getByText("admin@corteqs.test")).toBeInTheDocument();
    expect(container.textContent).not.toContain("admin_users");
    expect(screen.queryByText("Admin Home Content")).not.toBeInTheDocument();
  });

  it("is_admin RPC hatasında error state gösterir, denied'a düşmez", async () => {
    mocks.userIsAdmin.mockRejectedValue(new Error("RPC failure"));
    renderShell();

    expect(await screen.findByText("Yetki kontrolü başarısız")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tekrar Dene" })).toBeInTheDocument();
    expect(screen.queryByText("Bu hesabın yönetici yetkisi bulunmuyor")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Home Content")).not.toBeInTheDocument();
  });

  it("error state'te Tekrar Dene yetki kontrolünü yeniden çalıştırır", async () => {
    mocks.userIsAdmin.mockRejectedValueOnce(new Error("RPC failure")).mockResolvedValue(true);
    renderShell();

    fireEvent.click(await screen.findByRole("button", { name: "Tekrar Dene" }));

    expect(await screen.findByText("Admin Home Content")).toBeInTheDocument();
  });

  it("logout sonrası login formuna döner", async () => {
    renderShell();
    expect(await screen.findByText("Admin Home Content")).toBeInTheDocument();

    // Çıkış artık topbar'daki kullanıcı menüsünün içinde.
    fireEvent.keyDown(screen.getByRole("button", { name: "Kullanıcı menüsü" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Çıkış/i }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalled();
    });
    expect(await screen.findByText("Admin Giriş")).toBeInTheDocument();
    expect(screen.queryByText("Admin Home Content")).not.toBeInTheDocument();
  });

  it("login formu signInWithPassword'ü çağırır", async () => {
    mocks.session = null;
    renderShell();

    fireEvent.change(await screen.findByPlaceholderText("E-posta"), {
      target: { value: "admin@corteqs.test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Şifre"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "admin@corteqs.test",
        password: "secret",
      });
    });
  });

  it("şifremi unuttum akışı resetPasswordForEmail'i çağırır", async () => {
    mocks.session = null;
    renderShell();

    fireEvent.change(await screen.findByPlaceholderText("E-posta"), {
      target: { value: "admin@corteqs.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Şifremi unuttum" }));

    await waitFor(() => {
      expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
        "admin@corteqs.test",
        expect.objectContaining({ redirectTo: expect.stringContaining("/reset-password") }),
      );
    });
  });
});
