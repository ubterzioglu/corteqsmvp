#!/usr/bin/env node
// Yatırımcı sayfası parola doğrulayıcısı üretir: pbkdf2:<iterasyon>:<tuz>:<özet>
// Parola ekrana yazılmaz ve kabuk geçmişine girmez (gizli istemle okunur).
// Çıktıyı Coolify'da INVESTOR_PASS_HASH ortam değişkenine yapıştır.
// Ayrıntı: docs/investor/README.md
//
// Kullanım: npm run investor:hash

import { pbkdf2Sync, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_ITERATIONS = 600_000;
const MIN_LENGTH = 16;

export function buildInvestorVerifier(password, { iterations = DEFAULT_ITERATIONS, salt = randomBytes(16) } = {}) {
  const hash = pbkdf2Sync(password.normalize("NFC"), salt, iterations, 32, "sha256");
  return `pbkdf2:${iterations}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => (data += chunk));
      stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")));
      stdin.on("error", reject);
      return;
    }
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (char) => {
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (char === "\u0003") {
        stdin.setRawMode(false);
        process.exit(130);
      } else if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const password = await readHidden("Parola cümlesi: ");
  if (password.length < MIN_LENGTH) {
    console.error(`[investor:hash] En az ${MIN_LENGTH} karakter girin (öneri: 5-6 kelimelik parola cümlesi).`);
    process.exit(1);
  }
  const again = process.stdin.isTTY ? await readHidden("Tekrar: ") : password;
  if (again !== password) {
    console.error("[investor:hash] Parolalar eşleşmiyor.");
    process.exit(1);
  }
  console.log(buildInvestorVerifier(password));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
