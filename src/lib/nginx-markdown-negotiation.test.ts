// Markdown içerik pazarlığı sözleşmesi (GEO, 2026-10-11).
//
// `Accept: text/markdown` ile gelen ana sayfa isteğine llms.txt döner. Kırılabilecek
// üç şey kilitlenir: (1) `location = /` markdown dışındaki istekte `location /` ile
// AYNI davranır (prerender kapısı + SPA kabuğu) — aksi hâlde botlar ana sayfada
// prerender'ı kaybeder; (2) iki bloğa da add_header girmez (kalıtılmaz, güvenlik
// başlıkları düşer — Değişmez sözleşmeler md.2); (3) dönen tür text/markdown'dır.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const nginxConf = readFileSync(resolve(process.cwd(), "nginx.conf.template"), "utf8");

/** `header {` ile başlayan location bloğunun gövdesi (2 boşluk girintili kapanışa kadar). */
function blok(header: string): string {
  return sliceBetween(nginxConf, `${header} {`, "\n  }\n", header);
}

describe("nginx markdown içerik pazarlığı", () => {
  it("Accept başlığını dar adlı bir map ile okur", () => {
    expect(nginxConf).toMatch(
      /map \$http_accept \$corteqs_wants_markdown \{\s*default 0;\s*"~\*text\/markdown" 1;\s*\}/,
    );
  });

  it("`location = /` önce markdown'u, sonra prerender kapısını, sonra SPA kabuğunu dener", () => {
    const govde = blok("location = /");
    const md = govde.indexOf("rewrite ^ /__llms_markdown last;");
    const pre = govde.indexOf("rewrite ^ /__prerender_internal last;");
    const spa = govde.indexOf("rewrite ^ /index.html last;");
    expect(md).toBeGreaterThan(0);
    expect(pre).toBeGreaterThan(md);
    expect(spa).toBeGreaterThan(pre);
    expect(govde).toMatch(/if \(\$prerender_target != 0\)/);
  });

  it("markdown yanıtı internal'dır, llms.txt'i text/markdown olarak verir", () => {
    const govde = blok("location = /__llms_markdown");
    expect(govde).toContain("internal;");
    expect(govde).toContain("alias /usr/share/nginx/html/llms.txt;");
    expect(govde).toContain("default_type text/markdown;");
    expect(govde).toContain("charset_types text/markdown;");
  });

  it("iki blokta da add_header YOKTUR (güvenlik başlıkları miras gelir)", () => {
    expect(blok("location = /")).not.toMatch(/add_header/);
    expect(blok("location = /__llms_markdown")).not.toMatch(/add_header/);
  });
});
