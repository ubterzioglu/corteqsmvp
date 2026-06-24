import { describe, expect, it } from "vitest";

import {
  pseudonymize,
  redactPii,
  redactPayload,
  shouldSuppress,
} from "./anonymize";

describe("redactPii", () => {
  it("e-posta adresini siler", () => {
    expect(redactPii("yaz ali@corteqs.net diye")).toBe("yaz [email] diye");
  });

  it("telefon numarasını siler", () => {
    expect(redactPii("ara +90 532 123 45 67")).toContain("[phone]");
    expect(redactPii("ara +90 532 123 45 67")).not.toContain("532");
  });

  it("URL'yi siler", () => {
    expect(redactPii("bak https://corteqs.net/x sayfası")).toBe(
      "bak [url] sayfası",
    );
  });

  it("TC kimlik numarasını siler", () => {
    expect(redactPii("tckn 12345678901 burada")).toBe("tckn [id] burada");
  });

  it("birden çok PII'yi aynı metinde temizler", () => {
    const out = redactPii("mail ali@x.com tel +905321234567");
    expect(out).toContain("[email]");
    expect(out).toContain("[phone]");
  });

  it("boş/temiz metni değiştirmez", () => {
    expect(redactPii("merhaba dünya")).toBe("merhaba dünya");
    expect(redactPii("")).toBe("");
  });
});

describe("redactPayload", () => {
  it("iç içe nesnedeki string'leri redakte eder", () => {
    const out = redactPayload({
      name: "Ali",
      contact: { email: "ali@x.com", note: "ara 05321234567" },
      tags: ["temiz", "mail: x@y.com"],
    }) as Record<string, unknown>;
    const contact = out.contact as Record<string, unknown>;
    expect(contact.email).toBe("[email]");
    expect(contact.note).toContain("[phone]");
    expect((out.tags as string[])[1]).toContain("[email]");
  });

  it("string olmayan değerleri korur", () => {
    const out = redactPayload({ count: 5, ok: true, x: null }) as Record<string, unknown>;
    expect(out).toEqual({ count: 5, ok: true, x: null });
  });
});

describe("pseudonymize", () => {
  it("aynı girdi + pepper → aynı pseudonym (deterministik)", async () => {
    const a = await pseudonymize("ali@x.com", "pepper-1");
    const b = await pseudonymize("ali@x.com", "pepper-1");
    expect(a).toBe(b);
  });

  it("farklı pepper → farklı pseudonym", async () => {
    const a = await pseudonymize("ali@x.com", "pepper-1");
    const b = await pseudonymize("ali@x.com", "pepper-2");
    expect(a).not.toBe(b);
  });

  it("büyük/küçük harf + boşluk normalize edilir", async () => {
    const a = await pseudonymize("ALI@X.com", "p");
    const b = await pseudonymize("  ali@x.com  ", "p");
    expect(a).toBe(b);
  });

  it("ham değeri sızdırmaz (16 hex karakter)", async () => {
    const out = await pseudonymize("ali@x.com", "p");
    expect(out).toMatch(/^[0-9a-f]{16}$/);
    expect(out).not.toContain("ali");
  });

  it("boş pepper hata fırlatır", async () => {
    await expect(pseudonymize("x", "")).rejects.toThrow(/pepper/);
  });
});

describe("shouldSuppress (k-anonimlik)", () => {
  it("eşik altı baskılanır", () => {
    expect(shouldSuppress(5, 20)).toBe(true);
    expect(shouldSuppress(19, 20)).toBe(true);
  });
  it("eşik ve üstü gösterilir", () => {
    expect(shouldSuppress(20, 20)).toBe(false);
    expect(shouldSuppress(100, 20)).toBe(false);
  });
});
