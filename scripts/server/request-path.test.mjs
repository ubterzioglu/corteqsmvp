// server.mjs SG8/O12 güvenlik testleri — GERÇEK fonksiyona karşı.
//
// Önceki kökteki `server.test.mjs` fonksiyonun kopyasını `node:test` ile sınıyordu, hiç
// koşmuyordu ve "/../etc/passwd → null" beklentisiyle kırmızıydı. O beklenti yanlıştı:
// URL ayrıştırıcısı nokta bölümlerini önceden çözer, yol distDir içine hapsolur.
// Doğru iddia: sonuç ya null'dır ya da distDir İÇİNDE kalır.

import path from "node:path";

import { describe, expect, it } from "vitest";

import { normalizeRequestPath } from "./request-path.mjs";

const distDir = path.resolve("/app/dist");
const BACKSLASH = String.fromCharCode(0x5c);

function staysInsideDist(requestUrl) {
  const result = normalizeRequestPath(requestUrl, distDir);
  if (result === null) return true;
  return path.resolve(distDir, "." + result).startsWith(distDir);
}

describe("normalizeRequestPath (SG8/O12)", () => {
  it("normal yol olduğu gibi döner", () => {
    expect(normalizeRequestPath("http://localhost/index.html", distDir)).toBe("/index.html");
    expect(normalizeRequestPath("http://localhost/assets/main.js", distDir)).toBe("/assets/main.js");
  });

  it("ters eğik çizgi (ham ya da %5c kodlu) reddedilir", () => {
    expect(normalizeRequestPath("http://localhost/%5c..%5c.env.local", distDir)).toBeNull();
    expect(normalizeRequestPath("http://localhost/%5c.env", distDir)).toBeNull();
    expect(normalizeRequestPath("http://localhost/a%5Cb", distDir)).toBeNull();
    expect(normalizeRequestPath(`http://localhost/x${BACKSLASH}y`, distDir)).not.toContain(BACKSLASH);
  });

  it("üst dizin bölümleri distDir içine hapsolur (URL ayrıştırıcısı .. çözer)", () => {
    expect(normalizeRequestPath("http://localhost/../etc/passwd", distDir)).toBe("/etc/passwd");
    expect(staysInsideDist("http://localhost/../etc/passwd")).toBe(true);
  });

  it.each([
    "http://localhost/../../../../etc/passwd",
    "http://localhost/%2e%2e/%2e%2e/etc/passwd",
    "http://localhost/%2e%2e%2f%2e%2e%2fetc/passwd",
    "http://localhost/assets/../../.env.local",
    "http://localhost/..%2f..%2f.env.local",
    "http://localhost/%252e%252e/%252e%252e/.env",
  ])("hiçbir girdi distDir dışına çıkamaz: %s", (url) => {
    expect(staysInsideDist(url)).toBe(true);
  });
});
