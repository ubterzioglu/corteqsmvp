import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, requestNewCatalogItemMock, toastMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  requestNewCatalogItemMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: rpcMock },
}));

vi.mock("@/lib/member-profile-api", () => ({
  requestNewCatalogItem: requestNewCatalogItemMock,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import RequestNewProfileDialog from "@/components/profile/RequestNewProfileDialog";

describe("RequestNewProfileDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({
      data: [{ key: "Consultant_HealthcareDoctor", label: "Danışman — Doktor", description: null }],
      error: null,
    });
    requestNewCatalogItemMock.mockResolvedValue("req-1");
  });

  it("submits the selected role, title and note", async () => {
    const onSuccess = vi.fn();
    render(<RequestNewProfileDialog open onOpenChange={() => {}} onSuccess={onSuccess} />);

    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith("get_flat_roles"));

    fireEvent.change(await screen.findByLabelText("Profil Başlığı"), {
      target: { value: "Dr. Ahmet Yılmaz Danışmanlık" },
    });
    fireEvent.change(screen.getByLabelText("Kısa Açıklama"), {
      target: { value: "Diş hekimiyim" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Talebi Gönder" }));

    await waitFor(() =>
      expect(requestNewCatalogItemMock).toHaveBeenCalledWith(
        "Consultant_HealthcareDoctor",
        "Dr. Ahmet Yılmaz Danışmanlık",
        "Diş hekimiyim",
      ),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Talep gönderildi" }),
    );
  });

  it("shows an error toast when the RPC rejects", async () => {
    requestNewCatalogItemMock.mockRejectedValue(
      new Error("a pending new profile request already exists"),
    );
    render(<RequestNewProfileDialog open onOpenChange={() => {}} onSuccess={() => {}} />);

    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith("get_flat_roles"));
    fireEvent.change(await screen.findByLabelText("Profil Başlığı"), {
      target: { value: "Başlık" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Talebi Gönder" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Talep gönderilemedi",
          description: "a pending new profile request already exists",
          variant: "destructive",
        }),
      ),
    );
  });
});
