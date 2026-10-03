// M12 · Davet rozetleri — eşik VERİDEN (M11 `invites.badge_tiers`), koda
// gömülü sayı YOK. Bu modül saf hesap: liderlik RPC'sinin döndürdüğü tiers
// ile sayıyı rozete çevirir. Ürün kararı (eşik değişimi) SQL update ile olur,
// bu dosya DEĞİŞMEZ (G09/M02 doktrini).
//
// Rozet ETİKETİ eşikten türetilir ("3+ davet") — DB'de uydurma ürün metni
// tutulmaz (M11 kararı); ekip özel isim isterse TEK kaynak burasıdır.

export interface InviteBadge {
  tier: number;
  label: string;
}

/** Sayıya karşılık gelen EN YÜKSEK kazanılmış kademe (yoksa null). */
export function resolveInviteBadge(count: number, tiers: readonly number[]): InviteBadge | null {
  const valid = tiers.filter((tier) => Number.isFinite(tier) && tier > 0).sort((a, b) => a - b);
  let badge: InviteBadge | null = null;
  for (const tier of valid) {
    if (count >= tier) badge = { tier, label: `${tier}+ davet` };
  }
  return badge;
}

/** Bir sonraki rozet için kalan sayı (tüm kademeler kazanıldıysa null). */
export function nextInviteGoal(count: number, tiers: readonly number[]): number | null {
  const valid = tiers.filter((tier) => Number.isFinite(tier) && tier > 0).sort((a, b) => a - b);
  for (const tier of valid) {
    if (count < tier) return tier - count;
  }
  return null;
}
