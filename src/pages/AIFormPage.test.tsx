import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AIFormPage from "@/pages/AIFormPage";

Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

vi.mock("@/hooks/useChatMachine", () => ({
  useChatMachine: () => ({
    state: {
      step: "welcome",
      messages: [
        {
          id: "1",
          role: "bot",
          content: "Merhaba! Ben CorteQS Asistanı.",
          timestamp: Date.now(),
          quickReplies: [{ label: "Kayıt Ol 🚀", value: "__start__" }],
        },
      ],
      data: {
        category: null,
        fullname: null,
        country: null,
        city: null,
        business: null,
        field: null,
        email: null,
        phone: null,
        referral_source: null,
        referral_detail: null,
        referral_code: null,
        offers_needs: null,
        contest_interest: false,
        whatsapp_interest: false,
        consent: false,
      },
      documentFiles: [],
      loading: false,
      error: null,
      submitted: false,
      stepHistory: ["welcome"],
      prefillCity: null,
    },
    sendMessage: vi.fn(),
    goBack: vi.fn(),
    selectQuickReply: vi.fn(),
    uploadFiles: vi.fn(),
    removeFile: vi.fn(),
    submit: vi.fn(),
    prefillCity: vi.fn(),
    beginRegistration: vi.fn(),
    appendMessage: vi.fn(),
  }),
}));

describe("AIFormPage", () => {
  it("renders the AI registration section and links the classic form CTA to /form", () => {
    render(
      <MemoryRouter>
        <AIFormPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sorularını Sor!/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ben Form Dolduracağım/i })).toHaveAttribute("href", "/form");
    expect(screen.getByText("CorteQS Asistanı")).toBeInTheDocument();
  });
});
