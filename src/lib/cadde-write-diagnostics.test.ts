// Yazma yollarında teşhis sözleşmesi — WS2 m75 araştırmasında açılan boşluk.
//
// Bulgu (04.08.2026): okuma yolları baştan sona `reportCaddeApiError` ile
// enstrümanteydi, YAZMA yollarının 17'si de tamamen çıplaktı. RPC hatası Türkçe
// mesaja çevrilip fırlatılıyor, ham Postgres hatası hiçbir yere yazılmadan yok
// oluyordu. Bilinmeyen bir kod gelirse kullanıcı genel mesajı görüyor, kod
// kayboluyordu — "Paylaşım gönderilemedi" bu yüzden teşhis edilemiyordu.
//
// Bulgu 2 (27.09.2026, S03a): sabit API_FILES listesi BAYATLADI — depoda 12
// cadde API dosyası varken test 7'sini tarıyordu. Listede olmayan
// cadde-admin-api.ts'in 12 yazma + 4 okuma yolu hiç enstrümante edilmediği
// hâlde test yeşildi. Bu, "araç kataloğu bayatladı" kusurunun birebir tekrarı.
// Çözüm: liste yerine DİZİN TARAMASI + boş-kapsam kapanı.
//
// Sözleşme: cadde API dosyalarında `if (error) throw error;` yalnız raporlayan
// bir catch (reportCaddeApiError / caddeWriteError / caddeReadError) ile
// birlikte yaşayabilir. Aksi hâlde yazma yolu `caddeWriteError`, okuma yolu
// `caddeReadError` ile fırlatılmalı — ikisi de ham hatayı loglar ve
// client_error_reports'a düşürür.

import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// Sabit liste YASAK: yeni bölünen/eklenen cadde API dosyaları otomatik kapsanır.
const API_FILES = readdirSync("src/lib")
  .filter(
    (name) =>
      name.startsWith("cadde") &&
      name.endsWith(".ts") &&
      !name.endsWith(".test.ts") &&
      name.includes("api"),
  )
  .map((name) => `src/lib/${name}`)
  .sort();

const read = (file: string) => readFileSync(file, "utf8");

describe("cadde yazma yolu teşhis sözleşmesi", () => {
  it("tarama kapsamı boş değil — bayat/sabit liste kapanı", () => {
    // Dizin taşınır ya da filtre bozulursa liste boşalır ve diğer testler
    // sessizce "sorun yok" der. Alt sınır + bilinen kör nokta bunu engeller.
    expect(API_FILES.length).toBeGreaterThanOrEqual(11);
    expect(API_FILES).toContain("src/lib/cadde-admin-api.ts");
    expect(API_FILES).toContain("src/lib/cadde-api.ts");
  });

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

  it("dışa açık fonksiyonlarda raporlayan catch'i olmayan çıplak 'throw error' YOK", () => {
    // Kural: `if (error) throw error;` ancak aynı fonksiyon gövdesinde raporlayan
    // bir catch (reportCaddeApiError / caddeWriteError / caddeReadError) varsa yaşar.
    // İç (export edilmeyen) yardımcılar muaftır — hatayı dışa açık çağıran raporlar.
    // Satır penceresi DEĞİL fonksiyon bloğu kullanılır: uzun .map zincirleri
    // pencere sezgiselinde yanlış pozitif üretiyordu (27.09 ölçümü).
    const offenders: string[] = [];

    for (const file of API_FILES) {
      const lines = read(file).split(/\r?\n/);
      let block: { exported: boolean; startLine: number; body: string[] } | null = null;

      const flush = () => {
        if (!block || !block.exported) return;
        const body = block.body.join("\n");
        if (!body.includes("if (error) throw error;")) return;
        const hasReportingCatch =
          body.includes("catch") &&
          /(reportCaddeApiError|caddeWriteError|caddeReadError)/.test(body);
        if (!hasReportingCatch) {
          offenders.push(`${file}:${block.startLine} (fonksiyon bloğu)`);
        }
      };

      lines.forEach((line, index) => {
        const header = /^(export\s+)?(?:async\s+)?function\s+\w+/.exec(line);
        if (header) {
          flush();
          block = { exported: Boolean(header[1]), startLine: index + 1, body: [] };
        }
        block?.body.push(line);
      });
      flush();
    }

    expect(offenders).toEqual([]);
  });

  it("caddeWriteError ham hatayı loglar ve kullanıcı mesajını döner", () => {
    const source = read("src/lib/cadde-internal.ts");
    const anchor = source.indexOf("export function caddeWriteError");
    expect(anchor, "caddeWriteError tanımı bulunamadı").toBeGreaterThan(-1);

    expect(source).toContain("export function caddeWriteError");
    expect(source).toContain("console.error(`[cadde_write_error] ${context}`, error)");
    expect(source).toContain("return new Error(resolveCaddeRpcErrorMessage(error, fallback))");
    // Okuma yolunun toast'ı yazma yolunda çift/yanlış mesaj üretir — çağrılmamalı.
    const body = source.slice(anchor);
    const fnBody = body.slice(0, body.indexOf("\n}"));
    expect(fnBody).not.toContain("reportCaddeApiError");
    expect(fnBody).not.toContain("toast");
  });

  it("yazma ve okuma yolu hatası kalıcı kayda (client_error_reports) düşer — m134 kanıtı", () => {
    const source = read("src/lib/cadde-internal.ts");

    const writeAnchor = source.indexOf("export function caddeWriteError");
    expect(writeAnchor, "caddeWriteError tanımı bulunamadı").toBeGreaterThan(-1);
    const writeBody = source.slice(writeAnchor);
    expect(writeBody.slice(0, writeBody.indexOf("\n}"))).toContain(
      'reportClientError({ source: "cadde_write", context, error })',
    );

    const readAnchor = source.indexOf("export function caddeReadError");
    expect(readAnchor, "caddeReadError tanımı bulunamadı").toBeGreaterThan(-1);
    const readBody = source.slice(readAnchor);
    expect(readBody.slice(0, readBody.indexOf("\n}"))).toContain(
      'reportClientError({ source: "cadde_read", context, error })',
    );
  });
});
