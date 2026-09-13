// Admin Panel V2 — ürün güncellemeleri: kayıtların ortak tipi.
// Ay dosyaları (2026-XX.ts) ve barrel (../admin-updates.ts) bu tipi paylaşır.

export type AdminUpdateEntry = {
  /** Benzersiz kimlik — okundu takibi bu id ile yapılır. Format: YYYYMMDD-slug. */
  id: string;
  /** Görünen tarih (tr-TR, ör. "11 Haziran 2026"). */
  date: string;
  title: string;
  items: string[];
};
