import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import type { MetaReplyPayload } from "./whatsapp-reply";
import {
  buildGraphMessagesUrl,
  DEFAULT_GRAPH_VERSION,
  resolveGraphVersion,
  sendGraphMessage,
} from "./whatsapp-graph";

const TOKEN = "test-access-token-xyz";
const PHONE_ID = "123456789";
const TEXT_PAYLOAD: MetaReplyPayload = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: "49123456789",
  type: "text",
  text: { preview_url: false, body: "Merhaba" },
};

function config(overrides: Partial<{ accessToken: string; phoneNumberId: string; graphVersion: string }> = {}) {
  return {
    accessToken: overrides.accessToken ?? TOKEN,
    phoneNumberId: overrides.phoneNumberId ?? PHONE_ID,
    graphVersion: overrides.graphVersion ?? DEFAULT_GRAPH_VERSION,
  };
}

function mockFetch(response: { ok: boolean; status: number; body: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: typeof response.body === "function"
      ? response.body
      : () => Promise.resolve(response.body),
  });
}

describe("resolveGraphVersion", () => {
  it("accepts valid versions unchanged", () => {
    expect(resolveGraphVersion("v26.0")).toBe("v26.0");
    expect(resolveGraphVersion("v25.1")).toBe("v25.1");
    expect(resolveGraphVersion("v100.12")).toBe("v100.12");
  });

  it("falls back to default for invalid candidates", () => {
    for (const bad of ["26.0", "v26", "latest", "", "v26.0/../x", "v26.0 ", "xv26.0"]) {
      expect(resolveGraphVersion(bad)).toBe(DEFAULT_GRAPH_VERSION);
    }
    expect(resolveGraphVersion(undefined)).toBe(DEFAULT_GRAPH_VERSION);
    expect(resolveGraphVersion(null)).toBe(DEFAULT_GRAPH_VERSION);
  });
});

describe("buildGraphMessagesUrl", () => {
  it("builds the correct Graph API URL", () => {
    expect(buildGraphMessagesUrl(config())).toBe(
      `https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/${PHONE_ID}/messages`,
    );
  });

  it("encodes phoneNumberId", () => {
    expect(buildGraphMessagesUrl(config({ phoneNumberId: "a/b?c" }))).toBe(
      `https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/a%2Fb%3Fc/messages`,
    );
  });
});

describe("sendGraphMessage", () => {
  it("sends the correct request and returns wamid on success", async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, body: { messages: [{ id: "wamid.X" }] } });
    const result = await sendGraphMessage(config(), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch);

    expect(result).toBe("wamid.X");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/${PHONE_ID}/messages`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    });
    expect(init.body).toBe(JSON.stringify(TEXT_PAYLOAD));
  });

  it("throws meta_http_<status> on HTTP errors", async () => {
    for (const status of [401, 429, 500]) {
      const fetchMock = mockFetch({ ok: false, status, body: {} });
      await expect(
        sendGraphMessage(config(), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch),
      ).rejects.toThrow(`meta_http_${status}`);
    }
  });

  it("throws meta_http_<status> when response.json() fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("parse error")),
    });
    await expect(
      sendGraphMessage(config(), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch),
    ).rejects.toThrow("meta_http_502");
  });

  it("throws meta_http_200 when 200 but body is null or non-object", async () => {
    for (const badBody of [null, "not-json"]) {
      const fetchMock = mockFetch({ ok: true, status: 200, body: badBody });
      await expect(
        sendGraphMessage(config(), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch),
      ).rejects.toThrow("meta_http_200");
    }
  });

  it("throws meta_response_invalid when messages is missing or empty", async () => {
    for (const body of [{}, { messages: [] }]) {
      const fetchMock = mockFetch({ ok: true, status: 200, body });
      await expect(
        sendGraphMessage(config(), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch),
      ).rejects.toThrow("meta_response_invalid");
    }
  });

  it("throws meta_response_invalid when id lacks wamid. prefix or is wrong type", async () => {
    for (const body of [{ messages: [{ id: "abc" }] }, { messages: [{ id: 42 }] }, { messages: [{}] }]) {
      const fetchMock = mockFetch({ ok: true, status: 200, body });
      await expect(
        sendGraphMessage(config(), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch),
      ).rejects.toThrow("meta_response_invalid");
    }
  });

  it("never includes accessToken in error messages", async () => {
    const secretToken = "super-secret-token-DO-NOT-LEAK";
    const scenarios: Array<{ name: string; fetchMock: ReturnType<typeof vi.fn> }> = [
      { name: "http_error", fetchMock: mockFetch({ ok: false, status: 401, body: {} }) },
      { name: "invalid_response", fetchMock: mockFetch({ ok: true, status: 200, body: {} }) },
      { name: "null_body", fetchMock: mockFetch({ ok: true, status: 200, body: null }) },
    ];
    for (const { fetchMock } of scenarios) {
      await expect(
        sendGraphMessage(config({ accessToken: secretToken }), TEXT_PAYLOAD, fetchMock as unknown as typeof fetch),
      ).rejects.satisfy((err: Error) => !err.message.includes(secretToken));
    }
  });
});

describe("single-client contract", () => {
  it("graph.facebook.com appears only in _shared/whatsapp-graph.ts", () => {
    // Yalnız index.ts taramak YETMEZ: W05'in mantığı _shared/whatsapp-autoreply.ts gibi bir
    // _shared dosyasında yaşayacak ve ikinci bir Graph istemcisi tam orada saklanabilirdi.
    // Bu yüzden TÜM üretim .ts dosyaları taranır; yalnız test dosyaları (URL'yi beklenti
    // olarak yazarlar) ve tek meşru istemci hariç tutulur.
    const functionsDir = "supabase/functions";
    const allowed = "supabase/functions/_shared/whatsapp-graph.ts";
    const entries = readdirSync(functionsDir, { withFileTypes: true, recursive: true });
    const sourceFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".test.ts"))
      .map((e) => join(e.parentPath ?? e.path ?? "", e.name).replace(/\\/g, "/"));

    expect(sourceFiles.length).toBeGreaterThan(10); // tarama gerçekten dosya buldu (boş küme sahte geçer)
    expect(sourceFiles).toContain(allowed);

    const filesContainingGraph = sourceFiles.filter(
      (file) => readFileSync(file, "utf8").includes("graph.facebook.com"),
    );

    expect(filesContainingGraph).toEqual([allowed]);

    const replyIndex = readFileSync("supabase/functions/whatsapp-reply/index.ts", "utf8");
    expect(replyIndex).toContain('from "../_shared/whatsapp-graph.ts"');
  });
});
