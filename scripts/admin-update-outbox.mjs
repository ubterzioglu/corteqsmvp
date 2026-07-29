/**
 * admin-updates.ts kayıtlarını notification_email_outbox satırlarına çeviren saf fonksiyonlar.
 *
 * sync-admin-updates.mjs'ten ayrı tutulur: o dosya shebang taşır ve CLI yan etkileri içerir;
 * shebang'li modüller vitest'in rollup ayrıştırıcısında "Expected ident" hatası verir
 * (burak-share-image-filename.mjs ile aynı ayrım).
 */

/** dedupe_key formatı migration ile birebir aynı olmalı (20260729100000). */
export function buildDedupeKey(entryId) {
  return `admin_update:${entryId}`;
}

/**
 * Tek bir ADMIN_UPDATES kaydını outbox satırına çevirir.
 * @param {{id: string, date: string, title: string, items: string[]}} entry
 * @param {boolean} seedOnly true ise kayıt 'skipped' yazılır (mail gitmez).
 */
export function toOutboxRow(entry, seedOnly = false) {
  return {
    event_type: "admin_update",
    dedupe_key: buildDedupeKey(entry.id),
    payload: {
      id: entry.id,
      date: entry.date,
      title: entry.title,
      items: Array.isArray(entry.items) ? entry.items : [],
    },
    status: seedOnly ? "skipped" : "pending",
    last_error: seedOnly ? "seed_backfill" : null,
  };
}

/** Eksik/bozuk kayıtları eler — id ve title olmadan bildirim anlamsızdır. */
export function isValidEntry(entry) {
  return Boolean(
    entry &&
      typeof entry.id === "string" &&
      entry.id.trim() !== "" &&
      typeof entry.title === "string" &&
      entry.title.trim() !== "",
  );
}

/** ADMIN_UPDATES listesini gönderilebilir outbox satırlarına çevirir. */
export function buildOutboxRows(entries, seedOnly = false) {
  return (Array.isArray(entries) ? entries : [])
    .filter(isValidEntry)
    .map((entry) => toOutboxRow(entry, seedOnly));
}
