import { describe, expect, it } from "vitest";

import { buildAssistantCorsHeaders, isAssistantOriginAllowed, readJsonWithLimit } from "./edge-security.ts";

describe("assistant edge CORS policy", () => {
  it("allows only the documented production and local development origins", () => {
    expect(isAssistantOriginAllowed("https://corteqs.net")).toBe(true);
    expect(isAssistantOriginAllowed("http://localhost:5173")).toBe(true);
    expect(isAssistantOriginAllowed("https://evil.example")).toBe(false);
    expect(isAssistantOriginAllowed(null)).toBe(false);
  });

  it("echoes an allowed origin and never grants an unknown origin", () => {
    expect(buildAssistantCorsHeaders(new Request("https://functions.example", { headers: { Origin: "https://corteqs.net" } })))
      .toMatchObject({ "Access-Control-Allow-Origin": "https://corteqs.net", Vary: "Origin" });
    expect(buildAssistantCorsHeaders(new Request("https://functions.example", { headers: { Origin: "https://evil.example" } })))
      .not.toHaveProperty("Access-Control-Allow-Origin");
  });

  it("rejects declared and actual bodies above the byte limit", async () => {
    await expect(readJsonWithLimit(new Request("https://functions.example", { method: "POST", headers: { "content-length": "11" }, body: "{}" }), 10))
      .rejects.toThrow("PAYLOAD_TOO_LARGE");
    await expect(readJsonWithLimit(new Request("https://functions.example", { method: "POST", body: JSON.stringify({ text: "ççççç" }) }), 10))
      .rejects.toThrow("PAYLOAD_TOO_LARGE");
  });
});
