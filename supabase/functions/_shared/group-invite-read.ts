// G13 · Davet sayfasından grup adı okuma — SUNUCU TARAFI (G08 kural 1).
//
// G08 spike'ının ölçtüğü platform-özel geçerlilik işaretleri (kural 2):
//   • WhatsApp: 200 + DOLU `og:title` → ok; 200 + BOŞ `og:title` → invalid
//     (HTTP durumu tek başına anlam taşımaz — uydurma 5 kodun 5'i de 200 döndü).
//   • Telegram: 200 + jenerik "Join group chat on Telegram" → invalid.
//     ⚠️ Gerçek `t.me/+…` özel davet linki ÖLÇÜLEMEDİ (G08 §6) — okunamazsa
//     `unknown` döner ve doğrulama deneme SAYMAZ (kural 5), manuel yol açık.
//   • Discord: resmî API `GET /api/v10/invites/<kod>` → 200 + `guild.name` ok;
//     404 + code 10006 → invalid. HTML değil API (kural: 24 KB vs 2,5 KB).
//
// Kural 3-4: okunan ad ÖNERİDİR; kayıtlı adla tam eşitlik aranmaz (2/2 ölçümde
// farklıydı). Kod araması `findClaimCode` ile yumuşak yapılır (büyük/küçük harf
// ve ayraç toleranslı).
// Kural 6: HTML okuma kırılgandır — og hiç yoksa `unknown` (invalid DEĞİL).
// Kural 8: davet linki bu modülden log'a/yanıta YAZILMAZ; çağıran da yazmaz.
//
// ⚠️ Türkçe metin bozulmaz (repo kuralı): og:title HTML varlık kodlu gelir
// (`Mezunlar&#x131;` → `Mezunları`) — `decodeHtmlEntities` şart (G08 §WhatsApp 2).

/** HTML varlık kodlarını çözer: sayısal (dec + hex) + yaygın adlandırılmışlar. */
export function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    "#39": "'",
  };
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
    }
    if (body.startsWith("#")) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
    }
    const lower = body.toLowerCase();
    return Object.prototype.hasOwnProperty.call(named, lower) ? named[lower] : match;
  });
}

/**
 * `og:<property>` meta içeriğini okur. İki attribute sırasını da tanır
 * (property→content ve content→property) — işaretleme platform keyfine göre
 * değişebiliyor (G08 kural 6: kırılganlık).
 */
export function parseOgMeta(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return null;
}

/** `discord.gg/<kod>` veya `discord.com/invite/<kod>` → kod; bulunamazsa null. */
export function extractDiscordInviteCode(url: string): string | null {
  const match = url.match(/discord(?:\.gg|\.com\/invite)\/([A-Za-z0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Okunan adın içinde sahiplik kodunu arar (CQ+4 hane).
 * Yumuşak karşılaştırma: büyük/küçük harf ve çoklu boşluk toleranslı.
 * Tam eşitlik DEĞİL — adın kendisi zaten kayıttan farklı olabilir (G08 kural 3-4).
 */
export function findClaimCode(nameRead: string | null, code: string): boolean {
  if (!nameRead || !code) return false;
  const normalize = (value: string) => value.toUpperCase().replace(/\s+/g, " ").trim();
  return normalize(nameRead).includes(normalize(code));
}

export type InviteReadResult = "ok" | "invalid" | "unknown";

export interface InviteRead {
  result: InviteReadResult;
  /** Okunabilen ad (öneri; kayıtlı adla eşit olmak zorunda DEĞİL). */
  name: string | null;
  /** Telegram'da kod açıklamada da olabilir — aramaya dahil edilir. */
  description: string | null;
  /**
   * Grup görseli (G18: S1 formu ön doldurma, tasarım §3.A adım 4).
   * WhatsApp/Telegram → `og:image`; Discord → guild icon CDN URL'i.
   * Okunamazsa null — form bu adıma asla takılmaz, kullanıcı elle doldurur.
   */
  image: string | null;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const TELEGRAM_GENERIC_TITLE = "join group chat on telegram";

type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}>;

/**
 * Platforma özel okuma. `invalid` = link kesin ölü; `unknown` = okunamadı
 * (ağ/biçim) — ikisi de doğrulamada deneme SAYMAZ (G08 kural 5).
 * Süre aşımı 15 sn → unknown.
 */
export async function readInvitePage(
  url: string,
  platform: string,
  fetchImpl: FetchLike = globalThis.fetch as unknown as FetchLike,
): Promise<InviteRead> {
  const unknown: InviteRead = { result: "unknown", name: null, description: null, image: null };

  if (platform === "discord") {
    const code = extractDiscordInviteCode(url);
    if (!code) return unknown;
    try {
      const response = await fetchImpl(`https://discord.com/api/v10/invites/${code}?with_counts=true`, {
        headers: { "User-Agent": BROWSER_UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 404) return { result: "invalid", name: null, description: null, image: null };
      if (!response.ok) return unknown;
      const payload = (await response.json()) as {
        guild?: { id?: string; name?: string; icon?: string | null } | null;
      };
      const name = payload?.guild?.name ?? null;
      // G18: guild icon → CDN URL (icon yoksa null — form elle doldurmaya düşer).
      const image =
        payload?.guild?.id && payload?.guild?.icon
          ? `https://cdn.discordapp.com/icons/${payload.guild.id}/${payload.guild.icon}.png`
          : null;
      return name
        ? { result: "ok", name, description: null, image }
        : unknown;
    } catch {
      return unknown;
    }
  }

  // WhatsApp + Telegram: HTML og:title (Discord dışında API yok)
  try {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return unknown;
    const html = await response.text();
    const name = parseOgMeta(html, "og:title");
    const description = parseOgMeta(html, "og:description");
    const image = parseOgMeta(html, "og:image"); // G18: ön doldurma görseli

    if (name === null) return unknown; // og hiç yok → biçim değişti (kural 6)

    if (platform === "whatsapp") {
      // Tek ayırt edici işaret: BOŞ og:title (200 her durumda gelir)
      return name.trim() === ""
        ? { result: "invalid", name: null, description, image: null }
        : { result: "ok", name, description, image };
    }

    if (platform === "telegram") {
      if (name.trim() === "" || name.trim().toLowerCase() === TELEGRAM_GENERIC_TITLE) {
        return { result: "invalid", name: null, description, image: null };
      }
      return { result: "ok", name, description, image };
    }

    return unknown; // tanınmayan platform
  } catch {
    return unknown;
  }
}
