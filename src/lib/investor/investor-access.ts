// Yatırımcı sayfası parola kapısı.
//
// ⚠️ Bu kapı İSTEMCİ TARAFINDADIR — gerçek bir erişim kilidi DEĞİL, bir giriş
// deneyimidir. Doğrulayıcı herkese açık env-config.js'ten okunur ve sayfa kodu JS
// paketinde durur. Bu yüzden sayfaya hassas bilgi YAZILMAZ; kural
// `investor-content-safety.test.ts` ile kilitlidir. Ayrıntı: docs/investor/README.md
//
// Doğrulayıcı biçimi: `pbkdf2:<iterasyon>:<tuz-hex>:<özet-hex>` (PBKDF2-SHA256, 32 bayt).
// Düz SHA-256 KULLANILMAZ: doğrulayıcı herkese açık olduğundan hızlı bir özet
// çevrimdışı kaba kuvvetle saatler içinde kırılır; tuz + yüksek iterasyon bunu
// pahalılaştırır. Üretmek için: `npm run investor:hash`.
//
// Kaynak: çalışma anında `window.__APP_CONFIG__.INVESTOR_PASS_HASH`
// (Coolify env → docker-entrypoint-env.sh → env-config.js), yoksa build-time
// `VITE_INVESTOR_PASS_HASH`. İkisi de yoksa ya da biçim bozuksa kapı AÇILMAZ.

const SESSION_KEY = "corteqs_investor_access";
const VERIFIER_PATTERN = /^pbkdf2:(\d{1,8}):([0-9a-f]{16,128}):([0-9a-f]{64})$/;
const DERIVED_BITS = 256;

export const INVESTOR_MAX_ATTEMPTS = 3;
export const INVESTOR_LOCKOUT_MS = 30_000;

export interface InvestorVerifier {
  readonly raw: string;
  readonly iterations: number;
  readonly saltHex: string;
  readonly hashHex: string;
}

// `Window.__APP_CONFIG__` tipi üretilen Supabase istemcisinde tanımlı (elle
// düzenlenmez); yatırımcı alanını burada kesişimle ekliyoruz.
type InvestorWindow = Window & { __APP_CONFIG__?: { INVESTOR_PASS_HASH?: string } };

export function parseInvestorVerifier(value: string | undefined | null): InvestorVerifier | null {
  const raw = (value ?? "").trim().toLowerCase();
  const match = VERIFIER_PATTERN.exec(raw);
  if (!match) return null;
  const iterations = Number(match[1]);
  if (!Number.isSafeInteger(iterations) || iterations < 1) return null;
  return { raw, iterations, saltHex: match[2], hashHex: match[3] };
}

export function getInvestorVerifier(): InvestorVerifier | null {
  const runtime =
    typeof window !== "undefined" ? (window as InvestorWindow).__APP_CONFIG__?.INVESTOR_PASS_HASH : undefined;
  return parseInvestorVerifier(runtime || import.meta.env.VITE_INVESTOR_PASS_HASH);
}

const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

const bytesToHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function derivePbkdf2Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations },
    key,
    DERIVED_BITS,
  );
  return bytesToHex(bits);
}

/** Parolayı doğrulayıcıyla karşılaştırır. Boş girdi ya da doğrulayıcı yoksa `false`. */
export async function verifyInvestorPassword(password: string, verifier: InvestorVerifier | null): Promise<boolean> {
  if (!verifier || !password) return false;
  const actual = await derivePbkdf2Hex(password, verifier.saltHex, verifier.iterations);
  return actual === verifier.hashHex;
}

/** Oturumda daha önce doğru parola girildi mi? Kayıt yalnız aynı doğrulayıcı için geçerlidir. */
export function hasInvestorSession(verifier: InvestorVerifier | null): boolean {
  if (!verifier) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === verifier.hashHex;
  } catch {
    return false;
  }
}

export function rememberInvestorSession(verifier: InvestorVerifier): void {
  try {
    sessionStorage.setItem(SESSION_KEY, verifier.hashHex);
  } catch {
    // BİLEREK: gizli mod / kapalı storage — kapı bu oturumda yine açık kalır,
    // yalnız sayfa yenilenince parola tekrar sorulur.
  }
}

export function clearInvestorSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // BİLEREK: storage yoksa silinecek kayıt da yoktur.
  }
}
