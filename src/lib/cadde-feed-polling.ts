/**
 * Cadde "yeni post" chip'i için adaptif polling aralığı (spec §17.3: stream yok).
 * Tasarım: docs/superpowers/specs/2026-07-31-cadde-feed-polling-design.md
 *
 * - Chip görünürken (count > 0) polling durur; chip'e tıklanınca queryKey değişir
 *   ve döngü sıfırdan başlar.
 * - Ard arda 0 sonuç geldikçe aralık kademeli uzar: 60 sn → 2 dk → 5 dk (tavan).
 * - Pencere odağa dönünce streak sıfırlanır ve taban aralığa geri dönülür.
 */

export const CADDE_NEW_POST_POLL_BASE_MS = 60_000;
export const CADDE_NEW_POST_POLL_MID_MS = 120_000;
export const CADDE_NEW_POST_POLL_MAX_MS = 300_000;

const MID_AFTER_ZERO_STREAK = 3;
const MAX_AFTER_ZERO_STREAK = 6;

/** React Query `refetchInterval` için: ms döner, `false` = polling durur. */
export function caddeNewPostPollInterval(newPostCount: number, zeroStreak: number): number | false {
  if (newPostCount > 0) return false;
  if (zeroStreak >= MAX_AFTER_ZERO_STREAK) return CADDE_NEW_POST_POLL_MAX_MS;
  if (zeroStreak >= MID_AFTER_ZERO_STREAK) return CADDE_NEW_POST_POLL_MID_MS;
  return CADDE_NEW_POST_POLL_BASE_MS;
}

/** Her sayım sonucundan sonra streak'in yeni değeri. */
export function nextCaddeZeroStreak(newPostCount: number, previousStreak: number): number {
  return newPostCount > 0 ? 0 : previousStreak + 1;
}
