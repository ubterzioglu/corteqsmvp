import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import {
  fetchCounterpartNames,
  fetchReceivedMessages,
  fetchSentMessages,
  markDirectMessageRead,
  sendDirectMessage,
} from "./messages-api";

describe("messages-api", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("fetchReceivedMessages: recipient_id'ye göre son 200 mesajı en yeniden eskiye ister", () => {
    const limit = vi.fn().mockReturnValue("recv-result");
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ select });

    const result = fetchReceivedMessages("user-1");

    expect(fromMock).toHaveBeenCalledWith("direct_messages");
    expect(eq).toHaveBeenCalledWith("recipient_id", "user-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(200);
    expect(result).toBe("recv-result");
  });

  it("fetchSentMessages: sender_id'ye göre sorgular", () => {
    const limit = vi.fn().mockReturnValue("sent-result");
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ select });

    const result = fetchSentMessages("user-1");

    expect(eq).toHaveBeenCalledWith("sender_id", "user-1");
    expect(result).toBe("sent-result");
  });

  it("fetchCounterpartNames: user_profile_attributes'ı full_name anahtarına filtreler", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [{ user_id: "u1", value_text: "Ayşe" }], error: null });
    const inFn = vi.fn(() => ({ eq }));
    const select = vi.fn(() => ({ in: inFn }));
    fromMock.mockReturnValue({ select });

    const result = await fetchCounterpartNames(["u1", "u2"]);

    expect(fromMock).toHaveBeenCalledWith("user_profile_attributes");
    expect(inFn).toHaveBeenCalledWith("user_id", ["u1", "u2"]);
    expect(eq).toHaveBeenCalledWith("afs_attributes.key", "full_name");
    expect(result.data).toEqual([{ user_id: "u1", value_text: "Ayşe" }]);
  });

  it("markDirectMessageRead: id ve recipient_id ile update eder", () => {
    const eq2 = vi.fn().mockReturnValue("update-result");
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    fromMock.mockReturnValue({ update });

    const result = markDirectMessageRead("msg-1", "user-1", "2026-09-13T00:00:00.000Z");

    expect(update).toHaveBeenCalledWith({ read_at: "2026-09-13T00:00:00.000Z" });
    expect(eq1).toHaveBeenCalledWith("id", "msg-1");
    expect(eq2).toHaveBeenCalledWith("recipient_id", "user-1");
    expect(result).toBe("update-result");
  });

  it("sendDirectMessage: payload'ı olduğu gibi insert eder", () => {
    const insert = vi.fn().mockReturnValue("insert-result");
    fromMock.mockReturnValue({ insert });

    const payload = { sender_id: "a", recipient_id: "b", content: "merhaba" };
    const result = sendDirectMessage(payload as never);

    expect(insert).toHaveBeenCalledWith(payload);
    expect(result).toBe("insert-result");
  });
});
