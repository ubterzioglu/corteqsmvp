// Yazma yollarında teşhis sözleşmesi — WS2 m75 araştırmasında açılan boşluk.
//
// Bulgu (04.08.2026): okuma yolları baştan sona `reportCaddeApiError` ile
// enstrümanteydi, YAZMA yollarının 17'si de tamamen çıplaktı. RPC hatası Türkçe
// mesaja çevrilip fırlatılıyor, ham Postgres hatası hiçbir yere yazılmadan yok
// oluyordu. Bilinmeyen bir kod gelirse kullanıcı genel mesajı görüyor, kod
// kayboluyordu — "Paylaşım gönderilemedi" bu yüzden teşhis edilemiyordu.
//
// Bu test kaynak METNİNİ tarar: yeni bir yazma yolu ham
// `throw new Error(resolveCaddeRpcErrorMessage(...))` kalıbını geri getirirse düşer.
// Doğru kalıp: `throw caddeWriteError("<fonksiyonAdi>", error)`.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const API_FILES = [
  "src/lib/cadde-api.ts",
  "src/lib/cadde-carsi-api.ts",
  "src/lib/cadde-moderation-api.ts",
  "src/lib/cadde-tanitim-api.ts",
];

const read = (file: string) => readFileSync(file, "utf8");

describe("cadde yazma yolu teşhis sözleşmesi", () => {
  it("hiçbir yazma yolu ham resolveCaddeRpcErrorMessage ile fırlatmaz", () => {
    const offenders: string[] = [];

    for (const file of API_FILES) {
      read(file)
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (line.includes("throw new Error(resolveCaddeRpcErrorMessage(")) {
            offenders.push(`${file}:${index + 1}`);
          }
        });
    }

    expect(offenders).toEqual([]);
  });

  it("yazma yolları caddeWriteError kullanır ve bağlam adı geçirir", () => {
    const withoutContext: string[] = [];
    let total = 0;

    for (const file of API_FILES) {
      read(file)
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (!line.includes("caddeWriteError(")) return;
          total += 1;
          // Bağlam adı olmadan çağrı log'u anlamsız kılar ("[cadde_write_error] undefined").
          if (!/caddeWriteError\("[A-Za-z0-9_]+",/.test(line)) {
            withoutContext.push(`${file}:${index + 1}`);
          }
        });
    }

    // Tarama boşa düşerse test sessizce "sorun yok" der; alt sınır bunu engeller.
    expect(total).toBeGreaterThanOrEqual(17);
    expect(withoutContext).toEqual([]);
  });

  it("caddeWriteError ham hatayı loglar ve kullanıcı mesajını döner", () => {
    const source = read("src/lib/cadde-internal.ts");

    expect(source).toContain("export function caddeWriteError");
    expect(source).toContain("console.error(`[cadde_write_error] ${context}`, error)");
    expect(source).toContain("return new Error(resolveCaddeRpcErrorMessage(error, fallback))");
    // Okuma yolunun toast'ı yazma yolunda çift/yanlış mesaj üretir — çağrılmamalı.
    const body = source.slice(source.indexOf("export function caddeWriteError"));
    const fnBody = body.slice(0, body.indexOf("\n}"));
    expect(fnBody).not.toContain("reportCaddeApiError");
    expect(fnBody).not.toContain("toast");
  });
});
