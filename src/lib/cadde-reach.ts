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

/**
 * Global kapı FİİLEN AÇIK mı: etkin VE üç eşik de 0/negatif.
 *
 * 10.08.2026'da canlı `cadde_settings` değerleri 10/5/10 → 0/0/0 yapıldı
 * (docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql). `p.reaction_count >= 0`
 * her satırda doğru olduğu için her paylaşım global katmandan geçiyor; konum filtresi
 * fiilen kalktı, yalnız SIRALAMA bantları kaldı.
 *
 * ⚠️ `CADDE_GLOBAL_THRESHOLD_SETTINGS` (10/5/10) SEED varsayılanıdır ve teste kilitli;
 * canlı değeri yansıtmaz. Bu yüzden burada varsayılan DEĞİL, RPC'den gelen canlı
 * `thresholds` kullanılmalıdır.
 */
export function isCaddeGlobalGateOpen(thresholds?: CaddeGlobalThresholdSettings): boolean {
  const settings = thresholds ?? CADDE_GLOBAL_THRESHOLD_SETTINGS;
  return settings.enabled && settings.minReactions <= 0 && settings.minComments <= 0 && settings.minShares <= 0;
}

/**
 * Kartın göstereceği GERÇEK erişim.
 *
 * RPC (`get_cadde_feed_reach_v1`) yalnız KONUM dallarını sayar — global katmanı
 * saymaz. Eşikler sıfırlanınca bu sayı gerçeği EKSİK gösterir: kart "90 üye" derken
 * paylaşım aslında 158 üyenin hepsine ulaşır. Kapı açıkken payda=pay yapılır ve
 * konum satırları görünürlüğü değil sıralama önceliğini anlatır.
 */
export function caddeEffectiveReach(data: CaddeFeedReach): {
  total: number;
  percent: number;
  gateOpen: boolean;
} {
  if (isCaddeGlobalGateOpen(data.thresholds)) {
    return {
      total: data.reach.members,
      percent: data.reach.members > 0 ? 100 : 0,
      gateOpen: true,
    };
  }
  return { total: data.reach.total, percent: caddeReachPercent(data.reach), gateOpen: false };
}

/** Global akışa çıkma eşiklerinin tek satırlık okunur hâli. */
export function caddeGlobalThresholdText(thresholds?: CaddeGlobalThresholdSettings): string {
  const settings = thresholds ?? CADDE_GLOBAL_THRESHOLD_SETTINGS;
  if (!settings.enabled) return "Global akış şu an kapalı";
  // Sıfır eşikler "0 reaksiyon · 0 yorum · 0 paylaşım" diye yazılırsa saçmalar.
  if (isCaddeGlobalGateOpen(settings)) return "Eşik yok — her paylaşım global akışa çıkıyor";
  return `${settings.minReactions} reaksiyon · ${settings.minComments} yorum · ${settings.minShares} paylaşım`;
}
