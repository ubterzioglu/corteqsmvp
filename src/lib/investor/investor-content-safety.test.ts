// SÖZLEŞME TESTİ — gevşetme. Yatırımcı sayfası istemci taraflı parolayla korunur;
// gerçek kilit değildir, içerik JS paketinde herkese açıktır. Bu test sayfanın
// kaynaklarında saldırı yüzeyini anlatan bilgi (proje kimliği, host, IP, anahtar
// adı, tablo/RPC adı, kapasite zaafı) geçmesini engeller. Bkz. docs/investor/README.md

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { HERO_METRICS, LIVE_DB, MODULES, STACK } from "./investor-content";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCAN_DIRS = ["src/lib/investor", "src/components/investor", "src/pages/investor"];

function investorSources(): { file: string; text: string }[] {
  return SCAN_DIRS.flatMap((dir) =>
    readdirSync(path.join(ROOT, dir))
      .filter((name) => /\.(ts|tsx|css)$/.test(name) && !/\.test\.tsx?$/.test(name))
      .map((name) => {
        const file = `${dir}/${name}`;
        return { file, text: readFileSync(path.join(ROOT, file), "utf8") };
      }),
  );
}

const FORBIDDEN: readonly { label: string; pattern: RegExp }[] = [
  { label: "Supabase proje kimliği", pattern: /injprdrsklkxgnaiixzh/i },
  { label: "Supabase host adresi", pattern: /supabase\.(co|com)\b/i },
  { label: "bağlantı havuzu (pooler)", pattern: /pooler/i },
  { label: "service role", pattern: /service[_ ]?role/i },
  { label: "ortam değişkeni/secret adı", pattern: /\b(SUPABASE|GEMINI|WHATSAPP|RESEND|SMTP|OPENAI)_[A-Z_]+/ },
  { label: "API anahtarı adı", pattern: /\b[A-Z]+_API_KEY\b/ },
  { label: "IPv4 adresi", pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { label: "bellek/kapasite rakamı", pattern: /\b\d+(?:[.,]\d+)?\s?(MB|GB)\b.*\b(RAM|bellek|memory)\b/i },
  { label: "açık kusur kodu", pattern: /\bK[1-5]\b.*(kusur|açık|ihlal)/i },
  { label: "JWT / anahtar", pattern: /eyJ[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{10,}|\bsk-[A-Za-z0-9]{10,}/ },
  { label: "uzun hex dizgesi (anahtar/özet)", pattern: /\b[0-9a-f]{40,}\b/i },
  { label: "proje referansı", pattern: /\bproject[_ -]?ref\b/i },
];

// İzinli alan adları: iletişim adresi, yazı tipi servisi ve 07 · Bağlantılar'daki
// herkese açık ekosistem adresleri. Yeni adres eklerken BİLİNÇLİ olarak buraya yaz.
const ALLOWED_DOMAINS = new Set([
  "corteqs.net",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "qualtronsinclair.com",
  "global-diaspora-connect.lovable.app",
]);
const DOMAIN = /\b(?:[a-z0-9-]+\.)+(?:net|com|co|io|in|dev|app|org|cloud)\b/gi;

describe("yatırımcı sayfası — hassas içerik yasağı", () => {
  const sources = investorSources();

  it("taranacak dosyalar bulunuyor (boş tarama sessizce geçmesin)", () => {
    expect(sources.length).toBeGreaterThanOrEqual(10);
    expect(sources.some((s) => s.file.endsWith("investor-content.ts"))).toBe(true);
  });

  for (const rule of FORBIDDEN) {
    it(`kaynaklarda ${rule.label} geçmez`, () => {
      const hits = sources.filter((s) => rule.pattern.test(s.text)).map((s) => s.file);
      expect(hits, `${rule.label} bulundu`).toEqual([]);
    });
  }

  it("izinli liste dışında alan adı / host geçmez", () => {
    const hits = sources.flatMap((s) =>
      (s.text.match(DOMAIN) ?? [])
        .map((d) => d.toLowerCase())
        .filter((d) => !ALLOWED_DOMAINS.has(d) && ![...ALLOWED_DOMAINS].some((a) => d.endsWith(`.${a}`)))
        .map((d) => `${s.file}: ${d}`),
    );
    expect(hits).toEqual([]);
  });

  it("içerik metninde tablo/RPC adı gibi snake_case tanımlayıcı geçmez (eklenti adları hariç)", () => {
    const content = readFileSync(path.join(ROOT, "src/lib/investor/investor-content.ts"), "utf8");
    const literals = content.match(/"[^"\n]*"|`[^`]*`/g) ?? [];
    const allowed = new Set(["pg_cron", "pg_net", "pg_trgm", "shadcn/ui"]);
    const offenders = literals
      .flatMap((lit) => lit.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? [])
      .filter((word) => !allowed.has(word));
    expect(offenders).toEqual([]);
  });
});

describe("yatırımcı sayfası — içerik tutarlılığı", () => {
  it("kapaktaki modül sayısı modül listesinden türetilir", () => {
    expect(HERO_METRICS[0].value).toBe(String(MODULES.length));
  });

  it("canlı DB ölçümü tarihli ve pozitif", () => {
    expect(LIVE_DB.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LIVE_DB.tables).toBeGreaterThan(0);
    expect(LIVE_DB.tablesWithRls).toBeLessThanOrEqual(LIVE_DB.tables);
  });

  it("sürüm gösterilen her teknoloji üretilen veriden dolu gelir", () => {
    for (const layer of STACK) {
      for (const item of layer.items) {
        if ("version" in item) expect(item.version, item.name).toMatch(/^\d/);
      }
    }
  });
});
