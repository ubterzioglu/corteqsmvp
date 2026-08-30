import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useChatMachine } from "@/hooks/useChatMachine";

describe("useChatMachine", () => {
  it("sendMessage güncel adımı okuyup kategori metnini kategori seçimi olarak işler", () => {
    const { result } = renderHook(() => useChatMachine());

    act(() => result.current.beginRegistration());
    expect(result.current.state.step).toBe("category");

    act(() => result.current.sendMessage("işletme"));

    expect(result.current.state.data.category).toBe("isletme");
    expect(result.current.state.step).not.toBe("category");
  });
});
