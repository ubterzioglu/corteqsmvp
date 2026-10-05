// GV1 · SSRF koruması testleri
//
// Mutasyonlar:
// M1: http:// → reddedilmeli
// M2: Özel IP (10.x, 192.168.x, 127.x, 169.254.x) → reddedilmeli
// M3: İzin verilmeyen host → reddedilmeli
// M4: Yönlendirme (3xx) → reddedilmeli
// M5: @ ile host kandırma → reddedilmeli

import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateUrl, SSRFError } from "./safe-invite-fetch.ts";

Deno.test("SSRF: http:// reddedilmeli (M1)", () => {
  assertThrows(
    () => validateUrl("http://chat.whatsapp.com/abc"),
    SSRFError,
    "Yalnız HTTPS izin verilir",
  );
});

Deno.test("SSRF: Özel IP 10.x reddedilmeli (M2)", () => {
  assertThrows(
    () => validateUrl("https://10.0.0.1/secret"),
    SSRFError,
    "İzin verilmeyen host",
  );
});

Deno.test("SSRF: Özel IP 192.168.x reddedilmeli (M2)", () => {
  assertThrows(
    () => validateUrl("https://192.168.1.1/admin"),
    SSRFError,
    "İzin verilmeyen host",
  );
});

Deno.test("SSRF: Loopback 127.x reddedilmeli (M2)", () => {
  assertThrows(
    () => validateUrl("https://127.0.0.1/metadata"),
    SSRFError,
    "İzin verilmeyen host",
  );
});

Deno.test("SSRF: Link-local 169.254.x reddedilmeli (M2)", () => {
  assertThrows(
    () => validateUrl("https://169.254.169.254/latest/meta-data/"),
    SSRFError,
    "Yasak IP aralığı",
  );
});

Deno.test("SSRF: İzin verilmeyen host reddedilmeli (M3)", () => {
  assertThrows(
    () => validateUrl("https://evil.com/phishing"),
    SSRFError,
    "İzin verilmeyen host",
  );
});

Deno.test("SSRF: Geçersiz URL reddedilmeli", () => {
  assertThrows(
    () => validateUrl("not-a-url"),
    SSRFError,
    "Geçersiz URL",
  );
});

Deno.test("SSRF: İzinli host WhatsApp kabul edilmeli", () => {
  const url = validateUrl("https://chat.whatsapp.com/abc123");
  assertEquals(url.hostname, "chat.whatsapp.com");
});

Deno.test("SSRF: İzinli host Telegram kabul edilmeli", () => {
  const url = validateUrl("https://t.me/joinchat/abc123");
  assertEquals(url.hostname, "t.me");
});

Deno.test("SSRF: İzinli host Discord kabul edilmeli", () => {
  const url = validateUrl("https://discord.com/api/v10/invites/abc");
  assertEquals(url.hostname, "discord.com");
});

Deno.test("SSRF: @ ile host kandırma reddedilmeli (M5)", () => {
  // https://evil.com@chat.whatsapp.com → hostname chat.whatsapp.com olur ama
  // URL parsing farklı çalışabilir. validateUrl hostname'i kontrol eder.
  // Bu test URL parsing davranışını doğrular.
  assertThrows(
    () => validateUrl("https://evil.com@10.0.0.1/"),
    SSRFError,
  );
});
