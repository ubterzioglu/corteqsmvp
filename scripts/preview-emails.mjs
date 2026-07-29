// E-posta şablonlarının yerel önizlemesi.
//
//   npm run preview:emails
//
// Şablonları .preview-emails/ altına HTML dosyası olarak yazar; tarayıcıda açıp deploy
// etmeden iterasyon yapabilirsin. Şablonlar saf TS olduğu için Node doğrudan import eder
// (sync-admin-updates.mjs ile aynı desen).
//
// DİKKAT: tarayıcı önizlemesi Gmail/Outlook'un ne yapacağını GÖSTERMEZ — bu istemciler
// stilleri kırpar ve görselleri engeller. Yayına almadan önce /admin/notifications
// sayfasındaki "Bana örnek mail gönder" ile gerçek gelen kutusunda da kontrol et.

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUTPUT_DIR = path.join(REPO_ROOT, ".preview-emails");
const TEMPLATE_MODULE = "../supabase/functions/_shared/emails/member-welcome.ts";

/** Önizleme senaryoları: gerçekte karşılaşılan iki uç (adı olan / olmayan üye). */
function buildVariants(buildMemberWelcomeEmail) {
  const siteUrl = process.env.PREVIEW_SITE_URL || "https://corteqs.net";

  return [
    {
      file: "member-welcome.html",
      label: "Hoş geldin — adı bilinen üye (Google ile kayıt)",
      email: buildMemberWelcomeEmail({
        fullName: "Ayşe Yılmaz",
        email: "ayse.yilmaz@example.com",
        siteUrl,
        replyTo: process.env.MAIL_REPLY_TO || null,
      }),
    },
    {
      file: "member-welcome-isimsiz.html",
      label: "Hoş geldin — adı bilinmeyen üye (e-posta + şifre ile kayıt)",
      email: buildMemberWelcomeEmail({
        fullName: null,
        email: "yeni.uye@example.com",
        siteUrl,
        replyTo: null,
      }),
    },
  ];
}

function buildIndexHtml(variants) {
  const items = variants
    .map(
      (variant) =>
        `      <li><a href="./${variant.file}">${variant.label}</a><br><small>Konu: ${variant.email.subject}</small></li>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><title>E-posta önizlemeleri</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; line-height: 1.6;">
  <h1>E-posta önizlemeleri</h1>
  <p>Bu dosyalar <code>npm run preview:emails</code> ile üretildi ve sürüm kontrolüne girmez.</p>
  <ul>
${items}
  </ul>
</body>
</html>`;
}

async function main() {
  const { buildMemberWelcomeEmail } = await import(
    new URL(TEMPLATE_MODULE, import.meta.url).href
  );

  const variants = buildVariants(buildMemberWelcomeEmail);
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const variant of variants) {
    await writeFile(path.join(OUTPUT_DIR, variant.file), variant.email.html, "utf8");
    // Düz metin sürümü de yazılır: spam skoru için gönderilen asıl alternatif budur.
    await writeFile(
      path.join(OUTPUT_DIR, variant.file.replace(/\.html$/, ".txt")),
      variant.email.text,
      "utf8",
    );
  }

  await writeFile(path.join(OUTPUT_DIR, "index.html"), buildIndexHtml(variants), "utf8");

  console.log(`[preview-emails] ${variants.length} şablon yazıldı:`);
  for (const variant of variants) {
    console.log(`  - ${path.join(".preview-emails", variant.file)}  (${variant.email.subject})`);
  }
  console.log(`\nTarayıcıda aç: ${path.join(OUTPUT_DIR, "index.html")}`);
}

main().catch((error) => {
  console.error("[preview-emails] başarısız:", error);
  process.exitCode = 1;
});
