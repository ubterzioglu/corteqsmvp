// Sözleşme testi — gevşetme, çağrı yerine `deps` ekle.
//
// `useSeo(opts, deps = [])` varsayılan BOŞ deps ile bir kez çalışır (bilinçli:
// "çağıran kontrol eder", `seo.ts:276`). Opts veri bağımlıysa — şablon dizesi ya da
// `x ? {...} : {...}` — SEO ilk render'daki değerde DONAR:
//   • veri sonradan yüklenirse başlık "yükleniyor" durumunda kalır,
//   • rota parametresi değişip bileşen yeniden bağlanmazsa (`/isletme/a` → `/isletme/b`)
//     başlık ÖNCEKİ kayıtta kalır.
// İkisi de sessizdir: ekran doğru görünür, yalnız <title>/canonical/JSON-LD yanlıştır
// ve bunu ancak botun gördüğü çıktıya bakan fark eder.
//
// ⚠️ ÖLÇÜM UYARISI (S08): bu taramanın ilk sürümü `deps` argümanını regex'le arıyordu
// ve `[event?.id],\n  )` biçimindeki ÇAĞRILARI "deps yok" sandı — 8 sayfa kırık
// göründü, gerçek sayı 1'di. Argümanlar bu yüzden üst düzey virgüllere göre
// AYRIŞTIRILIYOR, aranmıyor.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function collectPages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectPages(path);
    return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [path] : [];
  });
}

/** Dengeli parantezle çağrı metnini alır. */
function callText(source: string, at: number): string | null {
  let depth = 0;
  for (let end = at; end < source.length; end += 1) {
    const char = source[end];
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(at, end + 1);
    }
  }
  return null;
}

/**
 * Yorumları siler. ⚠️ Zorunlu: çağrı içine yazılan bir açıklama yorumu virgül
 * içerebilir ve argüman ayrıştırmasını bozar — S08'de tam olarak bu yaşandı, deps'i
 * açıklayan yorum yüzünden deps'in kendisi görünmez oldu.
 */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Üst düzey virgüllere göre argümanları ayırır; dize/şablon içi virgülleri atlar. */
function topLevelArgs(call: string): string[] {
  // ⚠️ Çıplak `indexOf` + `slice` YASAK (S04b sözleşmesi, `test-source-slice-contract`).
  // Çıpa bulunamazsa -1 döner ve `slice` sessizce yanlış metin üretirdi.
  const open = call.indexOf("(");
  expect(open, "çağrı metninde açılış parantezi yok").toBeGreaterThan(-1);
  const inner = stripComments(call.slice(open + 1, call.length - 1));
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  let quote: string | null = null;

  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (char === "," && depth === 0) {
      args.push(inner.slice(start, index));
      start = index + 1;
    }
  }
  args.push(inner.slice(start));
  return args.map((arg) => arg.trim()).filter((arg) => arg !== "");
}

type Offender = { file: string; line: number };

function findDynamicSeoWithoutDeps(files: string[]): Offender[] {
  const offenders: Offender[] = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    let cursor = 0;

    for (;;) {
      const at = source.indexOf("useSeo(", cursor);
      if (at === -1) break;
      cursor = at + 1;

      const call = callText(source, at + "useSeo".length);
      if (!call) continue;

      const args = topLevelArgs(call);
      const opts = args[0] ?? "";

      // Veri bağımlı mı?
      //   • `x ? {...} : {...}` → yüklenme/bulunma durumuna bağlı, KESİNLİKLE dinamik.
      //   • şablon dizesi → yalnız araya giren ifade bir MODÜL SABİTİ değilse dinamik.
      //     `${SEO_CANONICAL_ORIGIN}` sabittir; `${event.title}` değildir. Bu ayrım
      //     olmadan `CommercialIndexPage` gibi tamamen statik sayfalar ihlal görünür.
      const conditional = /^\w[\w.?]*\s*\?/.test(opts);
      const interpolations = [...opts.matchAll(/\$\{\s*([^}]+?)\s*\}/g)].map((match) => match[1]);
      const hasRuntimeInterpolation = interpolations.some(
        (expression) => !/^[A-Z][A-Z0-9_]*$/.test(expression.split(/[.[(]/)[0]),
      );

      if (!conditional && !hasRuntimeInterpolation) continue;
      if (args.length >= 2 && args[1].startsWith("[")) continue;

      offenders.push({ file, line: source.slice(0, at).split("\n").length });
    }
  }

  return offenders;
}

describe("useSeo dinamik çağrılarda deps sözleşmesi", () => {
  const files = collectPages(join(process.cwd(), "src"));

  it("sayfa ağacını gerçekten tarıyor (tarama boşa düşmesin)", () => {
    // Bu kapan olmadan aşağıdaki iddia çıpasız olurdu: yürüyüş bozulunca "ihlal yok" der.
    expect(files.length, ".tsx dosyası bulunamadı").toBeGreaterThan(200);
    expect(files.some((file) => file.includes("BusinessDetailPage"))).toBe(true);
  });

  it("ayrıştırıcı deps'i GERÇEKTEN tanır (yanlış pozitif üretmez)", () => {
    // Bu, S08'de yaşanan ölçüm hatasının kapanı: `[event?.id],\n  )` biçimi
    // "deps yok" sayılırsa test 6 sağlam sayfayı ihlal diye gösterirdi.
    const sample = `useSeo(\n  event ? { title: \`\${event.title}\` } : {},\n  [event?.id],\n);`;
    const call = callText(sample, "useSeo".length);
    expect(call).not.toBeNull();
    const args = topLevelArgs(call as string);

    expect(args.length).toBe(2);
    expect(args[1].startsWith("[")).toBe(true);
  });

  it("veri bağımlı her useSeo çağrısı deps taşır", () => {
    const offenders = findDynamicSeoWithoutDeps(files).map(
      ({ file, line }) => `${file.replace(process.cwd(), "").replace(/\\/g, "/")}:${line}`,
    );

    expect(
      offenders,
      "opts veri bağımlıysa ikinci argüman olarak deps geç (ör. [item?.id])",
    ).toEqual([]);
  });
});
