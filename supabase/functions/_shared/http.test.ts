import { existsSync, readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { jsonResponse } from "./http";

describe("jsonResponse", () => {
  it("gövdeyi JSON yazar ve verilen durumu döner", async () => {
    const response = jsonResponse({ ok: true, ad: "İstanbul" }, 201, {});

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, ad: "İstanbul" });
  });

  it("Content-Type her zaman UTF-8 charset taşır (Türkçe karakter bozulmasın)", () => {
    expect(jsonResponse({}, 200, {}).headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });

  it("CORS başlıklarını korur ve çağıranın başlığı Content-Type'ı EZEMEZ", () => {
    const response = jsonResponse({}, 200, {
      "Access-Control-Allow-Origin": "https://corteqs.net",
      "Content-Type": "text/html",
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://corteqs.net");
    // Sıra önemli: Content-Type, yayılan CORS başlıklarından SONRA yazılır.
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });

  it("hata durumlarında da gövde yazılır", async () => {
    const response = jsonResponse({ error: "RATE_LIMITED" }, 429, {});

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "RATE_LIMITED" });
  });
});

// Tek kaynak sözleşmesi: 11 edge function aynı gövdeyi kendi dosyasında tekrar tanımlıyordu.
// Biri sessizce farklılaşırsa (örn. charset'i unutursa) yalnız o fonksiyonda Türkçe bozulur.
describe("jsonResponse tek kaynak sözleşmesi", () => {
  const TEK_KAYNAKLI = [
    "delete-account",
    "directory-search",
    "find-matches",
    "group-claim-verify",
    "group-preview",
    "member-cv-link",
    "relocation-assistant",
    "send-notification-emails",
    "send-submission-email",
    "site-assistant",
  ];

  for (const fn of TEK_KAYNAKLI) {
    it(`${fn} jsonResponse'u paylaşılan modülden alır, yerelde tanımlamaz`, () => {
      const path = `supabase/functions/${fn}/index.ts`;
      expect(existsSync(path), `${path} yok`).toBe(true);
      const source = readFileSync(path, "utf8");

      expect(source).toMatch(/import \{[^}]*\bjsonResponse\b[^}]*\} from "\.\.\/_shared\/http\.ts"/);
      expect(source).not.toMatch(/function jsonResponse\s*\(/);
    });
  }

  it("fonksiyon listesi güncel: aynı imzayı yerelde tanımlayan başka edge function yok", () => {
    const dirs = readdirSync("supabase/functions", { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name);
    expect(dirs.length).toBeGreaterThan(5);

    const yerelKopya = dirs.filter((fn) => {
      const path = `supabase/functions/${fn}/index.ts`;
      if (!existsSync(path)) return false;
      return /function jsonResponse\(\s*body: unknown,\s*status: number,\s*corsHeaders/.test(
        readFileSync(path, "utf8"),
      );
    });

    expect(yerelKopya, `yerel jsonResponse(body, status, corsHeaders): ${yerelKopya.join(", ")}`).toEqual([]);
  });
});
