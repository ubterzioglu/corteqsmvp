// Komuta Merkezi — PostgREST kolon listesi ve satır → alan eşlemesi.
// Sorgu ve mutasyon modüllerinin ikisi de bu kolon listesini kullanır; liste ile
// `CommandCenterItemRow` birebir aynı kalmalıdır.

import type { CommandCenterItem, CommandCenterItemRow } from './types'

// DİKKAT: burada `: string` ANOTASYONU DENENDİ ve GERİ ALINDI (2026-09-04).
// Amaç `query = query.eq(...)` atamasındaki TS2589'u kırmaktı; select metninin
// literal tipi kalkınca 3 hata gitti ama yerine 5 YENİ hata çıktı (45 → 50):
// insert/update zincirleri ve sayaç sorguları çıkarsanan satır tipine
// güveniyor. Literal tip KALSIN. Kalan 3 TS2589 bilinen ve kabul edilmiş
// durumdur — çalışma zamanını etkilemez, build ve testler yeşildir.
export const COMMAND_CENTER_SELECT =
  'id, item_type, title, detail, category_label, assignee, status, priority, due_date, urgent, legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order, archived_at, deleted_at, created_at, updated_at'

export function mapCommandCenterRow(row: CommandCenterItemRow): CommandCenterItem {
  return {
    id: row.id,
    itemType: row.item_type,
    title: row.title,
    detail: row.detail,
    categoryLabel: row.category_label,
    assignee: row.assignee,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    urgent: row.urgent,
    legacySourceType: row.legacy_source_type,
    legacySourceCode: row.legacy_source_code,
    legacySourceDateLabel: row.legacy_source_date_label,
    legacySourceCategory: row.legacy_source_category,
    legacySourceTitle: row.legacy_source_title,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}
