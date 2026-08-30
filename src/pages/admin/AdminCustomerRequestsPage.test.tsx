import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCustomerRequestsPage from "@/pages/admin/AdminCustomerRequestsPage";

const mocks = vi.hoisted(() => ({
  listThreads: vi.fn(),
  listMessages: vi.fn(),
  listTemplates: vi.fn(),
  updateThread: vi.fn(),
  sendReply: vi.fn(),
  currentAdmin: vi.fn(),
}));

vi.mock("@/lib/customer-requests", () => ({
  listCustomerRequestThreads: mocks.listThreads,
  listCustomerRequestMessages: mocks.listMessages,
  listApprovedWhatsAppTemplates: mocks.listTemplates,
  updateCustomerRequestThread: mocks.updateThread,
  sendCustomerRequestReply: mocks.sendReply,
  currentAdminUserId: mocks.currentAdmin,
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminCustomerRequestsPage />
    </QueryClientProvider>,
  );
}

describe("AdminCustomerRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listThreads.mockResolvedValue([
      {
        id: "22222222-2222-4222-8222-222222222222",
        status: "new",
        assignedTo: null,
        lastInboundAt: "2026-08-28T10:00:00.000Z",
        lastMessageAt: "2026-08-28T10:00:00.000Z",
        expiresAt: "2026-11-26T10:00:00.000Z",
        createdAt: "2026-08-28T10:00:00.000Z",
        latestMessagePreview: "Üyelik hakkında bilgi almak istiyorum.",
        latestDirection: "inbound",
        messageCount: 1,
      },
    ]);
    mocks.listMessages.mockResolvedValue([
      {
        id: "message-1",
        direction: "inbound",
        messageType: "text",
        body: "Üyelik hakkında bilgi almak istiyorum.",
        templateName: null,
        templateLanguage: null,
        deliveryStatus: "received",
        errorCode: null,
        createdBy: null,
        createdAt: "2026-08-28T10:00:00.000Z",
      },
    ]);
    mocks.listTemplates.mockResolvedValue([]);
  });

  it("forces an approved template outside the 24-hour service window", async () => {
    renderPage();

    expect(await screen.findByText("Üyelik hakkında bilgi almak istiyorum.")).toBeInTheDocument();
    expect(screen.getByText("Yalnız onaylı template gönderilebilir")).toBeInTheDocument();
    expect(screen.getByText("Doğrulanmış, parametresiz ve onaylı template kaydı yok.")).toBeInTheDocument();
    expect(screen.queryByLabelText("WhatsApp yanıt metni")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yanıtı gönder" })).toBeDisabled();
  });
});
