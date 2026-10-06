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
    // SG8: yakalama grubu `(.+)` DEĞİL, dar karakter sınıfıdır — `$1` redirect hedefine
    // girdiği için serbest metin (satır sonu, `/`, `?`) yönlendirme enjeksiyonu açar.
    expect(
      /location\s+~\s+\^\/whatsapp-groups\/\(\[A-Za-z0-9_-\]\+\)\$\s*\{/.test(nginxConf),
    ).toBe(true);
    expect(/location\s+~\s+\^\/whatsapp-groups\/\(\.\+\)\$/.test(nginxConf)).toBe(false);
    expect(/return\s+301\s+\/addcom\?group=\$1\s*;/.test(nginxConf)).toBe(true);
  });
});

describe("nginx güvenlik başlıkları", () => {
  // Batch 1 regresyon koruması: add_header nginx'te KALITILMAZ. Kendi add_header'ı
  // olan bir location güvenlik başlıklarını tekrarlamazsa o yolda CSP sessizce düşer.
  const KENDI_ADD_HEADERI_OLAN_LOCATIONLAR = [
    "location = /env-config.js",
    "location = /index.html",
    "location /assets/",
    "location = /__prerender_internal",
  ];

  it("CSP tek kaynaktan gelir ve her ilgili location'da tekrarlanır", () => {
    const cspSatirlari = nginxConf.match(/add_header\s+Content-Security-Policy\s+\$corteqs_csp/g) ?? [];

    // server bloğu + kendi add_header'ı olan 4 location = 5
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

  // --- add_header kalıtım sözleşmesi (S3-c) -------------------------------------
  // Yukarıdaki CSP testi satırları SAYIYOR. Yeni bir location yalnız `Cache-Control`
  // add_header'ı ile (CSP'siz) eklenirse CSP sayısı DEĞİŞMEZ ve test geçer — oysa o
  // yolda CSP, clickjacking ve HSTS sessizce düşer (2026-08-04'te /robots.txt'te 8
  // başlık vardı, `/` adresinde 0). Bu test her add_header'lı location'ı tek tek okur.
  const GUVENLIK_BASLIKLARI = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Permissions-Policy",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
    "Content-Security-Policy",
  ];

  type NginxLocation = { header: string; body: string; start: number; end: number };

  const yorumsuzNginx = nginxConf
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, ""))
    .join("\n");

  /** `location … { … }` bloklarını süslü parantez dengesiyle çıkarır. */
  function locationBloklari(text: string): NginxLocation[] {
    const bloklar: NginxLocation[] = [];
    const baslangic = /location\s+[^{;]+\{/g;
    let eslesme: RegExpExecArray | null;

    while ((eslesme = baslangic.exec(text)) !== null) {
      let derinlik = 1;
      let i = baslangic.lastIndex;
      while (i < text.length && derinlik > 0) {
        if (text[i] === "{") derinlik += 1;
        else if (text[i] === "}") derinlik -= 1;
        i += 1;
      }
      bloklar.push({
        header: eslesme[0].slice(0, -1).trim(),
        body: text.slice(baslangic.lastIndex, i - 1),
        start: eslesme.index,
        end: i,
      });
      baslangic.lastIndex = i;
    }
    return bloklar;
  }

  const eksikBasliklar = (govde: string) =>
    GUVENLIK_BASLIKLARI.filter((ad) => !new RegExp(`add_header\\s+${ad}\\s`).test(govde));

  it("ayrıştırıcı çalışıyor: bilinen add_header'lı location'lar bulundu", () => {
    // Çıpa kayarsa aşağıdaki testler boş listede sessizce geçer.
    const basliklilar = locationBloklari(yorumsuzNginx)
      .filter((blok) => /add_header/.test(blok.body))
      .map((blok) => blok.header);

    for (const beklenen of KENDI_ADD_HEADERI_OLAN_LOCATIONLAR) {
      expect(basliklilar, `${beklenen} bulunamadı`).toContain(beklenen);
    }
  });

  it("add_header içeren HER location 8 güvenlik başlığının tamamını taşır", () => {
    const ihlaller = locationBloklari(yorumsuzNginx)
      .filter((blok) => /add_header/.test(blok.body))
      .map((blok) => ({ blok: blok.header, eksik: eksikBasliklar(blok.body) }))
      .filter(({ eksik }) => eksik.length > 0)
      .map(({ blok, eksik }) => `${blok} → eksik: ${eksik.join(", ")}`);

    expect(
      ihlaller,
      `add_header KALITILMAZ — bu location'larda güvenlik başlıkları sessizce düşer: ${ihlaller.join(" | ")}`,
    ).toEqual([]);
  });

  it("server düzeyinde (location dışında) 8 güvenlik başlığı tanımlıdır", () => {
    // Kendi add_header'ı olmayan location'lar (/lansman, /commercial, `/`, 301'ler)
    // başlıkları BURADAN miras alır; silinirse hepsi birden düşer.
    let sunucuDuzeyi = yorumsuzNginx;
    for (const blok of locationBloklari(yorumsuzNginx).reverse()) {
      sunucuDuzeyi = sunucuDuzeyi.slice(0, blok.start) + sunucuDuzeyi.slice(blok.end);
    }

    expect(eksikBasliklar(sunucuDuzeyi), "server düzeyinde eksik güvenlik başlığı").toEqual([]);
  });

  // S8a: `.txt` dosyaları (llms.txt, .well-known/ai.txt) charset'siz `text/plain` dönerse
  // istemci Latin-1 varsayabilir ve Türkçe karakterler bozulur. Çözüm `charset` DİREKTİFİdir;
  // `add_header Content-Type` DEĞİL — o hem ikinci bir Content-Type ekler hem de bulunduğu
  // location'da üst bloktaki 8 güvenlik başlığını iptal eder (add_header kalıtılmaz).
  it("server düzeyinde charset utf-8 tanımlıdır ve add_header ile YAPILMAZ", () => {
    const sunucuDuzeyi = (() => {
      let metin = yorumsuzNginx;
      for (const blok of locationBloklari(yorumsuzNginx).reverse()) {
        metin = metin.slice(0, blok.start) + metin.slice(blok.end);
      }
      return metin;
    })();

    expect(sunucuDuzeyi, "server düzeyinde `charset utf-8;` yok").toMatch(/^\s*charset\s+utf-8\s*;/m);
    // Hiçbir yerde Content-Type'ı add_header ile ezme girişimi olmamalı.
    expect(yorumsuzNginx).not.toMatch(/add_header\s+Content-Type\b/i);
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

  // SG03 (2026-10-05 ölçümü): nginx vekilin arkasında 80'i dinler; mutlak Location
  // `http://` yazıyordu ve canlıda http:// 404 döner.
  it("yönlendirmeler göreli Location üretir (absolute_redirect off)", () => {
    expect(nginxConf).toMatch(/^\s*absolute_redirect off;/m);
  });

  // SG01/SG02: dist'te aynı adlı dizini olan rotalar dizin 301'ine düşmemeli
  // (/commercial'da meta refresh ile SONSUZ döngü vardı).
  it("/lansman ve /commercial dizin yönlendirmesini atlar, prerender kapısını korur", () => {
    for (const [rota, hedef] of [
      ["/lansman", "/lansman/index.html"],
      ["/commercial", "/index.html"],
    ] as const) {
      const kacis = rota.replace(/\//g, "\\/");
      const blok = nginxConf.match(new RegExp(`location = ${kacis} \\{[\\s\\S]*?\\n  \\}`))?.[0] ?? "";

      expect(blok, `${rota} tam eşleşme bloğu yok`).not.toBe("");
      expect(blok).toMatch(/if \(\$prerender_target != 0\) \{\s*rewrite \^ \/__prerender_internal last;/);
      expect(blok).toContain(`rewrite ^ ${hedef} last;`);
      expect(blok, "kendi add_header'ı olursa güvenlik başlıkları düşer").not.toMatch(/add_header/);
    }
  });

  it("prerender /admin ve /api'yi dışlar", () => {
    const map = nginxConf.match(/map \$uri \$prerender_excluded \{[^}]*\}/s)?.[0] ?? "";

    expect(map).toMatch(/"~\^\/admin"\s+1;/);
    expect(map).toMatch(/"~\^\/api"\s+1;/);
  });
});
