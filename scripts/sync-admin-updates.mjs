#!/usr/bin/env node
// admin-updates.ts → notification_email_outbox senkronizasyonu.
// post-commit git hook'undan çağrılır (eski scripts/notify-admin-updates.mjs'in yerini alır).
//
// Eski script dosyayı REGEX'le parse ediyor ve yalnız EN ÜSTTEKİ kaydı Zoho SMTP ile
// sabit 3 adrese yolluyordu; aynı güne birden çok kayıt girilirse alttakiler kayboluyordu.
// Bu script yerine dosyayı doğrudan import eder (admin-updates.ts hiç import içermez,
// Node --experimental-strip-types ile okunur — package.json'daki social:generate ile aynı
// yaklaşım) ve TÜM kayıtları outbox'a upsert eder. dedupe_key UNIQUE olduğu için daha önce
// işlenmiş kayıtlar sessizce atlanır, yalnız gerçekten yeni olanlar kuyruğa düşer.
//
// Gönderimi bu script yapmaz — send-notification-emails Edge Function yapar. Buradaki
// tek iş kuyruğa yazmaktır. Kuyruktaki admin_update satırları DB trigger'ı ile bir
// sonraki 18:00'e (Europe/Berlin) ertelenir ve 15 dk'lık pg_cron drenajı hepsini TEK
// özet mail olarak gönderir (mig 20260730230000) — bu yüzden eskiden burada olan
// "dispatcher'ı dürt" adımı bilinçli olarak kaldırıldı.
//
// Kullanım:
//   node --experimental-strip-types scripts/sync-admin-updates.mjs
//   node --experimental-strip-types scripts/sync-admin-updates.mjs --seed-only
//
// --seed-only: mevcut TÜM kayıtları 'skipped' olarak yazar (mail göndermez). Sistem ilk
// kez devreye alınırken ZORUNLUDUR — atlanırsa yüzlerce tarihsel kayıt maillenir.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { buildOutboxRows } from "./admin-update-outbox.mjs";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ADMIN_UPDATES_MODULE = "../src/lib/admin-shell/admin-updates.ts";

function loadDotEnv(relPath) {
  let text;
  try {
    text = readFileSync(path.join(REPO_ROOT, relPath), "utf8");
  } catch {
    return;
  }

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([^#=\s][^=]*)=("?)(.*)\2\s*$/);
    if (!match) continue;
    const [, key, , value] = match;
    if (process.env[key.trim()] === undefined) {
      process.env[key.trim()] = value;
    }
  }
}

async function main() {
  // Bu repoda Supabase anahtarları .env.local'de yaşar (.env yalnız SMTP taşır).
  // İkisi de okunur; önce yüklenen kazanır, kabuk ortamı her ikisini de ezer.
  loadDotEnv(".env");
  loadDotEnv(".env.local");

  const seedOnly = process.argv.includes("--seed-only");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Env eksikse sessizce atla — yerel/CI ortamlarında zorunlu değil (eski davranış korunur).
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "[sync-admin-updates] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY tanımlı değil, senkronizasyon atlandı.",
    );
    return;
  }

  const { ADMIN_UPDATES } = await import(ADMIN_UPDATES_MODULE);
  const rows = buildOutboxRows(ADMIN_UPDATES, seedOnly);

  if (rows.length === 0) {
    console.warn("[sync-admin-updates] Geçerli kayıt bulunamadı, senkronizasyon atlandı.");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // İlk çalıştırma koruması: kuyrukta hiç admin_update kaydı yokken normal modda
  // çalıştırılırsa TÜM tarihsel kayıtlar 'pending' olur ve sistem açıldığında toplu
  // mail gider. Bunu operatörün --seed-only'yi hatırlamasına bırakmak yerine yapısal
  // olarak engelliyoruz: ilk dolum yalnız --seed-only ile yapılabilir.
  if (!seedOnly) {
    const { count, error: countError } = await supabase
      .from("notification_email_outbox")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "admin_update");

    if (countError) {
      console.error("[sync-admin-updates] Kuyruk durumu okunamadı:", countError.message);
      process.exitCode = 1;
      return;
    }

    if ((count ?? 0) === 0 && rows.length > 1) {
      console.error(
        `[sync-admin-updates] DURDURULDU: kuyruk boş ve ${rows.length} tarihsel kayıt var.\n` +
          "  Normal modda çalıştırılsaydı hepsi maillenecekti. Önce bir kez şunu çalıştır:\n" +
          "    npm run sync:admin-updates -- --seed-only",
      );
      process.exitCode = 1;
      return;
    }
  }

  // ignoreDuplicates: daha önce işlenmiş kayıtlar dokunulmadan bırakılır — gönderilmiş bir
  // bildirim yeniden 'pending' yapılmaz, yani ikinci kez mail gitmez.
  const { data, error } = await supabase
    .from("notification_email_outbox")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true })
    .select("dedupe_key");

  if (error) {
    console.error("[sync-admin-updates] Outbox yazımı başarısız:", error.message);
    process.exitCode = 1;
    return;
  }

  const inserted = data?.length ?? 0;
  console.log(
    `[sync-admin-updates] ${rows.length} kayıt tarandı, ${inserted} yeni kayıt kuyruğa alındı` +
      (seedOnly ? " (seed modu: mail gönderilmeyecek)." : "."),
  );

  if (seedOnly || inserted === 0) {
    return;
  }

  console.log(
    "[sync-admin-updates] Kayıtlar günlük özeti bekliyor: 18:00'de (Europe/Berlin) tek mailde " +
      "gönderilecek. Erken göndermek için admin panelindeki 'Şimdi gönder' kullanılabilir.",
  );
}

// Vitest bu dosyayı saf fonksiyonlar için import eder; main yalnız CLI'dan çalışır.
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error("[sync-admin-updates] Hata:", error);
    process.exitCode = 1;
  });
}
