export const TODO_CATEGORIES = [
  'Bot & Otomasyon',
  'Dashboard, Admin & UX',
  'Landing Page & Web',
  'İçerik, SEO & Sosyal Medya',
  'Influencer, Ambassador & Partnerlikler',
  'Topluluk, Referral & Onboarding',
  'Veri, CRM & Analytics',
  'İnsan Kaynakları & Hiring',
  'Teklif, Sözleşme & Compensation',
  'Finans, Legal & Şirketleşme',
  'Strateji, Roadmap & PMO',
  'Dokümantasyon, Drive & Operasyon',
] as const

export const TODO_ASSIGNEES = ['Atanmadi', 'UBT', 'Burak'] as const
export const TODO_STATUSES = [
  'Baslanmadi',
  'Beklemede',
  'Devam ediyor',
  'Tamamlandi',
] as const

export type TodoCategory = (typeof TODO_CATEGORIES)[number]
export type TodoAssignee = (typeof TODO_ASSIGNEES)[number]
export type TodoStatus = (typeof TODO_STATUSES)[number]

export interface TodoItemRow {
  id: string
  konu: TodoCategory
  kim: TodoAssignee
  ne_zaman: string | null
  ayrinti: string | null
  acil: boolean
  durum: TodoStatus
  created_at?: string
  updated_at?: string
}

export interface TodoItem {
  id: string
  konu: TodoCategory
  kim: TodoAssignee
  neZaman: string | null
  ayrinti: string | null
  acil: boolean
  durum: TodoStatus
  createdAt: string | null
  updatedAt: string | null
}

export interface TodoFormState {
  konu: TodoCategory
  kim: TodoAssignee
  neZaman: string
  ayrinti: string
  acil: boolean
  durum: TodoStatus
}

export function createEmptyTodoFormState(): TodoFormState {
  return {
    konu: TODO_CATEGORIES[0],
    kim: 'Atanmadi',
    neZaman: '',
    ayrinti: '',
    acil: false,
    durum: 'Baslanmadi',
  }
}

export function mapTodoRow(row: TodoItemRow): TodoItem {
  return {
    id: row.id,
    konu: row.konu,
    kim: row.kim,
    neZaman: row.ne_zaman,
    ayrinti: row.ayrinti,
    acil: row.acil,
    durum: row.durum,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

export function toTodoFormState(item: TodoItem): TodoFormState {
  return {
    konu: item.konu,
    kim: item.kim,
    neZaman: item.neZaman ?? '',
    ayrinti: item.ayrinti ?? '',
    acil: item.acil,
    durum: item.durum,
  }
}

export function sortTodoItems(items: TodoItem[]): TodoItem[] {
  return [...items].sort((left, right) => {
    const leftCreatedAt = left.createdAt ? Date.parse(left.createdAt) : Number.NEGATIVE_INFINITY
    const rightCreatedAt = right.createdAt ? Date.parse(right.createdAt) : Number.NEGATIVE_INFINITY

    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt - leftCreatedAt
    }

    if (left.updatedAt && right.updatedAt && left.updatedAt !== right.updatedAt) {
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
    }

    if (left.neZaman && right.neZaman && left.neZaman !== right.neZaman) {
      return right.neZaman.localeCompare(left.neZaman)
    }

    const categoryCompare = left.konu.localeCompare(right.konu, 'tr')
    if (categoryCompare !== 0) {
      return categoryCompare
    }

    return (left.ayrinti ?? '').localeCompare(right.ayrinti ?? '', 'tr')
  })
}

export function formatTodoDate(value: string | null): string {
  if (!value) {
    return '-'
  }

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function normalizeTodoAssignee(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR')
}
