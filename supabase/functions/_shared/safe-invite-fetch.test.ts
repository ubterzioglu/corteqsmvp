// GV1 · SSRF koruması testleri (vitest)
//
// ⚠️ Bu dosya önce `Deno.test` + `https://deno.land/std` ile yazılmıştı. Deno bu makinede
// kurulu değil ve vitest o URL'i yükleyemediği için TEST DOSYASI HİÇ ÇALIŞMADI; "11 test,
// 5 mutasyon" iddiası doğrulanmamıştı. Yeniden yazılırken bir beklenti de yanlış çıktı:
// 169.254.169.254 için "Yasak IP aralığı" bekleniyordu, oysa izinli-host denetimi önce
// çalıştığından gerçek mesaj "İzin verilmeyen host"tur (BLOCKED_IP_PATTERNS fiilen ikinci
// savunma hattıdır; izinli listede IP bulunmadığı için ona hiç ulaşılmaz).

import { describe, expect, it, vi } from "vitest";

import {
  safeFetch,
  safeReadText,
  SSRFError,
  validateUrl,
  type SafeFetchImpl,
  type SafeFetchResponse,
} from "./safe-invite-fetch";

const reddedilir = (url: string, mesaj?: string) => {
  expect(() => validateUrl(url), url).toThrow(SSRFError);
  if (mesaj) expect(() => validateUrl(url)).toThrow(mesaj);
};

describe("validateUrl — protokol", () => {
  it("http:// reddedilir", () => reddedilir("http://chat.whatsapp.com/abc", "Yalnız HTTPS"));

  it("https dışı şemalar reddedilir (ftp, data, javascript, file)", () => {
    for (const url of [
      "ftp://chat.whatsapp.com/x",
      "data:text/html,<script>1</script>",
      "javascript:alert(1)",
      "file:///etc/passwd",
    ]) {
      reddedilir(url);
    }
  });

  it("geçersiz URL reddedilir", () => {
    reddedilir("not-a-url", "Geçersiz URL");
    reddedilir("", "Geçersiz URL");
  });
});

describe("validateUrl — host izinli listesi", () => {
  it("özel/loopback/metadata IP'leri reddedilir", () => {
    for (const url of [
      "https://10.0.0.1/secret",
      "https://192.168.1.1/admin",
      "https://127.0.0.1/metadata",
      "https://169.254.169.254/latest/meta-data/",
      "https://172.16.0.1/",
      "https://[::1]/",
      "https://0.0.0.0/",
    ]) {
      reddedilir(url, "İzin verilmeyen host");
    }
  });

  it("izinli olmayan host reddedilir", () => {
    reddedilir("https://evil.com/phishing", "İzin verilmeyen host");
  });

  it("izinli ada benzeyen host'lar reddedilir (alt alan / sonek / yol / nokta)", () => {
    for (const url of [
      "https://chat.whatsapp.com.evil.com/abc",
      "https://evil.com/chat.whatsapp.com",
      "https://notchat.whatsapp.com/abc",
      "https://evil-t.me/x",
      "https://chat.whatsapp.com./abc", // sondaki nokta: fail-closed
    ]) {
      reddedilir(url, "İzin verilmeyen host");
    }
  });

  it("@ ile host kandırma: GERÇEK host izinli değilse reddedilir", () => {
    // userinfo `chat.whatsapp.com`, gerçek host evil.com → hostname evil.com.
    reddedilir("https://chat.whatsapp.com@evil.com/", "İzin verilmeyen host");
    reddedilir("https://evil.com@10.0.0.1/", "İzin verilmeyen host");
  });

  it("izinli hostlar kabul edilir (büyük/küçük harf duyarsız)", () => {
    expect(validateUrl("https://chat.whatsapp.com/abc123").hostname).toBe("chat.whatsapp.com");
    expect(validateUrl("https://CHAT.WhatsApp.com/abc123").hostname).toBe("chat.whatsapp.com");
    expect(validateUrl("https://t.me/joinchat/abc123").hostname).toBe("t.me");
    expect(validateUrl("https://discord.com/api/v10/invites/abc").hostname).toBe("discord.com");
    expect(validateUrl("https://discord.gg/abc").hostname).toBe("discord.gg");
  });

  it("userinfo gerçek host izinliyse hostname izinlidir (gerçek host whatsapp, SSRF değil)", () => {
    // WHATWG: https://evil.com@chat.whatsapp.com → hostname chat.whatsapp.com.
    // İstek yine izinli host'a gider; belgeleme amaçlı kilitlenir.
    expect(validateUrl("https://evil.com@chat.whatsapp.com/x").hostname).toBe("chat.whatsapp.com");
  });
});

// --- safeFetch -------------------------------------------------------------

const yanit = (durum: number, govde = "tamam"): SafeFetchResponse => ({
  ok: durum >= 200 && durum < 300,
  status: durum,
  text: async () => govde,
  json: async () => ({}),
});

describe("safeFetch", () => {
  it("geçersiz URL için fetchImpl HİÇ çağrılmaz", async () => {
    const send = vi.fn<SafeFetchImpl>(async () => yanit(200));

    await expect(safeFetch("https://evil.com/x", { fetchImpl: send })).rejects.toThrow(SSRFError);
    await expect(safeFetch("http://chat.whatsapp.com/x", { fetchImpl: send })).rejects.toThrow(SSRFError);
    expect(send).not.toHaveBeenCalled();
  });

  it("enjekte edilen fetchImpl doğrulamayı ATLATAMAZ (doğrulama her zaman önce)", async () => {
    // Test dikişi üretim güvenliğini zayıflatmamalı: kötü URL + 'başarılı' sahte fetch → yine ret.
    const send = vi.fn<SafeFetchImpl>(async () => yanit(200, "gizli"));

    await expect(safeFetch("https://169.254.169.254/latest/meta-data/", { fetchImpl: send })).rejects.toThrow(
      "İzin verilmeyen host",
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("yönlendirme takibini kapatır (redirect: manual) ve zaman aşımı sinyali verir", async () => {
    const send = vi.fn<SafeFetchImpl>(async () => yanit(200));

    await safeFetch("https://chat.whatsapp.com/abc", { headers: { "User-Agent": "x" }, fetchImpl: send });

    expect(send).toHaveBeenCalledTimes(1);
    const [url, init] = send.mock.calls[0];
    expect(url).toBe("https://chat.whatsapp.com/abc");
    expect(init.redirect).toBe("manual");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers).toEqual({ "User-Agent": "x" });
  });

  it("3xx yanıtını reddeder (yönlendirmeyle izinli listeyi aşma)", async () => {
    for (const durum of [301, 302, 307, 308]) {
      const send: SafeFetchImpl = async () => yanit(durum);
      await expect(safeFetch("https://t.me/abc", { fetchImpl: send }), String(durum)).rejects.toThrow(
        "Yönlendirme izin verilmez",
      );
    }
  });

  it("2xx/4xx/5xx yanıtlarını olduğu gibi döndürür (karar çağıranın)", async () => {
    for (const durum of [200, 404, 500]) {
      const sonuc = await safeFetch("https://t.me/abc", { fetchImpl: async () => yanit(durum) });
      expect(sonuc.status).toBe(durum);
    }
  });
});

// --- safeReadText ----------------------------------------------------------

describe("safeReadText — gövde boyut tavanı (256 KB)", () => {
  it("tavan altındaki akışı UTF-8 olarak çözer (Türkçe bozulmaz)", async () => {
    const response = new Response("İstanbul Ğüşiöç merhaba");

    expect(await safeReadText(response as unknown as SafeFetchResponse)).toBe("İstanbul Ğüşiöç merhaba");
  });

  it("tavanı aşan akışı reddeder", async () => {
    const buyuk = new Response("a".repeat(256 * 1024 + 1));

    await expect(safeReadText(buyuk as unknown as SafeFetchResponse)).rejects.toThrow("Gövde çok büyük");
  });

  it("tam tavandaki akış kabul edilir (sınır değeri)", async () => {
    const sinir = new Response("a".repeat(256 * 1024));

    expect((await safeReadText(sinir as unknown as SafeFetchResponse)).length).toBe(256 * 1024);
  });

  it("akışı olmayan yanıtta da AYNI tavan uygulanır", async () => {
    const tavanAsan: SafeFetchResponse = { ...yanit(200), text: async () => "a".repeat(256 * 1024 + 1) };

    await expect(safeReadText(tavanAsan)).rejects.toThrow(SSRFError);
    expect(await safeReadText(yanit(200, "kısa metin"))).toBe("kısa metin");
  });
});
