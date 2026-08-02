import { describe, expect, it } from "vitest";

import { insertTextAtSelection } from "@/lib/cadde-text-insert";

describe("insertTextAtSelection", () => {
  it("inserts text at the caret", () => {
    expect(insertTextAtSelection("Merhaba dunya", "😊", { start: 8, end: 8 })).toEqual({
      value: "Merhaba 😊dunya",
      caret: 10,
    });
  });

  it("replaces the selected range", () => {
    expect(insertTextAtSelection("Cadde eski", "yeni", { start: 6, end: 10 })).toEqual({
      value: "Cadde yeni",
      caret: 10,
    });
  });

  it("clamps stale selection indexes to the current value", () => {
    expect(insertTextAtSelection("Kisa", "✨", { start: 20, end: 30 })).toEqual({
      value: "Kisa✨",
      caret: 5,
    });
  });
});
