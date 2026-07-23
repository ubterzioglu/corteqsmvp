#!/usr/bin/env node
// post-commit git hook'undan çağrılır: src/lib/admin-shell/admin-updates.ts dosyası
// bir önceki commit'te değiştiyse, listenin en üstündeki (en yeni) kaydı Zoho Mail
// SMTP üzerinden sabit alıcı listesine e-posta olarak gönderir. Env eksikse sessizce
// atlar (yerel/CI ortamlarında zorunlu değil).

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import nodemailer from "nodemailer";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ADMIN_UPDATES_PATH = "src/lib/admin-shell/admin-updates.ts";

function loadDotEnv(relPath) {
  const envPath = path.join(REPO_ROOT, relPath);
  let text;
  try {
    text = readFileSync(envPath, "utf8");
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

loadDotEnv(".env");
const RECIPIENTS = [
  "burakakcakanat@corteqs.net",
  "ubterzioglu@gmail.com",
  "ubt@ubterzioglu.de",
];

function sh(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function fileChangedInLastCommit(relPath) {
  const changed = sh(`git diff-tree --no-commit-id --name-only -r HEAD`)
    .split("\n")
    .filter(Boolean);
  return changed.includes(relPath.replace(/\\/g, "/"));
}

function parseLatestEntry(fileText) {
  const match = fileText.match(
    /export const ADMIN_UPDATES: AdminUpdateEntry\[\] = \[\s*\{([\s\S]*?)\n {2}\},/,
  );
  if (!match) return null;

  const block = match[1];
  const dateMatch = block.match(/date:\s*"([^"]*)"/);
  const titleMatch = block.match(/title:\s*"([^"]*)"/);
  const itemsMatch = block.match(/items:\s*\[([\s\S]*?)\n {4}\],/);

  const items = itemsMatch
    ? Array.from(itemsMatch[1].matchAll(/"((?:[^"\\]|\\.)*)",?/g)).map((m) =>
        m[1].replace(/\\"/g, '"'),
      )
    : [];

  return {
    date: dateMatch?.[1] ?? "",
    title: titleMatch?.[1] ?? "",
    items,
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildHtml(entry) {
  const itemsHtml = entry.items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `
    <h2>${escapeHtml(entry.title)}</h2>
    <p><strong>${escapeHtml(entry.date)}</strong></p>
    <ul>${itemsHtml}</ul>
  `;
}

function buildTransport() {
  const host = process.env.ZOHO_SMTP_HOST || "smtp.zoho.eu";
  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function main() {
  if (!fileChangedInLastCommit(ADMIN_UPDATES_PATH)) {
    return;
  }

  const mailFrom = process.env.MAIL_FROM || process.env.ZOHO_SMTP_USER;
  const transport = buildTransport();

  if (!transport || !mailFrom) {
    console.warn(
      "[notify-admin-updates] ZOHO_SMTP_USER/ZOHO_SMTP_PASSWORD veya MAIL_FROM tanımlı değil, bildirim atlandı.",
    );
    return;
  }

  const fileText = readFileSync(path.join(REPO_ROOT, ADMIN_UPDATES_PATH), "utf8");
  const entry = parseLatestEntry(fileText);

  if (!entry || !entry.title) {
    console.warn("[notify-admin-updates] Yeni kayıt ayrıştırılamadı, bildirim atlandı.");
    return;
  }

  await transport.sendMail({
    from: mailFrom,
    to: RECIPIENTS,
    subject: `CorteQS admin güncellemesi: ${entry.title}`,
    html: buildHtml(entry),
  });

  console.log(`[notify-admin-updates] Bildirim gönderildi: ${entry.title}`);
}

main().catch((error) => {
  console.error("[notify-admin-updates] Hata:", error);
});
