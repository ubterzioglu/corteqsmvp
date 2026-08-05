// Anti-drift testi: src/lib/redirects.ts ↔ nginx.conf.template.
//
// Bu testin amacı yönlendirme tablosunun ikinci kopyasının sessizce eskimesini
// engellemektir. Gerçek olay (2026-08-04 denetimi): App.tsx 14 client-side
// yönlendirme tanımlıyordu, server.mjs bunların yalnız 4'ünü biliyordu, nginx
// hiçbirini bilmiyordu — ve nginx prod runtime'ı olduğu için canlıda TEK BİR
// 301 bile dönmüyordu. Kimse fark etmedi çünkü hiçbir test iki tarafı
// karşılaştırmıyordu.
//
// Test kırmızıysa doğru refleks: nginx.conf.template'i güncellemek.
// Beklentiyi gevşetmek sorunu geri getirir.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DYNAMIC_LEGACY_REDIRECTS, LEGACY_REDIRECTS } from "./redirects";

const nginxConf = readFileSync(resolve(process.cwd(), "nginx.conf.template"), "utf8");

/** Regex'te özel anlam taşıyan karakterleri kaçırır (path'lerde `.` ve `-` geçebilir). */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("LEGACY_REDIRECTS tablosu", () => {
  it("her madde mutlak yol kullanır", () => {
    for (const { from, to } of LEGACY_REDIRECTS) {
      expect(from.startsWith("/"), `from mutlak olmalı: ${from}`).toBe(true);
      expect(to.startsWith("/"), `to mutlak olmalı: ${to}`).toBe(true);
    }
  });

  it("aynı kaynak yolu iki kez tanımlanmaz", () => {
    const seen = LEGACY_REDIRECTS.map((entry) => entry.from);

    expect(new Set(seen).size).toBe(seen.length);
  });

  it("kendine yönlendiren madde yoktur (sonsuz döngü)", () => {
    for (const { from, to } of LEGACY_REDIRECTS) {
      expect(to, `${from} kendine yönleniyor`).not.toBe(from);
    }
  });

  it("yönlendirme zinciri yoktur — hedefin kendisi bir kaynak olamaz", () => {
    // /a → /b ve /b → /c olursa tarayıcı iki atlama yapar; SEO sinyali zayıflar.
    const sources = new Set(LEGACY_REDIRECTS.map((entry) => entry.from));

    for (const { from, to } of LEGACY_REDIRECTS) {
      expect(sources.has(to), `${from} → ${to} zinciri: ${to} de yönlendiriliyor`).toBe(false);
    }
  });
});

describe("nginx.conf.template ile senkron", () => {
  it("her madde için `location = <from>` bloğu vardır", () => {
    const eksik = LEGACY_REDIRECTS.filter(
      ({ from }) => !new RegExp(`location\\s*=\\s*${escapeRegex(from)}\\s*\\{`).test(nginxConf),
    ).map((entry) => entry.from);

    expect(eksik, `nginx.conf.template'te location eksik: ${eksik.join(", ")}`).toEqual([]);
  });

  it("her madde doğru hedefe 301 döner ve query string'i korur", () => {
    const hatali = LEGACY_REDIRECTS.filter(
      ({ to }) =>
        !new RegExp(`return\\s+301\\s+${escapeRegex(to)}\\$is_args\\$args\\s*;`).test(nginxConf),
    ).map((entry) => `${entry.from} → ${entry.to}`);

    expect(hatali, `301/query hedefi eksik: ${hatali.join(", ")}`).toEqual([]);
  });

  it("parametreli yönlendirmelerin de nginx karşılığı vardır", () => {
    // /auth düz `location =` ile, /whatsapp-groups/:id regex location ile karşılanır.
    expect(DYNAMIC_LEGACY_REDIRECTS).toContain("/auth");
    expect(/location\s*=\s*\/auth\s*\{/.test(nginxConf)).toBe(true);

    expect(DYNAMIC_LEGACY_REDIRECTS).toContain("/whatsapp-groups/:id");
    expect(/location\s+~\s+\^\/whatsapp-groups\/\(\.\+\)\$\s*\{/.test(nginxConf)).toBe(true);
    expect(/return\s+301\s+\/addcom\?group=\$1\s*;/.test(nginxConf)).toBe(true);
  });
});

describe("nginx güvenlik başlıkları", () => {
  // Batch 1 regresyon koruması: add_header nginx'te KALITILMAZ. Kendi add_header'ı
  // olan bir location güvenlik başlıklarını tekrarlamazsa o yolda CSP sessizce düşer.
  const KENDI_ADD_HEADERI_OLAN_LOCATIONLAR = [
    "location = /env-config.js",
    "location = /index.html",
    "location = /api/chat",
    "location /assets/",
    "location = /__prerender_internal",
  ];

  it("CSP tek kaynaktan gelir ve her ilgili location'da tekrarlanır", () => {
    const cspSatirlari = nginxConf.match(/add_header\s+Content-Security-Policy\s+\$corteqs_csp/g) ?? [];

    // server bloğu + kendi add_header'ı olan 5 location = 6
    expect(cspSatirlari.length).toBe(KENDI_ADD_HEADERI_OLAN_LOCATIONLAR.length + 1);
  });

  it("script-src'de 'unsafe-inline' yoktur", () => {
    const csp = nginxConf.match(/map \$host \$corteqs_csp \{[^}]*\}/s)?.[0] ?? "";
    const scriptSrc = csp.match(/script-src[^;]*/)?.[0] ?? "";

    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(scriptSrc).toContain("https://www.googletagmanager.com");
  });

  it("connect-src Supabase Realtime için wss şemasını içerir", () => {
    // Tarayıcılar CSP'de ws/wss şemasını https'ten AYRI değerlendirir: `https://*.supabase.co`
    // WebSocket bağlantısına izin VERMEZ. Bu eksik yüzünden Supabase Realtime 2026-08-05'e
    // kadar canlıda blokluydu; Cadde akışı anlık güncellenmiyor, yalnız periyodik yoklamayla
    // tazeleniyordu. Regex map bloğunu alır — üstündeki açıklama yorumu testi geçiremez.
    const csp = nginxConf.match(/map \$host \$corteqs_csp \{[^}]*\}/s)?.[0] ?? "";
    const connectSrc = csp.match(/connect-src[^;]*/)?.[0] ?? "";

    expect(connectSrc).toContain("wss://*.supabase.co");
    expect(connectSrc).toContain("https://*.supabase.co");
  });

  it("X-Robots-Tag blanket header'ı geri eklenmemiştir", () => {
    // Sayfa seviyesindeki meta robots yeterli; blanket "index, follow" 404 kabuğunda
    // NotFound'un noindex'ini gölgeliyordu (bkz. Batch 3).
    expect(/add_header\s+X-Robots-Tag/.test(nginxConf)).toBe(false);
  });
});

describe("nginx yapısal bütünlük", () => {
  // Bu dosyadaki bir syntax hatası konteyner açılışında nginx'i düşürür, yani SİTEYİ
  // komple indirir. `nginx -t` yerine geçmez ama en pahalı hataları (dengesiz blok,
  // eksik `;`, silinmiş yapısal öğe) CI'da yakalar.
  //
  // Not: 2026-08-04 çalışmasında plandaki `docker build` + `curl` doğrulaması
  // yapılamadı (docker daemon kapalıydı). Bu test o boşluğun bir kısmını kapatır.

  /** Yorumları atıp anlamlı satırları döndürür. */
  const kodSatirlari = nginxConf
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean);

  it("blok açma/kapama dengesi bozulmamıştır", () => {
    let derinlik = 0;
    let enDusuk = 0;

    for (const satir of kodSatirlari) {
      derinlik += (satir.match(/\{/g) ?? []).length;
      derinlik -= (satir.match(/\}/g) ?? []).length;
      enDusuk = Math.min(enDusuk, derinlik);
    }

    expect(enDusuk, "fazladan '}' var").toBe(0);
    expect(derinlik, "kapanmamış '{' var").toBe(0);
  });

  it("blok açmayan her direktif ';' ile biter", () => {
    const eksik = kodSatirlari.filter(
      (satir) => !/[{}]/.test(satir) && !satir.endsWith(";"),
    );

    expect(eksik, `';' eksik satırlar: ${eksik.join(" | ")}`).toEqual([]);
  });

  it("runtime davranışını taşıyan yapısal öğeler yerinde", () => {
    const beklenen: ReadonlyArray<readonly [string, RegExp]> = [
      ["bot tespiti", /map \$http_user_agent \$is_bot \{/],
      ["prerender dışlama (/admin, /api)", /map \$uri \$prerender_excluded \{/],
      ["birleşik prerender hedefi", /map "\$is_bot:\$prerender_excluded" \$prerender_target \{/],
      ["CSP tek kaynağı", /map \$host \$corteqs_csp \{/],
      ["rate-limit bölgesi", /limit_req_zone .*zone=ragchat/],
      ["rate-limit kullanımı", /limit_req zone=ragchat/],
      ["www/mvp → apex 301", /server_name www\.corteqs\.net mvp\.corteqs\.net;/],
      ["apex hedefi", /return 301 https:\/\/corteqs\.net\$request_uri;/],
      ["ana server bloğu", /server_name _;/],
      ["SPA fallback", /try_files \$uri \$uri\/ \/index\.html;/],
      ["prerender internal", /location = \/__prerender_internal \{/],
    ];

    const eksik = beklenen.filter(([, re]) => !re.test(nginxConf)).map(([ad]) => ad);

    expect(eksik, `eksik yapısal öğe: ${eksik.join(", ")}`).toEqual([]);
  });

  // Regresyon: 2026-08-04 deploy'unda apex (corteqs.net) ERR_TOO_MANY_REDIRECTS verdi.
  // Sebep: nginx'te `server_name _` joker değildir; hiçbir Host ile eşleşmez. Eşleşme
  // olmayınca nginx default_server'ı seçer, işaretlenmemişse bu "ilk tanımlanan blok"tur.
  // www/mvp bloğu dosyada önce geldiği için apex oraya düşüp kendine 301 attı.
  it("apex'i yakalayan blok default_server olarak işaretli (yönlendirme döngüsü koruması)", () => {
    expect(nginxConf, "`listen 80 default_server;` yok — apex www bloğuna düşüp döngü yapar").toMatch(
      /listen 80 default_server;/,
    );

    // Yönlendirme yapan www/mvp bloğu default olmamalı; olursa döngü geri gelir.
    const wwwBlok =
      nginxConf.match(/server \{[^}]*server_name www\.corteqs\.net mvp\.corteqs\.net;[^}]*\}/s)?.[0] ?? "";

    expect(wwwBlok, "www/mvp bloğu bulunamadı").not.toBe("");
    expect(wwwBlok, "301 dönen blok default_server olamaz").not.toMatch(/default_server/);
  });

  it("prerender /admin ve /api'yi dışlar", () => {
    const map = nginxConf.match(/map \$uri \$prerender_excluded \{[^}]*\}/s)?.[0] ?? "";

    expect(map).toMatch(/"~\^\/admin"\s+1;/);
    expect(map).toMatch(/"~\^\/api"\s+1;/);
  });
});
