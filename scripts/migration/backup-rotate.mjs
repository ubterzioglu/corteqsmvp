#!/usr/bin/env node
/**
 * GÜNLÜK OTOMATİK YEDEK — Supabase Free katmanında otomatik yedek YOKTUR.
 *
 * Bu script tek komutla tam yedek alır (veritabanı + storage dosyaları),
 * tarihli bir dizine yazar ve eski yedekleri döndürür (rotasyon).
 * Zamanlayıcıya (Windows Task Scheduler / cron) bağlanmak için tasarlandı.
 *
 * ⚠️ NEDEN VAR: Pro'da günlük yedek Supabase'in işiydi. Free'ye geçilince
 *    bu sorumluluk BİZE geçer. 170 kullanıcılı canlı bir üründe yedeksiz gün
 *    geçirmek kabul edilemez.
 *
 * TASARIM KURALLARI:
 *  1. SALT OKUNUR — kaynakta hiçbir şey değişmez.
 *  2. Kısmi başarı GİZLENMEZ. Bir adım bile düşerse yedek BAŞARISIZ sayılır,
 *     çıkış kodu 1 olur ve o dizin `.FAILED` ile işaretlenir — yarım bir yedeğin
 *     sağlam sanılması, hiç yedek olmamasından daha tehlikelidir.
 *  3. Rotasyon yalnız BAŞARILI yedekleri sayar ve siler. Başarısız olanlar
 *     incelensin diye bırakılır.
 *  4. En az bir başarılı yedek her zaman korunur (rotasyon hepsini silemez).
 *  5. Çıktı dizini repo içinde olamaz.
 *
 * Kullanım:
 *   node scripts/migration/backup-rotate.mjs --root <DIZIN>
 *   node scripts/migration/backup-rotate.mjs --root <DIZIN> --keep 14 --confirm
 *
 * Zamanlayıcı kurulumu: docs/supabase-plan-decision.md §4.2
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { resolve, relative, isAbsolute, join } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const DIR_PATTERN = /^\d{4}-\d{2}-\d{2}(_\d{6})?$/;

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  → ${hint}`);
  process.exit(1);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function dirSizeBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += dirSizeBytes(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
}

function humanSize(bytes) {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

const HELP = `
Günlük tam yedek + rotasyon (Supabase Free'de otomatik yedek YOKTUR)

  --root <DIZIN>   Yedeklerin tutulacağı KÖK dizin (ZORUNLU, repo dışında).
                   Her çalıştırma altına <YYYY-AA-GG_SSDDSS> dizini açar.
  --keep <N>       Saklanacak BAŞARILI yedek sayısı (varsayılan 14).
  --confirm        Gerçekten çalıştır. Yoksa yalnız plan.

Çıkış kodu: 0 = yedek tam · 1 = yedek EKSİK (izlemeye bunu bağla)
`;

function main() {
  const argv = process.argv.slice(2);
  const args = { root: null, keep: 14, confirm: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") args.root = argv[++i];
    else if (argv[i] === "--keep") args.keep = Number.parseInt(argv[++i], 10);
    else if (argv[i] === "--confirm") args.confirm = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
    else fail(`Bilinmeyen argüman: ${argv[i]}`);
  }
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (!args.root) fail("--root zorunlu.", HELP.trim());
  if (!Number.isInteger(args.keep) || args.keep < 1) fail("--keep en az 1 olmalı.");

  const root = resolve(args.root);
  const rel = relative(REPO_ROOT, root);
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) {
    fail("Yedek kökü repo içinde olamaz.", "Yedekler kişisel veri içerir.");
  }

  const target = join(root, stamp());
  console.log("Günlük tam yedek\n");
  console.log(`  kök          : ${root}`);
  console.log(`  bu yedek     : ${target}`);
  console.log(`  saklanacak   : en yeni ${args.keep} BAŞARILI yedek`);
  console.log(`  adımlar      : 1) veritabanı (pg_dump)  2) storage dosyaları`);

  if (!args.confirm) {
    console.log(`\n▸ PLAN — hiçbir şey çalıştırılmadı. --confirm ekleyerek başlat.\n`);
    return;
  }

  mkdirSync(root, { recursive: true });
  console.log(`\n▸ Başlıyor…\n`);

  const node = process.execPath;
  const steps = [
    { label: "veritabanı", script: join(REPO_ROOT, "scripts", "migration", "export-supabase.mjs") },
    { label: "storage", script: join(REPO_ROOT, "scripts", "migration", "export-storage.mjs") },
  ];

  const failures = [];
  for (const step of steps) {
    process.stdout.write(`  ${step.label} … `);
    const started = Date.now();
    const r = spawnSync(node, [step.script, "--out", target, "--confirm"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    if (r.status === 0) {
      console.log(`tamam (${secs}s)`);
    } else {
      console.log("BAŞARISIZ");
      const tail = `${r.stdout || ""}\n${r.stderr || ""}`.trim().split("\n").slice(-12).join("\n");
      console.error(tail);
      failures.push({ step: step.label, exitCode: r.status, tail });
    }
  }

  // ---- Sonuç -----------------------------------------------------------------
  const ok = failures.length === 0;
  const size = existsSync(target) ? dirSizeBytes(target) : 0;

  writeFileSync(
    join(target, ok ? "BACKUP-OK.json" : "BACKUP-FAILED.json"),
    `${JSON.stringify({ finishedAt: new Date().toISOString(), ok, bytes: size, failures }, null, 2)}\n`,
    "utf8",
  );

  console.log(`\n  boyut        : ${humanSize(size)}`);

  // ---- Rotasyon: YALNIZ başarılı yedekleri say ve sil ------------------------
  const all = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && DIR_PATTERN.test(e.name))
    .map((e) => e.name)
    .sort();
  const successful = all.filter((n) => existsSync(join(root, n, "BACKUP-OK.json")));
  // "OK işareti yok" iki şey olabilir: (a) bu araçla alınıp BAŞARISIZ olmuş,
  // (b) bu araçtan önce elle alınmış. İkisini ayırt et — hepsine "başarısız"
  // demek yanıltıcıdır ve sağlam bir yedeğe güvensizlik yaratır.
  const explicitlyFailed = all.filter((n) => existsSync(join(root, n, "BACKUP-FAILED.json")));
  const unmarked = all.filter(
    (n) =>
      !existsSync(join(root, n, "BACKUP-OK.json")) && !existsSync(join(root, n, "BACKUP-FAILED.json")),
  );

  const toDelete = successful.slice(0, Math.max(0, successful.length - args.keep));
  for (const name of toDelete) {
    rmSync(join(root, name), { recursive: true, force: true });
    console.log(`  silindi      : ${name} (rotasyon)`);
  }

  console.log(`  başarılı yedek: ${successful.length - toDelete.length} adet`);
  if (explicitlyFailed.length > 0) {
    console.log(`  ⚠️ BAŞARISIZ yedek: ${explicitlyFailed.length} adet — SİLİNMEDİ, incele.`);
  }
  if (unmarked.length > 0) {
    console.log(
      `  ℹ️ işaretsiz dizin: ${unmarked.length} adet (bu araçtan önce elle alınmış) — ` +
        `rotasyona dahil DEĞİL, silinmez.`,
    );
  }

  if (!ok) {
    console.error(`\n✗ YEDEK EKSİK — ${failures.map((f) => f.step).join(", ")} başarısız.`);
    console.error(`  Bu dizini sağlam sayma: ${target}`);
    console.error(`  Free katmanda Supabase'in yedeği YOK; bu script'in çıkış kodunu izle.`);
    process.exit(1);
  }

  console.log(`\n✓ Yedek tam → ${target}`);
  console.log(`
  ⚠️ HATIRLATMA: yedek, geri yüklenebildiği kanıtlanana kadar yedek değildir.
     Ayda bir izole bir Postgres'e restore provası yap:
       node scripts/migration/restore-selfhost.mjs --from <DIZIN> --target <URL>`);
}

main();
