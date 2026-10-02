/**
 * G13 · `group-invite-read` birim testleri — G08 spike ölçümleriyle birebir.
 *
 * Sahte `fetch` ile çalışır (canlı istek YOK). Kilitlediği davranışlar:
 *   • WhatsApp: HTTP 200 ayırt edici DEĞİL — boş `og:title` = invalid (5/5 ölçüm).
 *   • Türkçe varlık kodları çözülür (`&#x131;` → `ı`) — repo kuralı: metin bozulmaz.
 *   • Telegram jenerik başlık = invalid; `og` hiç yoksa unknown (invalid değil).
 *   • Discord: API 404 = invalid; `guild.name` = ok.
 *   • Ağ hatası / timeout = unknown — doğrulamada deneme SAYMAZ (G08 kural 5).
 *   • Kod araması yumuşak: büyük/küçük harf, "·" ayraç, fazla boşluk toleranslı.
 */
import { describe, expect, it } from "vitest";

import {
  decodeHtmlEntities,
  extractDiscordInviteCode,
  findClaimCode,
  parseOgMeta,
  readInvitePage,
} from "./group-invite-read";

interface FakeResponse {
  ok: boolean;
  status: number;
  body?: string;
  json?: unknown;
}

const fakeFetch =
  (response: FakeResponse | Error) =>
  async (): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
    json: () => Promise<unknown>;
  }> => {
    if (response instanceof Error) throw response;
    return {
      ok: response.ok,
      status: response.status,
      text: async () => response.body ?? "",
      json: async () => response.json,
    };
  };

const html = (title: string | null, description: string | null = null) =>
  `<html><head>${title === null ? "" : `<meta property="og:title" content="${title}"/>`}${
    description === null ? "" : `<meta property="og:description" content="${description}"/>`
  }</head><body></body></html>`;

describe("decodeHtmlEntities — Türkçe metin bozulmaz", () => {
  it("hex ve desimal sayısal varlıkları çözer", () => {
    expect(decodeHtmlEntities("OIG- ODTU Mezunlar&#x131; InnoVenture Grup")).toBe(
      "OIG- ODTU Mezunları InnoVenture Grup",
    );
    expect(decodeHtmlEntities("&#304;stanbul &#286;")).toBe("İstanbul Ğ");
  });

  it("adlandırılmış varlıkları çözer, bilinmeyeni korur", () => {
    expect(decodeHtmlEntities("A &amp; B &lt;c&gt;")).toBe("A & B <c>");
    expect(decodeHtmlEntities("&unknownent; kaldı")).toBe("&unknownent; kaldı");
  });
});

describe("parseOgMeta — iki attribute sırası da tanınır", () => {
  it("property önce", () => {
    expect(parseOgMeta('<meta property="og:title" content="Grup"/>', "og:title")).toBe("Grup");
  });

  it("content önce", () => {
    expect(parseOgMeta('<meta content="Grup" property="og:title"/>', "og:title")).toBe("Grup");
  });

  it("og yoksa null (unknown sinyali)", () => {
    expect(parseOgMeta("<html><head></head></html>", "og:title")).toBeNull();
  });
});

describe("extractDiscordInviteCode", () => {
  it("discord.gg ve discord.com/invite", () => {
    expect(extractDiscordInviteCode("https://discord.gg/abc123")).toBe("abc123");
    expect(extractDiscordInviteCode("https://discord.com/invite/xyz-789?x=1")).toBe("xyz-789");
  });

  it("discord olmayan link → null", () => {
    expect(extractDiscordInviteCode("https://chat.whatsapp.com/ABC")).toBeNull();
  });
});

describe("findClaimCode — yumuşak arama", () => {
  it("ayraç ve büyük/küçük harf toleranslı", () => {
    expect(findClaimCode("Almanya Türkleri · CQ4821", "CQ4821")).toBe(true);
    expect(findClaimCode("grup adı cq0001 sonu", "CQ0001")).toBe(true);
    expect(findClaimCode("CQ  1234", "CQ1234")).toBe(false); // kodun İÇİNE boşluk girerse eşleşmez (desen CQ+4 bitişik)
  });

  it("kod yoksa false", () => {
    expect(findClaimCode("Sadece grup adı", "CQ1234")).toBe(false);
    expect(findClaimCode(null, "CQ1234")).toBe(false);
  });
});

describe("readInvitePage — WhatsApp (G08: 200 ayırt edici değil)", () => {
  it("dolu og:title → ok + çözülmüş ad", async () => {
    const read = await readInvitePage(
      "https://chat.whatsapp.com/X",
      "whatsapp",
      fakeFetch({ ok: true, status: 200, body: html("OIG- ODTU Mezunlar&#x131; Grup") }) as never,
    );
    expect(read.result).toBe("ok");
    expect(read.name).toBe("OIG- ODTU Mezunları Grup");
  });

  it("200 + BOŞ og:title → invalid (uydurma kod ölçümü)", async () => {
    const read = await readInvitePage(
      "https://chat.whatsapp.com/FAKE",
      "whatsapp",
      fakeFetch({ ok: true, status: 200, body: html("") }) as never,
    );
    expect(read.result).toBe("invalid");
  });

  it("og hiç yok → unknown (biçim değişti, invalid DEĞİL)", async () => {
    const read = await readInvitePage(
      "https://chat.whatsapp.com/X",
      "whatsapp",
      fakeFetch({ ok: true, status: 200, body: "<html></html>" }) as never,
    );
    expect(read.result).toBe("unknown");
  });
});

describe("readInvitePage — Telegram", () => {
  it("jenerik başlık → invalid", async () => {
    const read = await readInvitePage(
      "https://t.me/+random",
      "telegram",
      fakeFetch({ ok: true, status: 200, body: html("Join group chat on Telegram") }) as never,
    );
    expect(read.result).toBe("invalid");
  });

  it("gruba özel başlık → ok", async () => {
    const read = await readInvitePage(
      "https://t.me/grup",
      "telegram",
      fakeFetch({ ok: true, status: 200, body: html("Berlin Türkleri", "Açıklama · CQ9999") }) as never,
    );
    expect(read.result).toBe("ok");
    expect(read.name).toBe("Berlin Türkleri");
    expect(read.description).toContain("CQ9999");
  });
});

describe("readInvitePage — Discord (resmî API)", () => {
  it("200 + guild.name → ok", async () => {
    const read = await readInvitePage(
      "https://discord.gg/py",
      "discord",
      fakeFetch({ ok: true, status: 200, json: { guild: { name: "Python" } } }) as never,
    );
    expect(read.result).toBe("ok");
    expect(read.name).toBe("Python");
  });

  it("404 (10006 Unknown Invite) → invalid", async () => {
    const read = await readInvitePage(
      "https://discord.gg/uydurma",
      "discord",
      fakeFetch({ ok: false, status: 404, json: { code: 10006 } }) as never,
    );
    expect(read.result).toBe("invalid");
  });

  it("5xx → unknown", async () => {
    const read = await readInvitePage(
      "https://discord.gg/x",
      "discord",
      fakeFetch({ ok: false, status: 503 }) as never,
    );
    expect(read.result).toBe("unknown");
  });
});

describe("readInvitePage — ağ ve timeout", () => {
  it("fetch throw → unknown (deneme sayılmaz)", async () => {
    const read = await readInvitePage(
      "https://chat.whatsapp.com/X",
      "whatsapp",
      fakeFetch(new Error("network down")) as never,
    );
    expect(read.result).toBe("unknown");
  });

  it("tanınmayan platform → unknown", async () => {
    const read = await readInvitePage(
      "https://example.com",
      "signal",
      fakeFetch({ ok: true, status: 200, body: html("x") }) as never,
    );
    expect(read.result).toBe("unknown");
  });
});
