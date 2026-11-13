// "Lovable'dan gelmesin" sözleşme testi (batch L3.3).
//
// Lovable'da üretilmiş tasarım corteqs.net'e taşınırken kod değil GÖRÜNÜM alınır. Lovable'ın
// altyapısına, mock verisine ya da başka bir Supabase projesine bağlanan tek bir satır bile
// canlıya sızarsa hata vermez: istek başka bir sunucuya gider, rastgele avatar başka bir
// siteden yüklenir, çağrı "başarılı" döner. Bu sınıfın kusuru SESSİZDİR; bu test onu kapatır.
//
// Kapsam: izlenen VE henüz izlenmeyen (`git ls-files --others --exclude-standard`) metin
// dosyaları — yeni eklenen dosya commit'ten önce de taranır. Dizinler: `src/`,
// `supabase/functions/`, `public/**` ve kök yapılandırma dosyaları (`index.html`,
// `vite.config.ts`, `nginx.conf.template`, `package.json`). Gitignore'lu `referanslovable/`
// klonu bilerek DIŞARIDA — o klon Lovable kodunun kendisidir.
// `lovable-tagger` (geliştirme eklentisi, `vite.config.ts`) SERBESTTİR ve burada yoktur.
//
// ⚠️ `GGVBLA-` BİLEREK listede YOK. Barış 08.11 kararı: `GGVBLA-M7SDSR` bizim gerçek
// kampanya kodumuz, `src/components/Founding1000Section.tsx`'te kalır — yasak listeye girmez.
// Aynı nedenle çıplak `lovable.app` de YOK: `src/lib/investor/investor-route.ts` onu bilerek kullanır.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

/** Taranan metin uzantıları (görsel/font gibi ikili dosyalar dışarıda). */
const TEXT_EXTENSIONS = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|html|css|svg|toml|sql|txt|xml|sh|template)$/;

/** Varsayılan kapsam: uygulama kodu ve edge function'lar. */
const APP_SCOPE = [
  "src/",
  "supabase/functions/",
  "public/",
  "index.html",
  "vite.config.ts",
  "nginx.conf.template",
  "package.json",
];

/** `MockStripeCheckout` için depo geneli KOD kapsamı (migration geçmişi değişmezdir, dahil değil). */
const REPO_CODE_SCOPE = ["src/", "supabase/functions/", "workers/", "e2e/", "public/", "scripts/"];

/**
 * Yasak dizgeler. `reason` tek satırlık Türkçe gerekçedir. `testsMayMention`: bu dizgeyi
 * OLUMSUZ iddia olarak anan test dosyaları serbesttir (yalnız `MockStripeCheckout`).
 */
export const FORBIDDEN = [
  {
    needle: "ai.gateway.lovable.dev",
    reason:
      "Lovable'ın yapay zekâ ağ geçidi; çağrı kendi Gemini/edge function hattımızı atlar ve Lovable kredisinden yer.",
    scope: APP_SCOPE,
  },
  {
    needle: "LOVABLE_API_KEY",
    reason: "Lovable'a özgü gizli anahtar adı; bizim ortamımızda tanımsızdır, kod sessizce boş anahtarla çalışır.",
    scope: APP_SCOPE,
  },
  {
    needle: "@lovable.dev/cloud-auth-js",
    reason: "Lovable Cloud kimlik doğrulama paketi; oturum kendi Supabase Auth'umuzdan geçmelidir.",
    scope: APP_SCOPE,
  },
  {
    needle: "/__l5e/",
    reason: "Lovable önizleme/proxy yolu; canlı sitede çözümlenmez ve istek 404'e düşer.",
    scope: APP_SCOPE,
  },
  {
    needle: "diasporaconnect.com",
    reason: "Lovable prototipinin örnek alan adı; gerçek bağlantı ya da e-posta sanılır, başka bir siteye gider.",
    scope: APP_SCOPE,
  },
  {
    needle: "i.pravatar.cc",
    reason:
      "Rastgele sahte avatar servisi; gerçek üye fotoğrafı gibi görünür ve ziyaretçi verisini üçüncü tarafa sızdırır.",
    scope: APP_SCOPE,
  },
  {
    needle: "api.dicebear.com",
    reason: "Dış avatar üretici; CSP'de izinli değil, ayrıca ziyaretçi IP'sini üçüncü tarafa gönderir.",
    scope: APP_SCOPE,
  },
  {
    needle: "azrxqgzfryzpaqchhrkk",
    reason: "Lovable prototipinin Supabase proje kimliği; bağlanırsa veri bizim değil başkasının veritabanına yazılır.",
    scope: APP_SCOPE,
  },
  {
    needle: "lovable-uploads/",
    reason:
      "Lovable'ın yükleme dizini; görsel bizim sunucumuzda değil Lovable önizlemesinde aranır ve canlıda kırık çıkar.",
    scope: APP_SCOPE,
  },
  {
    needle: "cdn.gpteng.co",
    reason: "Lovable/GPT Engineer betik CDN'i; üçüncü taraf betik yükler ve CSP'mizde izinli değildir.",
    scope: APP_SCOPE,
  },
  {
    needle: "lovableproject.com",
    reason: "Lovable önizleme alan adı; sızarsa üyeler ya da botlar bizim değil geçici önizleme sitesine gider.",
    scope: APP_SCOPE,
  },
  {
    needle: "MockStripeCheckout",
    reason: "Sahte kart ekranı; ST00'da kaldırıldı, geri gelirse kullanıcıya 'ödeme alındı' denip tahsilat yapılmaz.",
    scope: REPO_CODE_SCOPE,
    testsMayMention: true,
  },
];

const isTestFile = (file) => /(?:\.test\.|\.spec\.)[a-z]+$/.test(file) || file.startsWith("e2e/");

/**
 * Saf tarayıcı: `files` = [{ path, content }]. Kural kapsamındaki dosyalarda yasak dizgeyi
 * bulur; `testsMayMention` kuralında test dosyaları atlanır. İhlal listesini döndürür.
 */
export function findForbidden(files, rules = FORBIDDEN) {
  const hits = [];
  for (const rule of rules) {
    for (const file of files) {
      if (!rule.scope.some((prefix) => file.path.startsWith(prefix))) continue;
      if (rule.testsMayMention && isTestFile(file.path)) continue;
      if (file.content.includes(rule.needle)) hits.push({ file: file.path, needle: rule.needle, reason: rule.reason });
    }
  }
  return hits;
}

/** `git ls-files` çıktısı satırları. `extra` ile izlenmeyen (ama gitignore'da olmayan) dosyalar da gelir. */
function gitList(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter(Boolean);
}

function scannedTextFiles() {
  const everything = [
    ...new Set([...gitList(["ls-files"]), ...gitList(["ls-files", "--others", "--exclude-standard"])]),
  ];
  const scopes = FORBIDDEN.flatMap((rule) => rule.scope);
  return (
    everything
      .filter((f) => TEXT_EXTENSIONS.test(f))
      .filter((f) => scopes.some((prefix) => f.startsWith(prefix)))
      // Bu dosya yasak dizgeleri tanımı gereği yazar.
      .filter((f) => f !== "scripts/guards/lovable-forbidden-strings.test.mjs")
      .map((f) => ({ path: f, content: readFileSync(path.join(ROOT, f), "utf8") }))
  );
}

describe("Lovable'dan gelmesin — yasak dizgeler", () => {
  it("her yasak dizgenin tek satırlık Türkçe gerekçesi ve kapsamı vardır", () => {
    expect(FORBIDDEN.length).toBe(12);
    for (const rule of FORBIDDEN) {
      expect(rule.needle.length).toBeGreaterThan(3);
      expect(rule.reason.length, `${rule.needle} gerekçesiz`).toBeGreaterThan(20);
      expect(rule.reason, `${rule.needle} gerekçesi tek satır olmalı`).not.toContain("\n");
      expect(rule.scope.length).toBeGreaterThan(0);
    }
  });

  it("GGVBLA- (bizim kampanya kodu), çıplak lovable.app ve lovable-tagger yasak listede DEĞİL", () => {
    const needles = FORBIDDEN.map((r) => r.needle);
    expect(needles).not.toContain("GGVBLA-");
    expect(needles).not.toContain("lovable.app");
    expect(needles.some((n) => n.includes("lovable-tagger"))).toBe(false);
  });

  it("tarayıcı gerçek dosya listesini görüyor (boş liste ile sahte yeşil olmasın)", () => {
    const files = scannedTextFiles();
    expect(files.length).toBeGreaterThan(1000);
    expect(files.some((f) => f.path === "src/App.tsx")).toBe(true);
    expect(files.some((f) => f.path.startsWith("supabase/functions/"))).toBe(true);
    // Kök yapılandırma dosyaları ve public/** de taranır (Lovable kalıntısı çoğu zaman orada kalır).
    for (const rootFile of ["index.html", "vite.config.ts", "nginx.conf.template", "package.json"]) {
      expect(
        files.some((f) => f.path === rootFile),
        `${rootFile} taranmıyor`,
      ).toBe(true);
    }
    expect(files.some((f) => f.path.startsWith("public/") && f.path.endsWith(".xml"))).toBe(true);
    expect(files.some((f) => f.path.startsWith("public/") && f.path.endsWith(".txt"))).toBe(true);
  });

  it("izlenmeyen (untracked) dosyalar da taranır", () => {
    const untracked = gitList(["ls-files", "--others", "--exclude-standard"]).filter(
      (f) => TEXT_EXTENSIONS.test(f) && APP_SCOPE.some((prefix) => f.startsWith(prefix)),
    );
    const scanned = new Set(scannedTextFiles().map((f) => f.path));
    for (const f of untracked) {
      if (f === "scripts/guards/lovable-forbidden-strings.test.mjs") continue;
      expect(scanned.has(f), `${f} izlenmiyor ve taranmıyor`).toBe(true);
    }
  });

  it("src/, supabase/functions/ ve diğer kod dizinlerinde yasak dizge YOK", () => {
    const hits = findForbidden(scannedTextFiles());
    expect(
      hits.map((h) => `${h.file} → ${h.needle} (${h.reason})`),
      "Lovable kökenli dizge sızmış",
    ).toEqual([]);
  });
});

describe("Lovable'dan gelmesin — tarayıcı mutasyonla sınanır", () => {
  const clean = { path: "src/components/Temiz.tsx", content: "export const a = 1;" };

  it.each(FORBIDDEN.map((r) => [r.needle, r]))("%s sızarsa yakalanır", (needle, rule) => {
    const dirty = { path: `${rule.scope[0]}Sizinti.ts`, content: `const u = "https://x/${needle}/y";` };
    const hits = findForbidden([clean, dirty]);
    expect(hits.map((h) => h.needle)).toContain(needle);
    expect(hits.find((h) => h.needle === needle).file).toBe(dirty.path);
  });

  it("temiz dosya ihlal üretmez", () => {
    expect(findForbidden([clean])).toEqual([]);
  });

  it("MockStripeCheckout olumsuz iddia olarak test dosyasında SERBEST, üretim kodunda YASAK", () => {
    const negative = {
      path: "src/components/ServiceRequestForm.test.tsx",
      content: "expect(source).not.toMatch(/MockStripeCheckout/);",
    };
    const prod = { path: "src/components/ServiceRequestForm.tsx", content: "import MockStripeCheckout from './x';" };
    expect(findForbidden([negative])).toEqual([]);
    expect(findForbidden([prod]).map((h) => h.needle)).toEqual(["MockStripeCheckout"]);
  });

  it("diğer yasak dizgeler test dosyasında da YASAKTIR (muafiyet yalnız MockStripeCheckout'a)", () => {
    const testFile = { path: "src/lib/x.test.ts", content: 'fetch("https://api.dicebear.com/9.x/x.svg")' };
    expect(findForbidden([testFile]).map((h) => h.needle)).toEqual(["api.dicebear.com"]);
  });

  it("kural kapsamı dışındaki dizinde (ör. docs/, supabase/migrations/) yasak dizge taranmaz", () => {
    const doc = { path: "supabase/migrations/applied/x.sql", content: "-- MockStripeCheckout azrxqgzfryzpaqchhrkk" };
    expect(findForbidden([doc])).toEqual([]);
  });
});
