import { getSupabaseBrowserClient } from './supabase'
import { validateTitle, validateContent, sanitizeError } from '@/lib/security'

export type MeetingSource =
  | 'T1'
  | 'T2'
  | 'T3'
  | 'T4'
  | 'T5'
  | 'T6'
  | 'T7'
  | 'T8'
  | 'T9'
  | 'T10'
  | 'T11'
  | 'WA'
  | 'NO'
  | 'MAN'

export interface MeetingNoteItem {
  id: string
  content: string
  source: MeetingSource
  date: string
  category: string
}

export interface MeetingNoteCategory {
  id: string
  label: string
  color: string
}

export interface MeetingNoteSource {
  key: MeetingSource
  label: string
  date: string
}

export const MEETING_CATEGORIES: MeetingNoteCategory[] = [
  { id: 'rezervasyon-sistemi', label: 'Rezervasyon Sistemi', color: '#EA4335' },
  { id: 'kullanici-kisitlamalari', label: 'Kullanıcı Kısıtlamaları', color: '#34A853' },
  { id: 'audit-kayitlari', label: 'Audit Kayıtları', color: '#4285F4' },
  { id: 'veritabani-tasarimi', label: 'Veritabanı Tasarımı', color: '#FBBC04' },
  { id: 'mvp-hedefleri', label: 'MVP Hedefleri', color: '#A142F4' },
  { id: 'reklam-modeli', label: 'Reklam Modeli', color: '#00897B' },
  { id: 'influencer-partnerlikleri', label: 'Influencer Partnerlikleri', color: '#EC4899' },
  { id: 'topluluk-yonetimi', label: 'Topluluk Yönetimi', color: '#0EA5E9' },
  { id: 'ekip-ve-isbirligi', label: 'Ekip ve İşbirliği', color: '#F97316' },
]

export const MEETING_SOURCES: MeetingNoteSource[] = [
  { key: 'T1', label: 'Toplantı 1', date: '26 Şubat' },
  { key: 'T2', label: 'Toplantı 2', date: '12 Mart' },
  { key: 'T3', label: 'Toplantı 3', date: '9 Nisan' },
  { key: 'T4', label: 'Toplantı 4', date: '17 Nisan' },
  { key: 'T5', label: 'Toplantı 5', date: '20 Nisan - Tahsin Öncesi' },
  { key: 'T6', label: 'Toplantı 6', date: '20 Nisan - Tahsin' },
  { key: 'T7', label: 'Toplantı 7', date: '20 Nisan - Tahsin Sonrası / Cihan' },
  { key: 'T8', label: 'Toplantı 8', date: '24 Nisan - Cihan / Influencer' },
  { key: 'T9', label: 'Toplantı 9', date: '29 Nisan - Strategy & Ops' },
  { key: 'T10', label: 'Toplantı 10', date: '6 Mayıs' },
  { key: 'T11', label: 'Toplantı 11', date: '8 Mayıs' },
  { key: 'WA', label: 'WhatsApp Yazışmaları', date: '13-24 Nisan WA' },
  { key: 'NO', label: 'Notion Kararlar', date: '17 Nisan' },
  { key: 'MAN', label: 'Manuel', date: 'Dashboard' },
]

export const SOURCE_COLORS: Record<MeetingSource, string> = {
  T1: '#4285F4',
  T2: '#34A853',
  T3: '#EA4335',
  T4: '#7E57C2',
  T5: '#0EA5E9',
  T6: '#EC4899',
  T7: '#F97316',
  T8: '#14B8A6',
  T9: '#2563EB',
  T10: '#6366F1',
  T11: '#4F46E5',
  WA: '#FA7B17',
  NO: '#8B5CF6',
  MAN: '#1A73E8',
}

export function getCategoryById(categoryId: string): MeetingNoteCategory | undefined {
  return MEETING_CATEGORIES.find((c) => c.id === categoryId)
}

export function getSourceByKey(key: MeetingSource): MeetingNoteSource | undefined {
  return MEETING_SOURCES.find((s) => s.key === key)
}

interface MeetingNoteRow {
  id: string
  title: string
  content: string
  date: string
  category: string
  source: string
  sort_order: number
}

function mapRow(row: MeetingNoteRow): MeetingNoteItem {
  return {
    id: row.id,
    content: row.content,
    source: row.source as MeetingSource,
    date: row.date,
    category: row.category,
  }
}

function normalizeMeetingNoteText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeMeetingNotes(items: MeetingNoteItem[]): MeetingNoteItem[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const dedupeKey = [
      normalizeMeetingNoteText(item.content),
      normalizeMeetingNoteText(item.date),
    ].join('::')

    if (seen.has(dedupeKey)) {
      return false
    }

    seen.add(dedupeKey)
    return true
  })
}

export async function fetchMeetingNotes(): Promise<MeetingNoteItem[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('meeting_notes')
    .select('id, title, content, date, category, source, sort_order')
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return dedupeMeetingNotes((data as MeetingNoteRow[]).map(mapRow))
}

export interface MeetingNoteFormState {
  content: string
  category: string
  source: MeetingSource
  date: string
}

export function createEmptyMeetingNoteFormState(): MeetingNoteFormState {
  return {
    content: '',
    category: MEETING_CATEGORIES[0].id,
    source: 'MAN',
    date: '',
  }
}

const NOTE_SELECT = 'id, title, content, date, category, source, sort_order'

export async function createMeetingNote(
  note: MeetingNoteFormState
): Promise<MeetingNoteItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const titleErr = validateTitle(note.content.slice(0, 80))
  if (titleErr) return null

  const contentErr = validateContent(note.content)
  if (contentErr) return null

  const { data, error } = await supabase
    .from('meeting_notes')
    .insert({
      title: note.content.slice(0, 80),
      content: note.content,
      date: note.date,
      category: note.category,
      source: note.source,
      sort_order: 9999,
    })
    .select(NOTE_SELECT)
    .single()

  if (error || !data) {
    console.error(sanitizeError(error, 'Not eklenemedi.'))
    return null
  }
  return mapRow(data as MeetingNoteRow)
}

export async function updateMeetingNote(
  id: string,
  updates: Pick<MeetingNoteItem, 'content' | 'category' | 'source' | 'date'>
): Promise<MeetingNoteItem | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const contentErr = validateContent(updates.content)
  if (contentErr) return null

  const { data, error } = await supabase
    .from('meeting_notes')
    .update({
      title: updates.content.slice(0, 80),
      content: updates.content,
      category: updates.category,
      source: updates.source,
      date: updates.date,
    })
    .eq('id', id)
    .select(NOTE_SELECT)
    .single()

  if (error || !data) {
    console.error(sanitizeError(error, 'Not güncellenemedi.'))
    return null
  }
  return mapRow(data as MeetingNoteRow)
}

export async function deleteMeetingNote(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase.from('meeting_notes').delete().eq('id', id)
  return !error
}
