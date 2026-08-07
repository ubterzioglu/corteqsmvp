// Cadde "Akışın nasıl şekilleniyor?" kartının saf mantığı.
//
// GERÇEK kural DB'dedir: `list_cadde_feed_v1` görünürlük kapısı ve onun beslediği
// `get_cadde_feed_reach_v1` (migration 20260806140000). Buradaki fonksiyonlar yalnız
// o veriyi kartın okuyacağı satırlara çevirir — YENİ KURAL TANIMLAMAZ.
// Ayna sözleşmesi (CLAUDE.md): eşikler/dallar değişirse `cadde-reach.test.ts` düşer.
//
// Eşik VARSAYILANLARI burada tekrar edilmez; `cadde-ranking.ts` tek kaynaktır.

import { CADDE_GLOBAL_THRESHOLD_SETTINGS, type CaddeGlobalThresholdSettings } from "./cadde-ranking";

export type CaddeReachCounts = {
  /** İzleyiciyle aynı şehirde çözülen üye sayısı (kapının 1. dalı). */
  sameCity: number;
  /** Aynı ülkede olup aynı şehirde OLMAYAN üye sayısı (2. dal) — dallar birbirini dışlar. */
  sameCountry: number;
  /** Ne şehri ne ülkesi çözülemeyen üyeler (emniyet supabı, 3. dal). */
  unresolved: number;
  /** sameCity + sameCountry + unresolved. */
  total: number;
  /** Toplam üye sayısı (payda). */
  members: number;
};

export type CaddeFeedReach = {
  signedIn: boolean;
  resolved: boolean;
  /** Cadde kataloğunda çözülen ad; çözülemediyse null. */
  countryName: string | null;
  cityName: string | null;
  /** Profildeki HAM metin — çözülemediğinde kullanıcıya neyin yazılı olduğunu göstermek için. */
  rawCountry: string | null;
  rawCity: string | null;
  reach: CaddeReachCounts;
  thresholds: CaddeGlobalThresholdSettings;
};

export type CaddeReachState = "signed-out" | "unresolved" | "resolved";

export type CaddeReachRow = {
  key: "sameCity" | "sameCountry" | "unresolved";
  label: string;
  count: number;
};

/** Kartın üç hâlinden hangisinin çizileceği. */
export function resolveCaddeReachState(data: CaddeFeedReach | null | undefined): CaddeReachState {
  if (!data || !data.signedIn) return "signed-out";
  return data.resolved ? "resolved" : "unresolved";
}

/** Erişimin üye sayısına oranı (0-100 tam sayı). Payda 0 iken 0, taşma 100'de kırpılır. */
export function caddeReachPercent(reach: CaddeReachCounts): number {
  if (!reach.members || reach.members <= 0) return 0;
  return Math.min(100, Math.round((reach.total / reach.members) * 100));
}

/**
 * Kapının dolu dallarını kapı SIRASINDA verir (şehir → ülke → çözülemeyen).
 * Sıfır olan dal gösterilmez: "0 üye" satırı bilgi vermez, kartı uzatır.
 *
 * Etiketler bilinçli olarak Türkçe EK ALMAZ. "Antalya'daki" / "Berlin'deki" /
 * "Frankfurt'taki" ünlü ve ünsüz uyumuna göre değişir, şehir adı ise veriden gelir —
 * ek üretmek yanlış yazıma yol açardı (CLAUDE.md Türkçe metin kuralları).
 */
export function buildCaddeReachRows(data: CaddeFeedReach): CaddeReachRow[] {
  const rows: CaddeReachRow[] = [];

  if (data.reach.sameCity > 0 && data.cityName) {
    rows.push({ key: "sameCity", label: `Aynı şehir · ${data.cityName}`, count: data.reach.sameCity });
  }
  if (data.reach.sameCountry > 0 && data.countryName) {
    rows.push({ key: "sameCountry", label: `Aynı ülke · ${data.countryName}`, count: data.reach.sameCountry });
  }
  if (data.reach.unresolved > 0) {
    rows.push({ key: "unresolved", label: "Konumu tanımsız üyeler", count: data.reach.unresolved });
  }

  return rows;
}

/** Global akışa çıkma eşiklerinin tek satırlık okunur hâli. */
export function caddeGlobalThresholdText(thresholds?: CaddeGlobalThresholdSettings): string {
  const settings = thresholds ?? CADDE_GLOBAL_THRESHOLD_SETTINGS;
  if (!settings.enabled) return "Global akış şu an kapalı";
  return `${settings.minReactions} reaksiyon · ${settings.minComments} yorum · ${settings.minShares} paylaşım`;
}
