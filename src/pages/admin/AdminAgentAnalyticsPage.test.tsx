import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminAgentAnalyticsPage from "@/pages/admin/AdminAgentAnalyticsPage";

const { fetchAssistantUsageMock } = vi.hoisted(() => ({
  fetchAssistantUsageMock: vi.fn(),
}));

vi.mock("@/lib/assistant-usage-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/assistant-usage-api")>();
  return { ...actual, fetchAssistantUsage: fetchAssistantUsageMock };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminAgentAnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminAgentAnalyticsPage", () => {
  beforeEach(() => {
    fetchAssistantUsageMock.mockReset();
  });

  it("son 30 günlük gerçek istek ve token toplamlarını gösterir", async () => {
    fetchAssistantUsageMock.mockResolvedValue([
      {
        id: "usage-1",
        user_id: "user-1",
        function_name: "site-assistant",
        provider: "gemini",
        input_tokens: 12,
        output_tokens: 8,
        total_tokens: 20,
        status: "success",
        http_status: 200,
        created_at: "2026-09-22T08:00:00.000Z",
      },
      {
        id: "usage-2",
        user_id: "user-2",
        function_name: "relocation-assistant",
        provider: "gemini",
        input_tokens: 20,
        output_tokens: 15,
        total_tokens: 35,
        status: "success",
        http_status: 200,
        created_at: "2026-09-22T07:00:00.000Z",
      },
    ]);

    renderPage();

    expect(screen.getByText("Canlı kullanım · son 30 gün")).toBeInTheDocument();
    expect(await screen.findByText("2 istek")).toBeInTheDocument();
    expect(screen.getByText("55 token")).toBeInTheDocument();
    expect(screen.getByText("site-assistant: 1")).toBeInTheDocument();
    expect(screen.getByText("relocation-assistant: 1")).toBeInTheDocument();
  });

  it("Gemini 429 kaydı varsa görünür kota uyarısı gösterir", async () => {
    fetchAssistantUsageMock.mockResolvedValue([
      {
        id: "quota-1",
        user_id: "user-1",
        function_name: "site-assistant",
        provider: "gemini",
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        status: "quota_exceeded",
        http_status: 429,
        created_at: new Date().toISOString(),
      },
    ]);

    renderPage();

    expect(await screen.findByText("Gemini kota uyarısı")).toBeInTheDocument();
    expect(screen.getByText("Son 24 saatte 1 adet 429 yanıtı kaydedildi.")).toBeInTheDocument();
  });

  it("panel içi yardım kutusunu gösterir", async () => {
    fetchAssistantUsageMock.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("Bu panel ne anlatıyor?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Asistana sor" })).toBeInTheDocument();
  });
});
