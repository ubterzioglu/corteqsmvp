import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MessagesInbox from "./MessagesInbox";

const mocks = vi.hoisted(() => ({
  user: { id: "viewer-1" } as { id: string } | null,
  inboxRows: [
    {
      id: "msg-in-1",
      sender_id: "sender-1",
      recipient_id: "viewer-1",
      content: "Merhaba buradayim",
      created_at: "2026-06-01T10:00:00.000Z",
      read_at: null,
    },
  ],
  sentRows: [
    {
      id: "msg-out-1",
      sender_id: "viewer-1",
      recipient_id: "recipient-1",
      content: "Selam gonderdim",
      created_at: "2026-06-01T11:00:00.000Z",
      read_at: null,
    },
  ],
  profiles: [
    { user_id: "sender-1", full_name: "Ayse Kaya", email: "ayse@example.com" },
    { user_id: "recipient-1", full_name: "Mehmet Demir", email: "mehmet@example.com" },
  ],
  insertPayloads: [] as unknown[],
  updatePayloads: [] as unknown[],
  fromCalls: [] as string[],
  toast: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        mocks.fromCalls.push(table);

        if (table === "direct_messages") {
          const filters: Record<string, string> = {};
          const updateBuilder = {
            eq: vi.fn(() => updateBuilder),
            then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
          };

          const query = {
            select: vi.fn(() => query),
            eq: vi.fn((column: string, value: string) => {
              filters[column] = value;
              return query;
            }),
            order: vi.fn(() => query),
            limit: vi.fn(() => {
              if (filters.recipient_id === "viewer-1") {
                return Promise.resolve({ data: mocks.inboxRows, error: null });
              }
              if (filters.sender_id === "viewer-1") {
                return Promise.resolve({ data: mocks.sentRows, error: null });
              }
              return Promise.resolve({ data: [], error: null });
            }),
            update: vi.fn((payload: unknown) => {
              mocks.updatePayloads.push(payload);
              return updateBuilder;
            }),
            insert: vi.fn((payload: unknown) => {
              mocks.insertPayloads.push(payload);
              return Promise.resolve({ error: null });
            }),
          };

          return query;
        }

        if (table === "user_profile_attributes") {
          const query = {
            select: vi.fn(() => query),
            in: vi.fn(() => query),
            eq: vi.fn(() =>
              Promise.resolve({
                data: mocks.profiles.map((p) => ({
                  user_id: p.user_id,
                  value_text: p.full_name,
                  attribute_catalog: { key: "full_name" },
                })),
                error: null,
              }),
            ),
          };
          return query;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
      channel: vi.fn(() => {
        const channel = {
          on: vi.fn(() => channel),
          subscribe: vi.fn(() => channel),
        };
        return channel;
      }),
      removeChannel: vi.fn(),
    },
  };
});

describe("MessagesInbox", () => {
  it("shows login prompt when there is no authenticated user", () => {
    mocks.user = null;

    render(<MessagesInbox />);

    expect(screen.getByText(/Mesaj kutunu görmek için giriş yapmalısın/i)).toBeInTheDocument();
  });

  it("loads direct messages and allows replying from inbox", async () => {
    mocks.user = { id: "viewer-1" };
    mocks.fromCalls = [];
    mocks.insertPayloads = [];
    mocks.updatePayloads = [];

    render(<MessagesInbox />);

    await screen.findByText("Ayse Kaya");
    expect(mocks.fromCalls).toContain("direct_messages");
    expect(mocks.fromCalls).not.toContain("messages");
    expect(screen.getByText("Merhaba buradayim")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ayse Kaya/i }));
    fireEvent.change(screen.getByPlaceholderText(/Cevabını yaz/i), {
      target: { value: "Sana da merhaba" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Cevap Gönder/i }));

    await waitFor(() => {
      expect(mocks.insertPayloads).toContainEqual({
        sender_id: "viewer-1",
        recipient_id: "sender-1",
        content: "Sana da merhaba",
      });
    });
  });
});
