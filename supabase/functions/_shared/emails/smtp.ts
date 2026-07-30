// Zoho SMTP göndericisi — send-notification-emails ve send-submission-email'in ortak katmanı.
//
// Neden SMTP: bu proje mail servisini Zoho Mail üzerinden yürütüyor (karar 2026-07-30);
// Resend hesabı kullanılmıyor. Eldeki credential seti SMTP seti (host/port/user/password).
//
// Neden EL YAZIMI istemci (denomailer DEĞİL): denomailer@1.6.0 Supabase Edge Runtime'ın
// istek başına 2 sn CPU tavanını TEK gönderimde aşıyor — canlıda ölçüldü (2026-07-30,
// "CPU Time exceeded" + WORKER_RESOURCE_LIMIT, boot 26ms'ken). Aşağıdaki istemci ham
// SMTP protokolünü konuşur: TLS native (Deno.connectTls), gövde base64 — CPU maliyeti
// milisaniye düzeyinde. Ağ beklemeleri async I/O olduğundan CPU sayacına girmez.
//
// Zoho kuralı: From adresi, SMTP oturumunu açan hesabın kendisi (veya alias'ı) olmak
// ZORUNDA — aksi halde 553 "relaying disallowed" döner. MAIL_FROM = ZOHO_SMTP_USER
// olarak ayarlanmalı; uyumsuzlukta hata Zoho'ya bırakılır (alias engellenmesin).
//
// 465 = implicit TLS (Deno.connectTls) — Supabase Edge'de ÇALIŞAN TEK yol: platform,
// giden 25 ve 587 portlarını engelliyor. resolveZohoSmtpConfig 465 dışını yüksek sesle loglar.

export type ZohoSmtpConfig = {
  hostname: string;
  port: number;
  username: string;
  password: string;
};

export type OutgoingMail = {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
};

/** Komut başına yanıt bekleme sınırı — asılı SMTP oturumu wall-clock'u yemesin. */
const COMMAND_TIMEOUT_MS = 15_000;

/**
 * Ortamdan Zoho SMTP ayarlarını çözer; herhangi biri eksikse null döner.
 * Çağıran taraf null'u "mail_config_missing" atlama yoluna çevirir — bu davranış
 * Resend dönemindeki RESEND_API_KEY guard'ının birebir devamıdır.
 */
export function resolveZohoSmtpConfig(): ZohoSmtpConfig | null {
  const hostname = Deno.env.get("ZOHO_SMTP_HOST");
  const portRaw = Deno.env.get("ZOHO_SMTP_PORT");
  const username = Deno.env.get("ZOHO_SMTP_USER");
  const password = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!hostname || !portRaw || !username || !password) return null;

  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port <= 0) {
    // "Eksik" ile "geçersiz" aynı sessiz skip'e düşmesin: eksik config bilinçli kapatma
    // olabilir, geçersiz port her zaman yanlış yapılandırmadır — logda ayrışsın.
    console.error(`Zoho SMTP: ZOHO_SMTP_PORT gecersiz ("${portRaw}"), gonderim atlanacak.`);
    return null;
  }

  if (port !== 465) {
    // Supabase Edge Runtime giden 25/587 portlarını ENGELLER; 465 dışı port sessiz
    // timeout + retry döngüsü üretir. Bilerek engellenmiyor (başka runtime ihtimali)
    // ama yüksek sesle loglanıyor.
    console.error(`Zoho SMTP: port ${port} — Supabase Edge yalniz 465'e (implicit TLS) izin verir, gonderim buyuk olasilikla timeout olacak.`);
  }

  return { hostname, port, username, password };
}

// ── Yardımcılar ────────────────────────────────────────────────────────────────

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Uint8Array → base64 (btoa'nın çağrı-argümanı sınırına takılmadan, 32K'lık parçalarla). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** UTF-8 metni base64'e çevirip RFC'ye uygun 76 karakterlik satırlara böler. */
function toBase64Lines(value: string): string {
  const b64 = bytesToBase64(encoder.encode(value));
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    lines.push(b64.slice(i, i + 76));
  }
  return lines.join("\r\n");
}

/** Başlık değeri ASCII dışı karakter içeriyorsa RFC 2047 UTF-8/B ile kodlar (Türkçe konular). */
function encodeHeaderValue(value: string): string {
  // deno-lint-ignore no-control-regex
  if (!/[^\x00-\x7F]/.test(value)) return value;
  return `=?UTF-8?B?${bytesToBase64(encoder.encode(value))}?=`;
}

/** SMTP oturumu: tek bağlantı, komut/yanıt sırası, komut başına zaman sınırı. */
class SmtpSession {
  #conn: Deno.TlsConn;
  #buffer = "";

  constructor(conn: Deno.TlsConn) {
    this.#conn = conn;
  }

  /** Sunucudan nihai yanıt satırını bekler ("250-devam" satırları atlanır, "250 son" biter). */
  async readReply(): Promise<{ code: number; text: string }> {
    const deadline = Date.now() + COMMAND_TIMEOUT_MS;
    const chunk = new Uint8Array(4096);

    for (;;) {
      const lineEnd = this.#buffer.indexOf("\r\n");
      if (lineEnd >= 0) {
        const line = this.#buffer.slice(0, lineEnd);
        this.#buffer = this.#buffer.slice(lineEnd + 2);
        // "250-..." = çok satırlı yanıtın ara satırı; "250 ..." = son satır.
        if (/^\d{3} /.test(line)) {
          return { code: Number.parseInt(line.slice(0, 3), 10), text: line.slice(4) };
        }
        if (/^\d{3}-/.test(line)) continue;
        // Protokol dışı satır — güvenli taraf: hata say.
        throw new Error(`unexpected reply line: ${line.slice(0, 120)}`);
      }

      if (Date.now() > deadline) {
        throw new Error(`reply timeout after ${COMMAND_TIMEOUT_MS}ms`);
      }

      const n = await this.#conn.read(chunk);
      if (n === null) throw new Error("connection closed by server");
      this.#buffer += decoder.decode(chunk.subarray(0, n));
    }
  }

  /** Ham satır yazar (CRLF ekler); partial write'a karşı tam yazım döngüsü. */
  async writeLine(line: string): Promise<void> {
    const bytes = encoder.encode(`${line}\r\n`);
    let written = 0;
    while (written < bytes.length) {
      written += await this.#conn.write(bytes.subarray(written));
    }
  }

  /** Komut gönderir, yanıt kodunu bekler; beklenmeyen kodda log-güvenli hata fırlatır. */
  async command(line: string, expectedCodes: number[], logName: string): Promise<void> {
    await this.writeLine(line);
    const reply = await this.readReply();
    if (!expectedCodes.includes(reply.code)) {
      // logName kullanılır, satırın kendisi DEĞİL — AUTH satırları credential taşır.
      throw new Error(`${logName} rejected: ${reply.code} ${reply.text.slice(0, 200)}`);
    }
  }

  close(): void {
    try {
      this.#conn.close();
    } catch {
      // Kapanmış bağlantıyı kapatma hatası önemsiz.
    }
  }
}

/** MIME mesajını kurar: başlıklar + (text varsa multipart/alternative, yoksa salt html). */
function buildMimeMessage(mail: OutgoingMail): string {
  const headers: string[] = [
    `From: ${mail.from}`,
    `To: ${mail.to.join(", ")}`,
    `Subject: ${encodeHeaderValue(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
  ];
  if (mail.replyTo) headers.push(`Reply-To: ${mail.replyTo}`);

  // Gövde base64: hem UTF-8'i (Türkçe) hem SMTP nokta-doldurma (dot-stuffing) derdini
  // kökten çözer — base64 alfabesinde satır başı "." oluşamaz.
  if (mail.text) {
    const boundary = `b_${crypto.randomUUID().replaceAll("-", "")}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    return [
      ...headers,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      "Content-Transfer-Encoding: base64",
      "",
      toBase64Lines(mail.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      "Content-Transfer-Encoding: base64",
      "",
      toBase64Lines(mail.html),
      `--${boundary}--`,
      "",
    ].join("\r\n");
  }

  headers.push('Content-Type: text/html; charset=utf-8', "Content-Transfer-Encoding: base64");
  return [...headers, "", toBase64Lines(mail.html), ""].join("\r\n");
}

/**
 * Tek mail gönderir. Hata durumunda throw eder — kuyruk tarafındaki retry/failed
 * mantığı (attempts + MAX_ATTEMPTS) bu throw'a dayanır, yutulmamalı.
 * Her çağrı kendi bağlantısını açar/kapatır (15 dk cron kadansında havuz gereksiz).
 */
export async function sendMailViaZohoSmtp(config: ZohoSmtpConfig, mail: OutgoingMail): Promise<void> {
  if (!mail.html) {
    throw new Error("Zoho SMTP send failed: empty html body");
  }

  let session: SmtpSession | null = null;

  try {
    const conn = await Deno.connectTls({ hostname: config.hostname, port: config.port });
    session = new SmtpSession(conn);

    // 220 karşılama → EHLO → AUTH LOGIN (334 istemleri base64 kullanıcı/parola bekler).
    const greeting = await session.readReply();
    if (greeting.code !== 220) {
      throw new Error(`greeting rejected: ${greeting.code} ${greeting.text.slice(0, 200)}`);
    }
    await session.command("EHLO corteqs.net", [250], "EHLO");
    await session.command("AUTH LOGIN", [334], "AUTH LOGIN");
    await session.command(btoa(config.username), [334], "AUTH username");
    await session.command(btoa(config.password), [235], "AUTH password");

    await session.command(`MAIL FROM:<${mail.from}>`, [250], "MAIL FROM");
    for (const recipient of mail.to) {
      await session.command(`RCPT TO:<${recipient}>`, [250, 251], `RCPT TO ${recipient}`);
    }

    await session.command("DATA", [354], "DATA");
    await session.writeLine(buildMimeMessage(mail));
    await session.command(".", [250], "message body");

    // QUIT nezaketi — başarısızlığı gönderim sonucunu değiştirmez.
    try {
      await session.writeLine("QUIT");
    } catch {
      // Sunucu çoktan kapatmış olabilir.
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // "Zoho SMTP" öneki last_error kolonunda sağlayıcıyı görünür kılar (Resend
    // dönemindeki "Resend request failed" deseninin devamı).
    throw new Error(`Zoho SMTP send failed: ${message.slice(0, 500)}`);
  } finally {
    session?.close();
  }
}
