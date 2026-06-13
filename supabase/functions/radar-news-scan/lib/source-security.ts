const BLOCKED_PATTERNS = [
  /^file:/i,
  /^ftp:/i,
  /^data:/i,
  /^javascript:/i,
];

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
];

export function validateSourceUrl(url: string): { ok: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "Geçersiz URL formatı" };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(parsed.protocol)) {
      return { ok: false, reason: `Engellenen protokol: ${parsed.protocol}` };
    }
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: `Yalnızca http/https kabul edilir: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { ok: false, reason: `Özel IP aralığı engellendi: ${hostname}` };
    }
  }

  return { ok: true };
}
