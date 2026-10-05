// GV3 · server.mjs güvenlik testleri
//
// O12: Windows path traversal koruması

import { describe, it } from "node:test";
import assert from "node:assert";
import path from "node:path";

// normalizeRequestPath mantığını test et (server.mjs ile aynı)
function normalizeRequestPath(requestUrl, distDir) {
  const pathname = new URL(requestUrl, "http://localhost").pathname;
  const decodedPath = decodeURIComponent(pathname);
  
  // SG8: Windows backslash traversal koruması
  if (decodedPath.includes("\\")) {
    return null;
  }
  
  const normalizedPath = path.posix.normalize(decodedPath);

  if (normalizedPath.startsWith("/..")) {
    return null;
  }

  // SG8: distDir dışında dosya erişimini engelle
  const resolvedPath = path.resolve(distDir, "." + normalizedPath);
  if (!resolvedPath.startsWith(path.resolve(distDir))) {
    return null;
  }

  return normalizedPath;
}

describe("server.mjs güvenlik (O12)", () => {
  const distDir = "/app/dist";

  it("Windows backslash traversal reddedilmeli", () => {
    const result = normalizeRequestPath("http://localhost/%5c..%5c.env.local", distDir);
    assert.strictEqual(result, null, "Backslash içeren path reddedilmeli");
  });

  it("Normal path kabul edilmeli", () => {
    const result = normalizeRequestPath("http://localhost/index.html", distDir);
    assert.strictEqual(result, "/index.html");
  });

  it("Parent directory traversal reddedilmeli", () => {
    const result = normalizeRequestPath("http://localhost/../etc/passwd", distDir);
    assert.strictEqual(result, null, "Parent directory reddedilmeli");
  });

  it("Encoded backslash reddedilmeli", () => {
    const result = normalizeRequestPath("http://localhost/%5c.env", distDir);
    assert.strictEqual(result, null, "Encoded backslash reddedilmeli");
  });

  it("Assets path kabul edilmeli", () => {
    const result = normalizeRequestPath("http://localhost/assets/main.js", distDir);
    assert.strictEqual(result, "/assets/main.js");
  });
});
